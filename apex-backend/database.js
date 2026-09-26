const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ ERROR: DATABASE_URL is missing in .env file.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL Database (Supabase).');
});

// Helper: Convert SQLite SQL to PostgreSQL SQL
function convertSql(sql) {
  let pgSql = sql;
  
  // Replace SQLite specific auto-increment
  pgSql = pgSql.replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
  
  // Replace DATETIME with TIMESTAMP
  pgSql = pgSql.replace(/DATETIME/gi, 'TIMESTAMP');
  
  // Convert ? to $1, $2, $3...
  let i = 1;
  pgSql = pgSql.replace(/\?/g, () => `$${i++}`);
  
  return pgSql;
}

// Mimic SQLite API
module.exports = {
  serialize: (cb) => {
    if (cb) cb();
  },
  
  run: (sql, params = [], cb) => {
    if (typeof params === 'function') {
      cb = params;
      params = [];
    }
    
    let pgSql = convertSql(sql);
    
    const isInsert = /^\s*INSERT/i.test(pgSql);
    if (isInsert && !/RETURNING/i.test(pgSql)) {
      pgSql += ' RETURNING id';
    }

    pool.query(pgSql, params, (err, res) => {
      if (cb) {
        if (err) return cb(err);
        
        const context = {
          lastID: (isInsert && res.rows && res.rows.length) ? res.rows[0].id : null,
          changes: res.rowCount || 0
        };
        cb.call(context, null);
      }
    });
  },
  
  get: (sql, params = [], cb) => {
    if (typeof params === 'function') {
      cb = params;
      params = [];
    }
    pool.query(convertSql(sql), params, (err, res) => {
      if (err) {
        if (cb) cb(err, null);
      } else {
        if (cb) cb(null, res.rows.length ? res.rows[0] : null);
      }
    });
  },
  
  all: (sql, params = [], cb) => {
    if (typeof params === 'function') {
      cb = params;
      params = [];
    }
    pool.query(convertSql(sql), params, (err, res) => {
      if (err) {
        if (cb) cb(err, []);
      } else {
        if (cb) cb(null, res.rows || []);
      }
    });
  }
};
