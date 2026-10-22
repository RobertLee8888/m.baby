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
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  const waitOpen = () => page.waitForFunction(() => document.querySelector('#detail').dataset.transition === 'open');
  const waitClosed = () => page.waitForFunction(() => document.querySelector('#detail').hidden);
  const back = async () => { await page.getByRole('button', { name: 'Back to For You' }).click(); await waitClosed(); };
  const ready = async () => {
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode().catch(() => {}))); });
  };
  const capture = name => page.screenshot({ path: output + '/' + name + '.png' });
  try {
    await page.goto(base + 'thesis-motion.html'); await ready();
    // Coordinates from the supplied 393x852 Figma, excluding system insets.
    const initial = await page.evaluate(() => {
      const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x:r.x,y:r.y,w:r.width,h:r.height }; };
      return { avatar:rect('[data-post="satya"] .motion-avatar'), chart:rect('[data-post="satya"] .motion-chart'), recommendation:rect('.motion-recommendation') };
    });
    const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < .5, `${actual} should be within half a pixel of ${expected}`);
    near(initial.avatar.y, 111);
    near(initial.chart.y, 292);
    assert.equal(initial.chart.w, 240);
    assert.equal(initial.chart.h, 135);
    near(initial.recommendation.y, 477);
    await capture('list-final');

    const firstAvatar = await page.locator('[data-post="satya"] .motion-avatar').boundingBox();
    await page.evaluate(() => {
      document.querySelector('[data-post="satya"] .motion-body').click();
      document.getAnimations().forEach(a => { a.pause(); a.currentTime = 0; });
    });
    const startAvatar = await page.locator('[data-motion-shared="avatar"]').boundingBox();
    assert.ok(Math.abs(firstAvatar.x - startAvatar.x) < 1 && Math.abs(firstAvatar.y - startAvatar.y) < 1, 'entry starts at the source avatar');
    assert.equal(await page.evaluate(() => document.getAnimations().length), 1, 'one animation drives the entire card');
    const duration = await page.evaluate(() => document.getAnimations()[0].effect.getTiming().duration);
    assert.equal(duration, 400, 'near card leaves room for a gentle settling tail');
    let previousChartY = initial.chart.y;
    let pathBend = 0;
    const progressSamples = [];
    for (const fraction of [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, .999]) {
      const time = duration * fraction;
      await page.evaluate(t => document.getAnimations().forEach(a => a.currentTime = t), time);
      const sample = await page.evaluate(() => {
        const copy = document.querySelector('.motion-card-copy');
        return { chartY:copy.querySelector('.motion-chart').getBoundingClientRect().y,
          avatarX:copy.querySelector('.motion-avatar').getBoundingClientRect().x,
          progress:Number(getComputedStyle(document.querySelector('#detail')).getPropertyValue('--thesis-progress')),
          textOpacity:[...copy.querySelectorAll('.motion-body-wrap')].reduce((sum, node) => sum + Number(getComputedStyle(node).opacity), 0),
          sourceWidth:copy.querySelector('.motion-body-wrap.from').getBoundingClientRect().width };
      });
      assert.ok(sample.chartY <= previousChartY + .5, 'chart never jumps downward as text changes line wrap');
      assert.ok(Math.abs(sample.textOpacity - 1) < .001, 'paragraph never fades through an empty state');
      near(sample.sourceWidth, 361);
      pathBend = Math.max(pathBend, sample.avatarX - (firstAvatar.x + 32 * sample.progress));
      progressSamples.push(sample.progress);
      previousChartY = sample.chartY;
    }
    assert.ok(pathBend > 6 && pathBend <= 8.1, 'shared content follows a restrained arc rather than a straight diagonal');
    const steps = progressSamples.slice(1).map((p, i) => p - progressSamples[i]);
    assert.ok(steps.every((step, i) => !i || step < steps[i - 1]), 'each equal-time interval travels less than the previous one');
    assert.ok(progressSamples[5] > .85 && progressSamples[5] < .95, 'half time leaves a visible but restrained settling distance');
    const lastFrameChart = await page.locator('[data-motion-shared="chart-0"]').boundingBox();
    await page.evaluate(t => document.getAnimations().forEach(a => a.currentTime = t), duration / 2);
    const midAvatar = await page.locator('[data-motion-shared="avatar"]').boundingBox();
    assert.ok(midAvatar.y < startAvatar.y && midAvatar.y > 10, 'identity moves upward through the transition');
    await capture('expansion-midpoint');
    await page.evaluate(() => document.getAnimations().forEach(a => a.play())); await waitOpen();
    const settledChart = await page.locator('#detail .motion-chart').first().boundingBox();
    near(lastFrameChart.x, settledChart.x); near(lastFrameChart.y, settledChart.y);
    assert.equal(await page.locator('#detail .motion-name').first().textContent(), 'Satya Nadella');
    assert.equal(await page.locator('#detail .motion-body').first().textContent(), await page.locator('[data-post="satya"] .motion-body').textContent());
    await page.locator('#detail').getByRole('button', { name: 'Bookmark', exact: true }).click();
    await back();
    assert.equal(await page.locator('[data-post="satya"] [data-save]').getAttribute('aria-pressed'), 'true');

    // Re-target a moving card: preserve position and velocity, brake, then return.
    const beforeReverse = await page.evaluate(() => {
      document.querySelector('[data-post="satya"] .motion-body').click();
      const animation = document.getAnimations()[0];
      const time = animation.effect.getTiming().duration * .35;
      const progress = () => Number(getComputedStyle(document.querySelector('#detail')).getPropertyValue('--thesis-progress'));
      animation.pause(); animation.currentTime = time;
      const value = progress(); animation.currentTime = time - 1;
      const velocity = value - progress(); animation.currentTime = time;
      const original = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        Element.prototype.animate = original;
        const next = original.apply(this, args); next.pause(); next.currentTime = 0; return next;
      };
      document.querySelector('[aria-label="Back to For You"]').click();
      return { value, velocity };
    });
    await page.waitForFunction(() => document.querySelector('#detail').dataset.transition === 'closing');
    const reverse = await page.evaluate(() => {
      const animation = document.getAnimations()[0];
      const duration = animation.effect.getTiming().duration;
      const progress = () => Number(getComputedStyle(document.querySelector('#detail')).getPropertyValue('--thesis-progress'));
      const value = progress(); animation.currentTime = .25;
      const velocity = (progress() - value) / .25;
      const samples = [];
      for (let time = 0; time < duration; time += 5) { animation.currentTime = time; samples.push(progress()); }
      return { value, velocity, samples };
    });
    assert.ok(Math.abs(reverse.value - beforeReverse.value) < .00001, 'retargeting never jumps position');
    assert.ok(Math.abs(reverse.velocity - beforeReverse.velocity) / beforeReverse.velocity < .05, 'retargeting inherits velocity instead of flipping its sign');
    assert.ok(Math.max(...reverse.samples) > beforeReverse.value, 'the card brakes before changing direction');
    assert.ok(reverse.samples.every(p => p >= 0 && p <= 1), 'braking never overshoots the list/detail bounds');
    await page.evaluate(() => document.getAnimations().forEach(a => a.play())); await waitClosed();

    await page.locator('[data-post="traderstewie"]').scrollIntoViewIfNeeded();
    const savedScroll = await page.locator('#feedScroll').evaluate(n => n.scrollTop);
    await page.locator('[data-post="traderstewie"] .motion-body').click(); await waitOpen(); await ready();
    await capture('detail-final');
    const detailGeometry = await page.evaluate(() => {
      const top = q => document.querySelector(q).getBoundingClientRect().top;
      return { chart:top('#detail .motion-chart'), tabs:top('.motion-detail-tabs'), signal:top('.motion-signal-source') };
    });
    for (const [key, value] of Object.entries({ chart:250, tabs:441, signal:489 })) near(detailGeometry[key], value);
    const detailScroll = page.locator('.motion-detail-scroll');
    await detailScroll.evaluate(n => { n.scrollTop = 10000; });
    const pinned = await page.locator('.motion-detail-tabs').boundingBox();
    assert.ok(Math.abs(pinned.y - 56) < 1, 'short content still lets tabs pin');
    const scrollBeforeTab = await detailScroll.evaluate(n => n.scrollTop);
    await page.getByRole('tab', { name: 'Related thesis', exact: true }).click();
    await page.waitForTimeout(300);
    assert.equal(await detailScroll.evaluate(n => n.scrollTop), scrollBeforeTab, 'switching tabs does not change scroll position');
    await page.getByRole('tab', { name: 'Signals', exact: true }).click();
    await back();
    assert.equal(await page.locator('#feedScroll').evaluate(n => n.scrollTop), savedScroll);
    await page.goForward(); await waitOpen(); await back();

    // Interrupt entry, then interrupt the return with browser forward.
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => document.querySelector('[data-post="traderstewie"] .motion-body').click());
      await page.waitForTimeout(45); await page.goBack();
      if (i % 2) { await page.waitForTimeout(15); await page.goForward(); await waitOpen(); await back(); }
      else await waitClosed();
      assert.equal(await page.locator('#feed').evaluate(n => n.inert), false);
      assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    }

    for (const width of [320, 360, 393, 430]) {
      await page.setViewportSize({ width, height: 759 });
      await page.goto(base + 'thesis-motion.html'); await ready();
      await capture('list-' + width);
      await page.locator('[data-post="gavin"]').scrollIntoViewIfNeeded();
      const gallery = page.locator('[data-post="gavin"] .motion-charts');
      const edges = await gallery.boundingBox();
      assert.ok(Math.abs(edges.x) < 1 && Math.abs(edges.width - width) < 1, 'horizontal media clips at viewport edges');
      await gallery.evaluate(n => n.scrollLeft = 180);
      const chartBefore = await gallery.locator('.motion-chart').first().boundingBox();
      await page.evaluate(() => {
        document.querySelector('[data-post="gavin"] .motion-body').click();
        document.getAnimations().forEach(a => { a.pause(); a.currentTime = 0; });
      });
      const chartDuring = await page.locator('[data-motion-shared="chart-0"]').boundingBox();
      near(chartDuring.x, chartBefore.x); near(chartDuring.y, chartBefore.y);
      await page.evaluate(() => document.getAnimations().forEach(a => a.play())); await waitOpen();
      assert.equal(await page.locator('#detail .motion-charts').evaluate(n => n.scrollLeft), 180);
      await capture('detail-' + width);
      await page.locator('#detail .motion-charts').evaluate(n => n.scrollLeft = 300);
      const returnFrom = await page.locator('#detail .motion-chart').first().boundingBox();
      await page.evaluate(() => {
        const animate = Element.prototype.animate;
        Element.prototype.animate = function (...args) {
          const animation = animate.apply(this, args); animation.pause(); animation.currentTime = 0; return animation;
        };
        document.querySelector('[aria-label="Back to For You"]').click();
      });
      await page.waitForFunction(() => document.querySelector('#detail').dataset.transition === 'closing');
      const returnCopy = await page.locator('[data-motion-shared="chart-0"]').boundingBox();
      near(returnCopy.x, returnFrom.x); near(returnCopy.y, returnFrom.y);
      await page.evaluate(() => document.getAnimations().forEach(a => a.play())); await waitClosed();
      assert.equal(await gallery.evaluate(n => n.scrollLeft), 180);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false);
    }

    // Timeline structure is shared by every detail, including entries without media.
    await page.goto(base + 'thesis-motion.html'); await ready();
    for (const id of ['satya', 'gavin', 'traderstewie', 'berkshire', 'sam', 'reuters']) {
      await page.locator(`[data-post="${id}"]`).scrollIntoViewIfNeeded();
      await page.locator(`[data-post="${id}"] .motion-body`).click(); await waitOpen();
      assert.equal(await page.locator('.motion-timeline > .motion-rail').count(), 1);
      assert.equal(await page.locator('.motion-timeline > .motion-dot').count(), 2);
      assert.equal(await page.getByRole('button', { name: 'View all 12 updates' }).count(), 1);
      await back();
    }

    await page.evaluate(() => {
      document.querySelector('[data-post="reuters"] .motion-body').click();
      document.getAnimations().forEach(a => { a.pause(); a.currentTime = 70; });
      document.querySelector('.motion-detail-scroll').scrollTop = 120;
    });
    await waitOpen();
    assert.equal(await page.locator('.motion-card-copy').count(), 0, 'scrolling can interrupt entry without leaving a duplicate card');
    await back();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-post="gavin"] .motion-body').click(); await waitOpen();
    assert.deepEqual(await page.evaluate(() => document.getAnimations().map(a => ({ type: a.constructor.name, target: a.effect.target.className, state: a.playState }))), []);
    await back();
    await page.goto(base + 'thesis-motion.html#traderstewie'); await waitOpen();
    await back(); assert.equal(new URL(page.url()).hash, '');

    // The gallery owns simulated iOS/Android safe areas; a real phone gets none.
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.goto(base + 'index.html#/thesis-motion');
    const frame = page.frameLocator('iframe');
    await frame.locator('.motion-post').first().waitFor();
    const chrome = await frame.locator('html').evaluate(n => ({ platform:n.dataset.devicePlatform, top:parseFloat(getComputedStyle(n).getPropertyValue('--status-h')), bottom:parseFloat(getComputedStyle(n).getPropertyValue('--home-h')) }));
    assert.ok(chrome.top > 0 && chrome.bottom > 0);
    await page.locator('#deviceTrigger').click();
    await page.getByRole('option', { name: /Galaxy A16/ }).click();
    await page.waitForTimeout(100);
    assert.equal(await frame.locator('html').getAttribute('data-device-platform'), 'android');
    const androidHeader = await frame.locator('.motion-feed-header').boundingBox();
    assert.ok(androidHeader.height > 70);
    await capture('gallery-android');
    await page.locator('#themePill').click();
    const shellTheme = await page.locator('html').getAttribute('data-theme');
    await page.waitForFunction(() => document.querySelector('iframe').contentDocument.documentElement.dataset.theme === document.documentElement.dataset.theme);
    assert.equal(await frame.locator('html').getAttribute('data-theme'), shellTheme);
    assert.deepEqual(errors, []);
    console.log('PASS: Figma geometry, shared arc, decelerating arrival, velocity-preserving reversal, visible text and monotonic charts, complete timelines, history, gallery continuity, pinned tabs, 320/360/393/430, reduced motion and Android gallery.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
