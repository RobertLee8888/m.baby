const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.BROWSER || 'chromium';
const base = process.env.DEMO_URL || 'http://localhost:4173/mvp.html?feed=social';
const output = process.env.QA_OUTPUT || '/tmp/alva-social-pages-' + engine;
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await playwright[engine].launch({ headless: true, ...(engine === 'chromium' && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 393, height: 759 }, isMobile: true, hasTouch: true, colorScheme: 'light' });
  page.setDefaultTimeout(10000);
  const errors = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  const active = () => page.locator('.social-page:not([hidden]):not([inert])');
  const feedCard = key => page.locator('#cards > [data-card-id="source-' + key + '"]');
  async function ready(params = {}) {
    const url = new URL(base);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    await page.goto(url.href);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.querySelector('#startupLoader').hidden);
    await page.waitForTimeout(300);
  }
  async function back() {
    await active().locator('.social-page-back').click();
    await page.waitForTimeout(300);
  }
  async function mode(label) {
    await active().getByRole('tab', { name: label, exact: true }).click();
    await page.waitForTimeout(80);
  }
  async function shot(label) { await page.screenshot({ path: path.join(output, label + '.png') }); }
  async function bounds() {
    return active().evaluate(node => {
      const rect = element => { const b = element.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, width: b.width }; };
      return { page: rect(node), top: rect(node.querySelector('header')), scroll: rect(node.querySelector('.social-page-scroll')), footer: node.querySelector('.social-detail-footer') ? rect(node.querySelector('.social-detail-footer')) : null, tab: rect(document.getElementById('tabBar')), overflow: node.scrollWidth > node.clientWidth + 1 };
    });
  }
  try {
    await ready();
    await feedCard('P06').locator('.quote-body').scrollIntoViewIfNeeded();
    const originalScroll = await page.locator('#feed').evaluate(n => n.scrollTop);
    await feedCard('P06').locator('.quote-body').click();
    await page.waitForTimeout(300);
    assert.equal(await active().getAttribute('data-post'), 'P06');
    await back();
    assert.equal(await page.locator('#feed').evaluate(n => n.scrollTop), originalScroll);
    assert.equal(await page.locator('.screen.current').evaluate(n => n.inert), false);
    checks.push('back preserves feed position and focusability');

    await ready({ post: 'P01' });
    assert.equal(await active().getAttribute('data-post'), 'P01');
    await shot('detail');
    const compactHeight = await active().locator('.social-article').evaluate(n => n.offsetHeight);
    assert.equal(compactHeight, 66);
    await active().getByRole('button', { name: 'Show more', exact: true }).click();
    await page.waitForTimeout(250);
    assert.equal(await active().locator('.social-article p').count(), 4);
    assert.ok(await active().locator('.social-article').evaluate(n => n.offsetHeight) > compactHeight);
    await active().getByRole('button', { name: 'Show less', exact: true }).click();
    await page.waitForTimeout(250);
    assert.equal(await active().locator('.social-article').evaluate(n => n.offsetHeight), compactHeight);
    await active().getByRole('button', { name: 'Bookmark thesis', exact: true }).click();
    assert.equal(await feedCard('P01').getByRole('button', { name: 'Bookmark', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await active().locator('.social-bookmarked').first().getAttribute('aria-pressed'), 'true');
    await active().getByRole('button', { name: 'Like', exact: true }).click();
    assert.equal(await feedCard('P01').getByRole('button', { name: 'Like', exact: true }).textContent(), '327');
    checks.push('expand/collapse and shared like/bookmark state');

    await active().locator('.social-page-scroll').evaluate(n => { n.scrollTop = n.scrollHeight; });
    await shot('signals');
    assert.equal(await active().locator('.social-signal').count(), 3);
    for (const label of ['Related theses', 'Updates', 'Signals']) {
      await mode(label);
      const gap = await active().evaluate(n => n.querySelector('.social-tabs').getBoundingClientRect().top - n.querySelector('.social-page-scroll').getBoundingClientRect().top);
      assert.ok(Math.abs(gap) < 1, label + ' stays pinned: ' + gap);
      if (label !== 'Signals') {
        assert.equal(await active().locator('.social-detail-panel .card').count(), 2);
        const firstItemOffset = await active().evaluate(n => n.querySelector('.social-detail-panel .card').getBoundingClientRect().top - n.querySelector('.social-tabs').getBoundingClientRect().bottom);
        assert.ok(Math.abs(firstItemOffset) < 1, label + ' starts with the first complete card');
      }
      await shot(label.toLowerCase().replaceAll(' ', '-'));
      const b = await bounds();
      assert.equal(b.footer.bottom, b.tab.top);
      assert.equal(b.scroll.bottom, b.footer.top);
    }
    await mode('Related theses');
    const related = active().locator('[data-card-id="social-related-chamath"]');
    await related.getByRole('button', { name: 'Bookmark', exact: true }).click();
    await related.getByRole('button', { name: 'Chamath Palihapitiya profile', exact: true }).first().click();
    await page.waitForTimeout(300);
    assert.equal(await active().getAttribute('data-profile'), 'chamath');
    assert.ok((await active().locator('.social-profile-disclaimer').textContent()).includes('Not affiliated'));
    await shot('visitor');
    await active().getByRole('button', { name: 'Show more', exact: true }).click();
    assert.ok(await page.locator('#sheetBody').textContent());
    await page.locator('#sheetTop [aria-label="Close"]').click();
    await page.waitForTimeout(450);
    await back();
    assert.equal(await active().getAttribute('data-post'), 'P01');
    assert.equal(await active().getByRole('tab', { name: 'Related theses', exact: true }).getAttribute('aria-selected'), 'true');
    await page.goForward(); await page.waitForTimeout(300);
    assert.equal(await active().getAttribute('data-profile'), 'chamath');
    checks.push('detail tabs, fixed actions, avatar navigation and browser forward');

    await ready({ profile: 'owner' });
    await shot('owner');
    assert.equal(await active().locator('.social-profile-list .card').count(), 2);
    assert.equal(await active().locator('.social-profile-list .social-source-link').count(), 0);
    assert.equal(await active().locator('.social-profile-list .card').first().evaluate(n => n.offsetHeight), 292);
    await mode('Followed'); await shot('followed');
    assert.equal(await active().locator('.social-follow-stock small').first().textContent(), 'Alphabet Inc.');
    await active().getByRole('button', { name: 'Unfollow NVDA', exact: true }).click();
    assert.equal(await active().getByRole('button', { name: 'Unfollow NVDA', exact: true }).count(), 0);
    assert.equal(await page.locator('#filter-NVDA').count(), 0);
    await mode('Bookmark'); await shot('bookmarks');
    assert.equal(await active().locator('.social-profile-list .card').count(), 4);
    assert.equal(await active().locator('.social-profile-list .social-source-link').count(), 0);
    await active().locator('[data-card-id="social-related-chamath"]').getByRole('button', { name: 'Bookmark', exact: true }).click();
    await mode('Thesis'); await mode('Bookmark');
    assert.equal(await active().locator('.social-profile-list .card').count(), 3);
    await active().locator('.social-profile-filters').getByRole('tab', { name: 'NVDA', exact: true }).click();
    assert.equal(await active().locator('.social-profile-list .card').count(), 1);
    await ready({ profile: 'owner' }); await mode('Bookmark');
    assert.equal(await active().locator('.social-profile-list .card').count(), 3);
    checks.push('profile states, filtering, unfollow and persistent bookmarks');

    await page.evaluate(() => { Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.profileShare = data; } }); });
    await active().getByRole('button', { name: 'Share profile', exact: true }).click();
    const share = await page.evaluate(() => window.profileShare);
    assert.equal(new URL(share.url).searchParams.get('profile'), 'owner');
    await ready({ post: 'related-chamath' });
    assert.equal(await active().getAttribute('data-post'), 'related-chamath');
    await ready({ profile: 'maya' });
    assert.equal(await active().locator('.social-profile-name h2').textContent(), 'Maya Reynolds');
    assert.equal(await active().locator('.social-pro').textContent(), 'Pro');
    checks.push('shareable detail and profile routes');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [320, 360, 393, 430]) {
      await page.setViewportSize({ width, height: 759 });
      for (const params of [{ post: 'P01' }, { profile: 'owner' }, { profile: 'chamath' }, { profile: 'maya' }]) {
        await ready(params);
        const b = await bounds();
        assert.equal(b.overflow, false);
        assert.ok(Math.abs(b.page.width - width) < 1);
        assert.ok(Math.abs(b.page.bottom - b.tab.top) < 1);
        assert.ok(await active().locator('img').evaluateAll(ns => ns.every(n => n.complete && n.naturalWidth)));
        assert.ok(await active().locator('.social-name, .quote-body, .social-reading, .social-profile-name, .social-profile-disclaimer').evaluateAll(ns => ns.every(n => n.scrollWidth <= n.clientWidth + 1)));
        await shot(width + '-' + (params.post || params.profile));
      }
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await ready({ post: 'P01' }); await shot('dark-detail');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ engine, checks, responsiveWidths: [320, 360, 393, 430], errors, output }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
