/**
 * DevScale 1-on-1 Mentorship Landing Page Logic
 * Features:
 * - Dynamic WhatsApp Link Router with URL-encoded messages tailored per package tier
 * - Live in-page WhatsApp number configurator with LocalStorage persistence
 * - Interactive Video Preview Modal with simulated controls
 * - Quick Drawer for Sales Rep 3-Step SOP
 * - Interactive toast notifications
 */

(function () {
  'use strict';

  // State Management
  const STORAGE_KEY = 'devscale_wa_phone';
  const DEFAULT_PHONE = '+15553829041'; // Fallback demo number

  // Tailored Pre-Filled Messages (Per Requirements)
  const TIER_MESSAGES = {
    standard: "Hi DevScale! I'm interested in the Core Career Sprint package ($699/mo). I'd like to check eligibility and learn more about starting my 1-on-1 mentorship.",
    pro: "Hi DevScale! I'm ready to apply for the Elite Full-Stack Career Accelerator (Pro - $1,299/mo). Can we schedule my technical onboarding evaluation call?",
    general: "Hi DevScale! I'm exploring your 1-on-1 Software Engineering Mentorship and would love to chat with a lead advisor about my career goals."
  };

  // Video Metadata for Modal
  const VIDEO_DATA = {
    hero: {
      title: "How We Deliver 1-on-1 Mentorship & Accelerate Careers (4K Tour)",
      poster: "assets/hero_video.jpg",
      duration: "03:42"
    },
    prep: {
      title: "Methodology 01: Pre-Session Backlog, Live Share IDE & Production Pairing",
      poster: "assets/methodology_prep.jpg",
      duration: "12:45"
    },
    tracking: {
      title: "Methodology 02: 3-Hour Async PR Reviews & WhatsApp Daily Support Loop",
      poster: "assets/methodology_tracking.jpg",
      duration: "08:20"
    }
  };

  // DOM Elements
  const waPhoneInput = document.getElementById('waPhoneInput');
  const savePhoneBtn = document.getElementById('savePhoneBtn');
  const activePhoneDisplay = document.getElementById('activePhoneDisplay');
  const configBar = document.getElementById('configBar');
  const configToggleBtn = document.getElementById('configToggleBtn');

  // Video Modal Elements
  const videoModal = document.getElementById('videoModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalVideoTitle = document.getElementById('modalVideoTitle');
  const modalVideoPoster = document.getElementById('modalVideoPoster');
  const hudPlayToggle = document.getElementById('hudPlayToggle');
  const hudPlayIcon = document.getElementById('hudPlayIcon');
  const progressBar = document.getElementById('progressBar');
  const progressFilled = document.getElementById('progressFilled');
  const currentTimeEl = document.getElementById('currentTime');
  const totalTimeEl = document.getElementById('totalTime');

  // SOP Drawer Elements
  const sopDrawer = document.getElementById('sopDrawer');
  const sopTriggerBar = document.getElementById('sopTriggerBar');

  // Tooltip Elements
  const waTooltip = document.getElementById('waTooltip');
  const tooltipClose = document.getElementById('tooltipClose');
  const toastContainer = document.getElementById('toastContainer');

  let isPlayingSim = false;
  let progressInterval = null;
  let currentProgressPercent = 35;

  /**
   * Clean and normalize phone number for WhatsApp wa.me link
   * Example: "+1 (555) 382-9041" -> "15553829041"
   */
  function cleanPhoneNumber(rawPhone) {
    if (!rawPhone) return '15553829041';
    // Remove spaces, dashes, brackets, plus signs
    const cleaned = rawPhone.replace(/[^\d]/g, '');
    return cleaned.length > 0 ? cleaned : '15553829041';
  }

  /**
   * Format phone number for UI display
   */
  function formatPhoneDisplay(rawPhone) {
    if (!rawPhone) return DEFAULT_PHONE;
    return rawPhone.trim();
  }

  /**
   * Get currently active phone number
   */
  function getActivePhone() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_PHONE;
  }

  /**
   * Build WhatsApp URL with URL-encoded tailored message
   */
  function buildWhatsAppUrl(tierKey) {
    const rawPhone = getActivePhone();
    const cleanPhone = cleanPhoneNumber(rawPhone);
    const message = TIER_MESSAGES[tierKey] || TIER_MESSAGES.general;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  /**
   * Update all dynamic WhatsApp links across the page
   */
  function refreshWhatsAppLinks() {
    const activePhone = getActivePhone();
    
    // Update input and label displays
    if (waPhoneInput) waPhoneInput.value = activePhone;
    if (activePhoneDisplay) activePhoneDisplay.textContent = formatPhoneDisplay(activePhone);

    // Update all elements with .dynamic-wa-link
    const dynamicLinks = document.querySelectorAll('.dynamic-wa-link');
    dynamicLinks.forEach((link) => {
      const tier = link.getAttribute('data-tier') || 'general';
      const targetUrl = buildWhatsAppUrl(tier);
      link.setAttribute('href', targetUrl);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
  }

  /**
   * Toast notification helper
   */
  function showToast(message, duration = 3500) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Initialize Event Listeners
   */
  function initEvents() {
    // Save Phone Button
    if (savePhoneBtn && waPhoneInput) {
      savePhoneBtn.addEventListener('click', () => {
        const newNumber = waPhoneInput.value.trim();
        if (newNumber.length < 6) {
          showToast('⚠️ Please enter a valid phone number with country code.');
          return;
        }
        localStorage.setItem(STORAGE_KEY, newNumber);
        refreshWhatsAppLinks();
        showToast(`✅ WhatsApp sales inbox updated to: <strong>${newNumber}</strong>`);
      });

      waPhoneInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          savePhoneBtn.click();
        }
      });
    }

    // Config Bar Close / Collapse
    if (configToggleBtn && configBar) {
      configToggleBtn.addEventListener('click', () => {
        configBar.classList.add('is-collapsed');
        showToast('⚙️ WhatsApp configurator hidden. Refresh page to restore.');
      });
    }

    // Hero Play Button
    const heroPlayBtn = document.getElementById('heroPlayBtn');
    if (heroPlayBtn) {
      heroPlayBtn.addEventListener('click', () => {
        openVideoModal(VIDEO_DATA.hero);
      });
    }

    // Methodology Video Cards
    const methodCards = document.querySelectorAll('.block-video-card');
    methodCards.forEach((card, index) => {
      card.addEventListener('click', () => {
        const data = index === 0 ? VIDEO_DATA.prep : VIDEO_DATA.tracking;
        openVideoModal(data);
      });
    });

    // Modal Close
    if (modalCloseBtn && videoModal) {
      modalCloseBtn.addEventListener('click', closeVideoModal);
      videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) closeVideoModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal.classList.contains('is-active')) {
          closeVideoModal();
        }
      });
    }

    // Simulated Video Controls
    if (hudPlayToggle) {
      hudPlayToggle.addEventListener('click', toggleSimulatedPlayback);
    }

    if (progressBar) {
      progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newPercent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
        currentProgressPercent = newPercent;
        if (progressFilled) progressFilled.style.width = `${newPercent}%`;
      });
    }

    // SOP Drawer Toggle
    if (sopTriggerBar && sopDrawer) {
      sopTriggerBar.addEventListener('click', () => {
        sopDrawer.classList.toggle('is-open');
      });
    }

    // Tooltip Close
    if (tooltipClose && waTooltip) {
      tooltipClose.addEventListener('click', () => {
        waTooltip.style.display = 'none';
      });
    }

    // Smooth Scroll Offset Adjustment
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId && targetId !== '#') {
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            const headerOffset = 80;
            const elementPosition = targetEl.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });

            // If modal was open, close it
            if (videoModal && videoModal.classList.contains('is-active')) {
              closeVideoModal();
            }
          }
        }
      });
    });

    // Notify user on WhatsApp link click
    document.querySelectorAll('.dynamic-wa-link').forEach((link) => {
      link.addEventListener('click', function () {
        const tier = this.getAttribute('data-tier') || 'General';
        const displayTier = tier.toUpperCase();
        console.log(`[DevScale Lead Attribution] User initiated WhatsApp lead: Tier = ${displayTier}`);
      });
    });
  }

  /**
   * Video Modal Functions
   */
  function openVideoModal(data) {
    if (!videoModal) return;
    if (modalVideoTitle) modalVideoTitle.textContent = data.title;
    if (modalVideoPoster) modalVideoPoster.src = data.poster;
    if (totalTimeEl) totalTimeEl.textContent = data.duration;
    if (currentTimeEl) currentTimeEl.textContent = "00:00";
    currentProgressPercent = 0;
    if (progressFilled) progressFilled.style.width = '0%';

    videoModal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
    startSimulatedPlayback();
  }

  function closeVideoModal() {
    if (!videoModal) return;
    videoModal.classList.remove('is-active');
    document.body.style.overflow = '';
    stopSimulatedPlayback();
  }

  function toggleSimulatedPlayback() {
    if (isPlayingSim) {
      stopSimulatedPlayback();
    } else {
      startSimulatedPlayback();
    }
  }

  function startSimulatedPlayback() {
    isPlayingSim = true;
    if (hudPlayIcon) {
      // Switch icon to pause
      hudPlayIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    }

    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      currentProgressPercent += 0.5;
      if (currentProgressPercent >= 100) {
        currentProgressPercent = 100;
        stopSimulatedPlayback();
      }
      if (progressFilled) progressFilled.style.width = `${currentProgressPercent}%`;
      
      // Update time string calculation
      const totalSeconds = 222; // approx 3:42
      const currentSeconds = Math.floor((currentProgressPercent / 100) * totalSeconds);
      const mins = Math.floor(currentSeconds / 60);
      const secs = currentSeconds % 60;
      if (currentTimeEl) {
        currentTimeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
    }, 150);
  }

  function stopSimulatedPlayback() {
    isPlayingSim = false;
    if (hudPlayIcon) {
      // Switch icon to play
      hudPlayIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    }
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }

  // Initialize on DOM Ready
  document.addEventListener('DOMContentLoaded', () => {
    refreshWhatsAppLinks();
    initEvents();

    // Welcome tip in console
    console.info(
      "%cDevScale WhatsApp Funnel Active%c\nChange the phone number at the top bar or via localStorage.setItem('devscale_wa_phone', '+YOURNUMBER')",
      "color: #25D366; font-size: 14px; font-weight: bold;",
      "color: #94a3b8; font-size: 12px;"
    );
  });
})();
