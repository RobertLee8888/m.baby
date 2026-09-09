/* Same environment variables as mvp-browser.cjs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://localhost:4173/mvp.html';
const output = process.env.QA_OUTPUT || '/tmp/alva-mvp-source-links';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const errors = [];
  try {
    for (const width of [320, 393, 430]) {
      const page = await browser.newPage({ viewport: { width, height: 852 }, isMobile: true, hasTouch: true, deviceScaleFactor: width === 393 ? 3 : 1 });
      page.setDefaultTimeout(8000);
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1800);
      for (const colorScheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme });
        for (const kind of ['legacy', 'linked']) {
          const card = kind === 'legacy'
            ? page.locator('#cards > .card').filter({ hasText: "Alibaba Group Holding's open-weight AI models" })
            : page.locator('[data-card-id="source-P02"]');
          const trigger = card.locator('.foot-lead');
          await trigger.evaluate(node => {
            const feed = document.getElementById('feed');
            const scale = feed.getBoundingClientRect().width / feed.clientWidth;
            feed.scrollTop += (node.getBoundingClientRect().top - feed.getBoundingClientRect().top) / scale - 128;
          });
          await trigger.click();
          await page.waitForTimeout(450);
          const links = page.locator('#sheetBody .src-open');
          assert.equal(await links.count(), kind === 'legacy' ? 7 : 1);
          const styles = await links.locator(':scope > span:first-child').evaluateAll(nodes => nodes.map(node => {
            const style = getComputedStyle(node);
            return [style.textDecorationLine, style.textDecorationStyle];
          }));
          assert.ok(styles.every(([line, style]) => line === 'underline' && style === 'dotted'), `${width}/${colorScheme}/${kind}: every domain must be underlined`);
          assert.equal(await page.locator('#sheetBody a.src-open').count(), kind === 'legacy' ? 0 : 1);
          assert.equal(await page.locator('#sheetBody .src-nested .src-open').count(), 0);
          // Check actual paint, not just the computed declaration.
          const link = links.first();
          const decorated = await link.screenshot();
          const plain = await link.screenshot({ style: '.src-open > span:first-child { text-decoration-line: none !important; }' });
          assert.ok(!decorated.equals(plain), `${width}/${colorScheme}/${kind}: underline must paint`);
          await page.screenshot({ path: path.join(output, `${width}-${colorScheme}-${kind}.png`) });
          assert.ok(await page.locator('#sheetBody').evaluate(node => node.scrollWidth <= node.clientWidth));
          await page.locator('#sheetTop button[aria-label="Close"]').click();
          await page.waitForTimeout(350);
        }
      }
      await page.close();
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, cases: 12, output }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
