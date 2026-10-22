const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://127.0.0.1:4177/';

(async () => {
  const engine = process.env.QA_ENGINE === 'webkit' ? webkit : chromium;
  const browser = await engine.launch({ headless: true, ...(engine === chromium && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 393, height: 759 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  const settled = () => page.waitForFunction(() => !document.querySelector('[data-transition="opening"], [data-transition="closing"]'));
  const back = async () => { await page.evaluate(() => history.back()); await settled(); };
  // Counts independently recorded from the supplied Chrome reference.
  const sources = [4, 1, 2, 1, 3, 6, 3, 2, 1, 4, 4];
  const versions = [4, 1, 2, 1, 3, 4, 3, 2, 1, 4, 4];
  try {
    await page.goto(base + 'thesis-motion.html');
    await page.evaluate(() => document.fonts.ready);
    const posts = page.locator('#feedItems > .motion-post');
    assert.equal(await posts.count(), 11);
    assert.equal(await posts.first().locator('.motion-name').innerText(), 'Tom Lee');
    assert.equal(await posts.last().locator('.motion-name').innerText(), 'Gavin Baker');
    assert.equal(await posts.locator('.motion-save span:not(.motion-icon)').count(), 0, 'no invented bookmark totals');
    for (let index = 0; index < 11; index++) {
      const card = posts.nth(index);
      const copy = await card.locator('.motion-body').innerText();
      const name = await card.locator('.motion-name').innerText();
      await card.locator('.motion-open').click(); await settled();
      assert.equal(await page.locator('#detail .motion-timeline > .motion-body').innerText(), copy);
      assert.equal(await page.locator('#detail .motion-detail-header .motion-name').innerText(), name);
      assert.equal(await page.locator('#detail .motion-source-links a').count(), sources[index]);
      assert.equal(await page.locator('#detail .motion-history').innerText(), `View all ${versions[index]} update${versions[index] === 1 ? '' : 's'}`);
      const links = await page.locator('#detail .motion-source-links a').evaluateAll(nodes => nodes.map(node => node.href));
      assert.ok(links.every(url => url.startsWith('https://')));
      if (index === 0) {
        assert.ok(links.every(url => new URL(url).hostname === 'fundstrat.com'));
        assert.match(await page.locator('#detail .motion-proxy-note').innerText(), /Not specified by the author/);
        assert.match(await page.locator('#detail .motion-signal-empty').innerText(), /Not run yet/);
      }
      await back();
    }

    for (const [id, count] of [['tom-lee', 1], ['raoul-pal', 3], ['jim-rogers', 1], ['chamath', 2], ['cathie-wood', 3], ['gavin', 1]]) {
      await page.locator(`#feed [data-person="${id}"] .motion-person-link`).first().click(); await settled();
      assert.equal(await page.locator('#profile .motion-post').count(), count);
      const authors = await page.locator('#profile .motion-post .motion-identity').evaluateAll(nodes => nodes.map(node => node.dataset.person));
      assert.ok(authors.every(author => author === id), 'profile contains only its own author');
      await back();
    }

    await page.locator('#feed [data-post="raoul-pal-nvda"] [data-ticker="NVDA"]').click(); await settled();
    assert.equal(await page.locator('.motion-ticker-page .motion-post').count(), 4);
    await page.locator('.motion-ticker-page [data-post="chamath-nvda"] .motion-open').click(); await settled();
    const detail = page.locator('.motion-detail[data-transition="open"]').last();
    await detail.getByRole('tab', { name: 'Related thesis', exact: true }).click();
    await detail.locator('.motion-related-panel [data-post="gavin-nvda"] .motion-open').click(); await settled();
    assert.equal(await page.locator('.motion-detail[data-transition="open"]').count(), 2);
    assert.equal(await page.locator('.motion-detail[data-transition="open"]').last().locator('.motion-detail-header .motion-name').innerText(), 'Gavin Baker');
    await back();
    assert.equal(await detail.getByRole('tab', { name: 'Related thesis', exact: true }).getAttribute('aria-selected'), 'true');
    await back(); await back();
    assert.equal(await page.locator('#feed').getAttribute('aria-hidden'), 'false');
    await page.evaluate(async () => { await Promise.all([...document.images].map(image => image.decode())); });
    assert.deepEqual(errors, []);
    console.log('PASS: all 11 reference theses, correct citations/version counts, real author groups, NVDA aggregation, nested related navigation and local assets.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
