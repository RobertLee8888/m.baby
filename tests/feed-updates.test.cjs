const assert = require('node:assert/strict');
const test = require('node:test');
const createUpdates = require('../mvp-feed-updates.js');
const cards = Array.from({ length: 7 }, (_, id) => Object.freeze({ id }));

test('random batches contain one to three unseen cards', () => {
  for (const [random, count] of [[0, 1], [.5, 2], [.999, 3]]) {
    const queue = createUpdates(cards, () => random);
    assert.equal(queue.pending().length, 0);
    assert.equal(queue.release().length, count);
    assert.equal(queue.pending().length, count);
  }
});

test('the displayed batch is stable until consumed, and never repeats', () => {
  const queue = createUpdates(cards, () => .5);
  const consumed = [];
  while (queue.hasMore()) {
    const pending = queue.release();
    assert.deepEqual(queue.release(), pending);
    assert.deepEqual(queue.consume(), pending);
    consumed.push(...pending);
    assert.deepEqual(queue.pending(), []);
  }
  assert.deepEqual(consumed, cards);
  assert.equal(new Set(consumed.map(card => card.id)).size, cards.length);
  assert.deepEqual(queue.release(), []);
  assert.deepEqual(queue.consume(), []);
});

test('snapshots cannot mutate the pending batch; reset clears it', () => {
  const queue = createUpdates(cards, () => .5);
  queue.release().pop();
  queue.pending().pop();
  assert.equal(queue.pending().length, 2);
  queue.consume();
  queue.release();
  queue.reset();
  assert.deepEqual(queue.pending(), []);
  assert.deepEqual(queue.release(), cards.slice(0, 2));
  assert.deepEqual(createUpdates([]).release(), []);
});
