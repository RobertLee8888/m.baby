// Historical text, dates and sources transcribed from the supplied mobile
// reference's Timeline on 2026-10-22. No current charts/signals are backfilled.
const HISTORY = {
  'tom-lee-spy': [
    { version: '2026-08-07', date: '7 Aug 2026, 10:03',
      text: 'The near-term target rose to 7,900-8,000 in August as inflation and rate-hike fears were expected to fade.',
      sources: ['https://fundstrat.com/client-portal/macro-strategy/flash/2026/08/06/markets-still-have-excessive-inflation-derangement-syndrome-and-july-jobs-and-july-cpi-should-quell-some-fears-we-see-sp-500-reaching-7900-8000-by-end-of-month/'] },
    { version: '2026-04-29', date: '29 Apr 2026, 06:27',
      text: 'Strong earnings and market resilience supported a path toward S&P 500 7,300.',
      sources: ['https://fundstrat.com/client-portal/macro-strategy/flash/2026/04/28/this-wed-may-be-fed-chair-powell-last-presser-equity-returns-under-powell-8-3-cagr-nominal-4-7-real-very-good-returns/'] },
    { version: '2026-03-11', date: '11 Mar 2026, 11:23',
      text: 'The Iran conflict and higher oil did not overturn the expectation that March would finish as an up month.',
      sources: ['https://fundstrat.com/client-portal/macro-strategy/flash/2026/03/10/prediction-markets-see-higher-oil-thru-june-longer-conflict-but-we-still-see-march-as-up-month/'] },
  ],
  'raoul-pal-ai': [
    { version: '2026-09-09', date: '9 Sept 2026, 01:51',
      text: 'Microsoft versus Alphabet, Anthropic versus OpenAI, Nvidia versus AMD, and U.S. versus Chinese competition make continued AI investment the stable strategic outcome; even a lab failure should accelerate compute transfer and replacement spending.',
      sources: ['https://x.com/i/status/2097382441073741935'] },
  ],
  'chamath-tsla': [
    { version: '2026-08-01', date: '1 Aug 2026, 00:25',
      text: 'Autonomous driving can improve safety and economics, with Tesla and Waymo representing two distinct approaches to a potentially very large robotaxi market.',
      sources: ['https://x.com/chamath/status/2083227594506592329'] },
    { version: '2026-05-04', date: '4 May 2026, 03:54',
      text: 'Driving a Tesla demonstrates the value of an integrated sensor and supercomputer system that handles navigation and removes dependence on gasoline.',
      sources: ['https://x.com/chamath/status/2051027755194806781'] },
  ],
  'chamath-nvda': [
    { version: '2026-08-29', date: '29 Aug 2026, 09:19',
      text: 'As hyperscalers design their own chips, Nvidia can respond by moving into models, hosting, APIs, inference, and cloud services.',
      sources: ['https://allinchamathjason.libsyn.com/nvidias-historic-quarter-saas-comeback-bessent-vs-druck-americas-debt-crisis-cancer-vaccine'] },
    { version: '2026-05-02', date: '2 May 2026, 02:03',
      text: "Nvidia's CUDA sits above concentrated physical chokepoints and remains one of the foundational assets on which the AI stack is built.",
      sources: ['https://x.com/chamath/status/2050275051761705133'] },
    { version: '2026-03-28', date: '28 Mar 2026, 04:03',
      text: "Nvidia's margins, execution, and economically accretive products distinguish it from software businesses whose AI-era terminal values are weakening.",
      sources: ['https://allinchamathjason.libsyn.com/anthropics-generational-run-openai-panics-ai-moats-meta-loses-lawsuits'] },
  ],
  'cathie-wood-tsla': [
    { version: '2026-06-09', date: '9 Jun 2026, 04:06',
      text: 'The Austin service demonstrates more than a decade of real-world AI training manifesting in a fully autonomous ride.',
      sources: ['https://x.com/CathieDWood/status/2064076685981696108'] },
    { version: '2026-05-06', date: '6 May 2026',
      text: "Vertical integration should give Tesla the lowest robotaxi cost structure, potentially around $0.25 per mile at scale and materially below Waymo's cost.",
      sources: ['https://www.bloomberg.com/news/audio/2026-05-06/bloomberg-businessweek-daily-cathie-wood-at-milken-podcast'] },
  ],
  'cathie-wood-xyz': [
    { version: '2026-03-25', date: '25 Mar 2026, 01:13',
      text: "Square's ManagerBot is an early proof point that operating agents can lower barriers to entrepreneurship.",
      sources: ['https://x.com/CathieDWood/status/2036491499039498376'] },
  ],
  'raoul-pal-qqq': [
    { version: '2026-09-03', date: '3 Sept 2026, 23:18',
      text: 'The Nasdaq 100 has cleared the estimated 11% hurdle decisively because technology remains on an adoption curve rather than merely tracking monetary liquidity.',
      sources: ['https://raoulpal.substack.com/p/why-traditional-portfolios-stopped'] },
    { version: '2026-07-03', date: '3 Jul 2026, 00:19',
      text: "The Nasdaq's relationship with global liquidity is about 97.5%, making liquidity more useful than static valuation arguments for the direction of the index.",
      sources: ['https://x.com/RaoulGMI/status/2072716775557345660'] },
    { version: '2026-04-16', date: '16 Apr 2026, 02:10',
      text: 'The Nasdaq 100 should rise as the global liquidity cycle turns higher.',
      sources: ['https://x.com/i/status/2044478475516424388'] },
  ],
  'gavin-nvda': [
    { version: '2026-07-22', date: '22 Jul 2026, 00:41',
      text: 'Revenue shares in exchange for compute offtake guarantees could become an important incremental Nvidia business model beyond rack sales.',
      sources: ['https://x.com/GavinSBaker/status/2079607708693434850'] },
    { version: '2026-05-21', date: '21 May 2026, 03:14',
      text: 'Lower financing rates supported by long useful lives should be a meaningful demand advantage for the leading GPU incumbent over ASIC alternatives.',
      sources: ['https://x.com/GavinSBaker/status/2057178093463232826'] },
    { version: '2026-04-17', date: '17 Apr 2026, 03:33',
      text: "As inference dominates cost, model portability should decline and co-design around Nvidia's switched scale-up systems should raise switching costs.",
      sources: ['https://x.com/GavinSBaker/status/2044861680015069571'] },
  ],
};

export function versionsFor(post) {
  return [{ ...post, version: 'latest' }, ...(HISTORY[post.id] || []).map(record => ({
    ...post, ...record, age: record.date,
    charts: [], signals: [], relatedIds: [],
    signalStatus: 'No signals for this update', signalNote: '',
  }))];
}

export function versionFor(post, version = 'latest') {
  return versionsFor(post).find(item => item.version === version);
}

export function renderUpdates(root, post, selected, ui) {
  const { el, icon, button, body, sources, back, openVersion, settle } = ui;
  root.setAttribute('aria-label', 'All updates'); root.dataset.thesis = post.id;
  const header = el('header', 'motion-detail-header motion-updates-header');
  const close = button('motion-icon-button', 'Back from all updates', back); close.dataset.back = '';
  close.append(icon('onboarding-arrow-left-l1.svg')); header.append(close, el('h1', '', 'All updates'));
  const scroll = el('div', 'motion-detail-scroll motion-updates-scroll');
  const list = el('ol', 'motion-updates-list');
  versionsFor(post).forEach(version => {
    const row = el('li', 'motion-update-row'); row.dataset.version = version.version;
    const link = el('a', 'motion-update-open');
    link.href = '#' + post.id + (version.version === 'latest' ? '' : '/version/' + version.version);
    link.setAttribute('aria-label', 'Read update from ' + version.date);
    if (version.version === selected) link.setAttribute('aria-current', 'true');
    const date = el('div', 'motion-date'); date.append(el('time', '', version.date));
    if (version.version === 'latest') date.append(el('span', 'motion-latest', 'Latest'));
    else if (version.version === selected) date.append(el('span', 'motion-version-label', 'Viewing'));
    link.append(date, body(version));
    link.addEventListener('click', event => { event.preventDefault(); openVersion(version, row); });
    row.append(el('span', 'motion-dot'), link, sources(version)); list.append(row);
  });
  scroll.append(list); root.append(header, scroll);
  scroll.addEventListener('scroll', () => { settle(); header.classList.toggle('is-scrolled', scroll.scrollTop > 0); }, { passive: true });
}
