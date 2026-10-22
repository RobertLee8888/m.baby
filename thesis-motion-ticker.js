import { POSTS } from './thesis-motion-data.js?v=3';

const companies = {
  SPY: ['SPDR S&P 500 ETF Trust', 'NYSE Arca'], NVDA: ['NVIDIA Corp', 'NASDAQ'],
  MSFT: ['Microsoft Corporation', 'NASDAQ'], GOOGL: ['Alphabet Inc.', 'NASDAQ'],
  META: ['Meta Platforms, Inc.', 'NASDAQ'], AMD: ['Advanced Micro Devices', 'NASDAQ'],
  USO: ['United States Oil Fund', 'NYSE Arca'], TSLA: ['Tesla, Inc.', 'NASDAQ'],
  XYZ: ['Block, Inc.', 'NYSE'], HOOD: ['Robinhood Markets, Inc.', 'NASDAQ'],
  QQQ: ['Invesco QQQ Trust', 'NASDAQ'],
};
export const TICKERS = new Map(POSTS.flatMap(post => post.tickers).map(ticker => [ticker.symbol, {
  ...ticker, name: companies[ticker.symbol][0], market: companies[ticker.symbol][1],
}]));

const watched = new Set();

export function renderTicker(root, ticker, ui) {
  const { el, image, icon, button, postCard, back, settle, share } = ui;
  root.setAttribute('aria-label', ticker.symbol + ' ticker detail'); root.dataset.tickerPage = ticker.symbol;
  const surface = el('div', 'motion-ticker-surface');
  const header = el('header', 'motion-ticker-header');
  const backButton = button('motion-icon-button', 'Back from ticker', back); backButton.dataset.back = '';
  backButton.append(icon('onboarding-arrow-left-l1.svg'));
  const identity = el('div', 'motion-ticker-identity');
  const person = el('div', 'motion-person');
  person.append(el('span', 'motion-name', ticker.name));
  const meta = el('div', 'motion-ticker-meta');
  meta.append(el('span', 'motion-ticker-symbol', ticker.symbol), ' · ' + ticker.market);
  person.append(meta); identity.append(image(ticker.logo, 'motion-ticker-logo'), person);
  const watch = button('motion-icon-button', '', () => {
    watched.has(ticker.symbol) ? watched.delete(ticker.symbol) : watched.add(ticker.symbol);
    document.querySelectorAll(`[data-watch="${ticker.symbol}"]`).forEach(paintWatch);
  });
  watch.dataset.watch = ticker.symbol;
  function paintWatch(node) {
    const on = watched.has(ticker.symbol);
    node.setAttribute('aria-label', (on ? 'Unfollow ' : 'Follow ') + ticker.symbol);
    node.setAttribute('aria-pressed', String(on));
    node.replaceChildren(icon(on ? 'ui-star-f.svg' : 'ui-star-l.svg'));
  }
  paintWatch(watch);
  const shareButton = button('motion-icon-button', 'Share ticker', () => share(ticker));
  shareButton.append(icon('thesis/profile-imgShareL.svg'));
  header.append(backButton, identity, watch, shareButton);
  const tabs = el('nav', 'motion-detail-tabs motion-ticker-tabs');
  tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Company sections');
  ['Overview', 'About', 'Thesis', 'Earnings', 'Smart Money', 'Anomalies'].forEach(label => {
    const tab = button('', label); tab.textContent = label; tab.setAttribute('role', 'tab');
    const selected = label === 'Thesis'; tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected) { tab.id = root.id + '-thesis'; tab.setAttribute('aria-controls', root.id + '-theses'); }
    else tab.setAttribute('aria-disabled', 'true');
    tabs.append(tab);
  });
  const scroll = el('div', 'motion-ticker-scroll');
  scroll.id = root.id + '-theses'; scroll.setAttribute('role', 'tabpanel'); scroll.setAttribute('aria-labelledby', root.id + '-thesis');
  const posts = POSTS.filter(post => post.tickers.some(item => item.symbol === ticker.symbol));
  scroll.append(...posts.map(post => postCard(post, false)));
  scroll.addEventListener('scroll', settle, { passive: true });
  surface.append(header, tabs, scroll); root.append(surface);
}
