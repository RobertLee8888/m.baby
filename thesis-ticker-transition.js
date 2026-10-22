import { ProgressTransition } from './thesis-motion-progress.js?v=6';

// The entire company identity travels with the chip, including incoming labels.
export class TickerTransition extends ProgressTransition {
  constructor({ app, feed, detail, onSettled }) {
    super(detail, '--ticker-progress');
    Object.assign(this, { app, feed, detail, onSettled });
    this.hiddenNodes = [];
  }

  setOpen(open, source) {
    if (this.running) {
      if (open !== this.opened) {
        this.opened = open;
        this.detail.dataset.transition = open ? 'opening' : 'closing';
        this.animateTo(open, this.sampleMotion());
      }
      return;
    }
    this.opened = open; this.running = true; this.source = source;
    const { app, feed, detail } = this;
    detail.hidden = false; detail.inert = false;
    feed.inert = true; feed.setAttribute('aria-hidden', 'true');
    detail.dataset.transition = open ? 'opening' : 'closing';
    this.setDistance(0);
    if (this.reduceMotion.matches || !CSS.registerProperty) { this.finish(); return; }
    this.prepareDepth();
    const fromLogo = source?.querySelector('.motion-ticker-logo');
    if (fromLogo) {
      const scale = app.getBoundingClientRect().width / app.offsetWidth;
      const page = detail.getBoundingClientRect();
      const bounds = node => {
        const r = node.getBoundingClientRect();
        return { x: (r.x - page.x) / scale, y: (r.y - page.y) / scale, w: r.width / scale, h: r.height / scale };
      };
      const toLogo = detail.querySelector('.motion-ticker-logo');
      const fromSymbol = source.querySelector('.motion-ticker-symbol'), toSymbol = detail.querySelector('.motion-ticker-symbol');
      const toPerson = toSymbol.closest('.motion-person');
      const a = bounds(fromLogo), b = bounds(toLogo), c = bounds(fromSymbol), d = bounds(toSymbol.parentElement), chip = bounds(source);
      const personBounds = bounds(toPerson), nameBounds = bounds(toPerson.querySelector('.motion-name'));
      const marketRange = document.createRange();
      marketRange.setStartAfter(toSymbol); marketRange.setEnd(toSymbol.parentElement, toSymbol.parentElement.childNodes.length);
      const marketWidth = marketRange.getBoundingClientRect().width / scale;
      this.contain(source, fromLogo, toLogo, scale);
      this.setDistance(Math.hypot(b.x - a.x, b.y - a.y));
      const copy = document.createElement('div'); copy.className = 'motion-ticker-anchor';
      copy.inert = true; copy.setAttribute('aria-hidden', 'true');
      const shell = document.createElement('div'); shell.className = 'motion-ticker-shell';
      const person = document.createElement('div'); person.className = 'motion-ticker-anchor-person';
      const name = toPerson.querySelector('.motion-name').cloneNode(true);
      const meta = toSymbol.parentElement.cloneNode(true); meta.className = 'motion-ticker-anchor-meta';
      const market = document.createElement('span'); market.className = 'motion-ticker-market';
      market.append(...[...meta.childNodes].slice(1)); meta.append(market);
      const trend = source.querySelector('.motion-trend');
      if (trend) person.append(trend.cloneNode(true));
      person.append(name, meta);
      copy.append(shell, fromLogo.cloneNode(true), person);
      const vars = { x: a.x, y: b.y, dx: b.x - a.x, size: a.w, ds: b.w - a.w,
        tx: c.x - a.x, ty: c.y - a.y, dtx: d.x - b.x - c.x + a.x, dty: d.y - b.y - c.y + a.y,
        nameY: nameBounds.y - d.y, textWidth: personBounds.w, symbolWidth: c.w, marketWidth,
        sx: chip.x - a.x, sy: chip.y - a.y, sw: chip.w, sh: chip.h,
        dw: personBounds.x + personBounds.w - b.x - chip.w, dh: personBounds.h - chip.h,
        bend: Math.min(8, Math.abs(b.y - a.y) / 12),
      };
      Object.entries(vars).forEach(([key, value]) => copy.style.setProperty('--t-' + key, value + 'px'));
      [source, toLogo, toPerson].forEach(node => { this.hiddenNodes.push([node, node.style.visibility]); node.style.visibility = 'hidden'; });
      detail.append(copy); this.copy = copy;
    }
    detail.classList.add('is-ticker-moving'); this.animateTo(open);
  }

  finish() {
    this.animation?.cancel(); this.animation = null;
    this.finishDepth();
    this.copy?.remove(); this.copy = null;
    this.hiddenNodes.forEach(([node, visibility]) => { node.style.visibility = visibility; }); this.hiddenNodes = [];
    this.running = false; this.detail.classList.remove('is-ticker-moving');
    this.clearContainer();
    this.detail.hidden = !this.opened; this.detail.inert = !this.opened;
    this.detail.dataset.transition = this.opened ? 'open' : 'closed';
    this.feed.inert = this.opened; this.feed.setAttribute('aria-hidden', String(this.opened));
    this.onSettled(this.opened, this.source);
  }
}
