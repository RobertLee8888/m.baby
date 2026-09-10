const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://localhost:4173/';
const output = process.env.QA_OUTPUT || '/tmp/alva-social-device';
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
    await frame.locator('#cards .quote-body').first().click();
    for (const kind of ['detail', 'profile']) {
      if (kind === 'profile') await frame.locator('.tab[data-tab="me"]').click();
      for (let index = 0; index < 6; index++) {
        await page.locator('#deviceTrigger').click();
        await page.locator('#deviceMenu .tb-option').nth(index).click();
        await page.waitForTimeout(200);
        const m = await frame.evaluate(() => {
          const page = document.querySelector('.social-page:not([hidden]):not([inert])');
          const rect = n => { const r = n.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, width: r.width }; };
          const style = getComputedStyle(document.documentElement);
          return { device: document.documentElement.dataset.deviceId, kind: page.dataset.socialPage, top: rect(page.querySelector('.social-page-top')), page: rect(page), tab: rect(document.getElementById('tabBar')), footer: page.querySelector('.social-detail-footer') ? rect(page.querySelector('.social-detail-footer')) : null, safeTop: parseFloat(style.getPropertyValue('--status-h')), safeBottom: parseFloat(style.getPropertyValue('--home-h')), height: innerHeight, width: innerWidth };
        });
        assert.equal(m.kind, kind);
        assert.equal(m.top.top, m.safeTop);
        assert.equal(m.page.width, m.width);
        assert.equal(m.page.bottom, m.tab.top);
        assert.equal(m.tab.bottom, m.height - m.safeBottom);
        if (m.footer) assert.equal(m.footer.bottom, m.tab.top);
        await page.locator('#phoneScreen').screenshot({ path: output + '/' + kind + '-' + m.device + '.png' });
        checks.push(kind + ': ' + m.device);
      }
    }
    await page.setViewportSize({ width: 393, height: 852 });
    await page.waitForTimeout(200);
    const native = await frame.evaluate(() => ({ top: document.querySelector('.social-page:not([hidden]):not([inert])').getBoundingClientRect().top, status: getComputedStyle(document.querySelector('.system-bar')).display, home: getComputedStyle(document.querySelector('.home-indicator')).display }));
    assert.deepEqual(native, { top: 0, status: 'none', home: 'none' });
    await page.screenshot({ path: output + '/native-profile.png' });

    // Repeated navigation must not lift a page above sheets or the bottom bar.
    await frame.locator('.tab[data-tab="feed"]').click();
    await frame.waitForFunction(() => !document.querySelector('#allTickers').disabled);
    for (let i = 0; i < 30; i++) {
      await frame.locator('#cards .quote-body').first().click();
      await frame.locator('.social-page:not([hidden]):not([inert]) .social-page-back').click();
      await frame.waitForFunction(() => !document.querySelector('.social-page:not([hidden]):not([inert])'));
    }
    await frame.locator('#cards .quote-body').first().click();
    await frame.locator('.social-page:not([hidden]):not([inert]) .social-detail-footer button').first().click();
    await frame.getByRole('textbox', { name: 'Ask Alva', exact: true }).fill('What supports this?');
    await frame.locator('#sheetTop [aria-label="Close"]').click();
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ checks, repeatedNavigation: 30, errors, output }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
