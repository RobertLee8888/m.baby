const { test } = require('node:test');
const assert = require('node:assert/strict');
const { symbol, hoursAgo, matches, tickerStats } = require('../mvp-feed-model.js');

const ticker = (sym, stance = 'flat') => ({ sym, stance });
const card = (age, ...tickers) => ({ age, tickers });

test('GOOGL and GOOG address the same feed filter', () => {
  assert.equal(symbol('GOOGL'), 'GOOG');
  assert.equal(symbol('All'), 'All');
  assert.equal(matches(card('1h ago', ticker('GOOGL')), 'GOOG'), true);
  assert.equal(matches(card('1h ago', ticker('MSFT')), 'GOOG'), false);
  assert.equal(matches(card('', []), 'All'), true);
});

test('relative ages share a 48-hour window; dated reference material is historical', () => {
  assert.equal(hoursAgo(card('Just now')), 0);
  assert.equal(hoursAgo(card('30m ago')), .5);
  assert.equal(hoursAgo(card('47h ago')), 47);
  assert.equal(hoursAgo(card('2d ago')), 48);
  assert.equal(hoursAgo(card('5d ago')), 120);
  assert.equal(hoursAgo(card('Nov 20, 2023')), Infinity);
  assert.equal(hoursAgo({ hoursAgo: 6 }), 6);
});

test('count cards, not repeated symbols, and omit unfollowed tickers', () => {
  const cards = [card('1h ago', ticker('GOOGL', 'bull'), ticker('GOOG', 'bull'), ticker('NVDA')),
    card('2h ago', ticker('GOOG', 'bear')), card('2d ago', ticker('GOOG', 'bull'))];
  const stats = tickerStats(cards, new Set(['GOOG']));
  assert.equal(stats.length, 1);
  assert.equal(stats[0].count, 2);
  assert.equal(stats[0].balance, 0);
  assert.equal(stats[0].latest, 1);
});

test('rank latest mention first and retain older zero-count tickers for Following', () => {
  const cards = [card('5d ago', ticker('TSM')), card('2h ago', ticker('NVDA')),
    card('30m ago', ticker('GOOGL')), card('Jan 27, 2025', ticker('META'))];
  const before = JSON.stringify(cards);
  const stats = tickerStats(cards, new Set(['TSM', 'GOOG', 'META', 'NVDA']));
  assert.deepEqual(stats.map(s => [s.sym, s.count]), [['GOOG', 1], ['NVDA', 1], ['TSM', 0], ['META', 0]]);
  assert.equal(JSON.stringify(cards), before);
});

test('refresh makes an older temporary ticker a counted recent ticker', () => {
  const cards = [card('2d ago', ticker('TSM')), card('5d ago', ticker('TSM'))];
  assert.equal(tickerStats(cards, new Set(['TSM']))[0].count, 0);
  cards.unshift(card('Just now', ticker('TSM', 'bull')));
  assert.equal(tickerStats(cards, new Set(['TSM']))[0].count, 1);
  assert.equal(cards.filter(c => matches(c, 'TSM')).length, 3);
});
