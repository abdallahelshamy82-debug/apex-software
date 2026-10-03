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
        if (!process.env[k]) process.env[k] = v;
      }
    });
  } catch (e) {}
}

// SECURITY: no credentials are allowed in source code. DATABASE_URL must be provided
// through the environment (Vercel Project Settings or a local .env file).
const rawConnStr = (process.env.DATABASE_URL || '').trim().replace(/^["']|["']$/g, '');
const hasValidPg = rawConnStr && !rawConnStr.includes('[YOUR-PASSWORD]') && rawConnStr.startsWith('postgres');

if (!hasValidPg && (process.env.VERCEL || process.env.NODE_ENV === 'production')) {
  throw new Error('FATAL: DATABASE_URL must be set in production. Refusing to start.');
}

let pool = null;
if (hasValidPg) {
  try {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: rawConnStr,
      ssl: { rejectUnauthorized: false },
      // Serverless-friendly settings: few connections per instance, fail fast.
      max: process.env.VERCEL ? 3 : 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 8000, // Neon may need a few seconds to wake from idle suspend
      allowExitOnIdle: true
    });
    pool.on('error', (e) => console.warn('PG pool idle client error:', e.message));
    console.log(' PostgreSQL connection pool initialized.');
  } catch (e) {
    console.error('Failed to initialize PG pool:', e);
  }
}

// Prepare SQLite database only if PostgreSQL is not active
let sqliteDb = null;
if (!hasValidPg) {
  try {
    const sqlite3 = require('sqlite3').verbose();
    let sqliteDbPath = path.resolve(__dirname, 'database.sqlite');
    if (process.env.VERCEL) {
      const tmpDbPath = '/tmp/database.sqlite';
      try {
        if (!fs.existsSync(tmpDbPath)) {
          if (fs.existsSync(sqliteDbPath)) {
            fs.copyFileSync(sqliteDbPath, tmpDbPath);
            console.log('Copied database.sqlite to /tmp/database.sqlite');
          }
        }
        sqliteDbPath = tmpDbPath;
      } catch (e) {
        console.error('Error copying sqlite to /tmp:', e);
      }
    }

    sqliteDb = new sqlite3.Database(sqliteDbPath, (err) => {
      if (err) {
        console.error('Error opening SQLite database:', err);
      } else {
        console.log(' Connected to SQLite database at:', sqliteDbPath);
        sqliteDb.run('PRAGMA journal_mode = WAL;', () => {});
      }
    });
  } catch (e) {
    console.warn('SQLite not available or not loaded:', e.message);
  }
}

// Helper: Convert SQLite SQL to PostgreSQL SQL
const camelMap = { 
  fullname: "fullName", 
  avatarurl: "avatarUrl", 
  resetcode: "resetCode", 
  resetcodeexpires: "resetCodeExpires", 
  projectname: "projectName", 
  projectphase: "projectPhase", 
  projectprogress: "projectProgress", 
  projecttasks: "projectTasks", 
  projectdeliverables: "projectDeliverables", 
  pushtoken: "pushToken", 
  deviceid: "deviceId", 
  createdat: "createdAt", 
  userid: "userId", 
  senderrole: "senderRole", 
  attachmenturl: "attachmentUrl", 
  clientmsgid: "clientMsgId", 
  projecttype: "projectType", 
  aianalysis: "aiAnalysis", 
  companyname: "companyName", 
  companyemail: "companyEmail", 
  companyphone: "companyPhone", 
  taxid: "taxId", 
  bankname: "bankName", 
  bankaccount: "bankAccount", 
  bankiban: "bankIban", 
  instapayhandle: "instapayHandle", 
  vodafonecash: "vodafoneCash", 
  quoteid: "quoteId", 
  invoicenumber: "invoiceNumber", 
  paymentmethod: "paymentMethod", 
  duedate: "dueDate", 
  receipturl: "receiptUrl", 
  paidat: "paidAt",
  clientname: "clientName",
  clientemail: "clientEmail",
  clientcompany: "clientCompany",
  clientphone: "clientPhone"
}; 

function mapKeys(row) { 
  if (!row) return row; 
  const newRow = { ...row }; 
  for (const k in row) { 
    const camel = camelMap[k];
    if (camel) {
      newRow[camel] = row[k];
    }
  } 
  return newRow; 
}
function convertSql(sql) {
  let pgSql = sql;
  pgSql = pgSql.replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
  pgSql = pgSql.replace(/DATETIME/gi, 'TIMESTAMP');
  pgSql = pgSql.replace(/ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS)/gi, 'ALTER TABLE $1 ADD COLUMN IF NOT EXISTS ');
  pgSql = pgSql.replace(/IFNULL\s*\(/gi, 'COALESCE(');
  let i = 1;
  pgSql = pgSql.replace(/\?/g, () => `$${i++}`);
  return pgSql;
}

module.exports = {
  serialize: (cb) => {
    if (sqliteDb) sqliteDb.serialize(cb);
    else if (cb) cb();
  },

  run: function(sql, params = [], cb) {
    if (typeof params === 'function') {
      cb = params;
      params = [];
    }

    if (pool) {
      let pgSql = convertSql(sql);
      const isInsert = /^\s*INSERT/i.test(pgSql);
      if (isInsert && !/RETURNING/i.test(pgSql)) {
        if (/INTO\s+email_verifications/i.test(pgSql)) {
          pgSql += ' RETURNING email';
        } else {
          pgSql += ' RETURNING id';
        }
      }

      pool.query(pgSql, params, (err, res) => {
        if (!err) {
          if (cb) {
            const firstRow = (isInsert && res.rows && res.rows.length) ? res.rows[0] : null;
            const context = {
              lastID: firstRow ? (firstRow.id || firstRow.email) : null,
              changes: res.rowCount || 0
            };
            return cb.call(context, null);
          }
          return;
        }

        console.warn('Postgres run error, falling back to SQLite:', err.message);
        if (sqliteDb) {
          return sqliteDb.run(sql, params, cb);
        }
        if (cb) cb(err);
      });
    } else if (sqliteDb) {
      sqliteDb.run(sql, params, cb);
    } else if (cb) {
      cb(new Error('No database available'));
    }
  },

  get: function(sql, params = [], cb) {
    if (typeof params === 'function') {
      cb = params;
      params = [];
    }

    if (pool) {
      pool.query(convertSql(sql), params, (err, res) => {
        if (!err) {
          if (cb) cb(null, res.rows && res.rows.length ? mapKeys(res.rows[0]) : null);
          return;
        }

        console.warn('Postgres get error, falling back to SQLite:', err.message);
        if (sqliteDb) {
          return sqliteDb.get(sql, params, cb);
        }
        if (cb) cb(err, null);
      });
    } else if (sqliteDb) {
      sqliteDb.get(sql, params, cb);
    } else if (cb) {
      cb(new Error('No database available'), null);
    }
  },

  all: function(sql, params = [], cb) {
    if (typeof params === 'function') {
      cb = params;
      params = [];
    }

    if (pool) {
      pool.query(convertSql(sql), params, (err, res) => {
        if (!err) {
          if (cb) cb(null, res.rows ? res.rows.map(mapKeys) : []);
          return;
        }

        console.warn('Postgres all error, falling back to SQLite:', err.message);
        if (sqliteDb) {
          return sqliteDb.all(sql, params, cb);
        }
        if (cb) cb(err, []);
      });
    } else if (sqliteDb) {
      sqliteDb.all(sql, params, cb);
    } else if (cb) {
      cb(new Error('No database available'), []);
    }
  }
};
