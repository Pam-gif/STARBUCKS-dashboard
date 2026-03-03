// Chart Defaults
Chart.defaults.color = '#a0a0a0';
Chart.defaults.font.family = "'Inter', sans-serif";
const SB_GREEN = '#006241';
const SB_GOLD = '#cba258';
const ACCENTS = ['#006241', '#00704A', '#27251F', '#cba258', '#d4e9e2'];

const DATA_PATHS = {
    sales: 'data/sales.csv',
    marketing: 'data/marketing.csv',
    customers: 'data/customers.csv'
};

let dashboardData = {
    sales: [],
    marketing: [],
    customers: []
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadAllData();
        updateMetrics();
        initRevenueChart();
        initProfitChart();
        initLoyaltyChart();
        initMarketingChart();
        initAOVChart();
        initTrafficChart(); // Now "Sales Trend" based on real dates
    } catch (error) {
        console.error("Error initializing dashboard:", error);
    }
});

async function loadAllData() {
    const loadCSV = (path) => {
        return new Promise((resolve, reject) => {
            Papa.parse(path, {
                download: true,
                header: true,
                dynamicTyping: true,
                complete: (results) => resolve(results.data.filter(row => Object.keys(row).length > 1)),
                error: (err) => reject(err)
            });
        });
    };

    dashboardData.sales = await loadCSV(DATA_PATHS.sales);
    dashboardData.marketing = await loadCSV(DATA_PATHS.marketing);
    dashboardData.customers = await loadCSV(DATA_PATHS.customers);
}

function updateMetrics() {
    // Total Revenue
    const totalRevenue = dashboardData.sales.reduce((sum, row) => sum + (row.Revenue || 0), 0);
    document.querySelector('.metric-card:nth-child(1) .metric-value').textContent = `$${(totalRevenue / 1000000).toFixed(1)}M`;

    // Active Rewards Members (Unique Customers where Loyalty_Member = Yes)
    const rewardsMembers = new Set(dashboardData.sales.filter(r => r.Loyalty_Member === 'Yes').map(r => r.Customer_ID)).size;
    document.querySelector('.metric-card:nth-child(2) .metric-value').textContent = `${(rewardsMembers / 1000000).toFixed(1)}M`;

    // AOV
    const aov = totalRevenue / dashboardData.sales.length;
    document.querySelector('.metric-card:nth-child(3) .metric-value').textContent = `$${aov.toFixed(2)}`;
}

function initRevenueChart() {
    const ctx = document.getElementById('revenueByRegionChart').getContext('2d');
    const regionData = {};
    dashboardData.sales.forEach(row => {
        if (!regionData[row.Region]) regionData[row.Region] = 0;
        regionData[row.Region] += row.Revenue || 0;
    });

    const labels = Object.keys(regionData);
    const data = labels.map(l => (regionData[l] / 1000000).toFixed(1));

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue (Millions $)',
                data: data,
                backgroundColor: SB_GREEN,
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, border: { display: false } },
                y: { grid: { display: false }, border: { display: false } }
            }
        }
    });
}

function initProfitChart() {
    const ctx = document.getElementById('profitMarginChart').getContext('2d');
    const categoryData = {};
    dashboardData.sales.forEach(row => {
        if (!categoryData[row.Product_Category]) categoryData[row.Product_Category] = { rev: 0, cogs: 0 };
        categoryData[row.Product_Category].rev += row.Revenue || 0;
        categoryData[row.Product_Category].cogs += row.COGS || 0;
    });

    const labels = Object.keys(categoryData);
    const data = labels.map(l => {
        const d = categoryData[l];
        return ((d.rev - d.cogs) / d.rev * 100).toFixed(1);
    });

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Margin %',
                data: data,
                backgroundColor: 'rgba(0, 98, 65, 0.2)',
                borderColor: SB_GREEN,
                pointBackgroundColor: SB_GREEN,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: { color: '#a0a0a0' },
                    ticks: { display: false }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function initLoyaltyChart() {
    const ctx = document.getElementById('loyaltySpendingChart').getContext('2d');
    let loyaltyRev = 0, nonLoyaltyRev = 0;
    dashboardData.sales.forEach(row => {
        if (row.Loyalty_Member === 'Yes') loyaltyRev += row.Revenue || 0;
        else nonLoyaltyRev += row.Revenue || 0;
    });

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Rewards Members', 'Non-Members'],
            datasets: [{
                data: [loyaltyRev, nonLoyaltyRev],
                backgroundColor: [SB_GREEN, 'rgba(255, 255, 255, 0.1)'],
                borderColor: 'transparent',
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 20, usePointStyle: true }
                }
            }
        }
    });
}

function initMarketingChart() {
    const ctx = document.getElementById('marketingGrowthChart').getContext('2d');

    // Group marketing by Year-Month for trend
    const trend = {};
    dashboardData.marketing.forEach(row => {
        const key = `${row.Year}-${row.Month}`;
        if (!trend[key]) trend[key] = { spend: 0, customers: 0 };
        trend[key].spend += row.Marketing_Spend || 0;
        trend[key].customers += row.New_Customers || 0;
    });

    // Last 12 points for trend
    const keys = Object.keys(trend).sort().slice(-12);
    const spendData = keys.map(k => (trend[k].spend / 1000000).toFixed(1));
    const growthData = keys.map(k => trend[k].customers);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: keys.map(k => k.split('-')[1]), // Just month label
            datasets: [
                {
                    label: 'Spend ($M)',
                    data: spendData,
                    borderColor: SB_GOLD,
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 0
                },
                {
                    label: 'New Customers',
                    data: growthData,
                    borderColor: SB_GREEN,
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 0,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', align: 'end' }
            },
            scales: {
                x: { grid: { display: false }, border: { display: false } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, border: { display: false } },
                y1: { position: 'right', display: false }
            }
        }
    });
}

function initAOVChart() {
    const ctx = document.getElementById('aovSegmentChart').getContext('2d');
    const segmentMap = {
        '18-24': 'Gen Z',
        '25-34': 'Millennials',
        '35-44': 'Gen X',
        '45+': 'Boomers'
    };

    const segmentData = {};
    dashboardData.sales.forEach(row => {
        const segment = segmentMap[row.Age_Group] || 'Other';
        if (!segmentData[segment]) segmentData[segment] = { rev: 0, count: 0 };
        segmentData[segment].rev += row.Revenue || 0;
        segmentData[segment].count += 1;
    });

    const labels = Object.keys(segmentData).sort();
    const data = labels.map(l => (segmentData[l].rev / segmentData[l].count).toFixed(2));

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Avg Spend',
                data: data,
                backgroundColor: ACCENTS,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, border: { display: false } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, border: { display: false } }
            }
        }
    });
}

function initTrafficChart() {
    const ctx = document.getElementById('storeTrafficChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 98, 65, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 98, 65, 0)');

    // Daily Sales Volatility (since we don't have hourly data, we'll use day of month for a month)
    const traffic = Array(31).fill(0);
    dashboardData.sales.forEach(row => {
        if (row.Month === 'Dec' && row.Year === 2025) { // Sample a single month
            const day = new Date(row.Date).getDate();
            if (day <= 31) traffic[day - 1]++;
        }
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 31 }, (_, i) => i + 1),
            datasets: [{
                label: 'Monthly Volume Trend',
                data: traffic,
                fill: true,
                backgroundColor: gradient,
                borderColor: SB_GREEN,
                tension: 0.4,
                pointRadius: 2,
                pointBackgroundColor: SB_GREEN
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, border: { display: false } },
                y: { display: false }
            }
        }
    });
}
