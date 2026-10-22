const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://127.0.0.1:4177/';
const output = process.env.QA_OUTPUT || '/tmp/thesis-scroll-qa';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const engine = process.env.QA_ENGINE === 'webkit' ? webkit : chromium;
  const browser = await engine.launch({ headless: true, ...(engine === chromium && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 2 });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const near = (a, b) => assert.ok(Math.abs(a - b) < .6, `${a} differs from ${b}`);
  const settled = () => page.waitForFunction(() => !document.querySelector('[data-transition="opening"], [data-transition="closing"]'));
  const paint = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const metrics = () => page.evaluate(() => {
    const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
    const title = document.querySelector('.motion-title h1'), range = document.createRange(); range.selectNodeContents(title);
    return { header: rect('.motion-feed-header'), filters: rect('.motion-categories'), first: rect('#feedItems > :first-child'),
      title: range.getBoundingClientRect().toJSON(), viewport: rect('#feedScroll'),
      opacity: Number(getComputedStyle(title).opacity), scrollTop: document.querySelector('#feedScroll').scrollTop,
      divider: getComputedStyle(document.querySelector('.motion-feed-header')).boxShadow,
      filterDivider: getComputedStyle(document.querySelector('.motion-categories')).boxShadow,
      titleDivider: getComputedStyle(document.querySelector('.motion-title')).boxShadow };
  });
  const scrollTo = async top => { await page.locator('#feedScroll').evaluate((node, y) => node.scrollTop = y, top); await paint(); };
  try {
    for (const width of [320, 360, 393, 430]) {
      await page.setViewportSize({ width, height: 759 });
      await page.goto(base + 'thesis-motion.html?scroll-qa=' + width);
      await page.evaluate(() => document.fonts.ready);
      const initial = await metrics(), scale = Math.min(1, width / 360);
      near(initial.header.height, 94 * scale); near(initial.first.top, initial.header.bottom);
      for (const top of [10, 25, 49, 50, 51, 150, 51, 50, 49, 25, 0]) {
        await scrollTo(top); const state = await metrics();
        near(state.scrollTop, top);
        near(state.header.height, (94 - Math.min(50, top)) * scale);
        near(state.title.x, initial.title.x); near(state.title.y, initial.title.y);
        near(state.filters.height, 44 * scale); near(state.filters.bottom, state.header.bottom);
        near(state.first.top, initial.first.top - top * scale);
        near(state.viewport.top, initial.viewport.top); near(state.viewport.height, initial.viewport.height);
        assert.notEqual(state.divider, 'none');
        assert.equal(state.filterDivider, 'none'); assert.equal(state.titleDivider, 'none');
        if (top >= 20) assert.equal(state.opacity, 0);
        if (!top) assert.equal(state.opacity, 1);
        if (width === 393 && [0, 25, 50, 150].includes(top)) await page.screenshot({ path: `${output}/for-you-scroll-${top}.png` });
      }
      // Even a short filtered list can collapse the complete title space.
      await page.getByRole('button', { name: 'Memory', exact: true }).click(); await paint();
      await scrollTo(10000); near((await metrics()).header.height, 44 * scale);
      await page.getByRole('button', { name: 'All', exact: true }).click();
      const reset = await metrics(); near(reset.scrollTop, 0); near(reset.header.height, 94 * scale);
    }

    await page.setViewportSize({ width: 393, height: 759 });
    await scrollTo(100);
    for (const selector of ['[data-post="tom-lee-spy"] .motion-open', '[data-post="raoul-pal-ai"] .motion-person-link', '[data-post="raoul-pal-ai"] [data-ticker="GOOGL"]']) {
      const before = await metrics();
      await page.locator(selector).evaluate(node => node.click()); await settled();
      await page.evaluate(() => history.back()); await settled();
      const after = await metrics();
      near(after.scrollTop, before.scrollTop); near(after.header.height, before.header.height); near(after.first.top, before.first.top);
    }
    // Horizontal filtering gestures must not expand the vertical chrome.
    await page.locator('.motion-categories').evaluate(node => node.scrollLeft = 150); await paint();
    near((await metrics()).header.height, 44);
    await page.locator('.motion-nav button').first().click();
    await page.waitForFunction(() => document.querySelector('#feedScroll').scrollTop === 0); await paint();
    near((await metrics()).header.height, 94);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await scrollTo(50);
    near((await metrics()).header.height, 44);
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0, 'scroll chrome follows the finger without a second animation');

    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.goto(base + 'index.html#/thesis-motion');
    await page.locator('#deviceTrigger').click(); await page.getByRole('option', { name: /Galaxy A16/ }).click();
    await page.waitForFunction(() => {
      const win = document.querySelector('iframe').contentWindow;
      const app = win.document.querySelector('#motionApp').getBoundingClientRect();
      return win.innerWidth === 412 && win.innerHeight === 892
        && Math.abs(app.height - win.innerHeight) < .5 && Math.abs(app.width - win.innerWidth) < .5;
    });
    const frame = page.frameLocator('iframe');
    await frame.locator('#feedScroll').evaluate(node => node.scrollTop = 150);
    await page.waitForFunction(() => {
      const win = document.querySelector('iframe').contentWindow;
      return Number(win.getComputedStyle(win.document.querySelector('#feed')).getPropertyValue('--feed-header-p')) === 1;
    });
    const insets = await frame.locator('#feed').evaluate(node => {
      const header = node.querySelector('.motion-feed-header').getBoundingClientRect();
      const nav = node.querySelector('.motion-nav').getBoundingClientRect(), css = getComputedStyle(document.documentElement);
      return { headerTop: header.top, headerHeight: header.height, navBottom: nav.bottom, status: parseFloat(css.getPropertyValue('--status-h')), home: parseFloat(css.getPropertyValue('--home-h')), height: innerHeight };
    });
    near(insets.headerTop, insets.status); near(insets.headerHeight, 44); near(insets.navBottom, insets.height - insets.home);
    await page.screenshot({ path: output + '/for-you-scroll-android.png' });
    assert.deepEqual(errors, []);
    console.log('PASS: reversible header collapse, stationary title fade, one divider, 1:1 content movement, short filters, restored navigation, horizontal scroll, reduced motion and Android insets.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
