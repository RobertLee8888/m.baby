import { SOCIAL_POSTS } from './mvp-social-data.js';

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
  return new Map(SOCIAL_POSTS.map(post => {
    const item = saved?.[post.key];
    return [post.key, {
      liked: item?.liked === true, reposted: item?.reposted === true, tracked: item?.tracked === true,
      replies: Array.isArray(item?.replies) ? item.replies.filter(text => typeof text === 'string' && text.trim()).slice(-100).map(text => text.slice(0, 2000)) : [],
    }];
  }));
}

export function createSocialFeed({ el, img, btn, icon, sourceUI, block, stockLogo, openSources, openTicker, openSheet, sheetClose, toast }) {
  let states = readState();
  const counters = new Map();
  let linkTimer;
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

  function logo() {
    const tile = el('span', 'logo-tile social-logo');
    tile.append(img('assets/social-logo.svg'));
    return tile;
  }

  function quote(card) {
    const post = card.social;
    if (post.event) {
      const wrap = el('div', 'social-event');
      const tag = el('span', 'social-event-tag');
      tag.append(icon(post.key === 'S04' ? 'social-earnings.svg' : 'social-report.svg'), el('span', null, post.event));
      const copy = btn('quote-body');
      copy.textContent = post.statements[0];
      copy.addEventListener('click', () => openSources(card));
      wrap.append(tag, copy);
      return wrap;
    }
    function displaySource(source, depth = 0) {
      return { ...source, attribution: source.name, preview: undefined, summary: post.statements[depth],
        img: source.name === 'Reuters' ? 'assets/social-reuters.png' : source.img,
        reference: source.reference ? displaySource(source.reference, depth + 1) : undefined };
    }
    const result = sourceUI.quote(displaySource(card.sources[0]), card);
    result.querySelectorAll('.source-play').forEach(play => play.replaceChildren(icon('social-play.svg')));
    result.querySelectorAll('.quote-body').forEach(body => {
      const text = body.textContent;
      const prefix = PREFIXES.find(value => text.startsWith(value));
      if (prefix) body.replaceChildren(el('span', 'social-quote-prefix', prefix), document.createTextNode(text.slice(prefix.length)));
      body.tabIndex = 0;
      body.setAttribute('role', 'button');
      body.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); body.click(); }
      });
    });
    return result;
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
    const tickers = el('div', 'social-tickers');
    card.tickers.forEach(ticker => tickers.append(tickerTag(ticker)));
    section.append(copy, tickers);
    return section;
  }

  function formatCount(label, extra) {
    if (!extra) return label;
    const base = Number.parseFloat(label) * (label.endsWith('K') ? 1000 : 1);
    if (label.endsWith('K')) return ((base + extra) / 1000).toFixed(1) + 'K';
    return (base + extra).toLocaleString('en-US');
  }

  function engagement(card) {
    const post = card.social, state = states.get(post.key);
    const row = el('div', 'social-engagement');
    const reply = btn('social-action', 'Reply');
    const replies = el('span', null, formatCount(post.counts[0], state.replies.length));
    reply.append(icon('social-comment.svg'), replies);
    reply.addEventListener('click', () => openReplies(card));
    counters.set(post.key, replies);
    row.append(reply);
    for (const [index, key, label, glyph] of [[1, 'reposted', 'Repost', 'social-repost.svg'], [2, 'liked', 'Like', 'social-heart.svg']]) {
      const control = btn('social-action social-' + key, label);
      function paint() {
        control.setAttribute('aria-pressed', String(state[key]));
        control.replaceChildren(icon(key === 'liked' && state[key] ? 'ui-heart-f.svg' : glyph), el('span', null, formatCount(post.counts[index], Number(state[key]))));
      }
      paint();
      control.addEventListener('click', () => { state[key] = !state[key]; save(); paint(); });
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
    try {
      if (navigator.share) await navigator.share({ title: card.sources[0].name + ' · Alva', url: url.href });
      else { await navigator.clipboard.writeText(url.href); toast('Link copied'); }
    } catch (error) {
      if (error.name === 'AbortError') return;
      const link = el('input', 'social-share-link');
      link.value = url.href;
      link.readOnly = true;
      link.setAttribute('aria-label', 'Post link');
      link.addEventListener('focus', () => link.select());
      openSheet([sheetClose(), el('h2', null, 'Share post')], [link], { label: 'Share post' });
    }
  }

  function actions(card) {
    const row = el('div', 'social-ctas');
    card.social.actions.forEach(label => {
      const track = label === 'Track This';
      const control = btn('social-cta' + (track ? ' social-track' : ''), label);
      const state = states.get(card.social.key);
      function paint() {
        control.replaceChildren(icon(track ? 'social-notification.svg' : 'social-chat.svg'), el('span', null, track && state.tracked ? 'Tracking' : label));
        if (track) control.setAttribute('aria-pressed', String(state.tracked));
      }
      paint();
      control.addEventListener('click', () => {
        if (track) { state.tracked = !state.tracked; save(); paint(); }
        else openConversation(card, label);
      });
      row.append(control);
    });
    return row;
  }

  function content(card) {
    const body = el('div', 'social-content');
    body.append(quote(card));
    if (card.social.endorsement) {
      const proof = el('div', 'social-proof');
      const text = el('p');
      text.append(el('strong', null, 'Greg Brockman'), ' also shares this view.');
      proof.append(img('assets/social-greg.png'), text);
      body.append(proof);
    }
    card.blocks.filter(item => item.type === 'media').forEach(item => body.append(block(item, card)));
    body.append(analysis(card), actions(card), engagement(card));
    return body;
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
    who.append(img('assets/avatar-kaleo.png'), el('strong', null, 'Sheer'));
    reply.append(who, el('p', null, text));
    return reply;
  }

  function openReplies(card) {
    const state = states.get(card.social.key);
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
      save();
      replies.append(ownReply(text));
      counters.get(card.social.key).textContent = formatCount(card.social.counts[0], state.replies.length);
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
    clearTimeout(linkTimer);
    const key = new URLSearchParams(location.search).get('post');
    if (!SOCIAL_POSTS.some(post => post.key === key)) return;
    linkTimer = setTimeout(() => {
      const card = document.querySelector('[data-card-id="source-' + key + '"]');
      const feed = document.getElementById('feed');
      if (card) {
        const scale = feed.getBoundingClientRect().width / feed.clientWidth;
        feed.scrollTop += (card.getBoundingClientRect().top - feed.getBoundingClientRect().top) / scale - 72;
      }
    }, 1650);
  }

  return { content, openLinkedPost, reset() {
    clearTimeout(linkTimer);
    states = readState();
    counters.clear();
  } };
}
