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
  const ticker = () => page.locator('.motion-ticker-page').last();
  let visit = 0;
  const fresh = async (hash = '') => {
    await page.goto(base + 'thesis-motion.html?qa=' + ++visit + hash);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode().catch(() => {}))); });
    await settled();
  };
  try {
    await fresh();
    const chip = page.locator('[data-post="satya"] [data-ticker="MSFT"]');
    const source = await chip.locator('img').first().boundingBox();
    const sourceText = await chip.locator('.motion-ticker-symbol').evaluate(node => {
      const range = document.createRange(); range.selectNodeContents(node); return range.getBoundingClientRect().toJSON();
    });
    await chip.evaluate(node => { node.click(); document.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 0; }); });
    const start = await page.locator('.motion-ticker-anchor > .motion-ticker-logo').boundingBox();
    const startText = await page.locator('.motion-ticker-anchor-meta > .motion-ticker-symbol').boundingBox();
    near(start.x, source.x); near(start.y, source.y); near(start.width, source.width);
    near(startText.x, sourceText.x); near(startText.y, sourceText.y);
    assert.equal(await page.locator('#detail').isHidden(), true, 'chip must not also open the card');
    assert.equal(await page.evaluate(() => document.getAnimations().length), 1);
    const duration = await page.evaluate(() => document.getAnimations()[0].effect.getTiming().duration);
    assert.ok([400, 440].includes(duration));
    let bow = 0;
    for (const fraction of [.1, .3, .5, .7, .999]) {
      await page.evaluate(t => document.getAnimations()[0].currentTime = t, duration * fraction);
      const frame = await ticker().evaluate(root => {
        const logo = root.querySelector('.motion-ticker-anchor > .motion-ticker-logo').getBoundingClientRect();
        const name = root.querySelector('.motion-ticker-anchor-person > .motion-name');
        const symbol = root.querySelector('.motion-ticker-anchor-meta > .motion-ticker-symbol').getBoundingClientRect();
        const market = root.querySelector('.motion-ticker-market').getBoundingClientRect();
        const trend = root.querySelector('.motion-ticker-anchor-person > .motion-trend').getBoundingClientRect();
        return { x: logo.x, y: logo.y, w: logo.width, p: Number(getComputedStyle(root).getPropertyValue('--ticker-progress')),
          nameX: name.getBoundingClientRect().x, nameY: name.getBoundingClientRect().y, symbolX: symbol.x,
          metaY: root.querySelector('.motion-ticker-anchor-meta').getBoundingClientRect().y,
          nameOpacity: Number(getComputedStyle(name).opacity), trendX: trend.x, marketRight: market.right,
          headerY: root.querySelector('header').getBoundingClientRect().y,
          targetHidden: getComputedStyle(root.querySelector('.motion-ticker-identity > .motion-person')).visibility,
          background: getComputedStyle(root).backgroundColor, surface: Number(getComputedStyle(root.querySelector('.motion-ticker-surface')).opacity) };
      });
      bow = Math.max(bow, frame.x - (source.x + (48 - source.x) * frame.p));
      near(frame.y, source.y + (12 - source.y) * frame.p); near(frame.w, 16 + 16 * frame.p);
      near(frame.nameX, frame.symbolX); near(frame.nameY + 20, frame.metaY);
      near(frame.nameOpacity, frame.p); near(frame.headerY + 12, frame.y);
      assert.equal(frame.targetHidden, 'hidden', 'company name must travel with the shared identity, not appear again at the destination');
      assert.ok(frame.trendX >= frame.marketRight, 'the outgoing trend never overlaps the incoming exchange');
      if (frame.surface > .001) assert.equal(frame.background, 'rgb(255, 255, 255)', 'the expanding container has an opaque surface');
      if (fraction === .3) await page.screenshot({ path: output + '/ticker-motion-midpoint.png' });
    }
    assert.ok(bow > 2 && bow <= 8.1, 'shared identity follows a restrained arc');
    const endText = await page.locator('.motion-ticker-anchor-meta > .motion-ticker-symbol').boundingBox();
    const endName = await page.locator('.motion-ticker-anchor-person > .motion-name').boundingBox();
    await page.evaluate(() => document.getAnimations()[0].play()); await settled();
    const targetText = await ticker().locator('.motion-ticker-meta .motion-ticker-symbol').boundingBox();
    near(endText.x, targetText.x); near(endText.y, targetText.y);
    const targetName = await ticker().locator('.motion-ticker-identity .motion-name').boundingBox();
    near(endName.x, targetName.x); near(endName.y, targetName.y);
    near((await ticker().locator('header').boundingBox()).height, 56);
    near((await ticker().locator('[role="tablist"]').boundingBox()).height, 28);
    near((await ticker().locator('.motion-post').first().boundingBox()).y, 84);
    await ticker().getByRole('button', { name: 'Follow MSFT', exact: true }).click();
    assert.equal(await ticker().locator('[data-watch]').getAttribute('aria-pressed'), 'true');
    await ticker().getByRole('button', { name: 'Back from ticker' }).click(); await settled();
    assert.equal(await page.locator('.motion-ticker-page').count(), 0);
    assert.equal(await chip.evaluate(node => getComputedStyle(node).visibility), 'visible');

    // Back/Forward interrupts the one driver without losing its current position.
    await chip.evaluate(node => {
      node.click(); const animation = document.getAnimations()[0]; animation.pause(); animation.currentTime = 80;
      const original = Element.prototype.animate;
      Element.prototype.animate = function (...args) { Element.prototype.animate = original; const next = original.apply(this, args); next.pause(); next.currentTime = 0; return next; };
    });
    const interrupted = await page.locator('.motion-ticker-anchor > .motion-ticker-logo').boundingBox();
    await page.evaluate(() => history.back());
    await page.waitForFunction(() => document.querySelector('.motion-ticker-page')?.dataset.transition === 'closing');
    const reversed = await page.locator('.motion-ticker-anchor > .motion-ticker-logo').boundingBox();
    near(interrupted.x, reversed.x); near(interrupted.y, reversed.y);
    await page.evaluate(() => history.forward()); await settled();
    assert.equal(await ticker().locator('[data-watch]').getAttribute('aria-pressed'), 'true');
    await ticker().getByRole('button', { name: 'Back from ticker' }).click(); await settled();

    // A horizontally scrolled chip retains its source row and feed viewport.
    await page.setViewportSize({ width: 360, height: 759 });
    await page.locator('#feed [data-post="gavin"]').scrollIntoViewIfNeeded();
    await page.locator('#feed [data-post="gavin"] .motion-tickers').evaluate(row => row.scrollLeft = 100);
    const position = await page.evaluate(() => ({ top: document.querySelector('#feedScroll').scrollTop, left: document.querySelector('[data-post="gavin"] .motion-tickers').scrollLeft }));
    await page.locator('#feed [data-post="gavin"] [data-ticker="NVDA"]').click(); await settled();
    assert.equal(await ticker().locator('.motion-name').first().innerText(), 'NVIDIA Corp');
    assert.equal(await ticker().locator('.motion-post').count(), 2);
    await ticker().locator('.motion-open').first().click(); await settled();
    assert.equal(await page.locator('.motion-detail[data-transition="open"]').count(), 1);
    await page.locator('.motion-detail[data-transition="open"] [data-back]').click(); await settled();
    await ticker().getByRole('button', { name: 'Back from ticker' }).click(); await settled();
    assert.deepEqual(await page.evaluate(() => ({ top: document.querySelector('#feedScroll').scrollTop, left: document.querySelector('[data-post="gavin"] .motion-tickers').scrollLeft })), position);

    // Profile -> thesis -> ticker -> another thesis, then restore all three pages.
    await fresh('#profile/maya');
    await page.locator('#profile .motion-open').first().click(); await settled();
    const detailRoot = page.locator('.motion-detail[data-transition="open"]').last();
    await detailRoot.locator('[data-ticker="MSFT"]').click(); await settled();
    await ticker().locator('[data-post="satya"] .motion-open').click(); await settled();
    await page.evaluate(() => history.go(-3)); await settled();
    await page.waitForFunction(() => document.querySelectorAll('.motion-detail:not([hidden]), .motion-ticker-page').length === 0);
    assert.equal(await page.locator('#profile').getAttribute('aria-hidden'), 'false');
    await page.evaluate(() => history.go(3));
    await page.waitForFunction(() => document.querySelectorAll('.motion-detail[data-transition="open"]').length === 2); await settled();
    assert.equal(await page.locator('.motion-ticker-page').count(), 1);

    for (const width of [320, 360, 393, 430]) {
      await page.setViewportSize({ width, height: 759 }); await fresh('#ticker/NVDA');
      const geometry = await ticker().evaluate(root => ({ w: root.getBoundingClientRect().width, header: root.querySelector('header').getBoundingClientRect().height,
        scroll: root.querySelector('.motion-ticker-scroll').getBoundingClientRect().top, overflow: document.documentElement.scrollWidth > innerWidth,
        border: getComputedStyle(root.querySelector('[role="tablist"]')).boxShadow }));
      near(geometry.w, width); near(geometry.header, 56 * Math.min(1, width / 360)); near(geometry.scroll, 84 * Math.min(1, width / 360));
      assert.equal(geometry.overflow, false); assert.notEqual(geometry.border, 'none');
      await page.screenshot({ path: output + `/ticker-${width}.png` });
    }
    await fresh('#nvda-s07');
    assert.equal(await page.locator('.motion-detail[data-transition="open"]').count(), 1);
    await page.locator('.motion-detail[data-transition="open"] [data-back]').click(); await settled();
    assert.equal(await ticker().getAttribute('data-ticker-page'), 'NVDA');
    await page.emulateMedia({ reducedMotion: 'reduce' }); await fresh();
    await page.locator('[data-post="satya"] [data-ticker="MSFT"]').click(); await settled();
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    await ticker().getByRole('button', { name: 'Back from ticker' }).click(); await settled();
    assert.equal(await page.locator('.motion-ticker-page').count(), 0);
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.goto(base + 'index.html#/thesis-motion');
    const frame = page.frameLocator('iframe');
    await frame.locator('[data-post="satya"] [data-ticker="MSFT"]').click();
    await frame.locator('.motion-ticker-page[data-transition="open"]').waitFor();
    await page.locator('#deviceTrigger').click(); await page.getByRole('option', { name: /Galaxy A16/ }).click();
    await page.waitForFunction(() => {
      const win = document.querySelector('iframe').contentWindow;
      const app = win.document.querySelector('#motionApp').getBoundingClientRect();
      return win.innerWidth === 412 && win.innerHeight === 892
        && Math.abs(app.height - win.innerHeight) < .5 && Math.abs(app.width - win.innerWidth) < .5;
    });
    const insets = await frame.locator('.motion-ticker-page').evaluate(root => {
      const rect = root.getBoundingClientRect(), css = getComputedStyle(document.documentElement);
      return { top: rect.top, bottom: innerHeight - rect.bottom, status: parseFloat(css.getPropertyValue('--status-h')), home: parseFloat(css.getPropertyValue('--home-h')), headerTop:root.querySelector('header').getBoundingClientRect().top, contentBottom:innerHeight-root.querySelector('.motion-ticker-scroll').getBoundingClientRect().bottom };
    });
    near(insets.top, 0); near(insets.bottom, 0); near(insets.headerTop, insets.status); near(insets.contentBottom, insets.home);
    await page.screenshot({ path: output + '/ticker-android.png' });
    assert.deepEqual(errors, []);
    console.log('PASS: ticker Figma geometry, shared logo/symbol arc, one driver, interruption, nested navigation, scroll restoration, star state, direct links, 320/360/393/430, reduced motion and Android insets.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
