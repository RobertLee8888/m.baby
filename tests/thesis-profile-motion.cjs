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
  const openProfile = () => page.waitForFunction(() => document.querySelector('#profile')?.dataset.transition === 'open');
  const noProfile = () => page.waitForFunction(() => !document.querySelector('.motion-profile'));
  const ready = () => page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
  });
  let visit = 0;
  const fresh = async (hash = '') => { await page.goto(base + 'thesis-motion.html?qa=' + ++visit + hash); await ready(); };
  try {
    await fresh();
    const source = await page.locator('[data-post="tom-lee-spy"] .motion-avatar').boundingBox();
    await page.evaluate(() => {
      document.querySelector('[data-post="tom-lee-spy"] .motion-person-link').click();
      document.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 0; });
    });
    assert.equal(await page.locator('#detail').isHidden(), true, 'identity opens profile, not the thesis behind it');
    const start = await page.locator('.motion-profile-anchor .motion-avatar').boundingBox();
    near(start.x, source.x); near(start.y, source.y); near(start.width, source.width);
    assert.equal(await page.evaluate(() => document.getAnimations().length), 1);
    const duration = await page.evaluate(() => document.getAnimations()[0].effect.getTiming().duration);
    assert.equal(duration, 400);
    let bend = 0;
    for (const fraction of [.1, .3, .5, .7, .999]) {
      await page.evaluate(t => document.getAnimations()[0].currentTime = t, duration * fraction);
      const frame = await page.evaluate(() => {
        const root = document.querySelector('#profile');
        const copy = root.querySelector('.motion-profile-anchor .motion-avatar').getBoundingClientRect();
        const names = [...root.querySelectorAll('.motion-profile-anchor-name > .motion-name')].map(node => {
          const style = getComputedStyle(node), range = document.createRange(); range.selectNodeContents(node.firstChild);
          const rect = range.getBoundingClientRect();
          return { weight: style.fontWeight, size: parseFloat(style.fontSize), opacity: Number(style.opacity), x: rect.x, width: rect.width };
        });
        return { x: copy.x, y: copy.y, width: copy.width,
          names,
          metaHeight: root.querySelector('.motion-profile-anchor-meta').getBoundingClientRect().height,
          p: Number(getComputedStyle(root).getPropertyValue('--profile-progress')),
          surface: Number(getComputedStyle(root.querySelector('.motion-profile-surface')).opacity),
          background: getComputedStyle(root).backgroundColor };
      });
      bend = Math.max(bend, frame.x - source.x);
      near(frame.y, source.y + (56 - source.y) * frame.p);
      near(frame.width, 32 + 24 * frame.p);
      assert.deepEqual(frame.names.map(name => name.weight), ['500', '400'], 'static font faces never switch abruptly mid-animation');
      near(frame.names[0].size, 14 + 4 * frame.p); near(frame.names[1].size, frame.names[0].size);
      near(frame.names[0].opacity, 1 - frame.p); near(frame.names[1].opacity, frame.p);
      near(frame.names[0].width, frame.names[1].width); near(frame.names[0].x, frame.names[1].x);
      near(frame.metaHeight, 20); // WebKit needs bounds for the isolated text blend to paint.
      if (frame.surface > .001) assert.equal(frame.background, 'rgb(255, 255, 255)', 'the expanding container has an opaque surface');
    }
    assert.ok(bend > 2 && bend <= 8.1, 'identity follows a restrained curved path');
    const end = await page.locator('.motion-profile-anchor .motion-avatar').boundingBox();
    await page.evaluate(() => document.getAnimations()[0].play()); await openProfile();
    const hero = await page.locator('#profile .motion-profile-hero .motion-avatar').boundingBox();
    near(end.x, hero.x); near(end.y, hero.y); near(end.width, hero.width);
    await page.locator('#profile').getByRole('button', { name: 'Follow Tom Lee', exact: true }).click();
    assert.equal(await page.locator('#profile [data-follow]').getAttribute('aria-pressed'), 'true');

    // Even the empty tab can pin; switching back keeps the header stationary.
    await page.locator('#profile .motion-profile-scroll').evaluate(node => node.scrollTop = 1000);
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('#profile')).getPropertyValue('--profile-header-p')) === 1);
    const pinned = await page.locator('#profile .motion-profile-tabs').boundingBox(); near(pinned.y, 56);
    const before = await page.locator('#profile .motion-profile-scroll').evaluate(node => node.scrollTop);
    await page.getByRole('tab', { name: 'Archived', exact: true }).click();
    assert.equal(await page.locator('#profile .motion-profile-scroll').evaluate(node => node.scrollTop), before);
    near((await page.locator('#profile .motion-profile-tabs').boundingBox()).y, 56);
    await page.getByRole('tab', { name: 'Active', exact: true }).click();

    const compact = await page.locator('#profile .motion-profile-collapsed .motion-avatar').boundingBox();
    await page.evaluate(() => {
      const original = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        Element.prototype.animate = original;
        const animation = original.apply(this, args); animation.pause(); animation.currentTime = 0; return animation;
      };
      document.querySelector('[aria-label="Back from profile"]').click();
    });
    await page.waitForFunction(() => document.querySelector('#profile')?.dataset.transition === 'closing');
    const closeStart = await page.locator('.motion-profile-anchor .motion-avatar').boundingBox();
    near(closeStart.y, compact.y); near(closeStart.x, compact.x); near(closeStart.width, compact.width);
    assert.equal(await page.locator('.motion-profile-anchor-meta .to').count(), 0, 'compact header never grows an extra subtitle on return');
    await page.evaluate(() => document.getAnimations().forEach(animation => animation.play())); await noProfile();
    assert.equal(await page.locator('#feed').getAttribute('aria-hidden'), 'false');

    // Interrupt entry, reverse, then redirect forward without a jump.
    await page.evaluate(() => {
      document.querySelector('[data-post="tom-lee-spy"] .motion-person-link').click();
      const animation = document.getAnimations()[0]; animation.pause(); animation.currentTime = 80;
      const original = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        Element.prototype.animate = original;
        const next = original.apply(this, args); next.pause(); next.currentTime = 0; return next;
      };
    });
    const interrupted = await page.locator('.motion-profile-anchor .motion-avatar').boundingBox();
    await page.evaluate(() => document.querySelector('[aria-label="Back from profile"]').click());
    await page.waitForFunction(() => document.querySelector('#profile')?.dataset.transition === 'closing');
    const reversed = await page.locator('.motion-profile-anchor .motion-avatar').boundingBox();
    near(interrupted.x, reversed.x); near(interrupted.y, reversed.y);
    await page.evaluate(() => history.forward()); await openProfile();
    await page.getByRole('button', { name: 'Back from profile' }).click(); await noProfile();

    // Detail -> profile -> another detail: preserve every underlying viewport.
    await page.locator('[data-post="raoul-pal-ai"]').scrollIntoViewIfNeeded();
    const feedTop = await page.locator('#feedScroll').evaluate(node => node.scrollTop);
    await page.locator('[data-post="raoul-pal-ai"] .motion-open').click();
    await page.waitForFunction(() => document.querySelector('#detail').dataset.transition === 'open');
    await page.locator('#detail .motion-detail-scroll').evaluate(node => node.scrollTop = 80);
    await page.locator('#detail .motion-detail-header .motion-person-link').click(); await openProfile();
    await page.locator('#profile .motion-open').first().click();
    await page.waitForFunction(() => document.querySelector('.motion-detail:not(#detail)')?.dataset.transition === 'open');
    assert.equal(await page.locator('#profile').getAttribute('aria-hidden'), 'true');
    await page.evaluate(() => history.go(-2)); await noProfile();
    assert.equal(await page.locator('.motion-detail:not(#detail)').count(), 0);
    assert.equal(await page.locator('#detail .motion-detail-scroll').evaluate(node => node.scrollTop), 80);
    await page.getByRole('button', { name: 'Back to For You' }).click();
    await page.waitForFunction(() => document.querySelector('#detail').hidden);
    assert.equal(await page.locator('#feedScroll').evaluate(node => node.scrollTop), feedTop);
    await page.evaluate(() => history.go(3));
    await page.waitForFunction(() => document.querySelector('.motion-detail:not(#detail)')?.dataset.transition === 'open');
    assert.equal(await page.locator('.motion-profile').count(), 1, 'multiple-step Forward reconstructs one copy of each page');
    await page.evaluate(() => history.go(-3));
    await noProfile(); await page.waitForFunction(() => document.querySelector('#detail').hidden);

    for (const width of [320, 360, 393, 430]) {
      await page.setViewportSize({ width, height: 759 }); await fresh('#profile/chamath'); await openProfile();
      const scale = Math.min(1, width / 360);
      const metrics = await page.evaluate(() => {
        const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height }; };
        return { hero: rect('.motion-profile-hero .motion-avatar'), tabs: rect('.motion-profile-tabs'),
          gallery: rect('#profile .motion-charts'), overflow: document.documentElement.scrollWidth > innerWidth,
          avatarPixels: document.querySelector('.motion-profile-hero .motion-avatar').naturalWidth };
      });
      near(metrics.hero.width, 56 * scale); near(metrics.hero.y, 56 * scale);
      near(metrics.gallery.x, 0); near(metrics.gallery.width, width);
      assert.equal(metrics.overflow, false); assert.ok(metrics.avatarPixels > 0);
      assert.ok(metrics.tabs.y > metrics.hero.y + metrics.hero.height);
      await page.screenshot({ path: output + '/profile-' + width + '.png' });
      await page.locator('#profile .motion-profile-scroll').evaluate(node => node.scrollTop = 190);
      const scroll = await page.locator('#profile .motion-profile-scroll').evaluate(node => node.scrollTop);
      await page.getByRole('tab', { name: 'Archived', exact: true }).click();
      assert.equal(await page.locator('#profile .motion-profile-scroll').evaluate(node => node.scrollTop), scroll);
      await page.getByRole('button', { name: 'Back from profile' }).click(); await noProfile();
      assert.equal(new URL(page.url()).hash, '');
    }

    await fresh('#chamath-tsla');
    await page.waitForFunction(() => document.querySelector('#detail')?.dataset.transition === 'open');
    await page.getByRole('button', { name: 'Back to For You' }).click();
    await page.waitForFunction(() => document.querySelector('#detail').hidden);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('.motion-recommendation .motion-person-link').click(); await openProfile();
    assert.deepEqual(await page.evaluate(() => document.getAnimations().map(a => a.playState)), []);
    assert.equal(await page.locator('.motion-profile-anchor').count(), 0);
    await page.keyboard.press('Escape'); await noProfile();

    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.goto(base + 'index.html#/thesis-motion');
    const frame = page.frameLocator('iframe');
    await frame.locator('[data-post="tom-lee-spy"] .motion-person-link').click();
    await frame.locator('#profile[data-transition="open"]').waitFor();
    await page.locator('#deviceTrigger').click(); await page.getByRole('option', { name: /Galaxy A16/ }).click();
    // Wait for the selected viewport and its resize handler, not a match
    // between the app and the previous device's dimensions.
    await page.waitForFunction(() => {
      const win = document.querySelector('iframe').contentWindow;
      const app = win.document.querySelector('#motionApp').getBoundingClientRect();
      return win.innerWidth === 412 && win.innerHeight === 892
        && Math.abs(app.height - win.innerHeight) < .5 && Math.abs(app.width - win.innerWidth) < .5;
    });
    const insets = await frame.locator('#profile').evaluate(node => {
      const rect = node.getBoundingClientRect(), header = node.querySelector('header').getBoundingClientRect();
      const css = getComputedStyle(document.documentElement);
      return { top:rect.top, bottom:innerHeight-rect.bottom, status:parseFloat(css.getPropertyValue('--status-h')), home:parseFloat(css.getPropertyValue('--home-h')), header:header.height, headerTop:header.top, contentBottom:innerHeight-node.querySelector('.motion-profile-scroll').getBoundingClientRect().bottom };
    });
    near(insets.top, 0); near(insets.bottom, 0); near(insets.headerTop, insets.status); near(insets.contentBottom, insets.home); near(insets.header, 56);
    await page.screenshot({ path: output + '/profile-android.png' });
    assert.deepEqual(errors, []);
    console.log('PASS: profile design coordinates, high-resolution identity, curved shared anchor, no overlapping page text, reversal, nested history/scroll, compact header return, stable empty tabs, responsive widths, deep links, reduced motion and Android insets.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
