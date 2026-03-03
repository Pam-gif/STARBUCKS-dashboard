/* ═══════════════════════════════════════════════════════════
   STARBUCKS ANALYTICS — LOGIN PAGE SCRIPT
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ══════════════════════════════════
     CURSOR SPOTLIGHT
     ══════════════════════════════════ */
  const spotlight = document.getElementById('cursorSpotlight');
  if (spotlight) {
    document.addEventListener('mousemove', (e) => {
      spotlight.style.left = e.clientX + 'px';
      spotlight.style.top  = e.clientY + 'px';
    });
  }

  /* ══════════════════════════════════
     LEFT PANEL PARALLAX
     ══════════════════════════════════ */
  const parallaxLayer = document.getElementById('parallaxLayer');
  const leftPanel     = document.querySelector('.panel--left');
  if (parallaxLayer && leftPanel) {
    document.addEventListener('mousemove', (e) => {
      const rect = leftPanel.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / rect.width;
      const dy   = (e.clientY - cy) / rect.height;
      parallaxLayer.style.transform = `translate(${dx * 18}px, ${dy * 14}px)`;
    });
  }

  /* ══════════════════════════════════
     FLOATING PARTICLES (left panel)
     ══════════════════════════════════ */
  const canvas = document.getElementById('particlesCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function randomBetween(a, b) { return a + Math.random() * (b - a); }

    function createParticle() {
      return {
        x:     randomBetween(0, W),
        y:     randomBetween(0, H),
        r:     randomBetween(.8, 2.2),
        vx:    randomBetween(-.18, .18),
        vy:    randomBetween(-.28, -.08),
        alpha: randomBetween(.08, .45),
        grow:  randomBetween(-.002, .002)
      };
    }

    function initParticles(n) {
      particles = [];
      for (let i = 0; i < n; i++) particles.push(createParticle());
    }

    function drawParticles() {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.grow;
        if (p.y < -4)  p.y = H + 4;
        if (p.x < -4)  p.x = W + 4;
        if (p.x > W+4) p.x = -4;
        if (p.alpha <= .04 || p.alpha >= .5) p.grow *= -1;
      }
      requestAnimationFrame(drawParticles);
    }

    resize();
    initParticles(60);
    drawParticles();
    window.addEventListener('resize', () => { resize(); initParticles(60); });
  }

  /* ══════════════════════════════════
     ANIMATED STAT COUNTERS + LINE
     ══════════════════════════════════ */
  function animateCount(el, target, duration) {
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(ease * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  setTimeout(() => {
    document.querySelectorAll('.stat__value[data-count]').forEach(el => {
      animateCount(el, parseInt(el.dataset.count), 1200);
    });
    const line = document.querySelector('.panel__line');
    if (line) line.classList.add('in-view');
  }, 650);

  /* ══════════════════════════════════
     TYPEWRITER CURSOR — hide after pause
     ══════════════════════════════════ */
  const typeCursor = document.querySelector('.type-cursor');
  if (typeCursor) {
    setTimeout(() => {
      typeCursor.style.animation = 'none';
      typeCursor.style.opacity   = '0';
      typeCursor.style.transition = 'opacity .4s';
    }, 3800);
  }

  /* ══════════════════════════════════
     FORM LOGIC  (validation + submit)
     ══════════════════════════════════ */
  const form        = document.getElementById('loginForm');
  const emailInput  = document.getElementById('email');
  const pwInput     = document.getElementById('password');
  const emailGroup  = document.getElementById('emailGroup');
  const pwGroup     = document.getElementById('passwordGroup');
  const emailError  = document.getElementById('emailError');
  const pwError     = document.getElementById('passwordError');
  const signinBtn   = document.getElementById('signinBtn');
  const globalError = document.getElementById('globalError');
  const togglePwBtn = document.getElementById('togglePw');
  const eyeShow     = togglePwBtn.querySelector('.eye-show');
  const eyeHide     = togglePwBtn.querySelector('.eye-hide');

  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  function setFieldValid(group, errorEl) {
    group.classList.remove('invalid');
    errorEl.textContent = '';
  }

  function setFieldInvalid(group, errorEl, msg) {
    group.classList.remove('invalid');
    void group.offsetWidth;
    group.classList.add('invalid');
    errorEl.textContent = msg;
  }

  function validateEmail() {
    const val = emailInput.value.trim();
    if (!val) { setFieldInvalid(emailGroup, emailError, 'Email address is required.'); return false; }
    if (!isValidEmail(val)) { setFieldInvalid(emailGroup, emailError, 'Please enter a valid email address.'); return false; }
    setFieldValid(emailGroup, emailError);
    return true;
  }

  function validatePassword() {
    const val = pwInput.value;
    if (!val) { setFieldInvalid(pwGroup, pwError, 'Password is required.'); return false; }
    setFieldValid(pwGroup, pwError);
    return true;
  }

  emailInput.addEventListener('blur', validateEmail);
  pwInput.addEventListener('blur', validatePassword);

  emailInput.addEventListener('input', () => {
    if (emailGroup.classList.contains('invalid')) validateEmail();
    globalError.style.display = 'none';
  });
  pwInput.addEventListener('input', () => {
    if (pwGroup.classList.contains('invalid')) validatePassword();
    globalError.style.display = 'none';
  });

  togglePwBtn.addEventListener('click', () => {
    const isHidden = pwInput.type === 'password';
    pwInput.type = isHidden ? 'text' : 'password';
    eyeShow.style.display = isHidden ? 'none' : '';
    eyeHide.style.display = isHidden ? '' : 'none';
    togglePwBtn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const emailOk = validateEmail();
    const pwOk    = validatePassword();
    if (!emailOk || !pwOk) return;

    signinBtn.disabled = true;
    signinBtn.classList.add('loading');
    globalError.style.display = 'none';

    setTimeout(() => {
      signinBtn.disabled = false;
      signinBtn.classList.remove('loading');
      const email    = emailInput.value.trim();
      const password = pwInput.value;
      if (email && password) {
        window.location.href = 'loading.html';
      } else {
        globalError.style.display = 'flex';
      }
    }, 1400);
  });

})();



