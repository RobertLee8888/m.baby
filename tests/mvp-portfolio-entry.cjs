/* Same environment variables as mvp-browser.cjs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://localhost:4173/mvp.html';
const output = process.env.QA_OUTPUT || '/tmp/alva-mvp-portfolio-entry';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  page.setDefaultTimeout(8000);
  const errors = [], layouts = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url() + ': ' + response.status()); });
  const entry = page.locator('.portfolio-entry');
  const ready = async () => {
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.querySelector('#startupLoader').hidden);
  };
  const restart = async () => {
    await page.locator('#restartButton').evaluate(n => n.click());
    await page.waitForTimeout(1700);
  };
  try {
    for (const width of [320, 360, 393, 430]) {
      await page.setViewportSize({ width, height: 852 });
      await ready();
      const layout = await entry.evaluate(n => {
        const css = selector => getComputedStyle(n.querySelector(selector));
        const body = css('.portfolio-entry-body');
        const title = css('h2'), description = css('.portfolio-entry-description');
        const later = css('.portfolio-entry-later'), connect = css('.portfolio-entry-connect');
        return {
          first: n.parentNode.firstElementChild === n,
          width: n.offsetWidth, height: n.offsetHeight,
          padding: body.padding, gap: body.gap,
          title: [title.fontSize, title.lineHeight, title.fontWeight, title.color],
          description: [description.fontSize, description.lineHeight, description.color],
          descriptionHeight: n.querySelector('.portfolio-entry-description').offsetHeight,
          buttons: [...n.querySelectorAll('button')].map(b => [b.offsetHeight, b.scrollWidth <= b.clientWidth]),
          radius: later.borderRadius, hairline: later.boxShadow, primary: connect.backgroundColor,
          logos: [...n.querySelectorAll('img')].map(i => [i.complete && i.naturalWidth > 0, i.src.endsWith('.svg')]),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert.equal(layout.first, true);
      assert.equal(layout.width, Math.max(360, width));
      assert.equal(layout.height, width < 393 ? 198 : 176);
      assert.equal(layout.padding, '16px');
      assert.equal(layout.gap, '8px');
      assert.deepEqual(layout.title, ['16px', '26px', '500', 'rgba(0, 0, 0, 0.9)']);
      assert.deepEqual(layout.description, ['14px', '22px', 'rgba(0, 0, 0, 0.5)']);
      assert.equal(layout.descriptionHeight, width < 393 ? 66 : 44);
      assert.deepEqual(layout.buttons, [[32, true], [32, true]]);
      assert.equal(layout.radius, '4px');
      assert.ok(layout.hairline.includes('0.5px'));
      assert.equal(layout.primary, 'rgb(73, 163, 166)');
      assert.deepEqual(layout.logos, Array.from({ length: 5 }, () => [true, true]));
      assert.equal(layout.overflow, false);
      await page.screenshot({ path: path.join(output, width + '-feed.png') });
      await entry.screenshot({ path: path.join(output, width + '-card.png'), style: '#newPill { visibility: hidden; }' });
      layouts.push({ viewport: width, ...layout });
    }

    await page.setViewportSize({ width: 393, height: 852 });
    await ready();
    const initialCount = await page.locator('#cards > .card').count();
    const url = page.url();
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    assert.equal(await entry.count(), 1);
    assert.equal(page.url(), url);
    assert.equal(await page.locator('#toast').evaluate(n => n.classList.contains('show')), false);
    const before = await entry.evaluate(n => ({ top: n.getBoundingClientRect().top, nextTop: n.nextElementSibling.getBoundingClientRect().top, text: n.nextElementSibling.textContent }));
    await page.getByRole('button', { name: 'Later in Settings', exact: true }).click();
    await page.waitForTimeout(40);
    const middle = await entry.evaluate(n => ({ height: n.getBoundingClientRect().height, nextTop: n.nextElementSibling.getBoundingClientRect().top }));
    assert.ok(middle.height > 0 && middle.height < before.nextTop - before.top, 'card collapses gradually');
    assert.ok(middle.nextTop > before.top && middle.nextTop < before.nextTop, 'next item moves during collapse');
    await page.screenshot({ path: path.join(output, 'dismissing.png') });
    await entry.waitFor({ state: 'detached' });
    const first = page.locator('#cards > .card').first();
    assert.equal(await first.textContent(), before.text);
    assert.ok(Math.abs((await first.boundingBox()).y - before.top) < 1);
    assert.equal(await page.locator('#cards > .card').count(), initialCount - 1);
    await page.screenshot({ path: path.join(output, 'dismissed.png') });

    await page.locator('#filter-NVDA').click();
    await page.locator('#filter-All').click();
    await page.locator('.tab[data-tab="market"]').click();
    await page.locator('.tab[data-tab="feed"]').click();
    assert.equal(await entry.count(), 0, 'dismissal survives filtering and navigation');
    await page.locator('#feed').evaluate(n => { n.scrollTop = 0; });
    await page.locator('.tab[data-tab="feed"]').click();
    await page.waitForFunction(() => document.querySelector('#refreshLoader').classList.contains('spinning'));
    await page.waitForFunction(() => !document.querySelector('#allTickers').disabled);
    assert.equal(await entry.count(), 0, 'refresh does not restore the card');

    await restart();
    assert.equal(await entry.count(), 1, 'restart restores the first-run card');
    await page.getByRole('button', { name: 'Later in Settings', exact: true }).evaluate(n => { n.click(); n.click(); document.querySelector('#restartButton').click(); });
    await page.waitForTimeout(1700);
    assert.equal(await entry.count(), 1, 'old exit cannot remove a restarted card');

    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.screenshot({ path: path.join(output, '393-dark.png') });
    await page.getByRole('button', { name: 'Later in Settings', exact: true }).click();
    assert.equal(await entry.count(), 0, 'reduced motion dismisses immediately');
    await ready();
    assert.equal(await entry.count(), 1, 'a new demo visit shows the card');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, layouts, errors, output }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
