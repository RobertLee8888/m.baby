/* One source object drives both the feed quotation and the Sources sheet. */
'use strict';
window.createAlvaSources = function ({ el, img, btn, icon, onOpen, siteFor }) {

  function destination(source) {
    try {
      const url = new URL(source.url);
      return /^https?:$/.test(url.protocol) ? url : null;
    } catch { return null; }
  }

  function sourceMedia(media, compact) {
    const link = el('a', 'source-media' + (compact ? ' source-media-compact' : ''));
    link.href = media.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', media.type === 'video' ? 'Play source video' : 'Open source image');
    if (!compact && media.sourceAspectRatio) link.style.aspectRatio = media.sourceAspectRatio;
    const poster = img(media.poster);
    poster.alt = media.alt || '';
    link.appendChild(poster);
    if (media.type === 'video') {
      const play = el('span', 'source-play');
      play.appendChild(icon('source-play-f.svg'));
      link.appendChild(play);
    }
    return link;
  }

  function identity(source, compact) {
    const head = el('div', compact ? 'quote-head' : 'src-head');
    const who = el('div', compact ? 'quote-who' : 'src-who');
    who.appendChild(img(source.img, compact ? 'quote-avatar' : 'src-avatar'));
    const byline = el('div', compact ? 'quote-id' : 'src-id');
    byline.appendChild(el('span', compact ? 'quote-name' : 'src-name', compact ? source.attribution || source.name : source.name));
    const subtitle = source.role || (compact ? source.handle && source.badge ? source.handle : '' : source.handle);
    if (subtitle) byline.appendChild(el('span', compact ? 'quote-role' : 'src-handle', subtitle));
    who.appendChild(byline);
    head.appendChild(who);
    if (!compact && source.time) head.appendChild(el('span', 'src-time', source.time));
    return head;
  }

  function quote(source, card, depth = 0) {
    const container = el('div', depth ? 'quote-nested' : 'quote');
    container.dataset.sourceId = source.id || source.name;
    const copy = btn('quote-copy', 'Sources: ' + source.name);
    copy.appendChild(identity(source, true));
    const text = source.summary !== undefined ? source.summary : source.quote;
    copy.addEventListener('click', () => onOpen(card, source));
    container.appendChild(copy);
    const body = el('p', 'quote-body', source.preview || text);
    body.addEventListener('click', () => onOpen(card, source));
    if (text) container.appendChild(body);
    if (source.preview) {
      const more = btn('quote-more', 'Show more');
      more.textContent = 'Show more';
      more.setAttribute('aria-expanded', 'false');
      more.addEventListener('click', event => {
        event.stopPropagation();
        const before = body.offsetHeight;
        body.textContent = text;
        const after = body.offsetHeight;
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          body.animate([{ height: before + 'px', overflow: 'hidden' }, { height: after + 'px', overflow: 'hidden' }], { duration: 200, easing: 'ease-out' });
        }
        more.remove();
        copy.focus({ preventScroll: true });
      });
      body.append(' ', more);
    }
    if (source.media) container.appendChild(sourceMedia(source.media, true));
    if (source.reference) container.appendChild(quote(source.reference, card, depth + 1));
    return container;
  }

  function row(source, depth = 0) {
    const item = el('article', depth ? 'src src-nested' : 'src');
    item.dataset.sourceId = source.id || source.name;
    item.appendChild(identity(source, false));
    const body = el('div', 'src-body');
    if (source.quote) body.appendChild(el('p', 'src-quote', source.quote));
    if (!depth) {
      const url = destination(source);
      const site = url ? url.hostname.replace(/^www\./, '') : siteFor(source);
      if (site) {
        // Legacy excerpts without an original URL do not pretend to be links.
        const link = el(url ? 'a' : 'span', 'src-open');
        link.appendChild(el('span', null, site));
        if (url) {
          link.href = url.href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.appendChild(icon('ui-popout-l.svg'));
        }
        body.appendChild(link);
      }
    }
    if (body.childElementCount) item.appendChild(body);
    if (source.media) item.appendChild(sourceMedia(source.media, false));
    if (source.reference) item.appendChild(row(source.reference, depth + 1));
    return item;
  }

  return { quote, row };
};
