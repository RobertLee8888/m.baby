const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const base = process.env.DEMO_URL || 'http://127.0.0.1:4177/';
const output = process.env.QA_OUTPUT || '/tmp/thesis-fullscreen-qa';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const engine = process.env.QA_ENGINE === 'webkit' ? webkit : chromium;
  const browser = await engine.launch({ headless: true, ...(engine === chromium && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 2 });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  const near = (a, b, tolerance = .6) => assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);
  const devices = [
    { name: /^iPhone 17(?! Pro)/, width: 402, height: 874, top: 62, bottom: 34, radius: 54 },
    { name: /iPhone Air/, width: 420, height: 912, top: 62, bottom: 34, radius: 54 },
    { name: /iPhone 17 Pro Max/, width: 440, height: 956, top: 62, bottom: 34, radius: 54 },
    { name: /Galaxy A16/, width: 412, height: 892, top: 32, bottom: 24, radius: 36 },
    { name: /Galaxy S25 Ultra/, width: 412, height: 915, top: 32, bottom: 24, radius: 26 },
    { name: /Redmi 14C/i, width: 360, height: 820, top: 32, bottom: 24, radius: 38 },
  ];
  const routes = [
    { name: 'detail', trigger: '[data-post="tom-lee-spy"] .motion-open', root: '#detail', moving: '.motion-card-copy .motion-avatar', target: '.motion-detail-header .motion-avatar' },
    { name: 'profile', trigger: '[data-post="tom-lee-spy"] .motion-person-link', root: '#profile', moving: '.motion-profile-anchor > img', target: '.motion-profile-hero .motion-avatar' },
    { name: 'ticker', trigger: '[data-post="tom-lee-spy"] [data-ticker="SPY"]', root: '.motion-ticker-page', moving: '.motion-ticker-anchor > img', target: '.motion-ticker-identity > img' },
  ];
  const pauseNext = frame => frame.evaluate(() => {
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = original.apply(this, args);
      if (Object.keys(args[0][0]).some(key => key.endsWith('-phase'))) {
        Element.prototype.animate = original; animation.pause(); animation.currentTime = 0;
      }
      return animation;
    };
  });
  const surfaceClip = (frame, selector) => frame.locator(selector).evaluate(root => {
    const [inset, rounding] = getComputedStyle(root).clipPath.slice(6, -1).split(' round ');
    const values = inset.split(' ').map(parseFloat), rect = root.getBoundingClientRect();
    const top = rect.top + values[0], right = rect.right - (values[1] ?? values[0]);
    const bottom = rect.bottom - (values[2] ?? values[0]), left = rect.left + (values[3] ?? values[1] ?? values[0]);
    return { top, right, bottom, left, width: right - left, height: bottom - top, radius: parseFloat(rounding) || 0 };
  });
  try {
    await page.goto(base + 'index.html#/thesis-motion');
    const frame = page.frames().find(item => item.url().includes('thesis-motion.html'));
    await frame.locator('[data-post="tom-lee-spy"]').waitFor();
    await frame.evaluate(() => document.fonts.ready);
    // Pixel checks must exclude the gallery's independent iframe mount fade.
    await page.waitForFunction(() => getComputedStyle(document.querySelector('iframe')).opacity === '1');
    for (const device of devices) {
      await page.locator('#deviceTrigger').click();
      await page.getByRole('option', { name: device.name }).click();
      await frame.waitForFunction(({ width, height }) => {
        const app = document.querySelector('#motionApp').getBoundingClientRect();
        return innerWidth === width && innerHeight === height && Math.abs(app.height - height) < .5;
      }, device);
      const initial = await frame.locator('#feed').evaluate(root => ({
        page: root.getBoundingClientRect().toJSON(), header: root.querySelector('header').getBoundingClientRect().toJSON(),
        nav: root.querySelector('nav').getBoundingClientRect().toJSON(),
        clip: getComputedStyle(root).clipPath,
      }));
      near(initial.page.top, 0); near(initial.page.bottom, device.height);
      near(initial.header.top, device.top); near(initial.nav.bottom, device.height - device.bottom);
      assert.equal(initial.clip, 'none');
      for (const route of routes) {
        await pauseNext(frame);
        await frame.locator(route.trigger).evaluate(node => node.click());
        await frame.waitForFunction(root => document.querySelector(root)?.dataset.transition === 'opening', route.root);
        assert.equal(await frame.evaluate(() => document.getAnimations().length), 1);
        const duration = await frame.evaluate(() => document.getAnimations()[0].effect.getTiming().duration - 80);
        const start = await surfaceClip(frame, route.root);
        let previous = start;
        for (const fraction of [.04, .1, .2, .35, .5, .7, .9]) {
          await frame.evaluate(time => document.getAnimations()[0].currentTime = time, duration * fraction);
          const current = await surfaceClip(frame, route.root);
          const widthProgress = (current.width - start.width) / (device.width - start.width);
          const heightProgress = (current.height - start.height) / (device.height - start.height);
          near(widthProgress, heightProgress, .001);
          assert.ok(current.width > previous.width && current.height > previous.height, 'both dimensions grow continuously, including the first frames');
          near(current.radius, 32, .01);
          previous = current;
        }
        await frame.evaluate(time => document.getAnimations()[0].currentTime = time, duration * .3);
        const middle = await frame.locator('#feed').evaluate(root => {
          const bounds = node => node.getBoundingClientRect().toJSON();
          return { page: bounds(root), top: bounds(root.querySelector('.system-bar')), bottom: bounds(root.querySelector('.home-indicator')),
            content: bounds(root.querySelector('.motion-page-content')), clip: getComputedStyle(root).clipPath,
            blur: parseFloat(getComputedStyle(root.querySelector('.motion-page-content')).filter.slice(5)),
            opacity: Number(getComputedStyle(root, '::after').opacity), scrim: getComputedStyle(root, '::after').backgroundColor };
        });
        near(middle.page.top, 0); near(middle.page.bottom, device.height); near(middle.page.width, device.width);
        assert.ok(middle.content.top > 0 && middle.content.bottom < device.height, 'all content recedes inside the stationary background');
        near(middle.top.top, middle.content.top); near(middle.bottom.bottom, middle.content.bottom);
        near(middle.blur, 1.5 * middle.opacity, .01);
        assert.equal(middle.scrim, 'rgba(0, 0, 0, 0.6)');
        assert.equal(middle.clip, 'none');
        const clip = await surfaceClip(frame, route.root);
        near(clip.radius, 32, .01);
        assert.ok(clip.left > 0 && device.width - clip.right > 0, 'width remains short of full screen while height is still expanding');
        const shot = await page.locator('iframe').screenshot();
        fs.writeFileSync(`${output}/${device.width}-${device.height}-${route.name}-mid.png`, shot);
        const pixels = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        const ratio = pixels.info.width / device.width;
        const sample = (x, y) => {
          const offset = (Math.floor(y * ratio) * pixels.info.width + Math.floor(x * ratio)) * pixels.info.channels;
          return [...pixels.data.subarray(offset, offset + 3)];
        };
        const expected = 255 * (1 - .6 * middle.opacity);
        for (const y of [middle.page.top + device.top * .15, middle.page.bottom - device.bottom * .2]) {
          for (const value of sample(device.radius + 8, y)) near(value, expected, 4);
        }
        for (const x of [clip.left + .5, clip.right - .5]) {
          for (const y of [clip.top + .5, clip.bottom - .5]) {
            assert.ok(sample(x, y).every(value => value < 245), 'all four foreground corners reveal the dark underlay');
          }
        }
        await frame.evaluate(time => document.getAnimations()[0].currentTime = time, duration);
        const arrived = await surfaceClip(frame, route.root);
        near(arrived.width, device.width); near(arrived.height, device.height); near(arrived.radius, 32, .01);
        await page.locator('iframe').screenshot({ path: `${output}/${device.width}-${device.height}-${route.name}-arrived-rounded.png` });
        let previousRadius = arrived.radius;
        for (const time of [20, 40, 60, 79.99]) {
          await frame.evaluate(time => document.getAnimations()[0].currentTime = time, duration + time);
          const surface = await surfaceClip(frame, route.root);
          near(surface.width, device.width); near(surface.height, device.height);
          near(surface.top, 0); near(surface.left, 0);
          assert.ok(surface.radius < previousRadius, 'only the corners shrink after the page has fully expanded');
          previousRadius = surface.radius;
        }
        near(previousRadius, 0, .01);
        await frame.evaluate(time => document.getAnimations()[0].currentTime = time, duration * .999);
        const moving = await frame.locator(route.root).locator(route.moving).first().boundingBox();
        await frame.evaluate(() => document.getAnimations()[0].finish());
        await frame.waitForFunction(root => document.querySelector(root)?.dataset.transition === 'open', route.root);
        const target = await frame.locator(route.root).locator(route.target).first().boundingBox();
        near(moving.x, target.x); near(moving.y, target.y); near(moving.width, target.width);
        const full = await frame.locator(route.root).evaluate(root => ({
          page: root.getBoundingClientRect().toJSON(), header: root.querySelector('header').getBoundingClientRect().toJSON(),
          chrome: root.querySelectorAll(':scope > .motion-page-content > .system-bar, :scope > .motion-page-content > .home-indicator').length,
          outline: getComputedStyle(root).outlineStyle,
          clip: getComputedStyle(root).clipPath,
        }));
        near(full.page.top, 0); near(full.page.bottom, device.height); near(full.page.width, device.width);
        near(full.header.top, device.top); assert.equal(full.chrome, 2);
        assert.equal(full.outline, 'none', 'programmatic page focus must not draw a ring around the screen');
        assert.equal(full.clip, 'none', 'the fully opened page is square and edge-to-edge');
        await page.locator('iframe').screenshot({ path: `${output}/${device.width}-${device.height}-${route.name}-open.png` });
        await pauseNext(frame); await frame.evaluate(() => history.back());
        await frame.waitForFunction(root => document.querySelector(root)?.dataset.transition === 'closing', route.root);
        const returnStart = await surfaceClip(frame, route.root);
        near(returnStart.radius, 32, .01);
        near(returnStart.width, device.width); near(returnStart.height, device.height);
        await frame.evaluate(time => document.getAnimations()[0].currentTime = time, duration * .7);
        near((await surfaceClip(frame, route.root)).radius, 32, .01);
        const reverse = await frame.locator('#feed > .motion-page-content').boundingBox();
        assert.ok(reverse.height < initial.page.height, 'return keeps the content together');
        near((await frame.locator('#feed').boundingBox()).height, initial.page.height);
        await frame.evaluate(() => document.getAnimations()[0].finish());
        await frame.waitForFunction(() => !document.querySelector('[data-transition="closing"]'));
        const restored = await frame.locator('#feed').evaluate(root => root.getBoundingClientRect().toJSON());
        near(restored.top, 0); near(restored.bottom, device.height);
        assert.equal(await frame.locator('.is-recessed, .is-depth-underlay').count(), 0);
      }
    }
    // A rectangular viewport must never expose black gaps at its corners.
    await page.setViewportSize({ width: 420, height: 853 });
    await page.goto(base + 'thesis-motion.html');
    await page.locator('[data-post="tom-lee-spy"]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (const route of routes) {
      await pauseNext(page);
      await page.locator(route.trigger).evaluate(node => node.click());
      await page.waitForFunction(root => document.querySelector(root)?.dataset.transition === 'opening', route.root);
      await page.evaluate(() => { const animation = document.getAnimations()[0]; animation.currentTime = animation.effect.getTiming().duration * .3; });
      const underlay = await page.locator('#feed').evaluate(root => ({
        bounds: root.getBoundingClientRect().toJSON(), clip: getComputedStyle(root).clipPath,
        opacity: Number(getComputedStyle(root, '::after').opacity),
      }));
      assert.equal(underlay.clip, 'none');
      near(underlay.bounds.top, 0); near(underlay.bounds.bottom, 853); near(underlay.bounds.width, 420);
      const shot = await page.screenshot({ path: `${output}/phone-${route.name}-mid.png` });
      const pixels = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const ratio = pixels.info.width / 420;
      for (const x of [underlay.bounds.left + 2, underlay.bounds.right - 2]) {
        for (const y of [underlay.bounds.top + 2, underlay.bounds.bottom - 2]) {
          const offset = (Math.floor(y * ratio) * pixels.info.width + Math.floor(x * ratio)) * pixels.info.channels;
          for (const value of pixels.data.subarray(offset, offset + 3)) near(value, 255 * (1 - .6 * underlay.opacity), 4);
        }
      }
      await page.evaluate(() => document.getAnimations()[0].finish());
      await page.waitForFunction(root => document.querySelector(root)?.dataset.transition === 'open', route.root);
      await page.evaluate(() => history.back());
      await page.waitForFunction(root => !document.querySelector(root) || document.querySelector(root).hidden, route.root);
    }
    assert.deepEqual(errors, []);
    console.log('PASS: six devices and rectangular phone viewport; constant corners throughout expansion, 80ms corner-only finish at full size, immediate rounded return, stationary backgrounds, depth, safe controls, endpoint geometry and complete restoration.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
