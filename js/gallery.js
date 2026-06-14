/* ============================================================
   RIDGELINE POOLS — gallery.js
   Filter tabs + fullscreen lightbox (prev / next / close)
   ============================================================ */

(function () {
  'use strict';

  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const items      = Array.from(grid.querySelectorAll('.gallery-item'));
  const filterBtns = Array.from(document.querySelectorAll('.gallery-filter-btn'));

  /* ── Per-image copy (title + short description), keyed by image filename.
        Edit text here — it feeds both the card hover label and the lightbox. ── */
  const CAPTIONS = {
    // Custom builds
    'home-projects-1-d': { t: 'Barton Creek Estate',  d: 'A geometric gunite pool with a raised spa and clean limestone coping.' },
    'home-projects-2-d': { t: 'Tarrytown Modern',     d: 'Sharp lines and a wide sun shelf built to match a contemporary home.' },
    'home-projects-3-d': { t: 'Circle C Oasis',       d: 'A freeform pool and spa tucked into a mature, tree-lined backyard.' },
    'home-projects-4-d': { t: 'Hyde Park Heights',    d: 'A compact lot transformed into a private, resort-style retreat.' },
    'home-projects-5-d': { t: 'Westlake Retreat',     d: 'An infinity edge that opens straight onto the Hill Country view.' },
    'final-cta-d':       { t: 'Twilight Finish',      d: 'A completed build glowing under integrated LED lighting at dusk.' },
    // Renovations
    'renovations-1': { t: 'Replastered & Retiled', d: 'Fresh plaster and new waterline tile brought this pool back to life.' },
    'renovations-2': { t: 'New Coping, New Look',  d: 'Updated travertine coping modernized a dated 1990s design.' },
    'renovations-3': { t: 'Waterline Refresh',     d: 'Hand-set glass tile replaced the cracked, faded original band.' },
    'renovations-4': { t: 'Full Resurface',        d: 'A complete interior resurface in a smooth, durable quartz finish.' },
    'renovations-5': { t: 'Deck Renewal',          d: 'Expanded decking opened up the entire poolside living space.' },
    'renovations-6': { t: 'Equipment Overhaul',    d: 'A variable-speed pump and automation cut this pool’s running costs.' },
    'renovations-7': { t: 'Reshaped & Expanded',   d: 'We enlarged the footprint and added a built-in tanning ledge.' },
    'renovations-8': { t: 'Modern Makeover',       d: 'A tired backyard reimagined with clean, current finishes.' },
    // Add-ons
    'addon-waterfall':       { t: 'Cascading Waterfall', d: 'A custom stone waterfall adds sound and movement to the water.' },
    'addon-grotto':          { t: 'Rock Grotto',         d: 'A hidden grotto with a slide built into natural-look boulders.' },
    'addon-fire-bowls':      { t: 'Fire Bowls',          d: 'Twin fire bowls frame the pool with warmth after sunset.' },
    'addon-spa':             { t: 'Spillover Spa',       d: 'A raised spa spills gently into the main pool below.' },
    'addon-cabana':          { t: 'Poolside Cabana',     d: 'A shaded cabana turns the deck into a true outdoor living room.' },
    'addon-pergola':         { t: 'Cedar Pergola',       d: 'A pergola adds structure and shade over the lounging area.' },
    'addon-outdoor-kitchen': { t: 'Outdoor Kitchen',     d: 'A built-in kitchen makes the backyard an entertaining hub.' },
    'addon-tanning-ledge':   { t: 'Tanning Ledge',       d: 'A shallow sun shelf for loungers, kids, and lazy afternoons.' }
  };
  const keyFromSrc = (src) => src.split('/').pop().replace(/\.[^.]+$/, '');
  const captionFor = (img) => CAPTIONS[keyFromSrc(img.src)] || { t: img.alt || '', d: '' };

  /* Drop a hover title onto each card */
  items.forEach((item) => {
    const cap = captionFor(item.querySelector('img'));
    if (!cap.t) return;
    const label = document.createElement('span');
    label.className = 'gallery-item-title';
    label.textContent = cap.t;
    item.appendChild(label);
  });

  /* ── Filtering ── */
  function applyFilter(filter) {
    items.forEach((item) => {
      const show = filter === 'all' || item.dataset.category === filter;
      item.classList.toggle('is-hidden', !show);
    });
    // jump the swipe row back to the start after a filter change
    grid.scrollTo({ left: 0, behavior: 'smooth' });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      filterBtns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      applyFilter(btn.dataset.filter);
    });
  });

  /* ── Lightbox ── */
  const lightbox = document.getElementById('galleryLightbox');
  const lbImg    = document.getElementById('galleryLightboxImg');
  const lbTitle  = document.getElementById('galleryLightboxTitle');
  const lbDesc   = document.getElementById('galleryLightboxDesc');
  const lbCounter = document.getElementById('galleryLightboxCounter');
  const lbPrev   = lightbox && lightbox.querySelector('.gallery-lb-prev');
  const lbNext   = lightbox && lightbox.querySelector('.gallery-lb-next');
  const lbClose  = lightbox && lightbox.querySelector('.gallery-lb-close');

  let visible = [];   // items currently shown (respects active filter)
  let current = 0;

  function visibleItems() {
    return items.filter((item) => !item.classList.contains('is-hidden'));
  }

  function show(index) {
    if (!visible.length) return;
    current = (index + visible.length) % visible.length;   // wrap around
    const img = visible[current].querySelector('img');
    const cap = captionFor(img);
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    if (lbTitle)   lbTitle.textContent = cap.t;
    if (lbDesc)    lbDesc.textContent = cap.d;
    if (lbCounter) lbCounter.textContent = (current + 1) + ' / ' + visible.length;
  }

  function openLightbox(item) {
    visible = visibleItems();
    const index = visible.indexOf(item);
    if (index === -1) return;
    show(index);
    lightbox.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';  // lock scroll on <html> (sticky-safe)
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.documentElement.style.overflow = '';
  }

  items.forEach((item) => {
    item.addEventListener('click', () => openLightbox(item));
  });

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev)  lbPrev.addEventListener('click', () => show(current - 1));
  if (lbNext)  lbNext.addEventListener('click', () => show(current + 1));

  // Click on the dark backdrop (not the image/buttons) closes
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

})();
