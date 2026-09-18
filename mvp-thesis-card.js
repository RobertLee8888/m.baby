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
  function evidenceFooter(card) {
    const row = el('nav', 'thesis-evidence-actions');
    row.setAttribute('aria-label', 'Thesis actions');
    const askButton = btn('thesis-evidence-action', 'Ask Alva about this thesis');
    askButton.append(glyph(assets['first-card'].imgChatAiL));
    askButton.addEventListener('click', () => ask(card, 'Ask Alva'));
    const save = btn('thesis-evidence-action thesis-evidence-save', 'Save this thesis');
    bind(card, save, () => {
      const bookmarked = stateFor(card).bookmarked;
      save.setAttribute('aria-pressed', String(bookmarked));
      save.replaceChildren(bookmarked ? icon('ui-bookmark-f.svg') : glyph(assets['first-card'].imgBookmarkL));
    });
    save.addEventListener('click', () => { stateFor(card).bookmarked = !stateFor(card).bookmarked; update(card); });
    row.append(askButton, save);
    return row;
  }
  function evidenceContent(card) {
    const source = card.sources[0];
    const wrap = el('div', 'thesis-content thesis-evidence');
    wrap.dataset.thesis = card.social.key;
    wrap.dataset.generationMode = card.social.generationMode || 'auto';
    wrap.dataset.previewReady = 'true';
    const head = identity(source, card.social.age);
    head.classList.add('thesis-evidence-identity');
    const main = el('div', 'thesis-evidence-main');
    const text = (card.social.paragraphs || card.social.statements || [''])[0];
    const body = btn('thesis-body thesis-evidence-open', 'Read ' + card.tickers.map(ticker => ticker.sym).join(', ') + ' thesis');
    const excerpt = el('p', 'thesis-evidence-excerpt', text);
    const canExpand = text.length > 180;
    if (canExpand) excerpt.classList.add('is-clamped');
    body.append(excerpt);
    body.addEventListener('click', () => openDetail(card));
    main.append(body);
    if (canExpand) {
      const more = btn('thesis-evidence-more', 'Show more thesis by ' + source.name);
      more.textContent = 'Show more';
      more.setAttribute('aria-expanded', 'false');
      more.addEventListener('click', () => {
        const before = excerpt.offsetHeight;
        excerpt.classList.remove('is-clamped');
        const after = excerpt.scrollHeight;
        more.setAttribute('aria-expanded', 'true');
        more.remove();
        if (before !== after && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
          excerpt.animate([
            { height: before + 'px', overflow: 'hidden' },
            { height: after + 'px', overflow: 'hidden' },
          ], { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
        }
      });
      main.append(more);
    }
    main.append(el('p', 'thesis-evidence-note', card.social.researchType));
    const links = el('div', 'thesis-evidence-sources');
    card.social.sourceLinks.forEach((url, index) => {
      const link = el('a');
      link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.textContent = 'Source ' + (index + 1) + ' \u2197';
      links.append(link);
    });
    main.append(links);
    if (card.tickers.length) {
      const tickers = el('div', 'thesis-evidence-tickers');
      card.tickers.forEach(ticker => {
        const tag = el('span', 'thesis-evidence-ticker');
        tag.append('$' + ticker.sym);
        if (ticker.evidenceLabel) tag.append(el('small', null, ticker.evidenceLabel));
        tickers.append(tag);
      });
      main.append(tickers);
    }
    if (card.social.proxyNote) main.append(el('p', 'thesis-evidence-proxy', card.social.proxyNote));
    main.append(evidenceFooter(card));
    wrap.append(head, main);
    return wrap;
  }
  function content(card, { full = false, compact = false, detail = false } = {}) {
    if (card.social.evidenceStyle && !full && !compact) return evidenceContent(card);
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
        if (ticker.interactive === false || !ticker.logo) {
          const tag = el('span', 'social-ticker thesis-static-ticker');
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
