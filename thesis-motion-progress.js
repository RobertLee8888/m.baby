// Shared timing and velocity continuity for card, profile and ticker navigation.
const timing = { near: 240, far: 280, retarget: 200, short: 120, easing: 'cubic-bezier(.4,0,.2,1)' };
const registered = new Set();

export class ProgressTransition {
  constructor(target, property) {
    this.target = target;
    this.property = property.replace('-progress', '-phase');
    this.progressProperty = property;
    this.opened = false;
    this.running = false;
    this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    if (CSS.registerProperty) {
      [property, this.property].forEach(name => {
        if (registered.has(name)) return;
        CSS.registerProperty({ name, syntax: '<number>', inherits: true, initialValue: '1' });
        registered.add(name);
      });
    }
    const phase = `var(${this.property})`;
    target.style.setProperty(property, `calc(${phase} + var(--travel-advance, 0) * ${phase} * (1 - ${phase}))`);
  }

  setDistance(distance) {
    this.duration = distance <= 160 ? timing.near : timing.far;
    // Longer paths cover more ground early without changing the shared clock.
    // The same monotonic mapping runs backwards when navigation is reversed.
    this.target.style.setProperty('--travel-advance', .8 * Math.max(0, Math.min(1, (distance - 160) / 400)));
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
      left: (visible.left - page.left) / scale, radius: parseFloat(getComputedStyle(source).borderTopLeftRadius) || 0 };
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
      // Preserve the tangent, with enough room to brake inside the 0..1 path.
      const room = current.velocity > 0 ? 1 - from : from;
      const x = Math.min(.2, room / (2 * Math.abs(current.velocity) * duration));
      const y = current.velocity * duration * x / (to - from);
      easing = `cubic-bezier(${x},${y},.2,1)`;
    }
    const previous = this.animation;
    const animation = this.target.animate([
      { [this.property]: from }, { [this.property]: to },
    ], { duration, easing, fill: 'both' });
    this.animation = animation;
    this.from = from; this.to = to;
    previous?.cancel();
    animation.finished.then(() => {
      if (this.animation === animation) this.finish();
    }).catch(error => { if (error.name !== 'AbortError') throw error; });
  }

  settle() { if (this.running) this.finish(); }
}
