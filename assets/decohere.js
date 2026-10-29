(function () {
  const cv = document.getElementById('decohere-mark');
  if (!cv) return;

  const ctx = cv.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  let W = 0, H = 0;

  function fit() {
    const r = cv.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fit();
  window.addEventListener('resize', fit);

  let t = 0, last = 0, running = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { running = e[0].isIntersecting; }).observe(cv);
  }

  function draw() {
    const cx = W * 0.5, base = H * 0.86, am = H * 0.66, k = 0.26;
    const V = 0.5 + 0.5 * Math.cos(t * 0.45);
    const sg = W * 0.13 * (1 + 0.35 * (1 - V));
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(158, 194, 232, ' + (0.4 + 0.35 * V).toFixed(3) + ')';
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const st = Math.max(60, Math.floor(W));
    for (let i = 0; i <= st; i++) {
      const x = W * i / st, dx = x - cx;
      const env = Math.exp(-dx * dx / (2 * sg * sg));
      const I = env * (1 + V * Math.cos(2 * k * dx)) / (1 + V);
      const y = base - am * I;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function frame(now) {
    if (running) { t += Math.min(0.05, (now - last) / 1000); draw(); }
    last = now;
    requestAnimationFrame(frame);
  }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    t = 0; draw();
    window.addEventListener('resize', draw);
    return;
  }
  requestAnimationFrame(frame);
})();
