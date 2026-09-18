const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const targetEmail = process.argv[2] ? process.argv[2].trim().toLowerCase() : null;
const customPassword = process.argv[3] || '123456';

if (!targetEmail) {
  console.log('\n❌ برجاء تحديد البريد الإلكتروني:');
  console.log('الاستخدام: npm run make-admin <email> [password]');
  console.log('مثال: npm run make-admin admin@example.com your-password\n');
  process.exit(1);
}

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));
const hashedPassword = bcrypt.hashSync(customPassword, 10);

db.get('SELECT * FROM users WHERE LOWER(email) = ?', [targetEmail], (err, user) => {
  if (err) {
    console.error('❌ Database error:', err);
    process.exit(1);
  }

  if (user) {
    db.run(
      'UPDATE users SET role = ?, password = ? WHERE id = ?',
      ['admin', hashedPassword, user.id],
      (updErr) => {
        if (updErr) console.error('❌ Error updating user:', updErr);
        else console.log(`\n🎉 تم بنجاح! المستخدم "${targetEmail}" أصبح مديراً (Admin) بكلمة مرور: "${customPassword}"\n`);
        db.close();
        process.exit(0);
      }
    );
  } else {
    const fullName = targetEmail.split('@')[0] + ' (Admin)';
    db.run(
      'INSERT INTO users (fullName, email, company, password, role) VALUES (?, ?, ?, ?, ?)',
      [fullName, targetEmail, 'Apex Software Agency', hashedPassword, 'admin'],
      function(insErr) {
        if (insErr) {
          console.error('❌ Error creating user:', insErr);
        } else {
          console.log(`\n🎉 تم بنجاح! تم إنشاء حساب مدير جديد (Admin): "${targetEmail}" بكلمة مرور: "${customPassword}"\n`);
        }
        db.close();
        process.exit(0);
      }
    );
  }
});
