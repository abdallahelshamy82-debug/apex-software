const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\CYBER-TECH\\.gemini\\antigravity\\brain\\79369dba-95f8-4045-96ae-4156129ab71e';

async function testTabsAndAI() {
  console.log('🚀 Testing Admin Tabs & AI Copilot Live Generation...');
  const { default: puppeteer } = await import('puppeteer-core');
  
  const loginRes = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'abdallahelshamy82@gmail.com', password: '123456' })
  });
  const authData = await loginRes.json();

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

  await page.goto('http://localhost:8081', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('apex_sec_user_token_v1', token);
    localStorage.setItem('userToken', token);
    localStorage.setItem('userData', JSON.stringify(user));
  }, { token: authData.token, user: authData.user });

  // 1. Admin Dashboard Tabs
  console.log('1️⃣ Navigating to Admin Dashboard...');
  await page.goto('http://localhost:8081/admin', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  // Click on "الدعم الفني" tab
  console.log('Clicking "الدعم الفني" tab...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('div[role="button"], div, p, span'));
    const tab = tabs.find(el => el.textContent && el.textContent.includes('الدعم الفني'));
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '06_admin_support_tab.png') });
  console.log('📸 Saved 06_admin_support_tab.png');

  // Click on "الفواتير" tab
  console.log('Clicking "الفواتير" tab...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('div[role="button"], div, p, span'));
    const tab = tabs.find(el => el.textContent && el.textContent.includes('الفواتير'));
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '07_admin_invoices_tab.png') });
  console.log('📸 Saved 07_admin_invoices_tab.png');

  // 2. AI Copilot Generation
  console.log('2️⃣ Navigating to AI Copilot...');
  await page.goto('http://localhost:8081/copilot', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  // Click one of the quick suggestions: "أوبر توصيل أدوية"
  console.log('Clicking quick suggestion: "أوبر توصيل أدوية"...');
  await page.evaluate(() => {
    const suggestions = Array.from(document.querySelectorAll('div[role="button"], div, p, span'));
    const sugg = suggestions.find(el => el.textContent && el.textContent.includes('أوبر توصيل أدوية'));
    if (sugg) sugg.click();
  });

  // Wait 12 seconds for AI to analyze and stream response
  console.log('Waiting 12s for AI response...');
  await new Promise(r => setTimeout(r, 12000));

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '08_copilot_ai_response.png') });
  console.log('📸 Saved 08_copilot_ai_response.png');

  console.log('🎉 Tabs & AI Copilot Test Completed Successfully!');
}

testTabsAndAI().catch(console.error);
