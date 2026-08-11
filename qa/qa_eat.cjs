const { chromium } = require('playwright');
const path = require('path');

// Was a hardcoded Windows scratchpad path from the session that wrote this script,
// which broke the script anywhere else. Resolved from this file now. Gitignored.
const sc = (name) => path.join(__dirname, 'output', name);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 750 });

  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);

  // Open paper
  await page.click('.fb-wrap', { force: true });
  await page.waitForTimeout(500);

  // Type text (required for crumple to work)
  await page.click('textarea', { force: true });
  await page.type('textarea', 'Unfortunately we regret to inform you');
  await page.waitForTimeout(200);

  // Crumple
  await page.click('.pu-stamp', { force: true });
  await page.waitForTimeout(600);

  // Throw
  await page.mouse.move(300, 400);
  await page.waitForTimeout(30);
  for (let i = 1; i <= 20; i++) {
    await page.mouse.move(300 + i * 35, 400 - i * 4);
    await page.waitForTimeout(3);
  }
  await page.evaluate(() => {
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
  });
  console.log('Ball thrown');

  // Take rapid screenshots every 800ms for 16 seconds to catch everything
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(800);
    const t = ((i + 1) * 0.8).toFixed(1);

    const state = await page.evaluate(() => {
      const feedBtn  = document.querySelector('.fb-wrap');
      const settled  = document.querySelector('[data-settled]');
      const blob     = document.querySelector('.monster');
      // Count fixed divs on page to estimate rendering
      const allFixed = [...document.querySelectorAll('*')].filter(el => {
        const s = window.getComputedStyle(el);
        return s.position === 'fixed' && el.getBoundingClientRect().width > 10;
      });
      return {
        hasFeedBtn: !!feedBtn,
        numFixed: allFixed.length,
        fixedDims: allFixed.slice(0, 6).map(el => {
          const r = el.getBoundingClientRect();
          return `${el.tagName}.${el.className.split(' ')[0]}@(${Math.round(r.left)},${Math.round(r.top)},w${Math.round(r.width)})`;
        }),
      };
    });

    const label = String(i + 1).padStart(2, '0');
    await page.screenshot({ path: sc(`t${label}_${t}s.png`) });
    console.log(`t=${t}s | feedBtn=${state.hasFeedBtn} | fixed[${state.numFixed}]: ${state.fixedDims.join(', ')}`);
  }

  await browser.close();
  console.log('Done');
})();
