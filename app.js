/* ═══════════════════════════════════════════════════════════
   STARBUCKS ANALYTICS DASHBOARD — APP LOGIC
   Synthetic data, KPI computation, Chart.js charts
   ═══════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  // ─── Constants ───
  const REGIONS = [
    'North America', 'Europe', 'China', 'Japan',
    'Latin America', 'Middle East', 'Southeast Asia',
    'South Korea', 'Australia', 'India', 'Africa'
  ];

  const CATEGORIES = [
    'Espresso Beverages', 'Frappuccino', 'Teavana Tea',
    'Cold Brew', 'Food & Bakery', 'Merchandise'
  ];

  const SEGMENTS = ['New Customers', 'Casual', 'Regular', 'Loyal Members', 'Gold Members'];

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const CHART_COLORS = [
    '#00704A', '#1E9E6E', '#CBA258', '#3B82F6', '#A78BFA',
    '#F472B6', '#FB923C', '#34D399', '#2DD4BF', '#60A5FA', '#E879F9'
  ];

  // ─── Currency Config ───
  const CURRENCY_RATES = {
    USD: 1,
    PHP: 56.20,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.50,
    CNY: 7.24,
    KRW: 1330,
    AUD: 1.54
  };

  const CURRENCY_SYMBOLS = {
    USD: '$', PHP: '₱', EUR: '€', GBP: '£',
    JPY: '¥', CNY: '¥', KRW: '₩', AUD: 'A$'
  };

  let activeCurrency = 'PHP';

  // ─── Utility Functions ───
  const rand = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick = arr => arr[randInt(0, arr.length - 1)];

  const fmtCurrency = (n) => {
    const rate = CURRENCY_RATES[activeCurrency] || 1;
    const sym = CURRENCY_SYMBOLS[activeCurrency] || '$';
    const converted = n * rate;
    if (converted >= 1e12) return sym + (converted / 1e12).toFixed(2) + 'T';
    if (converted >= 1e9) return sym + (converted / 1e9).toFixed(2) + 'B';
    if (converted >= 1e6) return sym + (converted / 1e6).toFixed(1) + 'M';
    if (converted >= 1e3) return sym + (converted / 1e3).toFixed(1) + 'K';
    return sym + converted.toFixed(2);
  };

  // Format a small currency value (e.g. AOV) with full decimal precision
  const fmtCurrencySmall = (n) => {
    const rate = CURRENCY_RATES[activeCurrency] || 1;
    const sym = CURRENCY_SYMBOLS[activeCurrency] || '$';
    return sym + (n * rate).toFixed(2);
  };

  const fmtPct = (n) => n.toFixed(1) + '%';
  const fmtNum = (n) => {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString();
  };

  // ─── Synthetic Data Generation ───
  function generateData() {
    const data = {
      monthly: [],
      regions: {},
      categories: {},
      loyalty: { members: {}, nonMembers: {} },
      marketing: [],
      segments: {},
      dailyTraffic: []
    };

    // Regional revenue with realistic distribution
    const regionWeights = {
      'North America': 0.34, 'China': 0.17, 'Japan': 0.10,
      'Europe': 0.09, 'South Korea': 0.07, 'Southeast Asia': 0.06,
      'Latin America': 0.05, 'Middle East': 0.04, 'Australia': 0.03, 'India': 0.03,
      'Africa': 0.02
    };

    const totalAnnualRevenue = rand(28, 36) * 1e9; // $28B–$36B

    REGIONS.forEach(region => {
      const weight = regionWeights[region] || 0.05;
      const revenue = totalAnnualRevenue * weight * rand(0.9, 1.1);
      const cogs = revenue * rand(0.55, 0.72);
      const customers = Math.floor(revenue / rand(120, 280));
      const returningCustomers = Math.floor(customers * rand(0.38, 0.72));
      const orders = Math.floor(customers * rand(3, 8));

      data.regions[region] = {
        revenue, cogs, customers, returningCustomers, orders,
        storeCount: randInt(200, 6000),
        monthlyRevenue: MONTHS.map((_, i) => revenue / 12 * rand(0.8, 1.25) * (1 + 0.015 * i))
      };
    });

    // Category profit margins
    const categoryMargins = {
      'Espresso Beverages': rand(72, 82),
      'Frappuccino': rand(68, 78),
      'Teavana Tea': rand(75, 85),
      'Cold Brew': rand(70, 80),
      'Food & Bakery': rand(45, 58),
      'Merchandise': rand(50, 65)
    };

    CATEGORIES.forEach(cat => {
      const catRevShare = rand(0.08, 0.28);
      const catRevenue = totalAnnualRevenue * catRevShare;
      data.categories[cat] = {
        revenue: catRevenue,
        margin: categoryMargins[cat],
        cogs: catRevenue * (1 - categoryMargins[cat] / 100)
      };
    });

    // Loyalty vs Non-Loyalty
    CATEGORIES.forEach(cat => {
      const memberAOV = rand(6.5, 12.5);
      const nonMemberAOV = memberAOV * rand(0.6, 0.82);
      data.loyalty.members[cat] = memberAOV;
      data.loyalty.nonMembers[cat] = nonMemberAOV;
    });

    // Marketing spend vs customer growth (monthly)
    let cumulativeCustomers = randInt(50000, 80000);
    for (let i = 0; i < 12; i++) {
      const spend = rand(180, 420) * 1e6;
      const newCustomers = Math.floor(spend / rand(35, 75));
      cumulativeCustomers += newCustomers;
      data.marketing.push({
        month: MONTHS[i],
        spend,
        newCustomers,
        totalCustomers: cumulativeCustomers
      });
    }

    // AOV by customer segment
    const segmentAOVs = {
      'New Customers': rand(4.2, 5.8),
      'Casual': rand(5.0, 6.5),
      'Regular': rand(6.5, 8.5),
      'Loyal Members': rand(8.0, 11.5),
      'Gold Members': rand(10.5, 14.8)
    };

    SEGMENTS.forEach(seg => {
      const orderCount = randInt(5000, 80000);
      data.segments[seg] = {
        aov: segmentAOVs[seg],
        orders: orderCount,
        revenue: segmentAOVs[seg] * orderCount,
        share: rand(8, 35)
      };
    });

    // Normalize segment shares to 100%
    const totalShare = Object.values(data.segments).reduce((s, d) => s + d.share, 0);
    Object.values(data.segments).forEach(d => d.share = (d.share / totalShare) * 100);

    // Daily traffic (last 30 days)
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseTx = isWeekend ? rand(380, 520) : rand(450, 650);
      data.dailyTraffic.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        transactions: Math.floor(baseTx),
        fullDate: date
      });
    }

    // Monthly aggregates
    for (let i = 0; i < 12; i++) {
      let mRevenue = 0, mCogs = 0, mCustomers = 0, mReturning = 0, mOrders = 0;
      Object.values(data.regions).forEach(r => {
        mRevenue += r.monthlyRevenue[i];
        mCogs += (r.cogs / 12) * rand(0.9, 1.1);
        mCustomers += Math.floor(r.customers / 12 * rand(0.85, 1.15));
        mReturning += Math.floor(r.returningCustomers / 12 * rand(0.85, 1.15));
        mOrders += Math.floor(r.orders / 12 * rand(0.85, 1.15));
      });
      data.monthly.push({ month: MONTHS[i], revenue: mRevenue, cogs: mCogs, customers: mCustomers, returning: mReturning, orders: mOrders });
    }

    return data;
  }

  // ─── KPI Computation ───
  function computeKPIs(data, regionFilter, periodMonths) {
    const months = data.monthly.slice(-periodMonths);
    const prevMonths = data.monthly.slice(-(periodMonths * 2), -periodMonths);

    let totalRevenue = 0, totalCogs = 0, totalCustomers = 0;
    let totalReturning = 0, totalOrders = 0;

    if (regionFilter === 'all') {
      months.forEach(m => {
        totalRevenue += m.revenue;
        totalCogs += m.cogs;
        totalCustomers += m.customers;
        totalReturning += m.returning;
        totalOrders += m.orders;
      });
    } else {
      const r = data.regions[regionFilter];
      if (r) {
        const monthIndices = Array.from({ length: periodMonths }, (_, i) => 12 - periodMonths + i);
        monthIndices.forEach(i => {
          totalRevenue += r.monthlyRevenue[i] || 0;
        });
        totalCogs = r.cogs * (periodMonths / 12);
        totalCustomers = Math.floor(r.customers * (periodMonths / 12));
        totalReturning = Math.floor(r.returningCustomers * (periodMonths / 12));
        totalOrders = Math.floor(r.orders * (periodMonths / 12));
      }
    }

    // Previous period for deltas
    let prevRevenue = 0, prevCogs = 0, prevCustomers = 0, prevReturning = 0, prevOrders = 0;
    if (prevMonths.length > 0) {
      prevMonths.forEach(m => {
        prevRevenue += m.revenue;
        prevCogs += m.cogs;
        prevCustomers += m.customers;
        prevReturning += m.returning;
        prevOrders += m.orders;
      });
    } else {
      prevRevenue = totalRevenue * rand(0.88, 0.97);
      prevCogs = totalCogs * rand(0.9, 1.0);
      prevCustomers = totalCustomers * rand(0.85, 0.95);
      prevReturning = totalReturning * rand(0.82, 0.94);
      prevOrders = totalOrders * rand(0.88, 0.96);
    }

    const gpm = totalRevenue > 0 ? ((totalRevenue - totalCogs) / totalRevenue) * 100 : 0;
    const prevGpm = prevRevenue > 0 ? ((prevRevenue - prevCogs) / prevRevenue) * 100 : 0;
    const retention = totalCustomers > 0 ? (totalReturning / totalCustomers) * 100 : 0;
    const prevRetention = prevCustomers > 0 ? (prevReturning / prevCustomers) * 100 : 0;

    const totalMarketingSpend = data.marketing.slice(-periodMonths).reduce((s, m) => s + m.spend, 0);
    const newCust = data.marketing.slice(-periodMonths).reduce((s, m) => s + m.newCustomers, 0);
    const cac = newCust > 0 ? totalMarketingSpend / newCust : 0;

    const prevMarketingSpend = data.marketing.slice(-(periodMonths * 2), -periodMonths).reduce((s, m) => s + m.spend, 0) || totalMarketingSpend * 1.05;
    const prevNewCust = data.marketing.slice(-(periodMonths * 2), -periodMonths).reduce((s, m) => s + m.newCustomers, 0) || newCust * 0.9;
    const prevCac = prevNewCust > 0 ? prevMarketingSpend / prevNewCust : cac * 1.1;

    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const prevAov = prevOrders > 0 ? prevRevenue / prevOrders : aov * 0.95;

    const avgDailyTx = data.dailyTraffic.reduce((s, d) => s + d.transactions, 0) / data.dailyTraffic.length;
    const prevDailyTx = avgDailyTx * rand(0.9, 0.98);

    return {
      revenue: { value: totalRevenue, prev: prevRevenue },
      gpm: { value: gpm, prev: prevGpm },
      retention: { value: retention, prev: prevRetention },
      cac: { value: cac, prev: prevCac },
      aov: { value: aov, prev: prevAov },
      traffic: { value: avgDailyTx, prev: prevDailyTx },
      monthlyRevenue: months.map(m => m.revenue),
      monthlyGPM: months.map(m => m.revenue > 0 ? ((m.revenue - m.cogs) / m.revenue) * 100 : 0),
      monthlyRetention: months.map(m => m.customers > 0 ? (m.returning / m.customers) * 100 : 0),
      monthlyCac: data.marketing.slice(-periodMonths).map(m => m.newCustomers > 0 ? m.spend / m.newCustomers : 0),
      monthlyAOV: months.map(m => m.orders > 0 ? m.revenue / m.orders : 0),
      monthlyTraffic: data.dailyTraffic.slice(-Math.min(30, periodMonths * 2.5)).map(d => d.transactions)
    };
  }

  // ─── CSV Export Utilities ───
  function downloadCSV(filename, headers, rows) {
    const escape = (val) => {
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? '"' + str.replace(/"/g, '""') + '"'
        : str;
    };
    const csv = [headers.map(escape).join(',')]
      .concat(rows.map(row => row.map(escape).join(',')))
      .join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getCSVDataForTile(tileId, data) {
    const sym = CURRENCY_SYMBOLS[activeCurrency] || '$';
    const cur = (v) => Number(v * (CURRENCY_RATES[activeCurrency] || 1)).toFixed(2);

    switch (tileId) {
      case 'tile-region': {
        const regions = Object.entries(data.regions).sort((a, b) => b[1].revenue - a[1].revenue);
        const totalRev = regions.reduce((s, [, d]) => s + d.revenue, 0);
        return {
          filename: 'revenue_by_region.csv',
          headers: ['Region', `Revenue (${activeCurrency})`, '% Share', `COGS (${activeCurrency})`, 'Gross Margin %', 'Customers', 'Orders', 'Stores'],
          rows: regions.map(([r, d]) => [
            r, cur(d.revenue), (d.revenue / totalRev * 100).toFixed(1),
            cur(d.cogs), ((d.revenue - d.cogs) / d.revenue * 100).toFixed(1),
            d.customers, d.orders, d.storeCount
          ])
        };
      }
      case 'tile-category': {
        const cats = Object.entries(data.categories).sort((a, b) => b[1].margin - a[1].margin);
        return {
          filename: 'profit_margin_by_category.csv',
          headers: ['Category', `Revenue (${activeCurrency})`, `COGS Est. (${activeCurrency})`, `Gross Profit (${activeCurrency})`, 'Gross Margin %'],
          rows: cats.map(([c, d]) => {
            const cogs = d.revenue * (1 - d.margin / 100);
            return [c, cur(d.revenue), cur(cogs), cur(d.revenue - cogs), d.margin.toFixed(1)];
          })
        };
      }
      case 'tile-loyalty': {
        return {
          filename: 'loyalty_vs_nonloyalty.csv',
          headers: ['Category', `Member AOV (${activeCurrency})`, `Non-Member AOV (${activeCurrency})`, 'Uplift %'],
          rows: CATEGORIES.map(c => {
            const m = data.loyalty.members[c];
            const nm = data.loyalty.nonMembers[c];
            return [c, cur(m), cur(nm), ((m - nm) / nm * 100).toFixed(1)];
          })
        };
      }
      case 'tile-marketing': {
        return {
          filename: 'marketing_performance.csv',
          headers: ['Month', `Spend (${activeCurrency})`, 'New Customers', `CAC (${activeCurrency})`, 'Total Customers'],
          rows: data.marketing.map(m => [
            m.month, cur(m.spend), m.newCustomers,
            m.newCustomers > 0 ? cur(m.spend / m.newCustomers) : '0',
            m.totalCustomers
          ])
        };
      }
      case 'tile-aov': {
        const segs = Object.entries(data.segments).sort((a, b) => b[1].aov - a[1].aov);
        return {
          filename: 'aov_by_segment.csv',
          headers: ['Segment', `AOV (${activeCurrency})`, 'Orders', `Revenue (${activeCurrency})`, 'Revenue Share %'],
          rows: segs.map(([s, d]) => [s, cur(d.aov), d.orders, cur(d.revenue), d.share.toFixed(1)])
        };
      }
      case 'tile-traffic': {
        return {
          filename: 'daily_store_traffic.csv',
          headers: ['Date', 'Transactions'],
          rows: data.dailyTraffic.map(d => [d.date, d.transactions])
        };
      }
      case 'tile-insights': {
        const kpis = computeKPIs(data, 'all', 12);
        return {
          filename: 'kpi_summary.csv',
          headers: ['KPI', 'Current Value', 'Previous Value', 'Change %'],
          rows: [
            ['Revenue', cur(kpis.revenue.value), cur(kpis.revenue.prev), kpis.revenue.prev ? ((kpis.revenue.value - kpis.revenue.prev) / kpis.revenue.prev * 100).toFixed(1) : '0'],
            ['Gross Profit Margin', kpis.gpm.value.toFixed(1) + '%', kpis.gpm.prev.toFixed(1) + '%', kpis.gpm.prev ? ((kpis.gpm.value - kpis.gpm.prev) / kpis.gpm.prev * 100).toFixed(1) : '0'],
            ['Customer Retention', kpis.retention.value.toFixed(1) + '%', kpis.retention.prev.toFixed(1) + '%', kpis.retention.prev ? ((kpis.retention.value - kpis.retention.prev) / kpis.retention.prev * 100).toFixed(1) : '0'],
            ['CAC', cur(kpis.cac.value), cur(kpis.cac.prev), kpis.cac.prev ? ((kpis.cac.value - kpis.cac.prev) / kpis.cac.prev * 100).toFixed(1) : '0'],
            ['AOV', cur(kpis.aov.value), cur(kpis.aov.prev), kpis.aov.prev ? ((kpis.aov.value - kpis.aov.prev) / kpis.aov.prev * 100).toFixed(1) : '0'],
            ['Daily Traffic', Math.round(kpis.traffic.value), Math.round(kpis.traffic.prev), kpis.traffic.prev ? ((kpis.traffic.value - kpis.traffic.prev) / kpis.traffic.prev * 100).toFixed(1) : '0']
          ]
        };
      }
      default:
        return null;
    }
  }

  function injectCSVButtons(data) {
    const downloadIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
    const tileIds = ['tile-region', 'tile-category', 'tile-loyalty', 'tile-marketing', 'tile-aov', 'tile-traffic', 'tile-insights'];

    tileIds.forEach(tileId => {
      const tile = document.getElementById(tileId);
      if (!tile) return;
      const header = tile.querySelector('.chart-tile__header');
      if (!header || header.querySelector('.csv-download-btn')) return;

      const btn = document.createElement('button');
      btn.className = 'csv-download-btn';
      btn.setAttribute('aria-label', 'Export as CSV');
      btn.innerHTML = downloadIcon;
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't trigger modal click
        const csvData = getCSVDataForTile(tileId, data);
        if (csvData) {
          downloadCSV(csvData.filename, csvData.headers, csvData.rows);
        }
      });
      header.appendChild(btn);
    });
  }

  // ─── Animated Number Counter ───
  function animateValue(el, endValue, formatter, duration = 1200, delay = 0) {
    const startTime = performance.now() + delay;
    const startValue = 0;

    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function update(now) {
      if (now < startTime) {
        el.textContent = formatter(0);
        requestAnimationFrame(update);
        return;
      }
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      el.textContent = formatter(currentValue);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  // ─── Render KPI Cards ───
  function renderKPIs(kpis) {
    const cards = [
      { id: 'revenue', fmt: fmtCurrency, invert: false, label: 'Prior' },
      { id: 'gpm', fmt: fmtPct, invert: false, label: 'Prior' },
      { id: 'retention', fmt: fmtPct, invert: false, label: 'Prior' },
      { id: 'cac', fmt: fmtCurrency, invert: true, label: 'Prior' }, // lower is better
      { id: 'aov', fmt: fmtCurrency, invert: false, label: 'Prior' },
      { id: 'traffic', fmt: (n) => Math.round(n).toLocaleString(), invert: false, label: 'Prior' }
    ];

    cards.forEach((card, index) => {
      const kpi = kpis[card.id];
      const cardEl = document.getElementById(`kpi-${card.id}`);
      const valueEl = document.getElementById(`kpi-${card.id}-value`);
      const deltaEl = document.getElementById(`kpi-${card.id}-delta`);

      // Animate the value counting up with staggered delay
      animateValue(valueEl, kpi.value, card.fmt, 1400, index * 120);

      const change = kpi.prev !== 0 ? ((kpi.value - kpi.prev) / Math.abs(kpi.prev)) * 100 : 0;
      const isPositive = card.invert ? change < 0 : change > 0;
      const arrow = change >= 0 ? '▲' : '▼';

      // Apply performance color coding
      cardEl.classList.remove('kpi-card--positive', 'kpi-card--negative');
      cardEl.classList.add(isPositive ? 'kpi-card--positive' : 'kpi-card--negative');

      // Add or update prior-period target line
      let targetEl = cardEl.querySelector('.kpi-card__target');
      if (!targetEl) {
        targetEl = document.createElement('span');
        targetEl.className = 'kpi-card__target';
        const bodyEl = cardEl.querySelector('.kpi-card__body');
        bodyEl.appendChild(targetEl);
      }

      // Fade in delta and target after counter finishes
      deltaEl.style.opacity = '0';
      targetEl.style.opacity = '0';
      deltaEl.style.transition = 'opacity .4s ease';
      targetEl.style.transition = 'opacity .4s ease';
      setTimeout(() => {
        deltaEl.textContent = `${arrow} ${Math.abs(change).toFixed(1)}% vs prior`;
        deltaEl.className = `kpi-card__delta ${isPositive ? 'positive' : 'negative'}`;
        deltaEl.style.opacity = '1';
        targetEl.innerHTML = `${card.label}: <strong>${card.fmt(kpi.prev)}</strong>`;
        targetEl.style.opacity = '1';
      }, 1400 + index * 120);
    });

    // Sparklines
    renderSparklines(kpis);
  }

  // ─── Sparklines ───
  function renderSparklines(kpis) {
    const sparkData = {
      'spark-revenue': kpis.monthlyRevenue,
      'spark-gpm': kpis.monthlyGPM,
      'spark-retention': kpis.monthlyRetention,
      'spark-cac': kpis.monthlyCac,
      'spark-aov': kpis.monthlyAOV,
      'spark-traffic': kpis.monthlyTraffic
    };

    Object.entries(sparkData).forEach(([canvasId, values]) => {
      const canvas = document.getElementById(canvasId);
      if (!canvas || !values || values.length === 0) return;

      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;

      ctx.beginPath();
      ctx.strokeStyle = '#00704A';
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';

      values.forEach((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 4) - 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Gradient fill
      const lastX = w;
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, 'rgba(0,112,74,.25)');
      gradient.addColorStop(1, 'rgba(0,112,74,.0)');

      ctx.lineTo(lastX, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    });
  }

  // ─── Chart Instances (for destroy/rebuild) ───
  const charts = {};

  function destroyChart(key) {
    if (charts[key]) { charts[key].destroy(); delete charts[key]; }
  }

  // ─── Shared Chart.js defaults ───
  Chart.defaults.color = '#8B9DAF';
  Chart.defaults.borderColor = 'rgba(255,255,255,.06)';
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
  Chart.defaults.animation.duration = 900;
  Chart.defaults.animation.easing = 'easeOutQuart';
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.pointStyleWidth = 10;
  Chart.defaults.plugins.legend.labels.padding = 16;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(11,18,21,.92)';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(0,112,74,.3)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.titleFont = { weight: '600' };

  // ─── 1. Revenue by Region / Monthly Revenue Trend ───
  function renderRegionChart(data, regionFilter) {
    destroyChart('region');
    const ctx = document.getElementById('chart-region');
    const headerEl = document.querySelector('#tile-region .chart-tile__header h2');
    const badgeEl = document.querySelector('#tile-region .chart-tile__badge');

    if (regionFilter !== 'all') {
      // Show Monthly Revenue Trend for the selected region
      const regionData = data.regions[regionFilter];
      headerEl.textContent = `Monthly Revenue — ${regionFilter}`;
      badgeEl.textContent = 'Monthly breakdown';

      charts.region = new Chart(ctx, {
        type: 'line',
        data: {
          labels: MONTHS,
          datasets: [{
            label: 'Monthly Revenue',
            data: regionData.monthlyRevenue,
            borderColor: '#00704A',
            backgroundColor: (context) => {
              const chart = context.chart;
              const { ctx: c, chartArea } = chart;
              if (!chartArea) return 'rgba(0,112,74,.1)';
              const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              gradient.addColorStop(0, 'rgba(0,112,74,.3)');
              gradient.addColorStop(1, 'rgba(0,112,74,.02)');
              return gradient;
            },
            fill: true,
            tension: .4,
            pointRadius: 5,
            pointBackgroundColor: '#00704A',
            pointBorderColor: '#0B1215',
            pointBorderWidth: 2,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) => `Revenue: ${fmtCurrency(c.raw)}`
              }
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: false,
              ticks: { callback: (v) => fmtCurrency(v) }
            }
          }
        }
      });
    } else {
      // Show Revenue by Region bar chart
      headerEl.textContent = 'Revenue by Region';
      badgeEl.textContent = 'Q: Which regions drive revenue?';

      const regions = Object.entries(data.regions)
        .sort((a, b) => b[1].revenue - a[1].revenue);

      charts.region = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: regions.map(([r]) => r),
          datasets: [{
            label: 'Revenue',
            data: regions.map(([, d]) => d.revenue),
            backgroundColor: regions.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + 'CC'),
            borderColor: regions.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) => `Revenue: ${fmtCurrency(c.raw)}`
              }
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              ticks: { callback: (v) => fmtCurrency(v) }
            }
          }
        }
      });
    }
  }

  // ─── 2. Profit Margin by Category ───
  function renderCategoryChart(data) {
    destroyChart('category');
    const ctx = document.getElementById('chart-category');
    const sorted = Object.entries(data.categories)
      .sort((a, b) => b[1].margin - a[1].margin);

    charts.category = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(([c]) => c),
        datasets: [{
          label: 'Gross Margin %',
          data: sorted.map(([, d]) => d.margin),
          backgroundColor: sorted.map((_, i) => {
            const colors = ['#00704A', '#1E9E6E', '#34D399', '#3B82F6', '#CBA258', '#A78BFA'];
            return colors[i] + 'CC';
          }),
          borderColor: ['#00704A', '#1E9E6E', '#34D399', '#3B82F6', '#CBA258', '#A78BFA'],
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => `Margin: ${c.raw.toFixed(1)}%`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: (v) => v + '%' }
          },
          y: { grid: { display: false } }
        }
      }
    });
  }

  // ─── 3. Loyalty vs Non-Loyalty ───
  function renderLoyaltyChart(data) {
    destroyChart('loyalty');
    const ctx = document.getElementById('chart-loyalty');

    charts.loyalty = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: CATEGORIES,
        datasets: [
          {
            label: 'Loyalty Members',
            data: CATEGORIES.map(c => data.loyalty.members[c]),
            backgroundColor: '#00704ACC',
            borderColor: '#00704A',
            borderWidth: 1,
            borderRadius: 5,
            borderSkipped: false
          },
          {
            label: 'Non-Members',
            data: CATEGORIES.map(c => data.loyalty.nonMembers[c]),
            backgroundColor: '#CBA258AA',
            borderColor: '#CBA258',
            borderWidth: 1,
            borderRadius: 5,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (c) => `${c.dataset.label}: ${fmtCurrencySmall(c.raw)}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => fmtCurrencySmall(v) }
          }
        }
      }
    });
  }

  // ─── 4. Marketing Spend vs Customer Growth ───
  function renderMarketingChart(data, periodMonths) {
    destroyChart('marketing');
    const ctx = document.getElementById('chart-marketing');
    const mktData = data.marketing.slice(-periodMonths);
    const sym = CURRENCY_SYMBOLS[activeCurrency] || '$';

    charts.marketing = new Chart(ctx, {
      type: 'line',
      data: {
        labels: mktData.map(m => m.month),
        datasets: [
          {
            label: 'Marketing Spend',
            data: mktData.map(m => m.spend),
            borderColor: '#F472B6',
            backgroundColor: 'rgba(244,114,182,.1)',
            fill: true,
            tension: .4,
            yAxisID: 'y',
            pointRadius: 4,
            pointBackgroundColor: '#F472B6',
            pointBorderColor: '#0B1215',
            pointBorderWidth: 2
          },
          {
            label: 'New Customers',
            data: mktData.map(m => m.newCustomers),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59,130,246,.1)',
            fill: true,
            tension: .4,
            yAxisID: 'y1',
            pointRadius: 4,
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#0B1215',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (c) => {
                if (c.datasetIndex === 0) return `Spend: ${fmtCurrency(c.raw)}`;
                return `New Customers: ${fmtNum(c.raw)}`;
              },
              afterBody: (tooltipItems) => {
                const idx = tooltipItems[0].dataIndex;
                const m = mktData[idx];
                if (m && m.newCustomers > 0) {
                  const cac = m.spend / m.newCustomers;
                  return `\nCAC: ${fmtCurrency(cac)} per customer`;
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            type: 'linear',
            position: 'left',
            ticks: { callback: (v) => fmtCurrency(v) },
            title: { display: true, text: `Marketing Spend (${sym})`, color: '#F472B6', font: { weight: '600' } }
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { callback: (v) => fmtNum(v) },
            title: { display: true, text: 'New Customers Acquired', color: '#3B82F6', font: { weight: '600' } }
          }
        }
      }
    });
  }

  // ─── 5. AOV by Customer Segment (Donut + Table + Overlay) ───
  function renderAOVChart(data) {
    destroyChart('aov');
    const ctx = document.getElementById('chart-aov');

    const segEntries = Object.entries(data.segments);
    const colors = ['#3B82F6', '#60A5FA', '#CBA258', '#00704A', '#1E9E6E'];

    // Compute weighted AOV for the center overlay
    const totalRevenue = segEntries.reduce((s, [, d]) => s + d.revenue, 0);
    const totalOrders = segEntries.reduce((s, [, d]) => s + d.orders, 0);
    const weightedAOV = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    charts.aov = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: segEntries.map(([s]) => s),
        datasets: [{
          data: segEntries.map(([, d]) => d.revenue),
          backgroundColor: colors.map(c => c + 'CC'),
          borderColor: colors,
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '62%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => {
                const seg = data.segments[c.label];
                return `${c.label}: ${fmtCurrency(seg.revenue)} (AOV: ${fmtCurrencySmall(seg.aov)})`;
              }
            }
          }
        }
      }
    });

    // Populate center overlay
    document.getElementById('donut-overlay-value').textContent = fmtCurrencySmall(weightedAOV);
    document.getElementById('donut-overlay-sub').textContent = `${fmtNum(totalOrders)} total orders`;

    // Build prominent custom legend below the donut
    const donutWrap = document.querySelector('#tile-aov .donut-wrap');
    let legendEl = donutWrap.querySelector('.donut-legend');
    if (!legendEl) {
      legendEl = document.createElement('div');
      legendEl.className = 'donut-legend';
      donutWrap.appendChild(legendEl);
    }
    legendEl.innerHTML = segEntries.map(([seg, d], i) => `
      <div class="donut-legend__item">
        <span class="donut-legend__swatch" style="background:${colors[i % colors.length]}"></span>
        <span class="donut-legend__label">${seg}</span>
        <span class="donut-legend__value">${fmtCurrencySmall(d.aov)}</span>
        <span class="donut-legend__share">${d.share.toFixed(1)}%</span>
      </div>
    `).join('');

    // Build table
    const wrap = document.getElementById('aov-table-wrap');
    let html = `<table class="aov-table">
            <thead><tr><th>Segment</th><th>AOV</th><th>Orders</th><th>Share</th></tr></thead><tbody>`;
    segEntries.sort((a, b) => b[1].aov - a[1].aov).forEach(([seg, d]) => {
      html += `<tr>
                <td>${seg}</td>
                <td class="highlight">${fmtCurrencySmall(d.aov)}</td>
                <td>${fmtNum(d.orders)}</td>
                <td>${d.share.toFixed(1)}%</td>
            </tr>`;
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  // ─── 6. Daily Store Traffic ───
  function renderTrafficChart(data) {
    destroyChart('traffic');
    const ctx = document.getElementById('chart-traffic');

    charts.traffic = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.dailyTraffic.map(d => d.date),
        datasets: [{
          label: 'Transactions',
          data: data.dailyTraffic.map(d => d.transactions),
          borderColor: '#34D399',
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return 'rgba(52,211,153,.1)';
            const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(52,211,153,.25)');
            gradient.addColorStop(1, 'rgba(52,211,153,.02)');
            return gradient;
          },
          fill: true,
          tension: .35,
          pointRadius: 2,
          pointBackgroundColor: '#34D399',
          pointHoverRadius: 5,
          pointBorderColor: '#0B1215',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => `Transactions: ${c.raw.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 10 }
          },
          y: {
            beginAtZero: false,
            ticks: { callback: (v) => v.toLocaleString() }
          }
        }
      }
    });
  }

  // ─── 7. Interactive World Heatmap (Leaflet) ───
  const COUNTRY_TO_REGION = {
    // North America
    USA: 'North America', CAN: 'North America', MEX: 'North America',
    // Latin America
    BRA: 'Latin America', ARG: 'Latin America', COL: 'Latin America', CHL: 'Latin America',
    PER: 'Latin America', VEN: 'Latin America', ECU: 'Latin America', BOL: 'Latin America',
    PRY: 'Latin America', URY: 'Latin America', GUY: 'Latin America', SUR: 'Latin America',
    PAN: 'Latin America', CRI: 'Latin America', GTM: 'Latin America', HND: 'Latin America',
    SLV: 'Latin America', NIC: 'Latin America', BLZ: 'Latin America', CUB: 'Latin America',
    HTI: 'Latin America', DOM: 'Latin America', JAM: 'Latin America', TTO: 'Latin America',
    // Europe
    GBR: 'Europe', FRA: 'Europe', DEU: 'Europe', ITA: 'Europe', ESP: 'Europe',
    PRT: 'Europe', NLD: 'Europe', BEL: 'Europe', CHE: 'Europe', AUT: 'Europe',
    SWE: 'Europe', NOR: 'Europe', DNK: 'Europe', FIN: 'Europe', POL: 'Europe',
    CZE: 'Europe', ROU: 'Europe', GRC: 'Europe', HUN: 'Europe', IRL: 'Europe',
    SVK: 'Europe', BGR: 'Europe', HRV: 'Europe', LTU: 'Europe', SVN: 'Europe',
    LVA: 'Europe', EST: 'Europe', ISL: 'Europe', LUX: 'Europe', UKR: 'Europe',
    BLR: 'Europe', MDA: 'Europe', SRB: 'Europe', BIH: 'Europe', ALB: 'Europe',
    MKD: 'Europe', MNE: 'Europe', RUS: 'Europe',
    TUR: 'Europe', CYP: 'Europe', GEO: 'Europe', ARM: 'Europe', AZE: 'Europe',
    // Middle East
    SAU: 'Middle East', ARE: 'Middle East', QAT: 'Middle East', KWT: 'Middle East',
    OMN: 'Middle East', BHR: 'Middle East', IRQ: 'Middle East', IRN: 'Middle East',
    ISR: 'Middle East', JOR: 'Middle East', LBN: 'Middle East', SYR: 'Middle East',
    YEM: 'Middle East', EGY: 'Middle East',
    KAZ: 'Middle East', UZB: 'Middle East', TKM: 'Middle East',
    TJK: 'Middle East', KGZ: 'Middle East', AFG: 'Middle East',
    // India
    IND: 'India', LKA: 'India', BGD: 'India', NPL: 'India', PAK: 'India',
    // China
    CHN: 'China', MNG: 'China', TWN: 'China', HKG: 'China',
    // Japan
    JPN: 'Japan',
    // South Korea
    KOR: 'South Korea', PRK: 'South Korea',
    // Southeast Asia
    IDN: 'Southeast Asia', THA: 'Southeast Asia', VNM: 'Southeast Asia',
    PHL: 'Southeast Asia', MYS: 'Southeast Asia', SGP: 'Southeast Asia',
    MMR: 'Southeast Asia', KHM: 'Southeast Asia', LAO: 'Southeast Asia',
    BRN: 'Southeast Asia',
    // Australia
    AUS: 'Australia', NZL: 'Australia', PNG: 'Australia', FJI: 'Australia',
    // Africa
    ZAF: 'Africa', NGA: 'Africa', KEN: 'Africa', GHA: 'Africa',
    ETH: 'Africa', TZA: 'Africa', UGA: 'Africa', DZA: 'Africa', MAR: 'Africa',
    TUN: 'Africa', AGO: 'Africa', MOZ: 'Africa', MDG: 'Africa', CMR: 'Africa',
    CIV: 'Africa', NER: 'Africa', BFA: 'Africa', MLI: 'Africa', SEN: 'Africa',
    TCD: 'Africa', GIN: 'Africa', RWA: 'Africa', BEN: 'Africa', BDI: 'Africa',
    SSD: 'Africa', SLE: 'Africa', TGO: 'Africa', LBR: 'Africa', MRT: 'Africa',
    ERI: 'Africa', GMB: 'Africa', BWA: 'Africa', NAM: 'Africa', LSO: 'Africa',
    SWZ: 'Africa', COG: 'Africa', COD: 'Africa', GAB: 'Africa', GNQ: 'Africa',
    CAF: 'Africa', ZMB: 'Africa', ZWE: 'Africa', MWI: 'Africa', SOM: 'Africa',
    SDN: 'Africa', LBY: 'Africa', DJI: 'Africa', CPV: 'Africa', MUS: 'Africa',
    SYC: 'Africa', COM: 'Africa', STP: 'Africa'
  };

  let heatmapMap = null;
  let heatmapGeoLayer = null;
  let heatmapGeoJson = null;
  let heatmapTileLayer = null;

  function setHeatmapTiles() {
    if (!heatmapMap) return;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const tileUrl = isLight
      ? 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
    if (heatmapTileLayer) heatmapMap.removeLayer(heatmapTileLayer);
    heatmapTileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(heatmapMap);
  }

  async function initHeatmapMap() {
    const container = document.getElementById('heatmap-container');
    if (!container || heatmapMap) return;

    heatmapMap = L.map(container, {
      center: [25, 10],
      zoom: 2,
      minZoom: 2,
      maxZoom: 2,
      zoomControl: false,
      attributionControl: true,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false
    });

    // Set tile layer based on current theme
    setHeatmapTiles();

    // Fetch GeoJSON countries
    try {
      const resp = await fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json');
      heatmapGeoJson = await resp.json();
    } catch (e) {
      console.warn('Heatmap: Could not load GeoJSON', e);
    }
  }

  function renderHeatmap(data) {
    if (!heatmapMap || !heatmapGeoJson) return;

    // Remove old layer
    if (heatmapGeoLayer) {
      heatmapMap.removeLayer(heatmapGeoLayer);
      heatmapGeoLayer = null;
    }

    // Compute revenue range for color scale
    const revenues = Object.values(data.regions).map(r => r.revenue);
    const minRev = Math.min(...revenues);
    const maxRev = Math.max(...revenues);
    const range = maxRev - minRev || 1;

    const getColor = (revenue) => {
      const t = (revenue - minRev) / range;
      const h = 152 + t * 8;
      const s = 45 + t * 30;
      const l = 15 + t * 35;
      return `hsl(${h}, ${s}%, ${l}%)`;
    };

    const activeRegion = document.getElementById('filter-region').value;

    heatmapGeoLayer = L.geoJSON(heatmapGeoJson, {
      style: (feature) => {
        const iso = feature.id || feature.properties.iso_a3 || '';
        const regionName = COUNTRY_TO_REGION[iso];
        const regionData = regionName ? data.regions[regionName] : null;

        if (!regionData) {
          return {
            fillColor: 'rgba(255,255,255,.03)',
            fillOpacity: 1,
            color: 'rgba(255,255,255,.08)',
            weight: 0.5
          };
        }

        const isActive = activeRegion === regionName;
        return {
          fillColor: getColor(regionData.revenue),
          fillOpacity: 0.85,
          color: isActive ? '#CBA258' : 'rgba(255,255,255,.15)',
          weight: isActive ? 2 : 0.8
        };
      },
      onEachFeature: (feature, layer) => {
        const iso = feature.id || feature.properties.iso_a3 || '';
        const regionName = COUNTRY_TO_REGION[iso];
        const regionData = regionName ? data.regions[regionName] : null;
        if (!regionData) return;

        // Tooltip
        const ttHtml = `
                    <div class="heatmap-tt__name">${regionName}</div>
                    <div class="heatmap-tt__row"><span>Revenue</span><span class="heatmap-tt__val">${fmtCurrency(regionData.revenue)}</span></div>
                    <div class="heatmap-tt__row"><span>Stores</span><span class="heatmap-tt__val">${regionData.storeCount.toLocaleString()}</span></div>
                    <div class="heatmap-tt__row"><span>Customers</span><span class="heatmap-tt__val">${fmtNum(regionData.customers)}</span></div>
                `;
        layer.bindTooltip(ttHtml, {
          sticky: true,
          className: 'heatmap-tt',
          direction: 'auto',
          offset: [0, -10]
        });

        // Hover highlight
        layer.on('mouseover', () => {
          layer.setStyle({ weight: 2, color: 'rgba(255,255,255,.5)', fillOpacity: 0.95 });
          layer.bringToFront();
        });
        layer.on('mouseout', () => {
          heatmapGeoLayer.resetStyle(layer);
        });

        // Click to filter
        layer.on('click', () => {
          const regionSelect = document.getElementById('filter-region');
          if (regionSelect.value === regionName) {
            regionSelect.value = 'all';
          } else {
            regionSelect.value = regionName;
          }
          regionSelect.dispatchEvent(new Event('change'));
        });
      }
    }).addTo(heatmapMap);

    // Force Leaflet to recalculate size
    setTimeout(() => heatmapMap.invalidateSize(), 200);
  }

  // ─── Populate Region Filter ───
  function populateRegionFilter() {
    const sel = document.getElementById('filter-region');
    REGIONS.sort().forEach(r => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r;
      sel.appendChild(opt);
    });
  }

  // ─── 7. Performance Insights ───
  function renderInsights(data, kpis) {
    const container = document.getElementById('insights-body');

    // Compute insights from the data
    const insights = [];

    // SVG icon paths
    const icons = {
      revenue: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      margin: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
      loyalty: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      marketing: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
      segment: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
      traffic: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
    };

    // 1. Top region by revenue
    const regionsSorted = Object.entries(data.regions)
      .sort((a, b) => b[1].revenue - a[1].revenue);
    const topRegion = regionsSorted[0];
    const totalRevAll = Object.values(data.regions).reduce((s, r) => s + r.revenue, 0);
    const topRegionShare = ((topRegion[1].revenue / totalRevAll) * 100).toFixed(1);
    // Find lowest-CAC region
    const regionCACData = regionsSorted.map(([name, r]) => {
      const mkt = data.marketing.reduce((s, m) => s + m.spend, 0) * (r.revenue / totalRevAll);
      const newCust = Math.floor(r.customers * 0.3);
      return { name, cac: newCust > 0 ? mkt / newCust : Infinity };
    }).sort((a, b) => a.cac - b.cac);
    const lowCACRegion = regionCACData[0]?.name || topRegion[0];

    insights.push({
      icon: icons.revenue, color: 'green',
      badge: 'strong', badgeLabel: 'Strong',
      title: 'Top Revenue Region',
      detail: `<span class="insight-value">${topRegion[0]}</span> leads with ${fmtCurrency(topRegion[1].revenue)} in annual revenue, representing ${topRegionShare}% of total.`,
      recommendation: `Protect market share in ${topRegion[0]} through premium product launches and loyalty campaign investment in Q4.`
    });

    // 2. Best margin category
    const topCategory = Object.entries(data.categories)
      .sort((a, b) => b[1].margin - a[1].margin)[0];
    const lowestCategory = Object.entries(data.categories)
      .sort((a, b) => a[1].margin - b[1].margin)[0];
    insights.push({
      icon: icons.margin, color: 'gold',
      badge: 'strong', badgeLabel: 'Strong',
      title: 'Highest Profit Margins',
      detail: `<span class="insight-value">${topCategory[0]}</span> delivers ${topCategory[1].margin.toFixed(1)}% gross margin — the most profitable category in the portfolio.`,
      recommendation: `Expand ${topCategory[0]} menu offerings and consider price optimization for ${lowestCategory[0]} (${lowestCategory[1].margin.toFixed(1)}% margin) to improve profitability.`
    });

    // 3. Loyalty uplift
    const avgMemberAOV = CATEGORIES.reduce((s, c) => s + data.loyalty.members[c], 0) / CATEGORIES.length;
    const avgNonMemberAOV = CATEGORIES.reduce((s, c) => s + data.loyalty.nonMembers[c], 0) / CATEGORIES.length;
    const loyaltyUplift = ((avgMemberAOV - avgNonMemberAOV) / avgNonMemberAOV * 100);
    const loyaltyBadge = loyaltyUplift > 25 ? 'strong' : loyaltyUplift > 15 ? 'watch' : 'action';
    const loyaltyBadgeLabel = loyaltyUplift > 25 ? 'Strong' : loyaltyUplift > 15 ? 'Watch' : 'Action Needed';
    insights.push({
      icon: icons.loyalty, color: 'purple',
      badge: loyaltyBadge, badgeLabel: loyaltyBadgeLabel,
      title: 'Loyalty Program Impact',
      detail: `Members spend <span class="insight-value">${loyaltyUplift.toFixed(0)}% more</span> per order (${fmtCurrencySmall(avgMemberAOV)} vs ${fmtCurrencySmall(avgNonMemberAOV)}).`,
      recommendation: `Expand loyalty rewards program to non-member heavy segments to capture the ${loyaltyUplift.toFixed(0)}% spending uplift. Target sign-up promotions in-store and via mobile app.`
    });

    // 4. Marketing efficiency
    const latestMkt = data.marketing[data.marketing.length - 1];
    const cac = latestMkt.spend / latestMkt.newCustomers;
    const cacThreshold = 60 * (CURRENCY_RATES[activeCurrency] || 1);
    const mktBadge = cac < cacThreshold ? 'strong' : 'watch';
    const mktBadgeLabel = cac < cacThreshold ? 'Strong' : 'Watch';
    insights.push({
      icon: icons.marketing, color: 'pink',
      badge: mktBadge, badgeLabel: mktBadgeLabel,
      title: 'Marketing Efficiency',
      detail: `Latest CAC is <span class="insight-value">${fmtCurrency(cac)}</span> per new customer. ${cac < cacThreshold ? 'Campaigns are performing within optimal range.' : 'Acquisition costs are trending above target.'}`,
      recommendation: `Increase marketing spend in ${lowCACRegion} in Q4 based on favorable acquisition costs. Reallocate budget from high-CAC channels to social and referral programs.`
    });

    // 5. Top AOV segment
    const topSegment = Object.entries(data.segments)
      .sort((a, b) => b[1].aov - a[1].aov)[0];
    const avgSegAOV = Object.values(data.segments).reduce((s, d) => s + d.aov, 0) / Object.keys(data.segments).length;
    const segMultiple = (topSegment[1].aov / avgSegAOV).toFixed(1);
    insights.push({
      icon: icons.segment, color: 'blue',
      badge: 'strong', badgeLabel: 'Strong',
      title: 'Highest-Value Segment',
      detail: `<span class="insight-value">${topSegment[0]}</span> have an AOV of ${fmtCurrencySmall(topSegment[1].aov)} — ${segMultiple}x the segment average.`,
      recommendation: `Target upselling and cross-selling campaigns to ${topSegment[0]}. Introduce exclusive bundles and seasonal premium products for this high-value segment.`
    });

    // 6. Busiest day
    const busiestDay = [...data.dailyTraffic].sort((a, b) => b.transactions - a.transactions)[0];
    const avgDailyTx = data.dailyTraffic.reduce((s, d) => s + d.transactions, 0) / data.dailyTraffic.length;
    const peakVsAvg = ((busiestDay.transactions - avgDailyTx) / avgDailyTx * 100).toFixed(0);
    insights.push({
      icon: icons.traffic, color: 'teal',
      badge: parseInt(peakVsAvg) > 20 ? 'watch' : 'strong',
      badgeLabel: parseInt(peakVsAvg) > 20 ? 'Watch' : 'Strong',
      title: 'Peak Traffic Day',
      detail: `<span class="insight-value">${busiestDay.date}</span> saw ${busiestDay.transactions.toLocaleString()} transactions — ${peakVsAvg}% above the 30-day average.`,
      recommendation: `Ensure staffing levels and inventory are scaled for peak days. Consider dynamic scheduling based on weekly traffic patterns to improve service times.`
    });

    // Render
    container.innerHTML = insights.map(ins => `
            <div class="insight-item">
                <div class="insight-icon insight-icon--${ins.color}">${ins.icon}</div>
                <div class="insight-content">
                    <div class="insight-header">
                        <span class="insight-title">${ins.title}</span>
                        <span class="insight-badge insight-badge--${ins.badge}">${ins.badgeLabel}</span>
                    </div>
                    <span class="insight-detail">${ins.detail}</span>
                    <span class="insight-recommendation">💡 ${ins.recommendation}</span>
                </div>
            </div>
        `).join('');
  }

  // ─── Render Everything ───
  function renderAll(data, regionFilter, periodMonths) {
    const kpis = computeKPIs(data, regionFilter, periodMonths);
    renderKPIs(kpis);
    renderRegionChart(data, regionFilter);
    renderHeatmap(data);
    renderCategoryChart(data);
    renderLoyaltyChart(data);
    renderMarketingChart(data, periodMonths);
    renderAOVChart(data);
    renderTrafficChart(data);
    renderInsights(data, kpis);
  }

  // ═══════════════ DETAIL MODAL SYSTEM ═══════════════
  let modalChart = null;

  function openModal(title, subtitle, buildFn) {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-subtitle').textContent = subtitle;
    const body = document.getElementById('modal-body');
    body.innerHTML = '';
    buildFn(body);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    if (modalChart) { modalChart.destroy(); modalChart = null; }
  }

  // ─── Detail Builders ───

  function buildRegionDetail(body, data) {
    const regions = Object.entries(data.regions).sort((a, b) => b[1].revenue - a[1].revenue);
    const totalRev = regions.reduce((s, [, d]) => s + d.revenue, 0);

    // Stat cards
    body.innerHTML = `
            <div class="modal-stat-grid">
                <div class="modal-stat"><span class="modal-stat__label">Total Revenue</span><span class="modal-stat__value">${fmtCurrency(totalRev)}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Regions</span><span class="modal-stat__value">${regions.length}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Top Region</span><span class="modal-stat__value">${regions[0][0]}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Avg per Region</span><span class="modal-stat__value">${fmtCurrency(totalRev / regions.length)}</span></div>
            </div>
            <h3 class="modal-section-title">Revenue Breakdown by Region</h3>
            <div class="modal-chart-wrap"><canvas id="modal-canvas"></canvas></div>
            <h3 class="modal-section-title">Detailed Data</h3>
            <table class="modal-table">
                <thead><tr><th>Region</th><th>Revenue</th><th>% Share</th><th>Monthly Trend</th></tr></thead>
                <tbody>${regions.map(([r, d]) => `<tr>
                    <td>${r}</td>
                    <td class="highlight">${fmtCurrency(d.revenue)}</td>
                    <td>${(d.revenue / totalRev * 100).toFixed(1)}%</td>
                    <td>${d.monthlyRevenue.slice(-3).map(m => fmtCurrency(m)).join(' → ')}</td>
                </tr>`).join('')}</tbody>
            </table>`;

    modalChart = new Chart(document.getElementById('modal-canvas'), {
      type: 'bar',
      data: {
        labels: regions.map(([r]) => r),
        datasets: [{
          label: 'Revenue',
          data: regions.map(([, d]) => d.revenue),
          backgroundColor: regions.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + 'CC'),
          borderColor: regions.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
          borderWidth: 1, borderRadius: 6, borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmtCurrency(c.raw) } } },
        scales: { x: { grid: { display: false } }, y: { ticks: { callback: v => fmtCurrency(v) } } }
      }
    });
  }

  function buildCategoryDetail(body, data) {
    const cats = Object.entries(data.categories).sort((a, b) => b[1].margin - a[1].margin);
    const avgMargin = cats.reduce((s, [, d]) => s + d.margin, 0) / cats.length;

    body.innerHTML = `
            <div class="modal-stat-grid">
                <div class="modal-stat"><span class="modal-stat__label">Avg Margin</span><span class="modal-stat__value">${avgMargin.toFixed(1)}%</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Best Category</span><span class="modal-stat__value">${cats[0][0]}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Margin Spread</span><span class="modal-stat__value">${(cats[0][1].margin - cats[cats.length - 1][1].margin).toFixed(1)}pp</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Categories</span><span class="modal-stat__value">${cats.length}</span></div>
            </div>
            <h3 class="modal-section-title">Margin Comparison</h3>
            <div class="modal-chart-wrap"><canvas id="modal-canvas"></canvas></div>
            <h3 class="modal-section-title">Revenue & Cost Analysis</h3>
            <table class="modal-table">
                <thead><tr><th>Category</th><th>Revenue</th><th>COGS Est.</th><th>Gross Margin</th><th>Rating</th></tr></thead>
                <tbody>${cats.map(([c, d]) => {
      const rev = d.revenue || (d.margin * 1e6 / 100 * 3);
      const cogs = rev * (1 - d.margin / 100);
      const rating = d.margin >= 70 ? '⭐ Excellent' : d.margin >= 55 ? '✅ Good' : '⚠️ Watch';
      return `<tr><td>${c}</td><td class="highlight">${fmtCurrency(rev)}</td><td>${fmtCurrency(cogs)}</td><td class="gold">${d.margin.toFixed(1)}%</td><td>${rating}</td></tr>`;
    }).join('')}</tbody>
            </table>`;

    modalChart = new Chart(document.getElementById('modal-canvas'), {
      type: 'bar',
      data: {
        labels: cats.map(([c]) => c),
        datasets: [{
          label: 'Gross Margin %',
          data: cats.map(([, d]) => d.margin),
          backgroundColor: cats.map((_, i) => ['#00704A', '#1E9E6E', '#34D399', '#3B82F6', '#CBA258', '#A78BFA'][i] + 'CC'),
          borderRadius: 6, borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.raw.toFixed(1) + '%' } } },
        scales: { x: { max: 100, ticks: { callback: v => v + '%' } }, y: { grid: { display: false } } }
      }
    });
  }

  function buildLoyaltyDetail(body, data) {
    const uplifts = CATEGORIES.map(c => ({
      cat: c,
      member: data.loyalty.members[c],
      nonMember: data.loyalty.nonMembers[c],
      uplift: ((data.loyalty.members[c] - data.loyalty.nonMembers[c]) / data.loyalty.nonMembers[c] * 100)
    })).sort((a, b) => b.uplift - a.uplift);

    const avgUplift = uplifts.reduce((s, u) => s + u.uplift, 0) / uplifts.length;

    body.innerHTML = `
            <div class="modal-stat-grid">
                <div class="modal-stat"><span class="modal-stat__label">Avg Loyalty Uplift</span><span class="modal-stat__value">+${avgUplift.toFixed(0)}%</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Best Uplift</span><span class="modal-stat__value">${uplifts[0].cat}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Member Avg AOV</span><span class="modal-stat__value">${fmtCurrencySmall(uplifts.reduce((s, u) => s + u.member, 0) / uplifts.length)}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Non-Member Avg</span><span class="modal-stat__value">${fmtCurrencySmall(uplifts.reduce((s, u) => s + u.nonMember, 0) / uplifts.length)}</span></div>
            </div>
            <h3 class="modal-section-title">Loyalty Uplift by Category</h3>
            <div class="modal-chart-wrap"><canvas id="modal-canvas"></canvas></div>
            <h3 class="modal-section-title">Category Comparison</h3>
            <table class="modal-table">
                <thead><tr><th>Category</th><th>Member AOV</th><th>Non-Member AOV</th><th>Uplift</th><th>Impact</th></tr></thead>
                <tbody>${uplifts.map(u => `<tr>
                    <td>${u.cat}</td>
                    <td class="highlight">${fmtCurrencySmall(u.member)}</td>
                    <td>${fmtCurrencySmall(u.nonMember)}</td>
                    <td class="gold">+${u.uplift.toFixed(1)}%</td>
                    <td>${u.uplift > 30 ? '🔥 High' : u.uplift > 15 ? '📈 Medium' : '📊 Low'}</td>
                </tr>`).join('')}</tbody>
            </table>`;

    modalChart = new Chart(document.getElementById('modal-canvas'), {
      type: 'bar',
      data: {
        labels: uplifts.map(u => u.cat),
        datasets: [
          { label: 'Members', data: uplifts.map(u => u.member), backgroundColor: '#00704ACC', borderRadius: 5 },
          { label: 'Non-Members', data: uplifts.map(u => u.nonMember), backgroundColor: '#CBA258AA', borderRadius: 5 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${fmtCurrencySmall(c.raw)}` } } },
        scales: { x: { grid: { display: false } }, y: { ticks: { callback: v => fmtCurrencySmall(v) } } }
      }
    });
  }

  function buildMarketingDetail(body, data, periodMonths) {
    const mkt = data.marketing.slice(-periodMonths);
    const totalSpend = mkt.reduce((s, m) => s + m.spend, 0);
    const totalNew = mkt.reduce((s, m) => s + m.newCustomers, 0);
    const avgCAC = totalSpend / totalNew;
    const bestIdx = mkt.reduce((best, m, i) => m.newCustomers / m.spend > mkt[best].newCustomers / mkt[best].spend ? i : best, 0);

    body.innerHTML = `
            <div class="modal-stat-grid">
                <div class="modal-stat"><span class="modal-stat__label">Total Spend</span><span class="modal-stat__value">${fmtCurrency(totalSpend)}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">New Customers</span><span class="modal-stat__value">${fmtNum(totalNew)}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Avg CAC</span><span class="modal-stat__value">${fmtCurrencySmall(avgCAC)}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Best Month</span><span class="modal-stat__value">${MONTHS[bestIdx]}</span></div>
            </div>
            <h3 class="modal-section-title">Marketing Spend vs Customer Growth</h3>
            <div class="modal-chart-wrap"><canvas id="modal-canvas"></canvas></div>
            <h3 class="modal-section-title">Monthly Breakdown</h3>
            <table class="modal-table">
                <thead><tr><th>Month</th><th>Spend</th><th>New Customers</th><th>CAC</th><th>Efficiency</th></tr></thead>
                <tbody>${mkt.map((m, i) => {
      const cac = m.spend / m.newCustomers;
      const eff = cac < avgCAC * 0.85 ? '🟢 Excellent' : cac < avgCAC * 1.1 ? '🟡 Good' : '🔴 High';
      return `<tr><td>${MONTHS[i]}</td><td>${fmtCurrency(m.spend)}</td><td>${fmtNum(m.newCustomers)}</td><td class="highlight">${fmtCurrencySmall(cac)}</td><td>${eff}</td></tr>`;
    }).join('')}</tbody>
            </table>`;

    const sym = CURRENCY_SYMBOLS[activeCurrency] || '$';

    modalChart = new Chart(document.getElementById('modal-canvas'), {
      type: 'line',
      data: {
        labels: mkt.map((_, i) => MONTHS[i]),
        datasets: [
          {
            label: 'Marketing Spend',
            data: mkt.map(m => m.spend),
            borderColor: '#F472B6',
            backgroundColor: 'rgba(244,114,182,.12)',
            fill: true,
            tension: .4,
            yAxisID: 'y',
            pointRadius: 5,
            pointBackgroundColor: '#F472B6',
            pointBorderColor: '#0B1215',
            pointBorderWidth: 2
          },
          {
            label: 'New Customers',
            data: mkt.map(m => m.newCustomers),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59,130,246,.12)',
            fill: true,
            tension: .4,
            yAxisID: 'y1',
            pointRadius: 5,
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#0B1215',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (c) => {
                if (c.datasetIndex === 0) return `Spend: ${fmtCurrency(c.raw)}`;
                return `New Customers: ${fmtNum(c.raw)}`;
              },
              afterBody: (tooltipItems) => {
                const idx = tooltipItems[0].dataIndex;
                const m = mkt[idx];
                if (m && m.newCustomers > 0) {
                  return `CAC: ${fmtCurrencySmall(m.spend / m.newCustomers)} per customer`;
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            type: 'linear',
            position: 'left',
            ticks: { callback: v => fmtCurrency(v) },
            title: { display: true, text: `Marketing Spend (${sym})`, color: '#F472B6', font: { weight: '600' } }
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { callback: v => fmtNum(v) },
            title: { display: true, text: 'New Customers Acquired', color: '#3B82F6', font: { weight: '600' } }
          }
        }
      }
    });
  }

  function buildAOVDetail(body, data) {
    const segs = Object.entries(data.segments).sort((a, b) => b[1].aov - a[1].aov);
    const totalRev = segs.reduce((s, [, d]) => s + d.revenue, 0);
    const totalOrders = segs.reduce((s, [, d]) => s + d.orders, 0);
    const wAOV = totalRev / totalOrders;

    body.innerHTML = `
            <div class="modal-stat-grid">
                <div class="modal-stat"><span class="modal-stat__label">Weighted AOV</span><span class="modal-stat__value">${fmtCurrencySmall(wAOV)}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Top Segment</span><span class="modal-stat__value">${segs[0][0]}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Total Revenue</span><span class="modal-stat__value">${fmtCurrency(totalRev)}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Total Orders</span><span class="modal-stat__value">${fmtNum(totalOrders)}</span></div>
            </div>
            <h3 class="modal-section-title">Revenue by Segment</h3>
            <div class="modal-chart-wrap"><canvas id="modal-canvas"></canvas></div>
            <h3 class="modal-section-title">Segment Analysis</h3>
            <table class="modal-table">
                <thead><tr><th>Segment</th><th>AOV</th><th>Orders</th><th>Revenue</th><th>Share</th><th>Strategy</th></tr></thead>
                <tbody>${segs.map(([seg, d]) => {
      const strategy = d.aov > wAOV ? '🎯 Upsell premium' : d.orders > totalOrders / segs.length ? '💡 Increase AOV' : '📢 Drive volume';
      return `<tr><td>${seg}</td><td class="highlight">${fmtCurrencySmall(d.aov)}</td><td>${fmtNum(d.orders)}</td><td>${fmtCurrency(d.revenue)}</td><td class="gold">${d.share.toFixed(1)}%</td><td>${strategy}</td></tr>`;
    }).join('')}</tbody>
            </table>`;

    const colors = ['#3B82F6', '#60A5FA', '#CBA258', '#00704A', '#1E9E6E'];
    modalChart = new Chart(document.getElementById('modal-canvas'), {
      type: 'bar',
      data: {
        labels: segs.map(([s]) => s),
        datasets: [{
          label: 'Revenue',
          data: segs.map(([, d]) => d.revenue),
          backgroundColor: colors.map(c => c + 'CC'),
          borderColor: colors, borderWidth: 1, borderRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmtCurrency(c.raw) } } },
        scales: { x: { grid: { display: false } }, y: { ticks: { callback: v => fmtCurrency(v) } } }
      }
    });
  }

  function buildTrafficDetail(body, data) {
    const traffic = data.dailyTraffic;
    const total = traffic.reduce((s, d) => s + d.transactions, 0);
    const avg = total / traffic.length;
    const max = traffic.reduce((m, d) => d.transactions > m.transactions ? d : m);
    const min = traffic.reduce((m, d) => d.transactions < m.transactions ? d : m);

    body.innerHTML = `
            <div class="modal-stat-grid">
                <div class="modal-stat"><span class="modal-stat__label">Total Transactions</span><span class="modal-stat__value">${fmtNum(total)}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Daily Average</span><span class="modal-stat__value">${fmtNum(Math.round(avg))}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Peak Day</span><span class="modal-stat__value">${max.date}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Slowest Day</span><span class="modal-stat__value">${min.date}</span></div>
            </div>
            <h3 class="modal-section-title">Traffic Trend (${traffic.length} Days)</h3>
            <div class="modal-chart-wrap"><canvas id="modal-canvas"></canvas></div>
            <h3 class="modal-section-title">Daily Detail</h3>
            <table class="modal-table">
                <thead><tr><th>Date</th><th>Transactions</th><th>vs. Average</th><th>Status</th></tr></thead>
                <tbody>${traffic.map(d => {
      const diff = ((d.transactions - avg) / avg * 100);
      const status = diff > 10 ? '🟢 Above avg' : diff < -10 ? '🔴 Below avg' : '🟡 Normal';
      return `<tr><td>${d.date}</td><td class="highlight">${d.transactions.toLocaleString()}</td><td class="${diff > 0 ? 'gold' : ''}">${diff > 0 ? '+' : ''}${diff.toFixed(1)}%</td><td>${status}</td></tr>`;
    }).join('')}</tbody>
            </table>`;

    modalChart = new Chart(document.getElementById('modal-canvas'), {
      type: 'line',
      data: {
        labels: traffic.map(d => d.date),
        datasets: [{
          label: 'Transactions',
          data: traffic.map(d => d.transactions),
          borderColor: '#34D399',
          backgroundColor: 'rgba(52,211,153,.1)',
          fill: true, tension: .35, pointRadius: 3, pointBackgroundColor: '#34D399'
        }, {
          label: 'Average',
          data: traffic.map(() => avg),
          borderColor: '#CBA258', borderDash: [6, 4], borderWidth: 1.5,
          pointRadius: 0, fill: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.raw.toLocaleString()}` } } },
        scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }, y: { ticks: { callback: v => v.toLocaleString() } } }
      }
    });
  }

  function buildInsightsDetail(body, data) {
    const regions = Object.entries(data.regions).sort((a, b) => b[1].revenue - a[1].revenue);
    const cats = Object.entries(data.categories).sort((a, b) => b[1].margin - a[1].margin);
    const segs = Object.entries(data.segments).sort((a, b) => b[1].aov - a[1].aov);
    const totalRev = regions.reduce((s, [, d]) => s + d.revenue, 0);

    body.innerHTML = `
            <div class="modal-stat-grid">
                <div class="modal-stat"><span class="modal-stat__label">Total Revenue</span><span class="modal-stat__value">${fmtCurrency(totalRev)}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Top Region</span><span class="modal-stat__value">${regions[0][0]}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Top Margin</span><span class="modal-stat__value">${cats[0][1].margin.toFixed(1)}%</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Top AOV Segment</span><span class="modal-stat__value">${segs[0][0]}</span></div>
            </div>
            <h3 class="modal-section-title">Strategic Recommendations</h3>
            <table class="modal-table">
                <thead><tr><th>Area</th><th>Insight</th><th>Action</th><th>Priority</th></tr></thead>
                <tbody>
                    <tr><td>Revenue</td><td>${regions[0][0]} leads with ${(regions[0][1].revenue / totalRev * 100).toFixed(0)}% share</td><td>Protect market position, explore adjacent markets</td><td>🔴 High</td></tr>
                    <tr><td>Growth</td><td>${regions[regions.length - 1][0]} is the smallest region</td><td>Increase marketing investment, localize offers</td><td>🟡 Medium</td></tr>
                    <tr><td>Margins</td><td>${cats[0][0]} achieves ${cats[0][1].margin.toFixed(0)}% margin</td><td>Promote high-margin products, optimize pricing</td><td>🔴 High</td></tr>
                    <tr><td>Loyalty</td><td>Members spend significantly more</td><td>Expand rewards program, drive enrollments</td><td>🔴 High</td></tr>
                    <tr><td>AOV</td><td>${segs[0][0]} have highest AOV at ${fmtCurrencySmall(segs[0][1].aov)}</td><td>Cross-sell to lower segments, personalize recommendations</td><td>🟡 Medium</td></tr>
                    <tr><td>Efficiency</td><td>Monitor CAC trends monthly</td><td>A/B test campaigns, optimize channel mix</td><td>🟢 Ongoing</td></tr>
                </tbody>
            </table>
            <h3 class="modal-section-title">Regional Revenue Distribution</h3>
            <div class="modal-chart-wrap"><canvas id="modal-canvas"></canvas></div>`;

    modalChart = new Chart(document.getElementById('modal-canvas'), {
      type: 'bar',
      data: {
        labels: regions.map(([r]) => r),
        datasets: [{
          label: 'Revenue',
          data: regions.map(([, d]) => d.revenue),
          backgroundColor: CHART_COLORS.map(c => c + 'CC'),
          borderColor: CHART_COLORS, borderWidth: 2, borderRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => `${c.label}: ${fmtCurrency(c.raw)} (${(c.raw / totalRev * 100).toFixed(1)}%)` } }
        },
        scales: {
          x: { ticks: { callback: v => fmtCurrency(v) }, grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  function buildHeatmapDetail(body, data) {
    const regions = Object.entries(data.regions).sort((a, b) => b[1].revenue - a[1].revenue);
    const totalRev = regions.reduce((s, [, d]) => s + d.revenue, 0);
    const totalStores = regions.reduce((s, [, d]) => s + d.storeCount, 0);
    const totalCustomers = regions.reduce((s, [, d]) => s + d.customers, 0);

    body.innerHTML = `
            <div class="modal-stat-grid">
                <div class="modal-stat"><span class="modal-stat__label">Total Revenue</span><span class="modal-stat__value">${fmtCurrency(totalRev)}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Total Stores</span><span class="modal-stat__value">${totalStores.toLocaleString()}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Total Customers</span><span class="modal-stat__value">${fmtNum(totalCustomers)}</span></div>
                <div class="modal-stat"><span class="modal-stat__label">Regions</span><span class="modal-stat__value">${regions.length}</span></div>
            </div>
            <h3 class="modal-section-title">Revenue by Region — Detailed</h3>
            <table class="modal-table">
                <thead><tr><th>Region</th><th>Revenue</th><th>Share</th><th>Stores</th><th>Customers</th><th>Rev/Store</th></tr></thead>
                <tbody>${regions.map(([r, d]) => `<tr>
                    <td>${r}</td>
                    <td class="highlight">${fmtCurrency(d.revenue)}</td>
                    <td>${(d.revenue / totalRev * 100).toFixed(1)}%</td>
                    <td>${d.storeCount.toLocaleString()}</td>
                    <td>${fmtNum(d.customers)}</td>
                    <td class="gold">${fmtCurrency(d.revenue / d.storeCount)}</td>
                </tr>`).join('')}</tbody>
            </table>`;
  }

  // ─── Wire chart tile clicks ───
  function wireModalClicks(data, periodMonths) {
    const bindings = {
      'tile-heatmap': () => openModal('Global Revenue Heatmap', 'Regional revenue distribution, store counts, and per-store efficiency', b => buildHeatmapDetail(b, data)),
      'tile-region': () => openModal('Revenue by Region', 'Detailed regional revenue breakdown and trends', b => buildRegionDetail(b, data)),
      'tile-category': () => openModal('Profit Margin by Category', 'Category-level margin analysis and cost breakdown', b => buildCategoryDetail(b, data)),
      'tile-loyalty': () => openModal('Loyalty vs Non-Loyalty', 'Member spending uplift analysis across categories', b => buildLoyaltyDetail(b, data)),
      'tile-marketing': () => openModal('Marketing Spend vs Growth', 'Customer acquisition cost trends and efficiency', b => buildMarketingDetail(b, data, periodMonths)),
      'tile-aov': () => openModal('AOV by Customer Segment', 'Segment-level AOV analysis and strategic recommendations', b => buildAOVDetail(b, data)),
      'tile-traffic': () => openModal('Daily Store Traffic', 'Transaction volume analysis and daily performance', b => buildTrafficDetail(b, data)),
      'tile-insights': () => openModal('Performance Insights', 'Strategic analysis and recommendations', b => buildInsightsDetail(b, data))
    };

    Object.entries(bindings).forEach(([id, handler]) => {
      const el = document.getElementById(id);
      if (el) {
        el.onclick = (e) => {
          // Don't open modal when clicking links or interactive elements
          if (e.target.closest('a, button, select')) return;
          handler();
        };
      }
    });
  }

  // ─── What-If Simulator ───
  function buildWhatIfSimulator(body, data) {
    const regions = Object.entries(data.regions);
    const baseRevenue = regions.reduce((s, [, d]) => s + d.revenue, 0);
    const baseCogs = regions.reduce((s, [, d]) => s + d.cogs, 0);
    const baseCustomers = regions.reduce((s, [, d]) => s + d.customers, 0);
    const baseOrders = regions.reduce((s, [, d]) => s + d.orders, 0);
    const baseStores = regions.reduce((s, [, d]) => s + d.storeCount, 0);
    const baseGP = baseRevenue - baseCogs;
    const baseAOV = baseOrders > 0 ? baseRevenue / baseOrders : 0;
    const baseMktSpend = data.marketing.reduce((s, m) => s + m.spend, 0);
    const baseNewCust = data.marketing.reduce((s, m) => s + m.newCustomers, 0);
    const baseCAC = baseNewCust > 0 ? baseMktSpend / baseNewCust : 0;

    const sliders = [
      { id: 'marketing', label: '📢 Marketing Spend', desc: 'Invest more → acquire more customers (diminishing returns)', min: -50, max: 100, val: 0, unit: '%' },
      { id: 'stores', label: '🏪 Store Expansion', desc: 'More stores → more reach and revenue capacity', min: -20, max: 50, val: 0, unit: '%' },
      { id: 'pricing', label: '💰 Average Pricing', desc: 'Higher prices → more revenue per order but fewer orders', min: -30, max: 30, val: 0, unit: '%' },
      { id: 'loyalty', label: '⭐ Loyalty Adoption', desc: 'More loyalty members → higher AOV from uplift', min: -20, max: 80, val: 0, unit: '%' },
      { id: 'efficiency', label: '⚙️ Operational Efficiency', desc: 'Reduce COGS through supply chain optimization', min: -5, max: 25, val: 0, unit: '%' }
    ];

    body.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
                <p style="font-size:.78rem; color:var(--text-secondary)">Adjust the levers below to see projected financial impact</p>
                <button class="whatif-reset-btn" id="whatif-reset">↺ Reset All</button>
            </div>
            <div id="whatif-sliders">
                ${sliders.map(s => `
                    <div class="whatif-slider-group">
                        <div class="whatif-slider-header">
                            <span class="whatif-slider-label">${s.label}</span>
                            <span class="whatif-slider-value" id="whatif-val-${s.id}">${s.val >= 0 ? '+' : ''}${s.val}%</span>
                        </div>
                        <div class="whatif-slider-desc">${s.desc}</div>
                        <input type="range" class="whatif-slider" id="whatif-${s.id}" min="${s.min}" max="${s.max}" value="${s.val}" step="1">
                    </div>
                `).join('')}
            </div>
            <h3 class="modal-section-title">Projected Impact</h3>
            <div class="whatif-impact-grid" id="whatif-impact"></div>
            <h3 class="modal-section-title" style="margin-top:24px">Current vs Projected</h3>
            <div class="modal-chart-wrap"><canvas id="modal-canvas"></canvas></div>
        `;

    function calculate() {
      const mkt = parseInt(document.getElementById('whatif-marketing').value) / 100;
      const str = parseInt(document.getElementById('whatif-stores').value) / 100;
      const prc = parseInt(document.getElementById('whatif-pricing').value) / 100;
      const loy = parseInt(document.getElementById('whatif-loyalty').value) / 100;
      const eff = parseInt(document.getElementById('whatif-efficiency').value) / 100;

      // Business logic:
      // Marketing → customers (diminishing returns: sqrt scaling)
      const mktMultiplier = 1 + (mkt > 0 ? Math.sqrt(mkt) * 0.7 : mkt * 0.8);
      const projNewCust = baseNewCust * mktMultiplier;
      const projMktSpend = baseMktSpend * (1 + mkt);
      const projCAC = projNewCust > 0 ? projMktSpend / projNewCust : 0;

      // Stores → revenue grows proportionally but with 80% efficiency on new stores
      const storeMultiplier = 1 + str * 0.8;

      // Pricing → revenue up but orders slightly down (elasticity ~0.3)
      const priceMultiplier = 1 + prc;
      const orderElasticity = 1 - (prc * 0.3);

      // Loyalty → AOV uplift (based on current ~35% member uplift)
      const loyaltyAOVBoost = 1 + loy * 0.15;

      // Efficiency → COGS reduction
      const cogsMultiplier = 1 - eff;

      // Calculate projected values
      const projOrders = baseOrders * storeMultiplier * orderElasticity * mktMultiplier * 0.5 + baseOrders * 0.5;
      const projAOV = baseAOV * priceMultiplier * loyaltyAOVBoost;
      const projRevenue = projOrders * projAOV;
      const projCogs = baseCogs * storeMultiplier * cogsMultiplier * (projRevenue / baseRevenue) * 0.5 + baseCogs * cogsMultiplier * 0.5;
      const projGP = projRevenue - projCogs;
      const projCustomers = baseCustomers * mktMultiplier * storeMultiplier * 0.3 + baseCustomers * 0.7;

      return {
        revenue: { before: baseRevenue, after: projRevenue },
        grossProfit: { before: baseGP, after: projGP },
        customers: { before: baseCustomers, after: projCustomers },
        orders: { before: baseOrders, after: projOrders },
        aov: { before: baseAOV, after: projAOV },
        cac: { before: baseCAC, after: projCAC }
      };
    }

    function renderImpact() {
      const proj = calculate();

      const metrics = [
        { key: 'revenue', label: 'Projected Revenue', fmt: fmtCurrency },
        { key: 'grossProfit', label: 'Gross Profit', fmt: fmtCurrency },
        { key: 'customers', label: 'Total Customers', fmt: fmtNum },
        { key: 'orders', label: 'Total Orders', fmt: fmtNum },
        { key: 'aov', label: 'Avg Order Value', fmt: fmtCurrencySmall },
        { key: 'cac', label: 'Customer Acq. Cost', fmt: fmtCurrency, invert: true }
      ];

      const impactDiv = document.getElementById('whatif-impact');
      impactDiv.innerHTML = metrics.map(m => {
        const p = proj[m.key];
        const delta = p.before !== 0 ? ((p.after - p.before) / Math.abs(p.before) * 100) : 0;
        const isPos = m.invert ? delta < 0 : delta > 0;
        const cardClass = Math.abs(delta) < 0.1 ? '' : isPos ? 'whatif-impact-card--positive' : 'whatif-impact-card--negative';
        return `<div class="whatif-impact-card ${cardClass}">
                    <div class="whatif-impact-card__label">${m.label}</div>
                    <div class="whatif-impact-card__before">Current: ${m.fmt(p.before)}</div>
                    <div class="whatif-impact-card__value">${m.fmt(p.after)}</div>
                    <div class="whatif-impact-card__delta ${isPos ? 'whatif-impact-card__delta--up' : 'whatif-impact-card__delta--down'}">
                        ${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)}%
                    </div>
                </div>`;
      }).join('');

      // Chart
      if (modalChart) { modalChart.destroy(); modalChart = null; }
      const labels = metrics.map(m => m.label);
      const currentData = metrics.map(m => proj[m.key].before);
      const projData = metrics.map(m => proj[m.key].after);
      const maxVals = currentData.map((v, i) => Math.max(v, projData[i]));
      const normCurrent = currentData.map((v, i) => maxVals[i] > 0 ? (v / maxVals[i] * 100) : 0);
      const normProj = projData.map((v, i) => maxVals[i] > 0 ? (v / maxVals[i] * 100) : 0);

      modalChart = new Chart(document.getElementById('modal-canvas'), {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Current',
              data: normCurrent,
              backgroundColor: 'rgba(139, 157, 175, .5)',
              borderColor: '#8B9DAF',
              borderWidth: 1, borderRadius: 4, borderSkipped: false
            },
            {
              label: 'Projected',
              data: normProj,
              backgroundColor: '#00704ACC',
              borderColor: '#00704A',
              borderWidth: 1, borderRadius: 4, borderSkipped: false
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle' } },
            tooltip: {
              callbacks: {
                label: c => {
                  const idx = c.dataIndex;
                  const raw = c.datasetIndex === 0 ? currentData[idx] : projData[idx];
                  const m = metrics[idx];
                  return c.dataset.label + ': ' + m.fmt(raw);
                }
              }
            }
          },
          scales: {
            x: { max: 115, ticks: { callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,.04)' } },
            y: { grid: { display: false }, ticks: { font: { size: 10 } } }
          }
        }
      });
    }

    // Wire slider events
    sliders.forEach(s => {
      const slider = document.getElementById(`whatif-${s.id}`);
      const valDisplay = document.getElementById(`whatif-val-${s.id}`);
      slider.addEventListener('input', () => {
        const v = parseInt(slider.value);
        valDisplay.textContent = (v >= 0 ? '+' : '') + v + '%';
        valDisplay.style.color = v > 0 ? 'var(--positive)' : v < 0 ? 'var(--negative)' : 'var(--sb-green-light)';
        renderImpact();
      });
    });

    // Reset button
    document.getElementById('whatif-reset').addEventListener('click', () => {
      sliders.forEach(s => {
        const slider = document.getElementById(`whatif-${s.id}`);
        const valDisplay = document.getElementById(`whatif-val-${s.id}`);
        slider.value = 0;
        valDisplay.textContent = '+0%';
        valDisplay.style.color = 'var(--sb-green-light)';
      });
      renderImpact();
    });

    renderImpact();
  }

  // ─── Region Comparison Mode ───
  function buildRegionComparison(body, data) {
    const regionNames = Object.keys(data.regions).sort();
    const defaultA = regionNames[0] || 'North America';
    const defaultB = regionNames[1] || 'Europe';

    // Build selector HTML
    body.innerHTML = `
            <div class="compare-selectors">
                <select id="compare-region-a">
                    ${regionNames.map(r => `<option value="${r}" ${r === defaultA ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
                <span class="compare-vs">VS</span>
                <select id="compare-region-b">
                    ${regionNames.map(r => `<option value="${r}" ${r === defaultB ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
            </div>
            <div id="compare-results"></div>
        `;

    function renderComparison() {
      const regionA = document.getElementById('compare-region-a').value;
      const regionB = document.getElementById('compare-region-b').value;
      const a = data.regions[regionA];
      const b = data.regions[regionB];
      if (!a || !b) return;

      const results = document.getElementById('compare-results');

      const gpmA = ((a.revenue - a.cogs) / a.revenue * 100);
      const gpmB = ((b.revenue - b.cogs) / b.revenue * 100);
      const rpsA = a.revenue / a.storeCount;
      const rpsB = b.revenue / b.storeCount;
      const cpsA = a.customers / a.storeCount;
      const cpsB = b.customers / b.storeCount;

      // Monthly growth (last 3 vs prior 3)
      const growthCalc = (mr) => {
        if (mr.length < 6) return 0;
        const recent = mr.slice(-3).reduce((s, v) => s + v, 0);
        const prior = mr.slice(-6, -3).reduce((s, v) => s + v, 0);
        return prior > 0 ? ((recent - prior) / prior * 100) : 0;
      };
      const growthA = growthCalc(a.monthlyRevenue);
      const growthB = growthCalc(b.monthlyRevenue);

      const metrics = [
        { label: 'Revenue', a: a.revenue, b: b.revenue, fmt: fmtCurrency, higherWins: true },
        { label: 'COGS', a: a.cogs, b: b.cogs, fmt: fmtCurrency, higherWins: false },
        { label: 'Gross Margin', a: gpmA, b: gpmB, fmt: v => v.toFixed(1) + '%', higherWins: true },
        { label: 'Customers', a: a.customers, b: b.customers, fmt: fmtNum, higherWins: true },
        { label: 'Orders', a: a.orders, b: b.orders, fmt: fmtNum, higherWins: true },
        { label: 'Stores', a: a.storeCount, b: b.storeCount, fmt: v => v.toLocaleString(), higherWins: true },
        { label: 'Rev / Store', a: rpsA, b: rpsB, fmt: fmtCurrency, higherWins: true },
        { label: 'Customers / Store', a: cpsA, b: cpsB, fmt: v => Math.round(v).toLocaleString(), higherWins: true },
        { label: 'Quarterly Growth', a: growthA, b: growthB, fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1) + '%', higherWins: true }
      ];

      const winsA = metrics.filter(m => m.higherWins ? m.a > m.b : m.a < m.b).length;
      const winsB = metrics.filter(m => m.higherWins ? m.b > m.a : m.b < m.a).length;

      const renderMetricRow = (m) => {
        const aWins = m.higherWins ? m.a > m.b : m.a < m.b;
        const bWins = m.higherWins ? m.b > m.a : m.b < m.a;
        return `<div class="compare-metric-row">
                    <span class="compare-metric-row__value ${aWins ? 'compare-metric-row__value--winner' : ''}">${aWins ? '👑 ' : ''}${m.fmt(m.a)}</span>
                    <span class="compare-metric-row__label">${m.label}</span>
                    <span class="compare-metric-row__value ${bWins ? 'compare-metric-row__value--winner' : ''}">${m.fmt(m.b)}${bWins ? ' 👑' : ''}</span>
                </div>`;
      };

      results.innerHTML = `
                <div class="compare-grid">
                    <div class="compare-card ${winsA > winsB ? 'compare-card--winner' : ''}">
                        <div class="compare-card__region">${regionA} ${winsA > winsB ? '🏆' : ''}</div>
                        <div class="compare-metric-row__value" style="font-size:1.3rem; color:var(--sb-green-light)">${fmtCurrency(a.revenue)}</div>
                        <div style="font-size:.7rem; color:var(--text-muted); margin-top:4px">Total Revenue • ${a.storeCount.toLocaleString()} stores</div>
                    </div>
                    <div class="compare-card ${winsB > winsA ? 'compare-card--winner' : ''}">
                        <div class="compare-card__region">${regionB} ${winsB > winsA ? '🏆' : ''}</div>
                        <div class="compare-metric-row__value" style="font-size:1.3rem; color:var(--sb-green-light)">${fmtCurrency(b.revenue)}</div>
                        <div style="font-size:.7rem; color:var(--text-muted); margin-top:4px">Total Revenue • ${b.storeCount.toLocaleString()} stores</div>
                    </div>
                </div>

                <h3 class="modal-section-title">Head-to-Head Metrics</h3>
                <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:16px; margin-bottom:20px">
                    ${metrics.map(renderMetricRow).join('')}
                </div>

                <h3 class="modal-section-title">Comparison Chart</h3>
                <div class="modal-chart-wrap"><canvas id="modal-canvas"></canvas></div>

                <div class="compare-summary">
                    <div class="compare-summary-item">
                        <div class="compare-summary-item__label">Metrics Won by ${regionA}</div>
                        <div class="compare-summary-item__value">${winsA} / ${metrics.length}</div>
                    </div>
                    <div class="compare-summary-item">
                        <div class="compare-summary-item__label">Metrics Won by ${regionB}</div>
                        <div class="compare-summary-item__value">${winsB} / ${metrics.length}</div>
                    </div>
                    <div class="compare-summary-item">
                        <div class="compare-summary-item__label">Revenue Difference</div>
                        <div class="compare-summary-item__value">${fmtCurrency(Math.abs(a.revenue - b.revenue))}</div>
                    </div>
                    <div class="compare-summary-item">
                        <div class="compare-summary-item__label">Overall Winner</div>
                        <div class="compare-summary-item__value">${winsA > winsB ? regionA : winsB > winsA ? regionB : 'Tied'} ${winsA !== winsB ? '🏆' : '🤝'}</div>
                    </div>
                </div>
            `;

      // Comparison bar chart
      if (modalChart) { modalChart.destroy(); modalChart = null; }
      const chartMetrics = ['Revenue', 'COGS', 'Customers', 'Orders', 'Stores'];
      const chartDataA = [a.revenue, a.cogs, a.customers, a.orders, a.storeCount];
      const chartDataB = [b.revenue, b.cogs, b.customers, b.orders, b.storeCount];
      // Normalize to percentages (relative to max of each pair)
      const maxVals = chartDataA.map((v, i) => Math.max(v, chartDataB[i]));
      const normA = chartDataA.map((v, i) => maxVals[i] > 0 ? (v / maxVals[i] * 100) : 0);
      const normB = chartDataB.map((v, i) => maxVals[i] > 0 ? (v / maxVals[i] * 100) : 0);

      modalChart = new Chart(document.getElementById('modal-canvas'), {
        type: 'bar',
        data: {
          labels: chartMetrics,
          datasets: [
            {
              label: regionA,
              data: normA,
              backgroundColor: '#00704ACC',
              borderColor: '#00704A',
              borderWidth: 1, borderRadius: 6, borderSkipped: false
            },
            {
              label: regionB,
              data: normB,
              backgroundColor: '#CBA258CC',
              borderColor: '#CBA258',
              borderWidth: 1, borderRadius: 6, borderSkipped: false
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle' } },
            tooltip: {
              callbacks: {
                label: c => {
                  const idx = c.dataIndex;
                  const raw = c.datasetIndex === 0 ? chartDataA[idx] : chartDataB[idx];
                  const label = chartMetrics[idx];
                  if (label === 'Revenue' || label === 'COGS') return c.dataset.label + ': ' + fmtCurrency(raw);
                  return c.dataset.label + ': ' + fmtNum(raw);
                }
              }
            }
          },
          scales: {
            x: { max: 110, ticks: { callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,.04)' } },
            y: { grid: { display: false } }
          }
        }
      });
    }

    renderComparison();

    // Re-render on selector change
    document.getElementById('compare-region-a').addEventListener('change', renderComparison);
    document.getElementById('compare-region-b').addEventListener('change', renderComparison);
  }

  // ─── Comprehensive Financial Report Generator ───
  function generateReport(data, periodMonths) {
    const kpis = computeKPIs(data, 'all', periodMonths);
    const now = new Date();
    const reportDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const reportTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const periodLabel = periodMonths === 12 ? 'Last 12 Months' : periodMonths === 6 ? 'Last 6 Months' : periodMonths === 3 ? 'Last 3 Months' : 'This Month';
    const sym = CURRENCY_SYMBOLS[activeCurrency] || '$';

    // Computed data
    const regions = Object.entries(data.regions).sort((a, b) => b[1].revenue - a[1].revenue);
    const totalRevenue = regions.reduce((s, [, d]) => s + d.revenue, 0);
    const totalCogs = regions.reduce((s, [, d]) => s + d.cogs, 0);
    const totalCustomers = regions.reduce((s, [, d]) => s + d.customers, 0);
    const totalOrders = regions.reduce((s, [, d]) => s + d.orders, 0);
    const totalStores = regions.reduce((s, [, d]) => s + d.storeCount, 0);
    const grossProfit = totalRevenue - totalCogs;
    const overallGPM = (grossProfit / totalRevenue * 100);

    const categories = Object.entries(data.categories).sort((a, b) => b[1].margin - a[1].margin);
    const segments = Object.entries(data.segments).sort((a, b) => b[1].aov - a[1].aov);
    const totalSegRevenue = segments.reduce((s, [, d]) => s + d.revenue, 0);
    const totalSegOrders = segments.reduce((s, [, d]) => s + d.orders, 0);

    const totalMktSpend = data.marketing.reduce((s, m) => s + m.spend, 0);
    const totalNewCustomers = data.marketing.reduce((s, m) => s + m.newCustomers, 0);
    const avgCAC = totalMktSpend / totalNewCustomers;

    const avgMemberAOV = CATEGORIES.reduce((s, c) => s + data.loyalty.members[c], 0) / CATEGORIES.length;
    const avgNonMemberAOV = CATEGORIES.reduce((s, c) => s + data.loyalty.nonMembers[c], 0) / CATEGORIES.length;
    const loyaltyUplift = ((avgMemberAOV - avgNonMemberAOV) / avgNonMemberAOV * 100);

    const avgDailyTx = data.dailyTraffic.reduce((s, d) => s + d.transactions, 0) / data.dailyTraffic.length;
    const peakDay = [...data.dailyTraffic].sort((a, b) => b.transactions - a.transactions)[0];
    const lowDay = [...data.dailyTraffic].sort((a, b) => a.transactions - b.transactions)[0];

    // Revenue change delta
    const revDelta = kpis.revenue.prev > 0 ? ((kpis.revenue.value - kpis.revenue.prev) / kpis.revenue.prev * 100) : 0;
    const retentionRate = kpis.retention.value;

    // Growth trend from monthly data
    const firstHalf = data.monthly.slice(0, 6).reduce((s, m) => s + m.revenue, 0);
    const secondHalf = data.monthly.slice(6).reduce((s, m) => s + m.revenue, 0);
    const halfGrowth = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf * 100) : 0;

    const reportHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Starbucks Financial Report — ${reportDate}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', system-ui, sans-serif; background: #f8f9fa; color: #1a1a2e; line-height: 1.6; }
        .report { max-width: 900px; margin: 0 auto; padding: 40px; }
        .report-header { text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 3px solid #00704A; }
        .report-header img { width: 56px; height: 56px; border-radius: 50%; margin-bottom: 12px; }
        .report-header h1 { font-family: 'Sora', sans-serif; font-size: 1.8rem; font-weight: 700; color: #00704A; margin-bottom: 4px; }
        .report-header .subtitle { font-size: .9rem; color: #666; margin-bottom: 12px; }
        .report-header .meta { display: flex; justify-content: center; gap: 24px; font-size: .78rem; color: #888; }
        .report-header .meta span { display: flex; align-items: center; gap: 4px; }

        h2 { font-family: 'Sora', sans-serif; font-size: 1.15rem; font-weight: 700; color: #1E3932; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #e8e8e8; display: flex; align-items: center; gap: 8px; }
        h2 .section-num { background: #00704A; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: .75rem; flex-shrink: 0; }

        .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
        .kpi-box { background: #fff; border: 1px solid #e8e8e8; border-radius: 10px; padding: 16px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,.04); }
        .kpi-box .label { font-size: .65rem; text-transform: uppercase; letter-spacing: .07em; color: #888; margin-bottom: 4px; }
        .kpi-box .value { font-family: 'Sora', sans-serif; font-size: 1.25rem; font-weight: 700; color: #00704A; }
        .kpi-box .delta { font-size: .72rem; font-weight: 600; margin-top: 2px; }
        .kpi-box .delta.up { color: #059669; }
        .kpi-box .delta.down { color: #DC2626; }

        table { width: 100%; border-collapse: collapse; font-size: .8rem; margin-bottom: 20px; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.04); }
        thead th { background: #1E3932; color: #fff; padding: 10px 12px; text-align: left; font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; }
        tbody td { padding: 9px 12px; border-bottom: 1px solid #f0f0f0; }
        tbody tr:hover { background: #f8fffe; }
        .highlight { color: #00704A; font-weight: 600; }
        .gold { color: #B8860B; font-weight: 600; }
        .warn { color: #DC2626; font-weight: 600; }

        .insight-box { background: #f0faf5; border: 1px solid #d1fae5; border-radius: 10px; padding: 16px 20px; margin-bottom: 12px; }
        .insight-box h4 { font-size: .85rem; font-weight: 600; color: #1E3932; margin-bottom: 4px; }
        .insight-box p { font-size: .78rem; color: #4a5d52; }

        .summary-box { background: linear-gradient(135deg, #1E3932, #00704A); color: #fff; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .summary-box h3 { font-family: 'Sora', sans-serif; font-size: 1rem; margin-bottom: 12px; }
        .summary-box ul { padding-left: 20px; font-size: .82rem; line-height: 1.8; }
        .summary-box li { opacity: .92; }

        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e8e8e8; font-size: .72rem; color: #999; }
        .print-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 24px; background: #00704A; color: #fff; border: none; border-radius: 8px; font-family: inherit; font-size: .85rem; font-weight: 600; cursor: pointer; margin-bottom: 24px; transition: background .2s; }
        .print-btn:hover { background: #1E3932; }
        .no-print { }
        @media print {
            body { background: #fff; }
            .report { padding: 20px; }
            .no-print { display: none !important; }
            .kpi-box, table, .insight-box, .summary-box { break-inside: avoid; }
            h2 { break-after: avoid; }
        }
    </style>
</head>
<body>
    <div class="report">
        <div class="no-print" style="text-align:center; margin-bottom: 16px;">
            <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
        </div>

        <div class="report-header">
            <h1>☕ Starbucks Corporation</h1>
            <div class="subtitle">Comprehensive Financial Performance Report</div>
            <div class="meta">
                <span>📅 ${reportDate} at ${reportTime}</span>
                <span>📊 Period: ${periodLabel}</span>
                <span>💱 Currency: ${activeCurrency} (${sym})</span>
            </div>
        </div>

        <!-- 1. Executive Summary -->
        <h2><span class="section-num">1</span> Executive Summary</h2>
        <div class="kpi-grid">
            <div class="kpi-box">
                <div class="label">Total Revenue</div>
                <div class="value">${fmtCurrency(kpis.revenue.value)}</div>
                <div class="delta ${revDelta >= 0 ? 'up' : 'down'}">${revDelta >= 0 ? '▲' : '▼'} ${Math.abs(revDelta).toFixed(1)}% vs prior period</div>
            </div>
            <div class="kpi-box">
                <div class="label">Gross Profit</div>
                <div class="value">${fmtCurrency(grossProfit)}</div>
                <div class="delta up">${overallGPM.toFixed(1)}% margin</div>
            </div>
            <div class="kpi-box">
                <div class="label">Total Customers</div>
                <div class="value">${fmtNum(totalCustomers)}</div>
                <div class="delta ${retentionRate > 50 ? 'up' : 'down'}">${retentionRate.toFixed(1)}% retention</div>
            </div>
            <div class="kpi-box">
                <div class="label">Total Orders</div>
                <div class="value">${fmtNum(totalOrders)}</div>
                <div class="delta up">AOV: ${fmtCurrencySmall(kpis.aov.value)}</div>
            </div>
            <div class="kpi-box">
                <div class="label">Global Stores</div>
                <div class="value">${fmtNum(totalStores)}</div>
                <div class="delta up">${regions.length} regions</div>
            </div>
            <div class="kpi-box">
                <div class="label">Avg Daily Traffic</div>
                <div class="value">${Math.round(avgDailyTx).toLocaleString()}</div>
                <div class="delta up">transactions/day</div>
            </div>
        </div>

        <div class="summary-box">
            <h3>📋 Key Takeaways</h3>
            <ul>
                <li><strong>${regions[0][0]}</strong> remains the dominant market with ${(regions[0][1].revenue / totalRevenue * 100).toFixed(1)}% revenue share</li>
                <li>H2 revenue ${halfGrowth >= 0 ? 'grew' : 'declined'} <strong>${Math.abs(halfGrowth).toFixed(1)}%</strong> vs H1, indicating ${halfGrowth >= 0 ? 'positive momentum' : 'a potential slowdown'}</li>
                <li>Loyalty members spend <strong>${loyaltyUplift.toFixed(0)}% more</strong> per order — the program is a clear value driver</li>
                <li>Customer Acquisition Cost averaging <strong>${fmtCurrency(avgCAC)}</strong> per customer${avgCAC < 60 ? ' (within optimal range)' : ' (consider optimization)'}</li>
                <li>Overall Gross Profit Margin at <strong>${overallGPM.toFixed(1)}%</strong>${overallGPM > 60 ? ' — healthy profitability' : ' — monitor cost pressures'}</li>
            </ul>
        </div>

        <!-- 2. Regional Performance -->
        <h2><span class="section-num">2</span> Regional Revenue Performance</h2>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Region</th>
                    <th>Revenue</th>
                    <th>% Share</th>
                    <th>COGS</th>
                    <th>Gross Margin</th>
                    <th>Customers</th>
                    <th>Stores</th>
                    <th>Rev/Store</th>
                </tr>
            </thead>
            <tbody>
                ${regions.map(([r, d], i) => {
      const gpm = ((d.revenue - d.cogs) / d.revenue * 100);
      return `<tr>
                        <td>${i + 1}</td>
                        <td><strong>${r}</strong></td>
                        <td class="highlight">${fmtCurrency(d.revenue)}</td>
                        <td>${(d.revenue / totalRevenue * 100).toFixed(1)}%</td>
                        <td>${fmtCurrency(d.cogs)}</td>
                        <td class="${gpm >= 40 ? 'highlight' : 'warn'}">${gpm.toFixed(1)}%</td>
                        <td>${fmtNum(d.customers)}</td>
                        <td>${d.storeCount.toLocaleString()}</td>
                        <td class="gold">${fmtCurrency(d.revenue / d.storeCount)}</td>
                    </tr>`;
    }).join('')}
                <tr style="background:#f0faf5; font-weight:600;">
                    <td></td>
                    <td>TOTAL</td>
                    <td class="highlight">${fmtCurrency(totalRevenue)}</td>
                    <td>100%</td>
                    <td>${fmtCurrency(totalCogs)}</td>
                    <td class="highlight">${overallGPM.toFixed(1)}%</td>
                    <td>${fmtNum(totalCustomers)}</td>
                    <td>${totalStores.toLocaleString()}</td>
                    <td class="gold">${fmtCurrency(totalRevenue / totalStores)}</td>
                </tr>
            </tbody>
        </table>

        <div class="insight-box">
            <h4>📊 Regional Analysis</h4>
            <p>The top 3 regions (<strong>${regions.slice(0, 3).map(([r]) => r).join(', ')}</strong>) account for <strong>${(regions.slice(0, 3).reduce((s, [, d]) => s + d.revenue, 0) / totalRevenue * 100).toFixed(1)}%</strong> of total revenue.
            The highest revenue per store is <strong>${regions.sort((a, b) => (b[1].revenue / b[1].storeCount) - (a[1].revenue / a[1].storeCount))[0][0]}</strong> at <strong>${fmtCurrency(regions[0][1].revenue / regions[0][1].storeCount)}</strong>/store, suggesting strong per-unit economics.</p>
        </div>

        <!-- 3. Monthly Revenue Trend -->
        <h2><span class="section-num">3</span> Monthly Revenue Trend</h2>
        <table>
            <thead>
                <tr><th>Month</th><th>Revenue</th><th>COGS</th><th>Gross Profit</th><th>Margin %</th><th>Customers</th><th>Orders</th></tr>
            </thead>
            <tbody>
                ${data.monthly.map(m => {
      const gp = m.revenue - m.cogs;
      const mg = m.revenue > 0 ? (gp / m.revenue * 100) : 0;
      return `<tr>
                        <td><strong>${m.month}</strong></td>
                        <td class="highlight">${fmtCurrency(m.revenue)}</td>
                        <td>${fmtCurrency(m.cogs)}</td>
                        <td class="gold">${fmtCurrency(gp)}</td>
                        <td>${mg.toFixed(1)}%</td>
                        <td>${fmtNum(m.customers)}</td>
                        <td>${fmtNum(m.orders)}</td>
                    </tr>`;
    }).join('')}
            </tbody>
        </table>

        <!-- 4. Product Category Margins -->
        <h2><span class="section-num">4</span> Product Category Margin Analysis</h2>
        <table>
            <thead>
                <tr><th>Category</th><th>Revenue</th><th>COGS Est.</th><th>Gross Profit</th><th>Gross Margin</th><th>Performance</th></tr>
            </thead>
            <tbody>
                ${categories.map(([c, d]) => {
      const cogs = d.revenue * (1 - d.margin / 100);
      const gp = d.revenue - cogs;
      const rating = d.margin >= 75 ? '⭐ Excellent' : d.margin >= 65 ? '✅ Good' : d.margin >= 50 ? '📊 Average' : '⚠️ Watch';
      return `<tr>
                        <td><strong>${c}</strong></td>
                        <td class="highlight">${fmtCurrency(d.revenue)}</td>
                        <td>${fmtCurrency(cogs)}</td>
                        <td class="gold">${fmtCurrency(gp)}</td>
                        <td class="${d.margin >= 65 ? 'highlight' : 'warn'}">${d.margin.toFixed(1)}%</td>
                        <td>${rating}</td>
                    </tr>`;
    }).join('')}
            </tbody>
        </table>

        <div class="insight-box">
            <h4>🏆 Category Insights</h4>
            <p><strong>${categories[0][0]}</strong> leads with ${categories[0][1].margin.toFixed(1)}% margin, while <strong>${categories[categories.length - 1][0]}</strong> has the lowest at ${categories[categories.length - 1][1].margin.toFixed(1)}%.
            The margin spread of ${(categories[0][1].margin - categories[categories.length - 1][1].margin).toFixed(1)} percentage points suggests significant category-level cost structure differences.</p>
        </div>

        <!-- 5. Customer Segment Analysis -->
        <h2><span class="section-num">5</span> Customer Segment Analysis</h2>
        <table>
            <thead>
                <tr><th>Segment</th><th>Average Order Value</th><th>Orders</th><th>Revenue</th><th>Revenue Share</th></tr>
            </thead>
            <tbody>
                ${segments.map(([s, d]) => `<tr>
                    <td><strong>${s}</strong></td>
                    <td class="highlight">${fmtCurrencySmall(d.aov)}</td>
                    <td>${fmtNum(d.orders)}</td>
                    <td class="gold">${fmtCurrency(d.revenue)}</td>
                    <td>${d.share.toFixed(1)}%</td>
                </tr>`).join('')}
                <tr style="background:#f0faf5; font-weight:600;">
                    <td>WEIGHTED TOTAL</td>
                    <td class="highlight">${fmtCurrencySmall(totalSegOrders > 0 ? totalSegRevenue / totalSegOrders : 0)}</td>
                    <td>${fmtNum(totalSegOrders)}</td>
                    <td class="gold">${fmtCurrency(totalSegRevenue)}</td>
                    <td>100%</td>
                </tr>
            </tbody>
        </table>

        <!-- 6. Loyalty Program -->
        <h2><span class="section-num">6</span> Loyalty Program Impact</h2>
        <table>
            <thead>
                <tr><th>Category</th><th>Member AOV</th><th>Non-Member AOV</th><th>Uplift</th><th>Impact</th></tr>
            </thead>
            <tbody>
                ${CATEGORIES.map(c => {
      const mAOV = data.loyalty.members[c];
      const nmAOV = data.loyalty.nonMembers[c];
      const uplift = ((mAOV - nmAOV) / nmAOV * 100);
      return `<tr>
                        <td><strong>${c}</strong></td>
                        <td class="highlight">${fmtCurrencySmall(mAOV)}</td>
                        <td>${fmtCurrencySmall(nmAOV)}</td>
                        <td class="gold">+${uplift.toFixed(1)}%</td>
                        <td>${uplift > 40 ? '🔥 High' : uplift > 25 ? '✅ Good' : '📊 Moderate'}</td>
                    </tr>`;
    }).join('')}
                <tr style="background:#f0faf5; font-weight:600;">
                    <td>AVERAGE</td>
                    <td class="highlight">${fmtCurrencySmall(avgMemberAOV)}</td>
                    <td>${fmtCurrencySmall(avgNonMemberAOV)}</td>
                    <td class="gold">+${loyaltyUplift.toFixed(1)}%</td>
                    <td>${loyaltyUplift > 30 ? '🔥 Strong Program' : '✅ Effective'}</td>
                </tr>
            </tbody>
        </table>

        <!-- 7. Marketing Performance -->
        <h2><span class="section-num">7</span> Marketing Spend & Acquisition</h2>
        <table>
            <thead>
                <tr><th>Month</th><th>Marketing Spend</th><th>New Customers</th><th>CAC</th><th>Cumulative Customers</th></tr>
            </thead>
            <tbody>
                ${data.marketing.map(m => {
      const cac = m.newCustomers > 0 ? m.spend / m.newCustomers : 0;
      return `<tr>
                        <td><strong>${m.month}</strong></td>
                        <td>${fmtCurrency(m.spend)}</td>
                        <td>${fmtNum(m.newCustomers)}</td>
                        <td class="${cac < 60 ? 'highlight' : 'warn'}">${fmtCurrency(cac)}</td>
                        <td class="gold">${fmtNum(m.totalCustomers)}</td>
                    </tr>`;
    }).join('')}
                <tr style="background:#f0faf5; font-weight:600;">
                    <td>TOTAL / AVG</td>
                    <td>${fmtCurrency(totalMktSpend)}</td>
                    <td>${fmtNum(totalNewCustomers)}</td>
                    <td class="highlight">${fmtCurrency(avgCAC)}</td>
                    <td class="gold">${fmtNum(data.marketing[data.marketing.length - 1].totalCustomers)}</td>
                </tr>
            </tbody>
        </table>

        <!-- 8. Traffic Analysis -->
        <h2><span class="section-num">8</span> Store Traffic Analysis</h2>
        <div class="kpi-grid">
            <div class="kpi-box">
                <div class="label">Avg Daily Transactions</div>
                <div class="value">${Math.round(avgDailyTx).toLocaleString()}</div>
            </div>
            <div class="kpi-box">
                <div class="label">Peak Day</div>
                <div class="value">${peakDay.date}</div>
                <div class="delta up">${peakDay.transactions.toLocaleString()} txns</div>
            </div>
            <div class="kpi-box">
                <div class="label">Lowest Day</div>
                <div class="value">${lowDay.date}</div>
                <div class="delta down">${lowDay.transactions.toLocaleString()} txns</div>
            </div>
        </div>

        <!-- 9. Strategic Recommendations -->
        <h2><span class="section-num">9</span> Strategic Recommendations</h2>
        <div class="insight-box">
            <h4>🚀 Growth Opportunities</h4>
            <p>• Expand in <strong>${regions[regions.length - 1][0]}</strong> and <strong>${regions[regions.length - 2][0]}</strong> — the smallest markets with room for growth.<br>
            • Invest in the Loyalty Program which drives a <strong>${loyaltyUplift.toFixed(0)}% AOV uplift</strong>.<br>
            • Push high-margin categories (<strong>${categories[0][0]}</strong>, <strong>${categories[1][0]}</strong>) through promotions.</p>
        </div>
        <div class="insight-box">
            <h4>⚠️ Risk Areas to Monitor</h4>
            <p>• <strong>${categories[categories.length - 1][0]}</strong> and <strong>${categories[categories.length - 2][0]}</strong> have lower margins — review supplier costs and pricing strategy.<br>
            • Customer Acquisition Cost of <strong>${fmtCurrency(avgCAC)}</strong> — monitor for upward trends that erode marketing ROI.<br>
            • Retention rate at <strong>${retentionRate.toFixed(1)}%</strong>${retentionRate < 50 ? ' is below 50% — focus on engagement and repeat visit programs.' : ' — maintain current engagement strategies.'}</p>
        </div>
        <div class="insight-box">
            <h4>💡 Operational Efficiency</h4>
            <p>• Top revenue-per-store region suggests opportunity to replicate best practices across lower-performing regions.<br>
            • Daily transaction variance between peak (${peakDay.transactions}) and low (${lowDay.transactions}) days — optimize staffing schedules accordingly.<br>
            • ${halfGrowth >= 0 ? 'Positive H2 momentum — capitalize with seasonal campaigns.' : 'H2 slowdown detected — consider promotional strategies to re-accelerate growth.'}</p>
        </div>

        <div class="footer">
            <p><strong>Starbucks Corporation — Internal Financial Report</strong></p>
            <p>Generated from the Starbucks Analytics Dashboard on ${reportDate} at ${reportTime}</p>
            <p>All figures in ${activeCurrency} (${sym}). Data is synthetically modeled for demonstration purposes.</p>
            <p>© ${now.getFullYear()} Starbucks Analytics Dashboard</p>
        </div>
    </div>
</body>
</html>`;

    // Open in new window
    const reportWindow = window.open('', '_blank', 'width=960,height=800');
    if (reportWindow) {
      reportWindow.document.write(reportHTML);
      reportWindow.document.close();
    } else {
      alert('Please allow pop-ups to view the report.');
    }
  }

  // ─── Init ───
  async function init() {
    const data = generateData();

    // Set current date
    const now = new Date();
    document.getElementById('current-date').textContent =
      now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    document.getElementById('footer-timestamp').textContent =
      now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    populateRegionFilter();
    renderAll(data, 'all', 12);
    wireModalClicks(data, 12);
    injectCSVButtons(data);

    // Fade in once the first render is painted — prevents flash during navigation from loading screen
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.body.classList.add('ready');
    }));

    // ─── Section Tabs ───
    let activeTab = 'all';

    function activateTab(tabGroup) {
      activeTab = tabGroup;
      // Update tab buttons
      document.querySelectorAll('.section-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabGroup);
      });
      // Show/hide chart tiles — 'all' shows everything
      const allTiles = document.querySelectorAll('.chart-tile[data-tab-group]');
      allTiles.forEach(tile => {
        tile.classList.remove('tab-expand');
        if (tabGroup === 'all' || tile.dataset.tabGroup === tabGroup) {
          tile.classList.add('tab-visible');
        } else {
          tile.classList.remove('tab-visible');
        }
      });

      // Smart layout:
      // • 'all' tab  → use the normal dense 2-column grid (no expand)
      // • single tab → count visible non-wide tiles:
      //     - 2 tiles  → side-by-side (no expand)
      //     - 1 tile   → full-width expand
      //     - 3+ tiles → pairs of 2 side-by-side, last odd tile expands
      if (tabGroup !== 'all') {
        const visibleNormal = [...allTiles].filter(
          t => t.classList.contains('tab-visible') && !t.classList.contains('chart-tile--wide')
        );
        visibleNormal.forEach((t, idx) => {
          // If total count is odd and this is the last tile → expand it
          if (visibleNormal.length % 2 !== 0 && idx === visibleNormal.length - 1) {
            t.classList.add('tab-expand');
          }
          // If there is only 1 tile → expand it
          if (visibleNormal.length === 1) {
            t.classList.add('tab-expand');
          }
        });
      }

      // Invalidate heatmap map size when geography or all tab is shown
      if ((tabGroup === 'geography' || tabGroup === 'all') && typeof heatmapMap !== 'undefined') {
        if (!heatmapMap) {
          // First reveal — initialize now that the container has real dimensions
          initHeatmapMap().then(() => {
            const region = document.getElementById('filter-region').value;
            const period = parseInt(document.getElementById('filter-period').value);
            renderAll(data, region, period);
            setTimeout(() => heatmapMap && heatmapMap.invalidateSize(), 200);
          });
        } else {
          setTimeout(() => heatmapMap.invalidateSize(), 150);
        }
      }

      // Resize all Chart.js instances so charts rendered while hidden get proper dimensions
      setTimeout(() => {
        Object.values(charts).forEach(chart => {
          if (chart && typeof chart.resize === 'function') {
            chart.resize();
          }
        });
      }, 100);
    }

    // Wire tab button click events
    document.querySelectorAll('.section-tab').forEach(btn => {
      btn.addEventListener('click', () => activateTab(btn.dataset.tab));
    });

    // ─── Compact View ───
    const execViewEl   = document.getElementById('exec-view');
    const execBtn      = document.getElementById('exec-view-toggle');
    const dashboard    = document.querySelector('.dashboard');
    let execCharts     = {};
    let execActive     = false;

    function buildExecKPIs(kpis) {
      const list = document.getElementById('exec-kpi-list');

      const delta = (cur, prev) => prev > 0 ? ((cur - prev) / prev) * 100 : 0;

      const items = [
        { label: 'Total Revenue',       value: fmtCurrency(kpis.revenue.value),          d: delta(kpis.revenue.value,   kpis.revenue.prev),   pos: true,  modal: 'region'    },
        { label: 'Gross Profit Margin', value: fmtPct(kpis.gpm.value),                   d: delta(kpis.gpm.value,       kpis.gpm.prev),       pos: true,  modal: 'category'  },
        { label: 'Customer Retention',  value: fmtPct(kpis.retention.value),              d: delta(kpis.retention.value, kpis.retention.prev), pos: true,  modal: 'loyalty'   },
        { label: 'Avg Order Value',     value: fmtCurrencySmall(kpis.aov.value),          d: delta(kpis.aov.value,       kpis.aov.prev),       pos: true,  modal: 'aov'       },
        { label: 'Acq. Cost (CAC)',     value: fmtCurrencySmall(kpis.cac.value),          d: delta(kpis.cac.value,       kpis.cac.prev),       pos: false, modal: 'marketing' },
        { label: 'Daily Transactions',  value: fmtNum(Math.round(kpis.traffic.value)),    d: delta(kpis.traffic.value,   kpis.traffic.prev),   pos: true,  modal: 'traffic'   },
      ];

      const expandIcon = `<svg class="exec-expand-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;

      list.innerHTML = items.map(i => {
        const isGood = i.pos ? i.d >= 0 : i.d <= 0;
        return `
        <div class="exec-kpi-card exec-kpi-card--clickable" data-exec-modal="${i.modal}" role="button" tabindex="0" aria-label="View details for ${i.label}">
          <div class="exec-kpi-card__top">
            <span class="exec-kpi-card__label">${i.label}</span>
            ${expandIcon}
          </div>
          <span class="exec-kpi-card__value">${i.value}</span>
          <span class="exec-kpi-card__delta ${isGood ? 'pos' : 'neg'}">
            ${i.d >= 0 ? '▲' : '▼'} ${Math.abs(i.d).toFixed(1)}% vs prior period
          </span>
        </div>`;
      }).join('');

      // Wire KPI card clicks
      list.querySelectorAll('.exec-kpi-card--clickable').forEach(card => {
        const handler = () => {
          const period = parseInt(document.getElementById('filter-period').value);
          const key = card.dataset.execModal;
          const modalMap = {
            region:    () => openModal('Revenue by Region',           'Detailed regional revenue breakdown and trends',              b => buildRegionDetail(b, data)),
            category:  () => openModal('Profit Margin by Category',   'Category-level margin analysis and cost breakdown',           b => buildCategoryDetail(b, data)),
            loyalty:   () => openModal('Customer Retention & Loyalty','Member spending uplift and retention analysis',               b => buildLoyaltyDetail(b, data)),
            aov:       () => openModal('Avg Order Value by Segment',  'Segment-level AOV analysis and strategic recommendations',    b => buildAOVDetail(b, data)),
            marketing: () => openModal('Customer Acquisition Cost',   'Marketing spend efficiency and CAC trends',                   b => buildMarketingDetail(b, data, period)),
            traffic:   () => openModal('Daily Store Traffic',         'Transaction volume analysis and daily performance',           b => buildTrafficDetail(b, data)),
          };
          if (modalMap[key]) modalMap[key]();
        };
        card.addEventListener('click', handler);
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); } });
      });
    }

    function buildExecCharts(data, periodMonths) {
      // destroy old
      Object.values(execCharts).forEach(c => c && c.destroy());
      execCharts = {};

      const mkt  = data.marketing.slice(-periodMonths);
      const cats = Object.entries(data.categories).sort((a, b) => b[1].margin - a[1].margin);
      const segs = Object.entries(data.segments).sort((a, b) => b[1].aov - a[1].aov);
      const baseOpts = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        animation: { duration: 700 }
      };

      // 1. Revenue line
      const revCtx = document.getElementById('exec-chart-revenue');
      if (revCtx) {
        execCharts.revenue = new Chart(revCtx, {
          type: 'line',
          data: {
            labels: mkt.map((_, i) => MONTHS[i]),
            datasets: [{
              data: mkt.map(m => m.spend * 12),
              borderColor: '#1E9E6E',
              backgroundColor: 'rgba(30,158,110,.15)',
              fill: true, tension: .4, pointRadius: 2,
              pointBackgroundColor: '#1E9E6E', borderWidth: 2
            }]
          },
          options: { ...baseOpts, scales: { x: { ticks: { font: { size: 9 } }, grid: { display: false } }, y: { ticks: { callback: v => fmtCurrency(v), font: { size: 9 } } } } }
        });
      }

      // 2. Category margin bar
      const catCtx = document.getElementById('exec-chart-category');
      if (catCtx) {
        execCharts.category = new Chart(catCtx, {
          type: 'bar',
          data: {
            labels: cats.map(([c]) => c.split(' ')[0]),
            datasets: [{
              data: cats.map(([, d]) => d.margin),
              backgroundColor: ['#00704A','#1E9E6E','#CBA258','#3B82F6','#A78BFA','#F472B6'].map(c => c + 'CC'),
              borderRadius: 4, borderSkipped: false
            }]
          },
          options: { ...baseOpts, indexAxis: 'y', scales: { x: { ticks: { callback: v => v + '%', font: { size: 9 } } }, y: { ticks: { font: { size: 9 } }, grid: { display: false } } } }
        });
      }

      // 3. Segment AOV — compact horizontal bar + avg line
      const aovCtx = document.getElementById('exec-chart-aov');
      const wAOV = segs.reduce((s, [, d]) => s + d.aov * d.orders, 0) / segs.reduce((s, [, d]) => s + d.orders, 0);
      if (aovCtx) {
        const execRate = CURRENCY_RATES[activeCurrency] || 1;
        const execSym  = CURRENCY_SYMBOLS[activeCurrency] || '$';
        const avgVal   = +(wAOV * execRate).toFixed(2);

        // Inline plugin: draws a dashed vertical line + label at the weighted-average AOV
        const avgLinePlugin = {
          id: 'execAvgLine',
          afterDraw(chart) {
            const { ctx, scales: { x, y }, chartArea } = chart;
            if (!x || !y) return;
            const xPos = x.getPixelForValue(avgVal);
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = '#CBA258';
            ctx.lineWidth = 1.5;
            ctx.moveTo(xPos, chartArea.top);
            ctx.lineTo(xPos, chartArea.bottom);
            ctx.stroke();
            // label at top
            ctx.setLineDash([]);
            ctx.fillStyle = '#CBA258';
            ctx.font = '600 7.5px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Avg ${execSym}${avgVal % 1 === 0 ? avgVal : avgVal.toFixed(0)}`, xPos, chartArea.top - 3);
            ctx.restore();
          }
        };

        execCharts.aov = new Chart(aovCtx, {
          type: 'bar',
          plugins: [avgLinePlugin],
          data: {
            labels: segs.map(([s]) => s.replace(' Members', '').replace(' Customers', '')),
            datasets: [{
              data: segs.map(([, d]) => +(d.aov * execRate).toFixed(2)),
              backgroundColor: ['#00704A','#1E9E6E','#CBA258','#3B82F6','#A78BFA'].map(c => c + 'CC'),
              borderColor:     ['#00704A','#1E9E6E','#CBA258','#3B82F6','#A78BFA'],
              borderWidth: 1, borderRadius: 3, borderSkipped: false
            }]
          },
          options: {
            ...baseOpts,
            indexAxis: 'y',
            layout: { padding: { top: 12 } },
            scales: {
              x: {
                grid: { color: 'rgba(255,255,255,.05)' },
                ticks: { callback: v => execSym + v.toFixed(0), font: { size: 8 }, color: 'rgba(255,255,255,.45)', maxTicksLimit: 4 }
              },
              y: {
                grid: { display: false },
                ticks: { font: { size: 8 }, color: 'rgba(255,255,255,.65)' }
              }
            },
            plugins: {
              ...baseOpts.plugins,
              tooltip: { callbacks: { label: c => `AOV: ${execSym}${c.raw.toFixed(2)}` } }
            }
          }
        });
      }

      // 4. CAC trend line
      const cacCtx = document.getElementById('exec-chart-cac');
      if (cacCtx) {
        execCharts.cac = new Chart(cacCtx, {
          type: 'line',
          data: {
            labels: mkt.map((_, i) => MONTHS[i]),
            datasets: [{
              data: mkt.map(m => m.spend / m.newCustomers),
              borderColor: '#F472B6',
              backgroundColor: 'rgba(244,114,182,.12)',
              fill: true, tension: .4, pointRadius: 2,
              pointBackgroundColor: '#F472B6', borderWidth: 2
            }]
          },
          options: { ...baseOpts, scales: { x: { ticks: { font: { size: 9 } }, grid: { display: false } }, y: { ticks: { callback: v => fmtCurrencySmall(v), font: { size: 9 } } } } }
        });
      }
    }

    function buildExecInsights(data) {
      const regions  = Object.entries(data.regions).sort((a, b) => b[1].revenue - a[1].revenue);
      const totalRev = Object.values(data.regions).reduce((s, r) => s + r.revenue, 0);
      const topCat   = Object.entries(data.categories).sort((a, b) => b[1].margin - a[1].margin)[0];
      const topSeg   = Object.entries(data.segments).sort((a, b) => b[1].aov - a[1].aov)[0];
      const avgMem   = CATEGORIES.reduce((s, c) => s + data.loyalty.members[c], 0) / CATEGORIES.length;
      const avgNon   = CATEGORIES.reduce((s, c) => s + data.loyalty.nonMembers[c], 0) / CATEGORIES.length;
      const uplift   = ((avgMem - avgNon) / avgNon * 100).toFixed(0);
      const lastMkt  = data.marketing[data.marketing.length - 1];
      const cac      = lastMkt.spend / lastMkt.newCustomers;

      document.getElementById('exec-insights-list').innerHTML = [
        { tag: 'green', text: `<strong>${regions[0][0]}</strong> leads revenue at ${fmtCurrency(regions[0][1].revenue)} — <strong>${(regions[0][1].revenue/totalRev*100).toFixed(1)}%</strong> of total. Protect share via Q4 loyalty campaigns.` },
        { tag: 'green', text: `<strong>${topCat[0]}</strong> is top margin category at <strong>${topCat[1].margin.toFixed(1)}%</strong>. Expand menu and consider price optimization on lower-margin items.` },
        { tag: 'gold',  text: `Loyalty members spend <strong>${uplift}% more</strong> per order (${fmtCurrencySmall(avgMem)} vs ${fmtCurrencySmall(avgNon)}). Scale sign-up promotions in-app to capture uplift.` },
        { tag: cac < 5000 ? 'green' : 'gold', text: `Latest CAC is <strong>${fmtCurrencySmall(cac)}</strong>. ${cac < 5000 ? 'Campaigns within optimal range.' : 'Acquisition cost trending above target — review channel mix.'}` },
      ].map(i => `<li class="exec-insight-item"><span class="exec-tag exec-tag--${i.tag}">${i.tag === 'green' ? '↑' : '~'}</span><span>${i.text}</span></li>`).join('');

      const busiest = [...data.dailyTraffic].sort((a, b) => b.transactions - a.transactions)[0];
      const avgTx   = data.dailyTraffic.reduce((s, d) => s + d.transactions, 0) / data.dailyTraffic.length;

      document.getElementById('exec-ops-list').innerHTML = [
        { tag: 'green', text: `Peak traffic day: <strong>${busiest.date}</strong> with <strong>${busiest.transactions.toLocaleString()}</strong> transactions — ${((busiest.transactions-avgTx)/avgTx*100).toFixed(0)}% above average. Staff up on weekends.` },
        { tag: 'gold',  text: `<strong>${topSeg[0]}</strong> segment AOV at <strong>${fmtCurrencySmall(topSeg[1].aov)}</strong>. Launch exclusive seasonal bundles targeting this high-value segment.` },
        { tag: 'green', text: `Average daily transactions: <strong>${fmtNum(Math.round(avgTx))}</strong>. Maintain operational readiness for ±20% variance days.` },
      ].map(i => `<li class="exec-insight-item"><span class="exec-tag exec-tag--${i.tag}">${i.tag === 'green' ? '↑' : '~'}</span><span>${i.text}</span></li>`).join('');
    }

    function wireExecClicks() {
      const period = parseInt(document.getElementById('filter-period').value);
      const modalMap = {
        revenue:   () => openModal('Revenue by Region',           'Detailed regional revenue breakdown and trends',            b => buildRegionDetail(b, data)),
        category:  () => openModal('Profit Margin by Category',   'Category-level margin analysis and cost breakdown',         b => buildCategoryDetail(b, data)),
        aov:       () => openModal('Avg Order Value by Segment',  'Segment-level AOV analysis and strategic recommendations',  b => buildAOVDetail(b, data)),
        marketing: () => openModal('Customer Acquisition Cost',   'Marketing spend efficiency and CAC trends',                 b => buildMarketingDetail(b, data, period)),
        insights:  () => openModal('Performance Insights',        'Strategic analysis and full recommendations breakdown',     b => buildInsightsDetail(b, data)),
        traffic:   () => openModal('Daily Store Traffic',         'Transaction volume analysis and daily performance',         b => buildTrafficDetail(b, data)),
      };

      document.querySelectorAll('[data-exec-modal]').forEach(el => {
        // Skip KPI cards — they wire themselves in buildExecKPIs
        if (el.classList.contains('exec-kpi-card--clickable')) return;
        const key = el.dataset.execModal;
        if (!modalMap[key]) return;
        const handler = (e) => {
          if (e.target.closest('canvas')) return; // let chart tooltips work
          modalMap[key]();
        };
        // Remove old listeners by cloning (safe since content is re-rendered)
        el.onclick = handler;
        el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(e); } };
      });
    }

    function openExecView(skipAnim) {
      const period = parseInt(document.getElementById('filter-period').value);
      const region = document.getElementById('filter-region').value;
      const kpis   = computeKPIs(data, region, period);

      execBtn.classList.add('active');
      document.getElementById('exec-btn-label').textContent = 'Full Dashboard';
      execActive = true;

      const showExec = () => {
        dashboard.style.display = 'none';
        dashboard.classList.remove('view-exit');

        execViewEl.removeAttribute('hidden');
        execViewEl.classList.remove('view-exit');
        execViewEl.classList.add('view-enter');
        execViewEl.addEventListener('animationend', function onIn() {
          execViewEl.removeEventListener('animationend', onIn);
          execViewEl.classList.remove('view-enter');
        }, { once: true });

        buildExecKPIs(kpis);
        buildExecInsights(data);
        wireExecClicks();
        requestAnimationFrame(() => buildExecCharts(data, period));
      };

      if (skipAnim) {
        showExec();
      } else {
        // Animate dashboard out, then show compact view
        dashboard.classList.add('view-exit');
        dashboard.addEventListener('animationend', function onOut() {
          dashboard.removeEventListener('animationend', onOut);
          showExec();
        }, { once: true });
      }
    }

    function closeExecView() {
      execBtn.classList.remove('active');
      document.getElementById('exec-btn-label').textContent = 'Compact View';
      execActive = false;

      // Animate compact view out, then show full dashboard
      execViewEl.classList.remove('view-enter');
      execViewEl.classList.add('view-exit');
      execViewEl.addEventListener('animationend', function onOut() {
        execViewEl.removeEventListener('animationend', onOut);
        execViewEl.setAttribute('hidden', '');
        execViewEl.classList.remove('view-exit');

        Object.values(execCharts).forEach(c => c && c.destroy());
        execCharts = {};

        dashboard.style.display = '';
        dashboard.classList.add('view-enter');
        dashboard.addEventListener('animationend', function onIn() {
          dashboard.removeEventListener('animationend', onIn);
          dashboard.classList.remove('view-enter');
        }, { once: true });

        window.scrollTo({ top: 0, behavior: 'instant' });
        setTimeout(() => {
          if (heatmapMap) heatmapMap.invalidateSize();
        }, 150);
      }, { once: true });
    }

    execBtn.addEventListener('click', () => {
      if (execActive) closeExecView(); else openExecView();
    });

    // Pre-wire tab visibility state (keeps chart tiles correctly shown when user switches from compact view)
    activateTab('all');
    // Open compact view by default — skip animation on initial load
    openExecView(true);

    // Modal close handlers
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // Report generator
    document.getElementById('generate-report').addEventListener('click', () => {
      const period = parseInt(document.getElementById('filter-period').value);
      generateReport(data, period);
    });

    // Compare regions
    document.getElementById('compare-regions').addEventListener('click', () => {
      openModal('Region Comparison', 'Compare two regions head-to-head across all key metrics', b => buildRegionComparison(b, data));
    });

    // What-If Simulator
    document.getElementById('whatif-simulator').addEventListener('click', () => {
      openModal('Simulator', 'Adjust business levers to model projected financial outcomes', b => buildWhatIfSimulator(b, data));
    });

    // Filter listeners
    const rerender = () => {
      const region = document.getElementById('filter-region').value;
      const period = parseInt(document.getElementById('filter-period').value);
      renderAll(data, region, period);
      wireModalClicks(data, period);
      if (execActive) {
        const kpis = computeKPIs(data, region, period);
        buildExecKPIs(kpis);
        buildExecInsights(data);
        requestAnimationFrame(() => buildExecCharts(data, period));
      }
    };

    document.getElementById('filter-region').addEventListener('change', rerender);
    document.getElementById('filter-period').addEventListener('change', rerender);
    document.getElementById('filter-currency').addEventListener('change', (e) => {
      activeCurrency = e.target.value;
      rerender();
    });

    // ─── Theme Toggle ───
    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('sb-dashboard-theme', theme);

      const icon = document.getElementById('theme-icon');
      if (icon) icon.textContent = theme === 'light' ? '☀️' : '🌙';

      // Update Chart.js defaults for current theme
      const isLight = theme === 'light';
      Chart.defaults.color = isLight ? '#4A5D52' : '#8B9DAF';
      Chart.defaults.borderColor = isLight ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.06)';

      // Update tooltip styling
      Chart.defaults.plugins.tooltip.backgroundColor = isLight ? 'rgba(255,255,255,.96)' : 'rgba(11,18,21,.92)';
      Chart.defaults.plugins.tooltip.titleColor = isLight ? '#1A2B1F' : '#E8ECEF';
      Chart.defaults.plugins.tooltip.bodyColor = isLight ? '#4A5D52' : '#8B9DAF';
      Chart.defaults.plugins.tooltip.borderColor = isLight ? 'rgba(0,112,74,.15)' : 'rgba(0,112,74,.3)';

      // Swap heatmap tiles and re-render charts
      setHeatmapTiles();
      rerender();
    }

    // Load saved theme or default to dark
    const savedTheme = localStorage.getItem('sb-dashboard-theme') || 'dark';
    if (savedTheme === 'light') applyTheme('light');

    document.getElementById('theme-toggle').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    // ─── Logout Button ───
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
