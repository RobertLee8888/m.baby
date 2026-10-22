import { POSTS, TOPICS } from './thesis-motion-data.js?v=3';
import { CardTransition } from './thesis-card-transition.js?v=11';
import { ProfileTransition } from './thesis-profile-transition.js?v=7';
import { TickerTransition } from './thesis-ticker-transition.js?v=7';
import { PageTransition } from './thesis-page-transition.js?v=2';
import { TICKERS, renderTicker } from './thesis-motion-ticker.js?v=2';
import { MotionNavigation } from './thesis-motion-navigation.js?v=2';
import { PEOPLE, personFor, postFor, renderProfile } from './thesis-motion-profile.js?v=3';
import { versionsFor, versionFor, renderUpdates } from './thesis-motion-versions.js?v=1';

const app = document.querySelector('#motionApp');
const feed = document.querySelector('#feed');
const feedScroll = document.querySelector('#feedScroll');
const feedItems = document.querySelector('#feedItems');
const feedTitle = feed.querySelector('.motion-title h1');
const detail = document.querySelector('#detail');
const pageChrome = document.querySelector('#motionPageChrome');
mountPageContent(feed);
const cards = new Map();
const saved = new Set();
const followed = new Set();
let topic = 'All';
let toastTimer;
let pageSequence = 0;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
function mountPageContent(root) {
  const content = el('div', 'motion-page-content');
  content.append(...root.childNodes, pageChrome.content.cloneNode(true));
  root.append(content);
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

const countFormat = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const followerTotal = person => countFormat.format(person.followers + Number(followed.has(person.id)));
function followerCount(person) {
  const node = el('span', '', followerTotal(person)); node.dataset.followers = person.id; return node;
}

function followButton(post, withPlus = false) {
  post = personFor(post) || post;
  const node = button('motion-follow', 'Follow ' + post.name, () => {
    followed.has(post.id) ? followed.delete(post.id) : followed.add(post.id);
    document.querySelectorAll(`[data-follow="${post.id}"]`).forEach(render);
    document.querySelectorAll(`[data-followers="${post.id}"]`).forEach(target => target.textContent = followerTotal(post));
  });
  node.dataset.follow = post.id;
  node.dataset.plus = String(withPlus);
  function render(target) {
    const on = followed.has(post.id);
    target.replaceChildren();
    if (target.dataset.plus === 'true' && !on) target.append(icon('ui-add-l2.svg'));
    target.append(document.createTextNode(on ? 'Following' : 'Follow'));
    target.setAttribute('aria-pressed', String(on));
    target.setAttribute('aria-label', (on ? 'Unfollow ' : 'Follow ') + post.name);
  }
  render(node); return node;
}

function identity(post, age = false, interactive = true) {
  const row = el('div', 'motion-identity');
  const person = el('div', 'motion-person');
  person.append(shared(el('span', 'motion-name', post.name), 'name'));
  if (post.role) person.append(shared(el('span', 'motion-role', post.role), 'role'));
  const author = personFor(post);
  const link = el(interactive && author ? 'a' : 'div', 'motion-person-link');
  if (interactive && author) {
    link.href = '#profile/' + author.id; link.setAttribute('aria-label', 'View ' + author.name + ' profile');
    row.dataset.person = author.id;
    link.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); openProfile(author, row); });
  }
  if (post.avatar) link.append(shared(image(post.avatar, 'motion-avatar'), 'avatar'));
  link.append(person); row.append(link);
  if (age) row.append(el('span', 'motion-age', post.age));
  return row;
}

function tickers(post) {
  const row = el('div', 'motion-tickers');
  row.setAttribute('aria-label', 'Tickers');
  post.tickers.forEach((ticker, index) => {
    const chip = shared(button('motion-ticker', ticker.symbol + ', ' + ticker.stance + ' trend', event => {
      event.stopPropagation(); openTicker(TICKERS.get(ticker.symbol), chip);
    }), 'ticker-' + index);
    chip.dataset.ticker = ticker.symbol;
    const trend = el('span', 'motion-trend ' + ticker.stance);
    trend.append(image('assets/social-stance-arrow.svg'));
    chip.append(image(ticker.logo, 'motion-ticker-logo'), el('span', 'motion-ticker-symbol', ticker.symbol), trend); row.append(chip);
  });
  return row;
}

function body(post) {
  const node = shared(el('div', 'motion-body'), 'body');
  post.text.split('\n').forEach((paragraph, paragraphIndex) => {
    if (paragraphIndex) node.append(el('br'));
    node.append(document.createTextNode(paragraph));
  });
  if (post.sources?.length) node.append(' ', el('span', 'motion-citation', post.sources.map((_, i) => '[' + (i + 1) + ']').join(' ')));
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
    target.replaceChildren(icon(on ? 'ui-bookmark-f.svg' : 'thesis/first-card-imgBookmarkL.svg'));
    if (post.saved != null) target.append(el('span', '', String(post.saved + Number(on))));
  }
  updateSave(save); row.append(ask, save);
  if (withShare) {
    const share = reveal(button('motion-action', 'Share thesis', async () => {
      const url = new URL(location.href); url.hash = postRoute(post).hash;
      try {
        if (navigator.share) await navigator.share({ title: post.name, url: url.href });
        else { await navigator.clipboard.writeText(url.href); toast('Link copied'); }
      } catch (error) { if (error.name !== 'AbortError') toast('Unable to share'); }
    }));
    share.append(icon('social-share.svg')); row.append(share);
  }
  return row;
}

function postCard(post, register = true) {
  const card = el('article', 'motion-post'); card.dataset.post = post.id;
  card.setAttribute('aria-label', post.name + ' thesis');
  card.append(identity(post, true));
  if (post.tickers.length) card.append(tickers(post));
  const open = el('a', 'motion-open'); open.href = '#' + post.id;
  open.setAttribute('aria-label', 'Open ' + post.name + ' thesis'); open.append(body(post));
  open.addEventListener('click', event => {
    event.preventDefault();
    if (!String(getSelection())) navigate(post, card);
  });
  card.append(open);
  if (post.charts.length) card.append(charts(post));
  card.append(actions(post));
  let pointerStart;
  card.addEventListener('pointerdown', event => { pointerStart = { x: event.clientX, y: event.clientY }; });
  card.addEventListener('click', event => {
    if (event.target.closest('button,a') || String(getSelection())) return;
    if (event.detail > 0 && pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8) return;
    navigate(post, card);
  });
  if (register) cards.set(post.id, card); return card;
}

function recommendation() {
  const section = el('section', 'motion-recommendation');
  const top = el('div', 'motion-recommendation-top');
  const close = button('motion-icon-button', 'Dismiss recommendation', () => section.remove());
  close.append(icon('close-l1.svg')); top.append(el('h2', '', 'People you might like'), close);
  const person = PEOPLE.get('chamath');
  const row = identity(person);
  row.querySelector('.motion-name').append(image('assets/thesis/search-imgBotNotOnAlva.svg', 'motion-bot'));
  row.append(followButton(person, true));
  const reason = el('p', 'motion-reason'); reason.append(icon('thesis/motion-lightbulb.svg'), document.createTextNode("You've read about AI and growth stocks."));
  section.append(top, row, reason); return section;
}

function renderFeed() {
  feedItems.replaceChildren(); cards.clear();
  const selected = POSTS.filter(post => topic === 'All' || post.topics.includes(topic));
  selected.forEach((post, index) => {
    feedItems.append(postCard(post));
    if (index === 0 && topic === 'All') feedItems.append(recommendation());
  });
  feedScroll.scrollTop = 0;
  paintFeedHeader();
}

function sourceLinks(post, withProxy = true) {
  const sources = el('div', 'motion-source-links');
  (post.sources || []).forEach((url, index) => {
    const link = el('a', '', '[' + (index + 1) + '] ' + new URL(url).hostname.replace(/^www\./, ''));
    link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; sources.append(link);
  });
  if (withProxy && post.proxyNote) sources.append(el('p', 'motion-proxy-note', post.proxyNote));
  return sources;
}

function renderDetail(post, detail, settle, backLabel = 'Back to For You') {
  const historical = post.version !== 'latest';
  detail.dataset.thesis = post.id; detail.dataset.version = post.version;
  const header = el('header', 'motion-detail-header');
  const back = reveal(button('motion-icon-button', backLabel, goBack)); back.dataset.back = '';
  back.append(icon('onboarding-arrow-left-l1.svg'));
  header.append(back, identity(post), reveal(followButton(post)));
  const scroll = el('div', 'motion-detail-scroll');
  const timeline = el('section', 'motion-timeline');
  const date = reveal(el('div', 'motion-date'));
  date.append(el('time', '', post.date), el('span', historical ? 'motion-version-label' : 'motion-latest', historical ? 'History' : 'Latest'));
  if (historical) {
    date.classList.add('motion-historical-date');
    const latest = button('motion-view-latest', 'View latest', () => showLatest(post));
    latest.append('View latest', icon('ui-arrow-up-l2.svg')); date.append(latest);
  }
  timeline.append(reveal(el('div', 'motion-rail')), reveal(el('div', 'motion-dot')), date);
  if (post.tickers.length) timeline.append(tickers(post));
  timeline.append(body(post));
  if (post.charts.length) timeline.append(charts(post));
  timeline.append(reveal(sourceLinks(post)));
  const count = versionsFor(findPost(post.id)).length;
  const historyLabel = `View all ${count} update${count === 1 ? '' : 's'}`;
  const history = reveal(button('motion-history', historyLabel, () => navigation.open(updatesRoute(post), history)));
  history.append(document.createTextNode(historyLabel), icon('ui-arrow-right-l2.svg'));
  timeline.append(history, reveal(el('div', 'motion-dot end')));

  const secondary = reveal(el('section', 'motion-detail-secondary'), 'content');
  const tabs = el('div', 'motion-detail-tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Thesis context');
  const panels = el('div', 'motion-panels'); const track = el('div', 'motion-panel-track');
  const signals = el('div', 'motion-panel'); signals.id = detail.id + '-signals'; signals.setAttribute('role', 'tabpanel');
  for (const signal of post.signals || []) {
    const source = el('div', 'motion-signal-source');
    source.append(identity({ ...signal, age: signal.time }, true, false));
    // Signal identity is secondary content, not a duplicate shared source.
    source.querySelectorAll('[data-shared]').forEach(node => delete node.dataset.shared);
    const copy = el('p', 'motion-signal-copy', signal.text + ' ');
    const link = el('a', '', new URL(signal.url).hostname.replace(/^www\./, '') + ' ↗'); link.href = signal.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; copy.append(link); source.append(copy);
    const analysis = el('p', 'motion-analysis');
    const tag = el('span', 'motion-analysis-tag');
    const brand = el('span', 'motion-analysis-brand'); brand.append(image('assets/thesis/detail/alva.svg'), 'Alva');
    tag.append(brand, el('span', 'motion-analysis-verdict', signal.verdict));
    analysis.append(tag, signal.analysis); signals.append(source, analysis);
  }
  if (!post.signals?.length) {
    const empty = el('div', 'motion-signal-empty');
    empty.append(el('strong', '', post.signalStatus));
    if (post.signalNote) empty.append(el('p', '', post.signalNote));
    signals.append(empty);
  }
  const related = el('div', 'motion-panel motion-related-panel'); related.id = detail.id + '-related'; related.setAttribute('role', 'tabpanel'); related.setAttribute('aria-hidden', 'true'); related.inert = true;
  const relatedPosts = post.relatedIds ? POSTS.filter(item => post.relatedIds.includes(item.id))
    : POSTS.filter(item => item.id !== post.id && item.tickers.some(ticker => post.tickers.some(other => ticker.symbol === other.symbol)));
  related.append(...relatedPosts.map(item => postCard(item, false)));
  if (!relatedPosts.length) related.append(el('p', 'motion-profile-empty', 'No related theses'));
  track.append(signals, related); panels.append(track);
  ['Signals', 'Related thesis'].forEach((label, index) => {
    const tab = button('', label, () => selectTab(index));
    tab.textContent = label;
    tab.setAttribute('role', 'tab'); tab.setAttribute('aria-selected', String(index === 0));
    tab.setAttribute('aria-controls', [signals, related][index].id); tab.id = detail.id + '-tab-' + index;
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
    settle();
    // Once tabs join the header, their bottom rule is the only divider.
    header.classList.toggle('is-scrolled', scroll.scrollTop > 0 && scroll.scrollTop < secondary.offsetTop);
  }, { passive: true });
  requestAnimationFrame(() => panels.style.setProperty('--panel-min-height', Math.max(0, scroll.clientHeight - tabs.offsetHeight) + 'px'));
  return () => clearTimeout(tabTimer);
}

const postRoute = post => {
  const version = post.version || 'latest';
  const suffix = version === 'latest' ? '' : '/version/' + version;
  return { key: 'detail/' + post.id + suffix, type: 'detail', id: post.id, version, hash: '#' + post.id + suffix };
};
const updatesRoute = post => ({ key: 'updates/' + post.id + '/' + (post.version || 'latest'), type: 'updates', id: post.id,
  selected: post.version || 'latest', hash: '#' + post.id + '/updates' });
const profileRoute = person => ({ key: 'profile/' + person.id, type: 'profile', id: person.id, hash: '#profile/' + person.id });
const tickerRoute = ticker => ({ key: 'ticker/' + ticker.symbol, type: 'ticker', id: ticker.symbol, hash: '#ticker/' + ticker.symbol });
const findPost = id => postFor(id);
const navigation = new MotionNavigation({
  parse(hash) {
    if (hash.startsWith('#ticker/')) {
      const ticker = TICKERS.get(hash.slice(8)); return ticker ? [tickerRoute(ticker)] : [];
    }
    if (hash.startsWith('#profile/')) {
      const person = PEOPLE.get(hash.slice(9)); return person ? [profileRoute(person)] : [];
    }
    const [id, type, version] = hash.slice(1).split('/');
    const post = findPost(id);
    if (!post) return [];
    if (type === 'updates') return [postRoute(post), updatesRoute(post)];
    if (type === 'version') {
      const selected = versionFor(post, version);
      if (selected && version !== 'latest') return [postRoute(post), updatesRoute(post), postRoute(selected)];
    }
    return [postRoute(post)];
  },
  create(route, source, parentFrame, onSettled) {
    const underlay = parentFrame?.root || feed;
    const root = !parentFrame && route.type === 'detail' ? detail : el('section', route.type === 'ticker' ? 'motion-ticker-page' : 'motion-' + route.type);
    if (!root.id) root.id = route.type === 'profile' && !document.querySelector('#profile') ? 'profile' : 'motion-page-' + ++pageSequence;
    if (!root.isConnected) app.append(root);
    root.hidden = false; root.inert = false; root.setAttribute('aria-hidden', 'false');
    let transition, dispose;
    if (route.type === 'updates') {
      const post = findPost(route.id);
      source ||= underlay.querySelector('.motion-history');
      renderUpdates(root, post, route.selected, { el, icon, button, body, sources: post => sourceLinks(post, false),
        back: goBack, openVersion, settle: () => transition.settle() });
      transition = new PageTransition({ feed: underlay, detail: root, onSettled });
    } else if (route.type === 'ticker') {
      const ticker = TICKERS.get(route.id);
      source ||= underlay.querySelector(`[data-ticker="${ticker.symbol}"]`);
      renderTicker(root, ticker, { el, image, icon, button, postCard, back: goBack,
        settle: () => transition.settle(), share: shareTicker });
      transition = new TickerTransition({ app, feed: underlay, detail: root, onSettled });
    } else if (route.type === 'profile') {
      const person = PEOPLE.get(route.id);
      source ||= underlay.querySelector(`[data-person="${person.id}"]`);
      dispose = renderProfile(root, person, { el, image, icon, button, identity, followButton, followerCount, postCard,
        back: goBack, settle: () => transition.settle(), share: shareProfile });
      transition = new ProfileTransition({ app, feed: underlay, detail: root, onSettled });
    } else {
      const post = versionFor(findPost(route.id), route.version);
      const fromHistory = route.version && route.version !== 'latest' || parentFrame?.route.type === 'updates';
      if (fromHistory) source ||= underlay.querySelector(`[data-version="${post.version}"] .motion-update-open`)?.closest('.motion-update-row') || underlay.querySelector('.motion-history');
      if (!source) {
        source = underlay.querySelector(`[data-post="${post.id}"]`);
        if (!source && !parentFrame) { topic = 'All'; renderFeed(); updateTopics(); source = cards.get(post.id); }
        source?.scrollIntoView({ block: 'center' });
      }
      if (!source) { root.hidden = true; return null; }
      root.setAttribute('aria-label', 'Thesis detail');
      const backLabel = parentFrame?.route.type === 'updates' ? 'Back to all updates' : parentFrame ? 'Back to ' + parentFrame.route.type : 'Back to For You';
      dispose = renderDetail(post, root, () => transition.settle(), backLabel);
      transition = fromHistory ? new PageTransition({ feed: underlay, detail: root, onSettled })
        : new CardTransition({ app, feed: underlay, detail: root, onSettled });
    }
    mountPageContent(root);
    if (route.type === 'detail') {
      for (const selector of ['.motion-tickers', '.motion-charts']) {
        const from = source.querySelector(selector), to = root.querySelector(selector);
        if (from && to) to.scrollLeft = from.scrollLeft;
      }
    }
    return { root, transition, source, dispose };
  },
});
function navigate(post, card) { navigation.open(postRoute(post), card); }
function openVersion(post, row) {
  const route = postRoute(post);
  if (!navigation.backTo(route.key)) navigation.open(route, row);
}
function showLatest(post) {
  const latest = findPost(post.id), route = postRoute(latest);
  const frame = navigation.frames.find(item => item.route.key === route.key);
  if (frame) frame.root.querySelector('.motion-detail-scroll').scrollTop = 0;
  if (!navigation.backTo(route.key)) navigation.open(route, navigation.current.root.querySelector('.motion-history'));
}
function openTicker(ticker, chip) {
  const parent = navigation.frames.at(-2);
  if (parent?.route.key === 'ticker/' + ticker.symbol) { goBack(); return; }
  navigation.open(tickerRoute(ticker), chip);
}
function openProfile(person, row) {
  // The current author's profile is already directly underneath their thesis.
  const parent = navigation.frames.at(-2);
  if (parent?.route.key === 'profile/' + person.id) { goBack(); return; }
  navigation.open(profileRoute(person), row);
}
function goBack() { navigation.back(); }
async function shareProfile(person) {
  const url = new URL(location.href); url.hash = 'profile/' + person.id;
  try {
    if (navigator.share) await navigator.share({ title: person.name + ' · Alva', url: url.href });
    else { await navigator.clipboard.writeText(url.href); toast('Link copied'); }
  } catch (error) { if (error.name !== 'AbortError') toast('Unable to share'); }
}
async function shareTicker(ticker) {
  const url = new URL(location.href); url.hash = 'ticker/' + ticker.symbol;
  try {
    if (navigator.share) await navigator.share({ title: ticker.name + ' · Alva', url: url.href });
    else { await navigator.clipboard.writeText(url.href); toast('Link copied'); }
  } catch (error) { if (error.name !== 'AbortError') toast('Unable to share'); }
}
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
function paintFeedHeader() {
  const progress = Math.max(0, Math.min(1, feedScroll.scrollTop / (feedTitle.offsetHeight || 1)));
  feed.style.setProperty('--feed-header-p', progress);
  feedTitle.setAttribute('aria-hidden', String(progress === 1));
}
feedScroll.addEventListener('scroll', paintFeedHeader, { passive: true });
function toast(message) {
  const node = document.querySelector('#motionToast'); clearTimeout(toastTimer); node.textContent = message; node.hidden = false;
  toastTimer = setTimeout(() => { node.hidden = true; }, 1800);
}
function resize() {
  navigation.settle();
  const scale = Math.min(1, innerWidth / 360);
  app.style.width = innerWidth / scale + 'px'; app.style.height = innerHeight / scale + 'px';
  app.style.transformOrigin = 'top left'; app.style.transform = `scale(${scale})`;
  paintFeedHeader();
  document.querySelectorAll('.motion-detail .motion-detail-scroll').forEach(scroll => {
    scroll.querySelector('.motion-panels').style.setProperty('--panel-min-height', scroll.clientHeight - scroll.querySelector('.motion-detail-tabs').offsetHeight + 'px');
  });
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
await document.fonts.ready;
navigation.start();
