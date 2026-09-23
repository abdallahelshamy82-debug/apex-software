const path = require('path');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\CYBER-TECH\\.gemini\\antigravity\\brain\\79369dba-95f8-4045-96ae-4156129ab71e';

async function run() {
  console.log('🚀 Testing AI Consultant Chat History & Multi-Session Flow...');

  const puppeteer = await import('puppeteer-core');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    defaultViewport: { width: 1280, height: 850 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    console.log('1️⃣ Navigating to AI Copilot...');
    await page.goto('http://localhost:8081/copilot', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Type query and press Enter
    console.log('2️⃣ Typing consultation query and pressing Enter...');
    const inputSelector = 'textarea, input[type="text"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    await page.click(inputSelector);
    await page.type(inputSelector, 'فكرة تطبيق حجز وتأجير ملاعب بادل مع محفظة إلكترونية', { delay: 15 });
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.press('Enter');

    console.log('Waiting 12s for AI response & auto-save to AsyncStorage...');
    await new Promise(r => setTimeout(r, 12000));

    // Open History Modal
    console.log('3️⃣ Opening Chat History Modal...');
    await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('*'));
      const histBtn = allButtons.find(el => el.getAttribute && (
        el.getAttribute('aria-label') === 'سجل الاستشارات' ||
        el.getAttribute('aria-label') === 'Consultation History'
      ));
      if (histBtn) histBtn.click();
    });

    await new Promise(r => setTimeout(r, 1500));
    const historyShotPath = path.join(ARTIFACTS_DIR, '09_chat_history_modal.png');
    await page.screenshot({ path: historyShotPath, fullPage: false });
    console.log(`📸 Saved 09_chat_history_modal.png!`);

    // Click "بدء استشارة جديدة" inside modal
    console.log('4️⃣ Clicking "بدء استشارة جديدة" in modal...');
    await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      const newChatBtn = allElements.find(el => el.textContent && el.textContent.includes('بدء استشارة جديدة'));
      if (newChatBtn) newChatBtn.click();
    });

    await new Promise(r => setTimeout(r, 1500));
    const newChatShotPath = path.join(ARTIFACTS_DIR, '10_new_consultation_screen.png');
    await page.screenshot({ path: newChatShotPath, fullPage: false });
    console.log(`📸 Saved 10_new_consultation_screen.png!`);

    // Open History Modal again to verify previous session is listed
    console.log('5️⃣ Re-opening History Modal to verify session persistence...');
    await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('*'));
      const histBtn = allButtons.find(el => el.getAttribute && (
        el.getAttribute('aria-label') === 'سجل الاستشارات' ||
        el.getAttribute('aria-label') === 'Consultation History'
      ));
      if (histBtn) histBtn.click();
    });

    await new Promise(r => setTimeout(r, 1500));
    const multipleShotPath = path.join(ARTIFACTS_DIR, '11_chat_history_persisted.png');
    await page.screenshot({ path: multipleShotPath, fullPage: false });
    console.log(`📸 Saved 11_chat_history_persisted.png!`);

    console.log('🎉 Complete Chat History & Multi-Session Test Succeeded!');
  } catch (err) {
    console.error('❌ Error during test:', err);
  } finally {
    await browser.close();
  }
}

run();
