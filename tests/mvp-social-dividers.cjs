const assert = require('node:assert/strict');
const fs = require('node:fs');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.BROWSER || 'chromium';
const base = process.env.DEMO_URL || 'http://localhost:4173/mvp.html?feed=social';
const output = process.env.QA_OUTPUT || '/tmp/alva-social-dividers-' + engine;
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await playwright[engine].launch({ headless: true, ...(engine === 'chromium' && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 393, height: 1000 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const errors = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  const active = () => page.locator('.social-page:not([hidden]):not([inert])');
  async function ready(params = {}) {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    await page.goto(url.href);
    await page.waitForFunction(() => document.querySelector('#startupLoader')?.hidden);
    await page.evaluate(() => document.fonts.ready);
  }
  async function verify(nodes, label) {
    const styles = await nodes.evaluateAll(items => items.map(n => {
      const probe = document.createElement('div');
      probe.style.boxShadow = 'inset 0 calc(-1 * var(--hair)) 0 var(--l12)';
      n.append(probe);
      const expected = getComputedStyle(probe).boxShadow;
      probe.remove();
      return { actual: getComputedStyle(n).boxShadow, expected };
    }));
    assert.ok(styles.length, label + ' must have rows');
    styles.forEach((s, i) => assert.equal(s.actual, s.expected, label + ' row ' + i + ' needs exactly one bottom rule'));
    checks.push({ label, rows: styles.length });
  }
  try {
    for (const mode of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: mode });
      await ready();
      await verify(page.locator('#cards > .card'), mode + ' feed');
      await page.locator('#feedTrack').evaluate(n => n.classList.add('pulled'));
      await verify(page.locator('#cards > .card'), mode + ' refreshing');
      await page.locator('#feedTrack').evaluate(n => n.classList.remove('pulled'));
      await page.locator('#filter-GOOG').click();
      assert.equal(await page.locator('#cards > .card').count(), 1);
      const card = page.locator('#cards > .card');
      await verify(card, mode + ' single filtered item');
      assert.equal(await card.evaluate(n => n.offsetHeight), 535);
      await page.screenshot({ path: output + '/' + mode + '-single-item.png' });

      await ready({ post: 'P01' });
      await verify(active().locator('.social-signal'), mode + ' signals');
      await active().locator('.social-page-scroll').evaluate(n => { n.scrollTop = n.scrollHeight; });
      await page.screenshot({ path: output + '/' + mode + '-signals.png' });
      for (const tab of ['Related theses', 'Updates']) {
        await active().getByRole('tab', { name: tab, exact: true }).click();
        await verify(active().locator('.social-detail-panel .card'), mode + ' ' + tab);
      }
      await ready({ profile: 'owner' });
      for (const tab of ['Thesis', 'Followed', 'Bookmark']) {
        await active().getByRole('tab', { name: tab, exact: true }).click();
        await verify(active().locator('.social-profile-list .card, .social-follow-row'), mode + ' profile ' + tab);
      }
      await ready({ profile: 'chamath' });
      await verify(active().locator('.social-profile-list .card'), mode + ' external profile');
      for (const width of [320, 360, 393, 430]) {
        await page.setViewportSize({ width, height: 1000 });
        await active().locator('.social-page-scroll').evaluate(n => { n.scrollTop = n.scrollHeight; });
        await verify(active().locator('.social-profile-list .card').last(), mode + ' final item ' + width);
        await page.screenshot({ path: output + '/' + mode + '-last-item-' + width + '.png' });
      }
      await page.setViewportSize({ width: 393, height: 1000 });
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ engine, passed: true, checks, errors, output }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
