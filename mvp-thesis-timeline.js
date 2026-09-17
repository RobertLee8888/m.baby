export function createThesisTimeline(ui) {
  const { el, btn, icon, content, pageShell, push } = ui;

  function row(version, { withRail = true, expanded = true, preview = false, status = 'Latest', onExpand } = {}) {
    const node = el('article', 'thesis-update-row' + (withRail ? '' : ' no-rail'));
    node.dataset.version = version.id;
    if (withRail) {
      const rail = el('span', 'thesis-update-rail');
      rail.append(el('span', 'thesis-rail-dot'));
      node.append(rail);
    }
    const body = el('div', 'thesis-update-body');
    const date = el('div', 'thesis-update-date');
    date.append(el('time', null, version.date));
    const statuses = Array.isArray(status) ? status : status ? [status] : [];
    statuses.forEach(label => date.append(el('span', 'thesis-latest-badge' + (label === 'Latest' ? '' : ' is-muted'), label)));
    const card = preview ? { ...version.card, social: { ...version.card.social,
      paragraphs: [version.card.social.statements[0]] } } : version.card;
    const entry = content(card, { full: true, detail: true });
    if (onExpand) {
      entry.classList.add('is-collapsible');
      entry.classList.toggle('is-expanded', expanded);
      const paragraphs = entry.querySelectorAll('.thesis-body > p');
      if (paragraphs.length > 1) {
        const more = btn('thesis-show-more', 'Show more'); more.textContent = 'Show more';
        const less = btn('thesis-show-less', 'Show less');
        less.append('Show less', icon('thesis/detail/arrow-down.svg'));
        paragraphs[0].append(' ', more);
        entry.querySelector('.thesis-body').append(less);
        const paint = (value, animate = true) => {
          const before = node.getBoundingClientRect().height;
          entry.classList.toggle('is-expanded', value);
          more.hidden = value; less.hidden = !value;
          more.setAttribute('aria-expanded', String(value));
          onExpand(node, less, value, paint);
          const after = node.getBoundingClientRect().height;
          if (animate && before !== after && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
            node.animate([{ height: before + 'px' }, { height: after + 'px' }], {
              duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)',
            });
          }
        };
        more.addEventListener('click', () => paint(true));
        less.addEventListener('click', () => paint(false));
        paint(expanded, false);
      }
    }
    body.append(date, entry); node.append(body);
    return node;
  }

  function openUpdates(versions) {
    const { page, scroll } = pageShell('All updates');
    page.dataset.socialPage = 'all-updates';
    const timeline = el('div', 'thesis-update-timeline');
    const floating = btn('thesis-floating-less', 'Show less');
    floating.append('Show less', icon('thesis/detail/arrow-down.svg'));
    floating.hidden = true;
    let active = null;
    function syncFloating() {
      if (!active) { floating.hidden = true; return; }
      const bounds = active.button.getBoundingClientRect();
      const viewport = scroll.getBoundingClientRect();
      floating.hidden = bounds.bottom >= viewport.top || bounds.top > viewport.bottom;
    }
    versions.forEach((version, index) => {
      const item = row(version, { status: index ? '' : 'Latest', expanded: false,
        onExpand(node, button, value, paint) {
          if (value && active?.node !== node) active?.paint(false);
          if (value) { active = { node, button, paint }; }
          else if (active?.node === node) active = null;
          syncFloating();
        },
      });
      if (index === 0) {
        item.classList.add('is-current-version');
        item.tabIndex = 0;
        item.setAttribute('role', 'link');
        item.setAttribute('aria-label', 'Back to current thesis');
        const back = event => {
          if (event.type === 'click' && event.target.closest('button, a')) return;
          if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
          event.preventDefault();
          history.back();
        };
        item.addEventListener('click', back);
        item.addEventListener('keydown', back);
      }
      timeline.append(item);
    });
    floating.addEventListener('click', () => {
      const previous = active; if (!previous) return;
      previous.paint(false);
      previous.node.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
    scroll.addEventListener('scroll', syncFloating, { passive: true });
    scroll.append(timeline); page.append(floating);
    push(page);
  }

  return { row, openUpdates };
}
