const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('database.sqlite');

db.all('SELECT id, fullName, email, role, company, projectName, projectProgress FROM users', (err, rows) => {
  if (err) {
    console.error('Error fetching users:', err);
    process.exit(1);
  }
  console.log('--- ALL USERS IN DB ---');
  console.log(JSON.stringify(rows, null, 2));

  let pending = rows.length;
  rows.forEach(r => {
    db.get('SELECT password FROM users WHERE id = ?', [r.id], (e, p) => {
      const match = p && p.password ? bcrypt.compareSync('123456', p.password) : false;
      console.log(`User: ${r.email} | Role: ${r.role} | Valid password "123456": ${match}`);
      pending--;
      if (pending === 0) {
        db.all('SELECT id, userId, invoiceNumber, amount, status FROM invoices', (iErr, invs) => {
          console.log('--- INVOICES ---');
          console.log(JSON.stringify(invs, null, 2));
          db.close();
        });
      }
    });
  });
});
