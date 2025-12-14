import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import { getDb, initDb } from './ds';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 8080);
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const AUTH_LOGO_URL = process.env.AUTH_LOGO_URL || '';

const EMAIL_USER = process.env.EMAIL_USER || 'duckly.edu@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'bnus bohv upjd mnql';

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS.trim()
  }
});

let emailServiceWorking = false;

async function testEmailConnection() {
  try {
    await transporter.verify();
    emailServiceWorking = true;
    return true;
  } catch (error: any) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      emailServiceWorking = true;
      return true;
    } catch (etherealError: any) {
      emailServiceWorking = false;
      return false;
    }
  }
}

testEmailConnection();


app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.put('/api/avatar', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const db = getDb();
    const body = (req as any).body || {};
    const avatarUrl = (body && typeof body === 'object') ? (body as any).avatarUrl : undefined;
    if (!avatarUrl) return res.status(400).json({ error: 'avatarUrl required' });
    
    const user = await db.get('SELECT avatarChangeLimit FROM users WHERE id = ?', payload.userId);
    const now = Date.now();
    const avatarLimit = user.avatarChangeLimit || 0;
    
    if (now < avatarLimit) {
      const remainingTime = Math.ceil((avatarLimit - now) / 1000);
      return res.status(429).json({ 
        error: `Слишком часто! Попробуйте через ${remainingTime} секунд`,
        remainingTime 
      });
    }
    
    await db.run('UPDATE users SET avatarUrl = ?, avatarChangeLimit = ? WHERE id = ?', 
      avatarUrl, now + 30000, payload.userId);
    const updatedUser = await db.get('SELECT id, email, username, displayName, about, avatarUrl, createdAt, plan FROM users WHERE id = ?', payload.userId);
    res.json({ user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/send-email-verification', async (req, res) => {
  let verificationCode = '';
  
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const { email } = req.body;
    
    if (!email) return res.status(400).json({ error: 'Email required' });
    
    verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const db = getDb();
    await db.run('UPDATE users SET emailVerificationCode = ?, emailVerificationExpiry = ? WHERE id = ?', 
      verificationCode, Date.now() + 600000, payload.userId);
    
    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: 'Подтверждение смены email - Duck & Law',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: white; padding: 20px; border-radius: 10px;">
          <h2 style="color: #ff8c42;">Подтверждение смены email</h2>
          <p>Ваш код подтверждения:</p>
          <div style="background: rgba(255, 140, 60, 0.1); border: 2px solid #ff8c42; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #ff8c42; font-size: 24px; margin: 0; letter-spacing: 4px;">${verificationCode}</h1>
          </div>
          <p>Код действителен в течение 10 минут.</p>
          <p style="color: #888;">Если вы не запрашивали смену email, проигнорируйте это письмо.</p>
        </div>
      `
    };
    
    if (emailServiceWorking) {
      await transporter.sendMail(mailOptions);
    }
    res.json({ message: 'Verification code sent' });
  } catch (err: any) {
    console.error('Failed to send email verification:', err.message);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

app.put('/api/update-email', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const { newEmail, verificationCode } = req.body;
    
    if (!newEmail || !verificationCode) return res.status(400).json({ error: 'Email and verification code required' });
    
    const db = getDb();
    
    const user = await db.get('SELECT emailChangeLimit FROM users WHERE id = ?', payload.userId);
    const now = Date.now();
    const emailLimit = user.emailChangeLimit || 0;
    
    if (now < emailLimit) {
      const remainingTime = Math.ceil((emailLimit - now) / (1000 * 60 * 60));
      return res.status(429).json({ 
        error: `Слишком часто! Попробуйте через ${remainingTime} часов`,
        remainingTime 
      });
    }
    
    const userWithCode = await db.get('SELECT emailVerificationCode, emailVerificationExpiry FROM users WHERE id = ?', payload.userId);
    
    if (!userWithCode.emailVerificationCode || !userWithCode.emailVerificationExpiry) {
      return res.status(400).json({ error: 'No verification code found' });
    }
    
    if (Date.now() > userWithCode.emailVerificationExpiry) {
      return res.status(400).json({ error: 'Verification code expired' });
    }
    
    if (userWithCode.emailVerificationCode !== verificationCode) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    const existingUser = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', newEmail, payload.userId);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    await db.run('UPDATE users SET email = ?, emailVerificationCode = NULL, emailVerificationExpiry = NULL, emailChangeLimit = ? WHERE id = ?', 
      newEmail, now + (24 * 60 * 60 * 1000), payload.userId);
    
    const updatedUser = await db.get('SELECT id, email, username, displayName, about, avatarUrl, createdAt, plan FROM users WHERE id = ?', payload.userId);
    res.json({ user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

function signToken(userId: number, remember = false) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: remember ? '30d' : '7d' });
}

app.post('/api/send-code', async (req, res) => {
  try {
    const { email } = req.body as { email: string };
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Требуется корректный email' });
    
    const normalized = email.toLowerCase();
    const db = getDb();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', normalized);
    if (existing) return res.status(409).json({ error: 'Уже зарегистрирован' });
    
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 1000 * 60 * 10;
    await db.run('INSERT INTO verify_codes (contact, code, purpose, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)', normalized, code, 'register', expiresAt, Date.now());
    
    if (emailServiceWorking) {
      try {
        await transporter.sendMail({
          from: EMAIL_USER,
          to: normalized,
          subject: 'Код подтверждения регистрации',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: white; padding: 20px; border-radius: 10px;">
              <h2 style="color: #ff8c42;">Подтверждение регистрации</h2>
              <p>Ваш код подтверждения:</p>
              <div style="background: rgba(255, 140, 60, 0.1); border: 2px solid #ff8c42; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="color: #ff8c42; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h1>
              </div>
              <p>Код действителен в течение 10 минут.</p>
              <p style="color: #888;">Если вы не запрашивали регистрацию, проигнорируйте это письмо.</p>
            </div>
          `
        });
      } catch (emailErr: any) {
        console.error('Failed to send verification email:', emailErr.message);
      }
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/verify-and-register', async (req, res) => {
  try {
    const db = getDb();
    const { email, code, password, remember, username, displayName, avatarUrl } = req.body as { email: string; code: string; password: string; remember?: boolean; username?: string | null; displayName?: string | null; avatarUrl?: string | null };
    if (!email || !code || !password) return res.status(400).json({ error: 'email, code, password обязательны' });
    if (!email.includes('@')) return res.status(400).json({ error: 'Некорректный email' });
    
    const normalized = email.toLowerCase();
    const row = await db.get('SELECT * FROM verify_codes WHERE contact = ? AND purpose = ? ORDER BY id DESC', normalized, 'register');
    if (!row) return res.status(400).json({ error: 'Код не найден' });
    if (row.expiresAt < Date.now()) return res.status(400).json({ error: 'Код истек' });
    if (row.code !== code) return res.status(400).json({ error: 'Неверный код' });
    
    const existing = await db.get('SELECT id FROM users WHERE email = ? OR username = ?', normalized, username || null);
    if (existing) return res.status(409).json({ error: 'Уже зарегистрирован' });
    
    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();
    const result = await db.run('INSERT INTO users (email, username, displayName, avatarUrl, passwordHash, createdAt, plan) VALUES (?, ?, ?, ?, ?, ?, ?)', normalized, username || null, displayName || username || null, avatarUrl || null, passwordHash, createdAt, 'free');
    await db.run('DELETE FROM verify_codes WHERE contact = ? AND purpose = ?', normalized, 'register');
    const token = signToken(result.lastID as number, !!remember);
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const db = getDb();
    const { login, password, remember } = req.body as { login: string; password: string; remember?: boolean };
    if (!login || !password) return res.status(400).json({ error: 'Логин и пароль обязательны' });

    let user = null as any;
    if (login.includes('@')) {
      user = await db.get('SELECT * FROM users WHERE email = ?', login.toLowerCase());
    } else {
      user = await db.get('SELECT * FROM users WHERE username = ?', login);
    }
    if (!user) return res.status(401).json({ error: 'Неверные учетные данные' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Неверные учетные данные' });

    const token = signToken(user.id, !!remember);
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const db = await getDb();
    const user = await db.get('SELECT id, email, username, displayName, about, avatarUrl, createdAt, plan, historyKZPlan, historyKZExpiry, worldHistoryPlan, worldHistoryExpiry, lawBasicsPlan, lawBasicsExpiry, chinesePlan, chineseExpiry FROM users WHERE id = ?', payload.userId);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ user });
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const db = getDb();

    const { displayName, about } = req.body as { displayName?: string | null; about?: string | null };
    
    if (typeof displayName !== 'undefined') {
      const user = await db.get('SELECT displayNameChangeLimit FROM users WHERE id = ?', payload.userId);
      const now = Date.now();
      const displayNameLimit = user.displayNameChangeLimit || 0;
      
      if (now < displayNameLimit) {
        const remainingTime = Math.ceil((displayNameLimit - now) / (1000 * 60 * 60));
        return res.status(429).json({ 
          error: `Слишком часто! Попробуйте через ${remainingTime} часов`,
          remainingTime 
        });
      }
    }
    
    const fields: string[] = [];
    const values: any[] = [];
    if (typeof displayName !== 'undefined') { 
      fields.push('displayName = ?'); 
      values.push(displayName || null);
      fields.push('displayNameChangeLimit = ?');
      values.push(Date.now() + (24 * 60 * 60 * 1000));
    }
    if (typeof about !== 'undefined') { fields.push('about = ?'); values.push(about || null); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(payload.userId);
    await db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, ...values);
    const user = await db.get('SELECT id, email, username, displayName, about, avatarUrl, createdAt, plan FROM users WHERE id = ?', payload.userId);
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/change-password', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const db = getDb();
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Текущий и новый пароль обязательны' });

    const user = await db.get('SELECT id, passwordHash FROM users WHERE id = ?', payload.userId);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Неверный текущий пароль' });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.run('UPDATE users SET passwordHash = ? WHERE id = ?', passwordHash, payload.userId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/config', (_req, res) => {
  res.json({ logoUrl: AUTH_LOGO_URL })
})

app.post('/api/request-password-reset', async (req, res) => {
  try {
    const db = getDb();
    const { email } = req.body as { email: string };
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Требуется корректный email' });

    const normalized = email.toLowerCase();
    const user = await db.get('SELECT id, email FROM users WHERE email = ?', normalized);
    
    if (!user) {
      return res.json({ ok: true });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 1000 * 60 * 10;

    await db.run('INSERT INTO password_reset_codes (email, code, expiresAt, createdAt) VALUES (?, ?, ?, ?)', 
      normalized, resetCode, expiresAt, Date.now());

    if (emailServiceWorking) {
      try {
        const mailOptions = {
          from: EMAIL_USER,
          to: user.email,
          subject: 'Код восстановления пароля - Duck & Law',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: white; padding: 20px; border-radius: 10px;">
              <h2 style="color: #ff8c42;">Восстановление пароля</h2>
              <p>Вы запросили восстановление пароля для вашего аккаунта.</p>
              <p>Ваш код восстановления:</p>
              <div style="background: rgba(255, 140, 60, 0.1); border: 2px solid #ff8c42; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="color: #ff8c42; font-size: 32px; margin: 0; letter-spacing: 4px;">${resetCode}</h1>
              </div>
              <p>Код действителен в течение 10 минут.</p>
              <p style="color: #888;">Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.</p>
            </div>
          `
        };
        
        await transporter.sendMail(mailOptions);
      } catch (emailErr: any) {
        console.error('Failed to send email:', emailErr.message);
      }
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/verify-reset-code', async (req, res) => {
  try {
    const db = getDb();
    const { email, code } = req.body as { email: string; code: string };
    if (!email || !code) return res.status(400).json({ error: 'Email и код обязательны' });

    const normalized = email.toLowerCase();
    const resetRecord = await db.get('SELECT * FROM password_reset_codes WHERE email = ? AND code = ? AND used = FALSE ORDER BY createdAt DESC', 
      normalized, code);

    if (!resetRecord) return res.status(400).json({ error: 'Неверный код' });
    if (resetRecord.expiresAt < Date.now()) return res.status(400).json({ error: 'Код истек' });

    res.json({ ok: true, message: 'Код подтвержден' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const db = getDb();
    const { email, code, newPassword } = req.body as { email: string; code: string; newPassword: string };
    if (!email || !code || !newPassword) return res.status(400).json({ error: 'Все поля обязательны' });
    if (newPassword.length < 6 || newPassword.length > 32) return res.status(400).json({ error: 'Пароль должен содержать от 6 до 32 символов' });

    const normalized = email.toLowerCase();
    const resetRecord = await db.get('SELECT * FROM password_reset_codes WHERE email = ? AND code = ? AND used = FALSE ORDER BY createdAt DESC', 
      normalized, code);

    if (!resetRecord) return res.status(400).json({ error: 'Неверный код' });
    if (resetRecord.expiresAt < Date.now()) return res.status(400).json({ error: 'Код истек' });

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.run('UPDATE users SET passwordHash = ?, passwordChangeLimit = ? WHERE email = ?', 
      passwordHash, Date.now() + (12 * 60 * 60 * 1000), normalized);

    await db.run('UPDATE password_reset_codes SET used = TRUE WHERE id = ?', resetRecord.id);

    res.json({ ok: true, message: 'Пароль успешно изменен' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/api/subscription', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const { plan } = req.body as { plan: string };
    const allowed = ['free', 'pro', 'enterprise'];
    if (!allowed.includes(plan)) return res.status(400).json({ error: 'Invalid plan' });
    const db = getDb();
    await db.run('UPDATE users SET plan = ? WHERE id = ?', plan, payload.userId);
    const user = await db.get('SELECT id, email, username, avatarUrl, createdAt, plan FROM users WHERE id = ?', payload.userId);
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/subscriptions', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    const db = getDb();
    const user = await db.get(`
      SELECT 
        id, email, username, avatarUrl, createdAt, plan,
        historyKZPlan, historyKZExpiry, historyKZStatus,
        worldHistoryPlan, worldHistoryExpiry, worldHistoryStatus,
        lawBasicsPlan, lawBasicsExpiry, lawBasicsStatus,
        chinesePlan, chineseExpiry, chineseStatus
      FROM users 
      WHERE id = ?
    `, payload.userId);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const subscriptions = [];
    
    const getDaysRemaining = (expiry: number | null) => {
      if (expiry === null) return null;
      if (expiry === -1) return 'infinity';
      const now = Date.now();
      const diff = expiry - now;
      if (diff <= 0) return 0;
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };
    
    if (user.plan && user.plan !== 'free' && user.plan !== 'admin') {
      const planSubscriptions = user.plan.split(',').map((p: string) => p.trim());
      
      planSubscriptions.forEach((planSub: string) => {
        const [subject, planType] = planSub.split('_');
        
        let subjectName = '';
        let subjectKey = '';
        
        switch (subject) {
          case 'histKZ':
            subjectName = 'История Казахстана';
            subjectKey = 'historyKZ';
            break;
          case 'worldHist':
            subjectName = 'Всемирная История';
            subjectKey = 'worldHistory';
            break;
          case 'lawBasics':
            subjectName = 'Основы права';
            subjectKey = 'lawBasics';
            break;
          case 'chinese':
            subjectName = 'Китайский язык';
            subjectKey = 'chinese';
            break;
          default:
            return;
        }
        
        subscriptions.push({
          subject: subjectKey,
          name: subjectName,
          plan: planType,
          expiry: -1,
          daysRemaining: 'infinity'
        });
      });
    }
    
    if (user.historyKZPlan && user.historyKZStatus !== 'cancelled') {
      subscriptions.push({
        subject: 'historyKZ',
        name: 'История Казахстана',
        plan: user.historyKZPlan,
        expiry: user.historyKZExpiry,
        daysRemaining: getDaysRemaining(user.historyKZExpiry),
        status: user.historyKZStatus || 'active'
      });
    }
    
    if (user.worldHistoryPlan && user.worldHistoryStatus !== 'cancelled') {
      subscriptions.push({
        subject: 'worldHistory',
        name: 'Всемирная История',
        plan: user.worldHistoryPlan,
        expiry: user.worldHistoryExpiry,
        daysRemaining: getDaysRemaining(user.worldHistoryExpiry),
        status: user.worldHistoryStatus || 'active'
      });
    }
    
    if (user.lawBasicsPlan && user.lawBasicsStatus !== 'cancelled') {
      subscriptions.push({
        subject: 'lawBasics',
        name: 'Основы права',
        plan: user.lawBasicsPlan,
        expiry: user.lawBasicsExpiry,
        daysRemaining: getDaysRemaining(user.lawBasicsExpiry),
        status: user.lawBasicsStatus || 'active'
      });
    }
    
    if (user.chinesePlan && user.chineseStatus !== 'cancelled') {
      subscriptions.push({
        subject: 'chinese',
        name: 'Китайский язык',
        plan: user.chinesePlan,
        expiry: user.chineseExpiry,
        daysRemaining: getDaysRemaining(user.chineseExpiry),
        status: user.chineseStatus || 'active'
      });
    }
    
    res.json({ subscriptions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const publicPath = path.resolve(process.cwd(), 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

const frontendPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (_, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}


const TELEGRAM_BOT_TOKEN = '8370515758:AAGjPbV4umLNgdS1aQ3SBHW9g6H38LZD8DA'
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

async function setTelegramWebhook() {
  try {
    const webhookUrl = process.env.NODE_ENV === 'production' 
      ? `${process.env.BASE_URL || 'https://duckandlaw.com'}/api/telegram-webhook`
      : `${process.env.WEBHOOK_URL || 'https://your-ngrok-url.ngrok.io'}/api/telegram-webhook`
    
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: webhookUrl,
        allowed_updates: ['message']
      })
    })
    
    const result = await response.json()
    
    const infoResponse = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`)
    const info = await infoResponse.json()
    
  } catch (error) {
    console.error('Failed to set Telegram webhook:', error)
  }
}

setTelegramWebhook()

if (process.env.NODE_ENV !== 'production') {
  let lastUpdateId = 0;
  
  async function pollTelegramUpdates() {
    try {
      const response = await fetch(`${TELEGRAM_API_URL}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
      const data = await response.json();
      
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          
          if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text;
            const username = update.message.from.username;
            const userId = update.message.from.id;
            
            if (text.startsWith('/start connect_')) {
              const connectionCode = text.replace('/start connect_', '');
              
              if (connectionCodes.has(connectionCode)) {
                const connectionData = connectionCodes.get(connectionCode);
                
                if (connectionData && Date.now() < connectionData.expires) {
                  const db = getDb();
                  await db.run(
                    'UPDATE users SET telegram_user_id = ?, telegram_username = ? WHERE id = ?',
                    userId, username, connectionData.userId
                  );
                  
                  connectionCodes.delete(connectionCode);
                  
                  await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: chatId,
                      text: `✅ Ваш Telegram аккаунт @${username} успешно подключен к Duckly Education!\n\nТеперь вы будете получать уведомления о новых материалах и тестах.`
                    })
                  });
                }
              } else {
                await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: '❌ Неверный или истекший код подключения. Пожалуйста, получите новый код на сайте.'
                  })
                });
              }
            } else if (text === '/start') {
              await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `👋 Добро пожаловать в Duckly Education Bot!\n\nДля подключения аккаунта используйте код, полученный на сайте duckandlaw.com`
                })
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
    
    setTimeout(pollTelegramUpdates, 1000);
  }
  
  setTimeout(pollTelegramUpdates, 5000);
}

const connectionCodes = new Map<string, { userId: number, expires: number }>()

app.get('/api/telegram-status', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    const db = getDb();
    const user = await db.get(
      'SELECT telegram_user_id, telegram_username FROM users WHERE id = ?',
      payload.userId
    );
    
    if (user && user.telegram_user_id) {
      res.json({ 
        connected: true, 
        username: user.telegram_username,
        userId: user.telegram_user_id 
      });
    } else {
      res.json({ connected: false });
    }
    
  } catch (error) {
    console.error('Telegram status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/disconnect-telegram', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    const db = getDb();
    await db.run(
      'UPDATE users SET telegram_user_id = NULL, telegram_username = NULL WHERE id = ?',
      payload.userId
    );
    
    res.json({ success: true, message: 'Telegram disconnected' });
    
  } catch (error) {
    console.error('Telegram disconnect error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/telegram-connect', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    const connectionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expires = Date.now() + (10 * 60 * 1000);
    
    connectionCodes.set(connectionCode, { userId: payload.userId, expires });
    
    res.json({ 
      success: true, 
      connectionCode,
      botUrl: `https://t.me/ducklyedu_bot?start=connect_${connectionCode}`,
      message: 'Connection code generated. Use it in Telegram bot.' 
    });
    
  } catch (error) {
    console.error('Telegram connect error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/telegram-webhook', async (req, res) => {
  try {
    const update = req.body;
    
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const username = update.message.from.username;
      const userId = update.message.from.id;
      
      if (text.startsWith('/start connect_')) {
        const connectionCode = text.replace('/start connect_', '');
        
        if (connectionCodes.has(connectionCode)) {
          const connectionData = connectionCodes.get(connectionCode);
          
          if (connectionData && Date.now() < connectionData.expires) {
            const db = getDb();
            await db.run(
              'UPDATE users SET telegram_user_id = ?, telegram_username = ? WHERE id = ?',
              userId, username, connectionData.userId
            );
            
            connectionCodes.delete(connectionCode);
            
            await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: `✅ Ваш Telegram аккаунт @${username} успешно подключен к Duckly Education!\n\nТеперь вы будете получать уведомления о новых материалах и тестах.`
              })
            });
            
            res.json({ success: true });
            return;
          }
        }
        
        await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '❌ Неверный или истекший код подключения. Пожалуйста, получите новый код на сайте.'
          })
        });
      } else if (text === '/start') {
        await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `👋 Добро пожаловать в Duckly Education Bot!\n\nДля подключения аккаунта используйте код, полученный на сайте duckandlaw.com`
          })
        });
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ error: 'Webhook error' });
  }
});

app.post('/api/cancel-subscription', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const { subscriptionId } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }
    
    const db = getDb();
    
    let planField = '';
    let expiryField = '';
    let statusField = '';
    
    switch (subscriptionId) {
      case 'historyKZ':
        planField = 'historyKZPlan';
        expiryField = 'historyKZExpiry';
        statusField = 'historyKZStatus';
        break;
      case 'worldHistory':
        planField = 'worldHistoryPlan';
        expiryField = 'worldHistoryExpiry';
        statusField = 'worldHistoryStatus';
        break;
      case 'lawBasics':
        planField = 'lawBasicsPlan';
        expiryField = 'lawBasicsExpiry';
        statusField = 'lawBasicsStatus';
        break;
      case 'chinese':
        planField = 'chinesePlan';
        expiryField = 'chineseExpiry';
        statusField = 'chineseStatus';
        break;
      default:
        return res.status(400).json({ error: 'Invalid subscription ID' });
    }
    
    const user = await db.get(
      `SELECT ${planField}, ${expiryField}, ${statusField} FROM users WHERE id = ?`,
      payload.userId
    );
    
    if (!user || !user[planField] || user[statusField] === 'cancelled') {
      return res.status(404).json({ error: 'Active subscription not found' });
    }
    
    await db.run(
      `UPDATE users SET ${planField} = NULL, ${expiryField} = NULL, ${statusField} = 'cancelled' WHERE id = ?`,
      payload.userId
    );
    
    res.json({ 
      success: true, 
      message: 'Subscription cancelled and removed successfully' 
    });
    
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin API endpoints
async function checkAdmin(req: any, res: any, next: any) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const db = getDb();
    const user = await db.get('SELECT plan FROM users WHERE id = ?', payload.userId);
    if (!user || user.plan !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    req.adminUserId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Получить список всех пользователей
app.get('/api/admin/users', checkAdmin, async (req, res) => {
  try {
    const db = getDb();
    const users = await db.all(`
      SELECT 
        id, email, username, displayName, avatarUrl, createdAt, plan,
        historyKZPlan, historyKZExpiry, historyKZStatus,
        worldHistoryPlan, worldHistoryExpiry, worldHistoryStatus,
        lawBasicsPlan, lawBasicsExpiry, lawBasicsStatus,
        chinesePlan, chineseExpiry, chineseStatus
      FROM users
      ORDER BY createdAt DESC
    `);
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Выдача/снятие подписки
app.post('/api/admin/subscription', checkAdmin, async (req, res) => {
  try {
    const { userId, subject, plan, expiryDays } = req.body;
    if (!userId || !subject) {
      return res.status(400).json({ error: 'userId and subject required' });
    }
    
    const db = getDb();
    let planField = '';
    let expiryField = '';
    let statusField = '';
    
    switch (subject) {
      case 'historyKZ':
        planField = 'historyKZPlan';
        expiryField = 'historyKZExpiry';
        statusField = 'historyKZStatus';
        break;
      case 'worldHistory':
        planField = 'worldHistoryPlan';
        expiryField = 'worldHistoryExpiry';
        statusField = 'worldHistoryStatus';
        break;
      case 'lawBasics':
        planField = 'lawBasicsPlan';
        expiryField = 'lawBasicsExpiry';
        statusField = 'lawBasicsStatus';
        break;
      case 'chinese':
        planField = 'chinesePlan';
        expiryField = 'chineseExpiry';
        statusField = 'chineseStatus';
        break;
      default:
        return res.status(400).json({ error: 'Invalid subject' });
    }
    
    if (plan && expiryDays !== undefined) {
      // Выдача подписки
      const expiry = expiryDays === -1 || expiryDays === 'infinity' ? -1 : Date.now() + (expiryDays * 24 * 60 * 60 * 1000);
      await db.run(
        `UPDATE users SET ${planField} = ?, ${expiryField} = ?, ${statusField} = 'active' WHERE id = ?`,
        plan, expiry, userId
      );
    } else {
      // Снятие подписки
      await db.run(
        `UPDATE users SET ${planField} = NULL, ${expiryField} = NULL, ${statusField} = 'cancelled' WHERE id = ?`,
        userId
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Изменение данных пользователя (displayName, username, email)
app.put('/api/admin/user/:userId', checkAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { displayName, username, email } = req.body;
    
    if (!displayName && !username && !email) {
      return res.status(400).json({ error: 'At least one field required' });
    }
    
    const db = getDb();
    const fields: string[] = [];
    const values: any[] = [];
    
    if (displayName !== undefined) {
      fields.push('displayName = ?');
      values.push(displayName || null);
    }
    if (username !== undefined) {
      // Проверка уникальности username
      if (username) {
        const existing = await db.get('SELECT id FROM users WHERE username = ? AND id != ?', username, userId);
        if (existing) {
          return res.status(400).json({ error: 'Username already in use' });
        }
      }
      fields.push('username = ?');
      values.push(username || null);
    }
    if (email !== undefined) {
      // Проверка уникальности email
      if (email) {
        const normalized = email.toLowerCase();
        const existing = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', normalized, userId);
        if (existing) {
          return res.status(400).json({ error: 'Email already in use' });
        }
        fields.push('email = ?');
        values.push(normalized);
      } else {
        fields.push('email = ?');
        values.push(null);
      }
    }
    
    values.push(userId);
    await db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, ...values);
    
    const updatedUser = await db.get('SELECT id, email, username, displayName, avatarUrl, createdAt, plan FROM users WHERE id = ?', userId);
    res.json({ user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Изменение пароля пользователя
// API endpoints для тестов
app.post('/api/test/submit', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const db = getDb();
    const { subject, topicId, topicTitle, totalQuestions, correctAnswers, reviewData } = req.body as {
      subject: string;
      topicId: string;
      topicTitle: string;
      totalQuestions: number;
      correctAnswers: number;
      reviewData?: string;
    };
    
    if (!subject || !topicId || !topicTitle || totalQuestions === undefined || correctAnswers === undefined) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
    
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const completedAt = new Date().toISOString();
    const reviewDataJson = reviewData ? JSON.stringify(reviewData) : null;
    
    const result = await db.run(
      'INSERT INTO test_results (userId, subject, topicId, topicTitle, totalQuestions, correctAnswers, score, completedAt, reviewData) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      payload.userId,
      subject,
      topicId,
      topicTitle,
      totalQuestions,
      correctAnswers,
      score,
      completedAt,
      reviewDataJson
    );
    
    res.json({
      id: result.lastID,
      score,
      completedAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/test/results', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const db = getDb();
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    const results = await db.all(
      'SELECT * FROM test_results WHERE userId = ? ORDER BY completedAt DESC LIMIT ? OFFSET ?',
      payload.userId,
      limit,
      offset
    );
    
    // Парсим reviewData для каждого результата
    const parsedResults = results.map((result: any) => {
      if (result.reviewData) {
        try {
          result.reviewData = JSON.parse(result.reviewData);
        } catch (e) {
          result.reviewData = null;
        }
      }
      return result;
    });
    
    const total = await db.get('SELECT COUNT(*) as count FROM test_results WHERE userId = ?', payload.userId);
    const totalPages = Math.ceil((total?.count || 0) / limit);
    
    res.json({
      results: parsedResults,
      pagination: {
        page,
        limit,
        total: total?.count || 0,
        totalPages
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/user/:userId/password', checkAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const db = getDb();
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.run('UPDATE users SET passwordHash = ? WHERE id = ?', passwordHash, userId);
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Auth server running on http://0.0.0.0:${PORT}`);
    console.log(`   Local: http://localhost:${PORT}`);
    console.log(`   Network: http://193.39.68.185:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize DB', err);
  process.exit(1);
});