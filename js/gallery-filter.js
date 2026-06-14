/* =============================================================================
   TOP KNOX POOLS — gallery-filter.js
   Homepage gallery:
   - Main tabs:  Project Series / Pools & Spas / Hardscaping
   - Nested sub-filter (All / Fiberglass / Gunite & Spas) shown only under
     "Pools & Spas"
   - Cards: data-category, data-subcategory (pools-spas only),
            data-video (project series) OR data-img (everything else)
   - Lightbox plays a <video> for video cards, shows <img> for image cards
   - Mobile carousel prev/next
   Also keeps the separate gallery.html page logic (.gal-tab / .gal-item).
   Loads on: index.html + gallery.html
============================================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ===========================================================================
     HOMEPAGE GALLERY — tabs + nested sub-filter
  =========================================================================== */

  const filterBtns   = document.querySelectorAll('.filter-btn');     // main tabs
  const subBtns      = document.querySelectorAll('.subfilter-btn');  // sub pills
  const subWrap      = document.getElementById('poolsSubfilters');
  const projectCards = document.querySelectorAll('.project-card');
  const grid         = document.getElementById('projectsGrid');
  const prevBtn      = document.getElementById('projectsPrev');
  const nextBtn      = document.getElementById('projectsNext');

  // Default to whichever tab is marked active in the HTML, else "all"
  let activeCat   = (document.querySelector('.filter-btn.active')?.dataset.filter) || 'all';
  let activeSub   = 'all';
  let mobileIndex = 0;

  const getVisibleCards = () =>
    [...projectCards].filter(c => !c.classList.contains('hidden'));

  const getMobileCardWidth = () => {
    const card = getVisibleCards()[0];
    if (!card || !grid) return 0;
    const gap = parseInt(getComputedStyle(grid).gap) || 0;
    return card.offsetWidth + gap;
  };

  const updateProjectBtns = () => {
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = mobileIndex === 0;
    nextBtn.disabled = mobileIndex >= getVisibleCards().length - 1;
  };

  // A card shows when it matches the active tab — and, inside Pools & Spas,
  // the active sub-filter (unless that's "all").
  const matches = (card) => {
    if (activeCat === 'all') return true;
    if (card.dataset.category !== activeCat) return false;
    if (activeCat === 'pools-spas' && activeSub !== 'all') {
      return card.dataset.subcategory === activeSub;
    }
    return true;
  };

  const applyFilter = (animate) => {
    projectCards.forEach(card => {
      if (matches(card)) {
        card.classList.remove('hidden');
        if (animate) {
          requestAnimationFrame(() => {
            card.style.opacity   = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.style.opacity   = '1';
          card.style.transform = 'none';
        }
      } else if (animate) {
        card.style.opacity   = '0';
        card.style.transform = 'translateY(8px)';
        setTimeout(() => card.classList.add('hidden'), 300);
      } else {
        card.classList.add('hidden');
      }
    });

    // Sub-filter row only exists for Pools & Spas
    if (subWrap) subWrap.hidden = (activeCat !== 'pools-spas');

    // Reset the mobile carousel after any filter change
    mobileIndex = 0;
    if (grid) grid.style.transform = 'translateX(0)';
    updateProjectBtns();
  };

  // Main tabs
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCat = btn.dataset.filter;
      activeSub = 'all';
      subBtns.forEach(b => b.classList.toggle('active', b.dataset.subfilter === 'all'));
      applyFilter(true);
    });
  });

  // Sub pills (Pools & Spas)
  subBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSub = btn.dataset.subfilter;
      applyFilter(true);
    });
  });


  /* ===========================================================================
     MOBILE CAROUSEL
  =========================================================================== */

  const slideTo = (index) => {
    const visible = getVisibleCards();
    mobileIndex = Math.max(0, Math.min(index, visible.length - 1));
    if (grid) grid.style.transform = `translateX(-${mobileIndex * getMobileCardWidth()}px)`;
    updateProjectBtns();
  };

  if (prevBtn) prevBtn.addEventListener('click', () => slideTo(mobileIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => slideTo(mobileIndex + 1));
  window.addEventListener('resize', () => slideTo(0));


  /* ===========================================================================
     LIGHTBOX — image (data-img) or video (data-video)
  =========================================================================== */

  const lightbox      = document.getElementById('lightbox');
  const lightboxImg   = document.getElementById('lightboxImg');
  const lightboxVideo = document.getElementById('lightboxVideo');
  const lightboxCap   = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  if (lightbox) {
    const openImage = (src, caption) => {
      if (lightboxVideo) {
        lightboxVideo.pause();
        lightboxVideo.removeAttribute('src');
        lightboxVideo.style.display = 'none';
      }
      lightboxImg.src           = src;
      lightboxImg.alt           = caption;
      lightboxImg.style.display = 'block';
      if (lightboxCap) lightboxCap.textContent = caption;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const openVideo = (src, caption) => {
      lightboxImg.removeAttribute('src');
      lightboxImg.style.display = 'none';
      if (lightboxVideo) {
        lightboxVideo.src           = src;
        lightboxVideo.style.display = 'block';
        lightboxVideo.play().catch(() => {});   // ignore autoplay block
      }
      if (lightboxCap) lightboxCap.textContent = caption;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      if (lightboxVideo) lightboxVideo.pause();
      setTimeout(() => {
        lightboxImg.removeAttribute('src');
        if (lightboxVideo) lightboxVideo.removeAttribute('src');
      }, 300);
    };

    projectCards.forEach(card => {
      card.addEventListener('click', () => {
        const title   = card.dataset.title || '';
        const loc     = card.dataset.location || '';
        const caption = loc ? `${title} — ${loc}` : title;
        if (card.dataset.video) {
          openVideo(card.dataset.video, caption);
        } else if (card.dataset.img) {
          openImage(card.dataset.img, caption);
        }
      });
    });

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    });
  }

  // Set the initial state (default tab, no animation)
  applyFilter(false);
  updateProjectBtns();


  /* ===========================================================================
     PROJECT SERIES — tabs + video lightbox (reuses the #lightbox player)
  =========================================================================== */

  const seriesTabs  = document.querySelectorAll('.series-tab');
  const seriesCards = document.querySelectorAll('.series-card');

  if (seriesTabs.length && seriesCards.length) {

    // Any card without a video URL is flagged "coming soon" (badge + not clickable).
    // Add a data-video later and it automatically becomes playable.
    seriesCards.forEach(card => {
      if (!card.dataset.video) card.classList.add('is-coming-soon');
    });

    const filterSeries = (series) => {
      seriesCards.forEach(card => {
        card.classList.toggle('hidden', card.dataset.series !== series);
      });
    };

    seriesTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        seriesTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        filterSeries(tab.dataset.series);
      });
    });

    // Initial filter — whichever tab is marked active, else the first
    const initialTab = document.querySelector('.series-tab.active') || seriesTabs[0];
    filterSeries(initialTab.dataset.series);

    // Open a series video in the shared lightbox (#lightbox close handlers above
    // already pause/clear the video on close).
    const sLb    = document.getElementById('lightbox');
    const sLbImg = document.getElementById('lightboxImg');
    const sLbVid = document.getElementById('lightboxVideo');
    const sLbCap = document.getElementById('lightboxCaption');

    const openSeriesVideo = (card) => {
      const src = card.dataset.video;
      if (!src || !sLb) return;                 // coming soon → no-op
      if (sLbImg) { sLbImg.removeAttribute('src'); sLbImg.style.display = 'none'; }
      if (sLbVid) {
        sLbVid.src = src;
        sLbVid.style.display = 'block';
        sLbVid.play().catch(() => {});
      }
      if (sLbCap) sLbCap.textContent = card.dataset.title || '';
      sLb.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    seriesCards.forEach(card => {
      card.addEventListener('click', () => openSeriesVideo(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openSeriesVideo(card);
        }
      });
    });
  }


  /* ===========================================================================
     GALLERY PAGE — Filter tabs + lightbox (separate gallery.html)
  =========================================================================== */

  const galTabs  = document.querySelectorAll('.gal-tab');
  const galItems = document.querySelectorAll('.gal-item');

  if (galTabs.length) {
    galTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const filter = tab.dataset.filter;

        galTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        galItems.forEach(item => {
          const cat = item.dataset.category;
          if (filter === 'all' || cat === filter) {
            item.classList.remove('hidden');
          } else {
            item.classList.add('hidden');
          }
        });
      });
    });
  }

  const galLightbox      = document.getElementById('galLightbox');
  const galLightboxImg   = document.getElementById('galLightboxImg');
  const galLightboxCap   = document.getElementById('galLightboxCaption');
  const galLightboxClose = document.getElementById('galLightboxClose');

  if (galLightbox && galItems.length) {
    galItems.forEach(item => {
      item.addEventListener('click', () => {
        const img      = item.querySelector('img');
        const title    = item.dataset.title    || '';
        const location = item.dataset.location || '';

        if (!img) return;

        galLightboxImg.src         = img.src;
        galLightboxImg.alt         = img.alt;
        galLightboxCap.textContent = location ? `${title} — ${location}` : title;

        galLightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    const closeGalLightbox = () => {
      galLightbox.classList.remove('open');
      document.body.style.overflow = '';
    };

    if (galLightboxClose) galLightboxClose.addEventListener('click', closeGalLightbox);

    galLightbox.addEventListener('click', (e) => {
      if (e.target === galLightbox) closeGalLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && galLightbox.classList.contains('open')) closeGalLightbox();
    });
  }

});
