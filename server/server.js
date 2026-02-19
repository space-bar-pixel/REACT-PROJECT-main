/* global process */
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise"; 
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import validator from "validator";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

const limiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 100 });
app.use(limiter);

const allowedOrigin = process.env.CLIENT_URL || 'http://localhost';
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      
      if (process.env.NODE_ENV !== 'production') {
        if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
          callback(null, true);
          return;
        }
      }
      
      if (origin === allowedOrigin) {
        callback(null, true);
        return;
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

let db;

async function initDb(retries = 20, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const tempDb = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS || '',
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0,
      });

      const createDbSql = `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`;
      await tempDb.query(createDbSql);
      await tempDb.end();
      
      db = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10,
        queueLimit: 0,
      });

      const [RESAULT] = await db.query('SELECT 1');
      console.log('MySQL connected successfully on attempt', i + 1);

      const createUsersSql = `
        CREATE TABLE IF NOT EXISTS users (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;

      await db.query(createUsersSql);
      
      const createProfilesSql = `
        CREATE TABLE IF NOT EXISTS profiles (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL UNIQUE,
          profile_image LONGTEXT,
          twitter VARCHAR(255),
          instagram VARCHAR(255),
          linkedin VARCHAR(255),
          github VARCHAR(255),
          bio TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;

      await db.query(createProfilesSql);
      console.log('MySQL pool created and tables ready');
      return;
    } catch (err) {
      console.error(`DB connection attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000}s... (${(retries - i - 1)} attempts remaining)`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

initDb()
  .then(() => {
    const port = Number(process.env.PORT) || 4000;
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => {
    console.error('DB init failed after retries:', err);
    process.exit(1);
  });

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const wrap = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.post(
  '/api/signup',
  wrap(async (req, res) => {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password)
      return res.status(400).json({ error: 'Missing fields' });

    if (!validator.isEmail(String(email)))
      return res.status(400).json({ error: 'Invalid email' });

    if (String(password).length < 8)
      return res.status(400).json({ error: 'Password too short' });

    const hashed = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    const params = [username, email, hashed];

    await db.query(sql, params);
    res.status(201).json({ message: 'Account created successfully' });
  })
);

app.post(
  '/api/signin',
  wrap(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    if (!validator.isEmail(String(email))) return res.status(400).json({ error: 'Invalid email' });

    const sql = 'SELECT * FROM users WHERE email = ?';
    const params = [email];
    const [results] = await db.query(sql, params);

    if (!results || results.length === 0)
      return res.status(401).json({ error: 'Invalid credentials' });

    const user = results[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });

    const cookieOptions = {
      httpOnly: true,
      sameSite: process.env.COOKIE_SAMESITE || 'Lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 2 * 60 * 60 * 1000,
    };

    res.cookie('token', token, cookieOptions);
    res.json({ message: 'Logged in' });
  })
);

app.get(
  '/api/me',
  authenticateToken,
  wrap(async (req, res) => {
    const sql = 'SELECT id, username, email FROM users WHERE id = ?';
    const params = [req.user.id];
    const [results] = await db.query(sql, params);
    if (!results || results.length === 0) return res.status(401).json({ error: 'Unauthorized' });
    res.json(results[0]);
  })
);

// LOGOUT ROUTE
app.post('/api/logout', (req, res) => {
  res.clearCookie('token', {
    path: '/',
    sameSite: process.env.COOKIE_SAMESITE || 'Lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  });
  res.json({ message: 'Logged out' });
});

// GET USER PROFILE
app.get(
  '/api/profile',
  authenticateToken,
  wrap(async (req, res) => {
    const sql = 'SELECT * FROM profiles WHERE user_id = ?';
    const [results] = await db.query(sql, [req.user.id]);
    
    if (!results || results.length === 0) {
      return res.json({
        user_id: req.user.id,
        profile_image: null,
        twitter: '',
        instagram: '',
        linkedin: '',
        github: '',
        bio: '',
      });
    }
    
    res.json(results[0]);
  })
);

// UPDATE USER PROFILE
app.put(
  '/api/profile',
  authenticateToken,
  wrap(async (req, res) => {
    const { profile_image, twitter, instagram, linkedin, github, bio } = req.body || {};
    const userId = req.user.id;

    // Check if profile exists
    const [existing] = await db.query('SELECT id FROM profiles WHERE user_id = ?', [userId]);

    if (existing && existing.length > 0) {
      // Update existing profile
      const sql = `
        UPDATE profiles 
        SET profile_image = ?, twitter = ?, instagram = ?, linkedin = ?, github = ?, bio = ?
        WHERE user_id = ?
      `;
      const params = [profile_image || null, twitter || '', instagram || '', linkedin || '', github || '', bio || '', userId];
      await db.query(sql, params);
    } else {
      // Create new profile
      const sql = `
        INSERT INTO profiles (user_id, profile_image, twitter, instagram, linkedin, github, bio)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [userId, profile_image || null, twitter || '', instagram || '', linkedin || '', github || '', bio || ''];
      await db.query(sql, params);
    }

    res.json({ message: 'Profile updated successfully' });
  })
);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

// graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT received, closing DB pool');
  try { if (db) await db.end(); } catch (e) { /* ignore */ }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing DB pool');
  try { if (db) await db.end(); } catch (e) { /* ignore */ }
  process.exit(0);
});