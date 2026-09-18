const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Auto-load .env from current directory if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        process.env[k] = v;
      }
    });
  } catch (e) {}
}

let GMAIL_USER = process.env.GMAIL_USER || process.env.SMTP_USER || '';
let GMAIL_PASS = process.env.GMAIL_PASS || process.env.SMTP_PASS || '';
let SMTP_HOST = process.env.SMTP_HOST || '';
let SMTP_PORT = process.env.SMTP_PORT || 587;
let transporter = null;
const sentEmailsHistory = [];

function initTransporter(user, pass, host, port) {
  try {
    if (host && user && pass) {
      transporter = nodemailer.createTransport({
        host: host.trim(),
        port: Number(port) || 587,
        secure: Number(port) === 465,
        auth: {
          user: user.trim(),
          pass: pass.trim()
        }
      });
      console.log(`📧 Email service initialized with Custom SMTP (${host})`);
      return true;
    } else if (user && pass) {
      GMAIL_USER = user.trim();
      GMAIL_PASS = pass.trim();
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_PASS
        }
      });
      console.log(`📧 Email service initialized with Gmail (${GMAIL_USER})`);
      return true;
    } else {
      transporter = null;
      return false;
    }
  } catch (err) {
    console.error('Error initializing email transporter:', err);
    transporter = null;
    return false;
  }
}

if ((SMTP_HOST && GMAIL_USER && GMAIL_PASS) || (GMAIL_USER && GMAIL_PASS)) {
  initTransporter(GMAIL_USER, GMAIL_PASS, SMTP_HOST, SMTP_PORT);
} else {
  console.log('ℹ️ Gmail credentials not set (GMAIL_USER, GMAIL_PASS). Email service running in simulation / preview mode.');
}

// Common email wrapper template with Apex Software branding
const getHtmlTemplate = (title, contentHtml) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0ea5e9, #0284c7); padding: 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1px; }
    .header p { margin: 6px 0 0; opacity: 0.9; font-size: 14px; }
    .body { padding: 30px; color: #334155; line-height: 1.7; font-size: 15px; text-align: right; }
    .badge { display: inline-block; background-color: #e0f2fe; color: #0284c7; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 13px; margin: 10px 0; }
    .card-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .progress-bar-bg { background: #e2e8f0; border-radius: 10px; height: 12px; overflow: hidden; margin: 12px 0; }
    .progress-bar-fill { background: #0ea5e9; height: 100%; border-radius: 10px; }
    .btn { display: inline-block; background: #0ea5e9; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: bold; margin-top: 20px; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>APEX DEVS ⚡</h1>
      <p>وكالة تطوير البرمجيات والتطبيقات الذكية</p>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${contentHtml}
      <div style="text-align: center;">
        <a href="https://apex-software.com" class="btn">فتح بوابة العميل (Apex Portal)</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2026 Apex Software Inc. جميع الحقوق محفوظة.</p>
      <p>إذا لم تكن أنت صاحب هذا الحساب، يرجى تجاهل هذه الرسالة.</p>
    </div>
  </div>
</body>
</html>
`;

// Helper to send or log
async function sendMail({ to, subject, html }) {
  const emailRecord = {
    id: Date.now() + Math.random().toString(36).substring(2, 6),
    to,
    subject,
    html,
    timestamp: new Date().toISOString(),
    status: 'pending'
  };

  if (transporter) {
    try {
      const plainText = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                            .replace(/<[^>]+>/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();

      const info = await transporter.sendMail({
        from: `"Apex Software" <${GMAIL_USER}>`,
        to,
        subject,
        text: plainText,
        html
      });
      console.log(`✅ [Gmail] Real email delivered to ${to} (ID: ${info.messageId})`);
      emailRecord.status = 'delivered';
      emailRecord.messageId = info.messageId;
      sentEmailsHistory.unshift(emailRecord);
      if (sentEmailsHistory.length > 50) sentEmailsHistory.pop();
      return { success: true, messageId: info.messageId, delivered: true };
    } catch (err) {
      console.error(`❌ [Gmail Error] Failed to send email to ${to}:`, err.message);
      emailRecord.status = 'failed';
      emailRecord.error = err.message;
      sentEmailsHistory.unshift(emailRecord);
      return { success: false, error: err.message, delivered: false };
    }
  } else {
    console.log('\n================== 📧 [EMAIL PREVIEW / SIMULATION] ==================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content Title: ${subject}`);
    console.log(`(Configure GMAIL_USER and GMAIL_PASS in .env to deliver real emails)`);
    console.log('====================================================================\n');
    emailRecord.status = 'simulated';
    sentEmailsHistory.unshift(emailRecord);
    if (sentEmailsHistory.length > 50) sentEmailsHistory.pop();
    return { success: true, simulated: true, delivered: false };
  }
}

// 1. Welcome Email
async function sendWelcomeEmail({ to, fullName }) {
  const title = `أهلاً بك في عائلة Apex، ${fullName || 'عميلنا العزيز'}! 👋`;
  const contentHtml = `
    <p>يسعدنا انضمامك إلى بوابة عملاء <strong>Apex Software</strong>.</p>
    <p>من خلال حسابك يمكنك:</p>
    <ul>
      <li>متابعة مراحل ونسبة إنجاز مشروعك لحظة بلحظة.</li>
      <li>التواصل المباشر مع فريق التطوير عبر الدردشة الفورية.</li>
      <li>إرسال واستقبال الملفات والبرمجيات حتى 200 ميجابايت.</li>
      <li>مراجعة الفواتير وإيصالات الدفع.</li>
    </ul>
    <p>فريقنا التقني مستعد دائماً لتحويل أفكارك إلى واقع رقمي مبهر.</p>
  `;
  return sendMail({
    to,
    subject: 'مرحباً بك في Apex Software 🚀',
    html: getHtmlTemplate(title, contentHtml)
  });
}

// 2. Project Update Email
async function sendProjectUpdateEmail({ to, fullName, projectName, projectPhase, projectProgress }) {
  const title = `تحديث جديد في مشروعك: ${projectName || 'مشروعك'}`;
  const progressPercent = projectProgress || 0;
  const contentHtml = `
    <p>مرحباً ${fullName || 'عميلنا العزيز'}،</p>
    <p>يسر فريق العمل إعلامك بوجود تقدم جديد في مشروعك البرمجي لدى <strong>Apex Software</strong>:</p>
    
    <div class="card-box">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>اسم المشروع:</strong>
        <span>${projectName || 'تطبيق رقمي'}</span>
      </div>
      <div style="margin-top: 10px;">
        <strong>المرحلة الحالية:</strong>
        <span class="badge">${projectPhase || 'قيد التطوير'}</span>
      </div>
      <div style="margin-top: 15px;">
        <strong>نسبة الإنجاز:</strong> <strong>${progressPercent}%</strong>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
        </div>
      </div>
    </div>

    <p>يمكنك الدخول إلى لوحة التحكم الآن لمتابعة التفاصيل أو التحدث مع المطورين مباشرة عبر الشات.</p>
  `;
  return sendMail({
    to,
    subject: `🔔 تحديث جديد في مشروعك (${projectName || 'Apex'}) - نسبة الإنجاز ${progressPercent}%`,
    html: getHtmlTemplate(title, contentHtml)
  });
}

// 3. Quote Confirmation Email
async function sendQuoteConfirmationEmail({ to, fullName, details }) {
  const title = 'تم استلام طلبك لعرض السعر بنجاح 📋';
  const platforms = Array.isArray(details.platforms) ? details.platforms.join(', ') : 'منصات متعددة';
  const contentHtml = `
    <p>مرحباً ${fullName || 'عميلنا العزيز'}،</p>
    <p>شكراً لاستخدامك <strong>المُسعّر الذكي</strong> الخاص بـ Apex Software. لقد تم استلام تفاصيل مشروعك وسيقوم فريقنا بمراجعتها والتواصل معك.</p>
    
    <div class="card-box">
      <p><strong>المنصات المطلوبة:</strong> ${platforms}</p>
      <p><strong>التكلفة التقديرية:</strong> <span style="font-size: 18px; color: #0ea5e9; font-weight: bold;">$${details.estimatedCost || 0}</span></p>
      <p><strong>المدة الزمنية المتوقعة:</strong> <strong>${details.estimatedTime || 'قيد التقدير'}</strong></p>
    </div>

    <p>سيتواصل معك مهندس المشاريع قريباً عبر الدردشة الفورية لمناقشة بدء العمل.</p>
  `;
  return sendMail({
    to,
    subject: '📋 تأكيد استلام عرض السعر - Apex Software',
    html: getHtmlTemplate(title, contentHtml)
  });
}

function getWelcomeHtml(fullName = 'عميلنا العزيز') {
  const title = `أهلاً بك في عائلة Apex، ${fullName}! 👋`;
  const contentHtml = `
    <p>يسعدنا انضمامك إلى بوابة عملاء <strong>Apex Software</strong>.</p>
    <p>من خلال حسابك يمكنك:</p>
    <ul>
      <li>متابعة مراحل ونسبة إنجاز مشروعك لحظة بلحظة.</li>
      <li>التواصل المباشر مع فريق التطوير عبر الدردشة الفورية.</li>
      <li>إرسال واستقبال الملفات والبرمجيات حتى 200 ميجابايت.</li>
      <li>مراجعة الفواتير وإيصالات الدفع.</li>
    </ul>
    <p>فريقنا التقني مستعد دائماً لتحويل أفكارك إلى واقع رقمي مبهر.</p>
  `;
  return getHtmlTemplate(title, contentHtml);
}

function getProjectUpdateHtml(projectName = 'تطبيق المتجر الإلكتروني', projectPhase = 'تصميم الواجهات (UI/UX)', projectProgress = 45, fullName = 'أحمد العميل') {
  const title = `تحديث جديد في مشروعك: ${projectName}`;
  const contentHtml = `
    <p>مرحباً ${fullName}،</p>
    <p>يسر فريق العمل إعلامك بوجود تقدم جديد في مشروعك البرمجي لدى <strong>Apex Software</strong>:</p>
    
    <div class="card-box">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>اسم المشروع:</strong>
        <span>${projectName}</span>
      </div>
      <div style="margin-top: 10px;">
        <strong>المرحلة الحالية:</strong>
        <span class="badge">${projectPhase}</span>
      </div>
      <div style="margin-top: 15px;">
        <strong>نسبة الإنجاز:</strong> <strong>${projectProgress}%</strong>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${projectProgress}%;"></div>
        </div>
      </div>
    </div>

    <p>يمكنك الدخول إلى لوحة التحكم الآن لمتابعة التفاصيل أو التحدث مع المطورين مباشرة عبر الشات.</p>
  `;
  return getHtmlTemplate(title, contentHtml);
}

async function sendPasswordResetEmail({ to, fullName, code }) {
  const title = '🔐 كود استعادة كلمة المرور - Apex Software';
  const contentHtml = `
    <p>مرحباً ${fullName}،</p>
    <p>لقد استلمنا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك على منصة <strong>Apex Software</strong>.</p>
    <div class="card-box" style="text-align: center; padding: 25px;">
      <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">كود التحقق السري الخاص بك (صالح لمدة 15 دقيقة):</p>
      <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #0284c7; background: #e0f2fe; padding: 12px 20px; border-radius: 12px; display: inline-block;">
        ${code}
      </div>
    </div>
    <p style="color: #ef4444; font-size: 13px;">⚠️ إذا لم تطلب استعادة كلمة المرور، يرجى تجاهل هذا البريد وعدم مشاركة هذا الرمز مع أي شخص.</p>
  `;
  const html = getHtmlTemplate(title, contentHtml);
  return await sendMail({ to, subject: `[Apex Security] كود استعادة كلمة المرور: ${code}`, html });
}

async function sendNewInvoiceEmail({ to, fullName, invoiceNumber, amount, title: invoiceTitle }) {
  const title = `📄 تم إصدار فاتورة جديدة #${invoiceNumber}`;
  const contentHtml = `
    <p>مرحباً ${fullName}،</p>
    <p>تم إصدار فاتورة جديدة لحسابك في <strong>Apex Software</strong>:</p>
    <div class="card-box">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <strong>رقم الفاتورة:</strong>
        <span>#${invoiceNumber}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <strong>البيان:</strong>
        <span>${invoiceTitle || 'دفعة تطوير برمجيات'}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <strong>المبلغ المستحق:</strong>
        <span style="color: #0284c7; font-size: 18px; font-weight: bold;">$${amount}</span>
      </div>
    </div>
    <p>يمكنك مراجعة تفاصيل الفاتورة وإتمام الدفع أو رفع إيصال التحويل عبر بوابة العميل.</p>
  `;
  const html = getHtmlTemplate(title, contentHtml);
  return await sendMail({ to, subject: `[Apex Invoicing] تم إصدار فاتورة جديدة #${invoiceNumber}`, html });
}

async function sendPaymentConfirmedEmail({ to, fullName, invoiceNumber, amount }) {
  const title = `✅ تأكيد سداد الفاتورة #${invoiceNumber}`;
  const contentHtml = `
    <p>مرحباً ${fullName}،</p>
    <p>يسعدنا إبلاغك بأنه تم تأكيد واعتماد دفعتك بنجاح للفاتورة <strong>#${invoiceNumber}</strong> بمبلغ <strong>$${amount}</strong>.</p>
    <div class="card-box" style="border-color: #10b981; background: #ecfdf5;">
      <p style="color: #065f46; font-weight: bold; margin: 0;">🎉 شكراً لثقتكم بنا! جاري استكمال مراحل مشروعك بأعلى درجات الاحترافية.</p>
    </div>
  `;
  const html = getHtmlTemplate(title, contentHtml);
  return await sendMail({ to, subject: `[Apex Billing] تم تأكيد سداد الفاتورة #${invoiceNumber} بنجاح`, html });
}

// Seed initial sample emails if empty for admin preview
if (sentEmailsHistory.length === 0) {
  sentEmailsHistory.push({
    id: 'demo-proj-update',
    to: 'abdallahelshamy82@gmail.com',
    subject: '🔔 تحديث جديد في مشروعك (تطبيق المتجر الإلكتروني) - نسبة الإنجاز 50%',
    timestamp: new Date().toISOString(),
    status: 'simulated',
    html: getProjectUpdateHtml('تطبيق المتجر الإلكتروني الذكي', '💻 قيد البرمجة والتطوير', 50, 'عبدالله الشامي')
  });
  sentEmailsHistory.push({
    id: 'demo-quote-confirm',
    to: 'auabdullah973@gmail.com',
    subject: '📋 تأكيد استلام عرض السعر - Apex Software',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'simulated',
    html: getHtmlTemplate('تم استلام طلبك لعرض السعر بنجاح 📋', `
      <p>مرحباً <strong>عميلنا العزيز</strong>،</p>
      <p>شكراً لاستخدامك <strong>المُسعّر الذكي</strong> الخاص بـ Apex Software. لقد تم استلام تفاصيل مشروعك وسيقوم فريقنا بمراجعتها والتواصل معك.</p>
      <div class="card-box">
        <p><strong>المنصات المطلوبة:</strong> تطبيق آيفون + أندرويد + لوحة تحكم ويب</p>
        <p><strong>التكلفة التقديرية:</strong> <span style="font-size: 18px; color: #0ea5e9; font-weight: bold;">$2,400</span></p>
        <p><strong>المدة الزمنية المتوقعة:</strong> <strong>3-4 أسابيع</strong></p>
      </div>
      <p>سيتواصل معك مهندس المشاريع قريباً عبر الدردشة الفورية لمناقشة بدء العمل.</p>
    `)
  });
}

module.exports = {
  sendWelcomeEmail,
  sendProjectUpdateEmail,
  sendQuoteConfirmationEmail,
  sendPasswordResetEmail,
  sendNewInvoiceEmail,
  sendPaymentConfirmedEmail,
  getWelcomeHtml,
  getProjectUpdateHtml,
  getHtmlTemplate,
  initTransporter,
  getSentEmails: () => sentEmailsHistory,
  getConfigStatus: () => ({
    configured: !!transporter,
    user: GMAIL_USER ? GMAIL_USER.replace(/(.{3})(.*)(@.*)/, '$1***$3') : '',
    rawUser: GMAIL_USER
  })
};
