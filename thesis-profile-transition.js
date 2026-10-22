import { ProgressTransition } from './thesis-motion-progress.js?v=6';

// The identity and page share one expanding container and one progress value.
export class ProfileTransition extends ProgressTransition {
  constructor({ app, feed, detail, onSettled }) {
    super(detail, '--profile-progress');
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
    if (this.reduceMotion.matches || !CSS.registerProperty) { this.finish(); return; }
    this.prepareDepth();

    const scale = app.getBoundingClientRect().width / app.offsetWidth;
    const pageRect = detail.getBoundingClientRect();
    const hero = detail.querySelector('.motion-profile-hero');
    const scrollTop = detail.querySelector('.motion-profile-scroll').getBoundingClientRect().top;
    const target = !open && hero.getBoundingClientRect().bottom <= scrollTop
      ? detail.querySelector('.motion-profile-collapsed') : hero;
    const fromAvatar = source?.querySelector('.motion-avatar');
    const toAvatar = target.querySelector('.motion-avatar');
    this.setDistance(fromAvatar ? Math.abs(fromAvatar.getBoundingClientRect().y - toAvatar.getBoundingClientRect().y) / scale : 0);
    if (fromAvatar) {
      const fromPerson = source.querySelector('.motion-person');
      const toPerson = target.querySelector('.motion-person');
      const bounds = node => {
        const r = node.getBoundingClientRect();
        return { x: (r.x - pageRect.x) / scale, y: (r.y - pageRect.y) / scale, width: r.width / scale, height: r.height / scale };
      };
      const a = bounds(fromAvatar), b = bounds(toAvatar);
      this.contain(source.querySelector('.motion-person-link') || source, fromAvatar, toAvatar, scale);
      const fromNameNode = fromPerson.querySelector('.motion-name'), toNameNode = toPerson.querySelector('.motion-name');
      const fromName = getComputedStyle(fromNameNode), toName = getComputedStyle(toNameNode);
      const advance = (node, style) => {
        const range = document.createRange(); range.selectNodeContents(node.firstChild);
        return range.getBoundingClientRect().width / scale / parseFloat(style.fontSize);
      };
      const visibleMeta = node => {
        const meta = node.querySelector('.motion-role, .motion-profile-meta');
        return meta && getComputedStyle(meta).display !== 'none' ? meta : null;
      };
      const fromRole = visibleMeta(fromPerson), toRole = visibleMeta(toPerson);
      const copy = document.createElement('div');
      copy.className = 'motion-profile-anchor'; copy.inert = true; copy.setAttribute('aria-hidden', 'true');
      const avatar = fromAvatar.cloneNode(true);
      const person = document.createElement('div'); person.className = 'motion-person';
      // Delight uses static font faces. Blend endpoint faces at the same size
      // and progress instead of asking font-weight to switch faces mid-flight.
      const name = document.createElement('div'); name.className = 'motion-profile-anchor-name';
      [[fromNameNode, fromName, 'from'], [toNameNode, toName, 'to']].forEach(([node, style, state]) => {
        const layer = node.cloneNode(true); layer.classList.add(state);
        layer.style.fontWeight = style.fontWeight; layer.style.color = style.color;
        name.append(layer);
      });
      person.append(name);
      const meta = document.createElement('div'); meta.className = 'motion-profile-anchor-meta';
      [[fromRole, 'from'], [toRole, 'to']].forEach(([node, state]) => {
        if (!node) return;
        const layer = node.cloneNode(true), style = getComputedStyle(node);
        layer.classList.add(state);
        ['color', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight'].forEach(key => { layer.style[key] = style[key]; });
        meta.append(layer);
      });
      person.append(meta); copy.append(avatar, person);
      copy.querySelectorAll('[data-shared]').forEach(node => delete node.dataset.shared);
      const fromGap = bounds(fromPerson).x - a.x - a.width;
      const toGap = bounds(toPerson).x - b.x - b.width;
      const fromY = bounds(fromPerson).y - a.y, toY = bounds(toPerson).y - b.y;
      const vars = {
        x: a.x, y: b.y, dx: b.x - a.x,
        size: a.width, ds: b.width - a.width,
        gap: fromGap, dg: toGap - fromGap,
        textY: fromY, dt: toY - fromY,
        width: bounds(fromPerson).width, dw: bounds(toPerson).width - bounds(fromPerson).width,
        font: parseFloat(fromName.fontSize), df: parseFloat(toName.fontSize) - parseFloat(fromName.fontSize),
        line: parseFloat(fromName.lineHeight), dl: parseFloat(toName.lineHeight) - parseFloat(fromName.lineHeight),
        metaY: fromRole ? bounds(fromRole).y - bounds(fromPerson).y : parseFloat(fromName.lineHeight),
        metaToY: toRole ? bounds(toRole).y - bounds(toPerson).y : parseFloat(toName.lineHeight),
        metaHeight: fromRole ? bounds(fromRole).height : 0, metaToHeight: toRole ? bounds(toRole).height : 0,
        clipTop: target === hero ? Math.max(0, (scrollTop - toAvatar.getBoundingClientRect().top) / scale) : 0,
        bend: Math.min(8, Math.abs(b.y - a.y) / 12),
      };
      Object.entries(vars).forEach(([key, value]) => copy.style.setProperty('--p-' + key, value + 'px'));
      copy.style.setProperty('--p-from-advance', advance(fromNameNode, fromName));
      copy.style.setProperty('--p-to-advance', advance(toNameNode, toName));
      [fromAvatar, fromPerson, toAvatar, toPerson].forEach(node => {
        this.hiddenNodes.push([node, node.style.visibility]); node.style.visibility = 'hidden';
      });
      detail.append(copy); this.copy = copy;
    }
    detail.classList.add('is-profile-moving');
    this.animateTo(open);
  }

  finish() {
    this.animation?.cancel(); this.animation = null;
    this.finishDepth();
    this.copy?.remove(); this.copy = null;
    this.hiddenNodes.forEach(([node, visibility]) => { node.style.visibility = visibility; });
    this.hiddenNodes = [];
    this.running = false;
    this.clearContainer();
    this.detail.classList.remove('is-profile-moving');
    this.detail.hidden = !this.opened; this.detail.inert = !this.opened;
    this.detail.dataset.transition = this.opened ? 'open' : 'closed';
    this.feed.inert = this.opened; this.feed.setAttribute('aria-hidden', String(this.opened));
    this.onSettled(this.opened, this.source);
  }
}
