(function () {
  var cv = document.getElementById('cascade-strip');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var W = 0, H = 0;
  var FIELD = '158, 194, 232';
  var GUIDE = '106, 138, 170';

  function fit() {
    var r = cv.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fit();
  window.addEventListener('resize', fit);

  var running = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { running = e[0].isIntersecting; }).observe(cv);
  }

  var t = 0, PERIOD = 6.0;

  function geo() {
    return {
      lx0: W * 0.11, lx1: W * 0.30, lxm: W * 0.205,
      gx0: W * 0.46, gx1: W * 0.93,
      yXX: H * 0.20, yXh: H * 0.42, yXv: H * 0.52, yG: H * 0.82
    };
  }

  function level(y, x0, x1, b) {
    ctx.strokeStyle = 'rgba(' + GUIDE + ', ' + (0.14 + 0.5 * b).toFixed(3) + ')';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  }

  function packet(cx, cy, amp, sigma, alpha) {
    if (alpha < 0.02) return;
    ctx.strokeStyle = 'rgba(' + FIELD + ', ' + alpha.toFixed(3) + ')';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    var pen = false;
    for (var s = -3 * sigma; s <= 3 * sigma; s += 1.4) {
      var env = Math.exp(-(s * s) / (2 * sigma * sigma));
      var y = cy - amp * env * Math.cos(0.95 * s);
      if (!pen) { ctx.moveTo(cx + s, y); pen = true; } else ctx.lineTo(cx + s, y);
    }
    ctx.stroke();
  }

  function draw() {
    var g = geo();
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    var c = (t % PERIOD) / PERIOD;
    var yX = (g.yXh + g.yXv) / 2;

    var bxx = 0.12, bx = 0.12, bg = 0.12, popY = g.yG, p;
    if (c < 0.05) { bg = 0.9; }
    else if (c < 0.20) { p = (c - 0.05) / 0.15; popY = g.yG + (g.yXX - g.yG) * p; bg = 0.9 - 0.7 * p; bxx = 0.12 + 0.78 * p; }
    else if (c < 0.47) { bxx = 0.9; popY = g.yXX; }
    else if (c < 0.52) { p = (c - 0.47) / 0.05; popY = g.yXX + (yX - g.yXX) * p; bxx = 0.9 - 0.7 * p; bx = 0.12 + 0.78 * p; }
    else if (c < 0.72) { bx = 0.9; popY = yX; }
    else if (c < 0.77) { p = (c - 0.72) / 0.05; popY = yX + (g.yG - yX) * p; bx = 0.9 - 0.7 * p; bg = 0.12 + 0.78 * p; }
    else { bg = 0.9; }

    level(g.yXX, g.lx0, g.lx1, bxx);
    level(g.yXh, g.lx0, g.lx1, bx);
    level(g.yXv, g.lx0, g.lx1, bx);
    level(g.yG, g.lx0, g.lx1, bg);

    ctx.strokeStyle = 'rgba(' + GUIDE + ', 0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(g.lx1 + 4, g.yXh); ctx.lineTo(g.lx1 + 4, g.yXv); ctx.stroke();

    ctx.font = '11px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(' + GUIDE + ', 0.8)'; ctx.textAlign = 'right';
    ctx.fillText('XX', g.lx0 - 6, g.yXX + 3);
    ctx.fillText('X', g.lx0 - 6, yX + 3);
    ctx.fillText('g', g.lx0 - 6, g.yG + 3);

    ctx.fillStyle = 'rgba(' + FIELD + ', 0.22)';
    ctx.beginPath(); ctx.arc(g.lxm, popY, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(' + FIELD + ', 0.92)';
    ctx.beginPath(); ctx.arc(g.lxm, popY, 2.8, 0, Math.PI * 2); ctx.fill();

    var gap = W * 0.12;
    if (c > 0.47 && c < 0.70) { var p1 = (c - 0.47) / 0.23; packet(g.lx1 + 12 + p1 * gap, (g.yXX + yX) / 2 - p1 * 6, 3.4, 5, 0.85 * Math.sin(Math.PI * p1)); }
    if (c > 0.72 && c < 0.97) { var p2 = (c - 0.72) / 0.25; packet(g.lx1 + 12 + p2 * gap, (yX + g.yG) / 2 + p2 * 6, 3.4, 5, 0.85 * Math.sin(Math.PI * p2)); }

    var cy = H * 0.5, amp = H * 0.25, span = g.gx1 - g.gx0, f = 2.4, N = 120;
    ctx.strokeStyle = 'rgba(' + GUIDE + ', 0.12)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(g.gx0, cy); ctx.lineTo(g.gx1, cy); ctx.stroke();
    ctx.strokeStyle = 'rgba(' + FIELD + ', 0.55)'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (var i = 0; i <= N; i++) {
      var u = i / N, x = g.gx0 + u * span, y = cy - amp * Math.cos(2 * Math.PI * f * u);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    var sw = (t * 0.14) % 1, xp = g.gx0 + sw * span, yp = cy - amp * Math.cos(2 * Math.PI * f * sw);
    ctx.strokeStyle = 'rgba(' + GUIDE + ', 0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xp, cy - amp - 4); ctx.lineTo(xp, cy + amp + 4); ctx.stroke();
    ctx.fillStyle = 'rgba(' + FIELD + ', 0.95)';
    ctx.beginPath(); ctx.arc(xp, yp, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(' + GUIDE + ', 0.8)';
    ctx.textAlign = 'left';
    ctx.fillText('Φ+', g.gx0, cy - amp - 3);
    ctx.fillText('Φ−', g.gx0, cy + amp + 11);
    ctx.textAlign = 'right';
    ctx.fillText('emission time τ', g.gx1, cy + amp + 11);
  }

  function frame(now, lastNow) {
    if (!running) { requestAnimationFrame(function (n) { frame(n, n); }); return; }
    var dt = Math.min(0.05, (now - lastNow) / 1000);
    t += dt;
    draw();
    requestAnimationFrame(function (n) { frame(n, now); });
  }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    t = 1.6; draw(); return;
  }
  requestAnimationFrame(function (n) { frame(n, n); });
})();
