import { SIGNALS, EARLIER_VERSIONS, PROFILES } from './mvp-social-detail-data.js';
import { createThesisProfiles } from './mvp-thesis-profile.js?v=2';
import { createThesisDetail } from './mvp-thesis-detail.js?v=2';

// Pages retain their DOM while stacked, preserving scroll and filters.
export function createSocialPages(ui) {
  const { el, img, btn, icon, cards, content, analysis, actions, sourceLink,
    stateFor, bind, update, sharePost, closeSheet } = ui;
  const host = document.getElementById('screens');
  const session = String(Date.now());
  const entries = new Map();
  const catalog = new Map(cards.filter(card => card.social).map(card => [card.social.key, card]));
  let active = null, nextId = 0;
  const motions = new Map();
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function play(node, frames, easing) {
    const motion = node.animate(frames, { duration: 260, easing });
    motions.set(node, motion);
    motion.finished.then(() => { if (motions.get(node) === motion) motions.delete(node); }).catch(() => {});
    return motion;
  }

  function transition(from, to, back = false) {
    const positions = new Map();
    for (const [node, animation] of motions) {
      positions.set(node, { transform: getComputedStyle(node).transform, opacity: getComputedStyle(node).opacity });
      animation.cancel();
      if (node !== from && node !== to) { node.hidden = true; node.inert = true; }
    }
    motions.clear();
    if (to) { to.hidden = false; to.inert = false; to.style.zIndex = back ? '20' : '21'; }
    if (from) { from.inert = true; from.style.zIndex = back ? '21' : '20'; }
    if (reduced()) { if (from) from.hidden = true; return; }
    if (to) play(to, [positions.get(to) || { transform: `translateX(${back ? '-18%' : '100%'})`, opacity: back ? .75 : 1 }, { transform: 'translateX(0)', opacity: 1 }], 'cubic-bezier(.2,.8,.2,1)');
    if (from) {
      const motion = play(from, [positions.get(from) || { transform: 'translateX(0)' }, { transform: `translateX(${back ? '100%' : '-18%'})` }], back ? 'cubic-bezier(.4,0,1,1)' : 'cubic-bezier(.2,.8,.2,1)');
      motion.finished.then(() => { if (active?.node !== from) from.hidden = true; }).catch(() => {});
    }
  }

  function setEntry(entry, back = false) {
    const from = active?.node;
    active = entry;
    if (ui.thesis) document.getElementById('mvpApp').classList.toggle('thesis-immersive', !!entry);
    host.querySelectorAll(':scope > .screen').forEach(node => { node.inert = !!entry; });
    transition(from, entry?.node, back);
    entry?.refresh?.();
    if (entry) entry.node.focus({ preventScroll: true });
    else entries.forEach(item => { if (item.focus?.isConnected && item.node === from) item.focus.focus({ preventScroll: true }); });
  }

  function push(node, refresh, destroy) {
    closeSheet(true);
    // A new branch replaces browser forward history; dispose the same abandoned pages.
    const ancestors = new Set();
    for (let parent = active; parent; parent = parent.parent) ancestors.add(parent);
    for (const [id, entry] of entries) {
      if (ancestors.has(entry)) continue;
      motions.get(entry.node)?.cancel(); motions.delete(entry.node);
      entry.destroy?.(); entry.node.remove(); entries.delete(id);
    }
    const entry = { id: ++nextId, parent: active, node, refresh, destroy, focus: document.activeElement };
    entries.set(entry.id, entry);
    host.append(node);
    history.pushState({ ...history.state, mvpSocial: { session, id: entry.id } }, '');
    setEntry(entry);
  }

  window.addEventListener('popstate', event => {
    const state = event.state?.mvpSocial;
    const target = state?.session === session ? entries.get(state.id) : null;
    if (target === active) return;
    closeSheet(true);
    setEntry(target || null, !target || (active && target.id < active.id));
  });

  function leave() {
    if (!active) return;
    setEntry(null, true);
    const state = { ...history.state }; delete state.mvpSocial;
    history.replaceState(state, '');
  }

  function pageShell(label) {
    const page = el('section', 'social-page');
    page.setAttribute('aria-label', label);
    page.tabIndex = -1;
    const top = el('header', 'social-page-top');
    const back = btn('social-page-back', 'Back');
    back.append(icon('onboarding-arrow-left-l1.svg'));
    back.addEventListener('click', () => history.back());
    const title = el('h1', null, label === 'Profile' ? '' : label);
    top.append(back, title);
    const scroll = el('div', 'social-page-scroll');
    page.append(top, scroll);
    return { page, top, scroll };
  }

  function tool(label, glyph, callback) {
    const b = btn('social-page-tool', label);
    b.append(icon(glyph)); b.addEventListener('click', callback);
    return b;
  }

  function tabs(names, onSelect, initial = names[0]) {
    const nav = el('nav', 'social-tabs');
    nav.setAttribute('role', 'tablist');
    names.forEach(name => {
      const b = btn('social-tab', name); b.textContent = name;
      b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(name === initial));
      b.tabIndex = name === initial ? 0 : -1;
      b.addEventListener('click', () => {
        if (b.getAttribute('aria-selected') === 'true') return;
        [...nav.children].forEach(tab => { tab.setAttribute('aria-selected', String(tab === b)); tab.tabIndex = tab === b ? 0 : -1; });
        onSelect(name);
      });
      b.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const list = [...nav.children], index = list.indexOf(b);
        const target = event.key === 'Home' ? 0 : event.key === 'End' ? list.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length;
        list[target].click(); list[target].focus();
      });
      nav.append(b);
    });
    return nav;
  }

  function cardNode(card) {
    if (!catalog.has(card.social.key)) catalog.set(card.social.key, card);
    const node = el('article', 'card social-card');
    node.dataset.cardId = card.id;
    node.append(content(card));
    return node;
  }

  function variant(base, changes, social) {
    const tickers = changes.tickers || base.tickers;
    return { ...base, ...changes, id: 'social-' + social.key, social: { ...base.social,
      generationMode: 'auto', paragraphs: undefined,
      charts: tickers.map(ticker => base.social.charts?.[base.tickers.findIndex(t => t.sym === ticker.sym)]).filter(Boolean), ...social } };
  }

  function relatedCards(card) {
    if (card.social.key !== 'P01') return cards.filter(other => other !== card && other.tickers.some(t => card.tickers.some(c => c.sym === t.sym))).slice(0, 2);
    const g = cards.find(c => c.social.key === 'P01');
    return [
      variant(g, { blocks: [], sources: [{ ...PROFILES.chamath, bot: true, handle: '@chamath', role: '@chamath', url: 'https://x.com/chamath' }], tickers: [g.tickers[0]].map(t => ({ ...t, stance: 'flat' })) }, {
        key: 'related-chamath', age: 'Updated Jul 24', actions: ['Dig Deeper'], counts: ['18', '218', '32'],
        statements: ['Google can monetize AI across chips, cloud, applications and advertising; a fragmented model landscape can still benefit an integrated platform with strong capital-allocation capabilities.'],
        analysis: 'His views evolved across the window. Historical ROIC cited in the interview has not been independently recalculated here.',
      }),
      variant(g, { blocks: [], sources: [{ ...g.sources[0], role: '@GavinSBaker', url: 'https://x.com/GavinSBaker' }], tickers: [g.tickers[2], g.tickers[1], g.tickers[0]].map(t => ({ ...t, stance: 'flat' })) }, {
        key: 'related-gavin', age: 'Jul 29', actions: ['Dig Deeper'], counts: ['18', '218', '32'],
        statements: ['1. Market is overreacting to hyperscale credit spreads widening.\n2. Spot pricing for renting GPU compute materially above contracted rates implies hyperscalers are under-earning on their installed fleet.\n3. Operating cash flow acceleration is an underestimated source of funds for AI.'],
        analysis: 'GPU rental rates and operating cash flow are the key checks on this returns thesis.',
      }),
    ];
  }

  function signals(card) {
    const list = el('div', 'social-signals');
    const records = card.social.key === 'P01' ? SIGNALS : card.sources.map(source => ({ ...source, text: source.summary || card.social.statements[0], analysis: card.social.analysis }));
    records.forEach(record => {
      const row = el('article', 'social-signal');
      const rail = el('div', 'social-signal-rail'); rail.append(img('assets/social-timeline.svg'));
      const body = el('div', 'social-signal-body');
      body.append(el('time', null, record.time || card.social.age));
      const statement = el('p', 'social-signal-copy');
      const person = btn('social-inline-person', record.name + ' profile');
      person.append(img(record.img), el('span', null, record.name));
      person.addEventListener('click', () => openProfile(record));
      statement.append(person, (record.text.startsWith(',') ? '' : ' ') + record.text);
      body.append(statement, analysis({ ...card, social: { ...card.social, analysis: record.analysis } }), sourceLink({ sources: [record] }));
      row.append(rail, body); list.append(row);
    });
    return list;
  }

  function openDetail(card, version) {
    if (ui.thesis) {
      const base = card.social.key.startsWith('P01-') ? cards.find(item => item.social.key === 'P01') : card;
      detail.open(base, version || (base !== card ? card.social.key : undefined));
      return;
    }
    const { page, top, scroll } = pageShell('Thesis');
    page.dataset.socialPage = 'detail'; page.dataset.post = card.social.key;
    const save = tool('Bookmark thesis', 'social-bookmark.svg', () => { stateFor(card).bookmarked = !stateFor(card).bookmarked; update(card); });
    bind(card, save, () => {
      save.setAttribute('aria-pressed', String(stateFor(card).bookmarked));
      save.replaceChildren(icon(stateFor(card).bookmarked ? 'ui-bookmark-f.svg' : 'social-bookmark.svg'));
    });
    top.append(save, tool('Share thesis', 'social-share.svg', () => sharePost(card)));
    const intro = el('div', 'social-thesis-detail');
    intro.append(content(card, { full: true }));
    const contentTabs = el('div', 'social-detail-tabs');
    const panel = el('div', 'social-detail-panel'); panel.setAttribute('role', 'tabpanel');
    const nav = tabs(['Signals', 'Related theses', 'Updates'], name => {
      const wasPinned = nav.getBoundingClientRect().top <= scroll.getBoundingClientRect().top + 1;
      renderPanel(name);
      if (wasPinned) {
        scroll.scrollTop = contentTabs.offsetTop + contentTabs.clientTop + parseFloat(getComputedStyle(contentTabs).paddingTop);
      }
    });
    function renderPanel(name) {
      panel.setAttribute('aria-label', name);
      if (name === 'Signals') panel.replaceChildren(signals(card));
      else {
        const items = name === 'Related theses' ? relatedCards(card)
          : card.social.key === 'P01' ? EARLIER_VERSIONS.map(v => catalog.get(v.key)) : [];
        panel.replaceChildren(...items.map(cardNode));
        if (!items.length) panel.append(el('p', 'social-empty', name === 'Updates' ? 'No earlier versions' : 'No related theses'));
      }
    }
    renderPanel('Signals'); contentTabs.append(nav, panel); scroll.append(intro, contentTabs);
    const footer = el('footer', 'social-detail-footer'); footer.append(...actions(card).children);
    page.append(footer); push(page);
  }

  const profiles = ui.thesis ? createThesisProfiles({ ...ui, pageShell, push }, ui.controls) : null;
  const detail = ui.thesis ? createThesisDetail({ ...ui, pageShell, push, relatedCards, cardNode }) : null;
  function openProfile(source) { profiles?.open(source); }
  function openOwner() { openProfile(PROFILES.owner); }

  function reset() {
    leave();
    entries.forEach(entry => { entry.destroy?.(); entry.node.remove(); });
    entries.clear();
  }
  const primary = cards.find(card => card.social.key === 'P01');
  if (primary) {
    for (const card of relatedCards(primary)) catalog.set(card.social.key, card);
    for (const v of EARLIER_VERSIONS) catalog.set(v.key, variant(primary, { blocks: [] }, { ...v, statements: [v.statement], hideSource: true }));
  }

  function openLinked(post, profileId, version) {
    if (profileId) {
      const identities = [];
      function collect(source) { identities.push(source); if (source.reference) collect(source.reference); }
      cards.forEach(card => card.sources.forEach(collect));
      const profile = Object.values(PROFILES).find(p => p.id === profileId)
        || [...identities, ...SIGNALS, ...(ui.controls?.PEOPLE || [])].find(source => source.name === profileId);
      if (profile) openProfile(profile);
    } else if (catalog.has(post)) openDetail(catalog.get(post), version);
  }
  return { openDetail, openProfile, openOwner, openLinked, leave, reset,
    mountOwner: () => profiles?.mountOwner(), refreshOwner: () => profiles?.refresh() };
}
