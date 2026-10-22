// Shared timing and velocity continuity for card and profile navigation.
const timing = { near: 240, far: 280, retarget: 200, short: 120, easing: 'cubic-bezier(.4,0,.2,1)' };
const registered = new Set();

export class ProgressTransition {
  constructor(target, property) {
    this.target = target;
    this.property = property;
    this.opened = false;
    this.running = false;
    this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    if (CSS.registerProperty && !registered.has(property)) {
      CSS.registerProperty({ name: property, syntax: '<number>', inherits: true, initialValue: '1' });
      registered.add(property);
    }
  }

  setDistance(distance) { this.duration = distance <= 160 ? timing.near : timing.far; }

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
