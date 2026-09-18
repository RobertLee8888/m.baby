const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://localhost:4173/mvp.html?feed=social';
const output = process.env.QA_OUTPUT || '/tmp/alva-thesis-qa';
const keys = ['P06','P01','S05','P04','S01','P07','P02','S02','S06','S04','S07'];
fs.mkdirSync(output, { recursive: true });

(async () => {
  const engine = process.env.QA_ENGINE === 'webkit' ? webkit : chromium;
  const browser = await engine.launch({ headless: true, ...(engine === chromium && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 2, hasTouch: true, colorScheme: 'light' });
  const page = await context.newPage(); page.setDefaultTimeout(8000);
  const errors = []; page.on('pageerror', e => errors.push(e.stack)); page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  const card = key => page.locator('#cards > .card').filter({ has: page.locator('[data-thesis="' + key + '"]') });
  const active = () => page.locator('.social-page:not([hidden]):not([inert])');
  const tab = name => page.locator('#tabBar [data-tab="' + name + '"]');
  async function settle() { await page.waitForTimeout(320); }
  async function shot(name) { await page.screenshot({ path: output + '/' + name + '.png' }); }
  async function assertBottomDividers(nodes, label) {
    const styles = await nodes.evaluateAll(items => items.map(n => {
      const probe = document.createElement('div');
      probe.style.boxShadow = 'inset 0 calc(-1 * var(--hair)) 0 var(--l12)';
      n.append(probe);
      const expected = getComputedStyle(probe).boxShadow;
      probe.remove();
      return { actual: getComputedStyle(n).boxShadow, expected };
    }));
    assert.ok(styles.length, label + ' must have cards');
    styles.forEach((style, index) => assert.equal(style.actual, style.expected, label + ' card ' + index));
  }
  try {
    await page.goto(base); await page.waitForTimeout(1900); await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.title(), 'Thesis · Alva prototypes');
    const order = await page.locator('#cards .thesis-content').evaluateAll(nodes => nodes.map(n => n.dataset.thesis));
    assert.deepEqual(order.slice().sort(), keys.slice().sort());
    assert.equal(await page.locator('#cards > .card').first().evaluate(n => n.classList.contains('portfolio-entry')), true);
    assert.equal(await page.locator('#cards .thesis-evidence').count(), 0);
    await tab('market').click(); await settle(); await tab('feed').click(); await settle();
    assert.deepEqual(await page.locator('#cards .thesis-content').evaluateAll(nodes => nodes.map(n => n.dataset.thesis)), order);
    assert.equal(await page.locator('.feed-filters').isVisible(), false);
    assert.equal(await page.locator('#cards .thesis-sources, #cards .social-analysis, #cards .social-engagement').count(), 0);
    assert.equal(await page.locator('#cards .thesis-bookmark').count(), keys.length);
    assert.equal(await page.locator('#cards .thesis-type').count(), keys.length);
    assert.equal(await page.locator('#cards .thesis-chart').count(), 17);
    assert.equal(await page.locator('#cards .social-ticker').count(), 17);
    assert.equal(await page.locator('#cards').getByText('Show more', { exact: true }).count(), 0);
    assert.equal(await page.locator('#cards').getByText(/Research summary|Source 1/).count(), 0);
    const preview = card('P01').locator('.thesis-content');
    await page.waitForFunction(() => document.querySelector('#cards [data-thesis="P01"]').dataset.previewReady === 'true');
    const before = await preview.locator('.thesis-body').textContent();
    assert.ok(before.includes('Baker frames this as a possible shift'));
    assert.ok(before.endsWith('\u2026'));
    assert.ok((await preview.evaluate(n => n.offsetHeight)) <= Number(await preview.getAttribute('data-preview-budget')) + 1);
    const v5Geometry = await card('P06').locator('.thesis-content').evaluate(n => {
      const style = getComputedStyle(n);
      const avatar = n.querySelector('.social-avatar').getBoundingClientRect();
      const body = getComputedStyle(n.querySelector('.thesis-body'));
      const type = n.querySelector('.thesis-type').getBoundingClientRect();
      const actions = n.querySelector('.thesis-actions').getBoundingClientRect();
      return { padding: style.padding, gap: style.gap, avatar: [avatar.width, avatar.height],
        body: [body.fontSize, body.lineHeight], type: type.height, actions: actions.height };
    });
    assert.deepEqual(v5Geometry, { padding: '12px 16px 2px', gap: '8px', avatar: [32, 32], body: ['14px', '22px'], type: 22, actions: 36 });
    for (const mode of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: mode });
      await assertBottomDividers(page.locator('#cards > .card'), mode + ' feed');
      await page.locator('#feedTrack').evaluate(n => n.classList.add('pulled'));
      await assertBottomDividers(page.locator('#cards > .card'), mode + ' pulled feed');
      await page.locator('#feedTrack').evaluate(n => n.classList.remove('pulled'));
    }
    await page.emulateMedia({ colorScheme: 'light' });
    assert.equal(await page.locator('#screenFeed .topbar').evaluate(n => n.classList.contains('has-scroll-divider')), false);
    await page.locator('#feed').evaluate(n => n.scrollTop = 20); await page.waitForTimeout(40);
    assert.equal(await page.locator('#screenFeed .topbar').evaluate(n => n.classList.contains('has-scroll-divider')), true);
    await page.locator('#feed').evaluate(n => n.scrollTop = 0); await page.waitForTimeout(40);
    await shot('home-393');
    for (const width of [320,360,430,393]) {
      await page.setViewportSize({width,height:759}); await settle();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.ok(await page.locator('#cards .thesis-content').evaluateAll(nodes => nodes.every(n => n.scrollWidth <= n.clientWidth + 1)));
      assert.ok(await preview.evaluate(n => n.offsetHeight <= Number(n.dataset.previewBudget) + 1));
      await shot('home-' + width);
    }
    for (const key of keys) {
      await card(key).scrollIntoViewIfNeeded(); await settle();
      assert.ok(await card(key).locator('img').evaluateAll(nodes => nodes.every(n => n.complete && n.naturalWidth > 0)));
      await shot('card-' + key);
      await card(key).locator('.thesis-body').click(); await settle();
      assert.equal(await active().getAttribute('data-post'), key);
      assert.ok(await active().locator('.thesis-source-link').count());
      await active().locator('.social-page-back').click(); await settle();
    }
    await card('P01').scrollIntoViewIfNeeded(); await settle();
    assert.equal(await preview.locator('.thesis-body').textContent(), before, 'scrolling must not change card content');
    const gallery = card('P01').locator('.thesis-charts');
    assert.equal(await gallery.evaluate(n => n.offsetWidth), 393);
    await gallery.evaluate(n => n.scrollLeft = 100); await shot('gallery-clips-at-screen');
    await preview.locator('.thesis-body').click(); await settle();
    assert.equal(await active().getAttribute('data-post'), 'P01');
    assert.equal(await active().locator('.thesis-update-row > .thesis-update-body .thesis-body p').count(), 1);
    assert.ok((await active().locator('.thesis-body').first().textContent()).endsWith('infrastructure providers.'));
    assert.equal(await page.locator('#tabBar').isVisible(), false);
    await shot('detail');
    await active().locator('.thesis-source-link').first().click(); await settle();
    assert.equal(await page.locator('#sheet').getAttribute('aria-hidden'), 'false');
    await page.locator('#sheetTop [aria-label="Close"]').click(); await settle();
    await active().locator('.social-detail-footer').getByRole('button', { name: 'Ask Alva', exact: true }).click(); await settle();
    assert.equal(await page.locator('.social-conversation').count(), 1);
    await page.locator('#sheetTop [aria-label="Close"]').click(); await settle();
    await active().locator('.social-page-back').click(); await settle();
    assert.equal(await page.locator('#tabBar').isVisible(), true);
    await card('P06').locator('.thesis-bookmark').click();
    await tab('me').click(); await settle();
    await shot('me');
    const me = page.locator('.thesis-me');
    const meScroll = me.locator('.thesis-root-scroll');
    assert.equal(await me.getByText("Today's P&L", { exact: true }).count(), 0);
    assert.equal(await me.getByText('Allocation', { exact: true }).count(), 1);
    assert.equal(await me.locator('.thesis-allocation-bar > i').count(), 3);
    const profileGeometry = await me.evaluate(node => {
      const header = node.querySelector('.thesis-profile-header').getBoundingClientRect();
      const privateSection = node.querySelector('.thesis-private').getBoundingClientRect();
      const account = node.querySelector('.thesis-account').getBoundingClientRect();
      const usage = node.querySelector('.thesis-usage').getBoundingClientRect();
      const tabs = node.querySelector('.thesis-profile-pinned > .thesis-tabs').getBoundingClientRect();
      const allocation = node.querySelector('.thesis-allocation-bar').getBoundingClientRect();
      const segments = [...node.querySelectorAll('.thesis-allocation-bar > i')].map(item => item.getBoundingClientRect().width);
      return { header: header.height, privateSection: privateSection.height, account: account.height, gap: usage.top - account.bottom,
        usage: usage.height, tabsTop: tabs.top - header.top, allocation: allocation.width, segments };
    });
    assert.deepEqual({ ...profileGeometry, segments: undefined }, { header: 196, privateSection: 182, account: 74, gap: 8, usage: 68, tabsTop: 378, allocation: 160, segments: undefined });
    assert.ok(profileGeometry.segments[0] > profileGeometry.segments[2] && profileGeometry.segments[2] > profileGeometry.segments[1]);
    await meScroll.evaluate(n => n.scrollTop = 20); await page.waitForTimeout(40);
    assert.equal(await me.locator('.thesis-me-top').evaluate(n => n.classList.contains('has-scroll-divider')), true);
    await meScroll.evaluate(n => n.scrollTop = n.scrollHeight); await page.waitForTimeout(40);
    assert.equal(await me.locator('.thesis-me-top').evaluate(n => n.classList.contains('has-scroll-divider')), false);
    await meScroll.evaluate(n => n.scrollTop = 0);
    await me.getByRole('tab', {name:'Bookmarks',exact:true}).click();
    assert.ok(await me.locator('.thesis-compact[data-thesis="P06"]').count());
    assert.equal(await me.locator('.thesis-compact .thesis-chart,.thesis-compact .thesis-actions').count(),0);
    await shot('bookmarks');
    for (const name of ['Tickers','Playbooks','Automations','Theses']) { await me.getByRole('tab',{name,exact:true}).click(); await settle(); await shot('me-'+name.toLowerCase()); }
    await me.getByRole('tab',{name:'Archived',exact:true}).click(); assert.ok(await me.getByText('No archived theses').isVisible());
    await me.getByRole('button',{name:'Followers',exact:true}).click(); await settle();
    assert.equal(await active().locator('[data-follow-person="Chamath Palihapitiya"]').count(),0);
    await active().getByRole('tab',{name:'Following',exact:true}).click();
    assert.equal(await active().locator('[data-follow-person="Chamath Palihapitiya"]').count(),1);
    await shot('following'); await active().locator('.social-page-back').click(); await settle();
    await tab('market').click(); await settle(); await shot('search');
    assert.equal(await page.locator('.thesis-person-card').count(),8);
    const searchRoot = page.locator('.thesis-search');
    await searchRoot.locator('.thesis-root-scroll').evaluate(n => n.scrollTop = 20); await page.waitForTimeout(40);
    assert.equal(await searchRoot.locator('.thesis-root-title').evaluate(n => n.classList.contains('has-scroll-divider')), true);
    await searchRoot.locator('.thesis-root-scroll').evaluate(n => n.scrollTop = 0);
    const search = page.getByRole('searchbox',{name:'Search tickers, people'});
    await search.fill('Microsoft'); await settle(); await shot('search-microsoft');
    assert.equal(await page.locator('.thesis-result-list .thesis-stock-row').count(),1);
    assert.equal(await page.locator('.thesis-search-results .thesis-person-row').count(),1);
    await searchRoot.getByRole('tab',{name:'People',exact:true}).click(); await settle();
    await page.locator('.thesis-search-results').getByRole('button',{name:'Satya Nadella profile'}).click(); await settle();
    assert.ok(await active().locator('.thesis-profile-info').getByText('Satya Nadella').isVisible());
    await shot('satya-profile'); await active().locator('.social-page-back').click(); await settle();
    assert.equal(await search.inputValue(),'Microsoft');
    await search.fill('Gavin'); await settle(); assert.equal(await page.locator('.thesis-search-results .thesis-person-row').count(),1);
    await search.fill('no-matches-123'); await settle(); assert.ok(await searchRoot.locator('.thesis-tab-panel[aria-hidden="false"]').getByText('No results found',{exact:true}).isVisible()); await shot('search-empty');
    await page.getByRole('button',{name:'Clear search',exact:true}).click(); await settle();
    await page.locator('.thesis-search').getByRole('button',{name:'Clear all',exact:true}).click(); await shot('clear-confirm');
    await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click(); assert.ok(await page.locator('.thesis-recent').isVisible());
    await page.locator('.thesis-search').getByRole('button',{name:'Clear all',exact:true}).click();
    await page.getByRole('dialog').getByRole('button',{name:'Clear all',exact:true}).click(); assert.equal(await page.locator('.thesis-recent').count(),0);
    await page.locator('.thesis-person-card').filter({hasText:'Chamath'}).click(); await settle();
    assert.equal(await active().getByRole('button',{name:'Following',exact:true}).count(),0);
    assert.equal(await active().locator('.thesis-profile-note .ic').count(),1); await shot('chamath-profile');
    await active().locator('.social-page-back').click(); await settle();
    await tab('chat').click(); await settle(); assert.ok(await page.locator('#screenChat').evaluate(n=>n.classList.contains('current')));
    await tab('feed').click(); await settle(); await page.locator('.thesis-create').click(); await settle(); assert.ok(await page.locator('#screenChat').evaluate(n=>n.classList.contains('current')));
    await tab('me').click(); await settle();
    await me.locator('.thesis-root-scroll').evaluate(n => n.scrollTop = 300);
    await tab('me').click(); await settle();
    assert.equal(await me.locator('.thesis-root-scroll').evaluate(n => n.scrollTop), 0);
    const shared = new URL(base); shared.searchParams.set('profile', 'Dario Amodei');
    await page.goto(shared.href); await page.waitForTimeout(1900);
    assert.ok(await active().locator('.thesis-profile-info').getByText('Dario Amodei').isVisible());
    await page.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.sharedProfile = data; } }));
    await active().getByRole('button', { name: 'Share profile', exact: true }).click();
    assert.equal(new URL(await page.evaluate(() => window.sharedProfile.url)).searchParams.get('profile'), 'Dario Amodei');
    assert.deepEqual(errors, []);
    console.log('Thesis V5 cards, reference content, navigation, search, profile and responsive checks passed.');
  } finally { await browser.close(); }
})();
