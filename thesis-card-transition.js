// Move real elements between measured layouts. Paragraphs crossfade between
// their two line wraps while translating together, without stretching glyphs.
export class CardTransition {
  constructor({ app, feed, detail, onSettled }) {
    Object.assign(this, { app, feed, detail, onSettled });
    this.animations = [];
    this.opened = false;
    this.running = false;
    this.clones = [];
    this.targets = [];
    this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  }

  setOpen(open, source) {
    if (this.running) {
      if (open !== this.opened) {
        this.opened = open;
        this.detail.dataset.transition = open ? 'opening' : 'closing';
        this.animations.forEach(animation => animation.reverse());
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
    source.style.visibility = '';
    const sourceRect = source.getBoundingClientRect();
    const detailRect = detail.getBoundingClientRect();
    const scale = app.getBoundingClientRect().width / app.offsetWidth;
    const sourceElements = new Map([...source.querySelectorAll('[data-shared]')].map(node => [node.dataset.shared, node]));
    const pairs = [...detail.querySelectorAll('[data-shared]')].flatMap(target => {
      const from = sourceElements.get(target.dataset.shared);
      if (!from) return [];
      const a = from.getBoundingClientRect(), b = target.getBoundingClientRect();
      return [{ from, target, a, b, x: (a.left - b.left) / scale, y: (a.top - b.top) / scale }];
    });
    const top = Math.max(0, (sourceRect.top - detailRect.top) / scale);
    const bottom = Math.max(0, (detailRect.bottom - sourceRect.bottom) / scale);
    const closedClip = `inset(${top}px 0 ${bottom}px 0)`;
    source.style.visibility = 'hidden';
    this.running = true;
    detail.dataset.transition = open ? 'opening' : 'closing';

    if (this.reduceMotion.matches) {
      this.finish();
      return;
    }
    const options = { duration: 280, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' };
    const animate = (node, from, to) => {
      const animation = node.animate(open ? [from, to] : [to, from], options);
      this.animations.push(animation);
    };
    detail.classList.add('is-morphing');
    const layer = document.createElement('div');
    layer.className = 'motion-shared-layer'; layer.setAttribute('aria-hidden', 'true');
    detail.append(layer); this.clones.push(layer);
    const copyAt = (node, rect, key) => {
      const copy = node.cloneNode(true);
      copy.removeAttribute('data-shared'); copy.dataset.motionShared = key;
      Object.assign(copy.style, { position: 'absolute', margin: '0',
        left: (rect.left - detailRect.left) / scale + 'px', top: (rect.top - detailRect.top) / scale + 'px',
        width: rect.width / scale + 'px', height: rect.height / scale + 'px' });
      layer.append(copy); return copy;
    };
    animate(detail, { clipPath: closedClip }, { clipPath: 'inset(0px 0 0px 0)' });
    pairs.forEach(({ from, target, a, b, x, y }) => {
      const start = `translate(${x}px, ${y}px)`;
      const moving = copyAt(target, b, target.dataset.shared);
      this.targets.push({ node: target, visibility: target.style.visibility });
      target.style.visibility = 'hidden';
      if (target.dataset.shared === 'body' && Math.abs(a.width - b.width) > 1) {
        const clone = copyAt(from, { left: b.left, top: b.top, width: a.width, height: a.height }, 'body-source');
        animate(clone, { transform: start }, { transform: 'translate(0px, 0px)' });
        animate(moving, { transform: start }, { transform: 'translate(0px, 0px)' });
        const oldFrames = [{ opacity: 1, offset: 0 }, { opacity: 0, offset: .35 }, { opacity: 0, offset: 1 }];
        const newFrames = [{ opacity: 0, offset: 0 }, { opacity: 0, offset: .35 }, { opacity: 1, offset: 1 }];
        const reverse = frames => [...frames].reverse().map(frame => ({ ...frame, offset: 1 - frame.offset }));
        this.animations.push(clone.animate(open ? oldFrames : reverse(oldFrames), options));
        this.animations.push(moving.animate(open ? newFrames : reverse(newFrames), options));
      } else animate(moving, { transform: start }, { transform: 'translate(0px, 0px)' });
    });
    detail.querySelectorAll('[data-reveal]').forEach(node => {
      const distance = node.dataset.reveal === 'content' ? 24 : 0;
      animate(node, { opacity: 0, transform: `translateY(${distance}px)` }, { opacity: 1, transform: 'translateY(0px)' });
    });
    animate(feed, { opacity: 1 }, { opacity: .6 });
    // All animations share one timeline. Reversing reuses their current time,
    // including a back gesture during entry or forward during exit.
    Promise.all(this.animations.map(animation => animation.finished)).then(() => this.finish()).catch(error => {
      if (error.name !== 'AbortError') throw error;
    });
  }

  finish() {
    this.animations.forEach(animation => animation.cancel());
    this.animations = [];
    this.clones.forEach(node => node.remove());
    this.clones = [];
    this.targets.forEach(({ node, visibility }) => { node.style.visibility = visibility; });
    this.targets = [];
    this.running = false;
    this.detail.classList.remove('is-morphing');
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
