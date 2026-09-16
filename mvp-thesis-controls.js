import { THESIS_ASSETS as assets } from './mvp-thesis-assets.js';
import { PEOPLE, SEARCH_TICKERS } from './mvp-thesis-data.js';

export function readStored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
export function writeStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Session state still works. */ }
}

export function createThesisControls(ui) {
  const { el, btn, img, icon, stockLogo, tickerDirectory, followed, onFollowChange } = ui;
  const defaults = ['Gavin Baker', 'Satya Nadella', 'Sam Altman', 'Chamath Palihapitiya', 'Maya Reynolds'];
  const saved = readStored('alva-thesis-following', defaults);
  const peopleFollowed = new Set(Array.isArray(saved) ? saved.filter(name => typeof name === 'string') : defaults);
  const listeners = new Set();
  const glyph = path => icon(path.replace(/^assets\//, ''));
  const tickerKey = record => window.AlvaFeedModel.symbol(record.sym);
  const isTickerFollowed = record => followed.has(tickerKey(record));
  function tabs(names, select, { selected = names[0], pills = false } = {}) {
    const nav = el('nav', pills ? 'thesis-pills' : 'thesis-tabs'); nav.setAttribute('role', 'tablist');
    for (const name of names) {
      const tab = btn('thesis-tab', name); tab.textContent = name; tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(name === selected)); tab.tabIndex = name === selected ? 0 : -1;
      tab.addEventListener('click', () => {
        [...nav.children].forEach(item => { item.setAttribute('aria-selected', String(item === tab)); item.tabIndex = item === tab ? 0 : -1; });
        select(name); tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
      tab.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const children = [...nav.children], i = children.indexOf(tab);
        const target = event.key === 'Home' ? 0 : event.key === 'End' ? children.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + children.length) % children.length;
        children[target].click(); children[target].focus({ preventScroll: true });
      });
      nav.append(tab);
    }
    return nav;
  }
  function empty(text) {
    const node = el('div', 'thesis-empty'); node.setAttribute('role', 'status');
    node.append(img('assets/thesis/empty.svg'), el('p', null, text)); return node;
  }
  function portrait(person) {
    const wrap = el('span', 'thesis-portrait' + (person.profileCrop ? ' is-profile-cropped' : person.crop ? ' is-cropped' : ''));
    const picture = img(person.img); picture.alt = ''; wrap.append(picture); return wrap;
  }
  function nameLabel(person) {
    const label = el('span', 'thesis-person-name'); label.append(el('strong', null, person.name));
    if (person.bot) label.append(glyph(assets.search.imgBotNotOnAlva)); return label;
  }
  function followButton(person) {
    const button = btn('thesis-follow', 'Follow ' + person.name); button.dataset.followPerson = person.name;
    const paint = () => {
      const active = peopleFollowed.has(person.name);
      button.textContent = active ? 'Following' : 'Follow'; button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', (active ? 'Unfollow ' : 'Follow ') + person.name);
    };
    button.addEventListener('click', () => {
      if (peopleFollowed.has(person.name)) peopleFollowed.delete(person.name); else peopleFollowed.add(person.name);
      writeStored('alva-thesis-following', [...peopleFollowed]);
      document.querySelectorAll('[data-follow-person]').forEach(item => {
        const active = peopleFollowed.has(item.dataset.followPerson);
        item.textContent = active ? 'Following' : 'Follow'; item.setAttribute('aria-pressed', String(active));
        item.setAttribute('aria-label', (active ? 'Unfollow ' : 'Follow ') + item.dataset.followPerson);
      });
      listeners.forEach(fn => fn());
    }); paint(); return button;
  }
  function personRow(person, open) {
    const row = el('div', 'thesis-person-row');
    const info = btn('thesis-person-link', person.name + ' profile');
    const copy = el('span', 'thesis-person-copy'); copy.append(nameLabel(person));
    if (person.role || person.handle) copy.append(el('small', null, person.role || person.handle));
    info.append(portrait(person), copy); info.addEventListener('click', () => open(person));
    row.append(info, followButton(person)); return row;
  }
  function tickerData(record) {
    const base = tickerDirectory.get(record.sym) || tickerDirectory.get(record.sym === 'GOOGL' ? 'GOOG' : record.sym);
    return { ...base, ...record, logo: record.img || base?.logo || (record.sym === 'HYPE' ? 'assets/mvp-broker-hyperliquid.svg' : 'assets/feed-logo-goog.svg') };
  }
  function tickerRow(record, open, withFollow = false) {
    const ticker = tickerData(record);
    const row = el('div', 'thesis-stock-row');
    const link = btn('thesis-stock-link', ticker.sym + ' details');
    const logo = ticker.img ? img(ticker.img) : stockLogo(ticker); logo.classList.add('thesis-stock-logo');
    const copy = el('span', 'thesis-stock-copy');
    const line = el('span', 'thesis-stock-title'); line.append(el('strong', null, ticker.sym), el('span', null, ticker.co));
    const market = el('span', 'thesis-stock-market');
    const broker = record.assetType === 'Binance Spot' ? 'mvp-broker-binance.svg' : record.assetType === 'Hyperliquid Spot' ? 'mvp-broker-hyperliquid.svg' : null;
    const venue = record.assetType === 'Non-US Stock' ? 'assets/thesis/search-imgMark1.png' : assets.search.imgMark;
    market.append(broker ? img('assets/' + broker) : img(venue), el('span', null, record.assetType));
    copy.append(line, market); link.append(logo, copy); link.addEventListener('click', () => open(ticker));
    const price = el('span', 'thesis-stock-price');
    price.append(el('strong', null, record.price), el('span', record.change.startsWith('-') ? 'is-down' : 'is-up', record.change));
    link.append(price); row.append(link);
    if (withFollow) {
      const follow = btn('thesis-follow', 'Follow ' + ticker.sym);
      const paint = () => { const active = isTickerFollowed(ticker); follow.textContent = active ? 'Following' : 'Follow'; follow.setAttribute('aria-pressed', String(active)); };
      paint(); follow.addEventListener('click', () => { const key = tickerKey(ticker); if (followed.has(key)) followed.delete(key); else followed.add(key); onFollowChange(); paint(); }); row.append(follow);
    }
    return row;
  }
  function confirm({ title, description, action, onConfirm }) {
    const dialog = el('dialog', 'thesis-confirm'); dialog.setAttribute('aria-label', title);
    const heading = el('div', 'thesis-confirm-title');
    const close = btn('social-page-tool', 'Close'); close.append(icon('close-l1.svg')); close.addEventListener('click', () => dialog.close());
    heading.append(el('h2', null, title), close);
    const buttons = el('div', 'thesis-confirm-actions');
    const cancel = btn('thesis-button', 'Cancel'); cancel.textContent = 'Cancel'; cancel.addEventListener('click', () => dialog.close());
    const submit = btn('thesis-button primary', action); submit.textContent = action;
    submit.addEventListener('click', () => { onConfirm(); dialog.close(); });
    buttons.append(cancel, submit); dialog.append(heading, el('p', null, description), buttons);
    document.getElementById('mvpApp').append(dialog);
    const focus = document.activeElement; dialog.addEventListener('close', () => { dialog.remove(); focus?.focus({ preventScroll: true }); });
    dialog.showModal(); cancel.focus();
  }
  return { tabs, empty, portrait, nameLabel, followButton, personRow, tickerRow, tickerData, isTickerFollowed, confirm, peopleFollowed, listeners, PEOPLE, SEARCH_TICKERS };
}
