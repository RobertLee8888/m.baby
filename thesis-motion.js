import { POSTS, SIGNAL, TOPICS } from './thesis-motion-data.js?v=2';
import { CardTransition } from './thesis-card-transition.js?v=3';

const app = document.querySelector('#motionApp');
const feed = document.querySelector('#feed');
const feedScroll = document.querySelector('#feedScroll');
const feedItems = document.querySelector('#feedItems');
const detail = document.querySelector('#detail');
const cards = new Map();
const saved = new Set();
const followed = new Set();
let activePost = null;
let topic = 'All';
let historyDepth = 0;
let pendingBack = false;
let toastTimer;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
function icon(path) {
  const node = el('span', 'motion-icon');
  node.style.setProperty('--icon', `url(assets/${path})`);
  node.setAttribute('aria-hidden', 'true');
  return node;
}
function image(src, className, alt = '') {
  const node = el('img', className); node.src = src; node.alt = alt; return node;
}
function button(className, label, action) {
  const node = el('button', className); node.type = 'button'; node.setAttribute('aria-label', label);
  if (action) node.addEventListener('click', action);
  return node;
}
function shared(node, key) { node.dataset.shared = key; return node; }
function reveal(node, kind = 'chrome') { node.dataset.reveal = kind; return node; }

function followButton(post, withPlus = false) {
  const node = button('motion-follow', 'Follow ' + post.name, () => {
    followed.has(post.id) ? followed.delete(post.id) : followed.add(post.id);
    document.querySelectorAll(`[data-follow="${post.id}"]`).forEach(render);
  });
  node.dataset.follow = post.id;
  function render(target) {
    const on = followed.has(post.id);
    target.replaceChildren();
    if (withPlus && !on) target.append(icon('ui-add-l2.svg'));
    target.append(document.createTextNode(on ? 'Following' : 'Follow'));
    target.setAttribute('aria-pressed', String(on));
    target.setAttribute('aria-label', (on ? 'Unfollow ' : 'Follow ') + post.name);
  }
  render(node); return node;
}

function identity(post, age = false) {
  const row = el('div', 'motion-identity');
  const person = el('div', 'motion-person');
  person.append(shared(el('span', 'motion-name', post.name), 'name'), shared(el('span', 'motion-role', post.role), 'role'));
  row.append(shared(image(post.avatar, 'motion-avatar'), 'avatar'), person);
  if (age) row.append(el('span', 'motion-age', post.age));
  return row;
}

function tickers(post) {
  const row = el('div', 'motion-tickers');
  row.setAttribute('aria-label', 'Tickers');
  post.tickers.forEach((ticker, index) => {
    const chip = shared(el('span', 'motion-ticker'), 'ticker-' + index);
    chip.setAttribute('aria-label', ticker.symbol + ', ' + ticker.stance + ' trend');
    const trend = el('span', 'motion-trend ' + ticker.stance);
    trend.append(image('assets/social-stance-arrow.svg'));
    chip.append(image(ticker.logo), document.createTextNode(ticker.symbol), trend); row.append(chip);
  });
  return row;
}

function body(post) {
  const node = shared(el('div', 'motion-body'), 'body');
  post.text.split('\n').forEach((paragraph, paragraphIndex) => {
    if (paragraphIndex) node.append(el('br'));
    node.append(document.createTextNode(paragraph));
  });
  node.append(' ', el('span', 'motion-citation', '[1]'));
  return node;
}

function charts(post) {
  const row = el('div', 'motion-charts'); row.setAttribute('aria-label', 'Price charts');
  post.charts.forEach((src, index) => {
    const frame = shared(el('figure', 'motion-chart'), 'chart-' + index);
    const picture = image(src, '', (post.tickers[index]?.symbol || post.name) + ' price history');
    picture.width = 240; picture.height = 135; frame.append(picture); row.append(frame);
  });
  return row;
}

function actions(post, withShare = false) {
  const row = el('div', 'motion-actions');
  const ask = button('motion-action', 'Ask Alva');
  ask.setAttribute('aria-disabled', 'true');
  ask.append(icon('thesis/first-card-imgChatAiL.svg'), el('span', '', 'Ask Alva'));
  const save = button('motion-action motion-save', 'Bookmark', () => {
    saved.has(post.id) ? saved.delete(post.id) : saved.add(post.id);
    document.querySelectorAll(`[data-save="${post.id}"]`).forEach(updateSave);
  });
  save.dataset.save = post.id;
  function updateSave(target) {
    const on = saved.has(post.id);
    target.setAttribute('aria-pressed', String(on));
    target.setAttribute('aria-label', on ? 'Remove bookmark' : 'Bookmark');
    target.replaceChildren(icon(on ? 'ui-bookmark-f.svg' : 'thesis/first-card-imgBookmarkL.svg'), el('span', '', String(post.saved + Number(on))));
  }
  updateSave(save); row.append(ask, save);
  if (withShare) {
    const share = reveal(button('motion-action', 'Share thesis', async () => {
      const url = new URL(location.href); url.hash = post.id;
      try {
        if (navigator.share) await navigator.share({ title: post.name, url: url.href });
        else { await navigator.clipboard.writeText(url.href); toast('Link copied'); }
      } catch (error) { if (error.name !== 'AbortError') toast('Unable to share'); }
    }));
    share.append(icon('social-share.svg')); row.append(share);
  }
  return row;
}

function postCard(post) {
  const card = el('article', 'motion-post'); card.dataset.post = post.id;
  card.setAttribute('aria-label', post.name + ' thesis');
  card.append(identity(post, true));
  if (post.tickers.length) card.append(tickers(post));
  const open = el('a', 'motion-open'); open.href = '#' + post.id;
  open.setAttribute('aria-label', 'Open ' + post.name + ' thesis'); open.append(body(post));
  open.addEventListener('click', event => {
    event.preventDefault();
    if (!String(getSelection())) navigate(post);
  });
  card.append(open);
  if (post.charts.length) card.append(charts(post));
  card.append(actions(post));
  let pointerStart;
  card.addEventListener('pointerdown', event => { pointerStart = { x: event.clientX, y: event.clientY }; });
  card.addEventListener('click', event => {
    if (event.target.closest('button,a') || String(getSelection())) return;
    if (event.detail > 0 && pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8) return;
    navigate(post);
  });
  cards.set(post.id, card); return card;
}

function recommendation() {
  const section = el('section', 'motion-recommendation');
  const top = el('div', 'motion-recommendation-top');
  const close = button('motion-icon-button', 'Dismiss recommendation', () => section.remove());
  close.append(icon('close-l1.svg')); top.append(el('h2', '', 'People you might like'), close);
  const person = { id: 'chamath', name: 'Chamath Palihapitiya', role: 'Founder & CEO, Social Capital', avatar: 'assets/social-chamath.png' };
  const row = identity(person);
  row.querySelector('.motion-name').append(image('assets/thesis/search-imgBotNotOnAlva.svg', 'motion-bot'));
  row.append(followButton(person, true));
  const reason = el('p', 'motion-reason'); reason.append(icon('thesis/motion-lightbulb.svg'), document.createTextNode("You've read about AI and growth stocks."));
  section.append(top, row, reason); return section;
}

function renderFeed() {
  feedItems.replaceChildren(); cards.clear();
  const selected = POSTS.filter(post => topic === 'All' || ({
    Chips: ['gavin', 'traderstewie'], Memory: ['gavin'], Hyperscaler: ['satya', 'gavin', 'sam'], Neocloud: ['sam', 'gavin'],
  }[topic] || []).includes(post.id));
  selected.forEach((post, index) => {
    feedItems.append(postCard(post));
    if (index === 0 && topic === 'All') feedItems.append(recommendation());
  });
  feedScroll.scrollTop = 0;
}

function renderDetail(post) {
  const header = el('header', 'motion-detail-header');
  const back = reveal(button('motion-icon-button', 'Back to For You', goBack));
  back.append(icon('onboarding-arrow-left-l1.svg'));
  header.append(back, identity(post), reveal(followButton(post)));
  const scroll = el('div', 'motion-detail-scroll');
  const timeline = el('section', 'motion-timeline');
  const date = reveal(el('div', 'motion-date')); date.append(el('span', '', post.date), el('span', 'motion-latest', 'Latest'));
  timeline.append(reveal(el('div', 'motion-rail')), reveal(el('div', 'motion-dot')), date);
  if (post.tickers.length) timeline.append(tickers(post));
  timeline.append(body(post));
  if (post.charts.length) timeline.append(charts(post));
  // Every card previews the supplied detail template, including its update rail.
  // The history destination is outside this two-screen transition prototype.
  const history = reveal(button('motion-history', 'View all 12 updates'));
  history.setAttribute('aria-disabled', 'true');
  history.append(document.createTextNode('View all 12 updates'), icon('ui-arrow-right-l2.svg'));
  timeline.append(history, reveal(el('div', 'motion-dot end')));

  const secondary = reveal(el('section', 'motion-detail-secondary'), 'content');
  const tabs = el('div', 'motion-detail-tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Thesis context');
  const panels = el('div', 'motion-panels'); const track = el('div', 'motion-panel-track');
  const signals = el('div', 'motion-panel'); signals.id = 'signals'; signals.setAttribute('role', 'tabpanel');
  const source = el('div', 'motion-signal-source');
  source.append(identity({ name: SIGNAL.name, role: SIGNAL.role, avatar: SIGNAL.avatar, age: SIGNAL.time }, true));
  // Signal identity is secondary content, not a duplicate shared source.
  source.querySelectorAll('[data-shared]').forEach(node => delete node.dataset.shared);
  const copy = el('p', 'motion-signal-copy', SIGNAL.text + ' ');
  const link = el('a', '', 'x.com ↗'); link.href = SIGNAL.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; copy.append(link); source.append(copy);
  const analysis = el('p', 'motion-analysis');
  const tag = el('span', 'motion-analysis-tag');
  const brand = el('span', 'motion-analysis-brand'); brand.append(image('assets/thesis/detail/alva.svg'), 'Alva');
  tag.append(brand, el('span', 'motion-analysis-verdict', 'Mixed'));
  analysis.append(tag, SIGNAL.analysis); signals.append(source, analysis);
  const related = el('div', 'motion-panel'); related.id = 'related'; related.setAttribute('role', 'tabpanel'); related.setAttribute('aria-hidden', 'true'); related.inert = true;
  const relatedPost = POSTS.find(item => item.id === 'gavin');
  related.append(identity(relatedPost), body(relatedPost));
  related.querySelectorAll('[data-shared]').forEach(node => delete node.dataset.shared);
  track.append(signals, related); panels.append(track);
  ['Signals', 'Related thesis'].forEach((label, index) => {
    const tab = button('', label, () => selectTab(index));
    tab.textContent = label;
    tab.setAttribute('role', 'tab'); tab.setAttribute('aria-selected', String(index === 0));
    tab.setAttribute('aria-controls', index ? 'related' : 'signals'); tab.id = 'tab-' + index;
    tab.tabIndex = index ? -1 : 0; tabs.append(tab);
    [signals, related][index].setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('keydown', event => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index;
        selectTab(next); tabs.children[next].focus();
      }
    });
  });
  let tabTimer;
  function selectTab(index) {
    clearTimeout(tabTimer); panels.classList.add('is-switching');
    [...tabs.children].forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
    [signals, related].forEach((panel, i) => { panel.setAttribute('aria-hidden', String(i !== index)); panel.inert = i !== index; });
    track.style.transform = `translateX(-${index * 100}%)`;
    tabTimer = setTimeout(() => panels.classList.remove('is-switching'), 260);
  }
  secondary.append(tabs, panels); scroll.append(timeline, secondary);
  const footer = reveal(el('footer', 'motion-detail-footer')); footer.append(actions(post, true));
  detail.replaceChildren(header, scroll, footer);
  scroll.addEventListener('scroll', () => {
    transition.settle();
    // Once tabs join the header, their bottom rule is the only divider.
    header.classList.toggle('is-scrolled', scroll.scrollTop > 0 && scroll.scrollTop < secondary.offsetTop);
  }, { passive: true });
  requestAnimationFrame(() => panels.style.setProperty('--panel-min-height', Math.max(0, scroll.clientHeight - tabs.offsetHeight) + 'px'));
}

const transition = new CardTransition({ app, feed, detail, onSettled(open, source) {
  if (open) detail.querySelector('[aria-label="Back to For You"]').focus({ preventScroll: true });
  else source.querySelector('.motion-open').focus({ preventScroll: true });
} });

function navigate(post, push = true) {
  if (transition.running && post.id !== activePost?.id) return;
  if (!cards.has(post.id)) { topic = 'All'; renderFeed(); updateTopics(); }
  const card = cards.get(post.id);
  if (activePost?.id !== post.id || detail.hidden) {
    renderDetail(post); activePost = post;
    detail.hidden = false;
    for (const selector of ['.motion-tickers', '.motion-charts']) {
      const source = card.querySelector(selector), target = detail.querySelector(selector);
      if (source && target) target.scrollLeft = source.scrollLeft;
    }
  }
  if (push) { historyDepth++; history.pushState({ thesisMotion: post.id, depth: historyDepth }, '', '#' + post.id); }
  transition.setOpen(true, card);
}
function goBack() {
  if (!transition.opened || pendingBack) return;
  if (history.state?.depth) { pendingBack = true; history.back(); }
  else { history.replaceState({ thesisMotion: null, depth: 0 }, '', location.pathname + location.search); transition.setOpen(false, cards.get(activePost.id)); }
}
window.addEventListener('popstate', () => {
  pendingBack = false;
  const post = POSTS.find(item => item.id === location.hash.slice(1));
  if (post) navigate(post, false);
  else if (activePost) transition.setOpen(false, cards.get(activePost.id));
});
window.addEventListener('keydown', event => { if (event.key === 'Escape') goBack(); });

function updateTopics() {
  document.querySelectorAll('[data-topic]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.topic === topic)));
}
TOPICS.forEach(label => {
  const node = button('', label, () => { topic = label; renderFeed(); updateTopics(); });
  node.dataset.topic = label; node.textContent = label; document.querySelector('.motion-categories').append(node);
});
const more = button('motion-category-more', 'More topics'); more.setAttribute('aria-disabled', 'true'); more.append(icon('ui-arrow-down-l2.svg')); document.querySelector('.motion-categories').append(more);
const navIcons = ['thesis/tabbar-imgForYouF.svg', 'ui-chat-ai-l.svg', 'thesis/tabbar-imgSearchL1.svg', 'ui-me-l.svg'];
['For You', 'Alva', 'Search', 'Me'].forEach((label, index) => {
  const node = button('', label, index === 0 ? () => feedScroll.scrollTo({ top: 0, behavior: 'smooth' }) : null);
  node.append(icon(navIcons[index]), el('span', '', label));
  if (index === 0) node.setAttribute('aria-current', 'page'); else node.setAttribute('aria-disabled', 'true');
  document.querySelector('.motion-nav').append(node);
});
feedScroll.addEventListener('scroll', () => {
  document.querySelector('.motion-title h1').style.opacity = String(1 - Math.min(1, feedScroll.scrollTop / 40));
}, { passive: true });
function toast(message) {
  const node = document.querySelector('#motionToast'); clearTimeout(toastTimer); node.textContent = message; node.hidden = false;
  toastTimer = setTimeout(() => { node.hidden = true; }, 1800);
}
function resize() {
  transition.settle();
  const scale = Math.min(1, innerWidth / 360);
  app.style.width = innerWidth / scale + 'px'; app.style.height = innerHeight / scale + 'px';
  app.style.transformOrigin = 'top left'; app.style.transform = `scale(${scale})`;
  const scroll = detail.querySelector('.motion-detail-scroll');
  if (scroll) detail.querySelector('.motion-panels').style.setProperty('--panel-min-height', scroll.clientHeight - detail.querySelector('.motion-detail-tabs').offsetHeight + 'px');
}
window.addEventListener('resize', resize);
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let appearance = 'light';
function applyAppearance(value) {
  appearance = ['light', 'dark', 'system'].includes(value) ? value : 'light';
  const dark = appearance === 'dark' || (appearance === 'system' && systemTheme.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
window.addEventListener('message', event => {
  if (event.source === parent && event.origin === location.origin && event.data?.type === 'alva:set-appearance') applyAppearance(event.data.appearance);
});
systemTheme.addEventListener('change', () => applyAppearance(appearance));
renderFeed(); updateTopics(); resize();
const initial = POSTS.find(post => post.id === location.hash.slice(1));
history.replaceState({ thesisMotion: initial?.id || null, depth: 0 }, '');
if (initial) {
  await document.fonts.ready;
  cards.get(initial.id).scrollIntoView({ block: 'center' });
  navigate(initial, false);
}
