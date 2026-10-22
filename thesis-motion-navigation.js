// Keep the original screens mounted so scroll, tabs and gallery positions
// survive nested profile/detail navigation and browser Back/Forward.
export class MotionNavigation {
  constructor({ create, parse }) {
    this.create = create; this.parse = parse;
    this.frames = []; this.routes = [];
    this.pendingBack = false;
    window.addEventListener('popstate', () => {
      this.pendingBack = false;
      this.routes = history.state?.routes || this.parse(location.hash);
      this.reconcile();
    });
  }

  get current() { return this.frames.at(-1); }
  settle() { this.current?.transition.settle(); }

  open(route, source, push = true) {
    if (this.current?.route.key === route.key) return;
    this.settle();
    this.routes = [...this.frames.map(frame => frame.route), route];
    this.nextSource = source;
    if (push) history.pushState({ routes: this.routes, depth: (history.state?.depth || 0) + 1 }, '', route.hash);
    this.reconcile();
  }

  back() {
    if (!this.current || this.pendingBack) return;
    if (history.state?.depth) { this.pendingBack = true; history.back(); }
    else {
      this.routes = this.frames.slice(0, -1).map(frame => frame.route);
      history.replaceState({ routes: this.routes, depth: 0 }, '', this.routes.at(-1)?.hash || location.pathname + location.search);
      this.reconcile();
    }
  }

  backTo(key) {
    const index = this.frames.findLastIndex(frame => frame.route.key === key);
    if (index < 0) return false;
    const distance = this.frames.length - 1 - index;
    if (!distance || this.pendingBack) return true;
    if (history.state?.depth >= distance) {
      this.pendingBack = true; history.go(-distance);
    } else {
      this.routes = this.frames.slice(0, index + 1).map(frame => frame.route);
      history.replaceState({ routes: this.routes, depth: 0 }, '', this.routes.at(-1).hash);
      this.reconcile();
    }
    return true;
  }

  reconcile() {
    const top = this.current;
    let common = 0;
    while (common < this.frames.length && this.frames[common].route.key === this.routes[common]?.key) common++;
    if (common < this.frames.length) { top.transition.setOpen(false, top.source); return; }
    if (top?.transition.running && !top.transition.opened) {
      top.transition.setOpen(true, top.source);
      return;
    }
    if (this.routes.length === this.frames.length) return;
    if (top?.transition.running) { top.transition.settle(); return; }
    const route = this.routes[this.frames.length];
    const frame = this.create(route, this.nextSource, top, open => this.finished(frame, open));
    this.nextSource = null;
    if (!frame) { this.routes = this.frames.map(item => item.route); return; }
    frame.route = route;
    frame.root.style.zIndex = 10 + this.frames.length * 10;
    this.frames.push(frame);
    frame.transition.setOpen(true, frame.source);
  }

  finished(frame, open) {
    if (!open) {
      this.frames.pop(); frame.dispose?.();
      if (frame.root.id !== 'detail') frame.root.remove();
      const focus = frame.source?.querySelector('.motion-person-link, .motion-open, .motion-update-open') || frame.source;
      focus?.focus({ preventScroll: true });
    } else {
      frame.root.tabIndex = -1;
      frame.root.focus({ preventScroll: true });
    }
    // Continue a multiple-step Back or restoration after the visible transition.
    if (this.frames.length !== this.routes.length) this.reconcile();
  }

  start() {
    this.routes = history.state?.routes || this.parse(location.hash);
    history.replaceState({ routes: this.routes, depth: history.state?.depth || 0 }, '');
    this.reconcile();
  }
}
