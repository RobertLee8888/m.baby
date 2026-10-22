// One progress value expands the card surface and its normal-flow layout.
// Text uses two fixed line wraps within that layout; no per-element flights.
const progressProperty = '--thesis-progress';
// Alva motion roles: enter-large, sheet, layout and micro feedback.
const timing = { near: 240, far: 280, retarget: 200, short: 120, easing: 'cubic-bezier(.4,0,.2,1)' };
if (CSS.registerProperty) {
  CSS.registerProperty({ name: progressProperty, syntax: '<number>', inherits: true, initialValue: '1' });
}

export class CardTransition {
  constructor({ app, feed, detail, onSettled }) {
    Object.assign(this, { app, feed, detail, onSettled });
    this.opened = false;
    this.running = false;
    this.targets = [];
    this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
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
    const sourceRect = source.getBoundingClientRect();
    const detailRect = detail.getBoundingClientRect();
    const viewport = source.parentElement.parentElement.getBoundingClientRect();
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
    this.duration = distance <= 160 ? timing.near : timing.far;
    // The shared content bends inward, then approaches its header alignment
    // vertically. Short or nearly horizontal moves need less curvature.
    copy.style.setProperty('--card-bend', Math.min(1, distance / 96));
    copy.style.setProperty('--identity-width', sourceIdentity.offsetWidth + 'px');
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

  sampleMotion() {
    const animation = this.animation;
    const time = Number(animation.currentTime) || 0;
    animation.pause();
    animation.currentTime = time;
    const value = () => this.from + (this.to - this.from) * (animation.effect.getComputedTiming().progress || 0);
    const current = value();
    const step = Math.min(1, time);
    animation.currentTime = time - step;
    const velocity = step ? (current - value()) / step : 0;
    animation.currentTime = time;
    return { value: current, velocity };
  }

  animateTo(open, current) {
    const from = current?.value ?? (open ? 0 : 1), to = open ? 1 : 0;
    const remaining = Math.abs(to - from);
    if (remaining < .0001) { this.finish(); return; }
    const duration = !current || remaining > .65 ? this.duration
      : remaining > .25 ? timing.retarget : timing.short;
    let easing = timing.easing;
    if (current && Math.abs(current.velocity) > .000001) {
      // Match the previous tangent: slope = velocity * duration / distance.
      // Bound the first control point so braking cannot leave the 0..1 path.
      const room = current.velocity > 0 ? 1 - from : from;
      const x = Math.min(.2, room / (2 * Math.abs(current.velocity) * duration));
      const y = current.velocity * duration * x / (to - from);
      easing = `cubic-bezier(${x},${y},.2,1)`;
    }
    const previous = this.animation;
    const animation = this.detail.animate([
      { [progressProperty]: from }, { [progressProperty]: to },
    ], {
      duration, easing, fill: 'both',
    });
    this.animation = animation;
    this.from = from; this.to = to;
    previous?.cancel();
    animation.finished.then(() => {
      if (this.animation === animation) this.finish();
    }).catch(error => {
      if (error.name !== 'AbortError') throw error;
    });
  }

  finish() {
    this.animation?.cancel();
    this.animation = null;
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

  settle() {
    if (this.running) this.finish();
  }
}
