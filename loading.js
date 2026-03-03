/* ═══════════════════════════════════════════════════════════
   STARBUCKS ANALYTICS — LOADING SCREEN SCRIPT
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ══════════════════════════════════
     STEAM PARTICLE CANVAS
     ══════════════════════════════════ */
  const canvas = document.getElementById('steamCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H;
  const particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function randBetween(a, b) { return a + Math.random() * (b - a); }

  function spawnParticle() {
    return {
      x:     randBetween(W * .3, W * .7),
      y:     randBetween(H * .3, H * .6),
      vx:    randBetween(-.3, .3),
      vy:    randBetween(-.6, -.2),
      r:     randBetween(1.5, 4),
      alpha: randBetween(.04, .14),
      life:  0,
      maxLife: randBetween(80, 160)
    };
  }

  function drawParticles() {
    ctx.clearRect(0, 0, W, H);
    // Spawn new particles occasionally
    if (Math.random() < .18) particles.push(spawnParticle());

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x   += p.vx;
      p.y   += p.vy;
      p.life++;
      const progress = p.life / p.maxLife;
      const a = p.alpha * Math.sin(Math.PI * progress);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(52, 211, 153, ${a})`;
      ctx.fill();

      if (p.life >= p.maxLife) particles.splice(i, 1);
    }
    requestAnimationFrame(drawParticles);
  }

  resize();
  drawParticles();
  window.addEventListener('resize', resize);

  /* ══════════════════════════════════
     TYPEWRITER — loading title
     ══════════════════════════════════ */
  const typeTarget  = document.getElementById('typeTarget');
  const phrases     = ['Loading Dashboard…', 'Fetching Analytics…', 'Almost ready…'];
  let   phraseIndex = 0;
  let   charIndex   = 0;
  let   isDeleting  = false;
  let   typeTimer;

  function type() {
    const phrase = phrases[phraseIndex];
    if (!isDeleting) {
      typeTarget.textContent = phrase.slice(0, charIndex + 1);
      charIndex++;
      if (charIndex === phrase.length) {
        isDeleting = true;
        typeTimer = setTimeout(type, 1400);
        return;
      }
    } else {
      typeTarget.textContent = phrase.slice(0, charIndex - 1);
      charIndex--;
      if (charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    }
    typeTimer = setTimeout(type, isDeleting ? 45 : 70);
  }

  setTimeout(type, 700);

  /* ══════════════════════════════════
     PROGRESS BAR + STATUS MESSAGES
     ══════════════════════════════════ */
  const fillEl    = document.getElementById('progressFill');
  const glowEl    = document.getElementById('progressGlow');
  const pctEl     = document.getElementById('progressPct');
  const statusEl  = document.getElementById('loadStatus');
  const barEl     = document.getElementById('progressBar');

  const steps = [
    { pct: 12,  msg: 'Connecting to data warehouse…' },
    { pct: 28,  msg: 'Loading regional metrics…'     },
    { pct: 45,  msg: 'Processing sales data…'        },
    { pct: 63,  msg: 'Rendering charts & KPIs…'      },
    { pct: 80,  msg: 'Preparing your workspace…'     },
    { pct: 94,  msg: 'Almost there…'                 },
    { pct: 100, msg: 'Ready! Redirecting…'           },
  ];

  // Randomised delays to feel organic
  const delays = [320, 480, 560, 620, 700, 540, 480];
  let stepIndex  = 0;
  let elapsed    = 0;

  function runStep() {
    if (stepIndex >= steps.length) return;
    const step = steps[stepIndex];
    const pct  = step.pct;

    // Update fill
    fillEl.style.width = pct + '%';
    glowEl.style.left  = `calc(${pct}% - 5px)`;
    pctEl.textContent  = pct + '%';
    barEl.setAttribute('aria-valuenow', pct);

    // Fade status
    statusEl.style.opacity = '0';
    setTimeout(() => {
      statusEl.textContent   = step.msg;
      statusEl.style.opacity = '1';
    }, 180);

    stepIndex++;
    if (stepIndex < steps.length) {
      elapsed += delays[stepIndex - 1];
      setTimeout(runStep, delays[stepIndex - 1]);
    } else {
      // All done — exit animation then redirect
      setTimeout(exitAndRedirect, 600);
    }
  }

  // Kick off after a short intro pause
  setTimeout(runStep, 500);

  /* ══════════════════════════════════
     EXIT & REDIRECT
     ══════════════════════════════════ */
  function exitAndRedirect() {
    clearTimeout(typeTimer);
    const loader = document.getElementById('loader');
    loader.classList.add('exiting');
    document.body.classList.add('exiting');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 720);
  }

})();

