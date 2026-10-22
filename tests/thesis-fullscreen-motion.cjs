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
    { name: 'detail', trigger: '[data-post="satya"] .motion-open', root: '#detail', moving: '.motion-card-copy .motion-avatar', target: '.motion-detail-header .motion-avatar' },
    { name: 'profile', trigger: '[data-post="satya"] .motion-person-link', root: '#profile', moving: '.motion-profile-anchor > img', target: '.motion-profile-hero .motion-avatar' },
    { name: 'ticker', trigger: '[data-post="satya"] [data-ticker="MSFT"]', root: '.motion-ticker-page', moving: '.motion-ticker-anchor > img', target: '.motion-ticker-identity > img' },
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
  try {
    await page.goto(base + 'index.html#/thesis-motion');
    const frame = page.frames().find(item => item.url().includes('thesis-motion.html'));
    await frame.locator('[data-post="satya"]').waitFor();
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
        radius: parseFloat(getComputedStyle(root).clipPath.split(' round ')[1]),
      }));
      near(initial.page.top, 0); near(initial.page.bottom, device.height);
      near(initial.header.top, device.top); near(initial.nav.bottom, device.height - device.bottom);
      near(initial.radius, device.radius);
      for (const route of routes) {
        await pauseNext(frame);
        await frame.locator(route.trigger).evaluate(node => node.click());
        await frame.waitForFunction(root => document.querySelector(root)?.dataset.transition === 'opening', route.root);
        assert.equal(await frame.evaluate(() => document.getAnimations().length), 1);
        const duration = await frame.evaluate(() => document.getAnimations()[0].effect.getTiming().duration);
        await frame.evaluate(time => document.getAnimations()[0].currentTime = time, duration * .3);
        const middle = await frame.locator('#feed').evaluate(root => {
          const bounds = node => node.getBoundingClientRect().toJSON();
          return { page: bounds(root), top: bounds(root.querySelector('.system-bar')), bottom: bounds(root.querySelector('.home-indicator')),
            radius: parseFloat(getComputedStyle(root).clipPath.split(' round ')[1]),
            opacity: Number(getComputedStyle(root, '::after').opacity), scrim: getComputedStyle(root, '::after').backgroundColor };
        });
        assert.ok(middle.page.top > 0 && middle.page.bottom < device.height, 'the entire screen recedes on both edges');
        near(middle.top.top, middle.page.top); near(middle.bottom.bottom, middle.page.bottom);
        assert.equal(middle.scrim, 'rgba(0, 0, 0, 0.6)');
        near(middle.radius, device.radius);
        const clip = await frame.locator(route.root).evaluate(root => {
          const [inset, rounding] = getComputedStyle(root).clipPath.slice(6, -1).split(' round ');
          const values = inset.split(' ').map(parseFloat);
          const rect = root.getBoundingClientRect();
          return { top: rect.top + values[0], right: rect.right - (values[1] ?? values[0]),
            bottom: rect.bottom - (values[2] ?? values[0]), left: rect.left + (values[3] ?? values[1] ?? values[0]), radius: parseFloat(rounding) };
        });
        assert.ok(clip.radius > 0 && clip.radius < device.radius, 'the expanding surface rounds continuously toward the screen radius');
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
        for (const value of sample(device.width / 2, middle.page.top / 2)) near(value, 0, 4);
        for (const x of [clip.left + 2, clip.right - 2]) {
          for (const y of [clip.top + 2, clip.bottom - 2]) {
            assert.ok(sample(x, y).every(value => value < 245), 'all four foreground corners reveal the dark underlay');
          }
        }
        await frame.evaluate(time => document.getAnimations()[0].currentTime = time, duration * .999);
        const moving = await frame.locator(route.root).locator(route.moving).first().boundingBox();
        await frame.evaluate(() => document.getAnimations()[0].finish());
        await frame.waitForFunction(root => document.querySelector(root)?.dataset.transition === 'open', route.root);
        const target = await frame.locator(route.root).locator(route.target).first().boundingBox();
        near(moving.x, target.x); near(moving.y, target.y); near(moving.width, target.width);
        const full = await frame.locator(route.root).evaluate(root => ({
          page: root.getBoundingClientRect().toJSON(), header: root.querySelector('header').getBoundingClientRect().toJSON(),
          chrome: root.querySelectorAll(':scope > .system-bar, :scope > .home-indicator').length,
          outline: getComputedStyle(root).outlineStyle,
          radius: parseFloat(getComputedStyle(root).clipPath.split(' round ')[1]),
        }));
        near(full.page.top, 0); near(full.page.bottom, device.height); near(full.page.width, device.width);
        near(full.header.top, device.top); assert.equal(full.chrome, 2);
        assert.equal(full.outline, 'none', 'programmatic page focus must not draw a ring around the screen');
        near(full.radius, device.radius);
        await page.locator('iframe').screenshot({ path: `${output}/${device.width}-${device.height}-${route.name}-open.png` });
        await pauseNext(frame); await frame.evaluate(() => history.back());
        await frame.waitForFunction(root => document.querySelector(root)?.dataset.transition === 'closing', route.root);
        await frame.evaluate(time => document.getAnimations()[0].currentTime = time, duration * .7);
        const reverse = await frame.locator('#feed').boundingBox();
        assert.ok(reverse.height < initial.page.height, 'return keeps the full page together');
        await frame.evaluate(() => document.getAnimations()[0].finish());
        await frame.waitForFunction(() => !document.querySelector('[data-transition="closing"]'));
        const restored = await frame.locator('#feed').evaluate(root => root.getBoundingClientRect().toJSON());
        near(restored.top, 0); near(restored.bottom, device.height);
        assert.equal(await frame.locator('.is-recessed, .is-depth-underlay').count(), 0);
      }
    }
    // The physical device frame can hide a square underlay. Inspect its four
    // corners in an unframed phone viewport as well as the preview above.
    await page.setViewportSize({ width: 420, height: 853 });
    await page.goto(base + 'thesis-motion.html');
    await page.locator('[data-post="satya"]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (const route of routes) {
      await pauseNext(page);
      await page.locator(route.trigger).evaluate(node => node.click());
      await page.waitForFunction(root => document.querySelector(root)?.dataset.transition === 'opening', route.root);
      await page.evaluate(() => { const animation = document.getAnimations()[0]; animation.currentTime = animation.effect.getTiming().duration * .3; });
      const underlay = await page.locator('#feed').evaluate(root => ({
        bounds: root.getBoundingClientRect().toJSON(), radius: parseFloat(getComputedStyle(root).clipPath.split(' round ')[1]),
      }));
      near(underlay.radius, 32);
      const shot = await page.screenshot({ path: `${output}/phone-${route.name}-mid.png` });
      const pixels = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const ratio = pixels.info.width / 420;
      for (const x of [underlay.bounds.left + 2, underlay.bounds.right - 2]) {
        for (const y of [underlay.bounds.top + 2, underlay.bounds.bottom - 2]) {
          const offset = (Math.floor(y * ratio) * pixels.info.width + Math.floor(x * ratio)) * pixels.info.channels;
          assert.ok([...pixels.data.subarray(offset, offset + 3)].every(value => value < 4), 'all four underlay corners reveal the black backdrop');
        }
      }
      await page.evaluate(() => document.getAnimations()[0].finish());
      await page.waitForFunction(root => document.querySelector(root)?.dataset.transition === 'open', route.root);
      await page.evaluate(() => history.back());
      await page.waitForFunction(root => !document.querySelector(root) || document.querySelector(root).hidden, route.root);
    }
    assert.deepEqual(errors, []);
    console.log('PASS: six devices, full-screen detail/profile/ticker entry and return, safe controls, shared endpoint geometry, top/bottom scrim pixels, black backdrop and complete restoration.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
