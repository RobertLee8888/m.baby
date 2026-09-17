import { PROFILES } from './mvp-social-detail-data.js';
import { THESIS_ASSETS as assets } from './mvp-thesis-assets.js?v=2';
import { readStored, writeStored } from './mvp-thesis-controls.js?v=2';

export function createThesisProfiles(ui, controls) {
  const { el, img, btn, icon, cards, content, stateFor, pageShell, push, shareLink, openTicker, openSheet, closeSheet, sheetClose } = ui;
  const roots = new Set();
  const appearance = document.getElementById('appearanceRow');
  const glyph = path => icon(path.replace(/^assets\//, ''));
  function profileFor(source) {
    if (source.owner || source.id === 'owner') {
      const saved = readStored('alva-thesis-profile', {});
      return { ...PROFILES.owner, name: typeof saved.name === 'string' ? saved.name : PROFILES.owner.name,
        bio: typeof saved.bio === 'string' ? saved.bio : PROFILES.owner.bio, joined: 'Dec 23, 2025', followers: '1.2K', following: '128' };
    }
    if (source.name === 'Maya Reynolds') return { ...PROFILES.maya, joined: 'Mar 4, 2026', followers: '2.4K', following: '86' };
    if (source.name === 'Chamath Palihapitiya') return { ...PROFILES.chamath, profileCrop: true, bot: true, followers: '12.8K', channels: [['x', '@chamath', 'https://x.com/chamath']] };
    return { ...source, id: source.id || source.name, external: false };
  }
  function edit(profile, refresh) {
    const form = el('form', 'thesis-edit');
    const fields = [['Name', 'name', profile.name], ['Bio', 'bio', profile.bio || '']].map(([label, key, value]) => {
      const row = el('label'); row.append(el('span', null, label));
      const input = el(key === 'bio' ? 'textarea' : 'input'); input.name = key; input.value = value; input.maxLength = key === 'bio' ? 240 : 60;
      input.required = key === 'name'; row.append(input); form.append(row); return input;
    });
    const save = btn('thesis-button primary', 'Save'); save.textContent = 'Save'; save.type = 'submit'; form.append(save);
    form.addEventListener('submit', event => {
      event.preventDefault(); if (!fields[0].value.trim()) return;
      profile.name = fields[0].value.trim(); profile.bio = fields[1].value.trim();
      writeStored('alva-thesis-profile', { name: profile.name, bio: profile.bio }); closeSheet(); refresh();
    });
    openSheet([sheetClose(), el('h2', null, 'Edit profile')], [form], { label: 'Edit profile' });
  }
  function settings() {
    const shell = pageShell('Settings');
    const row = btn('row', 'Appearance'); row.append(icon('ui-mode-night-l.svg'), el('span', 'row-label', 'Appearance'), icon('ui-arrow-right-l2.svg'));
    row.addEventListener('click', () => appearance.click()); shell.scroll.append(row); push(shell.page);
  }
  function relations(profile, initial) {
    const { page, scroll } = pageShell(profile.name); page.dataset.socialPage = 'relations';
    let selected = initial;
    const list = el('div', 'thesis-relations-list');
    const candidates = [...controls.PEOPLE, PROFILES.maya];
    function render() {
      const records = selected === 'Followers' ? candidates.filter(p => !p.bot && ['Gavin Baker', 'Satya Nadella', 'Sam Altman', 'Maya Reynolds'].includes(p.name))
        : candidates.filter(p => controls.peopleFollowed.has(p.name));
      list.replaceChildren(...records.map(person => controls.personRow(person, open)));
      if (!records.length) list.append(controls.empty('No ' + selected.toLowerCase() + ' yet'));
    }
    const names = profile.bot ? ['Followers'] : ['Followers', 'Following'];
    const nav = controls.tabs(names, name => { selected = name; render(); }, { selected: initial });
    nav.classList.add('thesis-relations-tabs');
    [...nav.children].forEach((tab, index) => { tab.textContent = names[index] + ' ' + (names[index] === 'Followers' ? profile.followers : profile.following); });
    scroll.append(nav, list); render(); push(page, render);
  }
  function privateCards() {
    const section = el('div', 'thesis-private');
    const account = el('div', 'thesis-account');
    const left = el('div', 'thesis-account-summary'); const title = el('span', 'thesis-account-label');
    const brokers = el('span', 'thesis-account-brokers');
    const binance = el('span', 'thesis-account-broker is-binance');
    binance.append(img(assets.profile.imgBinanceMark));
    brokers.append(img(assets.profile.imgNameAlpaca), binance);
    title.append('Account assets', brokers);
    left.append(title, el('strong', null, '$104,030.41'));
    const allocation = el('div', 'thesis-allocation');
    const allocationBar = el('span', 'thesis-allocation-bar');
    allocationBar.setAttribute('role', 'img');
    allocationBar.setAttribute('aria-label', 'BTC 45%, ETH 25%, two other assets 30%');
    allocationBar.append(el('i'), el('i'), el('i'));
    allocation.append(el('span', null, 'Allocation'), allocationBar, el('span', 'thesis-allocation-legend', 'BTC 45% · ETH 25% · +2'));
    account.append(left, allocation);
    const usage = el('div', 'thesis-usage'); const head = el('div', 'thesis-usage-head'); head.append(el('span', null, 'Usage'), el('strong', null, '12,000'));
    const amounts = el('div', 'thesis-usage-amounts');
    [['Daily', '1,000'], ['Monthly', '3,000'], ['Pack', '12,000']].forEach(([label, value]) => { const pair = el('span'); pair.append(label + ' ', el('b', null, value)); amounts.append(pair); });
    usage.append(head, amounts); section.append(account, usage); return section;
  }
  function create(source, rootTab = false) {
    let profile = profileFor(source);
    const shell = rootTab ? { page: el('div', 'thesis-root thesis-me'), top: el('header', 'thesis-me-top'), scroll: el('div', 'thesis-root-scroll') } : pageShell('Profile');
    const { page, top, scroll } = shell;
    page.dataset.socialPage = 'profile'; page.dataset.profile = profile.id;
    if (rootTab) { top.append(el('h1', null, 'Me')); page.append(top, scroll); }
    function tool(label, asset, run) {
      const b = btn('social-page-tool', label); b.append(glyph(asset)); b.addEventListener('click', run); return b;
    }
    if (profile.owner) top.append(tool('Edit profile', assets.profile.imgEditL1, () => edit(profile, refreshHeader)));
    else top.append(controls.followButton(profile));
    top.append(tool('Share profile', assets.profile.imgShareL, () => {
      const url = new URL('mvp.html', location.href); url.searchParams.set('feed', 'social'); url.searchParams.set('profile', profile.id);
      shareLink(profile.name + ' · Alva', url.href, 'Share profile');
    }));
    if (profile.owner) top.append(tool('Settings', assets.profile.imgSettingsL, settings));
    const header = el('div', 'thesis-profile-header');
    const collapsed = !rootTab ? el('span', 'thesis-profile-collapsed') : null;
    if (collapsed) { collapsed.setAttribute('aria-hidden', 'true'); top.querySelector('h1').append(collapsed); }
    function refreshHeader() {
      header.replaceChildren();
      const identity = el('div', 'thesis-profile-identity'); const portrait = controls.portrait(profile);
      if (collapsed) collapsed.replaceChildren(controls.portrait(profile), controls.nameLabel(profile));
      const info = el('div', 'thesis-profile-info'); const name = controls.nameLabel(profile);
      if (profile.pro) name.append(el('span', 'social-pro', 'Pro')); info.append(name);
      if (profile.joined) {
        const meta = el('div', 'thesis-profile-meta'); meta.append(el('span', null, profile.handle), el('span', null, 'Joined ' + profile.joined)); info.append(meta);
      } else if (profile.role) info.append(el('p', 'thesis-profile-role', profile.role));
      identity.append(portrait, info); header.append(identity);
      if (profile.followers) {
        const row = el('div', 'thesis-profile-relations');
        for (const [label, count] of [['Followers', profile.followers], ['Following', profile.bot ? null : profile.following]]) {
          if (!count) continue; const link = btn('', label); link.append(el('strong', null, count), ' ', el('span', null, label));
          link.addEventListener('click', () => relations(profile, label)); row.append(link);
        }
        header.append(row);
      }
      if (profile.bio) {
        const bio = el('div', 'thesis-profile-bio'); const copy = el('p', null, profile.bio); bio.append(copy);
        if (profile.bot) {
          bio.classList.add('can-expand'); const more = btn('social-show-more', 'Show more'); more.textContent = 'Show more';
          more.addEventListener('click', () => {
            const full = el('div', 'thesis-profile-about'); full.append(el('p', null, profile.bio));
            openSheet([sheetClose(), el('h2', null, profile.name)], [full], { label: profile.name + ' bio' });
          }); copy.append(' ', more);
        }
        header.append(bio);
      }
      if (profile.channels) {
        const channels = el('div', 'social-profile-channels');
        profile.channels.forEach(([platform, label, url]) => {
          const link = el('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
          link.append(img('assets/social-channel-' + platform + '.svg'), el('span', null, label)); channels.append(link);
        }); header.append(channels);
      }
      if (profile.bot) { const note = el('div', 'thesis-profile-note'); note.append(glyph(assets.search.imgBotNotOnAlva), el('p', null, 'Compiled from public information. Not affiliated with Alva.')); header.append(note); }
    }
    refreshHeader(); scroll.append(header);
    if (profile.owner) scroll.append(privateCards());
    const pinned = el('div', 'thesis-profile-pinned'); const list = el('div', 'thesis-profile-list'); list.setAttribute('role', 'tabpanel');
    let selected = 'Theses', status = 'Active';
    const statusTabs = controls.tabs(['Active', 'Archived'], value => { status = value; renderList(); }, { pills: !!profile.owner });
    function renderList() {
      list.setAttribute('aria-label', selected); statusTabs.hidden = selected !== 'Theses';
      if (selected === 'Tickers') {
        const records = controls.SEARCH_TICKERS.filter(controls.isTickerFollowed);
        list.replaceChildren(...records.map(record => controls.tickerRow(record, openTicker, true)));
        if (!records.length) list.append(controls.empty('No tickers yet')); return;
      }
      if (['Playbooks', 'Automations'].includes(selected)) { list.replaceChildren(controls.empty('No ' + selected.toLowerCase() + ' yet')); return; }
      let items;
      if (selected === 'Bookmarks') items = cards.filter(card => stateFor(card).bookmarked);
      else if (profile.postKeys) items = profile.postKeys.map(key => cards.find(c => c.social.key === key)).filter(Boolean).map(card => ({ ...card,
        sources: [{ ...card.sources[0], ...profile, role: card.sources[0].role && (profile.owner || profile.pro) ? profile.handle : '', handle: '', reference: undefined }],
        social: { ...card.social, owner: !!profile.owner, generationMode: 'auto' } }));
      else items = cards.filter(card => card.sources[0].name === profile.name);
      if (selected === 'Theses') items = items.filter(card => (stateFor(card).archived ? 'Archived' : 'Active') === status);
      list.replaceChildren(...items.map(card => {
        const row = el('article', 'card social-card'); row.dataset.cardId = card.id;
        const display = { ...card, social: { ...card.social,
          ...(selected === 'Bookmarks' && card.social.key === 'P01' ? { generationMode: 'auto' } : {}),
          ...(stateFor(card).archived ? { thesisType: 'Archived' } : {}),
        } };
        row.append(content(display, { compact: selected === 'Bookmarks' })); return row;
      }));
      if (!items.length) list.append(controls.empty(selected === 'Bookmarks' ? 'No bookmarks yet' : status === 'Archived' ? 'No archived theses' : 'No theses yet'));
    }
    if (profile.owner) pinned.append(controls.tabs(['Theses', 'Bookmarks', 'Tickers', 'Playbooks', 'Automations'], value => { selected = value; renderList(); }));
    pinned.append(statusTabs); scroll.append(pinned, list); renderList();
    if (collapsed) scroll.addEventListener('scroll', () => {
      const visible = scroll.scrollTop >= header.offsetHeight;
      collapsed.classList.toggle('is-visible', visible); collapsed.setAttribute('aria-hidden', String(!visible));
    }, { passive: true });
    const refresh = () => { if (profile.owner) { profile = profileFor(source); refreshHeader(); } renderList(); ui.preview?.refresh(); };
    if (rootTab) roots.add(refresh); else push(page, refresh);
    return page;
  }
  function open(source) { return create(source); }
  return { open, mountOwner() { return create(PROFILES.owner, true); }, refresh() { roots.forEach(fn => fn()); } };
}
