const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = process.env.DEMO_URL || 'http://127.0.0.1:4174/mvp.html?feed=social';
const output = process.env.QA_OUTPUT || '/tmp/alva-thesis-navigation-settings';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const engine = process.env.QA_ENGINE === 'webkit' ? webkit : chromium;
  const browser = await engine.launch({ headless: true, ...(engine === chromium && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 2, hasTouch: true });
  const page = await context.newPage();
  page.setDefaultTimeout(9000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  const active = () => page.locator('.social-page:not([hidden]):not([inert])');
  const tab = name => page.locator('#tabBar [data-tab="' + name + '"]');
  const settle = () => page.waitForTimeout(340);
  const shot = name => page.screenshot({ path: output + '/' + name + '.png' });

  async function ready(url = base) {
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.querySelector('#startupLoader').hidden);
    await settle();
  }

  async function assertSearchChrome() {
    const root = page.locator('.thesis-search');
    const top = root.locator('.thesis-root-title');
    const scroll = root.locator('.thesis-root-scroll');
    const form = root.locator('.thesis-search-entry');
    await scroll.evaluate(node => { node.scrollTop = 0; });
    assert.equal(Math.round(await top.evaluate(node => node.getBoundingClientRect().height)), 58);
    assert.equal(Math.round(await form.evaluate(node => node.getBoundingClientRect().top)), 58);
    assert.equal(await top.evaluate(node => node.classList.contains('has-scroll-divider')), false);
    await scroll.evaluate(node => { node.scrollTop = 12; });
    await page.waitForTimeout(40);
    assert.ok(Math.abs((await top.evaluate(node => node.getBoundingClientRect().height)) - 46) < 1);
    assert.ok((await top.locator('h1').evaluate(node => Number.parseFloat(getComputedStyle(node).opacity))) > 0);
    await scroll.evaluate(node => { node.scrollTop = 29; });
    await page.waitForTimeout(40);
    assert.ok((await top.locator('h1').evaluate(node => Number.parseFloat(getComputedStyle(node).opacity))) < 0.1);
    await scroll.evaluate(node => { node.scrollTop = 58; });
    await page.waitForTimeout(40);
    assert.ok((await top.evaluate(node => node.getBoundingClientRect().height)) < 1);
    assert.equal(Math.round(await form.evaluate(node => node.getBoundingClientRect().top)), 0);
    assert.equal(await form.evaluate(node => node.classList.contains('is-pinned')), true);
    assert.equal(await top.evaluate(node => node.classList.contains('has-scroll-divider')), false);
    await scroll.evaluate(node => { node.scrollTop = 140; });
    await page.waitForTimeout(40);
    assert.equal(Math.round(await form.evaluate(node => node.getBoundingClientRect().top)), 0);
  }

  async function assertMeChrome() {
    const root = page.locator('.thesis-me');
    const top = root.locator('.thesis-me-top');
    const scroll = root.locator('.thesis-root-scroll');
    const title = top.locator('h1');
    const compact = top.locator('.thesis-me-collapsed');
    await scroll.evaluate(node => { node.scrollTop = 0; });
    assert.equal(Math.round(await top.evaluate(node => node.getBoundingClientRect().height)), 58);
    assert.equal(await top.evaluate(node => node.classList.contains('has-scroll-divider')), false);
    assert.equal(await compact.getAttribute('aria-hidden'), 'true');
    await scroll.evaluate(node => { node.scrollTop = 29; });
    await page.waitForTimeout(40);
    assert.equal(Math.round(await top.evaluate(node => node.getBoundingClientRect().height)), 58);
    assert.ok((await title.evaluate(node => Number.parseFloat(getComputedStyle(node).opacity))) < 0.1);
    assert.equal(await top.evaluate(node => node.classList.contains('has-scroll-divider')), true);
    await scroll.evaluate(node => { node.scrollTop = 76; });
    await page.waitForTimeout(100);
    assert.equal(Math.round(await top.evaluate(node => node.getBoundingClientRect().height)), 58);
    assert.equal(await compact.getAttribute('aria-hidden'), 'false');
    assert.ok((await compact.boundingBox()).y >= 10);
  }

  async function assertFeedChrome() {
    const top = page.locator('#screenFeed .topbar');
    await tab('feed').click(); await settle();
    assert.equal(await top.evaluate(node => node.classList.contains('has-scroll-divider')), true);
    await page.locator('#feed').evaluate(node => { node.scrollTop = 58; });
    await page.waitForTimeout(40);
    assert.equal(await top.evaluate(node => node.classList.contains('has-scroll-divider')), true);
  }

  try {
    const detailUrl = new URL(base); detailUrl.searchParams.set('post', 'P01');
    await ready(detailUrl.href);
    const detail = active();
    const gallery = detail.locator('.thesis-update-row .thesis-charts').first();
    const galleryBox = await gallery.boundingBox();
    const firstChart = gallery.locator('.thesis-chart').first();
    assert.deepEqual([Math.round(galleryBox.x), Math.round(galleryBox.width)], [0, 393]);
    assert.equal(Math.round((await firstChart.boundingBox()).x), 48);
    await gallery.evaluate(node => { node.scrollLeft = 100; });
    assert.ok((await firstChart.boundingBox()).x < 0);
    const covered = await detail.evaluate(node => {
      const chart = node.querySelector('.thesis-chart').getBoundingClientRect();
      return document.elementFromPoint(24, chart.top + chart.height / 2)?.closest('.thesis-chart') !== null;
    });
    assert.equal(covered, true, 'scrolled media must paint above the timeline rail');

    const track = detail.locator('.social-detail-panel .thesis-tab-track');
    const nav = detail.locator('.social-detail-tabs > .thesis-tabs');
    const pagerFloor = await detail.evaluate(node => ({
      viewport: node.querySelector('.social-page-scroll').clientHeight,
      nav: node.querySelector('.social-detail-tabs > .thesis-tabs').offsetHeight,
      pager: node.querySelector('.social-detail-panel').offsetHeight,
    }));
    assert.ok(pagerFloor.pager >= pagerFloor.viewport - pagerFloor.nav);
    await detail.getByRole('tab', { name: 'Related theses' }).click();
    await page.waitForTimeout(70);
    const moving = await track.evaluate(node => ({ transform: getComputedStyle(node).transform, animations: node.getAnimations().length }));
    assert.ok(moving.animations > 0 || !moving.transform.includes('-393'));
    await settle();
    assert.equal(await detail.getByRole('tab', { name: 'Related theses' }).getAttribute('aria-selected'), 'true');
    assert.ok(Math.abs(await track.evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m41) + 393) < 1);
    await shot('detail-related');

    await detail.locator('.social-page-scroll').evaluate(node => { node.scrollTop = 0; });
    await detail.getByRole('button', { name: 'View all 6 updates' }).click();
    await settle();
    const updateMedia = active().locator('[data-version="P01-jul8"] .thesis-media');
    await updateMedia.scrollIntoViewIfNeeded();
    const mediaBox = await updateMedia.boundingBox();
    assert.deepEqual([Math.round(mediaBox.x), Math.round(mediaBox.width)], [0, 393]);
    assert.equal(Math.round((await updateMedia.locator('.thesis-media-item').first().boundingBox()).x), 48);
    await updateMedia.evaluate(node => { node.scrollLeft = 100; });
    assert.ok((await updateMedia.locator('.thesis-media-item').first().boundingBox()).x < 0);
    await shot('all-updates-media');

    await page.goto(base); await page.evaluate(() => document.fonts.ready); await settle();
    await tab('market').click(); await settle();
    await assertSearchChrome();
    const searchRoot = page.locator('.thesis-search');
    await searchRoot.locator('.thesis-root-scroll').evaluate(node => { node.scrollTop = 0; });
    await searchRoot.getByRole('searchbox', { name: 'Search tickers, people' }).fill('Microsoft');
    await page.waitForTimeout(180);
    assert.deepEqual(await searchRoot.locator(':scope > .thesis-root-scroll > .thesis-search-panel > .thesis-tabs > .thesis-tab').allTextContents(), ['Tickers', 'People']);
    assert.equal(await searchRoot.locator(':scope > .thesis-root-scroll > .thesis-search-panel > .thesis-tabs').getByRole('tab', { name: 'All', exact: true }).count(), 0);
    const searchTrack = searchRoot.locator('.thesis-search-pages .thesis-tab-track');
    await searchRoot.getByRole('tab', { name: 'People', exact: true }).click();
    await page.waitForTimeout(70);
    assert.ok((await searchTrack.evaluate(node => node.getAnimations().length)) > 0);
    await settle();
    assert.ok(await searchRoot.getByRole('button', { name: 'Satya Nadella profile' }).isVisible());
    await shot('search-people');

    await assertFeedChrome();
    await tab('me').click(); await settle();
    await assertMeChrome();
    const me = page.locator('.thesis-me');
    assert.deepEqual(await me.locator('.thesis-me-top').evaluate(node => {
      const box = element => {
        const value = element.getBoundingClientRect();
        return [Math.round(value.x), Math.round(value.y), Math.round(value.width), Math.round(value.height)];
      };
      const buttons = [...node.querySelectorAll('.social-page-tool')];
      return {
        buttons: buttons.map(box),
        icons: buttons.map(button => box(button.querySelector('.ic'))),
        gaps: buttons.slice(1).map((button, index) => Math.round(button.getBoundingClientRect().left - buttons[index].getBoundingClientRect().right)),
        right: Math.round(innerWidth - buttons.at(-1).getBoundingClientRect().right),
      };
    }), {
      buttons: [[285, 23, 20, 20], [321, 23, 20, 20], [357, 23, 20, 20]],
      icons: [[285, 23, 20, 20], [321, 23, 20, 20], [357, 23, 20, 20]],
      gaps: [16, 16], right: 16,
    });
    assert.equal(await page.evaluate(() => document.elementFromPoint(279, 31)?.closest('button')?.ariaLabel), 'Edit profile');
    const meScroll = me.locator('.thesis-root-scroll');
    await meScroll.evaluate(node => { node.scrollTop = 0; });
    const before = await meScroll.evaluate(node => node.scrollHeight);
    const meTrack = me.locator('.thesis-profile-pages .thesis-tab-track');
    await me.getByRole('tab', { name: 'Playbooks', exact: true }).click();
    await page.waitForTimeout(70);
    assert.ok((await meTrack.evaluate(node => node.getAnimations().length)) > 0);
    await settle();
    const after = await meScroll.evaluate(node => node.scrollHeight);
    assert.ok(Math.abs(after - before) <= 1, 'Me tab height must remain stable');
    assert.ok((await me.locator('.thesis-profile-pages').evaluate(node => node.offsetHeight)) >= (await meScroll.evaluate(node => node.clientHeight)) - 80);
    await me.getByRole('button', { name: 'Settings', exact: true }).click();
    await settle();
    assert.equal(await active().getAttribute('data-social-page'), 'settings');
    await page.goBack(); await settle();

    const ownerUrl = new URL(base); ownerUrl.searchParams.set('profile', 'owner');
    await ready(ownerUrl.href);
    const ownerProfile = active();
    assert.equal(await ownerProfile.getAttribute('data-profile'), 'owner');
    assert.deepEqual(await ownerProfile.locator('.social-page-top').evaluate(node => {
      const box = element => {
        const value = element.getBoundingClientRect();
        return [Math.round(value.x), Math.round(value.y), Math.round(value.width), Math.round(value.height)];
      };
      const buttons = [...node.querySelectorAll('.social-page-tool')];
      return {
        buttons: buttons.map(box),
        icons: buttons.map(button => box(button.querySelector('.ic'))),
        gaps: buttons.slice(1).map((button, index) => Math.round(button.getBoundingClientRect().left - buttons[index].getBoundingClientRect().right)),
        right: Math.round(innerWidth - buttons.at(-1).getBoundingClientRect().right),
      };
    }), {
      buttons: [[285, 10, 20, 36], [321, 10, 20, 36], [357, 10, 20, 36]],
      icons: [[285, 18, 20, 20], [321, 18, 20, 20], [357, 18, 20, 20]],
      gaps: [16, 16], right: 16,
    });
    assert.equal(await page.evaluate(() => document.elementFromPoint(279, 28)?.closest('button')?.ariaLabel), 'Edit profile');
    await ownerProfile.getByRole('button', { name: 'Settings', exact: true }).click();
    await settle();
    const settings = active();
    assert.equal(await settings.getAttribute('data-social-page'), 'settings');
    assert.deepEqual(await settings.locator('.thesis-settings-tabs > .thesis-tab').allTextContents(), ['Account', 'Usage', 'Portfolio', 'Alva Agent']);
    assert.ok(await settings.getByText('Sign-in methods', { exact: true }).isVisible());
    await shot('settings-account');
    for (const [name, marker, filename] of [
      ['Usage', 'Credits History', 'settings-usage'],
      ['Portfolio', 'Broker Connections', 'settings-portfolio'],
      ['Alva Agent', 'Connected App', 'settings-agent'],
    ]) {
      await settings.getByRole('tab', { name, exact: true }).click();
      await settle();
      assert.ok(await settings.getByText(marker, { exact: true }).isVisible());
      await shot(filename);
    }
    for (const width of [320, 360, 430]) {
      await page.setViewportSize({ width, height: 759 }); await settle();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.ok(await settings.evaluate(node => node.scrollWidth <= node.clientWidth));
    }
    await page.setViewportSize({ width: 393, height: 759 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await settings.getByRole('tab', { name: 'Account', exact: true }).click(); await settle();
    await shot('settings-account-dark');
    await settings.getByRole('tab', { name: 'Alva Agent', exact: true }).click(); await settle();
    await shot('settings-agent-dark');
    assert.deepEqual(errors, []);
    console.log('Thesis detail media, tab motion, scroll chrome, stable profile tabs and Settings checks passed.');
  } finally {
    await browser.close();
  }
})();
