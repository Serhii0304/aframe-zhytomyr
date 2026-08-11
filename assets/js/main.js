/* =========================================================
   A-FRAME — скрипти лендінга
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     НАЛАШТУВАННЯ — правити тут
     --------------------------------------------------------- */
  var CONFIG = {
    phone: '+380996502298',

    // Куди надсилати заявки з форми.
    // Порожньо -> форма працює через SMS-фолбек (працює завжди, без сервера).
    // Щоб заявки падали на пошту: зареєструйтесь на https://web3forms.com (безкоштовно),
    // отримайте Access Key і вставте його сюди.
    web3formsKey: ''
  };

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

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
     Фільтр галереї
     --------------------------------------------------------- */
  var filters = $$('.filter');
  var items = $$('.gallery__item');

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cat = btn.dataset.filter;

      filters.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });

      items.forEach(function (item) {
        item.classList.toggle('is-hidden', cat !== 'all' && item.dataset.cat !== cat);
      });
    });
  });

  /* ---------------------------------------------------------
     Лайтбокс
     --------------------------------------------------------- */
  var lb = $('#lightbox');
  var lbImg = $('#lbImg');
  var lbCap = $('#lbCap');
  var lastFocused = null;
  var current = 0;

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

  var openLb = function (item) {
    lastFocused = document.activeElement;
    show(visibleItems().indexOf(item));
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#lbClose').focus();
  };

  var closeLb = function () {
    lb.hidden = true;
    lbImg.src = '';
    document.body.style.overflow = '';
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

  var setStatus = function (text, kind) {
    statusEl.textContent = text;
    statusEl.className = 'form__status' + (kind ? ' is-' + kind : '');
  };

  var validate = function () {
    var ok = true;
    var name = $('#f-name');
    var phone = $('#f-phone');
    var agree = $('#f-agree');

    var digits = phone.value.replace(/\D/g, '');

    [[name, name.value.trim().length >= 2], [phone, digits.length >= 9]].forEach(function (pair) {
      var field = pair[0];
      var valid = pair[1];
      field.setAttribute('aria-invalid', String(!valid));
      if (!valid) ok = false;
    });

    if (!agree.checked) ok = false;
    return ok;
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

    if (!validate()) {
      setStatus('Заповніть імʼя, телефон і позначте згоду.', 'err');
      return;
    }

    var data = collect();
    submitBtn.disabled = true;
    setStatus('Надсилаємо…');

    if (CONFIG.web3formsKey) {
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: CONFIG.web3formsKey,
          subject: 'Заявка з сайту A-Frame — ' + data.name,
          from_name: 'Сайт A-Frame',
          name: data.name,
          phone: data.phone,
          object: data.object,
          area: data.area,
          note: data.note
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res.success) throw new Error('fail');
          form.reset();
          setStatus('Дякуємо! Заявку прийнято — передзвонимо найближчим часом.', 'ok');
        })
        .catch(function () {
          setStatus('Не вдалося надіслати. Зателефонуйте, будь ласка: ' + CONFIG.phone, 'err');
        })
        .then(function () { submitBtn.disabled = false; });
      return;
    }

    // Фолбек без сервера: відкриваємо SMS із готовим текстом
    var body = encodeURIComponent(asText(data));
    var isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
    window.location.href = 'sms:' + CONFIG.phone + (isApple ? '&' : '?') + 'body=' + body;

    setStatus('Відкриваємо повідомлення. Якщо не спрацювало — телефонуйте: ' + CONFIG.phone, 'ok');
    submitBtn.disabled = false;
  });
})();
