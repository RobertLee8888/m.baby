/* Boundary audit. Uses the same environment variables as mvp-browser.cjs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://localhost:4173/mvp.html';
const output = process.env.QA_OUTPUT || '/tmp/alva-mvp-audit';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const errors = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url() + ': ' + response.status()); });
  const pause = ms => page.waitForTimeout(ms);
  const ready = async () => { await page.goto(base); await page.evaluate(() => document.fonts.ready); await pause(1700); };
  const openFollowing = async () => { await page.locator('#allTickers').click(); await pause(320); };
  const closeSheet = async () => { await page.locator('#sheetTop button[aria-label="Close"]').click(); await pause(450); };
  const reset = async () => { await page.locator('#restartButton').evaluate(node => node.click()); await pause(1700); };
  try {
    await ready();
    const initialCount = await page.locator('#cards > .card').count();

    for (const mode of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: mode });
      await pause(350);
      const styles = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        const resolve = name => {
          const probe = document.createElement('i');
          probe.style.color = 'var(' + name + ')';
          document.body.append(probe);
          const value = getComputedStyle(probe).color;
          probe.remove();
          return value;
        };
        return {
          active: getComputedStyle(document.querySelector('.feed-filter.is-active')).backgroundColor,
          br10: resolve('--br10'),
          arrow: getComputedStyle(document.querySelector('#allTickers')).boxShadow,
          arrowInk: getComputedStyle(document.querySelector('#allTickers')).color,
          n5: resolve('--n5'),
          placeholder: getComputedStyle(document.querySelector('.following-search input'), '::placeholder').color,
          n3: resolve('--n3'),
          search: getComputedStyle(document.querySelector('.following-search')).backgroundColor,
          input: resolve('--module-data-entry'),
          sheet: getComputedStyle(document.querySelector('#sheet')).backgroundColor,
          dialog: resolve('--module-dialog'),
          radius: getComputedStyle(document.querySelector('.quote')).borderRadius,
          radiusToken: root.getPropertyValue('--radius-ct-l').trim(),
        };
      });
      assert.equal(styles.active, styles.br10);
      assert.ok(styles.arrow.includes('inset') && !styles.arrow.includes('15px'));
      assert.equal(styles.arrowInk, styles.n5);
      assert.equal(styles.placeholder, styles.n3);
      assert.equal(styles.search, styles.input);
      assert.equal(styles.sheet, styles.dialog);
    assert.equal(styles.radius, styles.radiusToken);
      checks.push('semantic variables: ' + mode);
    }
    await page.emulateMedia({ colorScheme: 'light' });
    // Prove these are role bindings, not merely coincidentally equal colors.
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--br10', 'rgb(12, 34, 56)');
      document.documentElement.style.setProperty('--module-data-entry', 'rgb(45, 67, 89)');
    });
    await pause(350);
    assert.equal(await page.locator('.feed-filter.is-active').evaluate(n => getComputedStyle(n).backgroundColor), 'rgb(12, 34, 56)');
    assert.equal(await page.locator('.following-search').evaluate(n => getComputedStyle(n).backgroundColor), 'rgb(45, 67, 89)');
    await page.evaluate(() => { document.documentElement.style.removeProperty('--br10'); document.documentElement.style.removeProperty('--module-data-entry'); });

    for (const origin of ['feed', 'me']) {
      await page.locator('.tab[data-tab="' + origin + '"]').click();
      await pause(380);
      await page.locator(origin === 'feed' ? '#allTickers' : '#followingRow').click();
      await pause(320);
      await page.reload();
      await page.evaluate(() => document.fonts.ready);
      await pause(1700);
      assert.equal(await page.locator('.following-page').getAttribute('aria-hidden'), 'false');
      assert.equal(await page.locator('#screens').evaluate(n => n.inert), true);
      await page.locator('.following-back').click();
      await pause(350);
      assert.equal(await page.locator('.screen.current').getAttribute('data-tab'), origin);
      assert.equal(await page.locator('#screens').evaluate(n => n.inert), false);
      checks.push('reload and return: ' + origin);
    }

    await page.locator('.tab[data-tab="market"]').click();
    await pause(380);
    assert.equal(await page.locator('#marketList .market-row').count(), 14);
    await page.locator('.market-row[data-ticker="NVDA"]').click();
    await pause(450);
    await page.locator('#sheetTop button[aria-label="Unfollow NVDA"]').click();
    assert.equal(await page.locator('#marketList .market-row').count(), 13);
    assert.equal(await page.locator('#filter-NVDA').count(), 0);
    assert.equal(await page.locator('#followCount').textContent(), '13');
    await page.locator('#sheetTop button[aria-label="Follow NVDA"]').click();
    assert.equal(await page.locator('#marketList .market-row').count(), 14);
    await closeSheet();
    assert.ok((await page.locator('#filter-GOOG img').getAttribute('src')).endsWith('filter-logo-goog.svg'));
    await page.locator('.market-row[data-ticker="COIN"]').click();
    await pause(450);
    assert.ok(!(await page.locator('#sheet').innerText()).match(/NaN|undefined|\$0/));
    assert.equal(await page.locator('#sheet canvas').count(), 0);
    await closeSheet();
    await page.locator('[data-market-tab="trending"]').click();
    await pause(300);
    await page.locator('.market-row[data-ticker="BTC"]').click();
    await pause(450);
    await page.locator('#sheetTop button[aria-label="Follow BTC"]').click();
    await closeSheet();
    await page.locator('.tab[data-tab="me"]').click();
    await pause(380);
    await page.locator('#followingRow').click();
    await pause(320);
    await page.locator('.following-search input').fill('BTC');
    assert.equal(await page.locator('.following-item .market-logo-btc').textContent(), 'B');
    await page.locator('.following-item').click();
    await pause(350);
    assert.equal(await page.locator('#filter-BTC').getAttribute('aria-selected'), 'true');
    await page.locator('#cards .following-clear').click();
    assert.equal(await page.locator('#filter-BTC').count(), 0);
    checks.push('newly followed crypto identity and empty-filter return');
    checks.push('follow state shared by Market, Feed and Me; no invented missing prices');
    await reset();
    await page.locator('#allTickers').click();
    await pause(320);
    await page.locator('.following-search input').fill('GOOG');
    await page.locator('.following-item').click();
    await pause(350);
    await page.locator('.ticker').first().click();
    await pause(450);
    await page.locator('#sheetTop button[aria-pressed="true"]').click();
    assert.equal(await page.locator('#filter-All').getAttribute('aria-selected'), 'true');
    await page.locator('#sheetTop button[aria-pressed="false"]').click();
    await closeSheet();
    assert.ok((await page.locator('#filter-GOOG img').getAttribute('src')).endsWith('filter-logo-goog.svg'));
    checks.push('unfollow selected ticker resets All; re-follow preserves its logo variant');
    await reset();

    const quote = page.locator('.quote[data-source-id="P02"] > .quote-copy');
    await quote.scrollIntoViewIfNeeded();
    await quote.click();
    await pause(450);
    assert.equal(await page.locator('#screens').evaluate(n => n.inert), true);
    assert.equal(await page.locator('#sheetTop button').first().evaluate(n => n === document.activeElement), true);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('#sheet').evaluate(n => n.contains(document.activeElement)), true);
    await page.keyboard.press('Escape');
    await pause(450);
    assert.equal(await page.locator('#sheet').evaluate(n => n.inert), true);
    assert.equal(await quote.evaluate(n => n === document.activeElement), true);
    checks.push('source dialog focus trap, Escape and focus restoration');

    for (const width of [320, 360, 393, 430]) {
      await page.setViewportSize({ width, height: 640 });
      await pause(100);
      const folds = await page.locator('.fold').evaluateAll(nodes => nodes.map(fold => {
        const body = fold.querySelector('.blk-body');
        return { cap: +fold.dataset.cap, height: body.offsetHeight, line: parseFloat(getComputedStyle(body).lineHeight),
          full: fold.dataset.full, preview: body.textContent, more: !!fold.querySelector('.showmore'),
          structured: !!fold.querySelector('.structured-content'), clippedX: body.scrollWidth > body.clientWidth };
      }));
      assert.ok(folds.every(f => f.cap > 0 && f.cap <= 573 && !f.clippedX));
      assert.ok(folds.every(f => Math.abs(f.height / f.line - Math.round(f.height / f.line)) < .05));
      assert.ok(folds.every(f => !f.more || f.structured || (f.preview.length > 1 && f.preview.length < f.full.length)));
      await page.locator('#feed').evaluate(n => { n.scrollTop = 0; });
      await page.screenshot({ path: path.join(output, width + '-short-feed.png') });
      checks.push('whole-line folding and density budget: ' + width + 'x640');
    }

    // Exercise a long first token and non-Latin sentence boundaries using
    // temporary DOM fixtures; production demo content remains unchanged.
    for (const text of ['W'.repeat(180) + ' has more words before the sentence ends. ' + 'Another complete sentence. '.repeat(20),
      '\u8fd9\u662f\u5b8c\u6574\u7684\u53e5\u5b50\u3002'.repeat(50)]) {
      const fold = page.locator('.fold:not(.fold-structured)').first();
      await fold.evaluate((n, full) => { n.dataset.full = full; delete n.dataset.expanded; window.dispatchEvent(new Event('resize')); }, text);
      await pause(100);
      assert.ok((await fold.locator('.blk-body').innerText()).length > 1);
      assert.equal(await fold.locator('.blk-body').evaluate(n => n.scrollWidth <= n.clientWidth), true);
      await fold.scrollIntoViewIfNeeded();
      await fold.click();
      await pause(350);
      assert.equal(await fold.locator('.blk-body').innerText(), text.trim());
    }
    await reset();
    await page.setViewportSize({ width: 320, height: 740 });
    const preview = page.locator('.quote[data-source-id="P06"] .quote-body');
    await preview.scrollIntoViewIfNeeded();
    await preview.locator('.quote-more').click();
    const expansion = await preview.evaluate(n => ({ target: n.scrollHeight, frame: n.getAnimations()[0]?.effect.getKeyframes().at(-1).height }));
    assert.equal(parseFloat(expansion.frame), expansion.target);
    await pause(250);
    assert.equal(await preview.evaluate(n => n.scrollHeight <= n.clientHeight), true);
    checks.push('long words, CJK and scaled quotation expansion');

    await page.setViewportSize({ width: 393, height: 852 });
    for (const phase of [100, 800, 1950, 2650]) {
      await reset();
      await page.locator('#newPill').click();
      await pause(phase);
      await reset();
      await pause(1700);
      assert.equal(await page.locator('#cards > .card').count(), initialCount);
      assert.equal(await page.locator('#newPillText').innerText(), '2 new feeds');
      assert.equal(await page.locator('#allTickers').isDisabled(), false);
      assert.equal(await page.locator('#refreshLoader').evaluate(n => n.classList.contains('spinning')), false);
      assert.equal(await page.locator('#feedTrack').evaluate(n => n.classList.contains('springing') || !!n.style.transform), false);
      checks.push('restart during refresh: ' + phase + 'ms');
    }
    // The next refresh must still work after cancellation.
    await page.locator('#newPill').click();
    await pause(3200);
    assert.equal(await page.locator('#cards > .card').count(), initialCount + 2);
    assert.equal(await page.locator('#allTickers').isDisabled(), false);
    await openFollowing();
    await page.screenshot({ path: path.join(output, 'following-final.png') });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, checks, errors, output }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
