/**
 * Database schema creation and migrations.
 *
 * IMPORTANT: this used to run inside server.js on every cold start. On Vercel (Hobby, 10s limit)
 * that meant dozens of remote Postgres round trips before the first request could be served.
 * It now runs ONLY from `npm run migrate` (and automatically on local development, i.e. when
 * not running in production). Every statement is idempotent and safe to re-run.
 */
const bcrypt = require('bcryptjs');

const exec = (db, sql, params = []) =>
  new Promise((resolve) => {
    db.run(sql, params, function (err) {
      resolve({ err: err || null, ctx: this });
    });
  });

const fetchOne = (db, sql, params = []) =>
  new Promise((resolve) => db.get(sql, params, (err, row) => resolve(err ? null : row)));

const fetchAll = (db, sql, params = []) =>
  new Promise((resolve) => db.all(sql, params, (err, rows) => resolve(err ? [] : rows || [])));

async function runMigrations(db, log = console.log) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT,
      email TEXT UNIQUE,
      company TEXT,
      password TEXT,
      role TEXT DEFAULT 'client',
      isAdmin INTEGER DEFAULT 0,
      phone TEXT,
      avatarUrl TEXT,
      resetCode TEXT,
      resetCodeExpires INTEGER,
      projectName TEXT,
      projectPhase TEXT,
      projectProgress INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS email_verifications (
      email TEXT PRIMARY KEY,
      code TEXT,
      fullName TEXT,
      password TEXT,
      company TEXT,
      expires BIGINT,
      deviceId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      platform TEXT,
      features TEXT,
      totalCost INTEGER,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      quoteId INTEGER,
      invoiceNumber TEXT,
      title TEXT,
      amount INTEGER,
      date TEXT,
      status TEXT DEFAULT 'PENDING',
      receiptUrl TEXT,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      senderRole TEXT,
      text TEXT,
      attachmentUrl TEXT,
      type TEXT DEFAULT 'text',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS agency_settings (
      id INTEGER PRIMARY KEY,
      companyName TEXT,
      companyPhone TEXT,
      companyEmail TEXT,
      taxId TEXT,
      vodafoneCash TEXT,
      bankName TEXT,
      bankAccount TEXT,
      bankIban TEXT,
      instapayHandle TEXT,
      address TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ];
  for (const sql of tables) {
    const { err } = await exec(db, sql);
    if (err) log('Migration warning (create table):', err.message);
  }

  const seed = await fetchOne(db, `SELECT * FROM agency_settings WHERE id = 1`);
  if (!seed) {
    await exec(
      db,
      `INSERT INTO agency_settings (id, companyName, companyPhone, companyEmail, taxId, vodafoneCash, bankName, bankAccount, bankIban, instapayHandle, address)
       VALUES (1, 'Magixa Agency', '+20 100 000 0000', 'contact@magixa.com', 'TX-948201-EG', '01000000000', 'CIB (Commercial International Bank)', '100029384729', 'EG1200000000100029384729', 'magixa@instapay', 'Cairo, Egypt')`
    );
  }

  const columns = {
    users: ['isAdmin', 'phone', 'avatarUrl', 'resetCode', 'resetCodeExpires', 'projectName', 'projectPhase', 'projectProgress', 'projectTasks', 'projectDeliverables', 'pushToken', 'deviceId'],
    invoices: ['quoteId', 'title', 'receiptUrl', 'notes', 'createdAt'],
    quotes: ['source', 'aiAnalysis'],
    messages: ['attachment', 'sender', 'timestamp', 'clientMsgId'],
  };
  for (const [table, cols] of Object.entries(columns)) {
    for (const col of cols) {
      await exec(db, `ALTER TABLE ${table} ADD COLUMN ${col} TEXT`); // errors (already exists) are expected
    }
  }

  // Remove duplicated chat messages
  await exec(
    db,
    `DELETE FROM messages WHERE id NOT IN (SELECT MIN(id) FROM messages GROUP BY userId, senderRole, text, IFNULL(attachmentUrl, ''), IFNULL(clientMsgId, ''))`
  );

  // Security: hash any legacy plaintext passwords so plaintext comparison can be removed from login.
  const users = await fetchAll(db, `SELECT id, password FROM users`);
  let hashed = 0;
  for (const u of users) {
    const pw = u.password;
    if (pw && !String(pw).startsWith('$2')) {
      await exec(db, `UPDATE users SET password = ? WHERE id = ?`, [await bcrypt.hash(String(pw), 10), u.id]);
      hashed++;
    }
  }
  if (hashed) log(`Migrated ${hashed} legacy plaintext password(s) to bcrypt.`);

  // Brand rename: Apex -> Magixa (idempotent)
  await exec(db, `UPDATE agency_settings SET companyName = 'Magixa Agency' WHERE companyName = 'Apex Software Agency'`);
  await exec(db, `UPDATE users SET company = 'Magixa Client' WHERE company = 'Apex Client'`);

  log('Migrations completed.');
}

module.exports = { runMigrations };
