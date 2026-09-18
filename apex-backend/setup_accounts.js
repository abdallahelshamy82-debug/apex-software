const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const defaultPassword = '123456';
const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

const sampleTasks = JSON.stringify([
  { id: '1', title: 'دراسة المتطلبات وهيكلية المتجر', completed: true },
  { id: '2', title: 'تصميم نموذج الهوية والواجهات (Figma)', completed: true },
  { id: '3', title: 'تطوير وبرمجة الواجهات والباك إند', completed: false },
  { id: '4', title: 'فحص الجودة وربط بوابات الدفع والتسليم', completed: false }
]);

const sampleDeliverables = JSON.stringify([
  { id: 'del-1', title: 'الرابط التجريبي الحي (Staging Web)', url: 'https://staging.apexsoftware.agency', type: 'staging' },
  { id: 'del-2', title: 'تصميم فيجما التفاعلي (Figma Prototype)', url: 'https://figma.com/@apex/ecommerce-ui', type: 'figma' }
]);

async function setup() {
  console.log('--- Setting up Admin & Client Accounts ---');

  // 1. Admin 1: abdallahelshamy82@gmail.com
  await new Promise((resolve) => {
    db.get(`SELECT id FROM users WHERE LOWER(email) = 'abdallahelshamy82@gmail.com'`, (err, user) => {
      if (user) {
        db.run(`UPDATE users SET fullName = 'AbdAllah Elshamy (Admin)', role = 'admin', company = 'Apex Software Agency', password = ? WHERE id = ?`,
          [hashedPassword, user.id], (updErr) => {
            console.log('✅ Admin 1 updated: abdallahelshamy82@gmail.com (Pass: 123456)');
            resolve();
          });
      } else {
        db.run(`INSERT INTO users (fullName, email, company, password, role) VALUES ('AbdAllah Elshamy (Admin)', 'abdallahelshamy82@gmail.com', 'Apex Software Agency', ?, 'admin')`,
          [hashedPassword], (insErr) => {
            console.log('✅ Admin 1 created: abdallahelshamy82@gmail.com (Pass: 123456)');
            resolve();
          });
      }
    });
  });


  // 3. Client: auabdullah973@gmail.com
  await new Promise((resolve) => {
    const email = 'auabdullah973@gmail.com';
    db.get(`SELECT id FROM users WHERE LOWER(email) = ?`, [email], (err, user) => {
      if (user) {
        db.run(`UPDATE users SET 
          fullName = 'Abdullah (Client)',
          role = 'client',
          company = 'Abdullah Tech',
          phone = '+20 100 987 6543',
          password = ?,
          projectName = 'تطبيق متجر إلكتروني متكامل',
          projectPhase = '🎨 التصميم UI/UX واجهات المستخدم',
          projectProgress = 40,
          projectTasks = ?,
          projectDeliverables = ?
          WHERE id = ?`,
          [hashedPassword, sampleTasks, sampleDeliverables, user.id], (updErr) => {
            console.log('✅ Client updated: auabdullah973@gmail.com (Pass: 123456)');
            createClientOrderData(user.id, email, resolve);
          });
      } else {
        db.run(`INSERT INTO users (fullName, email, company, phone, password, role, projectName, projectPhase, projectProgress, projectTasks, projectDeliverables)
          VALUES ('Abdullah (Client)', ?, 'Abdullah Tech', '+20 100 987 6543', ?, 'client', 'تطبيق متجر إلكتروني متكامل', '🎨 التصميم UI/UX واجهات المستخدم', 40, ?, ?)`,
          [email, hashedPassword, sampleTasks, sampleDeliverables], function(insErr) {
            console.log('✅ Client created: auabdullah973@gmail.com (Pass: 123456)');
            createClientOrderData(this.lastID, email, resolve);
          });
      }
    });
  });

  console.log('\n--- Accounts Setup Completed Successfully ---');
}

function createClientOrderData(userId, email, done) {
  db.get(`SELECT id FROM quotes WHERE email = ?`, [email], (qErr, quote) => {
    const platforms = JSON.stringify(['web', 'android']);
    const features = JSON.stringify({
      features: ['واجهة مستخدم احترافية وتصميم فخم', 'بوابات دفع وتحويلات فودافون كاش وبنك', 'لوحة تحكم إدارة المنتجات والطلبات'],
      extras: ['دعم فني وضمان سنة شامل', 'نطاق واستضافة سحابية فائقة السرعة'],
      time: '30 يوم عمل'
    });

    if (!quote) {
      db.run(`INSERT INTO quotes (email, platform, features, totalCost, status) VALUES (?, ?, ?, 1300, 'approved')`,
        [email, platforms, features], function(err) {
          const quoteId = this.lastID;
          createClientInvoice(userId, quoteId, done);
        });
    } else {
      createClientInvoice(userId, quote.id, done);
    }
  });
}

function createClientInvoice(userId, quoteId, done) {
  db.get(`SELECT id FROM invoices WHERE userId = ?`, [userId], (invErr, inv) => {
    if (!inv) {
      db.run(`INSERT INTO invoices (userId, quoteId, invoiceNumber, title, amount, date, status, notes)
        VALUES (?, ?, 'INV-109281', 'دفعة التعاقد الأولى وتصميم الواجهات (50%)', 650, 'Sep 7, 2026', 'PENDING', 'مستحقة السداد عبر فودافون كاش أو انستاباي أو التحويل البنكي')`,
        [userId, quoteId], () => {
          console.log('✅ Created initial project quote & invoice for client');
          done();
        });
    } else {
      done();
    }
  });
}

setup();
