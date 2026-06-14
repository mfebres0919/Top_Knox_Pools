/* =============================================================================
   RIDGELINE POOLS — renovations.js
   1) Before/After sliders — drag (mouse/touch) or arrow-keys to reveal.
   2) Category filter — show only the transformations in the chosen type.
============================================================================= */

(function () {
  'use strict';

  /* ── Before / After sliders ───────────────────────────────────────────── */
  function initSlider(slider) {
    const before  = slider.querySelector('.ba-before');
    const divider = slider.querySelector('.ba-divider');
    if (!before || !divider) return;

    let dragging = false;

    function setPct(pct) {
      pct = Math.max(0, Math.min(100, pct));
      before.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      divider.style.left = pct + '%';
      slider.setAttribute('aria-valuenow', Math.round(pct));
    }

    function pctFromEvent(e) {
      const rect = slider.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setPct((x / rect.width) * 100);
    }

    slider.addEventListener('pointerdown', (e) => {
      dragging = true;
      if (slider.setPointerCapture) slider.setPointerCapture(e.pointerId);
      pctFromEvent(e);
    });
    slider.addEventListener('pointermove', (e) => {
      if (dragging) pctFromEvent(e);
    });
    slider.addEventListener('pointerup',     () => { dragging = false; });
    slider.addEventListener('pointercancel', () => { dragging = false; });

    /* Keyboard accessibility */
    slider.addEventListener('keydown', (e) => {
      const cur = parseFloat(slider.getAttribute('aria-valuenow')) || 50;
      if (e.key === 'ArrowLeft')  { setPct(cur - 4); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setPct(cur + 4); e.preventDefault(); }
      if (e.key === 'Home')       { setPct(0);   e.preventDefault(); }
      if (e.key === 'End')        { setPct(100); e.preventDefault(); }
    });

    setPct(50);
  }

  document.querySelectorAll('.ba-slider').forEach(initSlider);

  /* ── Category filter ──────────────────────────────────────────────────── */
  const filterBtns = Array.from(document.querySelectorAll('.ba-filter'));
  const cards      = Array.from(document.querySelectorAll('.ba-card'));
  const countEl    = document.getElementById('baCount');

  function applyFilter(filter) {
    let visible = 0;
    cards.forEach((card) => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('is-hidden', !show);
      if (show) visible++;
    });
    if (countEl) countEl.textContent = String(visible);
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
})();
