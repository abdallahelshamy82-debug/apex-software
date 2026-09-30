const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');
c = c.replace(
  "const uploadsDir = path.join(__dirname, 'uploads');",
  "let uploadsDir = path.join(__dirname, 'uploads');\nif (process.env.VERCEL) uploadsDir = '/tmp/uploads';"
);
c = c.replace(
  "if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);",
  "if (!fs.existsSync(uploadsDir)) { try { fs.mkdirSync(uploadsDir); } catch(e){} }"
);
fs.writeFileSync('server.js', c);
