const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const sharp = require(process.env.SHARP_MODULE || 'sharp');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'assets/alva-splash-reveal.json');
const player = process.env.LOTTIE_PLAYER || path.join(root, '../alva-freshman/node_modules/lottie-web/build/player/lottie.min.js');
const output = process.env.QA_OUTPUT || '/tmp/alva-splash-lottie';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual([data.w, data.h, data.fr, data.ip, data.op], [1080, 1920, 30, 0, 11]);
  assert.equal(data.assets.length, 0);
  assert.equal(data.layers.some(layer => layer.ty === 2 || layer.ty === 5), false, 'No raster or text layers');
  assert.equal(data.layers.find(layer => layer.nm === 'Brand overlay').tt, 2, 'Reveal must use an inverted alpha matte');

  if (!fs.existsSync(player)) throw new Error(`Set LOTTIE_PLAYER to lottie.min.js; not found: ${player}`);
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  });
  try {
    const page = await browser.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1 });
    await page.setContent('<style>html,body,#page,#animation{position:absolute;inset:0;margin:0}#page{background:linear-gradient(135deg,#f7f7f7 0 50%,#171717 50%)}#animation{z-index:1}</style><div id="page"></div><div id="animation"></div>');
    await page.addScriptTag({ path: player });
    await page.evaluate((animationData) => {
      window.animation = window.lottie.loadAnimation({
        container: document.querySelector('#animation'),
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData,
        rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
      });
    }, data);

    await page.locator('#animation').evaluate((node) => { node.style.display = 'none'; });
    const baselineShot = await page.screenshot({ path: path.join(output, 'page-baseline.png') });
    const baseline = await sharp(baselineShot).removeAlpha().raw().toBuffer();
    await page.locator('#animation').evaluate((node) => { node.style.display = ''; });

    const frames = [0, 2, 3, 5, 8, 10];
    const difference = [];
    let openingBounds;
    for (const frame of frames) {
      await page.evaluate((value) => window.animation.goToAndStop(value, true), frame);
      const shot = await page.screenshot({ path: path.join(output, `frame-${frame}.png`) });
      const pixels = await sharp(shot).removeAlpha().raw().toBuffer();
      if (frame === 0) {
        let minX = 393, maxX = 0, minY = 852, maxY = 0;
        for (let y = 0; y < 852; y++) {
          for (let x = 0; x < 393; x++) {
            const index = (y * 393 + x) * 3;
            if (pixels[index] > 250 && pixels[index + 1] > 250 && pixels[index + 2] > 250) {
              minX = Math.min(minX, x); maxX = Math.max(maxX, x);
              minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            }
          }
        }
        openingBounds = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
      }
      let totalDelta = 0;
      for (let index = 0; index < pixels.length; index += 3) {
        totalDelta += Math.abs(pixels[index] - baseline[index])
          + Math.abs(pixels[index + 1] - baseline[index + 1])
          + Math.abs(pixels[index + 2] - baseline[index + 2]);
      }
      difference.push(totalDelta / (pixels.length / 3) / 765);
    }
    assert.ok(difference[0] > .2, 'The opening frame must fully cover the page');
    assert.ok(Math.abs(openingBounds.width - 204) <= 2 && Math.abs(openingBounds.height - 50) <= 2,
      `Opening lockup must match the demo size: ${JSON.stringify(openingBounds)}`);
    assert.ok(Math.abs(openingBounds.x + openingBounds.width / 2 - 393 / 2) <= 1,
      'Opening lockup must stay horizontally centered');
    assert.ok(difference[5] < .001, 'The final frame must expose the complete page');
    assert.ok(difference[3] < difference[2] && difference[4] < difference[3], 'The reveal must progress without reversing');
    console.log(JSON.stringify({ passed: true, durationMs: data.op / data.fr * 1000, openingBounds, frames, difference, output }));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
