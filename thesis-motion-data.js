import { REFERENCE_THESES, TICKER_ASSETS, CHART_ASSETS } from './mvp-thesis-data.js?v=2';
import { SIGNALS } from './thesis-motion-signals.js?v=1';

// Copy, identities, links and version counts verified in the supplied mobile
// reference on 2026-10-22. Layout and chart components remain Figma-owned.
const entries = {
  P06: ['tom-lee-spy', 'tom-lee', '11 Sept 2026, 13:19', 4],
  S05: ['raoul-pal-nvda', 'raoul-pal', '11 Sept 2026, 10:02', 1, ['Chips']],
  P04: ['raoul-pal-ai', 'raoul-pal', '10 Sept 2026, 07:02', 2, ['Chips', 'Hyperscaler']],
  S01: ['jim-rogers-uso', 'jim-rogers', '8 Sept 2026', 1],
  P07: ['chamath-tsla', 'chamath', '6 Sept 2026, 23:19', 3],
  P02: ['chamath-nvda', 'chamath', '6 Sept 2026, 23:19', 4, ['Chips', 'Neocloud']],
  S02: ['cathie-wood-tsla', 'cathie-wood', '5 Sept 2026, 17:23', 3],
  S06: ['cathie-wood-xyz', 'cathie-wood', '5 Sept 2026, 14:33', 2],
  S04: ['cathie-wood-hood', 'cathie-wood', '5 Sept 2026, 13:30', 1],
  S07: ['raoul-pal-qqq', 'raoul-pal', '4 Sept 2026, 23:05', 4],
  P01: ['gavin-nvda', 'gavin', '4 Sept 2026, 21:31', 4, ['Chips', 'Memory']],
};

export const POSTS = REFERENCE_THESES.map(record => {
  const [id, authorId, date, updateCount, topics = []] = entries[record.key];
  return {
    id, authorId, name: record.name, role: record.role, avatar: record.img,
    age: record.age, date, text: record.thesis, sources: record.links,
    proxyNote: record.proxyNote, updateCount, topics,
    tickers: record.tickers.map(([symbol]) => ({ symbol, stance: 'up', logo: TICKER_ASSETS[symbol] })),
    charts: record.tickers.map(([symbol]) => CHART_ASSETS[symbol]).filter(Boolean),
    signals: SIGNALS[record.key] || [],
    signalStatus: record.key === 'S06' ? 'Reviewing signal history' : 'Not run yet',
    signalNote: record.key === 'S06'
      ? 'Approved signals appear here as the backfill progresses. 63 of 720 time windows reviewed.'
      : 'Signal monitoring hasn\u2019t been run for this thesis yet.',
  };
});

export const TOPICS = ['All', 'Chips', 'Memory', 'Hyperscaler', 'Neocloud'];
