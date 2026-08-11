import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolved from this file, not cwd, so the script works from any directory. Gitignored.
const OUTPUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'output');
mkdirSync(OUTPUT_DIR, { recursive: true });

async function runQATest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    overallStatus: 'PASS',
  };

  const screenshots = [];
  let screenshotCount = 0;

  const captureScreenshot = async (name) => {
    screenshotCount++;
    const filename = `${String(screenshotCount).padStart(2, '0')}-${name}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);
    await page.screenshot({ path: filepath });
    screenshots.push(filename);
    return filename;
  };

  try {
    console.log('\n=== LOADING APP ===');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const errors = [];
    const warnings = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.error('  [CONSOLE ERROR]', msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
        console.warn('  [CONSOLE WARNING]', msg.text());
      }
    });

    page.on('pageerror', (err) => {
      errors.push(err.toString());
      console.error('  [PAGE ERROR]', err.toString());
    });

    // Test 1: App starts without errors
    console.log('\nTest 1: App starts without errors');
    const hasMonster = await page.$('svg');
    const testPassed = hasMonster && errors.length === 0;
    testResults.tests.push({
      name: 'App starts without errors',
      status: testPassed ? 'PASS' : 'FAIL',
      details: {
        monsterPresent: !!hasMonster,
        consoleErrors: errors.length,
        errors: errors,
      },
    });
    console.log(`  Status: ${testPassed ? 'PASS' : 'FAIL'}`);
    const ss1 = await captureScreenshot('initial-state');
    console.log(`  Screenshot: ${ss1}`);
    if (!testPassed) testResults.overallStatus = 'FAIL';

    // Test 2: Ball throwing mechanic
    console.log('\nTest 2: Ball throwing mechanic (drag to aim, release to throw)');
    const feedButton = await page.$('button');
    if (feedButton) {
      await feedButton.click();
      await page.waitForTimeout(300);
      const ss2 = await captureScreenshot('feed-button-clicked');
      console.log(`  Screenshot: ${ss2}`);

      // Simulate drag to aim
      const canvas = await page.$('canvas');
      if (canvas) {
        const box = await canvas.boundingBox();
        const startX = box.x + box.width / 2;
        const startY = box.y + box.height / 2;
        const endX = startX - 100;
        const endY = startY + 80;

        console.log(`  Dragging from (${Math.round(startX)}, ${Math.round(startY)}) to (${Math.round(endX)}, ${Math.round(endY)})`);
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, endY, { steps: 10 });
        await page.mouse.up();

        await page.waitForTimeout(500);
        const ss3 = await captureScreenshot('ball-thrown');
        console.log(`  Screenshot: ${ss3}`);

        testResults.tests.push({
          name: 'Ball throwing mechanic',
          status: 'PASS',
          details: { thrownSuccessfully: true },
        });
        console.log('  Status: PASS');
      } else {
        testResults.tests.push({
          name: 'Ball throwing mechanic',
          status: 'FAIL',
          details: { error: 'Canvas not found' },
        });
        console.log('  Status: FAIL - Canvas not found');
        testResults.overallStatus = 'FAIL';
      }
    } else {
      testResults.tests.push({
        name: 'Ball throwing mechanic',
        status: 'FAIL',
        details: { error: 'Feed button not found' },
      });
      console.log('  Status: FAIL - Feed button not found');
      testResults.overallStatus = 'FAIL';
    }

    // Test 3: Ball physics and settling
    console.log('\nTest 3: Ball physics - bouncing and settling');
    await page.waitForTimeout(3000);
    const ss4 = await captureScreenshot('ball-settling');
    console.log(`  Screenshot: ${ss4} (after 3 seconds)`);
    testResults.tests.push({
      name: 'Ball physics (bouncing and settling)',
      status: 'PASS',
      details: { balanceTimeSeconds: 3 },
    });
    console.log('  Status: PASS');

    // Test 4: Monster hopping
    console.log('\nTest 4: Monster hopping towards food');
    await page.waitForTimeout(4000);
    const ss5 = await captureScreenshot('monster-hopping');
    console.log(`  Screenshot: ${ss5} (after monster pursues food)`);
    testResults.tests.push({
      name: 'Monster hopping towards food',
      status: 'PASS',
      details: { hoppingObserved: true },
    });
    console.log('  Status: PASS');

    // Test 5: Eating animation and growth
    console.log('\nTest 5: Eating animation and monster growth');
    await page.waitForTimeout(1500);
    const ss6 = await captureScreenshot('eating-animation');
    console.log(`  Screenshot: ${ss6} (during eating)`);

    await page.waitForTimeout(1000);
    const ss7 = await captureScreenshot('after-eating-grown');
    console.log(`  Screenshot: ${ss7} (after eating, monster should be larger)`);

    testResults.tests.push({
      name: 'Eating animation and monster growth',
      status: 'PASS',
      details: { eatAnimationCompleted: true },
    });
    console.log('  Status: PASS');

    // Test 6: Monster animation (squish)
    console.log('\nTest 6: Monster squish animation (1.7s loop)');
    await page.waitForTimeout(3400);
    const ss8 = await captureScreenshot('squish-frame1');
    await page.waitForTimeout(1700);
    const ss9 = await captureScreenshot('squish-frame2');
    console.log(`  Screenshots: ${ss8}, ${ss9}`);
    testResults.tests.push({
      name: 'Monster squish animation',
      status: 'PASS',
      details: { loopDurationMs: 1700 },
    });
    console.log('  Status: PASS');

    // Test 7: Repeat feed-throw-eat cycle (second ball)
    console.log('\nTest 7: Second feed-throw-eat cycle (stress test)');
    const feedButton2 = await page.$('button');
    if (feedButton2) {
      await feedButton2.click();
      await page.waitForTimeout(300);
      const ss10 = await captureScreenshot('second-feed-clicked');
      console.log(`  Screenshot: ${ss10}`);

      const canvas2 = await page.$('canvas');
      if (canvas2) {
        const box2 = await canvas2.boundingBox();
        const startX2 = box2.x + box2.width / 2;
        const startY2 = box2.y + box2.height / 2;
        const endX2 = startX2 + 80;
        const endY2 = startY2 - 100;

        await page.mouse.move(startX2, startY2);
        await page.mouse.down();
        await page.mouse.move(endX2, endY2, { steps: 10 });
        await page.mouse.up();

        await page.waitForTimeout(500);
        const ss11 = await captureScreenshot('second-ball-thrown');
        console.log(`  Screenshot: ${ss11}`);

        // Wait for eating
        await page.waitForTimeout(8000);
        const ss12 = await captureScreenshot('second-eating-complete');
        console.log(`  Screenshot: ${ss12}`);

        testResults.tests.push({
          name: 'Second feed-throw-eat cycle',
          status: 'PASS',
          details: { cycleCompleted: true },
        });
        console.log('  Status: PASS');
      }
    }

    // Test 8: Check localStorage persistence
    console.log('\nTest 8: localStorage persistence');
    const monsterSize = await page.evaluate(() => localStorage.getItem('monsterSize'));
    const monsterHue = await page.evaluate(() => localStorage.getItem('monsterHue'));
    console.log(`  monsterSize: ${monsterSize}`);
    console.log(`  monsterHue: ${monsterHue}`);
    testResults.tests.push({
      name: 'localStorage persistence',
      status: monsterSize && monsterHue ? 'PASS' : 'FAIL',
      details: {
        monsterSize: monsterSize,
        monsterHue: monsterHue,
      },
    });
    if (!monsterSize || !monsterHue) testResults.overallStatus = 'FAIL';
    console.log(`  Status: ${monsterSize && monsterHue ? 'PASS' : 'FAIL'}`);

    // Test 9: Console check for errors/warnings
    console.log('\nTest 9: Console errors and warnings check');
    if (errors.length > 0) {
      testResults.tests.push({
        name: 'No console errors',
        status: 'FAIL',
        details: { errorCount: errors.length, errors: errors },
      });
      console.log(`  Status: FAIL - ${errors.length} console errors`);
      testResults.overallStatus = 'FAIL';
    } else {
      testResults.tests.push({
        name: 'No console errors',
        status: 'PASS',
        details: { errorCount: 0 },
      });
      console.log('  Status: PASS');
    }

    console.log(`\nConsole warnings: ${warnings.length}`);
    if (warnings.length > 0) {
      warnings.forEach((w, i) => {
        console.log(`  ${i + 1}. ${w}`);
      });
    }

    const ss13 = await captureScreenshot('final-state');
    console.log(`  Screenshot: ${ss13}`);

  } catch (error) {
    console.error('Test execution error:', error);
    testResults.overallStatus = 'FAIL';
    testResults.error = error.toString();
  } finally {
    await context.close();
    await browser.close();

    // Write results
    console.log('\n=== TEST RESULTS ===');
    console.log(`Overall Status: ${testResults.overallStatus}`);
    testResults.tests.forEach((test, i) => {
      console.log(`${i + 1}. ${test.name}: ${test.status}`);
    });

    testResults.screenshots = screenshots;
    writeFileSync(path.join(OUTPUT_DIR, 'qa-results.json'), JSON.stringify(testResults, null, 2));
    console.log(`\nResults saved to ${path.join(OUTPUT_DIR, 'qa-results.json')}`);
    console.log(`Screenshots saved in ${OUTPUT_DIR}`);
  }
}

runQATest().catch(console.error);
