import { SOCIAL_POSTS } from './mvp-social-data.js?v=2';
import { createSocialPages } from './mvp-social-pages.js?v=9';
import { thesisCards } from './mvp-thesis-data.js?v=2';
import { createThesisCard } from './mvp-thesis-card.js?v=4';
import { createThesisControls } from './mvp-thesis-controls.js?v=2';
import { createThesisSearch } from './mvp-thesis-search.js?v=2';
import { THESIS_ASSETS as assets } from './mvp-thesis-assets.js';
import { bindScrollChrome } from './mvp-scroll-chrome.js?v=1';

const STORAGE_KEY = 'alva-social-feed-v1';

export function createCards(references) {
  return thesisCards(SOCIAL_POSTS.map(post => {
    const reference = references.find(card => card.sources[0].id === post.key);
    if (!reference) throw new Error('Missing social source: ' + post.key);
    return { ...reference, referenceNodeId: post.nodeId, automation: post.automation, age: post.age, social: post };
  }));
}

function readState() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { /* Storage can be disabled. */ }
  const keys = new Set([...SOCIAL_POSTS.map(post => post.key), ...Object.keys(saved && typeof saved === 'object' ? saved : {})]);
  return new Map([...keys].map(key => {
    const item = saved?.[key];
    return [key, {
      liked: item?.liked === true, bookmarked: typeof item?.bookmarked === 'boolean' ? item.bookmarked : ['S07', 'P07'].includes(key), tracked: item?.tracked === true,
      archived: item?.archived === true, private: item?.private === true,
      updates: Array.isArray(item?.updates) ? item.updates.filter(record => typeof record?.text === 'string' && typeof record?.date === 'string' && typeof record?.id === 'string').slice(0, 20) : [],
      replies: Array.isArray(item?.replies) ? item.replies.filter(text => typeof text === 'string' && text.trim()).slice(-100).map(text => text.slice(0, 2000)) : [],
    }];
  }));
}

export function createSocialFeed({ el, img, btn, icon, stockLogo, openSources, openTicker, openSheet, closeSheet, sheetClose, toast, cards, tickerDirectory, followed, onFollowChange, onCreate }) {
  let states = readState();
  const bindings = new Map();
  let viewportHost = window;
  try {
    if (window.frameElement && window.parent.location.origin === location.origin) viewportHost = window.parent;
  } catch { /* Cross-origin embeds use their own viewport. */ }

  // Safari's keyboard changes the visual viewport, not the fixed app layout.
  function fitKeyboard() {
    const viewport = viewportHost.visualViewport;
    const sheet = document.getElementById('sheet');
    const app = document.getElementById('mvpApp');
    let offset = 0;
    if (viewport && viewportHost.innerWidth <= 520 && sheet.querySelector('.social-input')) {
      const bounds = app.getBoundingClientRect();
      const frame = viewportHost !== window ? window.frameElement.getBoundingClientRect() : null;
      const frameScale = frame ? frame.width / innerWidth : 1;
      const scale = bounds.width / app.clientWidth * frameScale;
      const bottom = (frame?.top || 0) + bounds.bottom * frameScale;
      offset = Math.max(0, (bottom - viewport.height - viewport.offsetTop) / scale);
      offset = Math.min(offset, Math.max(0, app.clientHeight - 180));
    }
    sheet.style.setProperty('--social-keyboard-offset', offset + 'px');
  }
  viewportHost.visualViewport?.addEventListener('resize', fitKeyboard);
  viewportHost.visualViewport?.addEventListener('scroll', fitKeyboard);
  window.addEventListener('pagehide', () => {
    viewportHost.visualViewport?.removeEventListener('resize', fitKeyboard);
    viewportHost.visualViewport?.removeEventListener('scroll', fitKeyboard);
  }, { once: true });
  document.addEventListener('focusin', fitKeyboard);
  document.addEventListener('focusout', () => requestAnimationFrame(fitKeyboard));

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(states))); }
    catch { /* The current session remains usable without persistent storage. */ }
  }

  function stateKey(card) {
    return (card.social.owner ? 'owner:' : '') + card.social.key;
  }

  function stateFor(card) {
    const key = stateKey(card);
    if (!states.has(key)) states.set(key, { liked: false, bookmarked: false, tracked: false, archived: false, private: false, updates: [], replies: [] });
    return states.get(key);
  }

  function bind(card, node, paint) {
    const key = stateKey(card);
    if (!bindings.has(key)) bindings.set(key, new Set());
    bindings.get(key).add({ node, paint });
    paint();
  }

  function update(card) {
    save();
    for (const binding of bindings.get(stateKey(card)) || []) {
      if (binding.node.isConnected) binding.paint();
      else bindings.get(stateKey(card)).delete(binding);
    }
  }

  function logo() {
    const tile = el('span', 'social-logo');
    tile.append(img('assets/social-inline-logo.svg'));
    return tile;
  }

  function identity(source, time) {
    const head = el('div', 'social-identity');
    const avatar = btn('social-avatar', source.name + ' profile');
    avatar.append(portrait(source));
    avatar.addEventListener('click', () => pages.openProfile(source));
    const byline = el('div', 'social-byline');
    const row = el('div', 'social-publisher');
    const name = btn('social-name', source.name + ' profile');
    name.textContent = source.name;
    name.addEventListener('click', () => pages.openProfile(source));
    row.append(name);
    if (source.bot) row.append(icon('thesis/search-imgBotNotOnAlva.svg', 'thesis-bot'));
    if (time) row.append(el('span', 'social-time', time));
    byline.append(row);
    if (source.role || source.handle) byline.append(el('span', 'social-role', source.role || source.handle));
    head.append(avatar, byline);
    return head;
  }

  function portrait(source) {
    return img(source.img, source.name === 'Chamath Palihapitiya' ? 'social-portrait-crop' : '');
  }

  function analysis(card) {
    const section = el('div', 'social-analysis');
    const copy = el('p', 'social-reading');
    copy.append(logo(), el('strong', null, 'Alva'), ' ', card.social.analysis);
    section.append(copy);
    return section;
  }

  async function sharePost(card) {
    const url = new URL('mvp.html', location.href);
    url.searchParams.set('feed', 'social');
    url.searchParams.set('post', card.social.key);
    if (card.social.owner) url.searchParams.set('owner', '1');
    if (card.social.version) url.searchParams.set('version', card.social.version);
    await shareLink(card.sources[0].name + ' · Alva', url.href, 'Share post');
  }

  async function shareLink(title, url, label) {
    try {
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); toast('Link copied'); }
    } catch (error) {
      if (error.name === 'AbortError') return;
      const link = el('input', 'social-share-link');
      link.value = url;
      link.readOnly = true;
      link.setAttribute('aria-label', 'Share link');
      link.addEventListener('focus', () => link.select());
      openSheet([sheetClose(), el('h2', null, label)], [link], { label });
    }
  }

  function actions(card) {
    const row = el('div', 'social-ctas');
    const control = btn('social-cta', 'Ask Alva');
    control.append(icon('social-chat.svg'), el('span', null, 'Ask Alva'));
    control.addEventListener('click', () => openConversation(card, 'Ask Alva'));
    row.append(control);
    return row;
  }

  function content(card, options) { return thesis.content(card, options); }

  function sourceLink(card) {
    return thesis.sourceParagraph(card);
  }

  function composer(placeholder, submit) {
    const form = el('form', 'social-composer');
    const input = el('textarea', 'social-input');
    input.placeholder = placeholder;
    input.setAttribute('aria-label', placeholder);
    input.rows = 1;
    input.maxLength = 2000;
    const send = btn('social-send', 'Send');
    send.type = 'submit';
    send.append(icon('ui-arrow-up-l1.svg'));
    function resize() {
      input.style.height = 'auto';
      input.style.height = Math.min(120, input.scrollHeight) + 'px';
      send.disabled = !input.value.trim();
    }
    input.addEventListener('input', resize);
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); form.requestSubmit(); }
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value || send.disabled) return;
      input.value = '';
      resize();
      submit(value);
    });
    send.disabled = true;
    form.append(input, send);
    return { form, input, setBusy(busy) { input.disabled = busy; send.disabled = busy || !input.value.trim(); } };
  }

  function openConversation(card, question) {
    const thread = el('div', 'social-thread social-conversation');
    const responses = [card.social.analysis, ...card.social.statements];
    let turn = 0, timer, alive = true;
    const editor = composer('Ask Alva', send);
    function send(text) {
      thread.append(el('p', 'social-user-message', text));
      const answer = el('article', 'social-answer');
      const who = el('div', 'social-reply-who');
      who.append(logo(), el('strong', null, 'Alva'));
      const copy = el('p', 'social-thinking', 'Thinking');
      copy.setAttribute('role', 'status');
      answer.append(who, copy);
      thread.append(answer);
      editor.setBusy(true);
      thread.scrollTop = thread.scrollHeight;
      timer = setTimeout(() => {
        if (!alive) return;
        copy.className = '';
        copy.textContent = responses[turn++ % responses.length];
        const source = btn('social-citation', 'Sources');
        source.textContent = card.sources[0].name;
        source.addEventListener('click', () => openSources(card));
        answer.append(source);
        editor.setBusy(false);
        thread.scrollTop = thread.scrollHeight;
      }, 950);
    }
    openSheet([sheetClose(), el('h2', null, 'Alva')], [thread, editor.form], {
      full: true, bodyClass: 'social-sheet', label: 'Alva',
      teardown() { alive = false; clearTimeout(timer); },
    });
    send(question);
  }

  function openLinkedPost() {
    const params = new URLSearchParams(location.search);
    pages.openLinked(params.get('post'), params.get('profile'), params.get('version'), params.get('owner') === '1');
  }

  const controls = createThesisControls({ el, img, btn, icon, stockLogo, tickerDirectory, followed, onFollowChange });
  const thesis = createThesisCard({ el, img, btn, icon, identity, stockLogo, stateFor, bind, update, openTicker, openSources,
    openDetail: card => pages.openDetail(card), ask: openConversation });
  const pages = createSocialPages({ el, img, btn, icon, cards, tickerDirectory, followed, onFollowChange, thesis: true, controls,
    content, analysis, actions, sourceLink, identity, stockLogo, openSources, footer: thesis.footer,
    stateFor, bind, update, sharePost, shareLink, openTicker, closeSheet, openSheet, sheetClose, toast, preview: thesis.preview,
  });
  const search = createThesisSearch({ el, img, btn, icon, stockLogo, openTicker, openProfile: pages.openProfile }, controls);
  document.getElementById('screenMarket').append(search.root);
  const owner = pages.mountOwner();
  document.getElementById('screenMe').append(owner);
  bindScrollChrome(document.querySelector('#screenFeed .topbar'), document.getElementById('feed'), {
    attached: document.querySelector('#screenFeed .feed-filters'),
  });
  bindScrollChrome(search.root.querySelector('.thesis-root-title'), search.root.querySelector('.thesis-root-scroll'));
  bindScrollChrome(owner.querySelector('.thesis-me-top'), owner.querySelector('.thesis-root-scroll'));
  const create = btn('thesis-create', 'Create thesis');
  create.append(icon('thesis/create.svg'));
  create.addEventListener('click', onCreate);
  document.getElementById('screenFeed').append(create);
  const nav = document.querySelector('#tabBar [data-tab="market"]');
  nav.lastElementChild.textContent = 'Search'; nav.setAttribute('aria-label', 'Search');
  nav.querySelector('.ic-off').style.setProperty('--ic', `url(${assets.tabbar.imgSearchL1})`);
  nav.querySelector('.ic-on').style.setProperty('--ic', `url(${assets.search.imgSearchF1})`);
  const feedNav = document.querySelector('#tabBar [data-tab="feed"]');
  feedNav.querySelector('.ic-off').style.setProperty('--ic', `url(${assets.search.imgForYouL})`);
  feedNav.querySelector('.ic-on').style.setProperty('--ic', `url(${assets.tabbar.imgForYouF})`);

  return { content, openDetail: pages.openDetail, openLinkedPost, leavePages: pages.leave, openOwner: pages.openOwner,
    scroller(name) { return document.querySelector(name === 'me' ? '.thesis-me .thesis-root-scroll' : '.thesis-search .thesis-root-scroll'); },
    showTab(name) { if (name === 'me') pages.refreshOwner(); if (name === 'market') search.refresh(); thesis.preview.refresh(); }, reset() {
    states = readState();
    bindings.clear();
    thesis.preview.reset();
    pages.reset();
  } };
}
