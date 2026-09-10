const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://localhost:4173/index.html';
const output = process.env.QA_OUTPUT || '/tmp/alva-device-qa';
const routes = ['mvp', 'mvp-social', 'mvp-onboarding', 'alpha-radar', 'onboarding'];
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  page.setDefaultTimeout(8000);
  const errors = [], checks = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  await page.addInitScript(() => localStorage.setItem('alva-mvp-appearance', 'light'));
  async function ready(slug) {
    const url = new URL(base);
    url.searchParams.set('device-audit', slug);
    url.hash = '/' + slug;
    await page.goto(url.href);
    const frame = page.frames().find(f => f.parentFrame() === page.mainFrame());
    assert.ok(frame.url().includes(slug === 'mvp-social' ? 'mvp.html' : slug + '.html'));
    await frame.evaluate(() => document.fonts.ready);
    if (slug.startsWith('mvp') && slug !== 'mvp-onboarding') await frame.waitForFunction(() => document.querySelector('#startupLoader').hidden);
    await page.waitForTimeout(450);
    await frame.evaluate(() => { window.deviceAudit = 'preserve page state'; });
    return frame;
  }
  async function choose(index) {
    await page.locator('#deviceTrigger').click();
    await page.locator('#deviceMenu .tb-option').nth(index).click();
    await page.waitForTimeout(100);
  }
  function measurements() {
    const root = document.documentElement, style = getComputedStyle(root);
    const node = selector => document.querySelector(selector);
    const rect = n => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, bottom: r.bottom }; };
    const bar = node('.system-bar, .statusbar, .sysbar');
    const left = node('.system-left, .status-left, .sb-left');
    const right = node('.system-right, .status-right, .sb-right');
    const camera = node('.dynamic-island, .sb-island');
    const home = node('.home-indicator, .sys-home');
    const range = document.createRange(); range.selectNodeContents(left);
    const text = range.getBoundingClientRect();
    return {
      id: root.dataset.deviceId, platform: root.dataset.devicePlatform, cutout: root.dataset.deviceCutout,
      viewport: { w: innerWidth, h: innerHeight },
      safeTop: parseFloat(style.getPropertyValue('--status-h') || style.getPropertyValue('--sb-h')),
      safeBottom: parseFloat(style.getPropertyValue('--home-h')),
      bar: rect(bar), display: getComputedStyle(bar).display,
      text: { y: text.y, h: text.height }, font: getComputedStyle(left).fontFamily,
      timeSize: getComputedStyle(left).fontSize,
      right: rect(right), strip: getComputedStyle(right, '::after').maskImage,
      oldIconsHidden: [...right.children].every(n => getComputedStyle(n).display === 'none'),
      camera: rect(camera), home: rect(home), homeDisplay: getComputedStyle(home).display,
      indicator: rect(home.firstElementChild),
      tab: node('#tabBar') ? rect(node('#tabBar')) : null,
      top: node('#topbar, #flowTopbar') ? rect(node('#topbar, #flowTopbar')) : null,
      state: window.deviceAudit,
    };
  }
  try {
    for (const slug of routes) {
      const frame = await ready(slug);
      const count = await page.locator('#deviceMenu .tb-option').count();
      assert.equal(count, 6);
      for (let index = 0; index < count; index++) {
        await choose(index);
        await frame.evaluate(() => document.fonts.ready);
        const m = await frame.evaluate(measurements);
        assert.equal(m.state, 'preserve page state');
        assert.equal(m.display, 'grid');
        assert.equal(m.bar.h, m.safeTop);
        assert.equal(m.home.h, m.safeBottom);
        assert.equal(m.home.bottom, m.viewport.h);
        assert.ok(Math.abs(m.text.y + m.text.h / 2 - m.bar.h / 2) <= 2, slug + ' time is off-center');
        assert.ok(Math.abs(m.camera.x + m.camera.w / 2 - m.viewport.w / 2) < .1);
        assert.equal(m.camera.y, m.cutout === 'drop' ? 0 : (m.safeTop - m.camera.h) / 2);
        assert.ok(m.indicator.y >= m.home.y && m.indicator.bottom <= m.home.bottom);
        assert.equal(m.indicator.w, m.platform === 'android' ? 108 : 144);
        assert.equal(m.indicator.h, m.platform === 'android' ? 4 : 5);
        if (m.tab) assert.equal(m.tab.bottom, m.home.y);
        if (m.top) assert.equal(m.top.y, m.safeTop);
        if (m.platform === 'android') {
          assert.equal(m.timeSize, '14px');
          assert.ok(m.font.includes('Alva Device Roboto'));
          assert.ok(m.oldIconsHidden);
          for (const asset of ['wifi', 'signal', 'battery']) assert.ok(m.strip.includes('/device/' + asset + '.svg'));
        } else {
          assert.equal(m.timeSize, '16px');
          assert.equal(m.oldIconsHidden, false);
        }
        await page.locator('#phoneScreen').screenshot({ path: path.join(output, slug + '-' + m.id + '-after.png') });
        checks.push({ route: slug, device: m.id, safeTop: m.safeTop, safeBottom: m.safeBottom });
      }
      // Crossing the gallery breakpoint must remove, then restore, device UI.
      for (const width of [393, 850]) {
        await page.setViewportSize({ width, height: 852 });
        await page.waitForTimeout(200);
        const native = await frame.evaluate(measurements);
        assert.equal(native.platform, undefined);
        assert.equal(native.display, 'none');
        assert.equal(native.homeDisplay, 'none');
        assert.equal(native.safeTop, 0);
        assert.equal(native.safeBottom, 0);
        assert.equal(native.state, 'preserve page state');
        await page.screenshot({ path: path.join(output, slug + '-native-' + width + '.png') });
      }
      await page.setViewportSize({ width: 1600, height: 1200 });
      await page.waitForTimeout(200);
      assert.equal((await frame.evaluate(measurements)).platform, 'android');
    }

    for (const file of ['mvp.html', 'mvp-onboarding.html', 'alpha-radar.html', 'onboarding.html']) {
      const native = await browser.newPage({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
      await native.goto(new URL(file, base).href);
      assert.equal(await native.locator('.system-bar, .statusbar, .sysbar').evaluate(n => getComputedStyle(n).display), 'none', file);
      assert.equal(await native.locator('.home-indicator, .sys-home').evaluate(n => getComputedStyle(n).display), 'none', file);
      await native.close();
    }

    // Fullscreen from a ticker sheet used to retain white status icons and
    // the iPhone gesture handle, even on an Android device.
    const frame = await ready('mvp');
    await choose(4);
    await frame.locator('#cards .ticker').first().click();
    await frame.locator('#sheet').waitFor({ state: 'visible' });
    await frame.getByRole('button', { name: 'Fullscreen', exact: true }).click();
    await frame.waitForFunction(() => document.querySelector('#fullChart').classList.contains('show') && !document.querySelector('#fullChart').classList.contains('is-loading'));
    for (const mode of ['light', 'dark']) {
      if (mode === 'dark') await page.locator('#themePill').click();
      await page.waitForTimeout(200);
      const m = await frame.evaluate(() => {
        const css = selector => getComputedStyle(document.querySelector(selector));
        return { status: css('.system-bar').color, ink: css('#fsClose').color,
          width: css('.fs-home span').width, height: css('.fs-home span').height,
          bottom: css('.fs-home span').bottom };
      });
      assert.equal(m.status, m.ink);
      assert.deepEqual([m.width, m.height, m.bottom], ['108px', '4px', '6px']);
      await page.locator('#phoneScreen').screenshot({ path: path.join(output, 'chart-android-' + mode + '.png') });
    }
    await frame.locator('#fsClose').click();
    await page.waitForTimeout(500);
    assert.equal(await frame.locator('.system-bar').evaluate(n => getComputedStyle(n).color), 'rgb(255, 255, 255)');
    await page.setViewportSize({ width: 393, height: 852 });
    assert.equal(await frame.locator('.fs-home span').evaluate(n => getComputedStyle(n).display), 'none');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, checks, nativeRoutes: routes.length, errors, output }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
