/* LinkPeople Lab — згода на рекламні cookies.
   Meta Pixel завантажується ТІЛЬКИ після явного «Прийняти».
   Вибір зберігається в localStorage цього браузера.
   Підключається лише на сторінках Lab. */
(function () {
  'use strict';

  var PIXEL_ID = '2378903276241346';
  var KEY = 'lp_ads_consent_v1';

  function get() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function set(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }

  /* --- Meta Pixel: вантажиться лише за згодою --- */
  var loaded = false;
  function loadPixel() {
    if (loaded || window.fbq) return;
    loaded = true;
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  /* --- Стилі банера --- */
  function injectCSS() {
    if (document.getElementById('lp-consent-css')) return;
    var css = ''
      + '.lp-consent{position:fixed;z-index:9999;left:16px;right:16px;bottom:16px;max-width:560px;'
      + 'background:#23362b;color:#f0ece2;border:1px solid rgba(244,238,226,.16);border-radius:14px;'
      + 'padding:20px 22px;box-shadow:0 18px 50px rgba(0,0,0,.45);font-size:.9rem;line-height:1.6;'
      + 'opacity:0;transform:translateY(12px);transition:opacity .25s ease,transform .25s ease}'
      + '.lp-consent.is-in{opacity:1;transform:translateY(0)}'
      + '.lp-consent p{margin:0 0 14px}'
      + '.lp-consent a{color:#cfe8a0;text-decoration:underline;text-underline-offset:3px}'
      + '.lp-consent-row{display:flex;gap:10px;flex-wrap:wrap}'
      + '.lp-consent button{font:inherit;cursor:pointer;border-radius:999px;padding:10px 20px;border:1px solid transparent;transition:opacity .2s ease}'
      + '.lp-consent button:hover{opacity:.85}'
      + '.lp-consent .lp-yes{background:#beff27;color:#22382b;font-weight:600}'
      + '.lp-consent .lp-no{background:transparent;color:#e7edf3;border-color:rgba(255,255,255,.26)}'
      + '@media (min-width:640px){.lp-consent{left:24px;right:auto;bottom:24px}}'
      + '@media (max-width:639px){.lp-consent{left:0;right:0;bottom:0;border-radius:14px 14px 0 0;padding:13px 16px 14px;font-size:.8rem;line-height:1.45}.lp-consent p{margin:0 0 9px}.lp-consent button{padding:8px 16px}}'
      + '@media (prefers-reduced-motion:reduce){.lp-consent{transition:none}}';
    var s = document.createElement('style');
    s.id = 'lp-consent-css';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* --- Банер --- */
  function showBanner() {
    if (document.querySelector('.lp-consent')) return;
    injectCSS();
    var box = document.createElement('div');
    box.className = 'lp-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-live', 'polite');
    box.setAttribute('aria-label', 'Згода на рекламні cookies');
    box.innerHTML = ''
      + '<p>Для оцінки реклами ми можемо використовувати Meta Pixel. Без вашої згоди він не завантажується. '
      + 'Сторінки працюють однаково в обох випадках. Деталі — у <a href="/lab/privacy">Політиці приватності</a>.</p>'
      + '<div class="lp-consent-row">'
      + '<button type="button" class="lp-yes">Прийняти</button>'
      + '<button type="button" class="lp-no">Відхилити</button>'
      + '</div>';
    document.body.appendChild(box);
    requestAnimationFrame(function () { box.classList.add('is-in'); });

    function close() {
      box.classList.remove('is-in');
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 260);
    }
    box.querySelector('.lp-yes').addEventListener('click', function () {
      set('granted'); loadPixel(); close();
    });
    box.querySelector('.lp-no').addEventListener('click', function () {
      set('denied'); close();
    });
  }

  /* --- Публічний спосіб змінити вибір --- */
  window.lpConsentReset = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    showBanner();
    return false;
  };

  function wireResetLinks() {
    var links = document.querySelectorAll('[data-lp-consent-reset]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (ev) {
        ev.preventDefault();
        window.lpConsentReset();
      });
    }
  }

  function start() {
    wireResetLinks();
    var v = get();
    if (v === 'granted') { loadPixel(); return; }
    if (v === 'denied') { return; }
    showBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
