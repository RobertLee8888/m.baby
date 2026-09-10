/* The pending batch is shared by the badge and every refresh entry point. */
'use strict';
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.createAlvaFeedUpdates = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (cards, random = Math.random) {
  let remaining, pending;

  function reset() { remaining = cards.slice(); pending = []; }
  function release() {
    if (!pending.length && remaining.length) {
      const count = Math.min(remaining.length, 1 + Math.floor(random() * 3));
      pending = remaining.splice(0, count);
    }
    return pending.slice();
  }
  function consume() {
    const batch = pending;
    pending = [];
    return batch;
  }
  reset();
  return { release, consume, reset, pending: () => pending.slice(), hasMore: () => remaining.length > 0 };
});
