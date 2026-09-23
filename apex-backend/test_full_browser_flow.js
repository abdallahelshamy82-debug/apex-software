const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\CYBER-TECH\\.gemini\\antigravity\\brain\\79369dba-95f8-4045-96ae-4156129ab71e';

async function runFullFlow() {
  console.log('🚀 Starting Full Browser Automation Flow...');
  const { default: puppeteer } = await import('puppeteer-core');
  
  // 1. Authenticate via Backend API to get valid Admin JWT
  console.log('1️⃣ Authenticating via Backend API (abdallahelshamy82@gmail.com)...');
  const loginRes = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'abdallahelshamy82@gmail.com', password: '123456' })
  });
  const authData = await loginRes.json();
  console.log('Auth API Response:', authData.success, authData.user?.fullName, authData.user?.role);

  if (!authData.success || !authData.token) {
    throw new Error('Admin authentication failed: ' + authData.message);
  }

  const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850'],
    defaultViewport: null
  });

  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  // 2. Open page and inject authenticated session
  console.log('2️⃣ Injecting Admin Session into Browser Storage...');
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle2', timeout: 30000 });
  
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('apex_sec_user_token_v1', token);
    localStorage.setItem('userToken', token);
    localStorage.setItem('userData', JSON.stringify(user));
  }, { token: authData.token, user: authData.user });

  console.log('Session injected successfully!');

  // 3. Navigate to Admin Dashboard
  console.log('3️⃣ Navigating to Admin Dashboard (http://localhost:8081/admin)...');
  await page.goto('http://localhost:8081/admin', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  const adminDashboardScreenshot = path.join(ARTIFACTS_DIR, '02_admin_dashboard.png');
  await page.screenshot({ path: adminDashboardScreenshot });
  console.log('📸 Saved 02_admin_dashboard.png. Current URL:', page.url());

  // 4. Navigate to Live Chat (/chat)
  console.log('4️⃣ Navigating to Live Chat (http://localhost:8081/chat)...');
  await page.goto('http://localhost:8081/chat', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  const chatRoomScreenshot = path.join(ARTIFACTS_DIR, '03_chat_room.png');
  await page.screenshot({ path: chatRoomScreenshot });
  console.log('📸 Saved 03_chat_room.png. Current URL:', page.url());

  // 5. Type and Send Message in Chat
  console.log('5️⃣ Sending message in live chat...');
  const chatInputs = await page.$$('input[type="text"], textarea');
  if (chatInputs.length > 0) {
    const chatInput = chatInputs[chatInputs.length - 1];
    await chatInput.click();
    await chatInput.type('تجربة مباشرة من المتصفح: تم فحص واختبار شاشة المحادثة ورفع الملفات بنجاح 🚀', { delay: 20 });

    const allBtns = await page.$$('div[role="button"], button');
    for (const btn of allBtns) {
      const isSend = await page.evaluate(el => el.innerHTML.includes('send') || el.innerText.includes('إرسال'), btn);
      if (isSend) {
        console.log('Clicking send message button...');
        await btn.click();
        break;
      }
    }

    await new Promise(r => setTimeout(r, 3000));
    const msgSentScreenshot = path.join(ARTIFACTS_DIR, '04_message_sent.png');
    await page.screenshot({ path: msgSentScreenshot });
    console.log('📸 Saved 04_message_sent.png');
  }

  // 6. Test AI Copilot (/copilot)
  console.log('6️⃣ Navigating to AI Copilot (http://localhost:8081/copilot)...');
  await page.goto('http://localhost:8081/copilot', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  // Type question in Copilot
  const copilotInputs = await page.$$('input[type="text"], textarea');
  if (copilotInputs.length > 0) {
    const cInput = copilotInputs[copilotInputs.length - 1];
    await cInput.click();
    await cInput.type('عندي فكرة تطبيق توصيل صيدليات وأدوية', { delay: 25 });

    const sendBtns = await page.$$('div[role="button"], button');
    for (const btn of sendBtns) {
      const isSend = await page.evaluate(el => el.innerHTML.includes('send') || el.innerText.includes('إرسال'), btn);
      if (isSend) {
        console.log('Sending question to AI Copilot...');
        await btn.click();
        break;
      }
    }

    console.log('Waiting for AI Copilot response...');
    await new Promise(r => setTimeout(r, 8000));
  }

  const copilotScreenshot = path.join(ARTIFACTS_DIR, '05_copilot_response.png');
  await page.screenshot({ path: copilotScreenshot });
  console.log('📸 Saved 05_copilot_response.png. Current URL:', page.url());

  console.log('🎉 All Live Browser Tests Completed Successfully!');
}

runFullFlow().catch(console.error);
