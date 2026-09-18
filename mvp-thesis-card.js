import { THESIS_ASSETS as assets } from './mvp-thesis-assets.js';
import { createPreviewLayout, summaryPreview } from './mvp-thesis-preview.js';
import { thesisMedia } from './mvp-thesis-media.js';

export function createThesisCard(ui) {
  const { el, img, btn, icon, identity, stockLogo, stateFor, bind, update, openTicker, openSources, openDetail, ask } = ui;
  const glyph = path => icon(path.replace(/^assets\//, ''));
  function sourceParagraph(card, { attributed = false } = {}) {
    const row = el('p', 'thesis-sources');
    const domains = new Map();
    function add(source) {
      const raw = source.url || source.media?.url;
      if (raw) { try {
        const domain = new URL(raw).hostname.replace(/^www\./, '');
        if (!domains.has(domain)) domains.set(domain, source.name);
      } catch { /* Not a web source. */ } }
      if (source.reference) add(source.reference);
    }
    card.sources.forEach(add);
    for (const [domain, name] of domains) {
      const link = btn('thesis-source-link', 'Sources: ' + domain);
      const label = attributed && name ? name + ' on ' + (domain === 'x.com' ? 'X' : domain) : domain;
      link.append(el('span', null, label), ' ', el('span', 'thesis-source-arrow', '\u{1F855}'));
      link.addEventListener('click', () => openSources(card)); row.append(link, ' ');
    }
    return row;
  }
  const preview = createPreviewLayout({ el, sourceParagraph });
  function typeTag(type = 'New thesis') {
    return el('span', 'thesis-type ' + ({ 'New thesis': 'is-new', 'Thesis update': 'is-update', Archived: 'is-archived' }[type]), type);
  }
  function footer(card) {
    const row = el('div', 'thesis-actions');
    const askButton = btn('thesis-action', 'Ask Alva');
    askButton.append(glyph(assets['first-card'].imgChatAiL), el('span', null, 'Ask Alva'));
    askButton.addEventListener('click', () => ask(card, 'Ask Alva'));
    const save = btn('thesis-action thesis-bookmark', 'Bookmark');
    bind(card, save, () => {
      const bookmarked = stateFor(card).bookmarked;
      save.setAttribute('aria-pressed', String(bookmarked));
      const base = Number(card.social.counts[2]);
      const count = base + Number(bookmarked) - Number(['P07', 'S07'].includes(card.social.key));
      save.replaceChildren(bookmarked ? icon('ui-bookmark-f.svg') : glyph(assets['first-card'].imgBookmarkL), el('span', null, String(count)));
    });
    save.addEventListener('click', () => { stateFor(card).bookmarked = !stateFor(card).bookmarked; update(card); });
    row.append(askButton, save); return row;
  }
  function content(card, { full = false, compact = false, detail = false } = {}) {
    const wrap = el('div', 'thesis-content' + (compact ? ' thesis-compact' : '') + (full ? ' thesis-full' : ''));
    const source = card.sources[0];
    wrap.dataset.thesis = card.social.key;
    wrap.dataset.generationMode = card.social.generationMode || 'auto';
    if (!detail) wrap.append(identity({ ...source, role: compact ? '' : source.role, handle: compact ? '' : source.handle }, card.social.age), typeTag(card.social.thesisType));
    const body = el(full ? 'div' : 'button', 'thesis-body');
    if (!full) { body.type = 'button'; body.setAttribute('aria-label', 'Open thesis'); body.addEventListener('click', () => openDetail(card)); }
    const paragraphs = full || card.social.generationMode === 'manual' ? card.social.paragraphs || card.social.statements : [summaryPreview(card.social.statements[0])];
    paragraphs.forEach(text => body.append(el('p', null, text)));
    wrap.append(body);
    if (full) wrap.append(sourceParagraph(card, { attributed: detail }));
    if (!compact && card.social.charts?.length) {
      const charts = el('div', 'thesis-charts'); charts.setAttribute('aria-label', 'Ticker charts');
      card.social.charts.forEach((src, index) => {
        const ticker = card.tickers[index];
        const chart = btn('thesis-chart', (ticker?.sym || 'Ticker') + ' chart');
        const picture = img(src); picture.width = 240; picture.height = 135; picture.alt = (ticker?.sym || '') + ' price history';
        chart.append(picture); chart.addEventListener('click', () => ticker && openTicker(ticker)); charts.append(chart);
      });
      wrap.append(charts);
    }
    if (!compact && card.social.media?.length) wrap.append(thesisMedia(ui, card.social.media));
    if (card.tickers.length) {
      const tickers = el('div', 'thesis-tickers');
      card.tickers.forEach(ticker => {
        if (ticker.interactive === false) {
          const tag = el('span', 'social-ticker thesis-static-ticker');
          if (ticker.logo) tag.append(stockLogo(ticker, 'social-stock-logo'));
          tag.append(el('span', null, ticker.sym)); tickers.append(tag);
        } else {
          const tag = btn('social-ticker', ticker.sym + ' details'); tag.append(stockLogo(ticker, 'social-stock-logo'), el('span', null, ticker.sym));
          tag.addEventListener('click', () => openTicker(ticker)); tickers.append(tag);
        }
      });
      wrap.append(tickers);
    }
    if (!compact && !full) wrap.append(footer(card));
    if (!full && card.social.generationMode === 'manual') { wrap.dataset.previewReady = 'false'; preview.attach(wrap, card); }
    return wrap;
  }
  return { content, footer, sourceParagraph, typeTag, preview };
}
