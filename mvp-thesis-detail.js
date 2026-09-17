import { thesisVersions } from './mvp-thesis-versions.js?v=3';
import { createThesisTimeline } from './mvp-thesis-timeline.js?v=1';

const SIGNAL_ROLES = {
  SemiAnalysis: 'Semiconductor & AI research',
  'Matt Bryson': 'Managing Director, Equity Research \u00b7 Wedbush',
  'Riot Platforms': 'Digital infrastructure company',
};

export function createThesisDetail(ui) {
  const { el, img, btn, icon, pageShell, push, identity, controls, footer, sharePost,
    cardNode, relatedCards, stateFor, update, openSheet, closeSheet, sheetClose, toast } = ui;
  const timeline = createThesisTimeline(ui);

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
    return list;
  }

  function generating() {
    const state = el('div', 'thesis-generating'); state.setAttribute('role', 'status');
    state.append(img('assets/logo-loading-light.svg'), el('p', null, 'Generating signals...'));
    return state;
  }

  function open(base, initialVersion) {
    const ownership = !!(base.social.owner || base.sources[0]?.owner);
    const state = stateFor(base);
    const { page, top, scroll } = pageShell('Thesis');
    page.dataset.socialPage = 'detail'; page.dataset.post = base.social.key; page.dataset.version = 'latest';
    page.classList.add('thesis-detail');
    top.querySelector('h1').remove();
    top.append(identity(base.sources[0]));
    const menuTrigger = btn('thesis-detail-more', 'More thesis options');
    menuTrigger.append(icon('thesis/detail/more.svg'));
    menuTrigger.setAttribute('aria-expanded', 'false');
    const menu = el('div', 'thesis-detail-menu'); menu.setAttribute('role', 'menu'); menu.hidden = true;
    const dismiss = el('div', 'thesis-menu-dismiss'); dismiss.hidden = true;
    let activeTab = 'Signals', signalTimer;
    const intro = el('div', 'social-thesis-detail');
    const section = el('div', 'social-detail-tabs');
    const panel = el('div', 'social-detail-panel'); panel.setAttribute('role', 'tabpanel');
    const nav = controls.tabs(['Signals', 'Related theses'], name => {
      const pinned = nav.getBoundingClientRect().top <= scroll.getBoundingClientRect().top + 1;
      activeTab = name; renderPanel();
      if (pinned) scroll.scrollTop = section.offsetTop;
    });
    const bottom = el('footer', 'social-detail-footer');

    function versions() { return thesisVersions(base, relatedCards(base), state.updates || []); }
    function renderPanel() {
      panel.setAttribute('aria-label', activeTab);
      if (activeTab === 'Related theses') {
        const related = relatedCards(base);
        panel.replaceChildren(...(related.length ? related.map(cardNode) : [controls.empty('No related theses')]));
      } else if (ownership && versions().length === 1 && !state.signalsReady) {
        panel.replaceChildren(generating());
        clearTimeout(signalTimer);
        signalTimer = setTimeout(() => { state.signalsReady = true; if (page.isConnected && activeTab === 'Signals') renderPanel(); }, 1250);
      } else {
        const latest = versions()[0];
        panel.replaceChildren(latest.signals.length ? signals(latest.signals, latest.card) : generating());
      }
    }
    function setMenu(open) {
      menu.hidden = !open; dismiss.hidden = !open;
      menuTrigger.setAttribute('aria-expanded', String(open));
      if (open) menu.querySelector('[role="menuitem"]')?.focus({ preventScroll: true });
      else menuTrigger.focus({ preventScroll: true });
    }
    function renderMenu() {
      menu.replaceChildren();
      const options = [
        [state.archived ? 'Unarchive thesis' : 'Archive thesis', state.archived ? 'restore.svg' : 'archive.svg', 'archived'],
        [state.private ? 'Make public' : 'Make private', state.private ? 'unlocked.svg' : 'locked.svg', 'private'],
      ];
      options.forEach(([label, asset, key]) => {
        const action = btn('thesis-menu-item', label);
        action.setAttribute('role', 'menuitem'); action.append(icon('thesis/detail/' + asset), el('span', null, label));
        action.addEventListener('click', () => { state[key] = !state[key]; update(base); setMenu(false); render(); });
        menu.append(action);
      });
    }
    function compose() {
      const form = el('form', 'thesis-edit');
      const field = el('label'); field.append(el('span', null, 'Update'));
      const input = el('textarea'); input.required = true; input.maxLength = 2000;
      field.append(input); form.append(field);
      const submit = btn('thesis-button primary', 'Publish update'); submit.type = 'submit'; submit.textContent = 'Update';
      form.append(submit);
      form.addEventListener('submit', event => {
        event.preventDefault(); const text = input.value.trim(); if (!text) return;
        const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
        state.updates = [{ id: 'owner-' + Date.now(), date, text }, ...(state.updates || [])];
        update(base); closeSheet(); render(); scroll.scrollTop = 0;
      });
      openSheet([sheetClose(), el('h2', null, 'Update thesis')], [form], { label: 'Update thesis' });
    }
    function render() {
      const items = versions();
      top.querySelector('.thesis-owner-update')?.remove();
      if (ownership && !state.archived) {
        const button = btn('thesis-owner-update', 'Update thesis');
        button.append(icon('thesis/detail/add.svg'), el('span', null, 'Update'));
        button.addEventListener('click', compose); top.insertBefore(button, menuTrigger);
      }
      const latest = items[0];
      const status = state.archived ? ['Archived'] : state.private ? ['Latest', 'Private'] : ['Latest'];
      intro.replaceChildren(timeline.row(latest, { withRail: items.length > 1, preview: true, status }));
      if (items.length > 1) {
        const all = btn('thesis-view-updates', 'View all ' + items.length + ' updates');
        all.append(el('span', 'thesis-view-dot'), el('span', null, 'View all ' + items.length + ' updates'), icon('ui-arrow-right-l2.svg'));
        all.addEventListener('click', () => timeline.openUpdates(items));
        intro.append(all);
      }
      renderMenu(); renderPanel();
      const actions = footer(latest.card);
      const share = btn('thesis-action thesis-share', 'Share thesis');
      share.append(icon('social-share.svg')); share.addEventListener('click', () => sharePost(base));
      actions.append(share); bottom.replaceChildren(actions);
    }
    if (ownership) {
      top.append(menuTrigger); page.append(dismiss, menu);
      menuTrigger.addEventListener('click', () => setMenu(menu.hidden));
      dismiss.addEventListener('click', () => setMenu(false));
      page.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { event.preventDefault(); setMenu(false); } });
    } else top.append(controls.followButton(base.sources[0]));
    section.append(nav, panel); scroll.append(intro, section); page.append(bottom);
    render(); push(page, () => { if (!menu.hidden) setMenu(false); }, () => clearTimeout(signalTimer));
    if (initialVersion && initialVersion !== 'latest') toast('This thesis was updated. Opened the latest version.');
  }
  return { open };
}
