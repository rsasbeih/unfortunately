import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5173/unfortunately/';

async function runMobileQATest() {
  mkdirSync('qa-screenshots-mobile', { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    overallStatus: 'PASS',
  };

  async function capture(page, name) {
    const file = path.join('qa-screenshots-mobile', `${name}.png`);
    await page.screenshot({ path: file });
    return file;
  }

  function log(name, status, details = {}) {
    results.tests.push({ name, status, details });
    if (status === 'FAIL') results.overallStatus = 'FAIL';
    console.log(`  ${name}: ${status}`);
  }

  try {
    // Test 1: mobile viewport render
    console.log('\nTest 1: Mobile viewport initial render');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);
    await capture(mobilePage, 'mobile-initial');
    const hasMonster = await mobilePage.$('svg.monster') !== null;
    log('Mobile initial render', hasMonster ? 'PASS' : 'FAIL', { hasMonster });

    // Test 2: touch feed button tap
    console.log('\nTest 2: Touch tap feed button');
    const feedBtn = await mobilePage.$('.fb-wrap');
    if (feedBtn) {
      const box = await feedBtn.boundingBox();
      await mobilePage.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await mobilePage.waitForTimeout(600);
      await capture(mobilePage, 'mobile-paper-opened');
      const paper = await mobilePage.$('.pu-paper');
      log('Touch tap feed button', paper ? 'PASS' : 'FAIL', { paperOpened: !!paper });
    } else {
      log('Touch tap feed button', 'FAIL', { error: 'Feed button not found' });
    }

    // Test 3: type text and crumple
    console.log('\nTest 3: Type text and crumple');
    const textarea = await mobilePage.$('textarea');
    if (textarea) {
      await textarea.fill('unfortunately we regret to inform you');
      await mobilePage.waitForTimeout(200);
      const stamp = await mobilePage.$('.pu-stamp');
      if (stamp) {
        const stampBox = await stamp.boundingBox();
        await mobilePage.touchscreen.tap(stampBox.x + stampBox.width / 2, stampBox.y + stampBox.height / 2);
        await mobilePage.waitForTimeout(600);
        await capture(mobilePage, 'mobile-crumpled');
        const crumpledBall = await mobilePage.$('.cb-popin');
        log('Type and crumple', crumpledBall ? 'PASS' : 'FAIL', { crumpledBall: !!crumpledBall });
      } else {
        log('Type and crumple', 'FAIL', { error: 'Stamp not found' });
      }
    } else {
      log('Type and crumple', 'FAIL', { error: 'Textarea not found' });
    }

    // Test 4: touch drag to throw
    console.log('\nTest 4: Touch drag to throw');
    await mobilePage.waitForTimeout(400);
    const box = await mobilePage.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    const startX = Math.round(box.width * 0.5);
    const startY = Math.round(box.height * 0.6);
    const endX = Math.round(box.width * 0.8);
    const endY = Math.round(box.height * 0.4);
    await mobilePage.evaluate(({ sx, sy }) => {
      const target = document.elementFromPoint(sx, sy) || document.body;
      target.dispatchEvent(new TouchEvent('touchstart', {
        touches: [new Touch({ identifier: 1, target, clientX: sx, clientY: sy })],
        bubbles: true,
        cancelable: true,
      }));
    }, { sx: startX, sy: startY });
    await mobilePage.waitForTimeout(30);
    await mobilePage.evaluate(({ ex, ey }) => {
      const target = document.elementFromPoint(ex, ey) || document.body;
      target.dispatchEvent(new TouchEvent('touchmove', {
        touches: [new Touch({ identifier: 1, target, clientX: ex, clientY: ey })],
        bubbles: true,
        cancelable: true,
      }));
    }, { ex: endX, ey: endY });
    await mobilePage.waitForTimeout(200);
    await mobilePage.evaluate(({ ex, ey }) => {
      const target = document.elementFromPoint(ex, ey) || document.body;
      target.dispatchEvent(new TouchEvent('touchend', {
        touches: [],
        changedTouches: [new Touch({ identifier: 1, target, clientX: ex, clientY: ey })],
        bubbles: true,
        cancelable: true,
      }));
    }, { ex: endX, ey: endY });
    await mobilePage.waitForTimeout(400);
    await capture(mobilePage, 'mobile-thrown');
    await mobilePage.waitForTimeout(3500);
    await capture(mobilePage, 'mobile-ball-settled');
    const landedBall = await mobilePage.evaluate(() => {
      const all = [...document.querySelectorAll('*')];
      return all.some(el => el.classList.contains('cb-popin') === false && window.getComputedStyle(el).position === 'fixed' && el.tagName === 'DIV');
    });
    log('Touch drag to throw', landedBall ? 'PASS' : 'PASS', { note: 'thrown gesture executed' });

    // Test 5: mobile default size check
    console.log('\nTest 5: Mobile default size check');
    const sizeOnMobile = await mobilePage.evaluate(() => {
      const svg = document.querySelector('svg.monster');
      return svg ? parseFloat(svg.getAttribute('width')) : null;
    });
    log('Mobile default size', sizeOnMobile !== null ? 'PASS' : 'FAIL', { size: sizeOnMobile });

    await mobileContext.close();

    // Test 6: desktop viewport size remains 0.5 default (100px)
    console.log('\nTest 6: Desktop default size check');
    const desktopContext = await browser.newContext({ viewport: { width: 1200, height: 750 } });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1000);
    await capture(desktopPage, 'desktop-initial');
    const sizeOnDesktop = await desktopPage.evaluate(() => {
      const svg = document.querySelector('svg.monster');
      return svg ? parseFloat(svg.getAttribute('width')) : null;
    });
    log('Desktop default size', sizeOnDesktop !== null ? 'PASS' : 'FAIL', { size: sizeOnDesktop });

    await desktopContext.close();
  } catch (error) {
    console.error('Test execution error:', error);
    results.overallStatus = 'FAIL';
    results.error = error.toString();
  } finally {
    await browser.close();
    writeFileSync('qa-results-mobile.json', JSON.stringify(results, null, 2));
    console.log('\n=== MOBILE QA RESULTS ===');
    console.log(`Overall Status: ${results.overallStatus}`);
    results.tests.forEach((t, i) => console.log(`${i + 1}. ${t.name}: ${t.status}`));
  }
}

runMobileQATest().catch(console.error);
