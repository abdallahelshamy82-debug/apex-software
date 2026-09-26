const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const emailService = require('./emailService');
const aiCopilot = require('./aiCopilot');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// Load .env variables
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k && !process.env[k.trim()]) {
          process.env[k.trim()] = v.join('=').trim();
        }
      }
    }
  }
} catch (e) {}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// 🛡️ Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: false, // permits inline styling for HTML invoice print and landing preview
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.disable('x-powered-by');

// 🛡️ Prevent Directory Traversal & Sensitive File Exposure
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (p.includes('.env') || p.includes('.sqlite') || p.includes('.git') || p.includes('package.json') || p.includes('server.js')) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
});

// 🛡️ Global API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'تم تجاوز معدل الطلبات المسموح به مؤقتاً لحماية السيرفر' }
});
app.use('/api/', apiLimiter);

// 🛡️ Strict Auth Brute-Force Defense
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'تم تجاوز عدد محاولات الدخول المسموح بها. يرجى الانتظار 15 دقيقة للحماية من محاولات الاختراق.' }
});
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// 🛡️ AI Copilot Quota & DDoS Defense
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'تم بلوغ الحد الأقصى لتحليل المشاريع بالذكاء الاصطناعي لهذه الفترة لحماية الموارد.' }
});
app.use('/api/ai/analyze-project', aiLimiter);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir, {
  dotfiles: 'ignore',
  setHeaders: (res, filePath) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const ext = path.extname(filePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      res.setHeader('Content-Disposition', 'attachment');
    }
  }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', server: 'Apex Backend', timestamp: new Date().toISOString() });
});

// Root landing page for browser visits on port 3000
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Apex Software - Backend API Server</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #0B0F19; 
          color: #F8FAFC; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          min-height: 100vh; 
          padding: 20px;
        }
        .card { 
          background: #111827; 
          border: 1px solid #1F2937; 
          border-radius: 20px; 
          padding: 40px 32px; 
          max-width: 520px; 
          width: 100%; 
          text-align: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
        }
        .badge { 
          display: inline-flex; 
          align-items: center; 
          gap: 6px; 
          background: rgba(16, 185, 129, 0.15); 
          color: #10B981; 
          padding: 6px 14px; 
          border-radius: 9999px; 
          font-size: 13px; 
          font-weight: 700; 
          margin-bottom: 24px;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        h1 { 
          font-size: 26px; 
          font-weight: 800; 
          color: #38BDF8; 
          margin-bottom: 12px; 
        }
        p { 
          color: #94A3B8; 
          font-size: 15px; 
          line-height: 1.6; 
          margin-bottom: 28px; 
        }
        .btn { 
          display: block; 
          width: 100%; 
          background: #38BDF8; 
          color: #0F172A; 
          font-weight: 800; 
          font-size: 16px; 
          padding: 14px 20px; 
          border-radius: 12px; 
          text-decoration: none; 
          transition: all 0.2s ease;
          margin-bottom: 16px;
        }
        .btn:hover { 
          background: #7DD3FC; 
          transform: translateY(-2px); 
          box-shadow: 0 8px 20px rgba(56, 189, 248, 0.3);
        }
        .note { 
          font-size: 13px; 
          color: #64748B; 
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">🟢 خادم الـ API والـ Backend يعمل بنجاح (Port 3000)</div>
        <h1>خادم منصة Apex Software</h1>
        <p>هذا الرابط مخصص لخادم البيانات والـ API وقواعد البيانات.<br>لتصفح المنصة التفاعلية وتجربة التطبيق، اضغط على الزر أدناه:</p>
        <a href="http://localhost:8081" class="btn">الانتقال إلى واجهة التطبيق والمنصة (Port 8081) 🚀</a>
        <div class="note">💡 الرابط المباشر لواجهة التطبيق: <strong>http://localhost:8081</strong></div>
      </div>
    </body>
    </html>
  `);
});

// 🛡️ Hardened Multer Config with Strict Extension Whitelist & Cryptographic Renaming
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf', '.doc', '.docx', '.txt', '.mp3', '.m4a', '.wav', '.webm']);
const DANGEROUS_EXTENSIONS = new Set(['.exe', '.bat', '.cmd', '.sh', '.php', '.phtml', '.html', '.htm', '.svg', '.js', '.py', '.rb', '.dll', '.bin', '.msi', '.vbs']);

const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'audio/mpeg': '.mp3',
  'audio/m4a': '.m4a',
  'audio/mp4': '.m4a',
  'audio/webm': '.webm',
  'audio/wav': '.wav',
  'audio/x-m4a': '.m4a',
  'text/plain': '.txt',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
};

const getSafeExt = (file) => {
  let ext = path.extname(file.originalname || '').toLowerCase();
  if (!ext && file.mimetype) {
    ext = MIME_TO_EXT[file.mimetype] || '';
  }
  return ext;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = getSafeExt(file);
    if (!ALLOWED_EXTENSIONS.has(ext) || DANGEROUS_EXTENSIONS.has(ext)) {
      return cb(new Error('نوع الملف المرفوع غير مسموح به أمنياً'));
    }
    const secureName = `${Date.now()}_${crypto.randomBytes(12).toString('hex')}${ext}`;
    cb(null, secureName);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB safe limit
  fileFilter: (req, file, cb) => {
    const ext = getSafeExt(file);
    if (!ALLOWED_EXTENSIONS.has(ext) || DANGEROUS_EXTENSIONS.has(ext)) {
      return cb(new Error('نوع الملف المرفوع غير مسموح به أمنياً'), false);
    }
    cb(null, true);
  }
});

// 🛡️ High-Entropy JWT Secret from .env with Fallback
const JWT_SECRET = process.env.JWT_SECRET || 'apex_dev_jwt_secret_change_in_production';

// Database Config
const db = require('./database');
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        fullName TEXT, 
        email TEXT UNIQUE, 
        company TEXT, 
        password TEXT, 
        role TEXT DEFAULT 'client',
        phone TEXT,
        avatarUrl TEXT,
        resetCode TEXT,
        resetCodeExpires INTEGER,
        projectName TEXT,
        projectPhase TEXT,
        projectProgress INTEGER DEFAULT 0
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        email TEXT, 
        platform TEXT, 
        features TEXT, 
        totalCost INTEGER, 
        status TEXT DEFAULT 'pending', 
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS invoices (
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
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        userId INTEGER, 
        senderRole TEXT, 
        text TEXT, 
        attachmentUrl TEXT, 
        type TEXT DEFAULT 'text', 
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, 
        FOREIGN KEY(userId) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS agency_settings (
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
      )`, () => {
        db.get(`SELECT * FROM agency_settings WHERE id = 1`, [], (err, row) => {
          if (!row) {
            db.run(`INSERT INTO agency_settings (id, companyName, companyPhone, companyEmail, taxId, vodafoneCash, bankName, bankAccount, bankIban, instapayHandle, address)
              VALUES (1, 'Apex Software Agency', '+20 100 000 0000', 'contact@apex.com', 'TX-948201-EG', '01000000000', 'CIB (Commercial International Bank)', '100029384729', 'EG1200000000100029384729', 'apex@instapay', 'Cairo, Egypt')`);
          }
        });
      });

      // Safe schema migrations for existing DB instances
      const userCols = ['phone', 'avatarUrl', 'resetCode', 'resetCodeExpires', 'projectName', 'projectPhase', 'projectProgress', 'projectTasks', 'projectDeliverables', 'pushToken', 'deviceId'];
      userCols.forEach(col => { db.run(`ALTER TABLE users ADD COLUMN ${col} TEXT`, () => {}); });
      const invCols = ['quoteId', 'title', 'receiptUrl', 'notes', 'createdAt'];
      invCols.forEach(col => { db.run(`ALTER TABLE invoices ADD COLUMN ${col} TEXT`, () => {}); });
      const quoteCols = ['source', 'aiAnalysis'];
      quoteCols.forEach(col => { db.run(`ALTER TABLE quotes ADD COLUMN ${col} TEXT`, () => {}); });
      const msgCols = ['attachment', 'sender', 'timestamp', 'clientMsgId'];
      msgCols.forEach(col => { db.run(`ALTER TABLE messages ADD COLUMN ${col} TEXT`, () => {}); });
      // Clean up existing duplicates in database
      db.run(`DELETE FROM messages WHERE id NOT IN (SELECT MIN(id) FROM messages GROUP BY userId, senderRole, text, IFNULL(attachmentUrl, ''), IFNULL(clientMsgId, ''))`, () => {});
    });

// Realtime Chat (Socket.io)
io.on('connection', (socket) => {
  socket.on('join_room', (userId) => { socket.join(`chat_${userId}`); });
  socket.on('send_message', (data) => {
    const { userId, senderRole, sender, text, attachmentUrl, attachment, type, timestamp, clientMsgId, id } = data;
    const cId = clientMsgId || (typeof id === 'string' ? id : null);
    const role = senderRole || sender || 'client';
    const attStr = attachment ? (typeof attachment === 'object' ? JSON.stringify(attachment) : attachment) : null;
    const attUrl = attachmentUrl || (attachment && attachment.uri) || null;
    const msgType = type || (attachment ? (attachment.type === 'file' ? 'document' : attachment.type) : 'text');
    const msgTime = timestamp || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    const insertNew = () => {
      db.run(`INSERT INTO messages (userId, senderRole, sender, text, attachmentUrl, attachment, type, timestamp, clientMsgId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [userId, role, role, text || '', attUrl, attStr, msgType, msgTime, cId], function(err) {
          if (!err) {
            const newMsg = { 
              id: this.lastID, 
              clientMsgId: cId,
              userId, 
              senderRole: role, 
              sender: role, 
              text: text || '', 
              attachmentUrl: attUrl, 
              attachment: attachment || (attUrl ? { uri: attUrl, name: (attUrl.split('/').pop()) || 'attachment', type: msgType === 'image' ? 'image' : 'file' } : null),
              type: msgType, 
              timestamp: msgTime,
              createdAt: new Date().toISOString() 
            };
            io.to(`chat_${userId}`).emit('receive_message', newMsg);
          }
      });
    };

    if (cId) {
      db.get(`SELECT * FROM messages WHERE clientMsgId = ? AND userId = ?`, [cId, userId], (err, existing) => {
        if (existing) {
          return; // Prevent duplicate insertion
        }
        insertNew();
      });
    } else {
      insertNew();
    }
  });
});

// Helper to get all configured admin emails (built-in + .env configured)
const getAdminEmails = () => {
  const envAdmins = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    : [];
  const defaultAdmins = ['abdallahelshamy82@gmail.com'];
  return Array.from(new Set([...defaultAdmins, ...envAdmins]));
};

// Helper to check admin privileges
const isAdminUser = (user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.email) {
    const e = user.email.toLowerCase().trim();
    if (getAdminEmails().includes(e)) return true;
  }
  return false;
};

// Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Forbidden' });
    req.user = user;
    if (isAdminUser(user)) {
      req.user.isAdmin = true;
    }
    next();
  });
};

// 🛡️ Strict Admin Authorization Middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || !isAdminUser(req.user)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied: Administrator privileges required' 
    });
  }
  next();
};

// 🛡️ Centralized Admin Route Protection
app.use('/api/admin', authenticateToken, requireAdmin);

// ==================== AUTH & SECURITY ROUTES ====================

// Register
app.post('/api/register', (req, res) => {
  const { fullName, email, password, company, deviceId } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

  const normalizedEmail = email.trim().toLowerCase();
  const clientPlatform = (req.headers['x-client-platform'] || req.body.platform || '').toLowerCase();
  const isAdmin = getAdminEmails().includes(normalizedEmail);

  // 🛡️ Web restriction: Only Admin allowed on Web
  if (clientPlatform === 'web' && !isAdmin) {
    return res.status(403).json({ 
      success: false, 
      message: 'منصة الويب مخصصة للإدارة فقط. لتسجيل حسابك والحصول على عروضك، يرجى استخدام تطبيق الموبايل.' 
    });
  }

  const handleCreateOrUpdateUser = () => {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const role = isAdmin ? 'admin' : 'client';

    db.run(
      `INSERT INTO users (fullName, email, company, password, role, projectName, projectPhase, projectProgress, deviceId) VALUES (?, ?, ?, ?, ?, NULL, NULL, 0, ?)`,
      [fullName || normalizedEmail.split('@')[0], normalizedEmail, company || 'Apex Client', hashedPassword, role, deviceId || null],
      function(err) {
        if (err) {
          // If email already exists, update user password/info and login smoothly
          db.run(
            `UPDATE users SET fullName = COALESCE(?, fullName), password = ?, company = COALESCE(?, company), role = ?, deviceId = COALESCE(?, deviceId) WHERE LOWER(email) = LOWER(?)`,
            [fullName, hashedPassword, company, role, deviceId || null, normalizedEmail],
            (updErr) => {
              if (updErr) return res.status(400).json({ success: false, message: 'DB error' });
              db.get(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`, [normalizedEmail], (gErr, row) => {
                if (gErr || !row) return res.status(500).json({ success: false, message: 'User not found' });
                const user = {
                  id: row.id, fullName: row.fullName, email: row.email, role: row.role, company: row.company,
                  phone: row.phone, avatarUrl: row.avatarUrl,
                  projectName: row.projectName, projectPhase: row.projectPhase, projectProgress: row.projectProgress || 0
                };
                const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
                return res.json({ success: true, user, token });
              });
            }
          );
          return;
        }

        const user = { 
          id: this.lastID, fullName: fullName || normalizedEmail.split('@')[0], email: normalizedEmail, company: company || 'Apex Client', role, 
          phone: null, avatarUrl: null, projectName: null, projectPhase: null, projectProgress: 0 
        };
        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });

        // Send Welcome Email
        emailService.sendWelcomeEmail({ to: normalizedEmail, fullName: user.fullName }).catch(console.error);

        res.json({ success: true, user, token });
      }
    );
  };

  // 🛡️ Device Binding: 1 Account per Mobile Device (protect first-time deals)
  if (deviceId && !isAdmin && clientPlatform !== 'web') {
    db.get(
      `SELECT email FROM users WHERE deviceId = ? AND LOWER(email) != LOWER(?) AND role != 'admin'`,
      [deviceId, normalizedEmail],
      (devErr, existingDevice) => {
        if (existingDevice) {
          return res.status(400).json({
            success: false,
            message: `هذا الجهاز مسجل به حساب بالفعل مسبقاً (${existingDevice.email}). للاستفادة من خدماتنا يرجى تسجيل الدخول بحسابك الأساسي، حيث لا يُسمح بإنشاء أكثر من حساب واحد لكل هاتف لحماية عروض أول تعامل.`
          });
        }
        handleCreateOrUpdateUser();
      }
    );
  } else {
    handleCreateOrUpdateUser();
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password, deviceId } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });

  const normalizedEmail = email.trim().toLowerCase();
  const clientPlatform = (req.headers['x-client-platform'] || req.body.platform || '').toLowerCase();

  db.get(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`, [normalizedEmail], (err, row) => {
    if (err || !row) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Compare with bcrypt hash or fallback to legacy plaintext
    const isMatch = bcrypt.compareSync(password, row.password) || password === row.password;
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Upgrade legacy plain password to bcrypt in background
    if (password === row.password && !row.password.startsWith('$2')) {
      const hashed = bcrypt.hashSync(password, 10);
      db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashed, row.id]);
    }

    // Ensure admin emails have admin role if not already set
    let userRole = row.role;
    const isAdmin = getAdminEmails().includes(normalizedEmail) || row.role === 'admin';
    if (getAdminEmails().includes(normalizedEmail) && row.role !== 'admin') {
      userRole = 'admin';
      db.run(`UPDATE users SET role = 'admin' WHERE id = ?`, [row.id]);
    }

    // 🛡️ Web restriction: Only Admin allowed on Web
    if (clientPlatform === 'web' && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'منصة الويب مخصصة للوحة تحكم الإدارة فقط. لتسجيل الدخول ومتابعة مشروعك وفواتيرك، يرجى استخدام تطبيق الهاتف.'
      });
    }

    // Update deviceId on mobile if not set yet
    if (deviceId && !row.deviceId) {
      db.run(`UPDATE users SET deviceId = ? WHERE id = ?`, [deviceId, row.id]);
    }

    const user = { 
      id: row.id, fullName: row.fullName, email: row.email, role: userRole, company: row.company,
      phone: row.phone, avatarUrl: row.avatarUrl,
      projectName: row.projectName, projectPhase: row.projectPhase, projectProgress: row.projectProgress || 0 
    };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, user, token });
  });
});

// Google Sign-In Route
app.post('/api/auth/google', (req, res) => {
  const { email, fullName, googleId, picture, deviceId } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required from Google' });

  const normalizedEmail = email.trim().toLowerCase();
  const defaultRole = getAdminEmails().includes(normalizedEmail) ? 'admin' : 'client';
  const clientPlatform = (req.headers['x-client-platform'] || req.body.platform || '').toLowerCase();
  const isAdmin = getAdminEmails().includes(normalizedEmail);

  // 🛡️ Web restriction: Only Admin allowed on Web
  if (clientPlatform === 'web' && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'منصة الويب مخصصة للوحة تحكم الإدارة فقط. يرجى استخدام تطبيق الهاتف للدخول كعميل.'
    });
  }

  db.get(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`, [normalizedEmail], (err, existingUser) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });

    if (existingUser) {
      let currentRole = existingUser.role;
      if (getAdminEmails().includes(normalizedEmail) && existingUser.role !== 'admin') {
        currentRole = 'admin';
        db.run(`UPDATE users SET role = 'admin' WHERE id = ?`, [existingUser.id]);
      }

      if (deviceId && !existingUser.deviceId) {
        db.run(`UPDATE users SET deviceId = ? WHERE id = ?`, [deviceId, existingUser.id]);
      }

      const user = {
        id: existingUser.id,
        fullName: existingUser.fullName,
        email: existingUser.email,
        role: currentRole,
        company: existingUser.company,
        phone: existingUser.phone,
        avatarUrl: existingUser.avatarUrl || picture,
        projectName: existingUser.projectName,
        projectPhase: existingUser.projectPhase,
        projectProgress: existingUser.projectProgress || 0
      };
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
      return res.json({ success: true, user, token });
    } else {
      // 🛡️ Device Binding check before creating new Google client user
      const proceedWithGoogleCreate = () => {
        const defaultPassword = bcrypt.hashSync('google_oauth_' + Math.random().toString(36).substring(7), 10);
        db.run(
          `INSERT INTO users (fullName, email, password, company, role, avatarUrl, projectName, projectPhase, projectProgress, deviceId) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, 0, ?)`,
          [fullName || normalizedEmail.split('@')[0], normalizedEmail, defaultPassword, 'Google Client', defaultRole, picture || null, deviceId || null],
          function(insertErr) {
            if (insertErr) return res.status(500).json({ success: false, message: 'Failed to create user' });
            
            const newUser = {
              id: this.lastID,
              fullName: fullName || normalizedEmail.split('@')[0],
              email: normalizedEmail,
              role: defaultRole,
              company: 'Google Client',
              avatarUrl: picture || null,
              phone: null,
              projectName: null,
              projectPhase: null,
              projectProgress: 0
            };
            const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '30d' });
            return res.json({ success: true, user: newUser, token });
          }
        );
      };

      if (deviceId && !isAdmin && clientPlatform !== 'web') {
        db.get(
          `SELECT email FROM users WHERE deviceId = ? AND LOWER(email) != LOWER(?) AND role != 'admin'`,
          [deviceId, normalizedEmail],
          (devErr, existingDevice) => {
            if (existingDevice) {
              return res.status(400).json({
                success: false,
                message: `هذا الجهاز مسجل به حساب بالفعل مسبقاً (${existingDevice.email}). لا يُسمح بإنشاء أكثر من حساب واحد لكل هاتف.`
              });
            }
            proceedWithGoogleCreate();
          }
        );
      } else {
        proceedWithGoogleCreate();
      }
    }
  });
});

// Forgot Password Request (send 6-digit code)
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });

  const normalizedEmail = email.trim().toLowerCase();

  db.get(`SELECT id, fullName, email FROM users WHERE LOWER(email) = LOWER(?)`, [normalizedEmail], (err, user) => {
    if (err || !user) return res.status(404).json({ success: false, message: 'No account found with this email' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000; // 15 mins

    db.run(`UPDATE users SET resetCode = ?, resetCodeExpires = ? WHERE id = ?`, [code, expires, user.id], (updErr) => {
      if (updErr) return res.status(500).json({ success: false, message: 'Database error' });

      emailService.sendPasswordResetEmail({ to: user.email, fullName: user.fullName, code }).catch(console.error);
      res.json({ success: true, message: 'Password reset code sent to your email' });
    });
  });
});

// Reset Password with Code
app.post('/api/auth/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, code, and new password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  db.get(`SELECT id, resetCode, resetCodeExpires FROM users WHERE LOWER(email) = LOWER(?)`, [normalizedEmail], (err, user) => {
    if (err || !user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.resetCode || user.resetCode !== code || !user.resetCodeExpires || Date.now() > user.resetCodeExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    db.run(`UPDATE users SET password = ?, resetCode = NULL, resetCodeExpires = NULL WHERE id = ?`, [hashed, user.id], (updErr) => {
      if (updErr) return res.status(500).json({ success: false, message: 'Failed to update password' });
      res.json({ success: true, message: 'Password updated successfully. You can now login.' });
    });
  });
});

// ==================== USER PROFILE & ACCOUNT ROUTES ====================

// Get Current User Profile
app.get('/api/me', authenticateToken, (req, res) => {
  db.get(`SELECT id, fullName, email, company, role, phone, avatarUrl, projectName, projectPhase, projectProgress, projectTasks, projectDeliverables FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  });
});

// Update Profile Info
app.put('/api/user/profile', authenticateToken, (req, res) => {
  const { fullName, company, phone, avatarUrl } = req.body;
  db.run(
    `UPDATE users SET fullName = COALESCE(?, fullName), company = COALESCE(?, company), phone = COALESCE(?, phone), avatarUrl = COALESCE(?, avatarUrl) WHERE id = ?`,
    [fullName, company, phone, avatarUrl, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ success: false, message: 'Failed to update profile' });
      db.get(`SELECT id, fullName, email, company, role, phone, avatarUrl, projectName, projectPhase, projectProgress, projectTasks, projectDeliverables FROM users WHERE id = ?`, [req.user.id], (uErr, updatedUser) => {
        res.json({ success: true, user: updatedUser });
      });
    }
  );
});

// Change Password
app.put('/api/user/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required' });
  }

  db.get(`SELECT password FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = bcrypt.compareSync(currentPassword, user.password) || currentPassword === user.password;
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const hashed = bcrypt.hashSync(newPassword, 10);
    db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashed, req.user.id], (updErr) => {
      if (updErr) return res.status(500).json({ success: false, message: 'Failed to change password' });
      res.json({ success: true, message: 'Password changed successfully' });
    });
  });
});

// Save / Register Push Notification Token
app.post('/api/user/push-token', authenticateToken, (req, res) => {
  const { pushToken } = req.body;
  if (!pushToken) return res.status(400).json({ success: false, message: 'Push token is required' });
  db.run(`UPDATE users SET pushToken = ? WHERE id = ?`, [pushToken, req.user.id], function(err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Push token updated successfully' });
  });
});

// ==================== INVOICES & BILLING ROUTES ====================
// Get Invoices (Client gets own, Admin gets all)
app.get('/api/invoices', authenticateToken, (req, res) => {
  if (isAdminUser(req.user)) {
    db.all(`SELECT i.*, u.fullName as clientName, u.email as clientEmail FROM invoices i LEFT JOIN users u ON i.userId = u.id ORDER BY i.id DESC`, [], (err, rows) => {
      res.json({ success: !err, invoices: rows || [] });
    });
  } else {
    db.all(`SELECT * FROM invoices WHERE userId = ? ORDER BY id DESC`, [req.user.id], (err, rows) => {
      res.json({ success: !err, invoices: rows || [] });
    });
  }
});

// Admin creates a new invoice
app.post('/api/invoices', authenticateToken, requireAdmin, (req, res) => {
  const { userId, quoteId, title, amount, notes, date } = req.body;
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
  const invoiceDate = date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  db.run(
    `INSERT INTO invoices (userId, quoteId, invoiceNumber, title, amount, date, status, notes) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
    [userId, quoteId || null, invoiceNumber, title || 'دفعة تطوير برمجيات', amount, invoiceDate, notes || ''],
    function(err) {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      const invoiceId = this.lastID;

      // Send email notification to client
      db.get(`SELECT fullName, email FROM users WHERE id = ?`, [userId], (uErr, client) => {
        if (!uErr && client) {
          emailService.sendNewInvoiceEmail({
            to: client.email,
            fullName: client.fullName,
            invoiceNumber,
            amount,
            title
          }).catch(console.error);
        }
      });

      res.json({ success: true, invoiceId, invoiceNumber });
    }
  );
});

// Client submits payment for an invoice (receipt upload or mock card)
app.put('/api/invoices/:id/payment', authenticateToken, (req, res) => {
  const { receiptUrl, notes } = req.body;
  db.run(
    `UPDATE invoices SET receiptUrl = ?, notes = COALESCE(?, notes), status = 'UNDER_REVIEW' WHERE id = ? AND userId = ?`,
    [receiptUrl, notes, req.params.id, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ success: false, message: 'Failed to submit payment' });
      res.json({ success: true, message: 'Payment submitted for admin review' });
    }
  );
});

// Admin updates invoice status (e.g., Mark PAID)
app.put('/api/invoices/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { status } = req.body;

  db.run(`UPDATE invoices SET status = ? WHERE id = ?`, [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false });

    if (status === 'PAID') {
      db.get(`SELECT i.*, u.fullName, u.email FROM invoices i JOIN users u ON i.userId = u.id WHERE i.id = ?`, [req.params.id], (iErr, inv) => {
        if (!iErr && inv) {
          emailService.sendPaymentConfirmedEmail({
            to: inv.email,
            fullName: inv.fullName,
            invoiceNumber: inv.invoiceNumber,
            amount: inv.amount
          }).catch(console.error);
        }
      });
    }

    res.json({ success: true, message: 'Status updated' });
  });
});

// Admin Delete Invoice
app.delete('/api/admin/invoices/:id', authenticateToken, (req, res) => {
  if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
  db.run(`DELETE FROM invoices WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Invoice deleted successfully' });
  });
});

// ==================== QUOTES & PROJECT TRACKING ====================

// Submit Quote
app.post('/api/quotes', authenticateToken, (req, res) => {
  const { details } = req.body;
  const email = req.user.email;
  const platform = JSON.stringify(details.platforms || []);
  const features = JSON.stringify({ features: details.features, extras: details.extras, time: details.estimatedTime });
  const totalCost = details.estimatedCost || 0;
  
  db.run(`INSERT INTO quotes (email, platform, features, totalCost) VALUES (?, ?, ?, ?)`, 
    [email, platform, features, totalCost], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });

    const quoteId = this.lastID;

    const platformNames = (details.platforms || []).map(p => {
      if (p === 'web') return 'موقع ويب';
      if (p === 'android') return 'تطبيق أندرويد';
      if (p === 'ios') return 'تطبيق آيفون';
      return p;
    });
    const projName = platformNames.length > 0 
      ? `مشروع ${platformNames.join(' + ')}` 
      : 'مشروع رقمي مخصص';

    db.run(
      `UPDATE users SET projectName = ?, projectPhase = 'مراجعة الطلب والمواصفات', projectProgress = 15 WHERE email = ?`,
      [projName, email],
      () => {
        emailService.sendQuoteConfirmationEmail({
          to: email,
          fullName: req.user.fullName || email.split('@')[0],
          details
        }).catch(console.error);

        db.get(`SELECT id, fullName, email, company, role, projectName, projectPhase, projectProgress FROM users WHERE email = ?`, [email], (uErr, updatedUser) => {
          res.json({ 
            success: true, 
            message: 'Quote submitted successfully', 
            quoteId,
            user: updatedUser || null 
          });
        });
      }
    );
  });
});

// Client's own quotes
app.get('/api/my-quotes', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM quotes WHERE email = ? ORDER BY createdAt DESC`, [req.user.email], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    const quotes = (rows || []).map(r => {
      let platforms = [];
      let featuresData = { features: [], extras: [], time: '' };
      try { platforms = JSON.parse(r.platform); } catch (e) {}
      try { featuresData = JSON.parse(r.features); } catch (e) {}
      let aiAnalysis = null;
      try { if (r.aiAnalysis) aiAnalysis = JSON.parse(r.aiAnalysis); } catch (e) {}
      return {
        id: r.id,
        email: r.email,
        platforms: Array.isArray(platforms) ? platforms : [],
        features: featuresData.features || [],
        extras: featuresData.extras || [],
        estimatedTime: featuresData.time || (aiAnalysis ? `${aiAnalysis.timelineWeeks} أسابيع` : ''),
        totalCost: r.totalCost,
        status: r.status,
        source: r.source || 'smart_estimator',
        aiAnalysis,
        createdAt: r.createdAt
      };
    });
    res.json({ success: true, quotes });
  });
});

// Admin Quote status update (Approve, Reject)
app.put('/api/quotes/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { status } = req.body;
  db.run(`UPDATE quotes SET status = ? WHERE id = ?`, [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false });

    if (status === 'approved') {
      db.get(`SELECT email FROM quotes WHERE id = ?`, [req.params.id], (qErr, q) => {
        if (!qErr && q) {
          db.run(`UPDATE users SET projectPhase = 'تم اعتماد الطلب - جاري التخطيط والهيكلة', projectProgress = 25 WHERE email = ?`, [q.email]);
        }
      });
    }

    res.json({ success: true, message: 'Quote status updated' });
  });
});

// Admin Delete Quote
app.delete('/api/admin/quotes/:id', authenticateToken, (req, res) => {
  if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
  db.run(`DELETE FROM quotes WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Quote deleted successfully' });
  });
});

// ==================== APEX AI COPILOT ROUTES ====================

// Interactive Chat Consultant with Live AI (Gemini 3.6 Flash / Deep Semantic)
app.post('/api/ai/chat-consultant', async (req, res) => {
  try {
    const { messages, language, apiKey, provider } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'قائمة الرسائل مطلوبة للتشاور الذكي' 
      });
    }

    const result = await aiCopilot.chatConsultant(messages, { 
      language: language || 'ar', 
      apiKey, 
      provider 
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('AI Chat Consultant error:', err);
    return res.status(500).json({ success: false, message: 'حدث خطأ أثناء التشاور الذكي: ' + err.message });
  }
});

// Transcribe Voice Note to Text (High-accuracy Gemini 3.5 Transcribe / Flash)
app.post('/api/ai/transcribe-voice', async (req, res) => {
  try {
    const { audioBase64, mimeType, language } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ 
        success: false, 
        message: 'محتوى التسجيل الصوتي مطلوب للتحويل' 
      });
    }

    const result = await aiCopilot.transcribeAudio(audioBase64, mimeType || 'audio/m4a', language || 'ar');
    return res.json(result);
  } catch (err) {
    console.error('AI Voice Transcription route error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء تحويل الصوت إلى نص: ' + err.message 
    });
  }
});

// Analyze Project Prompt (Voice, Text, or Chat History, Live Gemini / OpenAI / Deep Semantic)
app.post('/api/ai/analyze-project', async (req, res) => {
  try {
    const { prompt, messages, language, apiKey, provider } = req.body;
    const inputContent = (messages && Array.isArray(messages) && messages.length > 0) ? messages : prompt;
    if (!inputContent || (typeof inputContent === 'string' && inputContent.trim().length < 3)) {
      return res.status(400).json({ 
        success: false, 
        message: 'يرجى كتابة فكرة المشروع أو التحدث بالصوت بشكل أوضح' 
      });
    }

    const analysis = await aiCopilot.analyzeProjectPrompt(inputContent, { 
      language: language || 'ar', 
      apiKey, 
      provider 
    });
    return res.json({ success: true, analysis });
  } catch (err) {
    console.error('AI Analysis error:', err);
    return res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحليل فكرة المشروع: ' + err.message });
  }
});

// Get AI Copilot Configuration (Public / Client)
app.get('/api/ai/config', (req, res) => {
  const config = aiCopilot.getAiConfig();
  res.json({
    success: true,
    provider: config.provider || 'gemini',
    hasGeminiKey: !!config.geminiApiKey,
    hasOpenaiKey: !!config.openaiApiKey,
    geminiKeyMasked: config.geminiApiKey ? `${config.geminiApiKey.slice(0, 4)}...${config.geminiApiKey.slice(-4)}` : '',
  });
});

// Update AI Copilot Configuration
app.post('/api/ai/config', authenticateToken, (req, res) => {
  const { geminiApiKey, openaiApiKey, provider } = req.body;
  const result = aiCopilot.saveAiConfig({ geminiApiKey, openaiApiKey, provider });
  res.json(result);
});

// Convert AI Analysis to Instant Contract Request
app.post('/api/ai/convert-contract', authenticateToken, (req, res) => {
  try {
    const { analysis, prompt, notes, selectedPackage = 'pro' } = req.body;
    if (!analysis) {
      return res.status(400).json({ success: false, message: 'بيانات التحليل مطلوبة' });
    }

    const email = req.user.email;
    const platformsArray = Array.isArray(analysis.platforms)
      ? analysis.platforms.map(p => p.name || p.id || p)
      : ['تطبيق عميل', 'تطبيق شريك', 'لوحة تحكم سحابية'];
    const platformStr = JSON.stringify(platformsArray);

    const pkg = analysis.packages?.[selectedPackage] || analysis.packages?.pro || null;
    const totalCost = pkg?.costEGP ? Number(pkg.costEGP) : (Number(analysis.budgetBreakdown?.currencyEGP) || Number(analysis.estimatedCostEGP) || 68000);
    const timelineWeeks = pkg?.weeks ? Number(pkg.weeks) : (analysis.timelineWeeks || 8);
    const packageName = pkg?.title || (selectedPackage === 'mvp' ? 'باقة MVP (النموذج الأولي)' : selectedPackage === 'enterprise' ? 'باقة Enterprise (المؤسسات)' : 'باقة Pro (المنظومة المتكاملة)');

    const featuresPayload = {
      source: 'ai_copilot',
      selectedPackage,
      packageName,
      packageDetails: pkg,
      feasibilityScore: analysis.feasibilityScore,
      feasibilityAnalysis: analysis.feasibilityAnalysis,
      competitors: analysis.competitors,
      summary: analysis.summary || '',
      domainName: analysis.domainName || '',
      projectName: analysis.projectName || 'مشروع ذكي جديد',
      platforms: analysis.platforms || [],
      techStack: analysis.techStack || {},
      systemArchitecture: analysis.systemArchitecture || {},
      strategicAnalysis: analysis.strategicAnalysis || {},
      budgetBreakdown: analysis.budgetBreakdown || {},
      packages: analysis.packages || {},
      timelineWeeks,
      milestones: analysis.milestones || [],
      paymentPlan: analysis.paymentPlan || [],
      originalPrompt: prompt || '',
      clientNotes: notes || ''
    };

    db.run(
      `INSERT INTO quotes (email, platform, features, totalCost, status, source, aiAnalysis) VALUES (?, ?, ?, ?, 'approved', 'ai_copilot', ?)`,
      [email, platformStr, JSON.stringify(featuresPayload), totalCost, JSON.stringify(analysis)],
      function(err) {
        if (err) {
          console.error('Error inserting AI quote:', err);
          return res.status(500).json({ success: false, message: 'فشل حفظ طلب التعاقد في قاعدة البيانات' });
        }

        const quoteId = this.lastID;
        const projectName = analysis.projectName || 'مشروع Apex الذكي';
        const projectPhase = `تم التعاقد الفوري عبر المستشار الذكي (${packageName}) - جاري التخطيط الفني`;
        const projectProgress = 20;

        // Auto-generate project roadmap tasks from milestones
        const projectTasks = (analysis.milestones || []).map((m, idx) => ({
          id: `task-${idx + 1}`,
          title: m.title || `المرحلة ${m.phase || idx + 1}`,
          completed: idx === 0,
          duration: `${m.durationWeeks || 2} أسابيع`
        }));

        db.run(
          `UPDATE users SET projectName = ?, projectPhase = ?, projectProgress = ?, projectTasks = ? WHERE id = ?`,
          [projectName, projectPhase, projectProgress, JSON.stringify(projectTasks), req.user.id],
          function(uErr) {
            // Send confirmation email
            emailService.sendQuoteConfirmationEmail({
              to: email,
              fullName: req.user.fullName || email.split('@')[0],
              details: {
                platforms: platformsArray,
                features: [analysis.domainName || 'مشروع ذكي بالذكاء الاصطناعي'],
                estimatedCost: totalCost,
                estimatedTime: `${analysis.timelineWeeks || 8} أسابيع`
              }
            }).catch(console.error);

            // Fetch and return updated user
            db.get(`SELECT id, fullName, email, company, role, phone, avatarUrl, projectName, projectPhase, projectProgress, projectTasks FROM users WHERE id = ?`, [req.user.id], (gErr, updatedUser) => {
              return res.json({
                success: true,
                message: 'تم تحويل الفكرة إلى طلب تعاقد رسمي بنجاح! 🚀 تم تحديث لوحة التحكم وتجهيز المشروع.',
                quoteId,
                user: updatedUser
              });
            });
          }
        );
      }
    );
  } catch (err) {
    console.error('Error in convert-contract:', err);
    return res.status(500).json({ success: false, message: 'حدث خطأ غير متوقع أثناء معالجة التعاقد' });
  }
});

// Admin Project Tracking
app.put('/api/users/:id/project', authenticateToken, requireAdmin, (req, res) => {
  const { projectName, projectPhase, projectProgress } = req.body;
  db.run(`UPDATE users SET projectName = ?, projectPhase = ?, projectProgress = ? WHERE id = ?`,
    [projectName, projectPhase, projectProgress, req.params.id], function(err) {
      if (err) return res.status(500).json({ success: false });

      db.get(`SELECT fullName, email FROM users WHERE id = ?`, [req.params.id], (userErr, client) => {
        if (!userErr && client && client.email) {
          emailService.sendProjectUpdateEmail({
            to: client.email,
            fullName: client.fullName,
            projectName,
            projectPhase,
            projectProgress
          }).catch(console.error);
        }
      });

      res.json({ success: true });
  });
});

// Admin Update User Project Tasks / Checklist
app.put('/api/users/:id/tasks', authenticateToken, requireAdmin, (req, res) => {
  const { tasks } = req.body;
  const tasksJson = typeof tasks === 'string' ? tasks : JSON.stringify(tasks || []);
  db.run(`UPDATE users SET projectTasks = ? WHERE id = ?`, [tasksJson, req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Project tasks updated successfully' });
  });
});

// Admin Update User Project Deliverables & Links
app.put('/api/admin/users/:id/deliverables', authenticateToken, (req, res) => {
  if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
  const { deliverables } = req.body;
  const jsonStr = typeof deliverables === 'string' ? deliverables : JSON.stringify(deliverables || []);
  db.run(`UPDATE users SET projectDeliverables = ? WHERE id = ?`, [jsonStr, req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Deliverables updated successfully' });
  });
});

// Get Agency Settings (Public / Client / Admin)
app.get('/api/agency-settings', (req, res) => {
  db.get(`SELECT * FROM agency_settings WHERE id = 1`, [], (err, row) => {
    if (err || !row) {
      return res.json({
        success: true,
        settings: {
          companyName: 'Apex Software Agency',
          companyPhone: '+20 100 000 0000',
          companyEmail: 'contact@apex.com',
          taxId: 'TX-948201-EG',
          vodafoneCash: '01000000000',
          bankName: 'CIB (Commercial International Bank)',
          bankAccount: '100029384729',
          bankIban: 'EG1200000000100029384729',
          instapayHandle: 'apex@instapay',
          address: 'Cairo, Egypt'
        }
      });
    }
    res.json({ success: true, settings: row });
  });
});

// Admin Update Agency Settings
app.put('/api/admin/agency-settings', authenticateToken, (req, res) => {
  if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
  const { companyName, companyPhone, companyEmail, taxId, vodafoneCash, bankName, bankAccount, bankIban, instapayHandle, address } = req.body;
  
  db.run(`UPDATE agency_settings SET 
    companyName = COALESCE(?, companyName),
    companyPhone = COALESCE(?, companyPhone),
    companyEmail = COALESCE(?, companyEmail),
    taxId = COALESCE(?, taxId),
    vodafoneCash = COALESCE(?, vodafoneCash),
    bankName = COALESCE(?, bankName),
    bankAccount = COALESCE(?, bankAccount),
    bankIban = COALESCE(?, bankIban),
    instapayHandle = COALESCE(?, instapayHandle),
    address = COALESCE(?, address),
    updatedAt = CURRENT_TIMESTAMP
    WHERE id = 1`,
    [companyName, companyPhone, companyEmail, taxId, vodafoneCash, bankName, bankAccount, bankIban, instapayHandle, address],
    function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      db.get(`SELECT * FROM agency_settings WHERE id = 1`, [], (gErr, updated) => {
        res.json({ success: true, settings: updated });
      });
    }
  );
});

// Admin Financial & Sales Analytics
app.get('/api/admin/analytics', authenticateToken, (req, res) => {
  if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });

  db.all(`SELECT amount, status, createdAt FROM invoices`, [], (invErr, invoices) => {
    const allInvoices = invoices || [];
    let totalRevenue = 0;
    let pendingRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;

    allInvoices.forEach(inv => {
      const amt = Number(inv.amount) || 0;
      if (inv.status === 'PAID') {
        totalRevenue += amt;
        paidCount++;
      } else {
        pendingRevenue += amt;
        pendingCount++;
      }
    });

    db.all(`SELECT id, status, platform FROM quotes`, [], (qErr, quotes) => {
      const allQuotes = quotes || [];
      const totalQuotes = allQuotes.length;
      const approvedQuotes = allQuotes.filter(q => q.status === 'approved').length;
      const pendingQuotes = allQuotes.filter(q => !q.status || q.status === 'pending').length;
      const rejectedQuotes = allQuotes.filter(q => q.status === 'rejected').length;

      let webCount = 0;
      let androidCount = 0;
      let iosCount = 0;

      allQuotes.forEach(q => {
        try {
          const p = JSON.parse(q.platform);
          if (Array.isArray(p)) {
            if (p.includes('web')) webCount++;
            if (p.includes('android')) androidCount++;
            if (p.includes('ios')) iosCount++;
          }
        } catch (e) {}
      });

      db.get(`SELECT COUNT(*) as totalClients FROM users WHERE role != 'admin'`, [], (uErr, uRow) => {
        const totalClients = (uRow && uRow.totalClients) || 0;

        res.json({
          success: true,
          analytics: {
            financials: {
              totalRevenue,
              pendingRevenue,
              totalInvoices: allInvoices.length,
              paidCount,
              pendingCount,
            },
            quotes: {
              totalQuotes,
              approvedQuotes,
              pendingQuotes,
              rejectedQuotes,
              conversionRate: totalQuotes > 0 ? Math.round((approvedQuotes / totalQuotes) * 100) : 0,
            },
            clients: {
              totalClients,
            },
            platforms: {
              web: webCount,
              android: androidCount,
              ios: iosCount,
              totalSelected: webCount + androidCount + iosCount,
            }
          }
        });
      });
    });
  });
});

// Dynamic Realtime Contextual Notifications for Current User
app.get('/api/notifications', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.get(`SELECT * FROM users WHERE id = ?`, [userId], (uErr, user) => {
    if (!user) return res.json({ success: true, notifications: [] });

    db.all(`SELECT * FROM invoices WHERE userId = ? ORDER BY id DESC`, [userId], (iErr, invoices) => {
      const invs = invoices || [];
      const notifications = [];

      // Unpaid invoice notification
      const unpaid = invs.filter(i => i.status !== 'PAID');
      if (unpaid.length > 0) {
        const firstUnpaid = unpaid[0];
        notifications.push({
          id: `inv-${firstUnpaid.id}`,
          title: 'فاتورة مستحقة للدفع 📄',
          body: `لديك فاتورة #${firstUnpaid.invoiceNumber} بمبلغ $${firstUnpaid.amount} مستحقة السداد.`,
          time: firstUnpaid.date || 'مستحقة الآن',
          icon: 'receipt',
          color: '#EF4444',
          unread: true,
        });
      }

      // Paid confirmation notification
      const paid = invs.filter(i => i.status === 'PAID');
      if (paid.length > 0) {
        const firstPaid = paid[0];
        notifications.push({
          id: `paid-${firstPaid.id}`,
          title: 'تم تأكيد السداد بنجاح ✅',
          body: `تم اعتماد سداد الفاتورة #${firstPaid.invoiceNumber} بمبلغ $${firstPaid.amount}.`,
          time: firstPaid.date || 'مؤكدة',
          icon: 'checkmark-circle',
          color: '#10B981',
          unread: false,
        });
      }

      // Project progress notification
      if (user.projectName && (user.projectProgress || 0) > 0) {
        notifications.push({
          id: `proj-${user.id}`,
          title: 'تحديث في مرحلة مشروعك 🚀',
          body: `مشروعك (${user.projectName}) في مرحلة: ${user.projectPhase || 'قيد التطوير'} بنسبة إنجاز ${user.projectProgress}%.`,
          time: 'محدث الآن',
          icon: 'rocket',
          color: '#06B6D4',
          unread: true,
        });
      }

      // Deliverables notification
      try {
        const delivs = JSON.parse(user.projectDeliverables || '[]');
        if (delivs.length > 0) {
          notifications.push({
            id: `deliv-${user.id}`,
            title: 'تم تسليم روابط ومخرجات جديدة 📦',
            body: `قام مهندسو Apex برفع (${delivs.length}) روابط ومخرجات جاهزة للمعاينة والاستخدام.`,
            time: 'جديد',
            icon: 'cube',
            color: '#8B5CF6',
            unread: true,
          });
        }
      } catch (e) {}

      // Welcome notification
      notifications.push({
        id: `welcome-${user.id}`,
        title: 'أهلاً بك في منصة Apex Software ✨',
        body: 'فريق العمل جاهز لمساعدتك دائماً عبر الدردشة المباشرة وبوابة إدارة المشاريع.',
        time: user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG') : 'مرحباً',
        icon: 'sparkles',
        color: '#F59E0B',
        unread: false,
      });

      res.json({ success: true, notifications });
    });
  });
});

// Admin Delete Client User Account
app.delete('/api/admin/users/:id', authenticateToken, (req, res) => {
  if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
  db.get(`SELECT id, email, role FROM users WHERE id = ?`, [req.params.id], (err, u) => {
    if (err || !u) return res.status(404).json({ success: false, message: 'User not found' });
    if (u.role === 'admin' || u.email === 'abdallahelshamy82@gmail.com' || u.email === 'admin@apex.com') {
      return res.status(400).json({ success: false, message: 'لا يمكن حذف حساب مدير' });
    }
    db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function(delErr) {
      if (delErr) return res.status(500).json({ success: false, message: delErr.message });
      res.json({ success: true, message: 'User deleted successfully' });
    });
  });
});

// Admin Change User Role (client <-> admin)
app.put('/api/admin/users/:id/role', authenticateToken, (req, res) => {
  if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
  const { role } = req.body;
  if (role !== 'admin' && role !== 'client') {
    return res.status(400).json({ success: false, message: 'Invalid role. Must be admin or client' });
  }
  db.run(`UPDATE users SET role = ? WHERE id = ?`, [role, req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: `User role updated to ${role}` });
  });
});

// Admin Send Update Email
app.post('/api/admin/send-update-email', authenticateToken, (req, res) => {
  if (!isAdminUser(req.user)) return res.status(403).json({ success: false });
  const { userId } = req.body;
  db.get(`SELECT fullName, email, projectName, projectPhase, projectProgress FROM users WHERE id = ?`, [userId], (err, client) => {
    if (err || !client) return res.status(404).json({ success: false, message: 'User not found' });
    
    emailService.sendProjectUpdateEmail({
      to: client.email,
      fullName: client.fullName,
      projectName: client.projectName,
      projectPhase: client.projectPhase,
      projectProgress: client.projectProgress
    }).then((result) => {
      res.json({ success: true, message: 'Email sent successfully', result });
    }).catch((sendErr) => {
      res.status(500).json({ success: false, error: sendErr.message });
    });
  });
});

// Admin Email Configuration & SMTP Settings
app.get('/api/admin/email-config', authenticateToken, (req, res) => {
  if (!isAdminUser(req.user)) return res.status(403).json({ success: false });
  res.json({ success: true, ...emailService.getConfigStatus() });
});

app.post('/api/admin/email-config', authenticateToken, (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'صلاحية الإدارة مطلوبة لحفظ الإعدادات' });
    const { user, pass } = req.body;
    if (!user || !pass) {
      return res.status(400).json({ success: false, message: 'يرجى كتابة البريد وكلمة مرور التطبيقات (16 حرف)' });
    }

    const cleanPass = pass.replace(/\s+/g, '');
    const success = emailService.initTransporter(user.trim(), cleanPass);
    
    if (success) {
      const envFile = path.join(__dirname, '.env');
      fs.writeFileSync(envFile, `GMAIL_USER=${user.trim()}\nGMAIL_PASS=${cleanPass}\n`);
      res.json({ success: true, message: 'Gmail SMTP configured successfully!' });
    } else {
      res.status(500).json({ success: false, message: 'فشل تهيئة خادم Gmail' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Sent Emails History Log
app.get('/api/admin/sent-emails', authenticateToken, (req, res) => {
  if (!isAdminUser(req.user)) return res.status(403).json({ success: false });
  res.json({ success: true, emails: emailService.getSentEmails() });
});

// Admin Test Email
app.post('/api/admin/test-email', authenticateToken, async (req, res) => {
  if (!isAdminUser(req.user)) return res.status(403).json({ success: false });
  const { targetEmail } = req.body;
  const to = targetEmail || req.user.email;
  const result = await emailService.sendProjectUpdateEmail({
    to,
    fullName: 'عميلنا العزيز',
    projectName: 'مشروع تجريبي (Apex Test)',
    projectPhase: '🧪 اختبار اتصال Gmail الحقيقي',
    projectProgress: 100
  });
  res.json({ success: result.success, result });
});

// 🛡️ Official Printable Invoice View with Authorization Guard
app.get('/invoice-print/:id', (req, res) => {
  const invoiceId = req.params.id;
  const token = req.query.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  db.get(`
    SELECT i.*, u.fullName as clientName, u.email as clientEmail, u.company as clientCompany, u.phone as clientPhone, u.projectName
    FROM invoices i
    LEFT JOIN users u ON i.userId = u.id
    WHERE i.id = ?
  `, [invoiceId], (err, inv) => {
    if (err || !inv) {
      return res.status(404).send('<h2 style="font-family:sans-serif;text-align:center;margin-top:50px;">الفاتورة غير موجودة</h2>');
    }

    // 🛡️ Verify invoice ownership
    let authorized = false;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && (Number(decoded.id) === Number(inv.userId) || isAdminUser(decoded))) {
          authorized = true;
        }
      } catch (e) {}
    }

    if (!authorized) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head><meta charset="utf-8"><title>غير مصرح | Apex Software</title>
        <style>
          body{background:#0B132B;color:#FFF;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}
          .box{background:#1C2541;padding:32px;border-radius:16px;text-align:center;border:1px solid rgba(239,68,68,0.4);max-width:440px;box-shadow:0 10px 30px rgba(0,0,0,0.5);}
          h2{color:#EF4444;margin-bottom:12px;font-size:20px;}
          p{color:#94A3B8;font-size:14px;line-height:1.7;}
          .btn{display:inline-block;margin-top:16px;background:#38BDF8;color:#0B132B;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;}
        </style></head>
        <body><div class="box"><h2>🔒 مستند مالي مشفر ومحمي</h2><p>هذه الفاتورة محمية ولا يمكن الوصول إليها إلا من خلال حساب العميل صاحب الفاتورة أو إدارة Apex المعتمدة.</p><a href="http://localhost:8081" class="btn">تسجيل الدخول للتطبيق</a></div></body></html>
      `);
    }

    const isPaid = inv.status === 'PAID';
    const invoiceDate = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('ar-EG');
    const amountNum = Number(inv.amount) || 0;

    db.get(`SELECT * FROM agency_settings WHERE id = 1`, [], (aErr, agency) => {
      const companyName = (agency && agency.companyName) || 'Apex Software Agency';
      const companyEmail = (agency && agency.companyEmail) || 'contact@apex.com';
      const companyPhone = (agency && agency.companyPhone) || '+20 100 000 0000';
      const taxId = (agency && agency.taxId) || 'TX-948201-EG';
      const bankName = (agency && agency.bankName) || 'CIB';
      const bankAccount = (agency && agency.bankAccount) || '100029384729';
      const vodafoneCash = (agency && agency.vodafoneCash) || '01000000000';
      const instapayHandle = (agency && agency.instapayHandle) || 'apex@instapay';

      const page = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة رسمية #${inv.invoiceNumber || inv.id} - ${companyName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; margin: 0; padding: 0; color: #1e293b; }
          .no-print-bar { background: #1e293b; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
          .no-print-bar a, .no-print-bar button { padding: 10px 18px; border-radius: 8px; font-weight: bold; font-size: 14px; text-decoration: none; cursor: pointer; border: none; }
          .btn-back { background: #334155; color: #cbd5e1; margin-left: 8px; }
          .btn-print { background: #0284c7; color: #ffffff; box-shadow: 0 4px 12px rgba(2,132,199,0.4); }
          .invoice-paper { max-width: 800px; margin: 30px auto; background: #ffffff; border-radius: 16px; padding: 50px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); position: relative; }
          .header-grid { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 25px; margin-bottom: 30px; }
          .brand-title { font-size: 28px; font-weight: 900; color: #0284c7; margin: 0; letter-spacing: 0.5px; }
          .brand-subtitle { color: #64748b; font-size: 13px; margin-top: 4px; }
          .inv-meta { text-align: left; }
          .inv-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 800; margin-bottom: 8px; }
          .badge-paid { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
          .badge-pending { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
          .info-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
          .info-box h4 { margin: 0 0 10px; color: #0284c7; font-size: 14px; }
          .info-box p { margin: 4px 0; font-size: 13px; color: #334155; }
          table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          table.items-table th { background: #f1f5f9; padding: 12px 14px; text-align: right; font-size: 13px; color: #475569; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
          table.items-table td { padding: 16px 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 35px; }
          .totals-table { width: 300px; border-collapse: collapse; }
          .totals-table td { padding: 8px 12px; font-size: 14px; }
          .totals-table tr.total-row { font-size: 18px; font-weight: 900; color: #0284c7; border-top: 2px solid #e2e8f0; }
          .payment-info { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 30px; font-size: 13px; color: #166534; }
          .footer { text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          .stamp { position: absolute; bottom: 80px; left: 60px; transform: rotate(-12deg); opacity: 0.85; }
          .stamp-box { border: 3px double #059669; color: #059669; padding: 8px 16px; border-radius: 8px; font-weight: 900; font-size: 18px; text-align: center; }
          @media print {
            body { background: #ffffff !important; }
            .no-print-bar { display: none !important; }
            .invoice-paper { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; max-width: 100% !important; padding: 20px !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <div style="color: #f8fafc; font-size: 14px; font-weight: bold;">
            📄 معاينة الفاتورة الرسمية #${inv.invoiceNumber || inv.id}
          </div>
          <div>
            <button onclick="window.history.back()" class="btn-back">رجوع</button>
            <button onclick="window.print()" class="btn-print">🖨️ طباعة / حفظ كـ PDF</button>
          </div>
        </div>

        <div class="invoice-paper">
          ${isPaid ? `
            <div class="stamp">
              <div class="stamp-box">
                ✔ مدفوعة بالكامل<br><span style="font-size: 12px; font-weight: normal;">PAID IN FULL</span>
              </div>
            </div>
          ` : ''}

          <div class="header-grid">
            <div>
              <h1 class="brand-title">${companyName} ⚡</h1>
              <div class="brand-subtitle">وكالة تطوير البرمجيات والتطبيقات والحلول الرقمية المتكاملة</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
                البريد: ${companyEmail} | الهاتف: ${companyPhone}
              </div>
            </div>
            <div class="inv-meta">
              <div class="inv-badge ${isPaid ? 'badge-paid' : 'badge-pending'}">
                ${isPaid ? '✅ مدفوعة (PAID)' : '⚠️ بانتظار السداد (PENDING)'}
              </div>
              <div style="font-size: 14px; font-weight: bold; color: #1e293b;">رقم الفاتورة: #${inv.invoiceNumber || inv.id}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">تاريخ الإصدار: ${invoiceDate}</div>
            </div>
          </div>

          <div class="info-cards">
            <div class="info-box">
              <h4>👤 فاتورة إلى (العميل):</h4>
              <p><strong>الاسم:</strong> ${inv.clientName || 'عميل كريم'}</p>
              <p><strong>البريد:</strong> ${inv.clientEmail || '-'}</p>
              <p><strong>الشركة:</strong> ${inv.clientCompany || 'مؤسسة مستقلة'}</p>
              ${inv.clientPhone ? `<p><strong>الهاتف:</strong> ${inv.clientPhone}</p>` : ''}
            </div>
            <div class="info-box">
              <h4>🏢 الشركة المصدرة للفاتورة:</h4>
              <p><strong>الاسم:</strong> ${companyName}</p>
              <p><strong>النشاط:</strong> استشارات وتطوير برمجيات ومواقع وتطبيقات</p>
              <p><strong>المشروع:</strong> ${inv.projectName || 'تطوير مشروع تقني مخصص'}</p>
              <p><strong>الرقم الضريبي:</strong> ${taxId}</p>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>بيان الخدمة / المرحلة البرمجية</th>
                <th style="width: 100px; text-align: center;">الكمية</th>
                <th style="width: 140px; text-align: left;">المبلغ الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>
                  <strong>${inv.title || 'دفعة تعاقدية لتطوير البرمجيات'}</strong>
                  ${inv.notes ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">${inv.notes}</div>` : ''}
                </td>
                <td style="text-align: center;">1</td>
                <td style="text-align: left; font-weight: bold; color: #0284c7;">$${amountNum.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals-wrap">
            <table class="totals-table">
              <tr>
                <td style="color: #64748b;">المجموع الفرعي:</td>
                <td style="text-align: left; font-weight: bold;">$${amountNum.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="color: #64748b;">الضريبة (0%):</td>
                <td style="text-align: left; font-weight: bold;">$0.00</td>
              </tr>
              <tr class="total-row">
                <td>الإجمالي المستحق:</td>
                <td style="text-align: left;">$${amountNum.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          ${!isPaid ? `
            <div class="payment-info">
              <strong>💳 طرق السداد المتاحة:</strong>
              <p style="margin: 4px 0 0;">
                • إنستاباي: <strong>${instapayHandle}</strong> | فودافون كاش: <strong>${vodafoneCash}</strong><br>
                • بنك: <strong>${bankName}</strong> | حساب: <strong>${bankAccount}</strong><br>
                يرجى رفع صورة إيصال السداد عبر بوابتك الخاصة في التطبيق ليتم الاعتماد الفوري.
              </p>
            </div>
          ` : ''}

          <div class="footer">
            <p>شكراً لتعاملكم مع <strong>${companyName}</strong>! نسعد دائماً بتقديم أرقى الخدمات البرمجية.</p>
            <p>© 2026 ${companyName}. وثيقة إلكترونية رسمية ومعتمدة.</p>
          </div>
        </div>
      </body>
      </html>
      `;
      res.send(page);
    });
  });
});

// Public Visual Email Showcase & Live Previews
app.get('/email-preview', (req, res) => {
  const type = req.query.type || 'project';
  let emailHtml = '';

  if (type === 'project') {
    emailHtml = emailService.getProjectUpdateHtml('تطبيق المتجر الإلكتروني الحديث', '💻 قيد البرمجة والتطوير', 50, 'عبدالله الشامي');
  } else if (type === 'invoice') {
    emailHtml = emailService.getHtmlTemplate('📄 تم إصدار فاتورة جديدة #INV-1002', `
      <p>مرحباً <strong>عبدالله الشامي</strong>،</p>
      <p>تم إصدار فاتورة جديدة لحسابك في <strong>Apex Software</strong>:</p>
      <div class="card-box">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <strong>رقم الفاتورة:</strong>
          <span>#INV-1002</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <strong>البيان:</strong>
          <span>دفعة ثانية 30% من التعاقد البرمجي</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <strong>المبلغ المستحق:</strong>
          <span style="color: #0284c7; font-size: 20px; font-weight: bold;">$1,250</span>
        </div>
      </div>
      <p>يمكنك مراجعة تفاصيل الفاتورة وإتمام الدفع أو رفع إيصال التحويل عبر بوابة العميل.</p>
    `);
  } else if (type === 'quote') {
    emailHtml = emailService.getHtmlTemplate('تم استلام طلبك لعرض السعر بنجاح 📋', `
      <p>مرحباً <strong>عبدالله الشامي</strong>،</p>
      <p>شكراً لاستخدامك <strong>المُسعّر الذكي</strong> الخاص بـ Apex Software. لقد تم استلام تفاصيل مشروعك وسيقوم فريقنا بمراجعتها والتواصل معك.</p>
      <div class="card-box">
        <p><strong>المنصات المطلوبة:</strong> تطبيق آيفون + أندرويد + لوحة تحكم ويب</p>
        <p><strong>التكلفة التقديرية:</strong> <span style="font-size: 20px; color: #0ea5e9; font-weight: bold;">$2,400</span></p>
        <p><strong>المدة الزمنية المتوقعة:</strong> <strong>3-4 أسابيع</strong></p>
      </div>
      <p>سيتواصل معك مهندس المشاريع قريباً عبر الدردشة الفورية لمناقشة بدء العمل.</p>
    `);
  } else {
    emailHtml = emailService.getWelcomeHtml('عبدالله الشامي');
  }

  const page = `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>معاينة تصاميم البريد الإلكتروني - Apex Software</title>
    <style>
      body { margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; }
      .bar { background: #1e293b; border-bottom: 1px solid #334155; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
      .bar h2 { margin: 0; font-size: 16px; color: #38bdf8; display: flex; align-items: center; gap: 8px; }
      .nav { display: flex; gap: 8px; flex-wrap: wrap; }
      .nav a { background: #334155; color: #cbd5e1; text-decoration: none; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; transition: all 0.2s; }
      .nav a:hover { background: #475569; color: #fff; }
      .nav a.active { background: #0284c7; color: #fff; box-shadow: 0 2px 8px rgba(2,132,199,0.4); }
      .frame-wrap { padding: 30px 15px; display: flex; justify-content: center; }
      .frame { width: 100%; max-width: 650px; background: #fff; border-radius: 16px; box-shadow: 0 20px 45px rgba(0,0,0,0.6); overflow: hidden; }
      .info-banner { max-width: 650px; margin: 0 auto 15px auto; background: #0369a125; border: 1px solid #0284c755; padding: 12px 16px; border-radius: 10px; font-size: 13px; color: #38bdf8; text-align: center; }
    </style>
  </head>
  <body>
    <div class="bar">
      <h2>✨ معاينة تصاميم البريد الإلكتروني الرسمية لوكالة Apex Devs</h2>
      <div class="nav">
        <a href="/email-preview?type=project" class="${type === 'project' ? 'active' : ''}">📊 تقرير إنجاز المشروع (50%)</a>
        <a href="/email-preview?type=invoice" class="${type === 'invoice' ? 'active' : ''}">📄 إشعار الفاتورة والمبلغ</a>
        <a href="/email-preview?type=quote" class="${type === 'quote' ? 'active' : ''}">📋 استلام وتأكيد عرض السعر</a>
        <a href="/email-preview?type=welcome" class="${type === 'welcome' ? 'active' : ''}">👋 رسالة الترحيب</a>
      </div>
    </div>
    <div class="frame-wrap">
      <div style="width: 100%; max-width: 650px;">
        <div class="info-banner">
          💡 هذا هو الشكل الحقيقي الفاخر الذي يستلمه العميل في صندوق بريده بتنسيق متجاوب بالكامل مع الموبايل والكمبيوتر.
        </div>
        <div class="frame">
          ${emailHtml}
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
  res.send(page);
});

// Upload File Route (Support Chat & Attachments - Multipart & Base64)
app.post('/api/upload', express.json({ limit: '30mb' }), (req, res, next) => {
  // Check if this is a JSON base64 upload
  if (req.is('application/json') && req.body && req.body.base64) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (!err && user) req.user = user;
      });
    }

    try {
      const { filename, mimeType, base64 } = req.body;
      const safeExt = getSafeExt({ originalname: filename, mimetype: mimeType });
      if (!ALLOWED_EXTENSIONS.has(safeExt) || DANGEROUS_EXTENSIONS.has(safeExt)) {
        return res.status(400).json({ success: false, message: 'نوع الملف المرفوع غير مسموح به أمنياً' });
      }

      const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
      const buffer = Buffer.from(cleanBase64, 'base64');

      if (buffer.length > 25 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: 'حجم الملف يتجاوز الحد الأقصى المسموح (25 ميجابايت)' });
      }

      const secureName = `${Date.now()}_${crypto.randomBytes(12).toString('hex')}${safeExt}`;
      const targetPath = path.join(uploadsDir, secureName);
      fs.writeFileSync(targetPath, buffer);

      const fileUrl = `/uploads/${secureName}`;
      return res.json({
        success: true,
        url: fileUrl,
        filename: filename || secureName,
        mimetype: mimeType || 'application/octet-stream',
        size: buffer.length
      });
    } catch (err) {
      console.error('Base64 upload error:', err);
      return res.status(500).json({ success: false, message: 'فشل حفظ الملف على السيرفر' });
    }
  }

  // Otherwise handle as standard multipart
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err && user) req.user = user;
    });
  }

  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Upload multer error:', err.message);
      return res.status(400).json({ success: false, message: err.message || 'فشل رفع الملف' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم استلام أي ملف' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  });
});

// Dedicated endpoint for Base64 Upload (Reliable fallback for React Native Android/Expo)
app.post('/api/upload-base64', express.json({ limit: '30mb' }), (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err && user) req.user = user;
    });
  }

  try {
    const { filename, mimeType, base64 } = req.body;
    if (!base64) {
      return res.status(400).json({ success: false, message: 'لم يتم استلام أي بيانات للملف' });
    }
    const safeExt = getSafeExt({ originalname: filename, mimetype: mimeType });
    if (!ALLOWED_EXTENSIONS.has(safeExt) || DANGEROUS_EXTENSIONS.has(safeExt)) {
      return res.status(400).json({ success: false, message: 'نوع الملف المرفوع غير مسموح به أمنياً' });
    }

    const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
    const buffer = Buffer.from(cleanBase64, 'base64');

    if (buffer.length > 25 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'حجم الملف يتجاوز الحد الأقصى المسموح (25 ميجابايت)' });
    }

    const secureName = `${Date.now()}_${crypto.randomBytes(12).toString('hex')}${safeExt}`;
    const targetPath = path.join(uploadsDir, secureName);
    fs.writeFileSync(targetPath, buffer);

    const fileUrl = `/uploads/${secureName}`;
    return res.json({
      success: true,
      url: fileUrl,
      filename: filename || secureName,
      mimetype: mimeType || 'application/octet-stream',
      size: buffer.length
    });
  } catch (err) {
    console.error('Base64 upload error:', err);
    return res.status(500).json({ success: false, message: 'فشل حفظ الملف على السيرفر' });
  }
});

// 💬 Send Message via REST API (Reliable Fallback & State Sync)
app.post('/api/messages', authenticateToken, (req, res) => {
  const { userId, senderRole, sender, text, attachmentUrl, attachment, type, timestamp, clientMsgId, id } = req.body;
  const targetId = Number(userId || req.user.id);
  if (Number(req.user.id) !== targetId && !isAdminUser(req.user)) {
    return res.status(403).json({ success: false, message: 'غير مصرح لك بإرسال رسائل لهذا الحساب' });
  }
  const cId = clientMsgId || (typeof id === 'string' ? id : null);
  const role = senderRole || sender || (isAdminUser(req.user) ? 'admin' : 'client');
  const attStr = attachment ? (typeof attachment === 'object' ? JSON.stringify(attachment) : attachment) : null;
  const attUrl = attachmentUrl || (attachment && attachment.uri) || null;
  const msgType = type || (attachment ? (attachment.type === 'file' ? 'document' : attachment.type) : 'text');
  const msgTime = timestamp || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  const doInsert = () => {
    db.run(`INSERT INTO messages (userId, senderRole, sender, text, attachmentUrl, attachment, type, timestamp, clientMsgId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [targetId, role, role, text || '', attUrl, attStr, msgType, msgTime, cId],
      function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        const newMsg = {
          id: this.lastID,
          clientMsgId: cId,
          userId: targetId,
          senderRole: role,
          sender: role,
          text: text || '',
          attachmentUrl: attUrl,
          attachment: attachment || (attUrl ? { uri: attUrl, name: (attUrl.split('/').pop()) || 'attachment', type: msgType === 'image' ? 'image' : 'file' } : null),
          type: msgType,
          timestamp: msgTime,
          createdAt: new Date().toISOString()
        };
        io.to(`chat_${targetId}`).emit('receive_message', newMsg);
        res.json({ success: true, message: newMsg });
      }
    );
  };

  if (cId) {
    db.get(`SELECT * FROM messages WHERE clientMsgId = ? AND userId = ?`, [cId, targetId], (err, existing) => {
      if (existing) {
        return res.json({ success: true, message: existing });
      }
      doInsert();
    });
  } else {
    doInsert();
  }
});

// 🛡️ Chat History Route with Strict IDOR Access Control
app.get('/api/messages/:userId', authenticateToken, (req, res) => {
  const targetId = Number(req.params.userId);
  if (Number(req.user.id) !== targetId && !isAdminUser(req.user)) {
    return res.status(403).json({ success: false, message: 'غير مصرح لك بالاطلاع على محادثات هذا الحساب' });
  }
  db.all(`SELECT * FROM messages WHERE userId = ? ORDER BY createdAt ASC`, [targetId], (err, rows) => {
    if (err) return res.status(500).json({ success: false });
    const parsed = (rows || []).map(r => {
      let att = null;
      if (r.attachment) {
        try { att = JSON.parse(r.attachment); } catch (e) { att = null; }
      }
      if (!att && r.attachmentUrl) {
        att = {
          uri: r.attachmentUrl,
          name: (r.attachmentUrl.split('/').pop()) || 'attachment',
          type: r.type === 'image' ? 'image' : (r.type === 'audio' ? 'audio' : 'file')
        };
      }
      return {
        ...r,
        sender: r.sender || r.senderRole || 'client',
        senderRole: r.senderRole || r.sender || 'client',
        attachment: att,
        timestamp: r.timestamp || (r.createdAt ? new Date(r.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '')
      };
    });
    res.json({ success: true, messages: parsed });
  });
});

// Admin All Quotes
app.get('/api/quotes', authenticateToken, requireAdmin, (req, res) => {
  db.all(`SELECT * FROM quotes ORDER BY createdAt DESC`, [], (err, rows) => res.json({ success: !err, quotes: rows || [] }));
});

// Admin All Users
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  db.all(`SELECT id, fullName, email, company, phone, role, projectName, projectPhase, projectProgress, projectTasks, projectDeliverables FROM users ORDER BY id DESC`, [], (err, rows) => res.json({ success: !err, users: rows || [] }));
});

// Admin All Chats
app.get('/api/admin/chats', authenticateToken, (req, res) => {
  if (!isAdminUser(req.user)) return res.status(403).json({ success: false });
  db.all(`SELECT u.id, u.fullName, u.email, MAX(m.createdAt) as lastMessageTime FROM users u LEFT JOIN messages m ON u.id = m.userId WHERE u.role != 'admin' GROUP BY u.id ORDER BY lastMessageTime DESC`, [], (err, rows) => res.json({ success: !err, chats: rows || [] }));
});

// Previews
app.get('/preview/welcome', (req, res) => res.send(emailService.getWelcomeHtml(req.query.name || 'عميلنا العزيز')));
app.get('/preview/update', (req, res) => res.send(emailService.getProjectUpdateHtml(req.query.project, req.query.phase, req.query.progress, req.query.name)));

// Public Privacy Policy for Google Play Store & Web
app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>سياسة الخصوصية | Apex Software</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0B132B; color: #E2E8F0; margin: 0; padding: 24px; line-height: 1.7; }
        .container { max-width: 800px; margin: 0 auto; background: #1C2541; padding: 32px; border-radius: 16px; border: 1px solid rgba(56, 189, 248, 0.2); }
        h1 { color: #38BDF8; font-size: 24px; border-bottom: 2px solid rgba(56, 189, 248, 0.3); padding-bottom: 12px; }
        h2 { color: #10B981; font-size: 18px; margin-top: 24px; }
        p, li { color: #94A3B8; font-size: 15px; }
        .badge { display: inline-block; background: rgba(56, 189, 248, 0.15); color: #38BDF8; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 16px; }
        .contact-box { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 16px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <span class="badge">وثيقة معتمدة لمتجر Google Play</span>
        <h1>سياسة الخصوصية وشروط الاستخدام - Apex Software</h1>
        <p>تاريخ آخر تحديث: سبتمبر 2026</p>
        
        <h2>1. التزامنا بحماية خصوصيتك</h2>
        <p>تلتزم شركة Apex Software بحماية وأمان بيانات عملائها ومستخدمي تطبيقاتها الرقمية وبوابتها السحابية. توضح هذه السياسة طبيعة البيانات المجمعة وطرق استخدامها وحمايتها.</p>
        
        <h2>2. البيانات التي نقوم بجمعها</h2>
        <ul>
          <li><strong>بيانات الحساب:</strong> الاسم، البريد الإلكتروني، رقم الهاتف، اسم المؤسسة.</li>
          <li><strong>بيانات المشاريع والمستشار الذكي:</strong> الأفكار، المتطلبات التقنية، الميزانيات التقديرية، وجداول التنفيذ لتسهيل التعاقد والمتابعة.</li>
          <li><strong>بيانات الفواتير:</strong> سجلات المطالبات والمدفوعات. بيانات بطاقات الدفع البنكية تُعالج عبر بوابات مشفرة معتمدة (PCI-DSS) ولا يتم تخزينها على خوادمنا.</li>
        </ul>

        <h2>3. صلاحيات التطبيق على الهاتف (Permissions)</h2>
        <ul>
          <li><strong>البصمة والوجه (Biometrics):</strong> لتسجيل الدخول السريع والآمن دون حفظ كلمات المرور.</li>
          <li><strong>الإشعارات (Push Notifications):</strong> لإرسال تحديثات لحظية حول فواتيرك وتقدم مراحل مشروعك.</li>
          <li><strong>الميكروفون (Microphone):</strong> يُستخدم حصراً عند إدخال الصوت لمستشار الذكاء الاصطناعي أو المحادثات.</li>
          <li><strong>الصور والمستندات (Storage / Photos):</strong> لرفع المرفقات ومتطلبات المشاريع وإيصالات السداد.</li>
        </ul>

        <h2>4. عدم مشاركة البيانات مع أطراف ثالثة</h2>
        <p>نحن لا نبيع، لا نؤجر، ولا نشارك أي بيانات شخصية أو معلومات مشاريع مع جهات إعلانية. المعالجة الذكية تتم عبر قنوات مؤسسية مشفرة.</p>

        <h2>5. حقوق المستخدم وحذف البيانات (Data Deletion)</h2>
        <p>يحق لك طلب نسخة من بياناتك أو طلب حذف حسابك بالكامل وجميع السجلات المرتبطة به في أي وقت.</p>

        <div class="contact-box">
          <p><strong>للتواصل ومسؤول حماية البيانات:</strong></p>
          <p>البريد الإلكتروني: support@apexsoftware.com | privacy@apexsoftware.com</p>
          <p>الموقع الرسمي: https://apexsoftware.com</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => console.log('Apex API Server running'));
}

module.exports = app;