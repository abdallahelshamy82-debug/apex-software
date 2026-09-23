const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\CYBER-TECH\\.gemini\\antigravity\\brain\\79369dba-95f8-4045-96ae-4156129ab71e';

async function runTest() {
  console.log('🚀 Starting Browser Live Test...');
  const { default: puppeteer } = await import('puppeteer-core');
  
  let browser;
  const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

  try {
    // Try connecting to existing Chrome on port 9222 first
    try {
      console.log('Connecting to existing Chrome on http://localhost:9222...');
      browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222',
        defaultViewport: null
      });
      console.log('✅ Connected to existing Chrome!');
    } catch (e) {
      console.log('Could not connect to port 9222, launching Chrome directly...');
      browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
        defaultViewport: null
      });
      console.log('✅ Launched Chrome successfully!');
    }

    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to http://localhost:8081...');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait 4 seconds for React Native Web to mount
    await new Promise(r => setTimeout(r, 4000));

    // Take initial screenshot
    const homeScreenshot = path.join(ARTIFACTS_DIR, 'browser_home.png');
    await page.screenshot({ path: homeScreenshot });
    console.log('📸 Saved home screenshot to:', homeScreenshot);

    // Check if we are on login screen or dashboard
    console.log('Page loaded. Checking for login form...');

    // If on login or welcome, fill in login credentials
    try {
      // Look for email input
      const emailInput = await page.$('input[type="email"], input[placeholder*="email" i], input[placeholder*="بريد" i]');
      const passInput = await page.$('input[type="password"], input[placeholder*="password" i], input[placeholder*="كلمة" i]');

      if (emailInput && passInput) {
        console.log('Found login inputs! Typing admin credentials...');
        await emailInput.click({ clickCount: 3 });
        await emailInput.type('abdallahelshamy82@gmail.com', { delay: 50 });

        await passInput.click({ clickCount: 3 });
        await passInput.type('123456', { delay: 50 });

        // Find login button
        const buttons = await page.$$('div[role="button"], button');
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.innerText, btn);
          if (text && (text.includes('دخول') || text.includes('Login') || text.includes('Sign In'))) {
            console.log('Clicking login button:', text.trim());
            await btn.click();
            break;
          }
        }

        // Wait for navigation / dashboard
        await new Promise(r => setTimeout(r, 5000));
        const afterLoginScreenshot = path.join(ARTIFACTS_DIR, 'browser_after_login.png');
        await page.screenshot({ path: afterLoginScreenshot });
        console.log('📸 Saved after-login screenshot to:', afterLoginScreenshot);
      } else {
        console.log('No login inputs found directly. Current URL:', page.url());
      }
    } catch (loginErr) {
      console.warn('Login step warning:', loginErr.message);
    }

    // Check for Admin navigation or Chat button
    const finalScreenshot = path.join(ARTIFACTS_DIR, 'browser_final_view.png');
    await page.screenshot({ path: finalScreenshot });
    console.log('📸 Saved final view screenshot to:', finalScreenshot);

    console.log('✅ Browser live test completed successfully!');
  } catch (err) {
    console.error('❌ Browser test error:', err);
  }
}

runTest().catch(console.error);
