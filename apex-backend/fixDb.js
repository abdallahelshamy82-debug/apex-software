const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("ALTER TABLE messages ADD COLUMN attachmentUrl TEXT", (err) => {
    if (err) console.log("attachmentUrl already exists or error: ", err.message);
    else console.log("Added attachmentUrl column.");
  });
  
  db.run("ALTER TABLE messages ADD COLUMN type TEXT DEFAULT 'text'", (err) => {
    if (err) console.log("type already exists or error: ", err.message);
    else console.log("Added type column.");
  });
});

setTimeout(() => {
  console.log("DB Migration done.");
  db.close();
}, 1000);
