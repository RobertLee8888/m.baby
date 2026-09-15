import { thesisVersions } from './mvp-thesis-versions.js';
import { createVersionNavigation } from './mvp-thesis-version-nav.js';

const SIGNAL_ROLES = {
  SemiAnalysis: 'Semiconductor & AI research',
  'Matt Bryson': 'Managing Director, Equity Research \u00b7 Wedbush',
  'Riot Platforms': 'Digital infrastructure company',
};

export function createThesisDetail(ui) {
  const { el, img, btn, icon, pageShell, push, identity, controls, content, footer, sharePost, cardNode, relatedCards } = ui;

  function signals(records, card) {
    const list = el('div', 'thesis-signals');
    for (const record of records) {
      const row = el('article', 'thesis-signal');
      const quote = el('div', 'thesis-signal-source');
      quote.append(identity({ ...record, role: SIGNAL_ROLES[record.name] || record.role }, record.time || card.social.age));
      const copy = el('p', 'thesis-signal-copy');
      const text = record.text.startsWith(',') || record.text.startsWith('reports ') || record.text.startsWith('announced ')
        ? record.name + (record.text.startsWith(',') ? '' : ' ') + record.text : record.text;
      copy.append(text);
      if (record.url) {
        const link = el('a', 'thesis-signal-link');
        link.href = record.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.append(el('span', null, new URL(record.url).hostname.replace(/^www\./, '')), ' \u2197');
        copy.append(' ', link);
      }
      quote.append(copy); row.append(quote);
      if (record.analysis) {
        const analysis = el('p', 'thesis-signal-analysis');
        const alva = el('span', 'thesis-inline-alva');
        alva.append(img('assets/thesis/detail/alva.svg'), el('span', null, 'Alva'));
        analysis.append(alva, ' ', record.analysis); row.append(analysis);
      }
      list.append(row);
    }
    if (!records.length) list.append(el('p', 'social-empty', 'No signals for this update'));
    return list;
  }

  function open(base, initialVersion) {
    const versions = thesisVersions(base, relatedCards(base));
    let current = versions.find(version => version.id === initialVersion) || versions[0];
    let activeTab = 'Signals';
    const { page, top, scroll } = pageShell('Thesis');
    page.dataset.socialPage = 'detail'; page.dataset.post = base.social.key;
    page.classList.add('thesis-detail');
    top.querySelector('h1').remove();
    top.append(identity(base.sources[0]), controls.followButton(base.sources[0]));
    const intro = el('div', 'social-thesis-detail');
    const section = el('div', 'social-detail-tabs');
    const panel = el('div', 'social-detail-panel'); panel.setAttribute('role', 'tabpanel');
    const nav = controls.tabs(['Signals', 'Related theses'], name => {
      const pinned = nav.getBoundingClientRect().top <= scroll.getBoundingClientRect().top + 1;
      activeTab = name; renderPanel();
      if (pinned) scroll.scrollTop = section.offsetTop;
    });
    const bottom = el('footer', 'social-detail-footer');

    function renderPanel() {
      panel.dataset.version = current.id;
      panel.setAttribute('aria-label', activeTab);
      if (activeTab === 'Signals') panel.replaceChildren(signals(current.signals, current.card));
      else panel.replaceChildren(...(current.related.length ? current.related.map(cardNode) : [el('p', 'social-empty', 'No related theses')]));
    }
    function render() {
      page.dataset.version = current.id;
      intro.replaceChildren(content(current.card, { full: true, detail: true }));
      renderPanel();
      const actions = footer(current.card);
      const share = btn('thesis-action thesis-share', 'Share thesis');
      share.append(icon('social-share.svg')); share.addEventListener('click', () => sharePost(current.card));
      actions.append(share); bottom.replaceChildren(actions);
    }
    const versionNav = createVersionNavigation(ui, versions, current.id, version => {
      current = version; render(); scroll.scrollTop = 0;
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        intro.animate([{ opacity: .25 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
      }
    });
    section.append(nav, panel); scroll.append(versionNav.node, intro, section); page.append(bottom);
    render(); push(page, versionNav.refresh, versionNav.destroy);
  }
  return { open };
}
