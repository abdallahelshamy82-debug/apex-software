const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Insert Admin
  db.run(`INSERT INTO users (fullName, email, company, password, role) 
          SELECT 'Ahmed (Admin)', 'admin@apex.com', 'Apex Software', '123456', 'admin' 
          WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='admin@apex.com')`);
  
  // Insert Client
  db.run(`INSERT INTO users (fullName, email, company, password, role) 
          SELECT 'Test Client', 'client@test.com', 'Test Corp', '123456', 'client' 
          WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='client@test.com')`);
  
  // Insert Demo Quote
  db.run(`INSERT INTO quotes (email, platform, features, totalCost, status) 
          VALUES ('client@test.com', 'both', '{"auth":true,"payment":true,"admin":true,"ai":false}', 3600, 'pending')`);
});

console.log("Database seeded successfully!");
db.close();
