const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.BROWSER || 'chromium';
const base = process.env.DEMO_URL || 'http://localhost:4173/mvp.html?feed=social';
const output = process.env.QA_OUTPUT || '/tmp/alva-social-scroll-' + engine;
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await playwright[engine].launch({ headless: true, ...(engine === 'chromium' && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 393, height: 1000 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const errors = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  const near = (a, b, label) => assert.ok(Math.abs(a - b) < 1, label + ': ' + a + ' != ' + b);
  async function ready(params = {}) {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    await page.goto(url.href);
    await page.waitForFunction(() => document.querySelector('#startupLoader')?.hidden);
    await page.evaluate(() => document.fonts.ready);
  }
  async function checkRow(selector, gutter, name, width, mode, fullWidth = true) {
    const row = page.locator(selector).first();
    await row.scrollIntoViewIfNeeded();
    await row.evaluate(n => { n.scrollLeft = 0; });
    const measure = () => row.evaluate(n => {
      const app = document.getElementById('mvpApp'), box = app.getBoundingClientRect();
      const scale = box.width / app.clientWidth;
      const rect = element => { const r = element.getBoundingClientRect(); return { left: (r.left - box.left) / scale, right: (r.right - box.left) / scale }; };
      const first = n.firstElementChild, last = n.lastElementChild;
      const edge = document.elementFromPoint(box.left + scale, first.getBoundingClientRect().top + first.getBoundingClientRect().height / 2);
      return { row: rect(n), first: rect(first), last: rect(last), width: app.clientWidth, scroll: n.scrollLeft, max: n.scrollWidth - n.clientWidth, visibleAtEdge: first.contains(edge), overflow: document.documentElement.scrollWidth > innerWidth };
    });
    const start = await measure();
    near(start.row.left, 0, name + ' left clipping edge');
    if (fullWidth) near(start.row.right, start.width, name + ' right clipping edge');
    near(start.first.left, gutter, name + ' initial gutter');
    assert.equal(start.overflow, false);
    if (start.max > gutter + 8) {
      await row.evaluate((n, x) => { n.scrollLeft = x; }, gutter + 8);
      await page.waitForTimeout(80);
      const middle = await measure();
      near(middle.first.left, -8, name + ' scrolled first item');
      assert.equal(middle.visibleAtEdge, true, name + ' must paint and hit-test inside the old gutter');
      await page.screenshot({ path: path.join(output, [width, mode, name, 'scrolled'].join('-') + '.png') });
      await row.evaluate(n => { n.scrollLeft = n.scrollWidth; });
      await page.waitForTimeout(80);
      const end = await measure();
      near(end.last.right, end.row.right - (fullWidth ? gutter : 24), name + ' trailing gutter');
      await row.evaluate(n => { n.scrollLeft = 0; });
      near((await measure()).first.left, gutter, name + ' restored gutter');
    }
    checks.push({ width, mode, name, clipLeft: start.row.left, clipRight: start.row.right });
  }
  try {
    for (const width of [320, 360, 393, 430]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const mode of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme: mode });
        await ready();
        await checkRow('#cards .media-row', 16, 'feed-media', width, mode);
        await checkRow('#feedFilters', 16, 'feed-filters', width, mode, false);
        await ready({ post: 'P01' });
        await checkRow('.social-page:not([hidden]) .media-row', 16, 'detail-media', width, mode);
        await checkRow('.social-page:not([hidden]) .social-large-tickers', 28, 'detail-tickers', width, mode);
        await ready({ profile: 'owner' });
        await checkRow('.social-page:not([hidden]) .social-profile-filters', 16, 'profile-filters', width, mode);
        await page.locator('.social-page:not([hidden])').getByRole('tab', { name: 'Bookmark', exact: true }).click();
        assert.equal(await page.locator('.social-page:not([hidden]) .social-profile-filters').evaluate(n => n.scrollWidth > n.clientWidth), true);
      }
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ engine, passed: true, checks, errors, output }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
