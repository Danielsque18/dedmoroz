// Админка сайта «Сибирская служба Деда Мороза».
// На хостинге с PHP работает через api.php. На GitHub (демо) PHP нет — тогда правки хранятся в этом браузере.
(function () {
  var DEMO_PASS = 'dedmoroz2026';
  var API = 'api.php';
  var demo = false, csrf = null, data = null, rev = null, dirty = false, tab = 0;
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // ---------- что можно править: вкладки названы так же, как блоки на сайте ----------
  var TABS = [
    { t: 'Первый экран', hint: 'Самый верх сайта: заголовок и большое фото на весь экран. Фото лучше горизонтальное, где герой справа — слева на фото будет текст. Сезон «2026–2027 открыт» и цены считаются сами.', f: [
      ['hero.title', 'Заголовок', 'text'],
      ['hero.lead', 'Текст под заголовком', 'area'],
      ['hero.photo', 'Большое фото на весь экран', 'img', 'hero.photo_pos'],
      ['hero.round', 'Маленькое круглое фото', 'img'],
      ['hero.sticker', 'Надпись у круглого фото', 'text']
    ]},
    { t: 'Цифры', hint: 'Белые карточки под первым экраном. Четвёртая ячейка — отсчёт до Нового года, она считается сама.', f: [
      ['facts', 'Ячейки', 'list', [['b', 'Крупно', 'text'], ['s', 'Подпись', 'text']], { fixed: 3 }]
    ]},
    { t: 'О нас', f: [
      ['about.title', 'Заголовок', 'text'],
      ['about.text', 'Текст', 'area'],
      ['about.badge', 'Золотая плашка на фото', 'text', 'Например: «с 2006 года». Это же попадёт в строку над главным заголовком.'],
      ['about.photo', 'Фото', 'img', 'about.photo_pos'],
      ['about.pluses', 'Преимущества', 'list', [['title', 'Коротко (жирным)', 'text'], ['text', 'Подробно', 'area']]]
    ]},
    { t: 'Цены', hint: 'Даты пишите как на сайте: «25, 28 и 29 декабря», «26–27 декабря», «1 января». Дни недели и «выходные дни» под датами, год сезона и цена «от …» на первом экране ставятся сами.', f: [
      ['season.from', 'Начало поздравлений', 'text', 'Например: 25 декабря'],
      ['season.to', 'Последний день', 'text', 'Например: 2 января'],
      ['prices.intro', 'Текст над таблицей', 'area'],
      ['prices.rows', 'Строки таблицы', 'list', [['dates', 'Даты', 'text']], { rows: true }],
      ['season.note', 'Подсказка под таблицей', 'text'],
      ['prices.prepay', 'Строка про предоплату', 'text', 'Пусто — строка не показывается']
    ]},
    { t: 'Как проходит', f: [
      ['how.title', 'Заголовок', 'text'],
      ['prices.incl_photo', 'Фото', 'img', 'prices.incl_pos'],
      ['how.steps', 'Шаги', 'list', [['title', 'Название шага', 'text'], ['text', 'Описание', 'area']]],
      ['how.tips_title', 'Заголовок советов', 'text'],
      ['how.tips', 'Советы родителям', 'list', [['title', 'Коротко (жирным)', 'text'], ['text', 'Подробно', 'area']]]
    ]},
    { t: 'Как с картинки (фото)', hint: 'Фото героев в карусели. Под текущим фото показываются его заголовок и текст. Порядок меняется стрелками.', f: [
      ['heroes.title', 'Заголовок', 'text'],
      ['heroes.text', 'Текст', 'area'],
      ['heroes.photos', 'Фото', 'list', [['src', 'Фото', 'img', 'pos'], ['title', 'Заголовок под фото', 'text'], ['text', 'Текст под фото', 'area'], ['alt', 'Описание фото (для поиска и незрячих)', 'text']]]
    ]},
    { t: 'Отзывы', f: [
      ['reviews.title', 'Заголовок', 'text'],
      ['reviews.items', 'Отзывы', 'list', [['text', 'Текст отзыва', 'area'], ['author', 'Автор (можно не указывать)', 'text']]]
    ]},
    { t: 'Вопросы', f: [
      ['faq.items', 'Вопросы родителей', 'list', [['q', 'Вопрос', 'text'], ['a', 'Ответ', 'area']]],
      ['faq.photo', 'Фото рядом с вопросами', 'img']
    ]},
    { t: 'Контакты', hint: 'Номера пишите как удобно — ссылки для звонка и WhatsApp сайт сделает сам.', f: [
      ['contacts.phone_mobile', 'Главный номер (на всех кнопках «Позвонить»)', 'text'],
      ['contacts.phone_city', 'Городской номер', 'text'],
      ['contacts.whatsapp', 'Номер для WhatsApp', 'text'],
      ['contacts.max', 'Ссылка на MAX', 'text', 'Пусто — кнопка MAX не показывается'],
      ['contacts.vk', 'Группа ВК (то, что после vk.com/)', 'text'],
      ['contacts.phone_boss', 'Телефон руководителя', 'text', 'Пусто — строка не показывается'],
      ['contacts.boss_name', 'Имя руководителя', 'text'],
      ['contacts.email', 'Почта', 'text'],
      ['contacts.office', 'Адрес офиса', 'text'],
      ['contacts.show_office', 'Показывать адрес офиса на сайте', 'bool']
    ]},
    { t: 'Настройки', settings: true },
    { t: 'Помощь', help: true }
  ];

  // ---------- доступ к полям по пути «about.photo» ----------
  function get(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function set(o, p, v) { var k = p.split('.'), l = k.pop(); k.reduce(function (a, x) { return a[x] = a[x] || {}; }, o)[l] = v; }
  function mark() { dirty = true; $('#state').textContent = 'Есть несохранённые изменения'; $('#state').classList.add('dirty'); }
  function toast(t, bad) { var el = $('#toast'); el.textContent = t; el.className = 'toast' + (bad ? ' bad' : ''); el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 4000); }

  // ---------- поля формы ----------
  function field(obj, key, label, type, extra, hint) {
    var wrap = document.createElement('div'); wrap.className = 'f';
    var val = obj[key];
    if (type === 'bool') {
      wrap.innerHTML = '<label class="chk"><input type="checkbox"' + (val ? ' checked' : '') + '> ' + esc(label) + '</label>';
      wrap.querySelector('input').onchange = function (e) { obj[key] = e.target.checked; mark(); };
      return wrap;
    }
    if (type === 'img') return imgField(obj, key, label, extra);
    wrap.innerHTML = '<span>' + esc(label) + '</span>' + (type === 'area' ? '<textarea></textarea>' : '<input type="' + (type === 'price' ? 'text" inputmode="numeric' : 'text') + '">') + (hint ? '<small>' + esc(hint) + '</small>' : '');
    var inp = wrap.querySelector('input,textarea'); inp.value = val == null ? '' : val;
    inp.oninput = function () { obj[key] = type === 'price' ? inp.value.replace(/\D/g, '') : inp.value; if (type === 'price') inp.value = obj[key]; mark(); };
    return wrap;
  }
  // фото: загрузить новое и выбрать, какую часть кадра показывать (чтобы не обрезалось лицо)
  function imgField(obj, key, label, posKey) {
    var wrap = document.createElement('div'); wrap.className = 'f img-f';
    var posObj = obj, pk = posKey;
    function src(s) { return /^(data:|https?:)/.test(s) ? s : '../' + s; }
    function draw() {
      var s = obj[key] || '', pos = pk ? (posObj[pk] || '50% 50%') : '50% 50%';
      var cut = /(^|\/)cut-/.test(s);   // вырезанное фото без фона — показываем целиком на тёмном фоне, как на сайте
      wrap.innerHTML = '<span>' + esc(label) + '</span><div class="img-prev' + (cut ? ' cut' : '') + '">' +
        '<figure class="ph"><img src="' + esc(src(s)) + '" style="object-position:' + esc(pos) + '"><figcaption>на телефоне</figcaption></figure>' +
        '<figure class="pc"><img src="' + esc(src(s)) + '" style="object-position:' + esc(pos) + '"><figcaption>на компьютере</figcaption></figure></div>' +
        (pk && !cut ? '<small>Нажмите на фото в то место, которое должно быть видно всегда (например, на лицо).</small>' : '') +
        '<div class="img-btns"><label class="b b-sm">Загрузить другое фото<input type="file" accept="image/jpeg,image/png,image/webp" hidden></label></div>';
      wrap.querySelector('input[type=file]').onchange = function (e) { upload(e.target.files[0], function (path) { obj[key] = path; if (pk) posObj[pk] = ''; mark(); draw(); }); };
      if (pk && !cut) wrap.querySelectorAll('.img-prev img').forEach(function (im) {
        im.onclick = function (e) {
          var r = im.getBoundingClientRect();
          posObj[pk] = Math.round((e.clientX - r.left) / r.width * 100) + '% ' + Math.round((e.clientY - r.top) / r.height * 100) + '%';
          mark(); draw();
        };
      });
    }
    draw();
    return wrap;
  }
  // список: добавить, удалить, поменять порядок
  function listField(arr, label, sub, opt) {
    opt = opt || {};
    var card = document.createElement('div'); card.className = 'card';
    function draw() {
      card.innerHTML = '<h3>' + esc(label) + '</h3>';
      arr.forEach(function (it, i) {
        var box = document.createElement('div'); box.className = 'item';
        var h = '<div class="item-h"><b>' + (i + 1) + '</b>';
        if (!opt.fixed) h += '<button class="b b-sm" data-a="up" type="button" aria-label="Выше">↑</button><button class="b b-sm" data-a="down" type="button" aria-label="Ниже">↓</button><button class="b b-sm b-del" data-a="del" type="button">Удалить</button>';
        box.innerHTML = h + '</div>';
        if (opt.rows) {
          it.slots = it.slots || [];
          box.appendChild(field(it, 'dates', 'Даты', 'text'));
          if (it.slots.length) {
            box.appendChild(listField(it.slots, 'Цена по времени', [['time', 'Время', 'text'], ['price', 'Цена, ₽', 'price']]));
            var one = document.createElement('button'); one.type = 'button'; one.className = 'b b-sm add'; one.textContent = 'Сделать одну цену на весь день';
            one.onclick = function () { if (!confirm('Убрать цены по времени у этой даты?')) return; it.price = (it.slots[0] || {}).price || ''; it.slots = []; mark(); draw(); };
            box.appendChild(one);
          } else {
            box.appendChild(field(it, 'price', 'Цена, ₽', 'price'));
            var tm = document.createElement('button'); tm.type = 'button'; tm.className = 'b b-sm add'; tm.textContent = 'Цена зависит от времени (как 31 декабря)';
            tm.onclick = function () { it.slots = [{ time: 'до 13:00', price: it.price || '' }, { time: 'после 13:00', price: '' }]; it.price = ''; mark(); draw(); };
            box.appendChild(tm);
          }
        } else if (sub === 'strings') {
          var f = field(arr, i, '', opt.area ? 'area' : 'text'); f.querySelector('span').remove(); box.appendChild(f);
        } else sub.forEach(function (s) {
          if (s[2] === 'list') { it[s[0]] = it[s[0]] || []; box.appendChild(listField(it[s[0]], s[1], s[3])); }
          else box.appendChild(field(it, s[0], s[1], s[2], s[2] === 'img' ? s[3] : null, s[2] === 'img' ? null : s[3]));
        });
        box.querySelectorAll(':scope > .item-h [data-a]').forEach(function (b) {
          b.onclick = function () {
            var a = b.dataset.a;
            if (a === 'del') { if (!confirm('Удалить пункт ' + (i + 1) + '?')) return; arr.splice(i, 1); }
            if (a === 'up' && i > 0) arr.splice(i - 1, 0, arr.splice(i, 1)[0]);
            if (a === 'down' && i < arr.length - 1) arr.splice(i + 1, 0, arr.splice(i, 1)[0]);
            mark(); draw();
          };
        });
        card.appendChild(box);
      });
      if (!opt.fixed) {
        var add = document.createElement('button'); add.type = 'button'; add.className = 'b b-sm add'; add.textContent = '+ Добавить';
        add.onclick = function () {
          var n = {}; if (sub === 'strings') n = ''; else sub.forEach(function (s) { n[s[0]] = s[2] === 'list' ? [] : s[2] === 'bool' ? false : ''; });
          arr.push(n); mark(); draw();
        };
        card.appendChild(add);
      }
    }
    draw();
    return card;
  }

  function showTab(i) {
    tab = i;
    document.querySelectorAll('#tabs button').forEach(function (b, j) { b.classList.toggle('on', j === i); });
    var t = TABS[i], p = $('#panel'); p.innerHTML = '<h2>' + esc(t.t) + '</h2>' + (t.hint ? '<p class="hint">' + esc(t.hint) + '</p>' : '');
    if (t.settings) return settings(p);
    if (t.help) return help(p);
    // поля идут в том же порядке, что и на сайте: простые поля собираются в карточку, список — отдельной карточкой
    var card = null;
    t.f.forEach(function (f) {
      var path = f[0], parts = path.split('.'), key = parts.pop(), obj = parts.length ? get(data, parts.join('.')) : data;
      if (f[2] === 'list' || f[2] === 'strings') {
        obj[key] = obj[key] || [];
        p.appendChild(listField(obj[key], f[1], f[2] === 'strings' ? 'strings' : f[3], f[2] === 'strings' ? f[3] : f[4]));
        card = null;
        return;
      }
      if (!card) { card = document.createElement('div'); card.className = 'card'; p.appendChild(card); }
      if (f[2] === 'img') { var pp = f[3], po = pp ? get(data, pp.split('.').slice(0, -1).join('.')) : obj; card.appendChild(imgFieldWith(obj, key, f[1], po, pp ? pp.split('.').pop() : null)); }
      else card.appendChild(field(obj, key, f[1], f[2], null, f[3]));
    });
  }
  function imgFieldWith(obj, key, label, posObj, pk) {
    // фото с выбором кадра, когда позиция лежит рядом (hero.photo + hero.photo_pos)
    var proxy = {};
    Object.defineProperty(proxy, 'src', { get: function () { return obj[key]; }, set: function (v) { obj[key] = v; } });
    if (pk) Object.defineProperty(proxy, 'pos', { get: function () { return posObj[pk]; }, set: function (v) { posObj[pk] = v; } });
    return imgField(proxy, 'src', label, pk ? 'pos' : null);
  }

  // памятка — всегда под рукой, прямо в админке
  function help(p) {
    var H = [
      ['Как поменять цену', 'Вкладка «Цены» → найдите дату → впишите новую цену (только цифры) → нажмите красную кнопку «Сохранить» вверху. Цена «от …» на первом экране пересчитается сама.'],
      ['Как поменять фото', 'Откройте вкладку того блока, где фото (например, «Наши герои») → «Загрузить другое фото» → выберите фото с телефона или компьютера → «Сохранить». Если обрезалось лицо — нажмите на превью прямо в то место, где лицо.'],
      ['Как добавить отзыв или вопрос', 'Вкладка «Отзывы» или «Вопросы» → внизу списка «+ Добавить» → заполните → «Сохранить». Порядок меняется стрелками ↑ ↓.'],
      ['Что сайт делает сам', 'Год сезона («2026–2027 открыт» с сентября, «скоро» с февраля по август), дни недели и «выходные дни» под датами, цену «от …», отсчёт дней до Нового года, ссылки для звонка, WhatsApp и Telegram из номеров. Это менять не нужно.'],
      ['Если что-то пошло не так', 'Вкладка «Настройки» → «Резервные копии» → «Вернуть эту версию». Копия делается сама перед каждым сохранением.'],
      ['Каждый год — обязательно', 'Продлить домен ded-moroz55.ru до 5 ноября (иначе адрес пропадёт) и оплатить хостинг. В сентябре — проверить цены и даты на вкладке «Цены».'],
      ['Пароль', 'Меняется во вкладке «Настройки». Никому не сообщайте адрес этой страницы и пароль. После 8 неверных попыток вход блокируется на 15 минут.']
    ];
    H.forEach(function (h) {
      var c = document.createElement('div'); c.className = 'card';
      c.innerHTML = '<h3>' + esc(h[0]) + '</h3><p style="margin:0">' + esc(h[1]) + '</p>';
      p.appendChild(c);
    });
  }

  function settings(p) {
    var c = document.createElement('div'); c.className = 'card';
    if (demo) {
      c.innerHTML = '<h3>Демо-версия</h3><p class="hint" style="margin:0">Пароль и резервные копии появятся на настоящем сайте. Здесь можно вернуть всё как было.</p><button class="b b-sm b-del" type="button" id="reset">Сбросить мои изменения</button>';
      p.appendChild(c);
      $('#reset').onclick = function () { if (confirm('Вернуть сайт к исходному виду?')) { localStorage.removeItem('dm_draft'); location.reload(); } };
      return;
    }
    c.innerHTML = '<h3>Сменить пароль</h3><div class="f"><span>Старый пароль</span><input type="password" id="pOld" autocomplete="current-password"></div><div class="f"><span>Новый пароль (минимум 8 символов)</span><input type="password" id="pNew" autocomplete="new-password"></div><button class="b b-red" type="button" id="pGo">Сменить пароль</button>';
    p.appendChild(c);
    $('#pGo').onclick = function () {
      api('password', { old: $('#pOld').value, new: $('#pNew').value }).then(function () { toast('Пароль изменён'); $('#pOld').value = $('#pNew').value = ''; }).catch(function (e) { toast(e.message, true); });
    };
    var b = document.createElement('div'); b.className = 'card'; b.innerHTML = '<h3>Резервные копии</h3><p class="hint" style="margin:0">Перед каждым сохранением сайт сам делает копию (хранятся последние 30). Если что-то пошло не так — верните нужную.</p><div class="backups" id="bk">Загрузка…</div>';
    p.appendChild(b);
    api('backups', {}).then(function (r) {
      $('#bk').innerHTML = r.items.length ? '' : 'Пока копий нет';
      r.items.forEach(function (it) {
        var m = /content-(\d{4})-(\d\d)-(\d\d)_(\d\d)-(\d\d)/.exec(it.name), row = document.createElement('div');
        row.innerHTML = '<span>' + (m ? m[3] + '.' + m[2] + '.' + m[1] + ' в ' + m[4] + ':' + m[5] : esc(it.name)) + '</span><button class="b b-sm" type="button">Вернуть эту версию</button>';
        row.querySelector('button').onclick = function () {
          if (!confirm('Вернуть сайт к этой версии? Текущая тоже сохранится в копиях.')) return;
          api('restore', { name: it.name }).then(function () { toast('Версия восстановлена'); load(); }).catch(function (e) { toast(e.message, true); });
        };
        $('#bk').appendChild(row);
      });
    }).catch(function (e) { $('#bk').textContent = e.message; });
  }

  // ---------- сервер ----------
  function api(action, body) {
    return fetch(API + '?action=' + action, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF': csrf || '' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { throw new Error('Ошибка сервера'); }); })
      .then(function (j) { if (!j.ok) throw new Error(j.error || 'Ошибка'); return j; });
  }
  function upload(file, done) {
    if (!file) return;
    if (demo) {
      // в демо фото уменьшается и хранится в браузере
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, 1000 / Math.max(img.width, img.height)), cv = document.createElement('canvas');
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url); done(cv.toDataURL('image/jpeg', .8)); toast('Фото добавлено — не забудьте «Сохранить»');
      };
      img.onerror = function () { toast('Не удалось открыть картинку', true); };
      img.src = url; return;
    }
    var fd = new FormData(); fd.append('file', file); toast('Загружаю фото…');
    fetch(API + '?action=upload', { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF': csrf }, body: fd })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) throw new Error(j.error); done(j.path); toast('Фото загружено — не забудьте «Сохранить»'); })
      .catch(function (e) { toast(e.message || 'Фото не загрузилось', true); });
  }
  function save() {
    var btn = $('#save'); btn.disabled = true;
    var p = demo ? new Promise(function (ok, no) {
      try { localStorage.setItem('dm_draft', JSON.stringify({ rev: rev, data: data })); ok({ saved: new Date().toTimeString().slice(0, 5) }); }
      catch (e) { no(new Error('В браузере не хватило места: в демо лучше загружать не больше 2–3 новых фото')); }
    }) : api('save', data);
    p.then(function (r) {
      dirty = false; $('#state').textContent = 'Сохранено в ' + r.saved; $('#state').classList.remove('dirty');
      toast(demo ? 'Сохранено. Откройте сайт в этом браузере — изменения уже там' : 'Сохранено. Изменения уже на сайте');
    }).catch(function (e) { toast(e.message, true); }).then(function () { btn.disabled = false; });
  }
  function load() {
    var src = location.protocol === 'file:' ? seed()   // файлом с компьютера — встроенная копия
      : fetch('../data/content.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); });
    return src.catch(function () { return seed(); })
      .then(function (c) {
        if (!c || !c.prices) throw new Error(location.protocol === 'file:'
          ? 'Safari не даёт открыть админку файлом с компьютера. Откройте её по ссылке (через сайт или GitHub)'
          : 'не нашёлся файл data/content.js');
        rev = c.rev; data = c;
        if (demo) { try { var d = JSON.parse(localStorage.getItem('dm_draft') || 'null'); if (d && d.rev === rev) data = d.data; } catch (e) {} }
        start();
      });
  }
  // встроенная копия данных (data/content.js). Если браузер не подгрузил её по адресу с «?v=…» — догружаем без приписки
  function seed() {
    if (window.DM_SEED) return Promise.resolve(window.DM_SEED);
    return new Promise(function (ok) {
      var s = document.createElement('script'); s.src = '../data/content.js';
      s.onload = s.onerror = function () { ok(window.DM_SEED); };
      document.head.appendChild(s);
    });
  }
  function start() {
    $('#login').hidden = true; $('#app').hidden = false; $('#demoNote').hidden = !demo;
    var tb = $('#tabs'); tb.innerHTML = '';
    TABS.forEach(function (t, i) { var b = document.createElement('button'); b.type = 'button'; b.textContent = t.t; b.onclick = function () { showTab(i); }; tb.appendChild(b); });
    showTab(tab);
  }

  $('#save').onclick = save;
  document.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save(); } });
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  // есть ли PHP? нет — демо-режим. Открыли файлом с компьютера — сразу демо, без запросов.
  // Проверка не висит дольше 3 секунд; кнопка «Войти» ждёт её окончания.
  function timeout(ms) { return new Promise(function (_, no) { setTimeout(function () { no(new Error('timeout')); }, ms); }); }
  var ready = location.protocol === 'file:' ? Promise.resolve({ demo: true })
    : Promise.race([fetch(API + '?action=me', { credentials: 'same-origin' }).then(function (r) { return r.json(); }), timeout(3000)])
        .then(function (j) { if (j && j.ok) return { demo: false, j: j }; throw 0; })
        .catch(function () { return { demo: true }; });
  ready.then(function (r) {
    demo = r.demo; $('#loginDemo').hidden = !demo;
    if (!demo && r.j.auth) { csrf = r.j.csrf; load(); }
  });

  $('#loginForm').onsubmit = function (e) {
    e.preventDefault();
    var pass = $('#pass').value.trim(), btn = $('#loginForm button'), err = $('#loginErr');
    err.textContent = ''; btn.disabled = true; btn.textContent = 'Вхожу…';
    function back(msg) { err.textContent = msg; btn.disabled = false; btn.textContent = 'Войти'; }
    ready.then(function () {
      if (demo) {
        if (pass !== DEMO_PASS) return back('Неверный пароль');
        return load().catch(function (er) { console.error(er); back('Не получилось открыть данные сайта: ' + (er && er.message ? er.message : er)); });
      }
      return api('login', { password: pass }).then(function (j) { csrf = j.csrf; return load(); }).catch(function (er) { console.error(er); back(er.message || 'Ошибка входа'); });
    });
  };
})();
