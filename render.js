// Сайт собирается из data/content.json (его правит админка).
// В html лежит та же информация — запасной вариант для поисковиков и если скрипт не загрузился.
(function () {
  var MONTHS = { 'декабря': 11, 'января': 0 };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var rub = function (p) { return String(p).replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; };

  // время Омска (UTC+6), чтобы сезон и «выходные» не зависели от часов посетителя
  function omskNow() { return new Date(Date.now() + (6 * 60 + new Date().getTimezoneOffset()) * 60000); }
  // сезон: с сентября — текущий год, в январе — прошлый; с февраля по август — следующий («скоро»)
  function season() {
    var n = omskNow(), y = n.getFullYear(), m = n.getMonth();
    var start = m === 0 ? y - 1 : y;
    var open = m >= 8 || (m === 0 && n.getDate() <= 2);
    return { start: start, label: start + '–' + (start + 1), open: open };
  }
  // «26–27 декабря» → даты сезона; если все выходные — подпись «выходные»
  function weekendNote(label, start) {
    var mm = /(декабря|января)/.exec(label); if (!mm) return '';
    var month = MONTHS[mm[1]], year = month === 11 ? start : start + 1, days = [];
    String(label).replace(/(\d{1,2})\s*[–—-]\s*(\d{1,2})|(\d{1,2})/g, function (_, a, b, c) {
      if (c) days.push(+c); else for (var d = +a; d <= +b; d++) days.push(d);
    });
    if (!days.length) return '';
    // одна дата — день недели («суббота»); несколько — «выходные дни», если все выпали на выходные.
    // Слово «выходной» не пишем: его читают как «в этот день не работаем».
    var WD = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    if (days.length === 1) return WD[new Date(year, month, days[0]).getDay()];
    var all = days.every(function (d) { var w = new Date(year, month, d).getDay(); return w === 0 || w === 6; });
    return all ? 'выходные дни' : '';
  }
  // телефон → ссылки
  function digits(p) {
    var d = String(p).replace(/\D/g, '');
    if (d.length === 6) d = '73812' + d;          // городской Омск
    if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);
    if (d.length === 10) d = '7' + d;
    return d;
  }
  var tel = function (p) { return 'tel:+' + digits(p); };

  function minPrice(rows) {
    var all = [];
    rows.forEach(function (r) {
      if (r.price) all.push(+String(r.price).replace(/\D/g, ''));
      (r.slots || []).forEach(function (s) { if (s.price) all.push(+String(s.price).replace(/\D/g, '')); });
    });
    all = all.filter(Boolean);
    return all.length ? Math.min.apply(null, all) : 0;
  }
  function setImg(img, src, pos, alt) {
    if (!img || !src) return;
    img.src = src; if (alt != null) img.alt = alt;
    img.style.objectPosition = pos || '';
  }
  function list(el, items, fn) { if (el) el.innerHTML = items.map(fn).join(''); }

  function render(c) {
    var s = season(), k = c.contacts, mob = k.phone_mobile;
    var wa = 'https://wa.me/' + digits(k.whatsapp || mob), tg = 'https://t.me/+' + digits(k.telegram || mob), vk = 'https://vk.me/' + k.vk;
    var period = 'с ' + c.season.from + ' по ' + c.season.to;
    var min = minPrice(c.prices.rows);

    // первый экран
    $('.hero .kicker').textContent = 'Омск · ' + c.about.badge + ' · ' + (s.open ? 'сезон ' + s.label + ' открыт' : 'сезон ' + s.label + ' — скоро');
    $('.hero h1').textContent = c.hero.title;
    $('.hero .lead').textContent = c.hero.lead + ' Поздравляем ' + period + '.';
    $('.price-from').innerHTML = 'Поздравление — <b>от ' + rub(min) + '</b>';
    setImg($('.arch img'), c.hero.photo, c.hero.photo_pos);
    setImg($('.hero-photo .round'), c.hero.round);
    $('.hero-photo figcaption').textContent = c.hero.sticker;

    // телефоны и мессенджеры везде
    document.querySelectorAll('a.btn-red[href^="tel"], .fab a[href^="tel"]').forEach(function (a) {
      a.href = tel(mob);
      if (a.closest('.hero')) a.textContent = 'Позвонить · ' + mob;
      else if (a.closest('#contacts')) a.textContent = mob;
    });
    document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) { a.href = wa; });
    document.querySelectorAll('a[href*="t.me/"]').forEach(function (a) { a.href = tg; });
    document.querySelectorAll('a[href*="vk.me/"]').forEach(function (a) { a.href = vk; });
    var top = $('.top-tel'); top.href = tel(k.phone_city || mob); top.textContent = k.phone_city || mob;

    // цифры (последняя ячейка — отсчёт до Нового года, его считает script.js)
    var f = document.querySelectorAll('.facts > div');
    c.facts.slice(0, 3).forEach(function (x, i) { if (f[i]) f[i].innerHTML = '<b>' + esc(x.b) + '</b><span>' + esc(x.s) + '</span>'; });

    // о нас
    $('.about h2').textContent = c.about.title;
    $('.about .txt').textContent = c.about.text;
    setImg($('.about-pic img'), c.about.photo, c.about.photo_pos);
    $('.badge').innerHTML = esc(c.about.badge).replace(' ', '<br>');
    list($('.pluses'), c.about.pluses, function (p) { return '<li><b>' + esc(p.title) + '.</b> ' + esc(p.text) + '</li>'; });

    // цены
    $('#prices .kicker').textContent = 'Домашнее поздравление · ' + s.label;
    $('#prices .txt').textContent = c.prices.intro;
    var has = function (p) { return /\d/.test(String(p || '')); };   // строки без цены (ещё не заполнены) не показываем
    list($('.prices'), c.prices.rows.filter(function (r) {
      return r.dates && (has(r.price) || (r.slots || []).some(function (x) { return has(x.price); }));
    }), function (r) {
      var note = r.note || weekendNote(r.dates, s.start);
      var slots = (r.slots || []).filter(function (x) { return has(x.price); });
      if (slots.length) {
        return '<div class="pr pr-31"><span class="d31">' + esc(r.dates) + '</span><div class="t31">' +
          slots.map(function (x) { return '<div><span>' + esc(x.time) + '</span><b>' + rub(x.price) + '</b></div>'; }).join('') + '</div></div>';
      }
      return '<div class="pr"><span>' + esc(r.dates) + (note ? ' <small>' + esc(note) + '</small>' : '') + '</span><b>' + rub(r.price) + '</b></div>';
    });
    $('.hint').textContent = '❄ ' + c.season.note;
    $('.incl h3').textContent = c.prices.incl_title;
    setImg($('.incl img'), c.prices.incl_photo, c.prices.incl_pos);
    list($('.incl ul'), c.prices.incl, function (t) { return '<li>' + esc(t) + '</li>'; });

    // как проходит
    $('#how h2').textContent = c.how.title;
    list($('.steps'), c.how.steps, function (x, i) { return '<li><span>' + (i + 1) + '</span><div><b>' + esc(x.title) + '</b>' + esc(x.text) + '</div></li>'; });
    list($('.tips ul'), c.how.tips, function (t) { return '<li>' + esc(t) + '</li>'; });

    // герои
    $('#heroes h2').textContent = c.heroes.title;
    $('#heroes .txt').textContent = c.heroes.text;
    list($('.gallery'), c.heroes.photos, function (p, i) {
      return '<img src="' + esc(p.src) + '" alt="' + esc(p.alt) + '" loading="lazy"' + (i === 0 ? ' class="g-wide"' : '') + (p.pos ? ' style="object-position:' + esc(p.pos) + '"' : '') + '>';
    });

    // отзывы
    $('#reviews h2').textContent = c.reviews.title;
    list($('.revs'), c.reviews.items, function (r) { return '<blockquote><p>' + esc(r.text) + '</p>' + (r.author ? '<cite>' + esc(r.author) + '</cite>' : '') + '</blockquote>'; });

    // вопросы
    list($('.faq'), c.faq.items, function (x, i) { return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(x.q) + '</summary><p>' + esc(x.a) + '</p></details>'; });
    setImg($('.faq-pic'), c.faq.photo);

    // контакты
    var rows = [['Телефон', k.phone_city, tel(k.phone_city)], ['Мобильный', mob, tel(mob)]];
    if (k.phone_boss) rows.push(['Руководитель', k.phone_boss + (k.boss_name ? ' (' + k.boss_name + ')' : ''), tel(k.phone_boss)]);
    if (k.email) rows.push(['Почта', k.email, 'mailto:' + k.email]);
    if (k.show_office && k.office) rows.push(['Офис', k.office, 'https://yandex.ru/maps/?text=' + encodeURIComponent('Омск, ' + k.office)]);
    rows.push(['Группа', 'vk.com/' + k.vk, 'https://vk.com/' + k.vk]);
    list($('.clist'), rows.filter(function (r) { return r[1]; }), function (r) {
      var ext = /^https/.test(r[2]) ? ' target="_blank" rel="noopener"' : '';
      return '<li><span>' + r[0] + '</span><a href="' + esc(r[2]) + '"' + ext + '>' + esc(r[1]) + '</a></li>';
    });
    document.querySelectorAll('a[href^="https://vk.com/"]').forEach(function (a) { if (a.closest('#reviews')) a.href = 'https://vk.com/' + k.vk; });

    document.dispatchEvent(new CustomEvent('content:ready'));
  }

  // откуда брать контент: черновик демо-админки (только на демо) → content.json → встроенная копия
  var seed = window.DM_SEED;
  var demoHost = /github\.io$/.test(location.hostname) || location.protocol === 'file:' || location.hostname === '127.0.0.1' || location.hostname === 'localhost';
  function withDraft(c) {
    if (!demoHost) return c;
    try {
      var d = JSON.parse(localStorage.getItem('dm_draft') || 'null');
      if (d && d.rev === c.rev && d.data) return d.data;   // черновик со старой версии сайта сбрасывается
      if (d) localStorage.removeItem('dm_draft');
    } catch (e) {}
    return c;
  }
  window.DM_RENDER = render;
  function seedP() {
    if (window.DM_SEED) return Promise.resolve(window.DM_SEED);
    return new Promise(function (ok) { var s = document.createElement('script'); s.src = 'data/content.js'; s.onload = s.onerror = function () { ok(window.DM_SEED); }; document.head.appendChild(s); });
  }
  var src = location.protocol === 'file:' ? seedP()   // файлом с компьютера — встроенная копия
    : fetch('data/content.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); });
  src.catch(function () { return seedP(); })
    .then(function (c) { if (c) render(withDraft(c)); });
})();
