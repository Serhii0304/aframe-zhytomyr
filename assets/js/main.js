/* =========================================================
   A-FRAME — скрипти лендінга
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     НАЛАШТУВАННЯ — правити тут
     --------------------------------------------------------- */
  var CONFIG = {
    phone: '+380970864989',
    phoneLabel: '097 086 4989',

    // Пошта, на яку падають заявки. Працює через formsubmit.co —
    // без реєстрації та без ключів.
    //
    // ВАЖЛИВО: першу заявку треба підтвердити. Після неї на цю адресу
    // прийде лист від FormSubmit із кнопкою активації. Поки її не
    // натиснути — наступні заявки не доставляються.
    //
    // Порожнє значення -> форма переходить на SMS-фолбек.
    formEmail: 'Avessalom7@gmail.com'
  };

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------
     Завжди починаємо з шапки

     Браузер за замовчуванням відновлює попередню позицію прокрутки —
     через це лендінг міг відкриватись із середини сторінки. Для
     односторінкового сайту це виглядає як поламана верстка.
     Перехід за якорем (#works тощо) працює як і раніше.
     --------------------------------------------------------- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);

  /* ---------------------------------------------------------
     Рік у підвалі
     --------------------------------------------------------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Шапка: фон після скролу
     --------------------------------------------------------- */
  var header = $('#siteHeader');
  var onScroll = function () {
    header.classList.toggle('is-stuck', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------------------------------------------------
     Мобільне меню
     --------------------------------------------------------- */
  var burger = $('#burger');
  var nav = $('#nav');

  var closeNav = function () {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  };

  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });

  $$('a', nav).forEach(function (a) { a.addEventListener('click', closeNav); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* ---------------------------------------------------------
     Поява блоків при скролі
     --------------------------------------------------------- */
  var revealables = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------------------------------------------------------
     Галерея: фільтр + «показати всі» на смартфонах
     --------------------------------------------------------- */
  var filters = $$('.filter');
  var items = $$('.gallery__item');
  var moreBtn = $('#galleryMore');
  var MOBILE_LIMIT = 8;

  var state = { filter: 'all', expanded: false };
  var isMobile = function () { return window.matchMedia('(max-width: 760px)').matches; };

  var applyGallery = function () {
    var shown = 0;
    var clipped = 0;
    var limited = isMobile() && !state.expanded;

    items.forEach(function (item) {
      var pass = state.filter === 'all' || item.dataset.cat === state.filter;
      item.classList.toggle('is-hidden', !pass);
      if (!pass) return;

      shown++;
      var clip = limited && shown > MOBILE_LIMIT;
      item.classList.toggle('is-clipped', clip);
      if (clip) clipped++;
    });

    moreBtn.hidden = clipped === 0;
    moreBtn.textContent = 'Показати ще ' + clipped + ' фото';
  };

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.filter = btn.dataset.filter;
      state.expanded = false;

      filters.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });

      applyGallery();
    });
  });

  moreBtn.addEventListener('click', function () {
    state.expanded = true;
    applyGallery();
  });

  // Safari до 14 версії не має addEventListener у медіазапитів, лише застарілий
  // addListener. Без цієї страховки помилка тут зупиняла б увесь скрипт нижче —
  // разом із формою заявки.
  (function () {
    var mq = window.matchMedia('(max-width: 760px)');
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', applyGallery);
    else if (typeof mq.addListener === 'function') mq.addListener(applyGallery);
  })();

  applyGallery();

  /* ---------------------------------------------------------
     Лайтбокс
     --------------------------------------------------------- */
  var lb = $('#lightbox');
  var lbImg = $('#lbImg');
  var lbCap = $('#lbCap');
  var lastFocused = null;
  var current = 0;

  // Гортаємо всі фото поточного фільтра, зокрема ті, що на смартфоні ще
  // приховані кнопкою «показати ще» — інакше три останні недосяжні.
  var visibleItems = function () {
    return items.filter(function (i) { return !i.classList.contains('is-hidden'); });
  };

  var show = function (index) {
    var list = visibleItems();
    if (!list.length) return;
    current = (index + list.length) % list.length;
    var item = list[current];
    lbImg.src = item.dataset.full;
    lbImg.alt = $('img', item).alt;
    lbCap.textContent = item.dataset.caption || '';
  };

  // Утримуємо фокус усередині модалки, поки вона відкрита
  var trapFocus = function (e) {
    if (e.key !== 'Tab' || lb.hidden) return;
    var focusable = $$('button, [href]', lb).filter(function (el) { return !el.disabled; });
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!lb.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  };

  var openLb = function (item) {
    lastFocused = document.activeElement;
    show(visibleItems().indexOf(item));
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', trapFocus, true);
    $('#lbClose').focus();
  };

  var closeLb = function () {
    lb.hidden = true;
    // removeAttribute, а не src='': порожній src змушує браузер
    // завантажувати саму сторінку як зображення
    lbImg.removeAttribute('src');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', trapFocus, true);
    if (lastFocused) lastFocused.focus();
  };

  items.forEach(function (item) {
    item.addEventListener('click', function () { openLb(item); });
  });

  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', function () { show(current - 1); });
  $('#lbNext').addEventListener('click', function () { show(current + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });

  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  // свайп на мобільних
  var touchX = null;
  lb.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 55) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });

  /* ---------------------------------------------------------
     FAQ — відкрито лише одне питання
     --------------------------------------------------------- */
  var faqItems = $$('.faq__item');
  faqItems.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      faqItems.forEach(function (other) { if (other !== d) other.open = false; });
    });
  });

  /* ---------------------------------------------------------
     Viber: відкриття застосунку із запасним сценарієм

     viber:// — це не веб-адреса, а команда «відкрий застосунок».
     Якщо Viber не встановлений, браузер показує помилку «сторінка
     не існує». Тому на Android використовуємо intent-посилання зі
     вбудованим поверненням на сайт, а на решті платформ ловимо
     невдачу за таймером і показуємо номер телефону.
     --------------------------------------------------------- */
  var toast = null;

  var showToast = function (text) {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.innerHTML = text;
    toast.classList.add('is-shown');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () {
      toast.classList.remove('is-shown');
    }, 7000);
  };

  var digits = CONFIG.phone.replace(/\D/g, '');

  var MESSENGERS = {
    viber: {
      name: 'Viber',
      scheme: 'viber://chat?number=%2B' + digits,
      intent: 'intent://chat?number=%2B' + digits +
              '#Intent;scheme=viber;package=com.viber.voip;S.browser_fallback_url=$BACK;end'
    },
    telegram: {
      name: 'Telegram',
      // t.me/+номер Telegram читає як запрошення до групи, а не як телефон,
      // тому єдиний робочий шлях — схема tg://resolve?phone=
      scheme: 'tg://resolve?phone=' + digits,
      intent: 'intent://resolve?phone=' + digits +
              '#Intent;scheme=tg;package=org.telegram.messenger;S.browser_fallback_url=$BACK;end'
    }
  };

  var openMessenger = function (key) {
    var app = MESSENGERS[key];
    if (!app) return;

    if (/Android/i.test(navigator.userAgent)) {
      var back = encodeURIComponent(location.origin + location.pathname + '#contact');
      window.location.href = app.intent.replace('$BACK', back);
      return;
    }

    var left = false;
    var mark = function () { left = true; };
    document.addEventListener('visibilitychange', mark);
    window.addEventListener('pagehide', mark);

    setTimeout(function () {
      document.removeEventListener('visibilitychange', mark);
      window.removeEventListener('pagehide', mark);
      if (!left && document.visibilityState === 'visible') {
        showToast('Не вдалося відкрити ' + app.name + '. Телефонуйте: <a href="tel:' +
          CONFIG.phone + '">' + CONFIG.phoneLabel + '</a>');
      }
    }, 1800);

    window.location.href = app.scheme;
  };

  $$('[data-messenger]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      openMessenger(link.dataset.messenger);
    });
  });

  /* ---------------------------------------------------------
     Телефон: маска-нормалізація
     --------------------------------------------------------- */
  var phoneInput = $('#f-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      var v = phoneInput.value.replace(/[^\d+]/g, '');
      if (v.length && v[0] !== '+') v = v.replace(/\+/g, '');
      phoneInput.value = v.slice(0, 17);
    });
  }

  /* ---------------------------------------------------------
     Форма заявки
     --------------------------------------------------------- */
  var form = $('#leadForm');
  var statusEl = $('#formStatus');
  var submitBtn = $('#submitBtn');

  var setStatus = function (text, kind, asHtml) {
    if (asHtml) statusEl.innerHTML = text;
    else statusEl.textContent = text;
    statusEl.className = 'form__status' + (kind ? ' is-' + kind : '');
  };

  var clearErrors = function () {
    $$('[aria-invalid]', form).forEach(function (f) { f.removeAttribute('aria-invalid'); });
  };

  var validate = function () {
    var ok = true;
    var name = $('#f-name');
    var phone = $('#f-phone');
    var area = $('#f-area');
    var agree = $('#f-agree');

    var phoneDigits = phone.value.replace(/\D/g, '');
    var areaNum = parseInt(area.value, 10);
    var areaOk = area.value === '' || (areaNum >= 6 && areaNum <= 500);

    [[name, name.value.trim().length >= 2],
     [phone, phoneDigits.length >= 9],
     [area, areaOk]].forEach(function (pair) {
      var field = pair[0];
      var valid = pair[1];
      if (valid) field.removeAttribute('aria-invalid');
      else { field.setAttribute('aria-invalid', 'true'); ok = false; }
    });

    if (!agree.checked) ok = false;
    return { ok: ok, areaOk: areaOk };
  };

  var collect = function () {
    return {
      name: $('#f-name').value.trim(),
      phone: $('#f-phone').value.trim(),
      object: $('#f-type').value,
      area: $('#f-area').value.trim(),
      note: $('#f-note').value.trim()
    };
  };

  var asText = function (d) {
    return 'Заявка на прорахунок\n'
      + 'Ім\'я: ' + d.name + '\n'
      + 'Телефон: ' + d.phone + '\n'
      + 'Обʼєкт: ' + d.object + '\n'
      + (d.area ? 'Площа: ' + d.area + ' м²\n' : '')
      + (d.note ? 'Коментар: ' + d.note : '');
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var check = validate();
    if (!check.ok) {
      setStatus(check.areaOk
        ? 'Заповніть імʼя, телефон і позначте згоду.'
        : 'Площа має бути від 6 до 500 м².', 'err');
      return;
    }

    var data = collect();
    submitBtn.disabled = true;
    setStatus('Надсилаємо…');

    // Запасний сценарій, якщо пошта недоступна: SMS із готовим текстом
    var smsFallback = function () {
      var isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
      var body = encodeURIComponent(asText(data));
      window.location.href = 'sms:' + CONFIG.phone + (isApple ? '&' : '?') + 'body=' + body;
    };

    if (!CONFIG.formEmail) {
      smsFallback();
      setStatus('Відкриваємо повідомлення. Якщо не спрацювало — телефонуйте: ' +
        CONFIG.phoneLabel, 'ok');
      submitBtn.disabled = false;
      return;
    }

    fetch('https://formsubmit.co/ajax/' + encodeURIComponent(CONFIG.formEmail), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: 'Заявка з сайту А-Фрейм — ' + data.name,
        _template: 'table',
        _captcha: 'false',
        _honey: ($('input[name="_honey"]', form) || {}).value || '',
        'Імʼя': data.name,
        'Телефон': data.phone,
        'Обʼєкт': data.object,
        'Площа, м²': data.area || '—',
        'Коментар': data.note || '—'
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        // FormSubmit повертає success рядком "true", а не булевим значенням
        if (String(res.success) !== 'true') throw new Error(res.message || 'fail');
        form.reset();
        clearErrors();
        setStatus('Дякуємо! Заявку прийнято — передзвонимо найближчим часом.', 'ok');
      })
      .catch(function (err) {
        // Причину пишемо в консоль — щоб не гадати, чому не доходять заявки.
        // Найчастіша: адресу пошти ще не підтверджено листом активації.
        if (window.console) console.warn('[форма] не надіслано:', err && err.message);

        // Телефон робимо клікабельним, щоб заявка не загубилась
        setStatus('Не вдалося надіслати. Зателефонуйте, будь ласка: ' +
          '<a href="tel:' + CONFIG.phone + '">' + CONFIG.phoneLabel + '</a>', 'err', true);
      })
      .then(function () { submitBtn.disabled = false; });
  });
})();
