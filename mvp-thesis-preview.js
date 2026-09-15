export function summaryPreview(text) {
  return text.replace(/[.。…]+\s*$/, '') + '\u2026';
}

// Measure against the stable page viewport, independent of scroll/header collapse.
export function createPreviewLayout({ el, sourceParagraph }) {
  const pending = new Map();
  const app = document.getElementById('mvpApp');
  let scheduled = false;
  function fill(body, text) {
    body.replaceChildren(...text.split(/\n\n/).map(paragraph => el('p', null, paragraph)));
  }
  function measure(node, card) {
    if (!node.isConnected || !node.getBoundingClientRect().width) return;
    const body = node.querySelector('.thesis-body');
    const full = (card.social.paragraphs || card.social.statements).join('\n\n');
    const css = getComputedStyle(app);
    const viewport = app.clientHeight - ['--status-h', '--topbar-h', '--tab-h', '--home-h']
      .reduce((total, key) => total + (parseFloat(css.getPropertyValue(key)) || 0), 0);
    const probe = node.cloneNode(true);
    probe.classList.add('thesis-measure');
    probe.inert = true; probe.setAttribute('aria-hidden', 'true');
    // Layout pixels are stable while splash and page transitions scale their ancestors.
    probe.style.width = node.offsetWidth + 'px';
    node.parentElement.append(probe);
    const candidate = probe.querySelector('.thesis-body');
    fill(candidate, full);
    const sources = sourceParagraph(card); candidate.after(sources);
    const completeHeight = probe.offsetHeight;
    sources.remove();
    node.dataset.previewBudget = String(viewport);
    let result = full;
    if (completeHeight > viewport && probe.offsetHeight > viewport) {
      const ends = [...full.matchAll(/\S+(?=\s|$)/g)].map(match => match.index + match[0].length);
      let low = 1, high = ends.length, best = 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        fill(candidate, summaryPreview(full.slice(0, ends[mid - 1])));
        if (probe.offsetHeight <= viewport) { best = mid; low = mid + 1; }
        else high = mid - 1;
      }
      result = summaryPreview(full.slice(0, ends[best - 1]));
    }
    fill(body, result);
    probe.remove(); node.dataset.previewReady = 'true';
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      for (const [node, card] of pending) {
        if (!node.isConnected) { pending.delete(node); continue; }
        measure(node, card);
      }
    });
  }
  const resize = new ResizeObserver(schedule); resize.observe(app);
  document.fonts.ready.then(schedule);
  return {
    attach(node, card) { pending.set(node, card); document.fonts.ready.then(schedule); },
    refresh: schedule,
    reset() { pending.clear(); },
  };
}
