// Usage: npm run migrate   (requires DATABASE_URL in the environment or in .env)
const db = require('./database');
const { runMigrations } = require('./migrations');

runMigrations(db)
  .then(() => setTimeout(() => process.exit(0), 500))
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  });
