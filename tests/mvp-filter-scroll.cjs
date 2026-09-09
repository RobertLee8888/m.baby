/* Same environment variables as mvp-browser.cjs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://localhost:4173/mvp.html';
const output = process.env.QA_OUTPUT || '/tmp/alva-mvp-filter-scroll';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
  const errors = [], checked = [];
  page.on('pageerror', error => errors.push(error.message));
  const near = (a, b) => assert.ok(Math.abs(a - b) < .75, `${a} should equal ${b}`);
  const measure = () => page.evaluate(() => {
    const screen = document.querySelector('.phone-screen');
    const scroller = document.querySelector('#feedFilters');
    const first = scroller.firstElementChild;
    const viewport = scroller.parentElement;
    const arrow = document.querySelector('#allTickers');
    const box = screen.getBoundingClientRect();
    const scale = box.width / screen.clientWidth;
    const x = node => (node.getBoundingClientRect().left - box.left) / scale;
    const button = first.getBoundingClientRect();
    const edgeTarget = document.elementFromPoint(box.left + scale, button.top + button.height / 2);
    return { screenWidth: screen.clientWidth, scrollX: x(scroller), clipX: x(viewport),
      firstX: x(first), arrowX: x(arrow), scrollLeft: scroller.scrollLeft,
      edgeBelongsToFirst: first.contains(edgeTarget), count: scroller.children.length };
  });
  try {
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1800);
    for (const mode of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: mode });
      for (const width of [320, 360, 393, 430]) {
        await page.setViewportSize({ width, height: 852 });
        await page.locator('#feedFilters').evaluate(n => { n.scrollLeft = 0; });
        await page.waitForTimeout(200);
        const initial = await measure();
        near(initial.scrollX, 0);
        near(initial.clipX, 0);
        near(initial.firstX, 16);
        near(initial.arrowX, initial.screenWidth - 48);
        await page.locator('#feedFilters').evaluate(n => { n.scrollLeft = 24; });
        await page.waitForTimeout(100);
        const scrolled = await measure();
        near(scrolled.firstX, -8);
        near(scrolled.arrowX, initial.arrowX);
        assert.equal(scrolled.edgeBelongsToFirst, true, 'partially scrolled tab must paint/hit-test at the screen edge');
        await page.screenshot({ path: path.join(output, `${width}-${mode}-scrolled.png`) });
        // Home must restore the initial gutter after traversing the strip.
        await page.locator('#filter-All').focus();
        await page.keyboard.press('End');
        await page.keyboard.press('Home');
        await page.waitForTimeout(200);
        const restored = await measure();
        near(restored.scrollLeft, 0);
        near(restored.firstX, 16);
        checked.push({ width, mode, leftClip: scrolled.clipX, restoredGutter: restored.firstX });
      }
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, checked, errors, output }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
