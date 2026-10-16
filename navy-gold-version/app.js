/* ==========================================================================
   EDIT HERE — the only settings you need to change
   ========================================================================== */

// 1) Your WhatsApp number, WITH country code. Spaces, + and dashes are fine.
//    Example: '+971 50 123 4567'
const WHATSAPP_NUMBER = '';

// 2) Video links. Paste a link between the quotes and save.
//    Works with: YouTube (any link, incl. youtu.be and Shorts), Vimeo,
//    Google Drive (file set to "Anyone with the link"), or a direct .mp4 link.
const VIDEO_LINKS = {
  intro:     '',   // Hero — "Watch free intro video"
  review:    '',   // Success stories — "Watch a student review"
  freeClass: '',   // Free class — watching this to the end unlocks 70% off
};

// 3) 70% discount lock.
//    true  = prices stay hidden until the visitor watches the free class video
//            to the end (works with YouTube and direct .mp4 links).
//    false = discounted prices are always shown.
//    If no free class link is set yet, prices are shown so the page still works.
const LOCK_DISCOUNT_UNTIL_VIDEO_WATCHED = true;

// 4) WhatsApp messages for the other buttons.
const MESSAGES = {
  freeClass: "Hi! I'd like to join the free online class on how to build my own online business.",
  general:   "Hi! I'd like help choosing between the Single Skill Package and the Complete Program.",
};

/* ==========================================================================
   You don't need to edit anything below this line.
   ========================================================================== */

(function () {
  'use strict';

  const root = document.documentElement;
  const UNLOCK_KEY = 'sbc_discount_unlocked';
  const players = {};   // video key -> { play: fn }

  /* ---------- Helpers ---------- */

  function cleanNumber(n) { return String(n || '').replace(/[^\d]/g, ''); }

  function waLink(message) {
    const num = cleanNumber(WHATSAPP_NUMBER);
    const text = encodeURIComponent(message);
    return num ? 'https://wa.me/' + num + '?text=' + text : 'https://wa.me/?text=' + text;
  }

  function textOf(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }

  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); }
    catch (e) { return null; }
  }

  /* ---------- Videos ---------- */

  function parseVideo(rawUrl) {
    const url = (rawUrl || '').trim();
    if (!url) return null;
    let m;
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/))) {
      return { kind: 'youtube', id: m[1] };
    }
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/))) {
      return { kind: 'iframe', src: 'https://player.vimeo.com/video/' + m[1] };
    }
    if ((m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/))) {
      return { kind: 'iframe', src: 'https://drive.google.com/file/d/' + m[1] + '/preview' };
    }
    if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) {
      return { kind: 'file', src: url };
    }
    return { kind: 'iframe', src: url };
  }

  function makeIframe(src) {
    const f = document.createElement('iframe');
    f.src = src;
    f.title = 'Video';
    f.loading = 'lazy';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    return f;
  }

  let ytQueue = null;
  function withYouTubeAPI(cb) {
    if (window.YT && window.YT.Player) return cb();
    if (!ytQueue) {
      ytQueue = [];
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (prev) prev();
        ytQueue.forEach(function (fn) { fn(); });
      };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
    ytQueue.push(cb);
  }

  function loadVideos() {
    document.querySelectorAll('[data-video]').forEach(function (frame) {
      const key = frame.getAttribute('data-video');
      const v = parseVideo(VIDEO_LINKS[key]);
      if (!v) return; // keep the placeholder

      const onEnded = key === 'freeClass' ? unlockDiscount : null;

      if (v.kind === 'youtube') {
        if (onEnded) {
          // Use the YouTube player API so we know when the video ends
          const holder = document.createElement('div');
          holder.id = 'yt-' + key;
          frame.innerHTML = '';
          frame.appendChild(holder);
          withYouTubeAPI(function () {
            const p = new window.YT.Player(holder.id, {
              videoId: v.id,
              host: 'https://www.youtube-nocookie.com',
              playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
              events: {
                onStateChange: function (e) { if (e.data === 0) onEnded(); }
              }
            });
            players[key] = { play: function () { try { p.playVideo(); } catch (err) {} } };
          });
        } else {
          frame.innerHTML = '';
          const f = makeIframe('https://www.youtube-nocookie.com/embed/' + v.id + '?rel=0&playsinline=1');
          frame.appendChild(f);
          players[key] = { play: function () { f.src = f.src.replace('?', '?autoplay=1&'); } };
        }
      } else if (v.kind === 'file') {
        const el = document.createElement('video');
        el.src = v.src;
        el.controls = true;
        el.preload = 'metadata';
        el.playsInline = true;
        if (onEnded) el.addEventListener('ended', onEnded);
        frame.innerHTML = '';
        frame.appendChild(el);
        players[key] = { play: function () { el.play().catch(function () {}); } };
      } else {
        frame.innerHTML = '';
        frame.appendChild(makeIframe(v.src));
      }
    });
  }

  // "Watch …" buttons scroll to their video and start it when possible
  function setupVideoButtons() {
    document.querySelectorAll('[data-goto-video]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        const key = btn.getAttribute('data-goto-video');
        const frame = document.querySelector('[data-video="' + key + '"]');
        if (!frame) return;
        e.preventDefault();
        frame.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (players[key]) setTimeout(players[key].play, 500);
      });
    });
  }

  /* ---------- Discount lock ---------- */

  function canTrackFreeClass() {
    const v = parseVideo(VIDEO_LINKS.freeClass);
    return v && (v.kind === 'youtube' || v.kind === 'file');
  }

  function unlockDiscount() {
    if (root.classList.contains('is-unlocked')) return;
    root.classList.add('is-unlocked');
    store(UNLOCK_KEY, '1');
    refreshPackageLinks();
  }

  function setupDiscount() {
    const alreadyUnlocked = store(UNLOCK_KEY) === '1';
    if (!LOCK_DISCOUNT_UNTIL_VIDEO_WATCHED || !canTrackFreeClass() || alreadyUnlocked) {
      root.classList.add('is-unlocked');
    }
  }

  /* ---------- WhatsApp ---------- */

  function packageMessage(card) {
    const unlocked = root.classList.contains('is-unlocked');
    const name = textOf(card.querySelector('[data-pkg-name]'));
    const was = textOf(card.querySelector('[data-pkg-was]'));
    const now = textOf(card.querySelector('[data-pkg-now]'));
    const features = Array.prototype.map.call(
      card.querySelectorAll('[data-pkg-features] li'),
      function (li) { return '• ' + textOf(li); }
    );
    const priceLine = unlocked
      ? '*Price:* ' + now + ' (70% off, regular ' + was + ')'
      : '*Price:* ' + was;

    return [
      "Hi! I'd like to apply for the " + name + '.',
      '',
      '*Program:* ' + name,
      priceLine,
      '',
      "*What's included:*",
      features.join('\n'),
      '',
      'Please share the next start date and how to enrol.'
    ].join('\n');
  }

  function refreshPackageLinks() {
    document.querySelectorAll('[data-package]').forEach(function (card) {
      const btn = card.querySelector('[data-wa-button]');
      if (btn) btn.href = waLink(packageMessage(card));
    });
  }

  function setupWhatsApp() {
    document.querySelectorAll('[data-wa-button], [data-wa]').forEach(function (a) {
      a.target = '_blank';
      a.rel = 'noopener';
    });
    document.querySelectorAll('[data-wa]').forEach(function (a) {
      const key = a.getAttribute('data-wa');
      a.href = waLink(MESSAGES[key] || MESSAGES.general);
    });
    refreshPackageLinks();
  }

  /* ---------- Scholarship form ---------- */

  function setupForm() {
    const form = document.getElementById('scholarshipForm');
    if (!form) return;
    const errorEl = document.getElementById('formError');
    const noteEl = document.getElementById('formNote');

    form.addEventListener('input', function (e) {
      const field = e.target.closest('.field');
      if (field) field.classList.remove('is-invalid');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const data = {
        name: form.name.value.trim(),
        age: form.age.value.trim(),
        email: form.email.value.trim(),
        why: form.why.value.trim()
      };

      const problems = [];
      if (!data.name) problems.push(['name', 'your full name']);
      if (!data.age || +data.age < 8 || +data.age > 99) problems.push(['age', 'your age']);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) problems.push(['email', 'a valid email address']);
      if (data.why.length < 10) problems.push(['why', 'a few words on why you should get the scholarship']);

      form.querySelectorAll('.field').forEach(function (f) { f.classList.remove('is-invalid'); });
      if (problems.length) {
        problems.forEach(function (p) { form[p[0]].closest('.field').classList.add('is-invalid'); });
        errorEl.textContent = 'Please add ' + problems.map(function (p) { return p[1]; }).join(', ') + '.';
        errorEl.hidden = false;
        form[problems[0][0]].focus();
        return;
      }
      errorEl.hidden = true;

      const message = [
        "Hi! I'd like to apply for the 100% scholarship.",
        '',
        '*Full name:* ' + data.name,
        '*Age:* ' + data.age,
        '*Email:* ' + data.email,
        '',
        '*Why I should get the scholarship:*',
        data.why
      ].join('\n');

      window.open(waLink(message), '_blank', 'noopener');
      noteEl.classList.add('is-sent');
      noteEl.lastChild.textContent = 'WhatsApp opened with your application. Press send to submit it.';
    });
  }

  /* ---------- Scroll animation ---------- */

  const REVEAL_GROUPS = [
    { sel: '.hero__strip',                    dir: 'up' },
    { sel: '.sec-head > *',                   dir: 'up',    stagger: 120 },
    { sel: '.achieve__item',                  dir: 'up',    stagger: 110, grid: true },
    { sel: '.callout',                        dir: 'left' },
    { sel: '.stats',                          dir: 'right' },
    { sel: '.review',                         dir: 'up',    stagger: 130, grid: true },
    { sel: '.stories__video',                 dir: 'zoom' },
    { sel: '.free__media',                    dir: 'left' },
    { sel: '.free__copy > *',                 dir: 'right', stagger: 100 },
    { sel: '.ticks li',                       dir: 'right', stagger: 120 },
    { sel: '.scholar__copy > *',              dir: 'left',  stagger: 110 },
    { sel: '.steps li',                       dir: 'left',  stagger: 130 },
    { sel: '.form',                           dir: 'right' },
    { sel: '.unlock',                         dir: 'zoom' },
    { sel: '.pkg',                            dir: 'up',    stagger: 180 },
    { sel: '.closing > *',                    dir: 'up',    stagger: 120 }
  ];

  function perRow() {
    const w = window.innerWidth;
    return w <= 640 ? 1 : w <= 1024 ? 2 : 3;
  }

  function setupReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

    REVEAL_GROUPS.forEach(function (g) {
      const cols = g.grid ? perRow() : 0;
      document.querySelectorAll(g.sel).forEach(function (el, i) {
        if (el.hasAttribute('data-reveal')) return;
        el.setAttribute('data-reveal', g.dir);
        if (g.stagger) {
          const pos = cols ? i % cols : i;
          el.style.setProperty('--reveal-delay', (pos * g.stagger) + 'ms');
        }
      });
    });

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
    root.classList.add('reveal-on');
  }

  /* ---------- Start ---------- */

  document.addEventListener('DOMContentLoaded', function () {
    setupDiscount();
    loadVideos();
    setupVideoButtons();
    setupWhatsApp();
    setupForm();
    setupReveal();
  });
})();
