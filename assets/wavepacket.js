(function () {
  var cv = document.getElementById('wavepacket-mark');
  if (!cv) return;

  var ctx = cv.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var W = 0, H = 0;

  function fit() {
    var r = cv.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fit();
  window.addEventListener('resize', fit);

  cv.setAttribute('role', 'img');
  cv.setAttribute('aria-label', 'Wavepacket mark.');

  var t = 0;
  var collapse = 0;
  var cxFrac = 0.5;
  var visible = true;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var cy = H * 0.52;
    var cx = W * cxFrac;

    var sigma0 = W * 0.16 * (1 + 0.45 * Math.sin(t * 0.7));
    var sigma = sigma0 * (1 - collapse) + 3.5 * collapse;
    var amp = H * 0.34 * (1 + 0.9 * collapse);
    var k = 0.55;

    ctx.strokeStyle = collapse > 0.04
      ? 'rgba(158, 194, 232, ' + (0.45 + 0.45 * collapse).toFixed(3) + ')'
      : 'rgba(136, 136, 136, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    var steps = Math.max(40, Math.floor(W));
    for (var i = 0; i <= steps; i++) {
      var x = (W * i) / steps;
      var dx = x - cx;
      var env = Math.exp(-(dx * dx) / (2 * sigma * sigma));
      var y = cy - amp * env * Math.cos(k * dx + t * 2 * (1 - collapse));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    if (collapse > 0.45) {
      var fl = (collapse - 0.45) / 0.55;
      ctx.strokeStyle = 'rgba(158, 194, 232, ' + (0.35 * fl).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 4 + 16 * (1 - fl), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function frame(now, lastNow) {
    if (!visible) return;
    var dt = Math.min(0.05, (now - lastNow) / 1000);
    t += dt;
    if (collapse > 0) {
      collapse = Math.max(0, collapse - dt * 0.55);
      if (collapse === 0) cxFrac += (0.5 - cxFrac) * 0.5;
    }
    draw();
    requestAnimationFrame(function (n) { frame(n, now); });
  }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    t = 1.2;
    draw();
    window.addEventListener('resize', draw);
    return;
  }

  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) {
      var was = visible; visible = es[0].isIntersecting;
      if (visible && !was) requestAnimationFrame(function (n) { frame(n, n); });
    }).observe(cv);
  }
  requestAnimationFrame(function (n) { frame(n, n); });
})();
