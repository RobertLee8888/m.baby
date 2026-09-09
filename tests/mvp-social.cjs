const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://localhost:4173/mvp.html?feed=social';
const output = process.env.QA_OUTPUT || '/tmp/alva-social-qa';
const order = ['P01', 'P06', 'S04', 'S01', 'P02', 'S02', 'P07', 'S05', 'S06', 'P04', 'S07'];
const heights = [527, 402, 426, 611.0625, 608, 543, 505, 374, 521, 488, 386];
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 393, height: 1000 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, colorScheme: 'light' });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const errors = [], measurements = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  const card = key => page.locator('[data-card-id="source-' + key + '"]');
  async function expose(locator) {
    await locator.evaluate(node => {
      const feed = document.getElementById('feed');
      const scale = feed.getBoundingClientRect().width / feed.clientWidth;
      feed.scrollTop += (node.getBoundingClientRect().top - feed.getBoundingClientRect().top) / scale - 72;
    });
    await page.waitForTimeout(120);
  }
  async function close() {
    await page.locator('#sheetTop [aria-label="Close"]').click();
    await page.waitForTimeout(450);
  }
  async function load(url = base) {
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1800);
  }
  try {
    await load();
    assert.deepEqual(await page.locator('#cards > .card').evaluateAll(ns => ns.map(n => n.dataset.cardId)), order.map(key => 'source-' + key));
    assert.equal(await page.locator('.portfolio-entry').count(), 0);
    assert.equal(await page.locator('#newPill').evaluate(n => n.classList.contains('show')), false);

    for (const [i, key] of order.entries()) {
      const node = card(key);
      await expose(node);
      const height = await node.evaluate(n => n.getBoundingClientRect().height);
      measurements.push({ key, height, figma: heights[i], delta: height - heights[i] });
      assert.ok(Math.abs(height - heights[i]) < 1, key + ' geometry: ' + height);
      assert.ok(await node.locator('img').evaluateAll(ns => ns.every(n => n.complete && n.naturalWidth > 0)), key + ' images');
      assert.equal(await node.locator('.social-engagement button').count(), 4);
      await node.screenshot({ path: path.join(output, '393-' + key + '.png') });
      await node.locator('.quote-copy, .social-event .quote-body').first().click();
      await page.waitForTimeout(400);
      assert.equal(await page.locator('#sheetBody > .src').getAttribute('data-source-id'), key);
      assert.equal(await page.locator('#sheetBody .src-nested').count(), key === 'P02' ? 2 : key === 'P04' ? 1 : 0);
      assert.ok(await page.locator('#sheetBody .src-open').first().evaluate(n => n.tagName === 'A' && getComputedStyle(n.querySelector('span')).textDecorationLine.includes('underline')));
      await close();
    }

    const filters = await page.locator('#feedFilters [data-ticker]').evaluateAll(ns => ns.slice(1).map(n => ({ sym: n.dataset.ticker, count: Number(n.querySelector('.feed-filter-count').textContent) })));
    assert.equal(filters[0].sym, 'GOOG');
    for (const filter of filters) {
      await page.locator('#filter-' + filter.sym).click();
      assert.equal(await page.locator('.social-card').count(), filter.count);
      assert.ok(await page.locator('.social-card').evaluateAll((ns, sym) => ns.every(n => n.dataset.tickers.split(' ').includes(sym)), filter.sym));
    }
    await page.locator('#filter-All').click();
    await expose(card('P01').locator('.social-engagement'));
    const like = card('P01').getByRole('button', { name: 'Like', exact: true });
    await like.click();
    assert.equal(await like.getAttribute('aria-pressed'), 'true');
    assert.equal(await like.textContent(), '327');
    await card('P01').getByRole('button', { name: 'Repost', exact: true }).click();
    await card('P01').getByRole('button', { name: 'Track This', exact: true }).click();
    await card('P01').getByRole('button', { name: 'Reply', exact: true }).click();
    await page.waitForTimeout(400);
    const input = page.getByRole('textbox', { name: 'Reply to Gavin Baker' });
    const send = page.getByRole('button', { name: 'Send', exact: true });
    assert.ok(await send.isDisabled());
    await input.fill('   ');
    assert.ok(await send.isDisabled());
    const text = '<img src=x onerror=alert(1)> Following this discussion.';
    await input.fill(text);
    await send.click();
    assert.equal(await page.locator('.social-own-reply p').textContent(), text);
    assert.equal(await page.locator('.social-own-reply p img').count(), 0);
    assert.ok(await send.isDisabled());
    await page.screenshot({ path: path.join(output, 'reply.png') });
    await close();
    assert.equal(await card('P01').getByRole('button', { name: 'Reply', exact: true }).textContent(), '25');
    await load();
    assert.equal(await like.getAttribute('aria-pressed'), 'true');
    assert.equal(await card('P01').getByRole('button', { name: 'Repost', exact: true }).textContent(), '69');
    assert.equal(await card('P01').getByRole('button', { name: 'Track This', exact: true }).textContent(), 'Tracking');
    await expose(card('P01').locator('.social-engagement'));
    await like.click();
    assert.equal(await like.textContent(), '326');
    await card('P01').getByRole('button', { name: 'Repost', exact: true }).click();
    await card('P01').getByRole('button', { name: 'Track This', exact: true }).click();

    await card('P01').getByRole('button', { name: 'What’s my impact', exact: true }).click();
    await page.waitForTimeout(450);
    assert.equal(await page.locator('.social-thinking').count(), 1);
    await page.waitForTimeout(650);
    assert.equal(await page.locator('.social-thinking').count(), 0);
    assert.ok((await page.locator('.social-answer').textContent()).includes('Cheaper inference shifts value'));
    await page.getByRole('textbox', { name: 'Ask Alva', exact: true }).fill('Which source supports this?');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    assert.equal(await page.locator('.social-user-message').count(), 2);
    await close();
    await page.waitForTimeout(1000);
    assert.equal(await page.locator('#sheetBody').textContent(), '');

    await page.evaluate(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.sharedPost = data; } });
    });
    await card('P01').getByRole('button', { name: 'Share post', exact: true }).click();
    const shared = await page.evaluate(() => window.sharedPost.url);
    assert.equal(new URL(shared).searchParams.get('post'), 'P01');
    const deepLink = new URL(shared); deepLink.searchParams.set('post', 'P04');
    await load(deepLink.href);
    assert.ok((await card('P04').boundingBox()).y >= 0 && (await card('P04').boundingBox()).y < 160);

    await page.locator('#feed').evaluate(n => { n.scrollTop = 0; });
    await page.locator('.tab[data-tab="feed"]').click();
    await page.waitForFunction(() => document.querySelector('#refreshLoader').classList.contains('spinning'));
    await page.waitForFunction(() => !document.querySelector('#allTickers').disabled);
    assert.equal(await page.locator('.social-card').count(), 11);
    assert.equal(await page.locator('#refreshResult, .refresh-result, .seen-line').count(), 0);

    await expose(card('P01').locator('.social-engagement'));
    await card('P01').getByRole('button', { name: 'Reply', exact: true }).click();
    await page.waitForTimeout(450);
    await page.getByRole('textbox', { name: 'Reply to Gavin Baker' }).focus();
    assert.equal(await page.getByRole('textbox', { name: 'Reply to Gavin Baker' }).evaluate(n => getComputedStyle(n).fontSize), '16px');
    await page.evaluate(() => {
      Object.defineProperty(visualViewport, 'height', { configurable: true, value: 580 });
      visualViewport.dispatchEvent(new Event('resize'));
    });
    assert.ok((await page.locator('.social-composer').boundingBox()).y + (await page.locator('.social-composer').boundingBox()).height <= 580);
    await page.screenshot({ path: path.join(output, 'keyboard-viewport.png') });
    await page.evaluate(() => { delete visualViewport.height; visualViewport.dispatchEvent(new Event('resize')); });
    await close();

    for (const width of [320, 360, 393, 430]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const key of order) {
        const node = card(key);
        await expose(node);
        assert.ok(await node.locator('.quote-body, .social-reading, .social-ctas, .social-tickers, .social-proof').evaluateAll(ns => ns.every(n => n.scrollWidth <= n.clientWidth + 1)), width + ' ' + key + ' overflows');
        await node.screenshot({ path: path.join(output, width + '-' + key + '.png') });
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      if (width === 320) assert.equal(await page.locator('#mvpApp').evaluate(n => n.clientWidth), 360);
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await expose(card('P01'));
    await page.screenshot({ path: path.join(output, 'dark-feed.png') });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 393, height: 852 });
    await page.locator('#feed').evaluate(n => { n.scrollTop = 0; });
    await page.screenshot({ path: path.join(output, 'mobile-home.png') });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await load(new URL('./#/mvp-social', base).href);
    const frame = page.frameLocator('iframe');
    assert.equal(await frame.locator('.social-card').count(), 11);
    await page.screenshot({ path: path.join(output, 'desktop-shell.png') });
    await page.setViewportSize({ width: 393, height: 852 });
    await frame.locator('[data-card-id="source-P01"]').getByRole('button', { name: 'Reply', exact: true }).click();
    await page.waitForTimeout(450);
    await frame.getByRole('textbox', { name: 'Reply to Gavin Baker' }).focus();
    await page.evaluate(() => {
      Object.defineProperty(visualViewport, 'height', { configurable: true, value: 530 });
      visualViewport.dispatchEvent(new Event('resize'));
    });
    const composerBounds = await frame.locator('.social-composer').boundingBox();
    assert.ok(composerBounds.y + composerBounds.height <= 530, 'embedded composer clears the host keyboard');
    await page.screenshot({ path: path.join(output, 'embedded-keyboard.png') });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, measurements, filters, errors, output }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
