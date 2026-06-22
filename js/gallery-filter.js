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
  const lightboxPrev  = document.getElementById('lightboxPrev');
  const lightboxNext  = document.getElementById('lightboxNext');

  let lbGroup = [];   // elements currently navigable in the lightbox
  let lbIndex = 0;

  // Exposed so other sections (e.g. Project Series) can open the same lightbox
  let openLightboxGroup = function () {};

  if (lightbox) {
    const captionFor = (el) => {
      const title = el.dataset.title || '';
      const loc   = el.dataset.location || '';
      return loc ? `${title} — ${loc}` : title;
    };

    const showAt = (index) => {
      if (!lbGroup.length) return;
      lbIndex = (index + lbGroup.length) % lbGroup.length;   // wrap around
      const el = lbGroup[lbIndex];
      const caption = captionFor(el);

      if (el.dataset.video) {
        lightboxImg.removeAttribute('src');
        lightboxImg.style.display = 'none';
        if (lightboxVideo) {
          lightboxVideo.src           = el.dataset.video;
          lightboxVideo.style.display = 'block';
          lightboxVideo.play().catch(() => {});
        }
      } else {
        if (lightboxVideo) {
          lightboxVideo.pause();
          lightboxVideo.removeAttribute('src');
          lightboxVideo.style.display = 'none';
        }
        lightboxImg.src           = el.dataset.img || '';
        lightboxImg.alt           = caption;
        lightboxImg.style.display = 'block';
      }
      if (lightboxCap) lightboxCap.textContent = caption;

      /* Only show prev/next when there's more than one item to browse */
      const showNav = lbGroup.length > 1 ? 'flex' : 'none';
      if (lightboxPrev) lightboxPrev.style.display = showNav;
      if (lightboxNext) lightboxNext.style.display = showNav;
    };

    const openGroup = (items, startIndex) => {
      lbGroup = items;
      showAt(startIndex < 0 ? 0 : startIndex);
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    openLightboxGroup = openGroup;   // expose to other sections

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      if (lightboxVideo) lightboxVideo.pause();
      setTimeout(() => {
        lightboxImg.removeAttribute('src');
        if (lightboxVideo) lightboxVideo.removeAttribute('src');
      }, 300);
    };

    const goNext = () => showAt(lbIndex + 1);
    const goPrev = () => showAt(lbIndex - 1);

    // Gallery cards — group is the cards currently visible (respects the filter)
    projectCards.forEach(card => {
      card.addEventListener('click', () => {
        if (!card.dataset.img && !card.dataset.video) return;
        const group = [...projectCards].filter(c =>
          !c.classList.contains('hidden') && (c.dataset.img || c.dataset.video));
        openGroup(group, group.indexOf(card));
      });
    });

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxPrev)  lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); goPrev(); });
    if (lightboxNext)  lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if      (e.key === 'Escape')     closeLightbox();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft')  goPrev();
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

    // Open a series video in the shared lightbox, grouped with the other
    // playable videos in the active series (so prev/next browses them).
    const openSeriesVideo = (card) => {
      if (!card.dataset.video) return;          // coming soon → no-op
      const group = [...seriesCards].filter(c =>
        !c.classList.contains('hidden') && c.dataset.video);
      openLightboxGroup(group, group.indexOf(card));
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
