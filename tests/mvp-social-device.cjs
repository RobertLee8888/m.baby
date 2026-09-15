const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://localhost:4173/';
const output = process.env.QA_OUTPUT || '/tmp/alva-thesis-device';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, reducedMotion: 'reduce', colorScheme: 'light' });
  const errors = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  const url = new URL(base); url.hash = '/mvp-social';
  try {
    await page.goto(url.href);
    const frame = page.frames().find(f => f.parentFrame() === page.mainFrame());
    await frame.waitForFunction(() => document.querySelector('#startupLoader')?.hidden);
    for (let index = 0; index < 6; index++) {
      await page.locator('#deviceTrigger').click();
      await page.locator('#deviceMenu .tb-option').nth(index).click();
      await page.waitForTimeout(200);
      for (const tab of ['feed', 'market', 'me']) {
        await frame.locator('#tabBar [data-tab="' + tab + '"]').click();
        const m = await frame.evaluate(tab => {
          const rect = n => { const r = n.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, width: r.width }; };
          const css = getComputedStyle(document.documentElement);
          const root = document.querySelector(tab === 'feed' ? '#feed' : tab === 'me' ? '.thesis-me' : '.thesis-search');
          return { device: document.documentElement.dataset.deviceId, root: rect(root), tab: rect(document.getElementById('tabBar')), top: parseFloat(css.getPropertyValue('--status-h')), bottom: parseFloat(css.getPropertyValue('--home-h')), height: innerHeight, width: innerWidth };
        }, tab);
        assert.equal(m.root.width, m.width);
        assert.equal(m.root.bottom, m.tab.top);
        assert.equal(m.tab.bottom, m.height - m.bottom);
        if (tab !== 'feed') assert.equal(m.root.top, m.top);
        await page.locator('#phoneScreen').screenshot({ path: output + '/' + tab + '-' + m.device + '.png' });
        checks.push(tab + ': ' + m.device);
      }
      await frame.locator('#tabBar [data-tab="feed"]').click();
      await frame.locator('#cards .thesis-body').first().click();
      await frame.waitForFunction(() => getComputedStyle(document.getElementById('tabBar')).visibility === 'hidden');
      const detail = await frame.evaluate(() => {
        const page = document.querySelector('.social-page:not([hidden]):not([inert])');
        const css = getComputedStyle(document.documentElement);
        return { top: page.getBoundingClientRect().top, bottom: page.getBoundingClientRect().bottom, footer: page.querySelector('.social-detail-footer').getBoundingClientRect().bottom, safeTop: parseFloat(css.getPropertyValue('--status-h')), safeBottom: parseFloat(css.getPropertyValue('--home-h')), height: innerHeight, tab: getComputedStyle(document.getElementById('tabBar')).visibility };
      });
      assert.equal(detail.top, detail.safeTop);
      assert.equal(detail.bottom, detail.height - detail.safeBottom);
      assert.equal(detail.footer, detail.bottom);
      assert.equal(detail.tab, 'hidden');
      await frame.locator('.social-page:not([hidden]):not([inert]) .social-page-back').click();
      await frame.waitForFunction(() => !document.querySelector('.social-page:not([hidden]):not([inert])'));
    }
    await page.setViewportSize({ width: 393, height: 852 });
    await page.waitForTimeout(200);
    const native = await frame.evaluate(() => ({ status: getComputedStyle(document.querySelector('.system-bar')).display, home: getComputedStyle(document.querySelector('.home-indicator')).display }));
    assert.deepEqual(native, { status: 'none', home: 'none' });
    for (let i = 0; i < 20; i++) {
      await frame.locator('#cards .thesis-body').first().click();
      await frame.locator('.social-page:not([hidden]):not([inert]) .social-page-back').click();
      await frame.waitForFunction(() => !document.querySelector('.social-page:not([hidden]):not([inert])'));
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    for (const tab of ['feed', 'market', 'me']) {
      await frame.locator('#tabBar [data-tab="' + tab + '"]').click();
      await page.screenshot({ path: output + '/dark-' + tab + '.png' });
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ checks, repeatedNavigation: 20, errors, output }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
