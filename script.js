document.documentElement.classList.add('js');
// Снег на первом экране
(function () {
  var c = document.querySelector('.snow');
  if (!c || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var ctx = c.getContext('2d'), flakes = [], w, h, dpr = Math.min(2, window.devicePixelRatio || 1);
  function size() {
    w = c.offsetWidth; h = c.offsetHeight;
    c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size(); addEventListener('resize', size);
  var n = w < 700 ? 60 : 130;
  for (var i = 0; i < n; i++) {
    flakes.push({ x: Math.random() * w, y: Math.random() * h, r: .8 + Math.random() * 2.6, v: .3 + Math.random() * 1, a: Math.random() * 6.28 });
  }
  var visible = true;
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(c);
  (function tick() {
    if (visible) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      flakes.forEach(function (f) {
        f.y += f.v; f.a += .01; f.x += Math.sin(f.a) * .4;
        if (f.y > h) { f.y = -5; f.x = Math.random() * w; }
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.28); ctx.fill();
      });
    }
    requestAnimationFrame(tick);
  })();
})();

// Кнопки «Позвонить / WhatsApp» на телефоне прячутся у блока контактов
(function () {
  var fab = document.querySelector('.fab'), box = document.getElementById('contacts');
  if (!fab || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (es) {
    fab.style.transform = es[0].isIntersecting ? 'translateY(120px)' : '';
  }, { threshold: .15 }).observe(box);
  fab.style.transition = 'transform .3s';
})();

// Появление блоков при прокрутке (без обработчика scroll)
(function () {
  var els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  els.forEach(function (e) { io.observe(e); });
})();

// Отсчёт до Нового года (по омскому времени, UTC+6).
// 31.12 и 1–2.01 — праздничные надписи; с 3 января до сентября отсчёта нет, стоит обычная надпись.
(function () {
  var el = document.getElementById('nyDays'); if (!el) return;
  var cap = el.nextElementSibling, base = { b: '25.12 — 2.01', s: 'приходим каждый день праздников' };
  function plural(d) { return (d % 10 === 1 && d % 100 !== 11) ? 'день' : (d % 10 >= 2 && d % 10 <= 4 && (d % 100 < 10 || d % 100 >= 20)) ? 'дня' : 'дней'; }
  function draw() {
    var now = new Date(Date.now() + (6 * 60 + new Date().getTimezoneOffset()) * 60000);
    var m = now.getMonth(), day = now.getDate();
    if (m === 11 && day === 31) { el.textContent = 'Сегодня 31 декабря!'; cap.textContent = 'успеваем поздравить — звоните'; return; }
    if (m === 0 && day <= 2) { el.textContent = 'С Новым годом!'; cap.textContent = 'поздравляем до 2 января включительно'; return; }
    if (m < 8) { el.textContent = base.b; cap.textContent = base.s; return; }
    var today = new Date(now.getFullYear(), m, day);
    var d = Math.round((new Date(now.getFullYear() + 1, 0, 1) - today) / 864e5);
    el.textContent = d + ' ' + plural(d); cap.textContent = 'до Нового года — с 25.12 по 2.01 приходим каждый день';
  }
  draw(); setInterval(draw, 60 * 60 * 1000);
})();

// Фото героев на весь экран
(function () {
  var lb = document.getElementById('lb'), img = lb.querySelector('img');
  // фото галереи перерисовываются из content.json, поэтому ловим клик на самой галерее
  document.querySelector('.gallery').addEventListener('click', function (e) {
    var g = e.target.closest('img'); if (!g) return;
    img.src = g.src; img.alt = g.alt; lb.hidden = false;
  });
  function close() { lb.hidden = true; }
  lb.addEventListener('click', function (e) { if (e.target !== img) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
