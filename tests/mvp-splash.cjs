/* Same environment variables as mvp-browser.cjs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://localhost:4173/mvp-onboarding.html';
const output = process.env.QA_OUTPUT || '/tmp/alva-mvp-splash';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const errors = [], runs = [];
  try {
    for (const width of [320, 393, 430, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: width > 500 ? 1000 : 852 } });
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        assert.ok(!/lottie|onboarding-splash\.json/.test(request.url()), 'No logo morph player or timeline should load');
      });
      await page.addInitScript(() => {
        window.splashEvents = [];
        for (const type of ['animationstart', 'animationend']) document.addEventListener(type, event => {
          if (event.animationName !== 'splash-reveal') return;
          window.splashEvents.push({ type, at: performance.now() });
        });
      });
      await page.goto(base);
      await page.locator('.welcome-screen.is-active').waitFor({ state: 'visible', timeout: 2500 });
      const events = await page.evaluate(() => window.splashEvents);
      assert.deepEqual(events.map(event => event.type), ['animationstart', 'animationend']);
      assert.ok(events[1].at - events[0].at < 1000, 'The reveal must finish without a second animation');
      runs.push({ width, duration: Math.round(events[1].at - events[0].at) });
      assert.equal(await page.locator('.splash-screen').isVisible(), false);
      assert.equal(await page.locator('.is-under-splash').count(), 0);
      await page.locator('#startButton').click();
      assert.ok(await page.locator('.watch-screen.is-active').isVisible());
      await page.locator('#watchBack').click();
      assert.ok(await page.locator('.welcome-screen.is-active').isVisible());
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);

      // Scrub the same CSS reveal after the real transition has completed.
      // The static logo and underlying page must never move independently.
      await page.evaluate(() => {
        const splash = document.querySelector('.splash-screen');
        document.querySelector('.welcome-screen').classList.add('is-under-splash');
        splash.classList.add('is-active', 'is-revealing');
        window.reveal = splash.getAnimations()[0];
        window.reveal.pause();
        window.reveal.currentTime = 0;
      });
      let previousRadius = -1;
      for (const time of [0, 150, 300, 500]) {
        const frame = await page.evaluate(time => {
          window.reveal.currentTime = time;
          const splash = document.querySelector('.splash-screen');
          const welcome = document.querySelector('.welcome-screen');
          return {
            radius: parseFloat(getComputedStyle(splash).getPropertyValue('--splash-reveal')),
            opacity: getComputedStyle(welcome).opacity,
            transform: getComputedStyle(welcome).transform,
            logoAnimations: document.querySelector('.splash-wordmark').getAnimations({ subtree: true }).length,
          };
        }, time);
        assert.ok(frame.radius > previousRadius);
        assert.equal(frame.opacity, '1');
        assert.equal(frame.transform, 'none');
        assert.equal(frame.logoAnimations, 0);
        previousRadius = frame.radius;
        await page.screenshot({ path: path.join(output, `${width}-${time}.png`) });
      }
      await page.close();
    }

    const embedded = await browser.newPage({ viewport: { width: 393, height: 852 } });
    await embedded.addInitScript(() => {
      document.addEventListener('animationstart', event => {
        if (event.animationName === 'splash-reveal') window.shellReadyAtReveal = window.frameElement?.classList.contains('ready');
      });
    });
    await embedded.goto(new URL('index.html#/mvp-onboarding', base).href);
    const frame = embedded.frames().find(frame => frame.url().includes('mvp-onboarding.html'));
    await frame.locator('.welcome-screen.is-active').waitFor({ state: 'visible', timeout: 2500 });
    assert.equal(await frame.evaluate(() => window.shellReadyAtReveal), true);
    await embedded.screenshot({ path: path.join(output, 'embedded-welcome.png') });
    await frame.locator('#startButton').click();
    await frame.locator('#continueButton').click();
    await frame.locator('#notNowButton').click();
    await frame.locator('[data-login-submit]').first().click();
    await embedded.waitForURL(/#\/mvp$/);
    await embedded.close();

    const reduced = await browser.newPage({ viewport: { width: 393, height: 852 }, reducedMotion: 'reduce' });
    await reduced.goto(base);
    await reduced.locator('.welcome-screen.is-active').waitFor({ state: 'visible' });
    assert.equal(await reduced.locator('.is-revealing, .is-under-splash').count(), 0);
    await reduced.locator('#startButton').click();
    assert.ok(await reduced.locator('.watch-screen.is-active').isVisible());
    await reduced.close();

    const fallback = await browser.newPage({ viewport: { width: 393, height: 852 } });
    await fallback.route('**/mvp-onboarding.css?*', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + '\n.splash-screen.is-revealing { animation: none !important; }' });
    });
    await fallback.goto(base);
    await fallback.locator('.welcome-screen.is-active').waitFor({ state: 'visible', timeout: 2500 });
    await fallback.locator('#startButton').click();
    assert.ok(await fallback.locator('.watch-screen.is-active').isVisible());
    await fallback.close();
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, runs, reducedMotion: true, fallback: true, output }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
