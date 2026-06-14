/* =============================================================================
   RIDGELINE POOLS — add-ons.js
   1) Category filter (All / Water / Fire / Lighting / Comfort / Systems)
   2) Lightbox — click a card to view the full image + details, with
      prev/next, backdrop-close, Esc and arrow-key support.
============================================================================= */

(function () {
  'use strict';

  const grid = document.getElementById('addonGrid');
  if (!grid) return;

  const cards      = Array.from(grid.querySelectorAll('.addon-card'));
  const filterBtns = Array.from(document.querySelectorAll('.addon-filter'));
  const countEl    = document.getElementById('addonCount');

  /* Cards currently shown (respects the active filter) — drives prev/next */
  let visibleCards = cards.slice();

  /* ── Filter ───────────────────────────────────────────────────────────── */
  function applyFilter(filter) {
    visibleCards = [];
    cards.forEach((card) => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('is-hidden', !show);
      if (show) visibleCards.push(card);
    });
    if (countEl) countEl.textContent = String(visibleCards.length);
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      applyFilter(btn.dataset.filter);
    });
  });

  /* ── Lightbox ─────────────────────────────────────────────────────────── */
  const lb = document.getElementById('addonLightbox');
  if (!lb) return;

  const lbImg   = document.getElementById('addonLbImg');
  const lbCat   = document.getElementById('addonLbCat');
  const lbTitle = document.getElementById('addonLbTitle');
  const lbDesc  = document.getElementById('addonLbDesc');
  const lbPrice = document.getElementById('addonLbPrice');
  let currentIndex = -1;

  function render(index) {
    if (!visibleCards.length) return;
    currentIndex = (index + visibleCards.length) % visibleCards.length;
    const card = visibleCards[currentIndex];
    const img = card.querySelector('img');
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    if (lbCat)   lbCat.textContent   = card.dataset.cat   || '';
    if (lbTitle) lbTitle.textContent = card.dataset.title || '';
    if (lbDesc)  lbDesc.textContent  = card.dataset.desc  || '';
    if (lbPrice) lbPrice.textContent = card.dataset.price || '';
  }

  function open(card) {
    const idx = visibleCards.indexOf(card);
    if (idx === -1) return;
    render(idx);
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  cards.forEach((card) => card.addEventListener('click', () => open(card)));

  lb.querySelector('.addon-lb-close').addEventListener('click', close);
  lb.querySelector('.addon-lb-prev').addEventListener('click', (e) => { e.stopPropagation(); render(currentIndex - 1); });
  lb.querySelector('.addon-lb-next').addEventListener('click', (e) => { e.stopPropagation(); render(currentIndex + 1); });

  /* Click the dark backdrop (not the figure) to close */
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  render(currentIndex - 1);
    if (e.key === 'ArrowRight') render(currentIndex + 1);
  });
})();
