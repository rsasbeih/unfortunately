/** Headless end-to-end regression test: run after every feature to prove the existing ones still work. */
import { chromium } from 'playwright';

const BASE_URL = process.env.REGRESSION_URL ?? 'http://localhost:5173/unfortunately/';

// This sandbox ships a Chromium that doesn't match the pinned Playwright build.
// Unset on a normal machine, where Playwright finds its own browser.
const EXECUTABLE_PATH = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

const VIEWPORT = { width: 1000, height: 700 };
const GROWTH_TIMEOUT_MS = 60_000; // full throw → settle → pursue → eat chain, generously

const results = [];
let failed = false;

function check(name, passed, detail = '') {
  results.push({ name, passed, detail });
  console.log(`  ${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!passed) failed = true;
}

/** Polls until read() returns a truthy value or the timeout expires. */
async function waitFor(read, timeoutMs, intervalMs = 250) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await read();
    if (value) return value;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}

const readStorage = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);

/** Walks the feed flow from the button through to releasing the thrown ball. */
async function throwBall(page) {
  // force: the button runs an infinite float animation, so it is never "stable"
  await page.click('.fb-wrap', { force: true });
  await page.waitForSelector('textarea', { timeout: 5000 });
  await page.fill('textarea', 'dear applicant, we regret to inform you');
  await page.click('.pu-stamp');

  // The crumpled ball tracks the cursor; release with enough speed to clear
  // CrumpledBall's 0.25px/ms throw threshold rather than just dropping it.
  await page.mouse.move(700, 250);
  await page.mouse.down();
  for (let i = 1; i <= 5; i++) {
    await page.mouse.move(700 - i * 70, 250 + i * 20);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
}

async function run() {
  const reachable = await fetch(BASE_URL).then((r) => r.ok).catch(() => false);
  if (!reachable) {
    console.error(`\nCannot reach ${BASE_URL}`);
    console.error('Start the dev server first:  npm run dev\n');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true, executablePath: EXECUTABLE_PATH });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  try {
    console.log(`\nRegression suite — ${BASE_URL}\n`);

    // ── 1. The app boots and every persistent piece of UI is on screen ──
    console.log('Boot');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    check('blob renders', (await page.locator('svg.monster').count()) === 1);
    check('feed button renders', (await page.locator('.fb-wrap').count()) === 1);
    check('settings gear renders', (await page.locator('.cp-gear').count()) === 1);

    // ── 2. Hue is randomised on first visit and written straight to storage ──
    console.log('\nColor persistence');
    const initialHue = await readStorage(page, 'monsterHue');
    const hueNumber = Number(initialHue);
    check(
      'monsterHue saved on first visit',
      initialHue !== null && Number.isInteger(hueNumber) && hueNumber >= 0 && hueNumber <= 359,
      `monsterHue=${initialHue}`,
    );

    // ── 3. The picker drives the blob's gradient, not just its own state ──
    console.log('\nColor picker');
    await page.click('.cp-gear');
    await page.waitForSelector('.cp-slider', { timeout: 3000 });
    check('panel opens on gear click', (await page.locator('.cp-slider').count()) === 1);

    const TEST_HUE = 300;
    await page.fill('.cp-slider', String(TEST_HUE));
    await page.waitForTimeout(300);

    const topStop = await page.evaluate(() =>
      document.querySelector('svg.monster #mhBg stop')?.getAttribute('stop-color'),
    );
    check(
      'hue change repaints the blob',
      topStop === `hsl(${TEST_HUE}, 72%, 91%)`,
      `first gradient stop = ${topStop}`,
    );
    check('hue change persists', (await readStorage(page, 'monsterHue')) === String(TEST_HUE));

    await page.click('.cp-gear'); // close so it can't sit over the feed button
    await page.waitForTimeout(200);

    // ── 3b. Petting: reacts to rubbing, holds still, then lets go ──
    console.log('\nPetting');
    const blushOpacity = () =>
      page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.mh-blush')).opacity));
    // Wander position, read off the layer the lean transform does not touch
    const wanderPos = () =>
      page.evaluate(() => {
        const el = document.querySelector('.mh-position');
        return `${el.style.left}|${el.style.top}`;
      });

    const blob = await page.locator('svg.monster').boundingBox();
    const blobCX = blob.x + blob.width / 2;
    const blobCY = blob.y + blob.height / 2;

    await page.mouse.move(blobCX, blobCY);
    await page.mouse.down();
    const posAtPetStart = await wanderPos();

    // Rub in circles; the blob should react to the motion, not the press
    for (let i = 0; i < 16; i++) {
      const angle = (i / 8) * Math.PI * 2;
      await page.mouse.move(
        blobCX + Math.cos(angle) * blob.width * 0.3,
        blobCY + Math.sin(angle) * blob.height * 0.15,
      );
      await page.waitForTimeout(30);
    }

    const heartCount = () => page.locator('.mh-pet-heart').count();

    check('rubbing brings up the blush', (await blushOpacity()) > 0.1);
    check('blob holds still while petted', (await wanderPos()) === posAtPetStart);
    check('rubbing floats a heart', (await heartCount()) === 1);

    // Keep rubbing across a heart changeover — they alternate one at a time,
    // never overlapping, so the count must never exceed 1
    let maxConcurrent = 0;
    for (let i = 0; i < 90; i++) {
      const angle = (i / 8) * Math.PI * 2;
      await page.mouse.move(
        blobCX + Math.cos(angle) * blob.width * 0.3,
        blobCY + Math.sin(angle) * blob.height * 0.15,
      );
      await page.waitForTimeout(28);
      maxConcurrent = Math.max(maxConcurrent, await heartCount());
    }
    check('hearts never overlap', maxConcurrent === 1, `peak concurrent = ${maxConcurrent}`);

    await page.mouse.up();
    await page.waitForTimeout(1300); // past the expression hold
    check('pleased face clears after release', (await blushOpacity()) < 0.05);

    const heartsStopped = await waitFor(async () => (await heartCount()) === 0, 4000);
    check('hearts stop after release', heartsStopped === true);

    const wandered = await waitFor(async () => (await wanderPos()) !== posAtPetStart, 8000);
    check('wandering resumes after petting', wandered === true);

    // Petting must not fight the feeding flow
    await page.click('.fb-wrap', { force: true });
    await page.waitForSelector('textarea', { timeout: 5000 });
    const petCursorDuringFeed = await page.evaluate(
      () => getComputedStyle(document.querySelector('svg.monster')).pointerEvents,
    );
    check('petting disabled while feeding', petCursorDuringFeed === 'none');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // ── 4. The whole feeding chain, asserted on its one durable side effect ──
    // Growth only lands in storage if compose → crumple → throw → settle →
    // pursue → eat → celebrate all completed, so one assertion covers the lot.
    console.log('\nFeeding chain');
    const sizeBefore = parseFloat(await readStorage(page, 'monsterSize')) || 0.5;

    await throwBall(page);
    check('ball leaves the compose UI', (await page.locator('textarea').count()) === 0);

    const grown = await waitFor(async () => {
      const raw = await readStorage(page, 'monsterSize');
      const value = parseFloat(raw);
      return !isNaN(value) && value > sizeBefore ? value : null;
    }, GROWTH_TIMEOUT_MS);

    check(
      'monster eats and grows',
      grown !== null,
      grown !== null
        ? `${sizeBefore} → ${grown}`
        : `still ${await readStorage(page, 'monsterSize')} after ${GROWTH_TIMEOUT_MS / 1000}s`,
    );

    // ── 5. Everything survives a reload ──
    console.log('\nPersistence across reload');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    check('blob still renders after reload', (await page.locator('svg.monster').count()) === 1);
    check(
      'size survives reload',
      grown !== null && parseFloat(await readStorage(page, 'monsterSize')) === grown,
    );
    check('hue survives reload', (await readStorage(page, 'monsterHue')) === String(TEST_HUE));

    const reloadedStop = await page.evaluate(() =>
      document.querySelector('svg.monster #mhBg stop')?.getAttribute('stop-color'),
    );
    check('blob repaints from saved hue', reloadedStop === `hsl(${TEST_HUE}, 72%, 91%)`);

    // ── 6. Nothing threw along the way ──
    console.log('\nConsole');
    check('no console or page errors', consoleErrors.length === 0, consoleErrors.join(' | '));
  } catch (error) {
    check('suite ran to completion', false, error.message);
  } finally {
    await browser.close();
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log(`\n${passedCount}/${results.length} passed\n`);
  process.exit(failed ? 1 : 0);
}

run();
