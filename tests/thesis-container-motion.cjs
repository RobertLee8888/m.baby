const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://127.0.0.1:4177/';
const output = process.env.QA_OUTPUT || '/tmp/thesis-card-expansion-qa';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const engine = process.env.QA_ENGINE === 'webkit' ? webkit : chromium;
  const browser = await engine.launch({ headless: true, ...(engine === chromium && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 2 });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  const near = (a, b) => assert.ok(Math.abs(a - b) < .6, `${a} differs from ${b}`);
  const settled = () => page.waitForFunction(() => !document.querySelector('[data-transition="opening"], [data-transition="closing"]'));
  let visit = 0;
  const fresh = async () => {
    await page.goto(base + 'thesis-motion.html?container-qa=' + ++visit);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode().catch(() => {}))); });
  };
  const pauseNext = () => page.evaluate(() => {
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = original.apply(this, args);
      if (Object.keys(args[0][0]).some(key => key.endsWith('-phase'))) {
        Element.prototype.animate = original;
        animation.pause(); animation.currentTime = 0;
      }
      return animation;
    };
  });
  const sample = async (spec, time) => {
    await page.evaluate(t => document.getAnimations()[0].currentTime = t, time);
    return page.evaluate(({ root, moving, body }) => {
      const surface = document.querySelector(root);
      const rect = selector => surface.querySelector(selector).getBoundingClientRect().toJSON();
      return { identity: rect(moving), body: rect(body), page: surface.getBoundingClientRect().toJSON(),
        underlay: document.querySelector('#feed > .motion-page-content').getBoundingClientRect().toJSON(),
        background: document.querySelector('#feed').getBoundingClientRect().toJSON() };
    }, spec);
  };
  const specs = [
    { name: 'profile', source: '[data-post="raoul-pal-ai"] .motion-person-link', original: '.motion-avatar', y: 635,
      root: '#profile', moving: '.motion-profile-anchor > .motion-avatar', target: '.motion-profile-hero .motion-avatar', body: '.motion-profile-list .motion-post' },
    { name: 'ticker', source: '[data-post="raoul-pal-ai"] [data-ticker="GOOGL"]', original: 'img', y: 665,
      root: '.motion-ticker-page', moving: '.motion-ticker-anchor > .motion-ticker-logo', target: '.motion-ticker-identity > img', body: '.motion-ticker-scroll .motion-post' },
    { name: 'card', source: '[data-post="raoul-pal-ai"]', original: '.motion-avatar', y: 545, trigger: '.motion-open',
      root: '#detail', moving: '.motion-card-copy .motion-avatar', target: '.motion-detail-header .motion-avatar', body: '.motion-card-copy .motion-body' },
  ];
  try {
    for (const width of [320, 393, 430]) {
      await page.setViewportSize({ width, height: 759 });
      for (const spec of specs) {
        await fresh();
        await page.locator(spec.source).evaluate((node, y) => {
          document.querySelector('#feedScroll').scrollTop += node.getBoundingClientRect().top - y;
        }, spec.y);
        const scrollTop = await page.locator('#feedScroll').evaluate(node => node.scrollTop);
        const source = await page.locator(spec.source).locator(spec.original).first().boundingBox();
        const restingFeed = await page.locator('#feed').boundingBox();
        await pauseNext();
        await page.locator(spec.source).evaluate((node, trigger) => (trigger ? node.querySelector(trigger) : node).click(), spec.trigger);
        await page.waitForFunction(selector => document.querySelector(selector)?.dataset.transition === 'opening', spec.root);
        const duration = await page.evaluate(() => document.getAnimations()[0].effect.getTiming().duration - 80);
        assert.equal(duration, 380, 'long journeys are quicker while retaining a slightly longer tail');
        const start = await sample(spec, 0);
        near(start.identity.x, source.x); near(start.identity.y, source.y); near(start.identity.width, source.width);
        near(start.underlay.width, restingFeed.width); near(start.underlay.y, restingFeed.y);
        assert.equal(await page.evaluate(() => document.getAnimations().length), 1, 'foreground and depth share one animation');
        const frames = [];
        for (const fraction of [.15, .3, .5, .75, .999]) {
          const frame = await sample(spec, duration * fraction); frames.push(frame);
          assert.ok(frame.body.top >= frame.identity.bottom, 'incoming body never overtakes the moving identity');
          near(frame.background.width, restingFeed.width); near(frame.background.y, restingFeed.y);
          assert.ok(frame.underlay.width < restingFeed.width && frame.underlay.width > restingFeed.width * .96, 'the content recedes while its background stays full-screen');
          near(frame.underlay.x + frame.underlay.width / 2, restingFeed.x + restingFeed.width / 2);
          near(frame.underlay.y + frame.underlay.height / 2, restingFeed.y + restingFeed.height / 2);
          if (width === 393) await page.screenshot({ path: `${output}/container-${spec.name}-${fraction}.png` });
        }
        const end = frames.at(-1).identity;
        assert.ok(frames[2].identity.y - end.y < 60, 'a bottom entry is within 60px of arrival halfway through');
        for (let i = 1; i < frames.length; i++) {
          assert.ok(frames[i].identity.y < frames[i - 1].identity.y, 'entry never stalls or reverses on its way up');
          assert.ok(frames[i].underlay.width < frames[i - 1].underlay.width, 'depth advances together with the foreground');
        }

        // Reversing a long journey must not jump position or reset the page.
        const interrupted = await sample(spec, 85);
        await pauseNext(); await page.evaluate(() => history.back());
        await page.waitForFunction(selector => document.querySelector(selector)?.dataset.transition === 'closing', spec.root);
        const reversed = await sample(spec, 0);
        near(reversed.identity.x, interrupted.identity.x); near(reversed.identity.y, interrupted.identity.y);
        near(reversed.page.y, interrupted.page.y); near(reversed.body.y, interrupted.body.y);
        near(reversed.underlay.width, interrupted.underlay.width); near(reversed.underlay.y, interrupted.underlay.y);
        await page.evaluate(() => history.forward()); await settled();
        const target = await page.locator(spec.root).locator(spec.target).first().boundingBox();
        near(end.x, target.x); near(end.y, target.y); near(end.width, target.width);
        const held = await page.locator('#feed > .motion-page-content').boundingBox(); near(held.width, frames.at(-1).underlay.width);

        await pauseNext(); await page.evaluate(() => history.back());
        await page.waitForFunction(selector => document.querySelector(selector)?.dataset.transition === 'closing', spec.root);
        const returnStart = await sample(spec, 0);
        near(returnStart.identity.x, target.x); near(returnStart.identity.y, target.y);
        near(returnStart.underlay.width, held.width);
        const returnDuration = await page.evaluate(() => document.getAnimations()[0].effect.getTiming().duration);
        const returnEnd = await sample(spec, returnDuration * .999);
        near(returnEnd.identity.x, source.x); near(returnEnd.identity.y, source.y);
        await page.evaluate(() => document.getAnimations()[0].finish()); await settled();
        assert.equal(await page.locator('#feedScroll').evaluate(node => node.scrollTop), scrollTop);
        assert.equal(await page.locator('.is-container-transform').count(), 0);
        assert.equal(await page.locator('.is-recessed, .is-depth-underlay').count(), 0);
        near((await page.locator('#feed').boundingBox()).width, restingFeed.width);
      }
    }

    // A deeper page moves its immediate parent, while older layers stay put.
    await page.setViewportSize({ width: 393, height: 759 }); await fresh();
    await page.locator('[data-post="raoul-pal-ai"] .motion-person-link').click(); await settled();
    const olderLayer = await page.locator('#feed > .motion-page-content').boundingBox();
    await pauseNext(); await page.locator('#profile .motion-open').first().evaluate(node => node.click());
    await page.evaluate(() => document.getAnimations()[0].currentTime = 100);
    near((await page.locator('#feed > .motion-page-content').boundingBox()).width, olderLayer.width);
    assert.ok((await page.locator('#profile > .motion-page-content').boundingBox()).width < 393, 'only the immediate profile content moves back');
    near((await page.locator('#profile').boundingBox()).width, 393);
    await page.evaluate(() => document.getAnimations()[0].finish()); await settled();
    await page.evaluate(() => history.back()); await settled();
    near((await page.locator('#profile > .motion-page-content').boundingBox()).width, 393);
    near((await page.locator('#feed > .motion-page-content').boundingBox()).width, olderLayer.width);
    await page.evaluate(() => history.back()); await settled();
    assert.equal(await page.locator('.is-recessed, .is-depth-underlay').count(), 0);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-post="raoul-pal-ai"] .motion-person-link').click(); await settled();
    assert.equal(await page.locator('.is-recessed, .is-depth-underlay').count(), 0);
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    await page.evaluate(() => history.back()); await settled();
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // Returning from a partly scrolled hero preserves the header's occlusion.
    await page.setViewportSize({ width: 393, height: 759 }); await fresh();
    await page.locator('[data-post="raoul-pal-ai"] .motion-person-link').click(); await settled();
    await page.locator('.motion-profile-scroll').evaluate(node => node.scrollTop = 35);
    await page.waitForFunction(() => document.querySelector('.motion-profile-header').classList.contains('is-scrolled'));
    const headerBefore = await page.screenshot({ clip: { x: 32, y: 0, width: 329, height: 56 } });
    await pauseNext(); await page.evaluate(() => history.back());
    await page.waitForFunction(() => document.querySelector('#profile')?.dataset.transition === 'closing');
    const headerAfter = await page.screenshot({ clip: { x: 32, y: 0, width: 329, height: 56 } });
    assert.ok(headerBefore.equals(headerAfter), 'the hidden hero must not flash over the header on return');
    await page.evaluate(() => document.getAnimations()[0].finish()); await settled();
    assert.deepEqual(errors, []);
    console.log('PASS: low profile/ticker/card entries at 320/393/430, coordinated content/depth, one driver, half-time arrival, interruption, reverse endpoints, nested depth, reduced motion, scroll restoration, and partial-hero header occlusion.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
