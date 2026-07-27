(function () {
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var ITEMS = ':scope > *, .row, .card, .plink, .skill, .pub, .ph';
  function reveal(el) {
    var kids = el.querySelectorAll(ITEMS);
    for (var c = 0; c < kids.length; c++) kids[c].style.setProperty('--i', Math.min(c, 6));
    el.classList.add('in');
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    for (var i = 0; i < items.length; i++) reveal(items[i]);
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  for (var j = 0; j < items.length; j++) io.observe(items[j]);

  requestAnimationFrame(function () {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for (var k = 0; k < items.length; k++) {
      var r = items[k].getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) { reveal(items[k]); io.unobserve(items[k]); }
    }
  });
})();
