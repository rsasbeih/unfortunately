import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolved from this file, not cwd, so the script works from any directory. Gitignored.
const OUTPUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'output');
const outputPath = (name) => path.join(OUTPUT_DIR, name);

async function runFocusedTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('\n=== LOADING APP (Fresh) ===');
    // Clear localStorage
    await context.clearCookies();
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if SVG monster is present
    const hasSvg = await page.$('svg');
    console.log('SVG Monster Present:', !!hasSvg);

    // Check localStorage
    let monsterSize = await page.evaluate(() => localStorage.getItem('monsterSize'));
    let monsterHue = await page.evaluate(() => localStorage.getItem('monsterHue'));
    console.log('Initial monsterSize:', monsterSize);
    console.log('Initial monsterHue:', monsterHue);

    // Check if FeedButton wrapper exists (position: fixed, bottom: 24, right: 24)
    const feedButtonWrapper = await page.$('[style*="position: fixed"][style*="bottom"]');
    console.log('FeedButton Wrapper Found:', !!feedButtonWrapper);

    // Try to find the div more specifically
    const allDivs = await page.locator('div').count();
    console.log('Total divs on page:', allDivs);

    // Check for the envelope SVG icon
    const envelopeSvgs = await page.$$('svg');
    console.log('Total SVGs on page:', envelopeSvgs.length);

    // List all positions and see what's rendered
    console.log('\nInspecting page elements...');
    const bodyInnerHTML = await page.evaluate(() => document.body.innerHTML.slice(0, 2000));
    console.log('Body HTML (first 2000 chars):');
    console.log(bodyInnerHTML);

    // Take a screenshot
    await page.screenshot({ path: outputPath('qa-initial-check.png') });
    console.log(`\nScreenshot: ${outputPath('qa-initial-check.png')}`);

    // Try to interact with the page by using keyboard
    console.log('\nAttempting interaction...');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    // Check if clicking bottom-right area triggers anything
    const vpWidth = await page.evaluate(() => window.innerWidth);
    const vpHeight = await page.evaluate(() => window.innerHeight);
    console.log(`Viewport: ${vpWidth}x${vpHeight}`);

    // Try clicking at bottom-right where the button should be
    const clickX = vpWidth - 42;
    const clickY = vpHeight - 32;
    console.log(`Clicking at (${clickX}, ${clickY}) for feed button...`);
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(1000);

    // Check if state changed
    const feedPhase = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.slice(0, 500) : 'NO ROOT';
    });
    console.log('After click - Root innerHTML sample:', feedPhase);

    // Take another screenshot
    await page.screenshot({ path: outputPath('qa-after-click.png') });

    console.log('\n=== REFRESHING PAGE ===');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    monsterSize = await page.evaluate(() => localStorage.getItem('monsterSize'));
    monsterHue = await page.evaluate(() => localStorage.getItem('monsterHue'));
    console.log('After reload - monsterSize:', monsterSize);
    console.log('After reload - monsterHue:', monsterHue);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

runFocusedTest().catch(console.error);
