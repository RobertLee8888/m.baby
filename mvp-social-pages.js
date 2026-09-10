import { ARTICLE, SIGNALS, EARLIER_VERSIONS, PROFILES } from './mvp-social-detail-data.js';

// Pages retain their DOM while stacked, preserving scroll, filters and expanded text.
export function createSocialPages(ui) {
  const { el, img, btn, icon, cards, tickerDirectory, followed, onFollowChange,
    identity, portrait, content, analysis, actions, engagement, sourceLink, kolViews, block,
    stockLogo, stateFor, bind, update, sharePost, shareLink, openTicker, closeSheet, openSheet, sheetClose } = ui;
  const host = document.getElementById('screens');
  const session = String(Date.now());
  const entries = new Map();
  const catalog = new Map(cards.map(card => [card.social.key, card]));
  let active = null, nextId = 0;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function transition(from, to, back = false) {
    if (to) { to.hidden = false; to.inert = false; to.style.zIndex = back ? '20' : '21'; }
    if (from) { from.inert = true; from.style.zIndex = back ? '21' : '20'; }
    if (reduced()) { if (from) from.hidden = true; return; }
    if (to) to.animate([{ transform: `translateX(${back ? '-18%' : '100%'})`, opacity: back ? .75 : 1 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' });
    if (from) {
      const motion = from.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${back ? '100%' : '-18%'})` }], { duration: 260, easing: back ? 'cubic-bezier(.4,0,1,1)' : 'cubic-bezier(.2,.8,.2,1)' });
      motion.finished.then(() => { if (active?.node !== from) from.hidden = true; }).catch(() => {});
    }
  }

  function setEntry(entry, back = false) {
    const from = active?.node;
    active = entry;
    host.querySelectorAll(':scope > .screen').forEach(node => { node.inert = !!entry; });
    transition(from, entry?.node, back);
    entry?.refresh?.();
    if (entry) entry.node.focus({ preventScroll: true });
    else entries.forEach(item => { if (item.focus?.isConnected && item.node === from) item.focus.focus({ preventScroll: true }); });
  }

  function push(node, refresh) {
    closeSheet(true);
    const entry = { id: ++nextId, parent: active, node, refresh, focus: document.activeElement };
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
    return { ...base, ...changes, id: 'social-' + social.key, social: { ...base.social, ...social } };
  }

  function relatedCards(card) {
    if (card.social.key !== 'P01') return cards.filter(other => other !== card && other.tickers.some(t => card.tickers.some(c => c.sym === t.sym))).slice(0, 2);
    const g = cards.find(c => c.social.key === 'P01');
    return [
      variant(g, { blocks: [], sources: [{ ...PROFILES.chamath, handle: '@chamath', role: '@chamath', url: 'https://x.com/chamath' }], tickers: [g.tickers[0]].map(t => ({ ...t, stance: 'flat' })) }, {
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

  function largeTickers(card) {
    const row = el('div', 'social-large-tickers');
    card.tickers.forEach(ticker => {
      const button = btn('social-large-ticker', ticker.sym + ' details');
      const text = el('span', 'social-large-ticker-copy');
      text.append(el('strong', null, ticker.sym));
      const stance = el('span', 'social-large-stance ' + ticker.stance);
      const dial = el('span', 'stance-dial'); dial.append(icon('social-stance-arrow.svg'));
      stance.append(dial, el('span', null, { bull: 'Tailwind', bear: 'Headwind', flat: 'Context' }[ticker.stance]));
      text.append(stance); button.append(stockLogo(ticker), text);
      button.addEventListener('click', () => openTicker(ticker)); row.append(button);
    });
    return row;
  }

  function openDetail(card) {
    const { page, top, scroll } = pageShell('Thesis');
    page.dataset.socialPage = 'detail'; page.dataset.post = card.social.key;
    const save = tool('Bookmark thesis', 'social-bookmark.svg', () => { stateFor(card).bookmarked = !stateFor(card).bookmarked; update(card); });
    bind(card, save, () => {
      save.setAttribute('aria-pressed', String(stateFor(card).bookmarked));
      save.replaceChildren(icon(stateFor(card).bookmarked ? 'ui-bookmark-f.svg' : 'social-bookmark.svg'));
    });
    top.append(save, tool('Share thesis', 'social-share.svg', () => sharePost(card)));
    const intro = el('div', 'social-detail-intro');
    intro.append(identity(card.sources[0], card.social.age), el('h2', 'social-detail-title', card.social.headline || card.social.statements[0]));
    if (card.social.event) intro.append(el('p', 'social-detail-facts', card.social.statements[0]));
    if (card.social.key === 'P01') {
      const article = el('div', 'social-article');
      let expanded = false;
      function paintArticle() {
        article.replaceChildren();
        if (expanded) ARTICLE.paragraphs.forEach(text => article.append(el('p', null, text)));
        const last = expanded ? article.lastElementChild : el('p', null, ARTICLE.summary + '… ');
        const more = btn('social-show-more', expanded ? 'Show less' : 'Show more');
        more.textContent = expanded ? 'Show less' : 'Show more'; more.setAttribute('aria-expanded', String(expanded));
        more.addEventListener('click', () => {
          const before = article.offsetHeight;
          expanded = !expanded; paintArticle();
          if (!reduced()) article.animate([{ height: before + 'px' }, { height: article.offsetHeight + 'px' }], { duration: 220, easing: 'ease-out' });
        });
        last.append(' ', more); if (!expanded) article.append(last);
      }
      paintArticle(); intro.append(article);
    }
    card.blocks.filter(b => b.type === 'media').forEach(b => intro.append(block(b, card)));
    if (card.sources[0].media || card.sources[0].reference) {
      const extra = content(card).querySelector('.quote');
      if (extra) {
        extra.querySelector(':scope > .social-identity')?.remove();
        extra.querySelector(':scope > .quote-body')?.remove();
        intro.append(extra);
      }
    }
    intro.append(sourceLink(card));
    if (['P01', 'P04'].includes(card.social.key)) intro.append(kolViews(card));
    const assessment = el('div', 'social-detail-analysis');
    assessment.append(analysis(card), largeTickers(card)); intro.append(assessment, engagement(card));
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

  function profileFor(source) {
    if (source.owner || source.id === 'owner') return PROFILES.owner;
    if (source.name === 'Maya Reynolds') return PROFILES.maya;
    if (source.name === 'Chamath Palihapitiya') return PROFILES.chamath;
    return { ...source, id: source.name, external: true };
  }

  function profileCards(profile) {
    if (!profile.postKeys) return cards.filter(card => card.sources[0].name === profile.name);
    return profile.postKeys.map(key => {
      const card = cards.find(c => c.social.key === key);
      const source = { ...card.sources[0], ...profile, role: profile.owner || profile.pro ? profile.handle : '', reference: undefined };
      if (profile.id === 'chamath' && source.media) source.media = { ...source.media, poster: 'assets/social-chamath-video.png' };
      return { ...card, sources: [source], social: { ...card.social, age: '1h ago', hideSource: true } };
    });
  }

  function tickerFilters(select) {
    const row = el('div', 'social-profile-filters');
    row.setAttribute('role', 'tablist'); row.setAttribute('aria-label', 'Filter theses');
    ['All', 'GOOG', 'NVDA', 'META', 'BABA', 'AAOI', 'MSFT'].forEach(sym => {
      const b = btn('social-filter', sym); b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(sym === 'All'));
      if (sym !== 'All') {
        const ticker = tickerDirectory.get(sym) || tickerDirectory.get(sym === 'GOOG' ? 'GOOGL' : sym);
        if (ticker) b.append(stockLogo(ticker));
      }
      b.append(el('span', null, sym));
      b.addEventListener('click', () => { [...row.children].forEach(n => n.setAttribute('aria-selected', String(n === b))); select(sym); });
      row.append(b);
    });
    return row;
  }

  function openProfile(source) {
    const profile = profileFor(source);
    const { page, top, scroll } = pageShell('Profile');
    page.dataset.socialPage = 'profile'; page.dataset.profile = profile.id;
    const share = tool('Share profile', 'social-share.svg', () => {
      const url = new URL('mvp.html', location.href);
      url.searchParams.set('feed', 'social'); url.searchParams.set('profile', profile.id);
      shareLink(profile.name + ' · Alva', url.href, 'Share profile');
    });
    top.append(share);
    const header = el('div', 'social-profile-header');
    const who = el('div', 'social-profile-identity');
    const avatar = el('span', 'social-profile-avatar'); avatar.append(portrait(profile)); who.append(avatar);
    const info = el('div', 'social-profile-info');
    const name = el('div', 'social-profile-name'); name.append(el('h2', null, profile.name));
    if (profile.pro) name.append(el('span', 'social-pro', 'Pro'));
    info.append(name);
    if (profile.role) info.append(el('p', 'social-profile-role', profile.role));
    if (profile.handle) info.append(el('p', 'social-profile-handle', profile.handle));
    who.append(info); header.append(who);
    if (profile.bio) {
      const bio = el('p', 'social-profile-bio', profile.bio);
      if (profile.external) {
        const more = btn('social-show-more', 'Show more'); more.textContent = 'Show more';
        more.addEventListener('click', () => openSheet([sheetClose(), el('h2', null, profile.name)], [el('p', 'social-bio-full', profile.bio)], { label: profile.name }));
        bio.append(' ', more);
      }
      header.append(bio);
    }
    if (profile.channels) {
      const channels = el('div', 'social-profile-channels');
      profile.channels.forEach(([platform, label, url]) => {
        const a = el('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.append(img('assets/social-channel-' + platform + '.svg'), el('span', null, label)); channels.append(a);
      });
      header.append(channels);
    }
    if (profile.external) {
      const note = el('p', 'social-profile-disclaimer');
      note.append(icon('ui-explain-l.svg'), 'Compiled from public information. Not affiliated with Alva.'); header.append(note);
    }
    const pinned = el('div', 'social-profile-pinned');
    const list = el('div', 'social-profile-list'); list.setAttribute('role', 'tabpanel');
    let selected = 'Thesis', filter = 'All';
    const filters = tickerFilters(sym => { filter = sym; renderList(); });
    function renderList() {
      list.setAttribute('aria-label', selected);
      filters.hidden = selected === 'Followed';
      if (selected === 'Followed') {
        list.replaceChildren();
        const all = [...new Set(['GOOG', 'NVDA', 'META', 'BABA', 'AAOI', 'MSFT', 'TSLA', ...followed])];
        all.filter(sym => followed.has(sym)).forEach(sym => {
          const ticker = tickerDirectory.get(sym); if (!ticker) return;
          const row = el('div', 'social-follow-row');
          const stock = btn('social-follow-stock', sym + ' details');
          const text = el('span'); text.append(el('strong', null, sym), el('small', null, ticker.co));
          stock.append(stockLogo(ticker), text); stock.addEventListener('click', () => openTicker(ticker));
          const toggle = btn('social-cta', 'Unfollow ' + sym); toggle.textContent = 'Unfollow';
          toggle.addEventListener('click', () => { followed.delete(sym); onFollowChange(); renderList(); });
          row.append(stock, toggle); list.append(row);
        });
        return;
      }
      const items = selected === 'Bookmark' ? [...catalog.values()]
        .sort((a,b) => Number(b.social.key === 'S07') - Number(a.social.key === 'S07'))
        .filter(c => stateFor(c).bookmarked)
        .map(c => ({ ...c, social: { ...c.social, age: '1h ago', hideSource: true } })) : profileCards(profile);
      const filtered = items.filter(card => filter === 'All' || card.tickers.some(t => (t.sym === 'GOOGL' ? 'GOOG' : t.sym) === filter));
      list.replaceChildren(...filtered.map(cardNode));
      if (!filtered.length) list.append(el('p', 'social-empty', selected === 'Bookmark' ? 'No bookmarked theses' : 'No theses'));
    }
    if (profile.owner) pinned.append(tabs(['Thesis', 'Followed', 'Bookmark'], value => { selected = value; renderList(); }));
    pinned.append(filters); scroll.append(header, pinned, list); renderList();
    push(page, renderList);
  }

  function openOwner() { openProfile(PROFILES.owner); }
  function reset() {
    leave();
    entries.forEach(entry => entry.node.remove());
    entries.clear();
  }
  const primary = cards.find(card => card.social.key === 'P01');
  for (const card of relatedCards(primary)) catalog.set(card.social.key, card);
  for (const v of EARLIER_VERSIONS) catalog.set(v.key, variant(primary, { blocks: [] }, { ...v, statements: [v.statement], hideSource: true }));

  function openLinked(post, profileId) {
    if (profileId) {
      const identities = [];
      function collect(source) { identities.push(source); if (source.reference) collect(source.reference); }
      cards.forEach(card => card.sources.forEach(collect));
      const profile = Object.values(PROFILES).find(p => p.id === profileId)
        || [...identities, ...SIGNALS].find(source => source.name === profileId);
      if (profile) openProfile(profile);
    } else if (catalog.has(post)) openDetail(catalog.get(post));
  }
  return { openDetail, openProfile, openOwner, openLinked, leave, reset };
}
