const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://localhost:4173/mvp.html';
const output = process.env.QA_OUTPUT || '/tmp/alva-mvp-startup-updates';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const errors = [], checks = [];
  try {
    for (const width of [320, 393, 430, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 852 } });
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.startupEvents = [];
        for (const type of ['animationstart', 'animationend']) document.addEventListener(type, event => {
          if (event.animationName === 'mvp-splash-reveal') window.startupEvents.push({ type, at: performance.now(), shellReady: !frameElement || frameElement.classList.contains('ready') });
        });
      });
      await page.goto(base);
      await page.waitForFunction(() => document.querySelector('#startupLoader').hidden);
      const events = await page.evaluate(() => window.startupEvents);
      assert.deepEqual(events.map(event => event.type), ['animationstart', 'animationend']);
      assert.ok(events[1].at - events[0].at < 800);
      assert.equal(await page.locator('#screens').evaluate(n => n.inert), false);
      assert.equal(await page.locator('#newPill').evaluate(n => n.inert), true);
      const chartLoader = await page.locator('#fsLoader img').evaluate(n => {
        const style = getComputedStyle(n);
        return { width: style.width, height: style.height, animation: style.animationName };
      });
      assert.deepEqual(chartLoader, { width: '40px', height: '40px', animation: 'loader-quarter-turn' });
      await page.evaluate(() => {
        const splash = document.querySelector('#startupLoader');
        splash.hidden = false;
        splash.classList.add('is-leaving');
        window.motion = splash.getAnimations()[0];
        window.motion.pause();
      });
      let previous = -1;
      for (const time of [0, 150, 300, 500]) {
        const state = await page.evaluate(time => {
          motion.currentTime = time;
          return {
            radius: parseFloat(getComputedStyle(document.querySelector('#startupLoader')).getPropertyValue('--mvp-splash-radius')),
            logoAnimations: document.querySelector('.startup-wordmark').getAnimations({ subtree: true }).length,
            contentAnimations: document.querySelector('#cards').getAnimations({ subtree: true }).length,
          };
        }, time);
        assert.ok(state.radius > previous);
        assert.equal(state.logoAnimations, 0);
        assert.equal(state.contentAnimations, 0);
        previous = state.radius;
        await page.screenshot({ path: path.join(output, width + '-splash-' + time + '.png') });
      }
      checks.push({ width, duration: events[1].at - events[0].at });
      await page.close();
    }

    const page = await browser.newPage({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
    page.setDefaultTimeout(8000);
    await page.clock.install();
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => { Math.random = () => .5; });
    const count = () => page.locator('#cards > .card').count();
    const pill = page.locator('#newPill');
    async function ready() {
      await page.goto(base);
      await page.waitForFunction(() => document.querySelector('#startupLoader').hidden);
    }
    async function minute() {
      await page.clock.fastForward(60000);
      await page.clock.resume();
    }
    async function refresh(trigger, expected) {
      const before = await count();
      const oldIds = new Set(await page.locator('[data-card-id^="feed-update-"]').evaluateAll(ns => ns.map(n => n.dataset.cardId)));
      await trigger();
      await page.waitForFunction(() => document.querySelector('#refreshLoader').classList.contains('spinning'));
      await page.waitForFunction(() => !document.querySelector('#allTickers').disabled);
      assert.equal(await count(), before + expected);
      assert.equal(await pill.getAttribute('aria-hidden'), 'true');
      const ids = await page.locator('[data-card-id^="feed-update-"]').evaluateAll(ns => ns.map(n => n.dataset.cardId));
      assert.equal(new Set(ids).size, ids.length);
      assert.equal(ids.filter(id => !oldIds.has(id)).length, expected);
    }
    const touch = await page.context().newCDPSession(page);
    async function pull() {
      await page.locator('#feed').evaluate(n => { n.scrollTop = 0; });
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 220 }] });
      for (let y = 250; y <= 370; y += 30) await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y }] });
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    await ready();
    await page.clock.fastForward(58000);
    assert.equal(await pill.getAttribute('aria-hidden'), 'true');
    await page.clock.fastForward(2000);
    await page.clock.resume();
    assert.equal(await page.locator('#newPillText').textContent(), '2 new feeds');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#newPill')).opacity === '1');
    await page.screenshot({ path: path.join(output, 'one-minute-pill.png') });
    await refresh(() => pill.click(), 2);
    await minute();
    assert.equal(await page.locator('#newPillText').textContent(), '2 new feeds');
    await refresh(pull, 2);
    await refresh(pull, 2);
    await minute();
    assert.equal(await page.locator('#newPillText').textContent(), '1 new feed');
    await refresh(() => pill.click(), 1);
    await minute();
    assert.equal(await pill.getAttribute('aria-hidden'), 'true');
    await refresh(pull, 0);

    // A selected ticker counts only matching items in the same pending batch.
    await ready();
    await minute();
    await page.locator('#allTickers').click();
    await page.locator('.following-search input').fill('TSM');
    await page.locator('.following-item').click();
    await page.waitForTimeout(350);
    assert.equal(await page.locator('#newPillText').textContent(), '1 new feed');
    await refresh(() => pill.click(), 1);
    await page.locator('#filter-All').click();
    assert.equal(await page.locator('[data-card-id^="feed-update-"]').count(), 2);

    // A cancelled refresh cannot consume the replacement session's batch.
    await ready();
    await minute();
    await pill.click();
    await page.waitForTimeout(200);
    await page.locator('#restartButton').evaluate(n => n.click());
    await page.waitForTimeout(1900);
    assert.equal(await page.locator('[data-card-id^="feed-update-"]').count(), 0);
    assert.equal(await pill.getAttribute('aria-hidden'), 'true');
    await minute();
    await refresh(() => pill.click(), 2);
    await page.close();

    for (const [name, options, disableAnimation] of [
      ['reduced', { reducedMotion: 'reduce' }, false], ['fallback', {}, true],
    ]) {
      const p = await browser.newPage({ viewport: { width: 393, height: 852 }, ...options });
      if (disableAnimation) await p.route('**/mvp.css?*', async route => {
        const response = await route.fetch();
        await route.fulfill({ response, body: await response.text() + '\n.startup-loader.is-leaving { animation: none !important; }' });
      });
      await p.goto(base);
      await p.waitForFunction(() => document.querySelector('#startupLoader').hidden);
      assert.equal(await p.locator('#screens').evaluate(n => n.inert), false, name);
      await p.close();
    }
    for (const delay of [0, 3500]) {
      const embedded = await browser.newPage({ viewport: { width: 393, height: 852 } });
      if (delay) await embedded.route('**/wordmark-text.svg', async route => {
        await new Promise(resolve => setTimeout(resolve, delay));
        await route.continue();
      });
      await embedded.addInitScript(() => document.addEventListener('animationstart', event => {
        if (event.animationName === 'mvp-splash-reveal') window.readyAtSplash = frameElement?.classList.contains('ready');
      }));
      await embedded.goto(new URL('index.html#/mvp', base).href);
      const frame = embedded.frameLocator('iframe');
      await frame.locator('#startupLoader').waitFor({ state: 'hidden' });
      assert.equal(await frame.locator('body').evaluate(() => window.readyAtSplash), true, 'embedded asset delay: ' + delay);
      await embedded.screenshot({ path: path.join(output, 'embedded-feed-' + delay + '.png') });
      await embedded.close();
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, checks, errors, output }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
