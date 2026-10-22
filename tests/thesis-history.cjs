const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://127.0.0.1:4177/';
const output = process.env.QA_OUTPUT || '/tmp/thesis-history-qa';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const engine = process.env.QA_ENGINE === 'webkit' ? webkit : chromium;
  const browser = await engine.launch({ headless: true, ...(engine === chromium && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 2 });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  const settled = () => page.waitForFunction(() => !document.querySelector('[data-transition="opening"], [data-transition="closing"]'));
  const active = () => page.locator('.motion-app > section:not([hidden]):not([aria-hidden="true"])');
  let visit = 0;
  const fresh = async (hash = '') => {
    await page.goto(base + 'thesis-motion.html?history-qa=' + ++visit + hash);
    await page.evaluate(() => document.fonts.ready); await settled();
  };
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1, `${a} differs from ${b}`);
  try {
    await fresh();
    const records = await page.evaluate(async () => {
      const { POSTS } = await import('./thesis-motion-data.js?v=3');
      const { versionsFor } = await import('./thesis-motion-versions.js?v=1');
      return POSTS.map(post => ({ id: post.id, count: post.updateCount, versions: versionsFor(post) }));
    });
    assert.equal(records.length, 11);
    assert.equal(records.reduce((sum, post) => sum + post.versions.length, 0), 29);
    for (const post of records) {
      assert.equal(post.versions.length, post.count);
      await fresh('#' + post.id + '/updates');
      assert.equal(await active().getAttribute('aria-label'), 'All updates');
      assert.equal(await active().locator('.motion-update-row').count(), post.count);
      assert.equal(await active().locator('.motion-latest').count(), 1);
      const ids = post.versions.slice(1).map(item => item.version);
      assert.deepEqual(ids, [...ids].sort().reverse(), 'versions remain in chronological order');
      for (const version of post.versions.slice(1)) {
        const link = active().getByRole('link', { name: 'Read update from ' + version.date, exact: true });
        await link.scrollIntoViewIfNeeded();
        const position = await active().locator('.motion-updates-scroll').evaluate(node => node.scrollTop);
        await link.click(); await settled();
        const detail = active();
        assert.equal(await detail.getAttribute('data-version'), version.version);
        assert.equal(await detail.locator('.motion-date time').textContent(), version.date);
        assert.ok((await detail.locator('.motion-timeline > .motion-body').textContent()).startsWith(version.text));
        assert.deepEqual(await detail.locator('.motion-source-links a').evaluateAll(nodes => nodes.map(node => node.href)), version.sources);
        assert.equal(await detail.locator('.motion-latest, .motion-chart, .motion-signal-source, .motion-related-panel .motion-post').count(), 0, 'a historical version never borrows the latest context');
        assert.equal(await detail.getByRole('button', { name: 'View latest', exact: true }).isVisible(), true);
        await detail.getByRole('button', { name: 'Back to all updates', exact: true }).click(); await settled();
        near(await active().locator('.motion-updates-scroll').evaluate(node => node.scrollTop), position);
      }
      await active().locator('.motion-update-open').first().click(); await settled();
      assert.equal(await page.locator('.motion-updates').count(), 0, 'latest timeline row returns to its existing detail');
      assert.equal(await active().getAttribute('data-version'), 'latest');
    }

    // Sharing, bookmarking and nested navigation retain the selected version.
    await fresh('#chamath-nvda/version/2026-05-02');
    const detail = active();
    await page.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.sharedVersion = data; } }));
    await detail.getByRole('button', { name: 'Share thesis', exact: true }).click();
    assert.equal(await page.evaluate(() => new URL(window.sharedVersion.url).hash), '#chamath-nvda/version/2026-05-02');
    await detail.getByRole('button', { name: 'Bookmark', exact: true }).click();
    await detail.getByRole('button', { name: 'NVDA, up trend', exact: true }).click(); await settled();
    await page.evaluate(() => history.back()); await settled();
    assert.equal(await active().getAttribute('data-version'), '2026-05-02');
    await active().getByRole('button', { name: 'View latest', exact: true }).click(); await settled();
    assert.equal(await active().getAttribute('data-version'), 'latest');
    assert.equal(await active().locator('.motion-detail-scroll').evaluate(node => node.scrollTop), 0);
    assert.equal(await active().getByRole('button', { name: 'Remove bookmark', exact: true }).isVisible(), true);
    assert.equal(await page.locator('.motion-updates').count(), 0);

    // Page/depth use one reversible driver, including a mid-entry Back/Forward.
    await fresh('#tom-lee-spy');
    await page.locator('#detail .motion-history').scrollIntoViewIfNeeded();
    const detailTop = await page.locator('#detail .motion-detail-scroll').evaluate(node => node.scrollTop);
    await page.evaluate(() => {
      document.querySelector('#detail .motion-history').click();
      const animation = document.getAnimations()[0]; animation.pause(); animation.currentTime = 100;
    });
    assert.equal(await page.evaluate(() => document.getAnimations().length), 1);
    assert.equal(await page.evaluate(() => document.getAnimations()[0].effect.getTiming().duration), 340);
    const moving = await page.locator('.motion-updates').boundingBox();
    assert.ok(moving.x > 0 && moving.x < 393); near(moving.height, 759);
    await page.screenshot({ path: output + '/history-mid-transition.png' });
    await page.evaluate(() => history.back()); await settled();
    assert.equal(await page.locator('.motion-updates').count(), 0);
    near(await page.locator('#detail .motion-detail-scroll').evaluate(node => node.scrollTop), detailTop);
    await page.evaluate(() => history.forward()); await settled();
    assert.equal(await active().getAttribute('aria-label'), 'All updates');
    await page.screenshot({ path: output + '/all-updates-393.png' });
    await page.setViewportSize({ width: 430, height: 900 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await active().getAttribute('aria-label'), 'All updates');
    assert.deepEqual(errors, [], 'resizing the timeline must not use detail-only panel geometry');

    // Direct URLs and empty-context tabs work at every supported phone width.
    for (const width of [320, 360, 393, 430]) {
      await page.setViewportSize({ width, height: 759 });
      await fresh('#tom-lee-spy/version/2026-08-07');
      assert.equal(await active().getAttribute('data-version'), '2026-08-07');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const bounds = await active().getByRole('button', { name: 'View latest', exact: true }).boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
      await page.screenshot({ path: output + '/historical-detail-' + width + '.png' });
      await active().locator('.motion-detail-scroll').evaluate(node => node.scrollTop = node.scrollHeight);
      const pinned = await active().locator('.motion-detail-tabs').boundingBox(); near(pinned.y, 56 * Math.min(1, width / 360));
      const offset = await active().locator('.motion-detail-scroll').evaluate(node => node.scrollTop);
      // Avoid Playwright's automatic scroll-into-view rounding scaled sticky tabs in WebKit.
      const tab = await active().getByRole('tab', { name: 'Related thesis', exact: true }).boundingBox();
      await page.mouse.click(tab.x + tab.width / 2, tab.y + tab.height / 2);
      near(await active().locator('.motion-detail-scroll').evaluate(node => node.scrollTop), offset);
      assert.equal(await active().getByText('No related theses', { exact: true }).isVisible(), true);
      await page.reload(); await settled();
      assert.equal(await active().getAttribute('data-version'), '2026-08-07', 'reload preserves the historic reading target');
      await active().getByRole('button', { name: 'View all 4 updates', exact: true }).click(); await settled();
      assert.equal(await active().locator('[aria-current="true"]').getAttribute('href'), '#tom-lee-spy/version/2026-08-07');
      await active().locator('[aria-current="true"]').click(); await settled();
      assert.equal(await active().getAttribute('data-version'), '2026-08-07', 'the currently viewed row returns instead of duplicating the page');
      await active().getByRole('button', { name: 'View latest', exact: true }).click(); await settled();
      assert.equal(await active().getAttribute('data-version'), 'latest');
    }

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await fresh('#gavin-nvda/version/2026-07-22');
    assert.equal(await active().getAttribute('data-version'), '2026-07-22');
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    await active().getByRole('button', { name: 'View latest', exact: true }).click(); await settled();
    assert.equal(await active().getAttribute('data-version'), 'latest');
    await fresh('#tom-lee-spy/version/missing');
    assert.equal(await active().getAttribute('data-version'), 'latest');
    assert.deepEqual(errors, []);
    console.log('PASS: all 29 versions across 11 theses, 18 isolated historical details, correct sources, reversible page/depth, latest return, nested navigation, sharing/bookmarks, exact scroll restoration, deep links/reload, 320/360/393/430, empty pinned tabs and reduced motion.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
