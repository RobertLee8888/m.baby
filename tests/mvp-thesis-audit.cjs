const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://127.0.0.1:4174/mvp.html?feed=social';
const output = process.env.QA_OUTPUT || '/tmp/alva-thesis-audit';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const engine = process.env.QA_ENGINE === 'webkit' ? webkit : chromium;
  const browser = await engine.launch({ headless: true, ...(engine === chromium && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  const active = () => page.locator('.social-page:not([hidden]):not([inert])');
  const shot = async name => {
    await page.waitForTimeout(200);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].filter(img => img.getClientRects().length).map(img => img.decode().catch(() => {})));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await page.screenshot({ path: output + '/' + name + '.png' });
  };
  const back = async () => { await active().locator('.social-page-back').click(); await page.waitForFunction(() => !document.querySelector('.social-page:not([hidden]):not([inert])')); };
  try {
    await page.goto(base); await page.waitForFunction(() => document.querySelector('#startupLoader').hidden); await page.evaluate(() => document.fonts.ready);
    await page.locator('#tabBar [data-tab="market"]').click();
    const people = ['Gavin Baker','Satya Nadella','Chamath Palihapitiya','Sam Altman','Warren Buffett','Elon Musk','Dario Amodei','Jensen Huang'];
    for (const name of people) {
      await page.locator('.thesis-person-card').getByText(name, { exact: true }).click(); await back();
      assert.ok(await page.locator('.thesis-recent-chip').count() <= 5);
      assert.equal(await page.locator('.thesis-recent-label').first().getAttribute('aria-label'), name, 'returning must update recent immediately');
    }
    assert.equal(await page.locator('.thesis-recent-chip').count(), 5);
    await page.locator('.thesis-recent-label').nth(3).click(); await back();
    assert.equal(await page.locator('.thesis-recent-label').first().getAttribute('aria-label'), 'Warren Buffett');
    await page.getByRole('button', { name: 'Remove Warren Buffett', exact: true }).click();
    assert.equal(await active().count(), 0, 'removal must not open profile');
    assert.equal(await page.getByRole('button', { name: 'Remove Warren Buffett', exact: true }).count(), 0);
    await shot('recent-five');
    const search = page.getByRole('searchbox', { name: 'Search tickers, people' });
    await search.fill('Microsoft'); await page.waitForTimeout(160);
    await page.getByRole('tab', { name: 'Tickers', exact: true }).click();
    assert.equal(await page.locator('.thesis-search-results h2').count(), 0);
    const geometry = await page.locator('.thesis-search-results').evaluate(node => {
      const tabs = node.previousElementSibling.getBoundingClientRect();
      const filter = node.querySelector('.thesis-pills .thesis-tab').getBoundingClientRect();
      const row = node.querySelector('.thesis-stock-row').getBoundingClientRect();
      return { above: filter.top - tabs.bottom, below: row.top - filter.bottom };
    });
    assert.deepEqual(geometry, { above: 12, below: 12 });
    await shot('search-tickers');
    await page.getByRole('tab', { name: 'People', exact: true }).click();
    assert.equal(await page.locator('.thesis-search-results h2').count(), 0);
    await shot('search-people');
    await page.getByRole('button', { name: 'Clear search', exact: true }).click();
    await page.locator('.thesis-person-card').filter({ hasText: 'Chamath' }).click();
    const profile = active();
    assert.match(await profile.locator('.thesis-profile-identity img').getAttribute('src'), /social-chamath.png$/);
    assert.equal(await profile.locator('.thesis-profile-pinned .thesis-pills').count(), 0);
    assert.equal(await profile.locator('.thesis-profile-note').evaluate(node => getComputedStyle(node).backgroundColor), 'rgba(0, 0, 0, 0.03)');
    const order = await profile.locator('.social-page-top').evaluate(node => [...node.children].map(child => child.getAttribute('aria-label')));
    assert.ok(order.indexOf('Unfollow Chamath Palihapitiya') < order.indexOf('Share profile'));
    const maxWidth = await profile.locator('.thesis-profile-info').evaluate(node => node.scrollWidth <= node.clientWidth);
    assert.ok(maxWidth);
    await shot('chamath-profile');
    await profile.getByRole('button', { name: 'Show more', exact: true }).click();
    assert.equal(await page.locator('#sheet').getAttribute('aria-hidden'), 'false');
    assert.ok((await page.locator('.thesis-profile-about').textContent()).endsWith('software margins.'));
    await page.locator('#sheetTop [aria-label="Close"]').click();
    await profile.locator('.social-page-scroll').evaluate(node => node.scrollTop = 400);
    await page.waitForFunction(() => document.querySelector('.thesis-profile-collapsed.is-visible'));
    await shot('profile-collapsed');
    await back();
    assert.ok(await page.locator('.social-page').count() <= 1, 'discarded forward pages must be disposed');
    for (const width of [320, 360, 393, 430]) {
      await page.setViewportSize({ width, height: 759 });
      await page.locator('.thesis-person-card').filter({ hasText: 'Chamath' }).click();
      assert.ok(await active().locator('.thesis-profile-header').evaluate(node => node.scrollWidth <= node.clientWidth));
      await shot('profile-' + width); await back();
    }
    await page.setViewportSize({ width: 393, height: 759 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('#tabBar [data-tab="feed"]').click(); await page.waitForTimeout(350);
    for (let i = 0; i < 6; i++) {
      await page.locator('#cards .thesis-body').first().click();
      await page.waitForTimeout(40);
      await page.goBack();
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(320);
    assert.equal(await active().count(), 0);
    assert.ok(await page.locator('.social-page').count() <= 1);
    assert.equal(await page.locator('#screenFeed').evaluate(node => node.inert), false);
    await page.locator('#cards .thesis-body').first().click(); await page.waitForTimeout(300);
    await active().locator('.social-page-top .social-avatar').click(); await page.waitForTimeout(300);
    assert.equal(await active().getAttribute('data-social-page'), 'profile');
    await active().locator('.social-page-back').click(); await page.waitForTimeout(300);
    assert.equal(await active().getAttribute('data-social-page'), 'detail');
    await page.goForward(); await page.waitForTimeout(300);
    assert.equal(await active().getAttribute('data-social-page'), 'profile');
    await page.goBack(); await page.waitForTimeout(300);
    await active().locator('.social-page-back').click(); await page.waitForTimeout(300);
    for (const name of ['market','me','feed']) {
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      await page.locator('#tabBar [data-tab="' + name + '"]').click();
      await shot('dark-' + name);
    }
    assert.deepEqual(errors, []);
    console.log('Thesis audit: recent history, category geometry, profile assets/tabs, narrow layouts, interrupted transitions and history passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
