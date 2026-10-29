(function () {
  var cv = document.getElementById('rabi-strip');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var W = 0, H = 0, curve = [];

  var FIELD = '158, 194, 232';
  var GUIDE = '106, 138, 170';
  var PI = Math.PI;
  var TMAX = 32 * PI;
  var THETA_D = 9 * PI;
  var SIG_D = 2.6 * PI;
  var GD = 3.0;
  var TSLOW = 60 * PI;
  var SAMPLES = 960;

  function contrast(th) {
    var notch = GD * Math.exp(-((th - THETA_D) * (th - THETA_D)) / (2 * SIG_D * SIG_D));
    return Math.exp(-notch) * Math.exp(-th / TSLOW);
  }
  function emission(th) {
    return 0.5 * (1 - contrast(th) * Math.cos(th));
  }

  function fit() {
    var r = cv.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    curve = [];
    for (var i = 0; i <= SAMPLES; i++) curve[i] = emission(TMAX * i / SAMPLES);
  }
  fit();
  window.addEventListener('resize', fit);

  var running = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { running = e[0].isIntersecting; }).observe(cv);
  }

  var t = 0, SWEEP = 14;
  function xOf(u) { return W * (0.05 + 0.90 * u); }

  function draw(head) {
    var top = H * 0.18, bot = H * 0.82;
    function yOf(v) { return bot - v * (bot - top); }
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';

    ctx.strokeStyle = 'rgba(' + GUIDE + ', 0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xOf(0), yOf(0.5)); ctx.lineTo(xOf(1), yOf(0.5)); ctx.stroke();

    ctx.strokeStyle = 'rgba(' + FIELD + ', 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i <= SAMPLES; i++) {
      var x = xOf(i / SAMPLES), y = yOf(curve[i]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    var hi = Math.floor(head * SAMPLES);
    ctx.strokeStyle = 'rgba(' + FIELD + ', 0.9)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (var j = 0; j <= hi; j++) {
      var xx = xOf(j / SAMPLES), yy = yOf(curve[j]);
      if (j === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();

    var px = xOf(head), py = yOf(curve[Math.min(SAMPLES, hi)]);
    ctx.fillStyle = 'rgba(' + FIELD + ', 0.95)';
    ctx.beginPath(); ctx.arc(px, py, 2.4, 0, PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(' + GUIDE + ', 0.85)';
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('9π', xOf(THETA_D / TMAX), H - 6);
  }

  function frame(now, lastNow) {
    if (!running) { requestAnimationFrame(function (n) { frame(n, n); }); return; }
    var dt = Math.min(0.05, (now - lastNow) / 1000);
    t += dt;
    draw((t % SWEEP) / SWEEP);
    requestAnimationFrame(function (n) { frame(n, now); });
  }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    draw(1);
    window.addEventListener('resize', function () { draw(1); });
    return;
  }
  requestAnimationFrame(function (n) { frame(n, n); });
})();
