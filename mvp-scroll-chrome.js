const STICKY_EDGE_SELECTOR = [
  '[data-scroll-divider-edge]',
  '.social-detail-tabs > .social-tabs',
  '.social-detail-tabs > .thesis-tabs',
  '.social-profile-pinned',
  '.thesis-profile-pinned',
].join(',');

export function bindScrollChrome(top, scroll, { stickySelector = STICKY_EDGE_SELECTOR, attached, collapse = false } = {}) {
  if (!top || !scroll) return () => {};

  top.classList.add('scroll-chrome-top');
  let frame = 0;

  function paint() {
    frame = 0;
    if (collapse) {
      const progress = Math.min(1, Math.max(0, scroll.scrollTop / 58));
      top.parentElement?.style.setProperty('--thesis-bar-p', progress.toFixed(4));
    }
    const viewport = scroll.getBoundingClientRect();
    const attachedVisible = attached && !attached.hidden && getComputedStyle(attached).display !== 'none'
      && attached.getBoundingClientRect().height > 0;
    const pinned = attachedVisible || [...scroll.querySelectorAll(stickySelector)].some(node => {
      if (node.hidden || getComputedStyle(node).position !== 'sticky') return false;
      const bounds = node.getBoundingClientRect();
      return bounds.top <= viewport.top + 1 && bounds.bottom > viewport.top + 1;
    });
    top.classList.toggle('has-scroll-divider', scroll.scrollTop > 0.5 && !pinned);
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(paint);
  }

  scroll.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  schedule();

  return () => {
    scroll.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    if (frame) cancelAnimationFrame(frame);
    if (collapse) top.parentElement?.style.removeProperty('--thesis-bar-p');
  };
}
