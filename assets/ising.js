(function () {
  const cv = document.getElementById('ising-strip');
  if (!cv) return;

  const ctx = cv.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  let W = 0, H = 0;

  const ACCENT = '126, 203, 255';

  let s = [];
  let th = [];
  let wob = [];
  let xs = [];

  function build() {
    const n = Math.max(8, Math.floor(W / 26));
    const pad = 24;
    xs = []; const ns = [], nth = [], nw = [];
    for (let i = 0; i < n; i++) {
      xs.push(pad + (W - 2 * pad) * (n === 1 ? 0.5 : i / (n - 1)));
      ns.push(s[i] !== undefined ? s[i] : 1);
      nth.push(th[i] !== undefined ? th[i] : -Math.PI / 2);
      nw.push(wob[i] !== undefined ? wob[i] : 0);
    }
    s = ns; th = nth; wob = nw;
  }

  function fit() {
    const r = cv.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }
  fit();
  window.addEventListener('resize', fit);

  let running = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
    }).observe(cv);
  }

  const KICK_PERIOD = 3.4;
  const KICK_SWEEP = 0.55;
  let kickT = KICK_PERIOD * 0.6;
  let front = -1e9, prevFront = -1e9;
  let hopT = 0;
  let t = 0;

  let mx = -1e9, inside = false, touchTimer = null;
  cv.style.cursor = 'crosshair';
  cv.addEventListener('pointermove', function (e) {
    const r = cv.getBoundingClientRect();
    mx = e.clientX - r.left; inside = true;
  });
  cv.addEventListener('pointerleave', function () { inside = false; });
  cv.addEventListener('pointerdown', function (e) {
    const r = cv.getBoundingClientRect();
    mx = e.clientX - r.left; inside = true;
    if (e.pointerType === 'touch') {
      clearTimeout(touchTimer);
      touchTimer = setTimeout(function () { inside = false; }, 1800);
    }
  });

  function localField(x) {
    if (!inside) return 0;
    const sig = Math.max(24, W * 0.035);
    const d = x - mx;
    return Math.exp(-(d * d) / (2 * sig * sig));
  }

  function step(dt) {
    t += dt;
    kickT -= dt;

    if (kickT <= 0) {
      prevFront = front;
      const u = Math.min(1, -kickT / KICK_SWEEP);
      front = -30 + (W + 60) * u;
      for (let i = 0; i < s.length; i++) {
        if (xs[i] > prevFront && xs[i] <= front) {
          wob[i] = Math.min(1, wob[i] + 0.8);
          const p = 0.07 + 0.40 * localField(xs[i]);
          if (Math.random() < p) s[i] = -s[i];
        }
      }
      if (u >= 1) { kickT = KICK_PERIOD; front = prevFront = -1e9; }
    }

    if (inside) {
      for (let i = 0; i < s.length; i++) {
        const f = localField(xs[i]);
        if (f > 0.15) {
          wob[i] = Math.max(wob[i], f * 0.7);
          if (Math.random() < f * f * dt * 2.0) s[i] = -s[i];
        }
      }
    }

    hopT -= dt;
    if (hopT <= 0) {
      const walls = [];
      for (let i = 0; i < s.length - 1; i++) if (s[i] !== s[i + 1]) walls.push(i);
      hopT = 0.45 / Math.max(1, walls.length * 0.45);
      if (walls.length > 0 && Math.random() < 0.75) {
        const w = walls[Math.floor(Math.random() * walls.length)];
        const side = Math.random() < 0.5 ? w : w + 1;
        s[side] = -s[side];
      }
    }

    for (let i = 0; i < s.length; i++) {
      const target = s[i] > 0 ? -Math.PI / 2 : Math.PI / 2;
      th[i] += (target - th[i]) * Math.min(1, dt * 5);
      wob[i] = Math.max(0, wob[i] - dt * 1.6);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const cy = H * 0.5;
    const L = Math.min(17, H * 0.16);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xs[0], cy);
    ctx.lineTo(xs[xs.length - 1], cy);
    ctx.stroke();

    if (front > -1e8) {
      const grad = ctx.createLinearGradient(front - 26, 0, front + 8, 0);
      grad.addColorStop(0, 'rgba(' + ACCENT + ', 0)');
      grad.addColorStop(1, 'rgba(' + ACCENT + ', 0.10)');
      ctx.fillStyle = grad;
      ctx.fillRect(front - 26, cy - H * 0.32, 34, H * 0.64);
    }

    for (let i = 0; i < s.length; i++) {
      const tilt = localField(xs[i]);
      const wobble = wob[i] * 0.5 * Math.sin(t * 9 + i * 1.3);

      let a = th[i] * (1 - 0.8 * tilt) + wobble;
      const dx = Math.cos(a) * L, dy = Math.sin(a) * L;
      const x = xs[i];

      ctx.strokeStyle = 'rgba(250, 250, 250, ' + (0.40 + 0.30 * tilt).toFixed(3) + ')';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - dx, cy - dy);
      ctx.lineTo(x + dx, cy + dy);
      ctx.stroke();

      ctx.fillStyle = 'rgba(250, 250, 250, ' + (0.65 + 0.25 * tilt).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(x + dx, cy + dy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < s.length - 1; i++) {
      if (s[i] !== s[i + 1]) {
        const x = (xs[i] + xs[i + 1]) / 2;
        const pulse = 0.45 + 0.25 * Math.sin(t * 3 + i);
        ctx.fillStyle = 'rgba(' + ACCENT + ', ' + (0.18 * pulse).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(x, cy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(' + ACCENT + ', ' + pulse.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(x, cy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function frame(now, lastNow) {
    if (!running) {
      requestAnimationFrame(function (n) { frame(n, n); });
      return;
    }
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    step(dt);
    draw();
    requestAnimationFrame(function (n) { frame(n, now); });
  }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {

    if (s.length > 6) {
      for (let i = Math.floor(s.length * 0.35); i < Math.floor(s.length * 0.55); i++) s[i] = -1;
      for (let i = 0; i < s.length; i++) th[i] = s[i] > 0 ? -Math.PI / 2 : Math.PI / 2;
    }
    draw();
    return;
  }

  requestAnimationFrame(function (n) { frame(n, n); });
})();
