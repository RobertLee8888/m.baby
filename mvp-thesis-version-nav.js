import { thesisMedia } from './mvp-thesis-media.js';

let navigationSequence = 0;

export function createVersionNavigation(ui, versions, initial, select) {
  const { el, btn, icon, stockLogo, openSheet, closeSheet, sheetClose } = ui;
  const nav = el('nav', 'thesis-version-nav'); nav.setAttribute('aria-label', 'Thesis updates');
  const latest = btn('thesis-version-pill thesis-view-latest', 'View latest'); latest.textContent = 'View latest'; latest.hidden = true;
  const viewport = el('div', 'thesis-version-viewport');
  const scroller = el('div', 'thesis-version-scroll'); scroller.setAttribute('role', 'tablist'); scroller.setAttribute('aria-label', 'Versions');
  const track = el('div', 'thesis-version-track');
  const expand = btn('thesis-version-expand', 'All updates');
  expand.append(icon('thesis/detail/arrow-down.svg')); expand.setAttribute('aria-haspopup', 'dialog'); expand.setAttribute('aria-expanded', 'false');
  const token = 'updates-' + Date.now() + '-' + ++navigationSequence;
  const lifecycle = new AbortController();
  let selected = initial;
  const badge = () => el('span', 'thesis-latest-badge', 'Latest');
  const pills = versions.map((version, index) => {
    const pill = btn('thesis-version-pill', version.date + (index ? '' : ', Latest'));
    pill.setAttribute('role', 'tab'); pill.dataset.version = version.id;
    pill.append(el('span', null, version.date)); if (!index) pill.append(badge());
    pill.addEventListener('click', () => choose(version));
    pill.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? versions.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + versions.length) % versions.length;
      choose(versions[next]); pills[next].focus({ preventScroll: true });
    });
    track.append(pill); return pill;
  });
  function paint() {
    pills.forEach((pill, index) => {
      const active = versions[index].id === selected;
      pill.setAttribute('aria-selected', String(active)); pill.tabIndex = active ? 0 : -1;
    });
  }
  function visibility() {
    // Offset geometry stays stable when the fixed return button appears.
    latest.hidden = scroller.scrollLeft < pills[0].offsetWidth;
    viewport.classList.toggle('has-more', scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1);
  }
  function reveal(pill) {
    if (pill === pills[0]) { scroller.scrollLeft = 0; visibility(); return; }
    // Showing View latest narrows the viewport; settle the selected pill once more.
    for (let pass = 0; pass < 2; pass++) {
      const left = pill.offsetLeft, right = left + pill.offsetWidth;
      if (left < scroller.scrollLeft) scroller.scrollLeft = left;
      else if (right > scroller.scrollLeft + scroller.clientWidth - 24) scroller.scrollLeft = right - scroller.clientWidth + 24;
      visibility();
    }
  }
  function choose(version) {
    if (selected !== version.id) { selected = version.id; paint(); select(version); }
    reveal(pills[versions.indexOf(version)]);
  }
  latest.addEventListener('click', () => choose(versions[0]));
  scroller.addEventListener('scroll', visibility, { passive: true });
  scroller.append(track); viewport.append(scroller); nav.append(latest, viewport, expand);
  paint(); requestAnimationFrame(() => { reveal(pills[versions.findIndex(v => v.id === selected)]); visibility(); });

  function openUpdates(restore = false) {
    const timeline = el('div', 'thesis-update-timeline');
    versions.forEach((version, index) => {
      const row = btn('thesis-update-row', version.date + (index ? '' : ', Latest'));
      row.dataset.version = version.id;
      if (version.id === selected) row.setAttribute('aria-current', 'true');
      const rail = el('span', 'thesis-update-rail'); rail.append(icon('thesis/detail/timeline-node.svg'));
      const body = el('span', 'thesis-update-body');
      const date = el('span', 'thesis-update-date'); date.append(el('time', null, version.date)); if (!index) date.append(badge());
      const tickers = el('span', 'thesis-update-tickers');
      version.card.tickers.forEach(ticker => {
        const tag = el('span', 'social-ticker'); tag.append(stockLogo(ticker, 'social-stock-logo'), el('span', null, ticker.sym)); tickers.append(tag);
      });
      body.append(date, el('span', 'thesis-update-summary', version.summary));
      if (version.card.social.media?.length) body.append(thesisMedia(ui, version.card.social.media));
      if (tickers.childElementCount) body.append(tickers);
      row.append(rail, body); row.addEventListener('click', () => { choose(version); closeSheet(); }); timeline.append(row);
    });
    const listeners = new AbortController();
    const sheet = document.getElementById('sheet');
    const grabber = sheet.querySelector('.grabber');
    openSheet([sheetClose(), el('h2', null, 'All updates')], [timeline], {
      full: true, ruled: true, bodyClass: 'thesis-updates', label: 'All updates',
      onClose(immediate) {
        listeners.abort(); sheet.style.removeProperty('transform'); sheet.style.removeProperty('transition');
        expand.setAttribute('aria-expanded', 'false');
        if (history.state?.thesisUpdates === token) {
          if (immediate) { const state = { ...history.state }; delete state.thesisUpdates; history.replaceState(state, ''); }
          else history.back();
        }
      },
    });
    if (!restore) history.pushState({ ...history.state, thesisUpdates: token }, '');
    expand.setAttribute('aria-expanded', 'true');
    let drag;
    grabber.addEventListener('pointerdown', event => {
      drag = { y: event.clientY, distance: 0 }; grabber.setPointerCapture(event.pointerId);
    }, { signal: listeners.signal });
    grabber.addEventListener('pointermove', event => {
      if (!drag) return;
      drag.distance = Math.max(0, (event.clientY - drag.y) / (sheet.getBoundingClientRect().width / sheet.offsetWidth));
      sheet.style.transition = 'none'; sheet.style.transform = 'translateY(' + drag.distance + 'px)';
    }, { signal: listeners.signal });
    function finish(event) {
      if (!drag) return;
      const dismiss = event.type !== 'pointercancel' && drag.distance > 64;
      drag = null; sheet.style.removeProperty('transition'); sheet.style.removeProperty('transform');
      if (dismiss) closeSheet();
    }
    grabber.addEventListener('pointerup', finish, { signal: listeners.signal });
    grabber.addEventListener('pointercancel', finish, { signal: listeners.signal });
  }
  expand.addEventListener('click', () => openUpdates());
  window.addEventListener('popstate', () => {
    if (history.state?.thesisUpdates === token) openUpdates(true);
    else if (expand.getAttribute('aria-expanded') === 'true') closeSheet();
  }, { signal: lifecycle.signal });
  const resize = new ResizeObserver(visibility); resize.observe(viewport);
  return { node: nav, refresh: visibility, destroy() { lifecycle.abort(); resize.disconnect(); } };
}
