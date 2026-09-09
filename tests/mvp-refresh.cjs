/* Same environment variables as mvp-browser.cjs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://localhost:4173/mvp.html';
const output = process.env.QA_OUTPUT || '/tmp/alva-mvp-refresh';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(8000);
  const touch = await page.context().newCDPSession(page);
  const errors = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url() + ': ' + response.status()); });
  const ready = async () => { await page.goto(base); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1700); };
  const pull = async () => {
    await page.locator('#feed').evaluate(n => { n.scrollTop = 0; });
    const screen = await page.locator('.phone-screen').boundingBox();
    const x = screen.x + screen.width / 2, y = screen.y + 220;
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let distance = 30; distance <= 150; distance += 30) {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + distance }] });
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  const observeRefresh = async (name, trigger, added) => {
    const before = await page.locator('#cards > .card').count();
    await trigger();
    await page.waitForFunction(() => document.querySelector('#refreshLoader').classList.contains('spinning'));
    await page.screenshot({ path: path.join(output, name + '-loading.png') });
    const ended = await page.evaluate(() => new Promise((resolve, reject) => {
      const loader = document.querySelector('#refreshLoader');
      const timeout = setTimeout(() => { observe.disconnect(); reject(new Error('Loading did not finish')); }, 3000);
      const observe = new MutationObserver(() => {
        if (loader.classList.contains('spinning')) return;
        clearTimeout(timeout);
        observe.disconnect();
        const track = document.querySelector('#feedTrack');
        resolve({ time: performance.now(), closing: track.classList.contains('springing'),
          target: track.style.transform, messages: document.querySelector('.refresh').textContent.trim() });
      });
      observe.observe(loader, { attributes: true, attributeFilter: ['class'] });
    }));
    assert.equal(ended.closing, true, 'closing must start in the same turn that loading ends');
    assert.equal(ended.target, '');
    assert.equal(ended.messages, '');
    assert.equal(await page.locator('#refreshResult, .refresh-result').count(), 0);
    await page.waitForFunction(() => !document.querySelector('#allTickers').disabled);
    const duration = await page.evaluate(time => performance.now() - time, ended.time);
    assert.ok(duration < 850, 'no result hold after loading: ' + duration);
    assert.equal(await page.locator('#cards > .card').count(), before + added);
    assert.equal(await page.locator('#feedTrack').evaluate(n => n.classList.contains('pulled') || n.classList.contains('springing') || !!n.style.transform), false);
    assert.equal(await page.locator('#refreshLoader').evaluate(n => getComputedStyle(n).opacity), '0');
    assert.equal(await page.locator('#allTickers').isDisabled(), false);
    await page.screenshot({ path: path.join(output, name + '-complete.png') });
    checks.push({ name, added, closeDuration: Math.round(duration), messages: ended.messages });
  };
  try {
    await ready();
    await observeRefresh('touch-new-content', pull, 2);
    await observeRefresh('touch-empty-result', pull, 0);
    await ready();
    await page.locator('#allTickers').click();
    await page.locator('.following-search input').fill('TSM');
    await page.locator('.following-item').click();
    await page.waitForTimeout(350);
    await observeRefresh('filtered-pill', () => page.locator('#newPill').click(), 1);
    assert.equal(await page.locator('#filter-TSM').getAttribute('aria-selected'), 'true');
    await observeRefresh('filtered-empty-result', pull, 0);
    await ready();
    await page.setViewportSize({ width: 320, height: 740 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await observeRefresh('small-dark-tab-reselect', () => page.locator('.tab[data-tab="feed"]').click(), 2);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, checks, errors, output }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
