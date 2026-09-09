/* Run against the static preview with Playwright installed externally:
   PLAYWRIGHT_MODULE=/path/to/playwright CHROME_PATH=/path/to/chrome node tests/mvp-browser.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://localhost:4173/mvp.html';
const output = process.env.QA_OUTPUT || '/tmp/alva-mvp-qa';
// Source heights from 4074:41944; feed quotes updated by 4361:42268.
// Report visual differences separately
// from functional assertions; a passing interaction test is not pixel QA.
const figmaHeights = {
  P01: [134, 172], P02: [348, 466], P03: [309, 500.0625], P04: [208, 312],
  P05: [277, 391.0625], P06: [156, 194], P07: [255, 391.0625],
  S01: [144, 194], S02: [287, 413.0625], S03: [265, 391.0625], S04: [122, 172],
  S05: [122, 172], S06: [265, 413.0625], S07: [144, 194],
};
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const errors = [];
  const results = [];
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url() + ': ' + response.status()); });
  const shot = name => page.screenshot({ path: path.join(output, name + '.png') });
  const ready = async () => { await page.goto(base); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1800); };
  const active = () => page.locator('#feedFilters [aria-selected="true"]').getAttribute('data-ticker');
  const all = async () => { await page.locator('#filter-All').click(); await page.waitForTimeout(200); };
  const follow = async query => {
    await page.locator('#allTickers').click();
    await page.waitForTimeout(320);
    await page.locator('.following-search input').fill(query);
  };
  const pick = async sym => {
    await follow(sym);
    await page.locator('.following-item[data-ticker="' + sym + '"]').click();
    await page.waitForTimeout(350);
    assert.equal(await active(), sym);
  };
  const expose = async locator => {
    await locator.evaluate(node => {
      const feed = document.getElementById('feed');
      const scale = feed.getBoundingClientRect().width / feed.clientWidth;
      feed.scrollTop += (node.getBoundingClientRect().top - feed.getBoundingClientRect().top) / scale - 128;
    });
    await page.waitForTimeout(80);
  };
  try {
    await ready();
    assert.equal(await active(), 'All');
    assert.equal(await page.locator('.feed-filters').evaluate(n => n.offsetHeight), 56);
    assert.equal(await page.locator('#filter-All').evaluate(n => getComputedStyle(n).fontSize), '12px');
    assert.equal(await page.locator('#filter-TSM').count(), 0);
    assert.equal(await page.locator('.system-bar').isVisible(), false);
    assert.equal(await page.locator('.home-indicator').isVisible(), false);
    await shot('393-feed');
    const arrowX = (await page.locator('#allTickers').boundingBox()).x;
    await page.locator('#feedFilters').evaluate(n => { n.scrollLeft = 150; });
    assert.equal((await page.locator('#allTickers').boundingBox()).x, arrowX);
    await page.locator('#feed').evaluate(n => { n.scrollTop = 240; });
    await page.waitForTimeout(80);
    assert.equal((await page.locator('.feed-filters').boundingBox()).y, 0);
    await shot('393-pinned');

    await pick('GOOG');
    assert.ok(await page.locator('#cards > .card').count() > 0);
    assert.ok(await page.locator('#cards > .card').evaluateAll(ns => ns.every(n => n.dataset.tickers.split(' ').includes('GOOG'))));
    await shot('393-filtered');
    await all();
    await pick('TSM');
    assert.equal(await page.locator('#filter-TSM .feed-filter-count').count(), 0);
    assert.equal(await page.locator('#feedFilters > button').nth(1).getAttribute('data-ticker'), 'TSM');
    assert.equal(await page.locator('#cards > .card').count(), 2);
    await shot('393-older-ticker');
    await all();
    assert.equal(await page.locator('#filter-TSM').count(), 0);
    await follow('does-not-exist');
    assert.equal(await page.locator('.following-empty p').innerText(), 'No matches');
    assert.equal(await page.locator('.following-empty button').innerText(), 'Clear filters');
    await page.locator('.following-clear').click();
    assert.equal(await page.locator('.following-item').count(), 14);
    assert.equal(await page.locator('.following-item .feed-filter-count').count(), 0);
    await page.locator('.following-search input').blur();
    await shot('393-following');
    await page.goBack();
    await page.waitForTimeout(350);
    assert.equal(await page.locator('.following-page').getAttribute('aria-hidden'), 'true');
    await page.goForward();
    await page.waitForTimeout(350);
    assert.equal(await page.locator('.following-page').getAttribute('aria-hidden'), 'false');
    await page.locator('.following-back').click();
    await page.waitForTimeout(350);
    await pick('COIN');
    assert.equal(await page.locator('#cards > .card').count(), 0);
    await page.locator('#cards .following-clear').click();

    for (const id of ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07']) {
      const quote = page.locator('.quote[data-source-id="' + id + '"]');
      await expose(quote);
      await quote.screenshot({ path: path.join(output, 'quote-' + id + '.png') });
      const size = await quote.boundingBox();
      assert.equal(size.width, 361);
      await quote.locator('.quote-copy').first().click();
      await page.waitForTimeout(450);
      const source = page.locator('#sheetBody > .src').first();
      assert.equal(await source.getAttribute('data-source-id'), id);
      assert.equal((await source.boundingBox()).width, 393);
      await source.screenshot({ path: path.join(output, 'source-' + id + '.png') });
      const sourceHeight = (await source.boundingBox()).height;
      results.push({ id, quoteHeight: size.height, sourceHeight,
        quoteDelta: size.height - figmaHeights[id][0], sourceDelta: sourceHeight - figmaHeights[id][1] });
      if (id === 'P02') {
        assert.equal(await source.locator('.src-nested').count(), 2);
        assert.equal((await source.boundingBox()).height, 466);
      }
      const links = await source.locator('a').evaluateAll(ns => ns.map(n => ({ href: n.href, target: n.target, rel: n.rel })));
      assert.ok(links.every(link => link.href.startsWith('https://') && link.target === '_blank' && link.rel.includes('noopener')));
      await page.locator('#sheetTop button[aria-label="Close"]').click();
      await page.waitForTimeout(450);
    }
    const earnings = page.locator('.quote[data-source-id="P06"]');
    await expose(earnings);
    assert.ok((await earnings.innerText()).includes('over 400 datacenters across 70 regions'));
    assert.equal(await earnings.locator('.quote-more').count(), 0);
    assert.equal(await page.locator('#sheet').getAttribute('aria-hidden'), 'true');
    await pick('MSFT');
    assert.equal(await earnings.locator('.quote-more').count(), 0);
    await all();

    for (const width of [320, 360, 430]) {
      await page.setViewportSize({ width, height: 852 });
      await all();
      await shot(width + '-feed');
      const quote = page.locator('.quote[data-source-id="P02"]');
      await expose(quote);
      await shot(width + '-nested-quote');
      assert.ok(await quote.evaluate(n => n.scrollWidth <= n.clientWidth));
      assert.ok(await page.locator('body').evaluate(n => n.scrollWidth <= n.clientWidth));
      if (width < 360) assert.equal(await page.locator('.phone-screen').evaluate(n => n.clientWidth), 360);
      await quote.locator('.quote-copy').first().click();
      await page.waitForTimeout(450);
      await shot(width + '-source');
      assert.ok(await page.locator('#sheetBody').evaluate(n => n.scrollWidth <= n.clientWidth));
      await page.locator('#sheetTop button[aria-label="Close"]').click();
      await page.waitForTimeout(450);
      await follow('');
      await shot(width + '-following');
      assert.ok(await page.locator('.following-page').evaluate(n => n.scrollWidth <= n.clientWidth));
      await page.locator('.following-back').click();
      await page.waitForTimeout(350);
    }
    await page.setViewportSize({ width: 393, height: 852 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await all();
    await shot('393-dark-feed');
    await expose(page.locator('.quote[data-source-id="P02"]'));
    await shot('393-dark-nested');
    await page.locator('.quote[data-source-id="P02"] > .quote-copy').click();
    await page.waitForTimeout(450);
    await shot('393-dark-source');
    await page.locator('#sheetTop button[aria-label="Close"]').click();
    await page.waitForTimeout(450);
    await follow('');
    await shot('393-dark-following');
    await page.locator('.following-back').click();
    await page.waitForTimeout(350);

    await pick('TSM');
    assert.equal(await page.locator('#newPillText').innerText(), '1 new feed');
    await page.locator('#newPill').click();
    await page.waitForTimeout(3600);
    assert.equal(await active(), 'TSM');
    assert.equal(await page.locator('#cards > .card').count(), 3);
    assert.equal(await page.locator('#filter-TSM .feed-filter-count').innerText(), '1');
    await all();
    assert.equal(await page.locator('#filter-TSM .feed-filter-count').innerText(), '1');
    const broken = await page.locator('img').evaluateAll(ns => ns.filter(n => !n.complete || !n.naturalWidth).map(n => n.src));
    assert.deepEqual(broken, []);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ functionalPassed: true, references: results,
      visualDifferences: results.filter(row => row.quoteDelta || row.sourceDelta), errors, output }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
