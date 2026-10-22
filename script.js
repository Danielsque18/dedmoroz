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
  var n = w < 700 ? 40 : 90;
  for (var i = 0; i < n; i++) {
    flakes.push({ x: Math.random() * w, y: Math.random() * h, r: .8 + Math.random() * 2.6, v: .3 + Math.random() * 1, a: Math.random() * 6.28 });
  }
  var visible = true;
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(c);
  (function tick() {
    if (visible) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      flakes.forEach(function (f) {
        f.y += f.v; f.a += .01; f.x += Math.sin(f.a) * .4;
        if (f.y > h) { f.y = -5; f.x = Math.random() * w; }
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.28); ctx.fill();
      });
    }
    requestAnimationFrame(tick);
  })();
})();

// Кнопки «Позвонить / WhatsApp» на телефоне: не показываем на первом экране (там свои кнопки) и у блока контактов
(function () {
  var fab = document.querySelector('.fab'); if (!fab || !('IntersectionObserver' in window)) return;
  var vis = {};
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { vis[e.target.id || 'hero'] = e.isIntersecting; });
    fab.classList.toggle('off', !!(vis.hero || vis.contacts));
  }, { threshold: .1 });
  io.observe(document.querySelector('.hero')); io.observe(document.getElementById('contacts'));
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

// Наши герои: карусель — фото одной высоты в своей форме, текущее по центру
(function () {
  var car = document.getElementById('car'), track = car.querySelector('.car-track'), g = document.getElementById('gallery');
  var cnt = document.querySelector('.car-count'), title = document.querySelector('.car-title'), i = 0, items = [];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function build() {
    track.innerHTML = [].map.call(g.querySelectorAll('img'), function (im, k) {
      return '<button type="button" class="car-item" data-k="' + k + '"><img src="' + im.getAttribute('src') + '" alt="' + im.alt.replace(/"/g, '&quot;') + '"' + (k > 2 ? ' loading="lazy"' : '') + '></button>';
    }).join('');
    items = [].slice.call(track.children); show(0, true);
  }
  function show(n, instant) {
    if (!items.length) return;
    i = (n + items.length) % items.length;
    items.forEach(function (x, k) { x.classList.toggle('on', k === i); x.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    var it = items[i];
    car.scrollTo({ left: it.offsetLeft - (car.clientWidth - it.offsetWidth) / 2, behavior: instant ? 'auto' : 'smooth' });
    cnt.innerHTML = '<b>' + pad(i + 1) + '</b>/' + items.length;
    title.textContent = it.querySelector('img').alt;
  }
  window.DM_CAR_NEXT = function () { show(i + 1); };
  document.querySelector('.car-prev').addEventListener('click', function () { show(i - 1); });
  document.querySelector('.car-next').addEventListener('click', function () { show(i + 1); });
  // нажали на соседнее — оно становится текущим; на текущее — открываем целиком
  var lb = document.getElementById('lb'), lbi = lb.querySelector('img');
  track.addEventListener('click', function (e) {
    var b = e.target.closest('.car-item'); if (!b) return;
    var k = +b.dataset.k; if (k !== i) return show(k);
    lbi.src = b.querySelector('img').src; lbi.alt = b.querySelector('img').alt; lb.hidden = false;
  });
  function close() { lb.hidden = true; }
  lb.addEventListener('click', function (e) { if (e.target !== lbi) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  // свайп
  var x0 = null;
  car.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  car.addEventListener('touchend', function (e) { if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); });
  car.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.preventDefault(); }, { passive: false });
  addEventListener('resize', function () { show(i, true); });
  // высота у фото задана в CSS, ширина приходит после загрузки — перецентрировать
  track.addEventListener('load', function () { show(i, true); }, true);
  build(); document.addEventListener('content:ready', build);
})();

// Стрелка у отзывов
document.querySelectorAll('.rail-next').forEach(function (b) {
  var r = document.getElementById(b.dataset.for);
  b.addEventListener('click', function () {
    var end = r.scrollLeft + r.clientWidth >= r.scrollWidth - 4;
    r.scrollTo({ left: end ? 0 : r.scrollLeft + r.clientWidth * .8, behavior: 'smooth' });
  });
});

// Меню на телефоне
(function () {
  var top = document.querySelector('.top'), b = top.querySelector('.burger');
  b.addEventListener('click', function () { var o = top.classList.toggle('open'); b.setAttribute('aria-expanded', o); });
  top.querySelectorAll('.nav a').forEach(function (a) { a.addEventListener('click', function () { top.classList.remove('open'); b.setAttribute('aria-expanded', false); }); });
})();

// ---------- переходы и мелкие эффекты ----------
var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

// заголовок первого экрана появляется по словам
function splitH1() {
  var h = document.querySelector('.hero h1'); if (!h || calm) return;
  var words = h.textContent.split(/\s+/);
  // неразрывные пробелы внутри «и Снегурочка» и т.п. остаются внутри слова
  // короткие слова («и», «к», «в») склеиваем со следующим, чтобы они не висели в конце строки
  var parts = [];
  words.forEach(function (w) { var last = parts[parts.length - 1]; if (last && last.length <= 2 && !/\s/.test(last)) parts[parts.length - 1] = last + '\u00a0' + w; else parts.push(w); });
  h.innerHTML = parts.map(function (w, i) { return '<span class="w" style="--i:' + i + '">' + w.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>'; }).join(' ');
}
// карточки в блоках появляются по очереди
function stagger() {
  document.querySelectorAll('.facts>div, .pluses li, .tiles li, .pcol, .steps li, .revs blockquote, .faq details').forEach(function (el) {
    el.classList.add('st');
    el.style.setProperty('--i', [].indexOf.call(el.parentNode.children, el) % 8);
  });
}
splitH1(); stagger();
document.addEventListener('content:ready', function () { splitH1(); stagger(); });

// шапка: тень после первого экрана и подсветка раздела в меню
(function () {
  var top = document.querySelector('.top'), links = {};
  document.querySelectorAll('.nav a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  new IntersectionObserver(function (es) {
    top.classList.toggle('scrolled', !es[0].isIntersecting);
    if (es[0].isIntersecting) Object.keys(links).forEach(function (k) { links[k].classList.remove('on'); });
  }).observe(document.querySelector('.hero'));
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      Object.keys(links).forEach(function (k) { links[k].classList.toggle('on', k === e.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(links).forEach(function (k) { var el = document.getElementById(k); if (el) io.observe(el); });
})();

// золотые искры на первом экране
(function () {
  var box = document.querySelector('.sparks'); if (!box) return;
  var n = innerWidth < 700 ? 10 : 22, h = '';
  for (var i = 0; i < n; i++) {
    h += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (Math.random() * 85).toFixed(1) + '%;--s:' + (4 + Math.random() * 6).toFixed(1) + 'px;--d:' + (2.5 + Math.random() * 3).toFixed(1) + 's;--l:' + (Math.random() * 4).toFixed(1) + 's"></i>';
  }
  box.innerHTML = h;
})();

// лента фото между блоками: те же фото, что в «Наших героях», бесконечно едут влево
function fillRibbon() {
  var r = document.querySelector('.ribbon-in'); if (!r) return;
  // каждое фото один раз (без повторов по адресу); второй круг нужен только для бесшовной прокрутки
  var seen = {}, list = [].filter.call(document.querySelectorAll('#gallery img'), function (i) { var k = i.getAttribute('src'); if (seen[k]) return false; seen[k] = 1; return true; });
  var imgs = list.map(function (i) { return '<img src="' + i.src + '" alt="" loading="lazy">'; }).join('');
  r.innerHTML = imgs + imgs;
}


// ---------- «живой» сайт ----------
(function () {
  if (calm) return;
  var mobile = innerWidth < 701;

  // снег и искры в тёмных блоках
  // искры и в арке за Дедом Морозом
  (function () { var a = document.querySelector('.about-pic'); if (!a) return; var sp = document.createElement('div'); sp.className = 'sparks'; var h = ''; for (var i = 0; i < 9; i++) h += '<i style="left:' + (10 + Math.random() * 80).toFixed(1) + '%;top:' + (5 + Math.random() * 60).toFixed(1) + '%;--s:' + (4 + Math.random() * 5).toFixed(1) + 'px;--d:' + (2.5 + Math.random() * 3).toFixed(1) + 's;--l:' + (Math.random() * 4).toFixed(1) + 's"></i>'; sp.innerHTML = h; a.appendChild(sp); })();

  document.querySelectorAll('.panel, .tb, .contacts').forEach(function (box) {
    var sp = document.createElement('div'); sp.className = 'sparks'; box.appendChild(sp);
    var h = '';
    for (var i = 0; i < (mobile ? 6 : 12); i++) h += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (Math.random() * 90).toFixed(1) + '%;--s:' + (4 + Math.random() * 5).toFixed(1) + 'px;--d:' + (2.5 + Math.random() * 3).toFixed(1) + 's;--l:' + (Math.random() * 4).toFixed(1) + 's"></i>';
    sp.innerHTML = h;
    var c = document.createElement('canvas'); c.className = 'snow snow-in'; c.setAttribute('aria-hidden', 'true'); box.appendChild(c);
    var ctx = c.getContext('2d'), w, hh, dpr = Math.min(2, devicePixelRatio || 1), fl = [], on = false;
    function size() { w = c.offsetWidth; hh = c.offsetHeight; c.width = w * dpr; c.height = hh * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); addEventListener('resize', size);
    for (var k = 0; k < (mobile ? 22 : 45); k++) fl.push({ x: Math.random() * w, y: Math.random() * hh, r: .6 + Math.random() * 2, v: .25 + Math.random() * .7, a: Math.random() * 6.28 });
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; }).observe(box);
    (function tick() {
      if (on) {
        ctx.clearRect(0, 0, w, hh); ctx.fillStyle = 'rgba(255,255,255,.55)';
        fl.forEach(function (f) { f.y += f.v; f.a += .012; f.x += Math.sin(f.a) * .35; if (f.y > hh) { f.y = -4; f.x = Math.random() * w; } ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.28); ctx.fill(); });
      }
      requestAnimationFrame(tick);
    })();
  });

  // глубина на первом экране: лес, луна и герои двигаются с разной скоростью
  var hero = document.querySelector('.hero'), night = document.querySelector('.night') || document.createElement('i'), moon = document.querySelector('.moon') || document.createElement('i'), ph = document.querySelector('.hero-photo'), vis = true, mx = 0, my = 0, raf = 0;
  new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(hero);
  function paint() {
    raf = 0; if (!vis) return;
    var y = scrollY;
    night.style.transform = 'translate3d(' + (mx * -10) + 'px,' + (y * .35) + 'px,0) scale(1.08)';
    moon.style.transform = 'translate3d(' + (mx * -20) + 'px,' + (y * .2) + 'px,0)';
    var img = ph.querySelector('img'); if (img && innerWidth > 900) img.style.transform = 'translate3d(' + (mx * -14) + 'px,' + (y * .25) + 'px,0) scale(1.06)';
  }
  function ask() { if (!raf) raf = requestAnimationFrame(paint); }
  addEventListener('scroll', ask, { passive: true });
  if (matchMedia('(hover: hover)').matches) hero.addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; ask(); });
  ph.addEventListener('animationend', function () { ph.style.animation = 'none'; paint(); });

  // цифры отсчитываются, когда до них долистали
  var facts = document.querySelectorAll('.facts > div:not(.fact-ny) b');
  new IntersectionObserver(function (es, io) {
    if (!es[0].isIntersecting) return; io.disconnect();
    facts.forEach(function (b) {
      var m = /^(\d+)(.*)$/.exec(b.textContent.trim()); if (!m) return;
      var to = +m[1], rest = m[2], t0 = performance.now();
      (function step(t) { var p = Math.min(1, (t - t0) / 1400); p = 1 - Math.pow(1 - p, 3); b.textContent = Math.round(to * p) + rest; if (p < 1) requestAnimationFrame(step); })(t0);
    });
  }, { threshold: .4 }).observe(document.querySelector('.facts'));

  // слайдер героев листается сам; если человек листает сам — пауза 12 секунд
  var stage = document.getElementById('car'), next = { click: function () { window.DM_CAR_NEXT && window.DM_CAR_NEXT(); } }, pause = 0, stOn = false;
  new IntersectionObserver(function (es) { stOn = es[0].isIntersecting; }).observe(stage);
  ['pointerdown', 'touchstart', 'mouseenter'].forEach(function (ev) { document.querySelector('#heroes').addEventListener(ev, function () { pause = Date.now() + 12000; }, { passive: true }); });
  setInterval(function () { if (stOn && Date.now() > pause && !document.hidden) next.click(), pause = 0; }, 5000);

  // отзывы тоже едут сами
  var revs = document.getElementById('revs'), rp = 0, rOn = false;
  new IntersectionObserver(function (es) { rOn = es[0].isIntersecting; }).observe(revs);
  ['pointerdown', 'touchstart', 'wheel', 'mouseenter'].forEach(function (ev) { revs.addEventListener(ev, function () { rp = Date.now() + 12000; }, { passive: true }); });
  setInterval(function () {
    if (!rOn || Date.now() < rp || document.hidden) return;
    var card = revs.querySelector('blockquote'); if (!card) return;
    var end = revs.scrollLeft + revs.clientWidth >= revs.scrollWidth - 4;
    revs.scrollTo({ left: end ? 0 : revs.scrollLeft + card.offsetWidth + 16, behavior: 'smooth' });
  }, 6000);
})();


// календарь цен: нажали на дату → окошко с готовым сообщением в WhatsApp (ничего не сохраняется)
(function () {
  var sheet = document.getElementById('sheet'); if (!sheet) return;
  var last = null;
  function open(b) {
    var d = b.dataset.d, w = b.dataset.w, t = b.dataset.t, p = b.dataset.p;
    document.getElementById('sheetK').textContent = w;
    document.getElementById('sheetT').textContent = d + (t ? ', ' + t : '');
    document.getElementById('sheetP').innerHTML = 'Поздравление 30 минут — <b>' + p + '</b>';
    var msg = 'Здравствуйте! Хотим пригласить Деда Мороза и Снегурочку ' + d + ' (' + w + ')' + (t ? ', ' + t : '') + (t ? '. Это время ещё свободно?' : '. Подскажите, пожалуйста, какое время свободно?');
    document.getElementById('sheetWa').href = (window.DM_WA || 'https://wa.me/79040746409') + '?text=' + encodeURIComponent(msg);
    document.getElementById('sheetCall').href = window.DM_TEL || 'tel:+79040746409';
    last = b; sheet.hidden = false; requestAnimationFrame(function () { sheet.classList.add('on'); });
    sheet.querySelector('.sheet-x').focus();
  }
  function close() { sheet.classList.remove('on'); setTimeout(function () { sheet.hidden = true; }, 250); if (last) last.focus(); }
  document.getElementById('cal').addEventListener('click', function (e) { var b = e.target.closest('button[data-d]'); if (b) open(b); });
  sheet.addEventListener('click', function (e) { if (e.target === sheet || e.target.closest('.sheet-x')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) close(); });
})();
