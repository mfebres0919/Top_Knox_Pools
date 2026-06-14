/* =============================================================================
   RIDGELINE POOLS — custom-builds.js
   Pool configurator: toggle-pill filters → live gallery + live price estimate.

   Pricing model (tuned to Ridgeline's premium-gunite, "$85k+" positioning):
     total = base(type) + add(style) + add(finish) + sum(add-ons)
   Pool type / style / finish are "envelope" ranges (min of mins → max of maxes
   when several are picked, since you build ONE pool). Add-ons are summed.
   All numbers live in the pill `data-min` / `data-max` attributes so the model
   stays editable in the HTML — no magic numbers buried here.
============================================================================= */

(function () {
  'use strict';

  const root = document.getElementById('configurator');
  if (!root) return;

  /* Baseline shown before a pool type is chosen — mirrors the "Projects start
     at $85k+" promise on the home page, so the card is never empty. */
  const BASE_DEFAULT = { min: 85000, max: 130000 };

  /* Finish details — drives the swatch + blurb that pops up on selection */
  const FINISH_INFO = {
    plaster: { name: 'Plaster',    swatch: '#e9edf2',
               desc: 'Smooth, classic white-plaster interior — the timeless, budget-friendly standard.' },
    quartz:  { name: 'Quartz',     swatch: '#c4ccd4',
               desc: 'Quartz-aggregate finish — tougher, smoother and more stain-resistant than plaster.' },
    pebble:  { name: 'Pebble',     swatch: '#5f6f63',
               desc: 'Natural pebble finish — richly textured, ultra-durable and premium underfoot.' },
    tile:    { name: 'Glass tile', swatch: 'linear-gradient(135deg,#1f6f8b,#39b8cf)',
               desc: 'Full glass-tile interior — shimmering, luxurious and the longest-lasting option.' },
  };

  const pills   = Array.from(root.querySelectorAll('.cfg-pill'));
  const cards   = Array.from(root.querySelectorAll('.cfg-card'));

  const els = {
    range:     document.getElementById('cfgRange'),
    note:      document.getElementById('cfgNote'),
    baseVal:   document.getElementById('cfgBaseVal'),
    finishVal: document.getElementById('cfgFinishVal'),
    addonVal:  document.getElementById('cfgAddonVal'),
    count:     document.getElementById('cfgCount'),
    selected:  document.getElementById('cfgSelected'),
    selList:   document.getElementById('cfgSelectedList'),
    noResults: document.getElementById('cfgNoResults'),
    reset:     document.getElementById('cfgReset'),
    save:      document.getElementById('cfgSave'),
    finishPreview: document.getElementById('cfgFinishPreview'),
  };

  /* ── Formatting helpers ───────────────────────────────────────────────── */
  const k = (n) => '$' + Math.round(n / 1000) + 'k';
  const full = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const rangeK = (lo, hi) => (lo === hi ? k(lo) : `${k(lo)}–${k(hi)}`);

  /* ── Read current selections, grouped ─────────────────────────────────── */
  function selectionsByGroup() {
    const g = { type: [], style: [], finish: [], addon: [] };
    pills.forEach((p) => {
      if (p.classList.contains('is-active')) g[p.dataset.group].push(p);
    });
    return g;
  }

  /* Envelope: widest span across the chosen pills (build one pool). */
  function envelope(list) {
    if (!list.length) return { min: 0, max: 0 };
    return {
      min: Math.min(...list.map((p) => +p.dataset.min)),
      max: Math.max(...list.map((p) => +p.dataset.max)),
    };
  }

  /* Sum: add-ons stack on top of each other. */
  function sum(list) {
    return list.reduce(
      (acc, p) => ({ min: acc.min + +p.dataset.min, max: acc.max + +p.dataset.max }),
      { min: 0, max: 0 }
    );
  }

  /* ── Recompute estimate + gallery ─────────────────────────────────────── */
  function update() {
    const sel = selectionsByGroup();

    const hasType  = sel.type.length > 0;
    const base     = hasType ? envelope(sel.type) : BASE_DEFAULT;
    const styleAdd = envelope(sel.style);
    const finish   = envelope(sel.finish);
    const addons   = sum(sel.addon);

    const lo = base.min + styleAdd.min + finish.min + addons.min;
    const hi = base.max + styleAdd.max + finish.max + addons.max;

    /* Headline range */
    if (els.range) els.range.textContent = `${full(lo)} – ${full(hi)}`;
    if (els.note) {
      els.note.textContent = hasType
        ? 'Estimated turnkey range · Greater Austin'
        : 'Starting range — pick a pool type to tailor your estimate';
    }

    /* Breakdown boxes (style folds into the structural base figure) */
    if (els.baseVal)   els.baseVal.textContent   = rangeK(base.min + styleAdd.min, base.max + styleAdd.max);
    if (els.finishVal) els.finishVal.textContent = rangeK(finish.min, finish.max);
    if (els.addonVal)  els.addonVal.textContent  = rangeK(addons.min, addons.max);

    /* Selected add-ons summary */
    if (els.selected && els.selList) {
      if (sel.addon.length) {
        els.selList.textContent = sel.addon.map((p) => p.dataset.label || p.textContent.trim()).join(', ');
        els.selected.hidden = false;
      } else {
        els.selected.hidden = true;
      }
    }

    /* Finish preview — pop up a swatch + blurb for each chosen finish */
    if (els.finishPreview) {
      if (sel.finish.length) {
        els.finishPreview.innerHTML = sel.finish.map((p) => {
          const f = FINISH_INFO[p.dataset.value] || {};
          return (
            '<div class="cfg-finish-chip">' +
              '<span class="cfg-finish-swatch" style="background:' + (f.swatch || '#cccccc') + '"></span>' +
              '<span class="cfg-finish-text">' +
                '<strong>' + (f.name || p.dataset.label) + '</strong>' +
                '<span>' + (f.desc || '') + '</span>' +
              '</span>' +
            '</div>'
          );
        }).join('');
        els.finishPreview.hidden = false;
      } else {
        els.finishPreview.hidden = true;
        els.finishPreview.innerHTML = '';
      }
    }

    /* Gallery filtering — faceted: AND across groups, OR within a group */
    const want = {
      type:   sel.type.map((p) => p.dataset.value),
      style:  sel.style.map((p) => p.dataset.value),
      finish: sel.finish.map((p) => p.dataset.value),
      addon:  sel.addon.map((p) => p.dataset.value),
    };

    let visible = 0;
    cards.forEach((card) => {
      const cardAddons = (card.dataset.addons || '').split(',').map((s) => s.trim());
      const ok =
        (!want.type.length   || want.type.includes(card.dataset.type)) &&
        (!want.style.length  || want.style.includes(card.dataset.style)) &&
        (!want.finish.length || want.finish.includes(card.dataset.finish)) &&
        (!want.addon.length  || want.addon.some((a) => cardAddons.includes(a)));

      card.classList.toggle('is-hidden', !ok);
      if (ok) visible++;
    });

    if (els.count) els.count.textContent = String(visible);
    if (els.noResults) els.noResults.hidden = visible !== 0;
  }

  /* ── Wire up pills ────────────────────────────────────────────────────── */
  pills.forEach((p) => {
    p.addEventListener('click', () => {
      const active = p.classList.toggle('is-active');
      p.setAttribute('aria-pressed', active ? 'true' : 'false');
      update();
    });
  });

  /* ── Reset ────────────────────────────────────────────────────────────── */
  if (els.reset) {
    els.reset.addEventListener('click', () => {
      pills.forEach((p) => {
        p.classList.remove('is-active');
        p.setAttribute('aria-pressed', 'false');
      });
      update();
    });
  }

  /* ── Save / print estimate ────────────────────────────────────────────── */
  if (els.save) {
    els.save.addEventListener('click', () => window.print());
  }

  /* Initial paint */
  update();
})();
