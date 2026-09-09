/* Same environment variables as mvp-browser.cjs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://localhost:4173/mvp.html';
const output = process.env.QA_OUTPUT || '/tmp/alva-mvp-feed-reference';
const order = ['P01', 'P06', 'S04', 'S01', 'P02', 'S02', 'P07', 'S05', 'S06', 'P04', 'S07'];
const heights = [545, 442, 386, 645.0625, 612, 551, 519, 386, 529, 472, 430];
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  page.setDefaultTimeout(8000);
  const errors = [], measurements = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url() + ': ' + response.status()); });
  const card = id => page.locator('[data-card-id="source-' + id + '"]');
  const expose = async locator => {
    await locator.evaluate(n => {
      const feed = document.querySelector('#feed');
      const scale = feed.getBoundingClientRect().width / feed.clientWidth;
      feed.scrollTop += (n.getBoundingClientRect().top - feed.getBoundingClientRect().top) / scale - 72;
    });
    await page.waitForTimeout(100);
  };
  try {
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1700);
    assert.equal(await page.locator('#cards > :first-child').getAttribute('class'), 'card portfolio-entry');
    assert.deepEqual(await page.locator('#cards > .card').evaluateAll(ns => ns.slice(1, 12).map(n => n.dataset.cardId)), order.map(id => 'source-' + id));
    const total = await page.locator('#cards > .card').count();
    assert.ok(total > 20, 'older content remains below the new complete cards');
    assert.equal(await page.locator('[data-figma-node]').count(), 11);

    for (const [index, id] of order.entries()) {
      const node = card(id);
      assert.equal(await node.count(), 1, id + ' must not be duplicated');
      assert.ok((await node.locator('.blk-lead').textContent()).length > 5);
      assert.ok(await node.locator('.card-head .ticker').count() > 0);
      assert.equal(await node.getByRole('button', { name: 'Dig Deeper', exact: true }).count(), 1);
      await expose(node);
      await node.screenshot({ path: path.join(output, '393-' + id + '.png'), style: '#newPill { visibility: hidden; }' });
      const height = (await node.boundingBox()).height;
      measurements.push({ id, height, figma: heights[index], delta: height - heights[index] });
      // The zero-tracking web font fits P01's heading on one line at 393px.
      // Keep this known 22px wrap difference visible rather than hiding it.
      const wrapDelta = id === 'P01' ? -22 : 0;
      assert.ok(Math.abs(height - heights[index] - wrapDelta) < 1, id + ' card geometry differs from Figma: ' + height);
      assert.ok(await node.locator('img').evaluateAll(ns => ns.every(n => n.complete && n.naturalWidth > 0)));
      await expose(node.locator('.foot-lead'));
      await node.locator('.foot-lead').click();
      await page.waitForTimeout(400);
      assert.equal(await page.locator('#sheetBody > .src').count(), 1);
      assert.equal(await page.locator('#sheetBody > .src').getAttribute('data-source-id'), id);
      if (id === 'P02' || id === 'P04') {
        assert.ok((await page.locator('#sheetTop h2').textContent()).endsWith('2'));
        assert.equal(await node.locator('.sources img').count(), 2);
        assert.equal(await node.locator('.foot-more').textContent(), '+1');
        assert.equal(await page.locator('#sheetBody .src-nested').count(), id === 'P02' ? 2 : 1);
      }
      const links = await page.locator('#sheetBody a').evaluateAll(ns => ns.map(n => n.href));
      assert.ok(links.length > 0 && links.every(url => url.startsWith('https://')));
      await page.locator('#sheetTop button[aria-label="Close"]').click();
      await page.waitForTimeout(350);
    }

    assert.equal(await card('S02').locator('.stance').getAttribute('class'), 'stance bear');
    assert.equal(await card('P06').locator('.stance').getAttribute('class'), 'stance flat');
    assert.ok((await card('P07').locator('.ticker-logo').getAttribute('src')).endsWith('source-berkshire.png'));
    for (const width of [320, 360, 430]) {
      await page.setViewportSize({ width, height: 852 });
      for (const id of order) {
        const node = card(id);
        assert.ok(await node.locator('.blk-text, .quote, .foot-lead, .ask').evaluateAll(ns => ns.every(n => n.scrollWidth <= n.clientWidth + 1)));
        await expose(node);
        await node.screenshot({ path: path.join(output, width + '-' + id + '.png'), style: '#newPill { visibility: hidden; }' });
      }
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await expose(card('S02'));
    await page.screenshot({ path: path.join(output, 'dark-video-card.png') });

    await page.setViewportSize({ width: 393, height: 852 });
    await expose(card('P01'));
    await card('P01').locator('.feed-preview-more').click();
    await page.waitForTimeout(250);
    assert.equal(await card('P01').locator('.feed-preview').getAttribute('data-expanded'), 'true');
    await page.locator('#filter-MSFT').click();
    assert.equal(await card('P01').locator('.feed-preview-more').count(), 0);
    assert.equal(await card('P06').locator('.quote-more').count(), 0);
    await page.locator('#filter-All').click();

    await expose(card('P07').locator('.ticker'));
    await card('P07').locator('.ticker').click();
    await page.waitForTimeout(400);
    assert.ok((await page.locator('#sheetBody').textContent()).includes('Berkshire Hathaway'));
    assert.ok(!(await page.locator('#sheetBody').textContent()).includes('NaN'));
    await page.locator('#sheetTop button[aria-label="Follow BRK.B"]').click();
    await page.locator('#sheetTop button[aria-label="Close"]').click();
    await page.waitForTimeout(350);
    const berkshire = page.locator('[data-ticker="BRK.B"][role="tab"]');
    assert.equal(await berkshire.locator('.feed-filter-count').textContent(), '3');
    await berkshire.click();
    assert.equal(await page.locator('#cards > .card').count(), 3);
    await page.locator('#filter-All').click();
    await expose(card('S04').locator('.ask'));
    await card('S04').locator('.ask').click();
    assert.ok(await page.locator('#screenChat').evaluate(n => n.classList.contains('current')));
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, total, measurements, errors, output }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
