import { ProgressTransition } from './thesis-motion-progress.js?v=6';

// History is a navigation level, so move one complete page on the same clock
// as the existing depth effect. Its caller's scroll position never changes.
export class PageTransition extends ProgressTransition {
  constructor({ feed, detail, onSettled }) {
    super(detail, '--page-progress');
    Object.assign(this, { feed, detail, onSettled });
    this.setDistance(0);
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
    this.detail.hidden = false; this.detail.inert = false;
    this.detail.dataset.transition = open ? 'opening' : 'closing';
    this.feed.inert = true; this.feed.setAttribute('aria-hidden', 'true');
    if (this.reduceMotion.matches || !CSS.registerProperty) { this.finish(); return; }
    this.prepareDepth();
    this.detail.classList.add('is-page-moving');
    this.animateTo(open);
  }

  finish() {
    this.animation?.cancel(); this.animation = null;
    this.finishDepth(); this.running = false;
    this.detail.classList.remove('is-page-moving');
    this.detail.hidden = !this.opened; this.detail.inert = !this.opened;
    this.detail.dataset.transition = this.opened ? 'open' : 'closed';
    this.feed.inert = this.opened; this.feed.setAttribute('aria-hidden', String(this.opened));
    this.onSettled(this.opened, this.source);
  }
}
