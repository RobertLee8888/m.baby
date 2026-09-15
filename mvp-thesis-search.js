import { ASSET_TYPES, SEARCH_TICKERS, PEOPLE } from './mvp-thesis-data.js';
import { THESIS_ASSETS as assets } from './mvp-thesis-assets.js';
import { readStored, writeStored } from './mvp-thesis-controls.js';

export function createThesisSearch(ui, controls) {
  const { el, btn, icon, openTicker, openProfile } = ui;
  const root = el('div', 'thesis-root thesis-search');
  root.append(el('h1', 'thesis-root-title', 'Search'));
  const scroll = el('div', 'thesis-root-scroll'); root.append(scroll);
  const form = el('form', 'thesis-search-entry');
  const field = el('div', 'thesis-search-field'); field.append(icon('thesis/search-imgSearchL.svg'));
  const input = el('input'); input.type = 'search'; input.placeholder = 'Search tickers, people'; input.setAttribute('aria-label', 'Search tickers, people'); input.autocomplete = 'off'; input.maxLength = 200;
  const clear = btn('thesis-search-clear', 'Clear search'); clear.append(icon('thesis/search-results-imgCloseF2.svg'));
  clear.addEventListener('click', () => { input.value = ''; render(); input.focus(); });
  const inputBox = el('div', 'thesis-search-input'); inputBox.append(input);
  field.append(inputBox, clear); form.append(field); scroll.append(form);
  const panel = el('div', 'thesis-search-panel'); scroll.append(panel);
  const defaults = [{ kind: 'ticker', id: 'NVDA' }, { kind: 'person', id: 'Chamath Palihapitiya' }];
  const saved = readStored('alva-thesis-recent', defaults);
  let recent = (Array.isArray(saved) ? saved : defaults).filter(item => item && ['ticker', 'person'].includes(item.kind));
  let queryTab = 'All', assetType = 'All', timer;
  function remember(kind, id) {
    recent = [{ kind, id }, ...recent.filter(item => item.kind !== kind || item.id !== id)].slice(0, 8);
    writeStored('alva-thesis-recent', recent);
  }
  function visitPerson(person) { remember('person', person.name); openProfile(person); }
  function visitTicker(ticker) { remember('ticker', ticker.sym); openTicker(ticker); }
  function heading(label) { return el('h2', 'thesis-section-label', label); }
  function matches(record, query) {
    return [record.name, record.role, record.sym, record.co, ...(record.aliases || [])].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase());
  }
  function discovery() {
    if (recent.length) {
      const section = el('section', 'thesis-recent'); const head = el('div', 'thesis-section-heading');
      const all = btn('thesis-clear-all', 'Clear all'); all.textContent = 'Clear all';
      all.addEventListener('click', () => controls.confirm({ title: 'Clear recent history?', description: 'This will remove all your recently viewed people and tickers.', action: 'Clear all',
        onConfirm() { recent = []; writeStored('alva-thesis-recent', recent); render(); } }));
      head.append(heading('Recent'), all); const chips = el('div', 'thesis-recent-chips');
      for (const item of recent) {
        const record = (item.kind === 'ticker' ? SEARCH_TICKERS : PEOPLE).find(entry => (entry.sym || entry.name) === item.id);
        if (!record) continue;
        const chip = el('div', 'thesis-recent-chip'); const open = btn('thesis-recent-label', item.id);
        const visual = item.kind === 'person' ? controls.portrait(record) : ui.stockLogo(controls.tickerData(record));
        open.append(visual, el('span', null, item.id)); open.addEventListener('click', () => item.kind === 'person' ? visitPerson(record) : visitTicker(controls.tickerData(record)));
        const remove = btn('thesis-recent-remove', 'Remove ' + item.id); remove.append(icon('close-l1.svg'));
        remove.addEventListener('click', () => { recent = recent.filter(entry => entry !== item); writeStored('alva-thesis-recent', recent); render(); }); chip.append(open, remove); chips.append(chip);
      }
      section.append(head, chips); panel.append(section);
    }
    const tickers = el('section', 'thesis-discovery-tickers'); tickers.append(heading('Trending Tickers'));
    const columns = el('div', 'thesis-stock-columns');
    function paintStocks() {
      columns.replaceChildren();
      const records = SEARCH_TICKERS.filter(ticker => assetType === 'All' || ticker.assetType === assetType);
      for (let start = 0; start < records.length; start += 3) {
        const column = el('div', 'thesis-stock-column'); records.slice(start, start + 3).forEach(record => column.append(controls.tickerRow(record, visitTicker))); columns.append(column);
      }
      columns.scrollLeft = 0;
    }
    tickers.append(controls.tabs(ASSET_TYPES, value => { assetType = value; paintStocks(); }, { pills: true, selected: assetType }), columns); paintStocks(); panel.append(tickers);
    const people = el('section', 'thesis-discovery-people'); people.append(heading('Popular People'));
    const grid = el('div', 'thesis-people-grid');
    PEOPLE.forEach(person => {
      const card = btn('thesis-person-card', person.name + ' profile'); card.append(controls.portrait(person));
      const copy = el('div'); copy.append(controls.nameLabel(person), el('p', null, person.role)); card.append(copy);
      card.addEventListener('click', () => visitPerson(person)); grid.append(card);
    }); people.append(grid); panel.append(people);
  }
  function results(query) {
    const result = el('div', 'thesis-search-results'); result.setAttribute('role', 'tabpanel'); result.setAttribute('aria-label', queryTab);
    const tickerMatches = SEARCH_TICKERS.filter(record => matches(record, query));
    const personMatches = PEOPLE.filter(record => matches(record, query));
    const visibleStocks = queryTab !== 'People' && tickerMatches.length;
    const visiblePeople = queryTab !== 'Tickers' && personMatches.length;
    if (!visibleStocks && !visiblePeople) { result.classList.add('is-empty'); result.append(controls.empty('No results found')); }
    if (visibleStocks) {
      const group = el('section', 'thesis-results-group'); group.append(heading('Tickers'));
      const list = el('div', 'thesis-result-list');
      const paint = () => {
        const items = tickerMatches.filter(record => assetType === 'All' || record.assetType === assetType);
        list.replaceChildren(...items.map(record => controls.tickerRow(record, visitTicker, true)));
        if (!items.length) list.append(el('p', 'thesis-inline-empty', 'No results found'));
      };
      group.append(controls.tabs(ASSET_TYPES, value => { assetType = value; paint(); }, { pills: true, selected: assetType }), list); paint(); result.append(group);
    }
    if (visiblePeople) {
      const group = el('section', 'thesis-results-group'); group.append(heading('People'));
      personMatches.forEach(person => group.append(controls.personRow(person, visitPerson))); result.append(group);
    }
    panel.append(result);
  }
  function render() {
    clearTimeout(timer); panel.replaceChildren(); const query = input.value.trim(); root.classList.toggle('has-query', !!query); clear.hidden = !query;
    if (query) {
      panel.append(controls.tabs(['All', 'Tickers', 'People'], value => { queryTab = value; render(); }, { selected: queryTab })); results(query);
    } else discovery();
  }
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(render, 120); });
  form.addEventListener('submit', event => { event.preventDefault(); render(); input.blur(); });
  render();
  return { root, refresh: render };
}
