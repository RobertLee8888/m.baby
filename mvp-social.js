import { SOCIAL_POSTS } from './mvp-social-data.js?v=2';
import { createSocialPages } from './mvp-social-pages.js?v=1';

const STORAGE_KEY = 'alva-social-feed-v1';
const PREFIXES = ['Replied to Sam Altman: ', 'Quoted Satya Nadella: '];

export function createCards(references) {
  return SOCIAL_POSTS.map(post => {
    const reference = references.find(card => card.sources[0].id === post.key);
    if (!reference) throw new Error('Missing social source: ' + post.key);
    return { ...reference, referenceNodeId: post.nodeId, automation: post.automation, age: post.age, social: post };
  });
}

function readState() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { /* Storage can be disabled. */ }
  const keys = new Set([...SOCIAL_POSTS.map(post => post.key), ...Object.keys(saved && typeof saved === 'object' ? saved : {})]);
  return new Map([...keys].map(key => {
    const item = saved?.[key];
    return [key, {
      liked: item?.liked === true, bookmarked: typeof item?.bookmarked === 'boolean' ? item.bookmarked : ['S07', 'P07'].includes(key), tracked: item?.tracked === true,
      replies: Array.isArray(item?.replies) ? item.replies.filter(text => typeof text === 'string' && text.trim()).slice(-100).map(text => text.slice(0, 2000)) : [],
    }];
  }));
}

export function createSocialFeed({ el, img, btn, icon, block, stockLogo, openSources, openTicker, openSheet, closeSheet, sheetClose, toast, cards, tickerDirectory, followed, onFollowChange }) {
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

  function stateFor(card) {
    const key = card.social.key;
    if (!states.has(key)) states.set(key, { liked: false, bookmarked: false, tracked: false, replies: [] });
    return states.get(key);
  }

  function bind(card, node, paint) {
    const key = card.social.key;
    if (!bindings.has(key)) bindings.set(key, new Set());
    bindings.get(key).add({ node, paint });
    paint();
  }

  function update(card) {
    save();
    for (const binding of bindings.get(card.social.key) || []) {
      if (binding.node.isConnected) binding.paint();
      else bindings.get(card.social.key).delete(binding);
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
    if (time) row.append(el('span', 'social-time', time));
    byline.append(row);
    if (source.role || source.handle) byline.append(el('span', 'social-role', source.role || source.handle));
    head.append(avatar, byline);
    return head;
  }

  function portrait(source) {
    return img(source.img, source.name === 'Chamath Palihapitiya' ? 'social-portrait-crop' : '');
  }

  function quote(card) {
    const post = card.social;
    if (post.event) {
      const wrap = el('div', 'social-event');
      const tag = el('span', 'social-event-tag');
      tag.append(icon(post.key === 'S04' ? 'social-earnings.svg' : 'social-report.svg'), el('span', null, post.event));
      const row = el('div', 'social-publisher');
      row.append(tag, el('span', 'social-time', post.age));
      const headline = btn('social-event-headline');
      headline.textContent = post.headline;
      headline.addEventListener('click', () => pages.openDetail(card));
      // Both the headline and event facts lead to the same thesis.
      const facts = btn('quote-body');
      facts.textContent = post.statements[0];
      facts.addEventListener('click', () => pages.openDetail(card));
      wrap.append(row, headline, facts);
      return wrap;
    }
    function displaySource(source, depth = 0) {
      const wrap = el('div', depth ? 'quote-nested' : 'quote');
      const hasSubtitle = depth || !post.key.startsWith('S');
      wrap.append(identity({ ...source, role: hasSubtitle ? source.role : '', handle: hasSubtitle ? source.handle : '', img: source.name === 'Reuters' ? 'assets/social-reuters.png' : source.img }, depth ? null : post.age));
      const body = btn('quote-body', 'Open thesis');
      const text = post.statements[depth] || source.summary || source.quote || '';
      const prefix = PREFIXES.find(value => text.startsWith(value));
      if (prefix) body.append(el('span', 'social-quote-prefix', prefix), text.slice(prefix.length));
      else body.textContent = text;
      body.addEventListener('click', () => pages.openDetail(card));
      if (text) wrap.append(body);
      if (source.media) {
        const media = el('a', 'source-media source-media-compact');
        media.href = source.media.url; media.target = '_blank'; media.rel = 'noopener noreferrer';
        media.setAttribute('aria-label', 'Play source video');
        media.append(img(source.media.poster));
        const play = el('span', 'source-play'); play.append(icon('social-play.svg')); media.append(play);
        wrap.append(media);
      }
      if (source.reference) wrap.append(displaySource(source.reference, depth + 1));
      return wrap;
    }
    return displaySource(card.sources[0]);
  }

  function tickerTag(ticker) {
    const tag = btn('social-ticker', ticker.sym + ' details');
    tag.append(stockLogo(ticker, 'social-stock-logo'), el('span', null, ticker.sym));
    const stance = el('span', 'stance ' + ticker.stance);
    stance.setAttribute('aria-label', { bull: 'Tailwind', bear: 'Headwind', flat: 'Context' }[ticker.stance]);
    const dial = el('span', 'stance-dial');
    dial.append(icon('social-stance-arrow.svg'));
    stance.append(dial);
    tag.append(stance);
    tag.addEventListener('click', () => openTicker(ticker));
    return tag;
  }

  function analysis(card) {
    const section = el('div', 'social-analysis');
    const copy = el('p', 'social-reading');
    copy.append(logo(), el('strong', null, 'Alva'), ' ', card.social.analysis);
    section.append(copy);
    return section;
  }

  function formatCount(label, extra) {
    if (!extra) return label;
    const base = Number.parseFloat(label) * (label.endsWith('K') ? 1000 : 1);
    if (label.endsWith('K')) return ((base + extra) / 1000).toFixed(1) + 'K';
    return (base + extra).toLocaleString('en-US');
  }

  function engagement(card) {
    const post = card.social, state = stateFor(card);
    const row = el('div', 'social-engagement');
    const reply = btn('social-action', 'Reply');
    const replies = el('span');
    bind(card, replies, () => { replies.textContent = formatCount(post.counts[0], state.replies.length); });
    reply.append(icon('social-comment.svg'), replies);
    reply.addEventListener('click', () => openReplies(card));
    row.append(reply);
    for (const [index, key, label, glyph] of [[1, 'liked', 'Like', 'social-heart.svg'], [2, 'bookmarked', 'Bookmark', 'social-bookmark.svg']]) {
      const control = btn('social-action social-' + key, label);
      function paint() {
        control.setAttribute('aria-pressed', String(state[key]));
        const baseSaved = key === 'bookmarked' && ['S07', 'P07'].includes(post.key);
        control.replaceChildren(icon(state[key] ? key === 'liked' ? 'ui-heart-f.svg' : 'ui-bookmark-f.svg' : glyph), el('span', null, formatCount(post.counts[index], Number(state[key]) - Number(baseSaved))));
      }
      bind(card, control, paint);
      control.addEventListener('click', () => { state[key] = !state[key]; update(card); });
      row.append(control);
    }
    const share = btn('social-action', 'Share post');
    share.append(icon('social-share.svg'));
    share.addEventListener('click', () => sharePost(card));
    row.append(share);
    return row;
  }

  async function sharePost(card) {
    const url = new URL('mvp.html', location.href);
    url.searchParams.set('feed', 'social');
    url.searchParams.set('post', card.social.key);
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
    card.social.actions.forEach(label => {
      const track = label === 'Track This';
      const control = btn('social-cta' + (track ? ' social-track' : ''), label);
      const state = stateFor(card);
      function paint() {
        control.replaceChildren(icon(track ? 'social-notification.svg' : 'social-chat.svg'), el('span', null, track && state.tracked ? 'Tracking' : label));
        if (track) control.setAttribute('aria-pressed', String(state.tracked));
      }
      bind(card, control, paint);
      control.addEventListener('click', () => {
        if (track) { state.tracked = !state.tracked; update(card); }
        else openConversation(card, label);
      });
      row.append(control);
    });
    return row;
  }

  function content(card) {
    const body = el('div', 'social-content');
    body.append(quote(card));
    card.blocks.filter(item => item.type === 'media').forEach(item => body.append(block(item, card)));
    if (!card.social.hideSource) body.append(sourceLink(card));
    if (['P01', 'P04'].includes(card.social.key)) body.append(kolViews(card));
    const controls = el('div', 'social-controls');
    card.tickers.forEach(ticker => controls.append(tickerTag(ticker)));
    controls.append(...actions(card).children);
    body.append(analysis(card), controls, engagement(card));
    return body;
  }

  function sourceLink(card) {
    const source = card.sources[0];
    const url = source.media?.url || source.url;
    const link = el(url ? 'a' : 'span', 'social-source-link');
    if (url) { link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    link.append(el('span', null, url ? new URL(url).hostname.replace(/^www\./, '') : source.name));
    if (url) link.append(icon('ui-popout-l.svg'));
    return link;
  }

  function kolViews(card) {
    const wrap = el('div', 'social-kol-views');
    const sides = card.social.key === 'P04'
      ? [{ name: 'Greg Brockman', images: ['social-greg.png'], source: { name: 'Greg Brockman', img: 'assets/social-greg.png' } }]
      : [{ name: 'Sam Altman', extra: '+1', images: ['social-agree-first.png', 'social-agree-second.png'], source: window.AlvaSourceSamples.P04 },
        { name: 'Warren Buffett', disagree: true, images: ['social-disagree-first.png'], source: window.AlvaSourceSamples.P07 }];
    sides.forEach(side => {
      const b = btn('social-kol-side' + (side.disagree ? ' disagree' : ''), side.name + ' profile');
      b.append(icon(side.disagree ? 'social-disagree.svg' : 'social-agree.svg'));
      const avatars = el('span', 'social-avatar-stack');
      side.images.forEach(name => avatars.append(img('assets/' + name)));
      b.append(avatars, el('span', null, side.name + (side.extra ? ' ' + side.extra : '')));
      b.addEventListener('click', () => pages.openProfile(side.source));
      wrap.append(b);
    });
    return wrap;
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

  function ownReply(text) {
    const reply = el('article', 'social-own-reply');
    const who = el('div', 'social-reply-who');
    who.append(img('assets/social-owner.png'), el('strong', null, 'YGGYLL'));
    reply.append(who, el('p', null, text));
    return reply;
  }

  function openReplies(card) {
    const state = stateFor(card);
    const thread = el('div', 'social-thread');
    const context = el('div', 'social-reply-context');
    context.append(quote(card));
    thread.append(context);
    const replies = el('div', 'social-replies');
    replies.setAttribute('aria-live', 'polite');
    state.replies.forEach(text => replies.append(ownReply(text)));
    thread.append(replies);
    const editor = composer('Reply to ' + card.sources[0].name, text => {
      if (state.replies.length >= 100) { toast('Reply limit reached'); return; }
      state.replies.push(text);
      update(card);
      replies.append(ownReply(text));
      thread.scrollTop = thread.scrollHeight;
    });
    openSheet([sheetClose(), el('h2', null, 'Reply')], [thread, editor.form], { full: true, bodyClass: 'social-sheet', label: 'Reply' });
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
    pages.openLinked(params.get('post'), params.get('profile'));
  }

  const pages = createSocialPages({ el, img, btn, icon, cards, tickerDirectory, followed, onFollowChange,
    identity, portrait, content, analysis, actions, engagement, sourceLink, kolViews, block, stockLogo,
    stateFor, bind, update, sharePost, shareLink, openTicker, closeSheet, openSheet, sheetClose,
  });

  return { content, openLinkedPost, leavePages: pages.leave, openOwner: pages.openOwner, reset() {
    states = readState();
    bindings.clear();
    pages.reset();
  } };
}
