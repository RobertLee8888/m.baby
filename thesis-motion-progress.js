// Shared timing and velocity continuity for card, profile and ticker navigation.
const timing = { near: 340, far: 380, retarget: 220, short: 140, corners: 80, easing: 'cubic-bezier(.22,.75,.3,1)' };
const registered = new Set();

export class ProgressTransition {
  constructor(target, property) {
    this.target = target;
    this.driver = target.parentElement;
    this.property = '--navigation-phase';
    this.progressProperty = property;
    this.opened = false;
    this.running = false;
    this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    if (CSS.registerProperty) {
      [property, this.property, '--navigation-progress', '--navigation-roundness'].forEach(name => {
        if (registered.has(name)) return;
        CSS.registerProperty({ name, syntax: '<number>', inherits: true, initialValue: '1' });
        registered.add(name);
      });
    }
    this.driver.style.setProperty('--navigation-progress', `var(${this.property})`);
    target.style.setProperty(property, 'var(--navigation-progress)');
  }

  setDistance(distance) {
    this.duration = distance <= 160 ? timing.near : timing.far;
  }

  // Measure the source in its resting geometry before applying depth again.
  // This happens within the same task, including when a recessed page returns.
  prepareDepth() { this.feed.classList.remove('is-depth-underlay', 'is-recessed'); }

  finishDepth() {
    this.feed.classList.remove('is-depth-underlay');
    this.feed.classList.toggle('is-recessed', this.opened && !this.reduceMotion.matches && Boolean(CSS.registerProperty));
  }

  contain(source, fromAnchor, toAnchor, scale) {
    const page = this.target.getBoundingClientRect(), entry = source.getBoundingClientRect();
    const travel = (fromAnchor.getBoundingClientRect().y - toAnchor.getBoundingClientRect().y) / scale;
    const visible = { top: Math.max(page.top, entry.top), right: Math.min(page.right, entry.right),
      bottom: Math.min(page.bottom, entry.bottom), left: Math.max(page.left, entry.left) };
    for (const selector of ['.motion-feed-scroll, .motion-profile-scroll, .motion-ticker-scroll, .motion-detail-scroll', '.motion-tickers']) {
      const viewport = source.closest(selector)?.getBoundingClientRect();
      if (!viewport) continue;
      visible.top = Math.max(visible.top, viewport.top); visible.bottom = Math.min(visible.bottom, viewport.bottom);
      visible.left = Math.max(visible.left, viewport.left); visible.right = Math.min(visible.right, viewport.right);
    }
    const values = { y: travel, top: (visible.top - page.top) / scale - travel,
      right: (page.right - visible.right) / scale, bottom: (page.bottom - visible.bottom) / scale + travel,
      left: (visible.left - page.left) / scale };
    Object.entries(values).forEach(([key, value]) => this.target.style.setProperty('--container-' + key, value + 'px'));
    this.target.style.setProperty('--container-progress', `var(${this.progressProperty})`);
    this.target.classList.add('is-container-transform');
  }

  clearContainer() { this.target.classList.remove('is-container-transform'); }

  sampleMotion() {
    const animation = this.animation;
    const time = Number(animation.currentTime) || 0;
    animation.pause();
    animation.currentTime = time;
    // Read the geometry track, which rests at 1 during the final corner phase.
    const value = () => Number(getComputedStyle(this.driver).getPropertyValue(this.property));
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
      // Preserve the tangent, with enough room to brake inside the 0..1 path.
      const room = current.velocity > 0 ? 1 - from : from;
      const x = Math.min(.2, room / (2 * Math.abs(current.velocity) * duration));
      const y = current.velocity * duration * x / (to - from);
      easing = `cubic-bezier(${x},${y},.2,1)`;
    }
    const previous = this.animation;
    const total = duration + (open ? timing.corners : 0);
    const frames = [
      { [this.property]: from, '--navigation-roundness': 1, offset: 0, easing },
      { [this.property]: to, '--navigation-roundness': 1, offset: duration / total, easing: timing.easing },
    ];
    // Geometry arrives first. Only the corners change in the last 80 ms;
    // closing restores the full radius immediately, before any displacement.
    if (open) frames.push({ [this.property]: to, '--navigation-roundness': 0, offset: 1 });
    const animation = this.driver.animate(frames, { duration: total, fill: 'both' });
    this.animation = animation;
    this.feed.classList.add('is-depth-underlay');
    previous?.cancel();
    animation.finished.then(() => {
      if (this.animation === animation) this.finish();
    }).catch(error => { if (error.name !== 'AbortError') throw error; });
  }

  settle() { if (this.running) this.finish(); }
}
