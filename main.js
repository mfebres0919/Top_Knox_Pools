/* ============================================================
   RIDGELINE POOLS v2 — main.js
   Nav: hamburger, drawer, dropdowns, scrolled state
   Scroll reveal: IntersectionObserver fade-in
   About tabs, Projects carousel/filter/touch, Process line
   ============================================================ */

(function () {
  'use strict';

  /* ── Elements ── */
  const navbar      = document.getElementById('navbar');
  const hamburger   = document.querySelector('.nav-hamburger');
  const drawer      = document.querySelector('.nav-drawer');
  const drawerClose = document.querySelector('.nav-drawer-close');
  const overlay     = document.querySelector('.nav-overlay');
  const dropToggles = document.querySelectorAll('.nav-drop-toggle');

  /* ── Navbar scroll shadow ── */
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('is-scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  /* ── Open / close mobile drawer ── */
  function openDrawer() {
    if (!drawer || !hamburger || !overlay) return;
    drawer.classList.add('is-open');
    overlay.classList.add('is-active');
    hamburger.setAttribute('aria-expanded', 'true');
    /* NOTE: do NOT lock body scroll here. Setting overflow on <body> makes it
       a scroll container, which un-sticks the sticky navbar and drops the
       menu off-screen when the page is scrolled. The dropdown stays glued
       under the navbar on its own. */
  }

  function closeDrawer() {
    if (!drawer || !hamburger || !overlay) return;
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-active');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  /* Toggle (hamburger turns into an X and closes when tapped again) */
  function toggleDrawer() {
    if (drawer && drawer.classList.contains('is-open')) closeDrawer();
    else openDrawer();
  }

  if (hamburger)   hamburger.addEventListener('click', toggleDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (overlay)     overlay.addEventListener('click', closeDrawer);

  /* Close the menu when any link inside it is tapped (incl. same-page anchors) */
  if (drawer) {
    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeDrawer);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  /* ── Dropdown toggles (desktop + mobile drawer) ── */
  dropToggles.forEach((toggle) => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

      /* Close all other dropdowns */
      dropToggles.forEach((other) => {
        if (other !== toggle) {
          other.setAttribute('aria-expanded', 'false');
          const sub = other.nextElementSibling;
          if (sub && sub.classList.contains('nav-sub')) sub.classList.remove('is-open');
        }
      });

      toggle.setAttribute('aria-expanded', String(!isExpanded));
      const sub = toggle.nextElementSibling;
      if (sub && sub.classList.contains('nav-sub')) sub.classList.toggle('is-open', !isExpanded);
    });
  });

  /* Close desktop dropdowns when clicking outside */
  document.addEventListener('click', () => {
    dropToggles.forEach((toggle) => toggle.setAttribute('aria-expanded', 'false'));
  });

  /* ── Scroll Reveal (IntersectionObserver) ── */
  const revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  }

  /* ── About section tabs ── */
  const tabBtns   = document.querySelectorAll('.about-tab-btn');
  const tabPanels = document.querySelectorAll('.about-tab-panel');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      if (btn.classList.contains('is-active')) return;

      tabBtns.forEach((b) => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
      tabPanels.forEach((p) => p.classList.remove('is-active'));

      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');

      requestAnimationFrame(() => {
        const panel = document.getElementById('tab-' + target);
        if (panel) panel.classList.add('is-active');
      });
    });
  });

  /* ══════════════════════════════════════════════
     PROJECTS — filter tabs, desktop drag scroll,
     mobile touch swipe, tap-to-reveal overlay
  ══════════════════════════════════════════════ */

  const projectsTrack     = document.getElementById('projectsTrack');
  const projectsWrap      = document.getElementById('projectsTrackWrap');
  const projectFilterBtns = document.querySelectorAll('.projects-filter-btn');

  if (projectsTrack && projectsWrap) {

    let currentOffset = 0; /* current card index */

    /* ── Helpers ── */
    function getVisibleCards() {
      return Array.from(projectsTrack.querySelectorAll('.project-card:not(.is-hidden)'));
    }

    function cardsPerView() {
      if (window.innerWidth >= 1024) return 4;
      if (window.innerWidth >= 600)  return 2;
      return 1;
    }

    /* Snap track to a card index with smooth transition */
    function goToOffset(index) {
      const cards     = getVisibleCards();
      const max       = Math.max(0, cards.length - cardsPerView());
      currentOffset   = Math.min(Math.max(index, 0), max);
      const cardWidth = cards[0] ? cards[0].offsetWidth : 0;
      projectsTrack.classList.remove('is-dragging'); /* re-enable transition */
      projectsTrack.style.transform = `translateX(-${currentOffset * cardWidth}px)`;
    }

    /* Reset on resize */
    window.addEventListener('resize', () => {
      currentOffset = 0;
      projectsTrack.style.transform = 'translateX(0)';
    }, { passive: true });

    /* ── Filter tabs ── */
    projectFilterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        projectFilterBtns.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        const filter   = btn.dataset.filter;
        const allCards = projectsTrack.querySelectorAll('.project-card');
        allCards.forEach((card) => {
          card.classList.toggle('is-hidden', filter !== 'all' && card.dataset.category !== filter);
        });

        currentOffset = 0;
        projectsTrack.style.transform = 'translateX(0)';
      });
    });

    /* ── Desktop: click-drag to scroll, snap to nearest card on release ── */
    let dragStartX   = 0;
    let dragStartOff = 0; /* translateX value at drag start */
    let isDragging   = false;
    let hasDragged   = false; /* true if finger/mouse moved enough to be a drag */

    function getCurrentTranslateX() {
      const style = window.getComputedStyle(projectsTrack);
      const matrix = new DOMMatrix(style.transform);
      return matrix.m41; /* translateX value */
    }

    function getCardWidth() {
      const cards = getVisibleCards();
      return cards[0] ? cards[0].offsetWidth : 0;
    }

    /* Snap to nearest card after drag */
    function snapToNearest(currentX) {
      const cardWidth = getCardWidth();
      if (!cardWidth) return;
      const rawIndex  = -currentX / cardWidth;
      const snapped   = Math.round(rawIndex);
      goToOffset(snapped);
    }

    /* Only run drag on desktop (non-touch) */
    projectsWrap.addEventListener('mousedown', (e) => {
      if (window.innerWidth < 1024) return;
      isDragging   = true;
      hasDragged   = false;
      dragStartX   = e.clientX;
      dragStartOff = getCurrentTranslateX();
      projectsTrack.classList.add('is-dragging'); /* disable transition during drag */
      projectsWrap.classList.add('is-dragging');
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      if (Math.abs(dx) > 4) hasDragged = true;

      /* Live-follow the cursor */
      const cards    = getVisibleCards();
      const maxPx    = Math.max(0, cards.length - cardsPerView()) * getCardWidth();
      const newX     = Math.min(0, Math.max(dragStartOff + dx, -maxPx));
      projectsTrack.style.transform = `translateX(${newX}px)`;
    });

    window.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      projectsWrap.classList.remove('is-dragging');

      if (hasDragged) {
        /* Snap to nearest card */
        snapToNearest(getCurrentTranslateX());
      }
    });

    /* ── Mobile: touch swipe + tap-to-reveal overlay ── */
    let touchedCard = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let didScroll   = false;

    const isTouch = () => window.matchMedia('(hover: none)').matches;

    projectsTrack.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      didScroll   = false;
    }, { passive: true });

    projectsTrack.addEventListener('touchmove', (e) => {
      const dx = Math.abs(e.touches[0].clientX - touchStartX);
      const dy = Math.abs(e.touches[0].clientY - touchStartY);
      if (dx > 8 || dy > 8) didScroll = true;
    }, { passive: true });

    projectsTrack.addEventListener('touchend', (e) => {
      if (didScroll || !isTouch()) return;

      const card = e.target.closest('.project-card');

      if (!card) {
        if (touchedCard) { touchedCard.classList.remove('is-touched'); touchedCard = null; }
        return;
      }

      if (card === touchedCard) {
        /* Second tap — follow link */
        card.classList.remove('is-touched');
        touchedCard = null;
      } else {
        /* First tap — show overlay */
        e.preventDefault();
        if (touchedCard) touchedCard.classList.remove('is-touched');
        card.classList.add('is-touched');
        touchedCard = card;
      }
    });

    /* Tap outside track closes open card */
    document.addEventListener('touchend', (e) => {
      if (!touchedCard) return;
      if (!projectsTrack.contains(e.target)) {
        touchedCard.classList.remove('is-touched');
        touchedCard = null;
      }
    }, { passive: true });

  } /* end if (projectsTrack) */

  /* ══════════════════════════════════════════════
     PROCESS — scroll-driven vertical line fill
     Uses requestAnimationFrame for smooth updates
  ══════════════════════════════════════════════ */

  const processBody       = document.getElementById('processBody');
  const processLineFill   = document.getElementById('processLineFill');
  const processLineMobile = document.getElementById('processLineMobileFill');

  if (processBody && (processLineFill || processLineMobile)) {
    let rafPending = false;

    function updateProcessLine() {
      const rect     = processBody.getBoundingClientRect();
      const sectionH = processBody.offsetHeight;
      const windowH  = window.innerHeight;

      const scrolled = Math.min(Math.max((-rect.top + windowH * 0.5) / sectionH, 0), 1);
      const pct      = (scrolled * 100).toFixed(2) + '%';

      if (processLineFill)   processLineFill.style.height   = pct;
      if (processLineMobile) processLineMobile.style.height  = pct;

      rafPending = false;
    }

    function onScroll() {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updateProcessLine);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    updateProcessLine();
  }

  /* ══════════════════════════════════════════════
     BLOG CAROUSEL
     Auto-advances every 3s, slides left smoothly
     Pause on hover. Dots show current slide.
     Loops back to start after last slide.
  ══════════════════════════════════════════════ */

  const blogTrack  = document.getElementById('blogTrack');
  const blogDots   = document.getElementById('blogDots');
  const blogOuter  = document.getElementById('blogCarouselOuter');

  if (blogTrack && blogDots) {

    /* How many cards fit per view at current breakpoint */
    function blogCardsPerView() {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 600)  return 2;
      return 1;
    }

    const totalCards  = blogTrack.querySelectorAll('.blog-card').length; /* 6 */
    let currentSlide  = 0;
    let autoTimer     = null;

    /* Total number of slides = total cards - cards per view
       e.g. 6 cards, 3 per view = slides 0,1,2,3 (indices 0–3) */
    function totalSlides() {
      return totalCards - blogCardsPerView();
    }

    /* Build dots once */
    function buildDots() {
      blogDots.innerHTML = '';
      /* One dot per possible starting position */
      for (let i = 0; i <= totalSlides(); i++) {
        const dot = document.createElement('button');
        dot.className = 'blog-dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        blogDots.appendChild(dot);
      }
    }

    /* Move track to a slide index */
    function goToSlide(index) {
      /* Clamp to valid range */
      currentSlide = Math.min(Math.max(index, 0), totalSlides());

      /* Get card width including gap (1.5rem = 24px) */
      const card      = blogTrack.querySelector('.blog-card');
      const cardWidth = card ? card.offsetWidth + 24 : 0;

      blogTrack.style.transform = `translateX(-${currentSlide * cardWidth}px)`;

      /* Update dots */
      blogDots.querySelectorAll('.blog-dot').forEach((dot, i) => {
        dot.classList.toggle('is-active', i === currentSlide);
      });
    }

    /* Advance to next slide, loop back to 0 */
    function nextSlide() {
      goToSlide(currentSlide >= totalSlides() ? 0 : currentSlide + 1);
    }

    /* Start auto-advance */
    function startAuto() {
      stopAuto();
      autoTimer = setInterval(nextSlide, 6000);
    }

    /* Stop auto-advance */
    function stopAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    const blogPrevBtn = document.getElementById('blogPrev');
    const blogNextBtn = document.getElementById('blogNext');

    if (blogPrevBtn) blogPrevBtn.addEventListener('click', () => {
      goToSlide(currentSlide <= 0 ? totalSlides() : currentSlide - 1);
      startAuto(); /* restart timer after manual click */
    });

    if (blogNextBtn) blogNextBtn.addEventListener('click', () => {
      goToSlide(currentSlide >= totalSlides() ? 0 : currentSlide + 1);
      startAuto();
    });

    /* Pause on hover */
    blogOuter.addEventListener('mouseenter', stopAuto);
    blogOuter.addEventListener('mouseleave', startAuto);

    /* Rebuild on resize */
    window.addEventListener('resize', () => {
      buildDots();
      goToSlide(0);
    }, { passive: true });

    /* Init */
    buildDots();
    goToSlide(0);
    startAuto();
  }

  /* ── Scroll-to-top button ── */
  const scrollBtn = document.getElementById('scrollTop');

  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('is-visible', window.scrollY > 400);
    }, { passive: true });

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ══════════════════════════════════════════════
     FAQ — accordion (one open at a time)
  ══════════════════════════════════════════════ */
  const faqItems = document.querySelectorAll('.faq-item');

  const setPanelHeight = (panel, open) => {
    panel.style.maxHeight = open ? panel.scrollHeight + 'px' : null;
  };

  faqItems.forEach((item) => {
    const btn   = item.querySelector('.faq-q');
    const panel = item.querySelector('.faq-a');
    if (!btn || !panel) return;

    // Initialise any item marked open on load
    if (item.classList.contains('is-open')) setPanelHeight(panel, true);

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      // Close every item
      faqItems.forEach((other) => {
        other.classList.remove('is-open');
        const oBtn   = other.querySelector('.faq-q');
        const oPanel = other.querySelector('.faq-a');
        if (oBtn)   oBtn.setAttribute('aria-expanded', 'false');
        if (oPanel) setPanelHeight(oPanel, false);
      });

      // Open the clicked item if it was closed
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        setPanelHeight(panel, true);
      }
    });
  });

  // Keep the open panel's height correct on resize (text reflow)
  if (faqItems.length > 0) {
    window.addEventListener('resize', () => {
      const openPanel = document.querySelector('.faq-item.is-open .faq-a');
      if (openPanel) setPanelHeight(openPanel, true);
    }, { passive: true });
  }

})();

/* ============================================================
   TOP KNOX — added behaviors
   • Testimonials carousel (Meridian-style)
   • Background video autoplay nudge (hero + services)
   ============================================================ */
(function () {
  'use strict';

  /* ── Testimonials carousel ── */
  var testimonialsTrack = document.getElementById('testimonialsTrack');
  var testimonialsPrev  = document.getElementById('testimonialsPrev');
  var testimonialsNext  = document.getElementById('testimonialsNext');
  var testimonialsDots  = document.querySelectorAll('.testimonials-dot');

  if (testimonialsTrack && testimonialsPrev && testimonialsNext) {
    var currentSlide = 0;
    var totalSlides  = testimonialsTrack.querySelectorAll('.testimonials-slide').length;

    var goToSlide = function (index) {
      currentSlide = Math.max(0, Math.min(index, totalSlides - 1));
      testimonialsTrack.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
      testimonialsDots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === currentSlide);
      });
      testimonialsPrev.disabled = currentSlide === 0;
      testimonialsNext.disabled = currentSlide === totalSlides - 1;
    };

    testimonialsPrev.addEventListener('click', function () { goToSlide(currentSlide - 1); });
    testimonialsNext.addEventListener('click', function () { goToSlide(currentSlide + 1); });
    testimonialsDots.forEach(function (dot) {
      dot.addEventListener('click', function () { goToSlide(parseInt(dot.dataset.slide, 10)); });
    });

    goToSlide(0);
  }

  /* ── Background videos: force autoplay on mobile Safari/Chrome ── */
  document.querySelectorAll('video.hero-video, video.services-bg-video').forEach(function (v) {
    v.muted = true;                       // set the property, not just the attribute
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');

    var tryPlay = function () {
      var p = v.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    };
    tryPlay();
    ['touchstart', 'pointerdown', 'scroll'].forEach(function (evt) {
      window.addEventListener(evt, tryPlay, { once: true, passive: true });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) tryPlay(); });
      }, { threshold: 0.25 }).observe(v);
    }
  });


  /* ── Scroll-spy: activate the nav link for the section currently in view ──
     Watches only on-page anchor links (Home / About / Services / Project Series).
     Gallery & Contact point to other pages, so they're skipped. */
  (function () {
    if (!('IntersectionObserver' in window)) return;

    var spyLinks = Array.prototype.slice.call(
      document.querySelectorAll('.nav-links > li > a[href^="#"], .nav-drawer > ul > li > a[href^="#"]')
    );
    if (!spyLinks.length) return;

    /* Unique section ids that actually exist on the page */
    var ids = [];
    spyLinks.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (id && document.getElementById(id) && ids.indexOf(id) === -1) ids.push(id);
    });
    if (!ids.length) return;

    function setActive(id) {
      spyLinks.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
      });
    }

    /* A thin band near the top-center of the viewport is the "active line":
       whichever section crosses it becomes the active one. */
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setActive(e.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    ids.forEach(function (id) { spy.observe(document.getElementById(id)); });
  })();

})();
