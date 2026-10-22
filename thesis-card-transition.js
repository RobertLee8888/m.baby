// One progress value expands the card surface and its normal-flow layout.
// Text uses two fixed line wraps within that layout; no per-element flights.
import { ProgressTransition } from './thesis-motion-progress.js?v=6';

export class CardTransition extends ProgressTransition {
  constructor({ app, feed, detail, onSettled }) {
    super(detail, '--thesis-progress');
    Object.assign(this, { app, feed, detail, onSettled });
    this.targets = [];
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
    this.opened = open;
    this.source = source;
    const { feed, detail, app } = this;
    detail.hidden = false;
    detail.inert = false;
    feed.inert = true;
    feed.setAttribute('aria-hidden', 'true');
    this.running = true;
    detail.dataset.transition = open ? 'opening' : 'closing';

    if (this.reduceMotion.matches || !CSS.registerProperty) {
      this.finish();
      return;
    }
    this.prepareDepth();
    const sourceRect = source.getBoundingClientRect();
    const detailRect = detail.getBoundingClientRect();
    const viewport = source.closest('.motion-feed-scroll, .motion-profile-scroll, .motion-ticker-scroll, .motion-detail-scroll').getBoundingClientRect();
    const scale = app.getBoundingClientRect().width / app.offsetWidth;
    const offset = (sourceRect.top - detailRect.top) / scale;
    const clipTop = Math.max(0, (viewport.top - sourceRect.top) / scale);
    const visibleBottom = Math.min(sourceRect.bottom, viewport.bottom);
    const clipBottom = Math.max(0, detailRect.height / scale - (visibleBottom - sourceRect.top) / scale);
    detail.style.setProperty('--card-offset', offset + 'px');
    detail.style.setProperty('--card-clip-top', clipTop + 'px');
    detail.style.setProperty('--card-clip-bottom', clipBottom + 'px');

    const copy = source.cloneNode(true);
    copy.classList.add('motion-card-copy');
    copy.removeAttribute('data-post');
    copy.setAttribute('aria-hidden', 'true');
    copy.inert = true;
    copy.querySelectorAll('[data-shared]').forEach(node => {
      node.dataset.motionShared = node.dataset.shared;
      delete node.dataset.shared;
    });
    const sourceIdentity = source.querySelector('.motion-identity');
    const targetIdentity = detail.querySelector('.motion-detail-header > .motion-identity');
    const distance = Math.abs(sourceIdentity.getBoundingClientRect().top - targetIdentity.getBoundingClientRect().top) / scale;
    this.setDistance(distance);
    // The shared content bends inward, then approaches its header alignment
    // vertically. Short or nearly horizontal moves need less curvature.
    copy.style.setProperty('--card-bend', Math.min(1, distance / 96));
    copy.style.setProperty('--identity-width', sourceIdentity.offsetWidth + 'px');
    copy.style.setProperty('--identity-height', sourceIdentity.offsetHeight + 'px');
    copy.style.setProperty('--identity-height-delta', targetIdentity.offsetHeight - sourceIdentity.offsetHeight + 'px');
    copy.style.setProperty('--identity-width-delta', targetIdentity.getBoundingClientRect().width / scale - sourceIdentity.offsetWidth + 'px');
    copy.style.setProperty('--identity-age-space', (sourceIdentity.querySelector('.motion-age')?.getBoundingClientRect().width || 0) / scale + 8 + 'px');
    const date = detail.querySelector('.motion-date').cloneNode(true);
    date.classList.add('motion-card-date');
    copy.querySelector('.motion-identity').after(date);
    const body = copy.querySelector('.motion-body');
    const sourceBody = source.querySelector('.motion-body');
    const targetBody = detail.querySelector('.motion-timeline > .motion-body');
    const oldRect = sourceBody.getBoundingClientRect(), newRect = targetBody.getBoundingClientRect();
    body.style.setProperty('--body-from-height', oldRect.height / scale + 'px');
    body.style.setProperty('--body-height-delta', (newRect.height - oldRect.height) / scale + 'px');
    const oldWrap = document.createElement('div');
    oldWrap.className = 'motion-body-wrap from';
    oldWrap.style.width = oldRect.width / scale + 'px';
    oldWrap.append(...body.childNodes);
    const newWrap = document.createElement('div');
    newWrap.className = 'motion-body-wrap to';
    newWrap.style.width = newRect.width / scale + 'px';
    newWrap.append(...[...targetBody.childNodes].map(node => node.cloneNode(true)));
    body.append(oldWrap, newWrap);
    detail.append(copy);
    this.copy = copy;
    for (const selector of ['.motion-tickers', '.motion-charts']) {
      const original = source.querySelector(selector), cloned = copy.querySelector(selector);
      const target = detail.querySelector('.motion-timeline ' + selector);
      if (!original || !cloned) continue;
      const gallery = document.createElement('div');
      gallery.className = 'motion-gallery-copy';
      gallery.style.setProperty('--gallery-offset', original.scrollLeft - (target?.scrollLeft || 0) + 'px');
      gallery.append(...cloned.childNodes);
      cloned.append(gallery);
      cloned.scrollLeft = original.scrollLeft;
    }

    // A scrolled detail returns as a whole viewport. Never reset its scroll to
    // reconstruct the first screen, or disturb the original feed's galleries.
    const scrolledReturn = !open && detail.querySelector('.motion-detail-scroll').scrollTop > 0;
    detail.classList.toggle('is-scrolled-return', scrolledReturn);
    if (!scrolledReturn) {
      detail.querySelectorAll('.motion-detail-header > .motion-identity, .motion-timeline > .motion-date, .motion-timeline > .motion-tickers, .motion-timeline > .motion-body, .motion-timeline > .motion-charts').forEach(node => {
        this.targets.push({ node, visibility: node.style.visibility });
        node.style.visibility = 'hidden';
      });
    }
    source.style.visibility = 'hidden';
    detail.classList.add('is-morphing');
    this.animateTo(open);
  }

  finish() {
    this.animation?.cancel();
    this.animation = null;
    this.finishDepth();
    this.copy?.remove();
    this.copy = null;
    this.targets.forEach(({ node, visibility }) => { node.style.visibility = visibility; });
    this.targets = [];
    this.running = false;
    this.detail.classList.remove('is-morphing', 'is-scrolled-return');
    this.detail.hidden = !this.opened;
    this.detail.inert = !this.opened;
    this.detail.dataset.transition = this.opened ? 'open' : 'closed';
    this.feed.inert = this.opened;
    this.feed.setAttribute('aria-hidden', String(this.opened));
    this.source.style.visibility = '';
    this.onSettled(this.opened, this.source);
  }
}
