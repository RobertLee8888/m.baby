/* Feed filtering is shared by the strip, Following tickers and refresh. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AlvaFeedModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const symbol = value => value === 'GOOGL' ? 'GOOG' : value;
  const hoursAgo = card => {
    if (Number.isFinite(card.hoursAgo)) return card.hoursAgo;
    const age = String(card.age || '').toLowerCase();
    if (age === 'just now') return 0;
    const match = age.match(/^(\d+)\s*([mhd])\s+ago$/);
    if (match) return Number(match[1]) * ({ m: 1 / 60, h: 1, d: 24 })[match[2]];
    return Infinity;
  };

  function matches(card, selected) {
    return selected === 'All' || card.tickers.some(t => symbol(t.sym) === symbol(selected));
  }

  function tickerStats(cards, followed) {
    const stats = new Map();
    cards.forEach(card => {
      const seen = new Set();
      card.tickers.forEach(ticker => {
        const key = symbol(ticker.sym);
        if (!followed.has(key) || seen.has(key)) return;
        seen.add(key);
        if (!stats.has(key)) stats.set(key, { ticker, sym: key, count: 0, latest: Infinity, balance: 0 });
        const item = stats.get(key);
        const age = hoursAgo(card);
        item.latest = Math.min(item.latest, age);
        if (age < 48) {
          item.count += 1;
          item.balance += ticker.stance === 'bull' ? 1 : ticker.stance === 'bear' ? -1 : 0;
        }
      });
    });
    return [...stats.values()].sort((a, b) => a.latest - b.latest || b.count - a.count || a.sym.localeCompare(b.sym));
  }

  return { symbol, hoursAgo, matches, tickerStats };
});
