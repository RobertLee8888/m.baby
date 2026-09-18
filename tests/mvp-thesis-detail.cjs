const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://127.0.0.1:4174/mvp.html?feed=social';
const output = process.env.QA_OUTPUT || '/tmp/alva-thesis-detail/qa';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const engine = process.env.QA_ENGINE === 'webkit' ? webkit : chromium;
  const browser = await engine.launch({ headless: true, ...(engine === chromium && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 2, hasTouch: true });
  const page = await context.newPage(); page.setDefaultTimeout(9000);
  const errors = []; page.on('pageerror', error => errors.push(error.stack));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  const active = () => page.locator('.social-page:not([hidden]):not([inert])');
  const detail = () => page.locator('.thesis-detail:not([hidden]):not([inert])');
  const updates = () => page.locator('[data-social-page="all-updates"]:not([hidden]):not([inert])');
  const settle = () => page.waitForTimeout(350);
  const shot = name => page.screenshot({ path: output + '/' + name + '.png' });
  async function ready(params) {
    const url = new URL(base);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    await page.goto(url.href); await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.querySelector('#startupLoader').hidden);
    await settle();
  }
  try {
    await ready({ post: 'P01' });
    assert.equal(await detail().getAttribute('data-version'), 'latest');
    assert.equal(await detail().locator('.social-page-top .social-name').textContent(), 'Gavin Baker');
    assert.equal(await detail().locator('.thesis-update-row').count(), 1);
    assert.equal(await detail().locator('.thesis-view-updates').textContent(), 'View all 6 updates');
    assert.equal(await detail().locator('.social-detail-footer').evaluate(n => n.offsetHeight), 43);
    assert.equal(await page.locator('#tabBar').isVisible(), false);
    const geometry = await detail().evaluate(node => {
      const rect = selector => {
        const value = node.querySelector(selector).getBoundingClientRect();
        return [Math.round(value.x), Math.round(value.y), Math.round(value.width), Math.round(value.height)];
      };
      return {
        top: rect('.social-page-top'), rail: rect('.thesis-update-rail'),
        body: rect('.thesis-update-body'), date: rect('.thesis-update-date'),
        chart: rect('.thesis-chart'), tickerHeight: rect('.social-ticker')[3],
        tabs: rect('.thesis-tabs'), footer: rect('.social-detail-footer'),
      };
    });
    assert.deepEqual(geometry, {
      top: [0, 0, 393, 56], rail: [12, 68, 24, 343],
      body: [48, 68, 329, 343], date: [48, 68, 329, 20],
      chart: [48, 220, 240, 135], tickerHeight: 28,
      tabs: [0, 447, 393, 32], footer: [0, 716, 393, 43],
    });
    const rhythm = await detail().evaluate(node => {
      const body = node.querySelector('.thesis-body').getBoundingClientRect();
      const source = node.querySelector('.thesis-sources').getBoundingClientRect();
      const chart = node.querySelector('.thesis-chart').getBoundingClientRect();
      const view = node.querySelector('.thesis-view-updates');
      const label = view.querySelector('.thesis-view-link > span').getBoundingClientRect();
      const arrow = view.querySelector('.thesis-view-link .ic').getBoundingClientRect();
      return {
        sourceGaps: [source.top - body.bottom, chart.top - source.bottom],
        sourceHeight: source.height,
        sourceArrowLineHeight: getComputedStyle(node.querySelector('.thesis-source-arrow')).lineHeight,
        viewHeight: view.getBoundingClientRect().height,
        viewConnector: getComputedStyle(view, '::before').height,
        viewArrowGap: arrow.left - label.right,
        footerRule: getComputedStyle(node.querySelector('.social-detail-footer'), '::before').height,
      };
    });
    assert.deepEqual(rhythm, {
      sourceGaps: [8, 8], sourceHeight: 20, sourceArrowLineHeight: '20px',
      viewHeight: 20, viewConnector: '3px', viewArrowGap: 4, footerRule: '0.5px',
    });
    assert.equal(await detail().locator('.social-page-top').evaluate(n => n.classList.contains('has-scroll-divider')), false);
    await detail().locator('.social-page-scroll').evaluate(n => n.scrollTop = 2); await page.waitForTimeout(40);
    assert.equal(await detail().locator('.social-page-top').evaluate(n => n.classList.contains('has-scroll-divider')), true);
    await shot('latest-393');
    await detail().locator('.social-page-scroll').evaluate(n => n.scrollTop = n.scrollHeight);
    await page.waitForTimeout(40);
    assert.ok(Math.abs(await detail().evaluate(n => n.querySelector('.thesis-tabs').getBoundingClientRect().top - n.querySelector('.social-page-scroll').getBoundingClientRect().top)) < 1);
    assert.equal(await detail().locator('.social-page-top').evaluate(n => n.classList.contains('has-scroll-divider')), false);
    assert.equal(await detail().locator('.thesis-signal').count(), 3);
    await detail().getByRole('tab', { name: 'Related theses' }).click();
    assert.equal(await detail().locator('.social-detail-panel .card').count(), 2);
    await detail().locator('.social-page-scroll').evaluate(n => n.scrollTop = 0);
    await detail().getByRole('button', { name: 'View all 6 updates' }).click(); await settle();
    assert.equal(await updates().locator('.thesis-update-row').count(), 6);
    assert.equal(await updates().locator('.social-detail-footer').count(), 0);
    assert.equal(await updates().locator('.thesis-latest-badge').count(), 1);
    await shot('updates-393');
    const more = updates().locator('[data-version="latest"] .thesis-show-more');
    await more.click();
    assert.equal(await updates().locator('[data-version="latest"] .thesis-body > p:visible').count(), 4);
    await updates().locator('[data-version="P01-jul10"] .thesis-show-more').click();
    assert.equal(await updates().locator('[data-version="latest"] .thesis-body > p:visible').count(), 1);
    assert.equal(await updates().locator('[data-version="P01-jul10"] .thesis-body > p:visible').count(), 3);
    assert.deepEqual(await updates().locator('.thesis-content.is-expanded').evaluateAll(nodes => nodes.map(node => node.closest('.thesis-update-row').dataset.version)), ['P01-jul10']);
    await more.click();
    assert.equal(await updates().locator('[data-version="P01-jul10"] .thesis-body > p:visible').count(), 1);
    assert.deepEqual(await updates().locator('.thesis-content.is-expanded').evaluateAll(nodes => nodes.map(node => node.closest('.thesis-update-row').dataset.version)), ['latest']);
    await updates().locator('.social-page-scroll').evaluate(n => n.scrollTop = 650);
    await settle();
    assert.equal(await updates().locator('.thesis-floating-less').isVisible(), true);
    await shot('expanded-393');
    await updates().locator('.thesis-floating-less').click(); await settle();
    assert.equal(await updates().locator('[data-version="latest"] .thesis-body > p:visible').count(), 1);
    assert.equal(await updates().locator('.thesis-floating-less').isVisible(), false);
    const media = updates().locator('[data-version="P01-jul8"] .thesis-media');
    await media.scrollIntoViewIfNeeded(); await settle();
    const bounds = await media.boundingBox();
    assert.equal(Math.round(bounds.x), 48);
    assert.equal(await media.locator('img').count(), 3);
    assert.ok(await media.locator('img').evaluateAll(nodes => nodes.every(node => node.complete && node.naturalWidth > 0)));
    await media.evaluate(n => n.scrollLeft = 200);
    assert.ok(await media.evaluate(n => n.scrollLeft > 0));
    assert.equal(await updates().locator('[data-version="P01-jul8"] .thesis-show-more').isVisible(), true);
    await updates().locator('.thesis-update-row').first().click({ position: { x: 4, y: 4 } }); await settle();
    assert.equal(await detail().count(), 1);
    assert.equal(await detail().getByRole('tab', { name: 'Related theses' }).getAttribute('aria-selected'), 'true');
    await page.goForward(); await settle();
    assert.equal(await updates().count(), 1);
    await page.goBack(); await settle();
    await detail().locator('.social-detail-footer .thesis-bookmark').click();
    assert.equal(await detail().locator('.social-detail-footer .thesis-bookmark').getAttribute('aria-pressed'), 'true');
    await detail().locator('.social-detail-footer').getByRole('button', { name: 'Ask Alva' }).click(); await settle();
    assert.equal(await page.locator('.social-conversation').count(), 1);
    await page.locator('#sheetTop [aria-label="Close"]').click(); await settle();
    await detail().locator('.social-page-back').click(); await settle();
    assert.equal(await detail().count(), 0);

    await ready({ profile: 'owner' });
    const cards = active().locator('.thesis-profile-list .card');
    await cards.first().locator('.thesis-body').click(); await settle();
    assert.equal(await detail().locator('.thesis-owner-update').count(), 1);
    assert.equal(await detail().locator('.thesis-update-rail').count(), 0);
    await shot('owner-393');
    await detail().getByRole('button', { name: 'More thesis options' }).click();
    assert.deepEqual(await detail().getByRole('menuitem').allTextContents(), ['Archive thesis', 'Make private']);
    await page.waitForTimeout(160);
    assert.deepEqual(await detail().locator('.thesis-detail-menu').evaluate(node => {
      const value = node.getBoundingClientRect();
      return [Math.round(value.x), Math.round(value.y), Math.round(value.width), Math.round(value.height)];
    }), [137, 60, 240, 100]);
    await shot('owner-menu-393');
    await detail().getByRole('menuitem', { name: 'Archive thesis' }).click();
    assert.equal(await detail().locator('.thesis-latest-badge').textContent(), 'Archived');
    assert.equal(await detail().locator('.thesis-owner-update').count(), 0);
    await page.evaluate(() => window.ownerState = JSON.parse(localStorage.getItem('alva-social-feed-v1')));
    assert.equal(await page.evaluate(() => window.ownerState['owner:P06'].archived), true);
    assert.equal(await page.evaluate(() => window.ownerState.P06.archived), false);
    await detail().getByRole('button', { name: 'More thesis options' }).click();
    await detail().getByRole('menuitem', { name: 'Unarchive thesis' }).click();
    await detail().getByRole('button', { name: 'More thesis options' }).click();
    await detail().getByRole('menuitem', { name: 'Make private' }).click();
    assert.deepEqual(await detail().locator('.thesis-latest-badge').allTextContents(), ['Latest', 'Private']);
    await detail().getByRole('button', { name: 'More thesis options' }).click();
    await detail().getByRole('menuitem', { name: 'Make public' }).click();
    await page.evaluate(() => { Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.ownerShare = data; } }); });
    await detail().getByRole('button', { name: 'Share thesis' }).click();
    assert.equal(new URL(await page.evaluate(() => window.ownerShare.url)).searchParams.get('owner'), '1');
    await detail().getByRole('button', { name: 'Update thesis' }).click();
    await page.locator('#sheet .thesis-edit textarea').fill('Evidence has changed.');
    await page.locator('#sheet .thesis-edit [type="submit"]').click(); await settle();
    assert.equal(await detail().locator('.thesis-view-updates').textContent(), 'View all 2 updates');
    assert.equal(await detail().locator('.thesis-body').first().textContent(), 'Evidence has changed.');
    await detail().getByRole('button', { name: 'View all 2 updates' }).click(); await settle();
    assert.equal(await updates().locator('.thesis-update-row').count(), 2);
    await page.goBack(); await settle();
    await detail().locator('.social-page-back').click(); await settle();
    assert.equal(await active().locator('.thesis-profile-list .card').count(), 2);
    await cards.first().locator('.thesis-body').click(); await settle();
    assert.equal(await detail().locator('.thesis-view-updates').textContent(), 'View all 2 updates');
    await ready({ post: 'P06', owner: '1' });
    assert.equal(await detail().locator('.social-page-top .social-name').textContent(), 'YGGYLL');
    assert.equal(await detail().locator('.thesis-view-updates').textContent(), 'View all 2 updates');

    await ready({ post: 'P04' });
    await detail().getByRole('tab', { name: 'Related theses' }).click();
    assert.ok(await detail().locator('.social-detail-panel .card').count() > 0);
    await shot('related-theses-393');
    await ready({ post: 'P01', version: 'P01-jul3' });
    assert.equal(await detail().getAttribute('data-version'), 'latest');
    assert.ok((await page.locator('#toast').textContent()).includes('Opened the latest version'));
    await page.waitForTimeout(2300);
    for (const width of [320, 360, 393, 430]) {
      await page.setViewportSize({ width, height: 759 }); await settle();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await shot('latest-' + width);
      await detail().getByRole('button', { name: 'View all 6 updates' }).click(); await settle();
      assert.ok(await updates().evaluate(n => n.scrollWidth <= n.clientWidth + 1));
      await shot('updates-' + width);
      await page.goBack(); await settle();
    }
    assert.deepEqual(errors, []);
    console.log('Thesis detail timeline, navigation, owner states, expansion, media clipping and responsive checks passed.');
  } finally { await browser.close(); }
})();
