/* ==========================================================================
   EDIT HERE — the only settings you need to change
   ========================================================================== */

// 1) Your WhatsApp number, WITH country code. Spaces, + and dashes are fine.
//    Example: '+91 98765 43210'
const WHATSAPP_NUMBER = '';

// 2) Video links. Paste a link between the quotes and save.
//    Works with: YouTube (any link, incl. youtu.be and Shorts), Vimeo,
//    Google Drive (file set to "Anyone with the link"), or a direct .mp4 link.
const VIDEO_LINKS = {
  intro:     '',   // Section 1 — intro video
  coding:    '',   // Section 3 — coding video
  marketing: '',   // Section 3 — digital marketing video
};

// 3) Message for the "Ask us on WhatsApp" link under the packages.
const GENERAL_MESSAGE = "Hi! I'd like help choosing between the Coding and Digital Marketing courses.";

/* ==========================================================================
   You don't need to edit anything below this line.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Videos ---------- */

  function toEmbed(rawUrl) {
    const url = (rawUrl || '').trim();
    if (!url) return null;

    let m;
    // YouTube: watch?v=, youtu.be/, shorts/, embed/, live/
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/))) {
      return { type: 'iframe', src: 'https://www.youtube-nocookie.com/embed/' + m[1] + '?rel=0' };
    }
    // Vimeo
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/))) {
      return { type: 'iframe', src: 'https://player.vimeo.com/video/' + m[1] };
    }
    // Google Drive
    if ((m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/))) {
      return { type: 'iframe', src: 'https://drive.google.com/file/d/' + m[1] + '/preview' };
    }
    // Direct video file
    if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) {
      return { type: 'video', src: url };
    }
    // Anything else: try it as an embeddable page
    return { type: 'iframe', src: url };
  }

  function loadVideos() {
    document.querySelectorAll('[data-video]').forEach(function (frame) {
      const key = frame.getAttribute('data-video');
      const embed = toEmbed(VIDEO_LINKS[key]);
      if (!embed) return; // keep the "coming soon" placeholder

      let el;
      if (embed.type === 'video') {
        el = document.createElement('video');
        el.src = embed.src;
        el.controls = true;
        el.preload = 'metadata';
        el.playsInline = true;
      } else {
        el = document.createElement('iframe');
        el.src = embed.src;
        el.title = 'Video';
        el.loading = 'lazy';
        el.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
        el.allowFullscreen = true;
      }
      frame.innerHTML = '';
      frame.appendChild(el);
    });
  }

  /* ---------- WhatsApp ---------- */

  function cleanNumber(n) {
    return String(n || '').replace(/[^\d]/g, '');
  }

  function waLink(message) {
    const num = cleanNumber(WHATSAPP_NUMBER);
    const text = encodeURIComponent(message);
    // With no number set, WhatsApp opens and lets the visitor pick a chat.
    return num ? 'https://wa.me/' + num + '?text=' + text
               : 'https://wa.me/?text=' + text;
  }

  function textOf(root, sel) {
    const el = root.querySelector(sel);
    return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  // Builds the message from what is written on the package card,
  // so editing the card in index.html updates the message too.
  function toNumber(t) { return parseInt(String(t).replace(/[^\d]/g, ''), 10) || 0; }
  // Formats the saving in the same currency shown on the card (e.g. "AED 700")
  function formatMoney(n, sample) {
    const prefix = (String(sample).match(/^[^\d]*/) || [''])[0];
    return prefix + n.toLocaleString('en-US');
  }

  // Fills the "% OFF" badge and "You save" line from the two prices on the card
  function setupDiscounts() {
    document.querySelectorAll('[data-package]').forEach(function (card) {
      const nowEl = card.querySelector('[data-pkg-price]');
      const wasEl = card.querySelector('[data-pkg-was]');
      const offEl = card.querySelector('[data-pkg-off]');
      const saveEl = card.querySelector('[data-pkg-save]');
      if (!nowEl || !wasEl) return;
      const now = toNumber(nowEl.textContent);
      const was = toNumber(wasEl.textContent);
      if (!now || !was || was <= now) { wasEl.style.display = 'none'; return; }
      const pct = Math.round((was - now) / was * 100);
      if (offEl) offEl.textContent = pct + '% OFF';
      if (saveEl) saveEl.textContent = 'You save ' + formatMoney(was - now, nowEl.textContent.trim());
    });
  }

  function packageMessage(card) {
    const name = textOf(card, '[data-pkg-name]');
    const price = textOf(card, '[data-pkg-price]');
    const was = textOf(card, '[data-pkg-was]');
    const off = textOf(card, '[data-pkg-off]');
    const duration = textOf(card, '[data-pkg-duration]');
    const features = Array.prototype.map.call(
      card.querySelectorAll('[data-pkg-features] li'),
      function (li) { return '• ' + li.textContent.replace(/\s+/g, ' ').trim(); }
    );
    const feeLine = off ? '*Fee:* ' + price + ' (' + off + ', regular ' + was + ')' : '*Fee:* ' + price;

    return [
      "Hi! I'm interested in the " + name + '.',
      '',
      '*Course:* ' + name,
      feeLine,
      '*Duration:* ' + duration,
      '',
      "*What's included:*",
      features.join('\n'),
      '',
      'Please share the next batch dates and how to enrol.'
    ].join('\n');
  }

  function setupWhatsApp() {
    document.querySelectorAll('[data-package]').forEach(function (card) {
      const btn = card.querySelector('[data-wa-button]');
      if (!btn) return;
      btn.href = waLink(packageMessage(card));
      btn.target = '_blank';
      btn.rel = 'noopener';
    });

    document.querySelectorAll('[data-wa-general]').forEach(function (a) {
      a.href = waLink(GENERAL_MESSAGE);
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }

  /* ---------- Scroll animation ---------- */

  // Each group: the elements to animate, the direction, and the gap (ms)
  // between items in the same row so they arrive one after another.
  const REVEAL_GROUPS = [
    { sel: '.sec-head > *',                    dir: 'up',    stagger: 120 },
    { sel: '.story',                           dir: 'up',    stagger: 140, perRow: 'stories' },
    { sel: '.track',                           dir: 'up' },
    { sel: '.track__text > :not(.benefits)',   dir: 'up',    stagger: 90,  perRow: 'track' },
    { sel: '.benefits li',                     dir: 'up',    stagger: 90,  perRow: 'benefits' },
    { sel: '.pkg',                             dir: 'up',    stagger: 160 },
    { sel: '.helpbar',                         dir: 'up' }
  ];

  function setupReveal() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;

    REVEAL_GROUPS.forEach(function (g) {
      document.querySelectorAll(g.sel).forEach(function (el, i) {
        if (el.hasAttribute('data-reveal')) return;
        el.setAttribute('data-reveal', g.dir);
        if (g.stagger) {
          // Stories: count position within the visible row (3, 2 or 1 per row)
          const w = window.innerWidth;
          const perRow = g.perRow === 'stories' ? (w <= 680 ? 1 : w <= 1000 ? 2 : 3)
                       : g.perRow === 'track' ? 3
                       : g.perRow === 'benefits' ? 4 : 0;
          const pos = perRow ? i % perRow : i;
          el.style.setProperty('--reveal-delay', (pos * g.stagger) + 'ms');
        }
      });
    });

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target); // animate once
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
    document.documentElement.classList.add('reveal-on');
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupDiscounts();
    loadVideos();
    setupWhatsApp();
    setupReveal();
  });
})();
