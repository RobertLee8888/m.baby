const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engines = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const base = process.env.DEMO_URL || 'http://localhost:4173/';
const engine = process.env.BROWSER || 'chromium';
const output = process.env.QA_OUTPUT || '/tmp/alva-splash-mask';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await engines[engine].launch({ headless: true,
    ...(engine === 'chromium' ? { args: ['--no-proxy-server'], ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) } : {}),
  });
  const checks = [], errors = [];
  try {
    for (const route of ['mvp.html', 'mvp.html?feed=social', 'mvp-onboarding.html']) {
      for (const width of [320, 393, 430]) {
        const page = await browser.newPage({ viewport: { width, height: 932 }, deviceScaleFactor: 1 });
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(new URL(route, base).href);
        const splash = page.locator('.logo-splash');
        await splash.waitFor({ state: 'hidden' });
        await page.evaluate(() => {
          const root = document.querySelector('.logo-splash');
          root.hidden = false;
          root.classList.add('is-active', 'is-leaving');
          root.style.visibility = 'visible';
          for (const sibling of root.parentElement.children) {
            if (sibling !== root) {
              sibling.style.transition = 'none';
              sibling.style.opacity = '0';
            }
          }
          root.parentElement.style.background = '#ff00ff';
          window.maskMotion = root.getAnimations()[0];
          maskMotion.pause();
        });
        // At this frame the ink is gone, but the aperture is still the full logo.
        await page.evaluate(() => { maskMotion.currentTime = 622; });
        const expected = await page.evaluate(() => {
          const root = document.querySelector('.logo-splash');
          const bounds = root.getBoundingClientRect();
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(bounds.width);
          canvas.height = Math.round(bounds.height);
          const ctx = canvas.getContext('2d');
          for (const image of root.querySelectorAll('img')) {
            const rect = image.getBoundingClientRect();
            ctx.drawImage(image, rect.x - bounds.x, rect.y - bounds.y, rect.width, rect.height);
          }
          return {
            data: canvas.toDataURL(),
            mask: getComputedStyle(root, '::before').maskImage,
            ink: getComputedStyle(root).getPropertyValue('--splash-ink'),
          };
        });
        assert.ok(expected.mask.includes('wordmark-symbol.svg') && expected.mask.includes('wordmark-text.svg'));
        assert.ok(!expected.mask.includes('radial-gradient'));
        assert.ok(Math.abs(Number(expected.ink)) < .000001);
        const actual = await sharp(await splash.screenshot()).ensureAlpha().raw().toBuffer();
        const reference = await sharp(Buffer.from(expected.data.split(',')[1], 'base64')).ensureAlpha().raw().toBuffer();
        assert.equal(actual.length, reference.length);
        let mismatched = 0, aperture = 0;
        for (let index = 0; index < actual.length; index += 4) {
          const alpha = reference[index + 3];
          if (alpha > 245) {
            aperture++;
            if (actual[index] < 245 || actual[index + 1] > 10 || actual[index + 2] < 245) mismatched++;
          } else if (alpha < 10) {
            if (Math.abs(actual[index] - 73) > 10 || Math.abs(actual[index + 1] - 163) > 10 || Math.abs(actual[index + 2] - 166) > 10) mismatched++;
          }
        }
        const name = route.replace(/[^a-z0-9]/gi, '-') + '-' + width + '-' + engine;
        await splash.screenshot({ path: path.join(output, name + '-negative.png') });
        assert.ok(aperture > 3000, 'Logo-shaped content aperture must be visible');
        assert.ok(mismatched / (actual.length / 4) < .003, `${name}: ${mismatched} mismatched pixels; the aperture must follow the original SVG, including its gaps`);
        await page.evaluate(() => { maskMotion.currentTime = 1270; });
        const final = await sharp(await splash.screenshot()).ensureAlpha().raw().toBuffer();
        let covered = 0;
        for (let index = 0; index < final.length; index += 4) {
          if (final[index] < 245 || final[index + 1] > 10 || final[index + 2] < 245) covered++;
        }
        assert.ok(covered / (final.length / 4) < .001, 'No mask may remain at the screen edges on the final frame');
        checks.push({ route, width, mismatched, covered });
        await page.close();
      }
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, engine, checks, output }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
