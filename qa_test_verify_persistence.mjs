import { chromium } from 'playwright';

async function testPersistence() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('\n=== TEST 1: Verify monsterSize persistence across reload ===');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    let size = await page.evaluate(() => localStorage.getItem('monsterSize'));
    console.log('Initial monsterSize:', size);

    // The app should have set it to 0.5 (the default since nothing was saved)
    // Actually, let's wait for the test to throw a ball and eat
    // Simulate interaction to trigger eating
    // Actually the first test run should have already set it...

    // Let's just check what the app thinks the size should be
    const appSize = await page.evaluate(() => {
      const s = localStorage.getItem('monsterSize');
      const parsed = s !== null ? parseFloat(s) : null;
      return parsed !== null && !isNaN(parsed) && parsed >= 1.0 ? parsed : 0.5;
    });
    console.log('App-calculated size:', appSize);

    console.log('\n=== TEST 2: Check if localStorage is actually writable ===');
    const writeTest = await page.evaluate(() => {
      try {
        localStorage.setItem('test_key', 'test_value');
        const retrieved = localStorage.getItem('test_key');
        localStorage.removeItem('test_key');
        return { success: true, retrieved };
      } catch (e) {
        return { success: false, error: e.toString() };
      }
    });
    console.log('localStorage write test:', writeTest);

    console.log('\n=== TEST 3: Manually trigger a feeding cycle and check persistence ===');
    // Click the feed button area
    const width = await page.evaluate(() => window.innerWidth);
    const height = await page.evaluate(() => window.innerHeight);

    // Click on the feed button (bottom-right)
    await page.mouse.click(width - 42, height - 32);
    await page.waitForTimeout(500);

    // Try to drag and throw (simulate)
    // This is tricky - let's just wait and see if size changes
    await page.waitForTimeout(15000); // Wait for a full cycle

    size = await page.evaluate(() => localStorage.getItem('monsterSize'));
    console.log('After interaction - monsterSize:', size);

    // Check hue as well
    const hue = await page.evaluate(() => localStorage.getItem('monsterHue'));
    console.log('monsterHue:', hue);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testPersistence().catch(console.error);
