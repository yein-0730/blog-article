import { chromium } from 'playwright';

const URL = 'https://blog-writer-iota-five.vercel.app';
const DIR = '/Users/ga/Desktop/claude/blog article/screenshots';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Step 1: Topic selection page
  console.log('1. Navigating to app...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });

  // Wait for topics to load (wait for topic cards or skeleton to appear)
  await page.waitForTimeout(15000); // Give time for API to respond
  await page.screenshot({ path: `${DIR}/step1_주제선택.png`, fullPage: true });
  console.log('✓ Step 1 captured');

  // Click first topic's "이 주제로 →" button
  const topicButton = page.locator('button:has-text("이 주제로")').first();
  if (await topicButton.isVisible({ timeout: 5000 })) {
    await topicButton.click();
    await page.waitForTimeout(1000);
  }

  // Step 2: Settings page
  await page.screenshot({ path: `${DIR}/step2_설정.png`, fullPage: true });
  console.log('✓ Step 2 captured');

  // Click generate button
  const generateButton = page.locator('button:has-text("아티클 생성하기")');
  if (await generateButton.isVisible({ timeout: 3000 })) {
    await generateButton.click();
    await page.waitForTimeout(2000);
  }

  // Step 3: Loading state
  await page.screenshot({ path: `${DIR}/step3_로딩.png`, fullPage: true });
  console.log('✓ Step 3 loading captured');

  // Wait for article generation (up to 90 seconds)
  console.log('Waiting for article generation...');
  try {
    await page.waitForSelector('text=도입부', { timeout: 120000 });
    await page.waitForTimeout(2000);
  } catch {
    console.log('Article generation timed out, capturing current state');
  }

  // Step 4: Article result
  await page.screenshot({ path: `${DIR}/step4_결과_본문.png`, fullPage: true });
  console.log('✓ Step 4 article captured');

  // Click SEO tab
  const seoTab = page.locator('button:has-text("SEO·AEO·GEO")');
  if (await seoTab.isVisible({ timeout: 3000 })) {
    await seoTab.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: `${DIR}/step5_결과_SEO.png`, fullPage: true });
  console.log('✓ Step 5 SEO tab captured');

  // Click Visual tab
  const visualTab = page.locator('button:has-text("시각화")');
  if (await visualTab.isVisible({ timeout: 3000 })) {
    await visualTab.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: `${DIR}/step6_결과_시각화.png`, fullPage: true });
  console.log('✓ Step 6 visual tab captured');

  await browser.close();
  console.log(`\nDone! Screenshots saved to ${DIR}`);
})();
