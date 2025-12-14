import sqlite3 from 'sqlite3';
import path from 'path';
import { open, Database } from 'sqlite';


let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;


export async function initDb() {
const dbPath = path.resolve(__dirname, '..', '..', 'data', 'auth.db');
db = await open({ filename: dbPath, driver: sqlite3.Database });


await db.exec(`
PRAGMA foreign_keys = ON;
`);


await db.exec(`
CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
email TEXT UNIQUE,
phone TEXT UNIQUE,
username TEXT UNIQUE,
displayName TEXT,
about TEXT,
avatarUrl TEXT,
passwordHash TEXT NOT NULL,
emailVerificationCode TEXT,
emailVerificationExpiry INTEGER,
avatarChangeLimit INTEGER DEFAULT 0,
displayNameChangeLimit INTEGER DEFAULT 0,
emailChangeLimit INTEGER DEFAULT 0,
passwordChangeLimit INTEGER DEFAULT 0,
createdAt TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS reset_tokens (
id INTEGER PRIMARY KEY AUTOINCREMENT,
userId INTEGER NOT NULL,
token TEXT NOT NULL,
expiresAt INTEGER NOT NULL,
FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verify_codes (
id INTEGER PRIMARY KEY AUTOINCREMENT,
contact TEXT NOT NULL,
code TEXT NOT NULL,
purpose TEXT NOT NULL,
expiresAt INTEGER NOT NULL,
attempts INTEGER NOT NULL DEFAULT 0,
createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS password_reset_codes (
id INTEGER PRIMARY KEY AUTOINCREMENT,
email TEXT NOT NULL,
code TEXT NOT NULL,
expiresAt INTEGER NOT NULL,
createdAt INTEGER NOT NULL,
used BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS test_results (
id INTEGER PRIMARY KEY AUTOINCREMENT,
userId INTEGER NOT NULL,
subject TEXT NOT NULL,
topicId TEXT NOT NULL,
topicTitle TEXT NOT NULL,
totalQuestions INTEGER NOT NULL,
correctAnswers INTEGER NOT NULL,
score INTEGER NOT NULL,
completedAt TEXT NOT NULL,
reviewData TEXT,
FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
);
`);

try { await db.exec('ALTER TABLE users ADD COLUMN username TEXT UNIQUE'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN displayName TEXT'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN about TEXT'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN avatarUrl TEXT'); } catch {}
try { await db.exec("ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free'"); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN emailVerificationCode TEXT'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN emailVerificationExpiry INTEGER'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN avatarChangeLimit INTEGER DEFAULT 0'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN displayNameChangeLimit INTEGER DEFAULT 0'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN emailChangeLimit INTEGER DEFAULT 0'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN passwordChangeLimit INTEGER DEFAULT 0'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN historyKZPlan TEXT DEFAULT NULL'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN historyKZExpiry INTEGER DEFAULT NULL'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN worldHistoryPlan TEXT DEFAULT NULL'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN worldHistoryExpiry INTEGER DEFAULT NULL'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN lawBasicsPlan TEXT DEFAULT NULL'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN lawBasicsExpiry INTEGER DEFAULT NULL'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN chinesePlan TEXT DEFAULT NULL'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN chineseExpiry INTEGER DEFAULT NULL'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN historyKZStatus TEXT DEFAULT NULL'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN worldHistoryStatus TEXT DEFAULT NULL'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN lawBasicsStatus TEXT DEFAULT NULL'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN chineseStatus TEXT DEFAULT NULL'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN telegram_user_id INTEGER DEFAULT NULL'); } catch {}
try { await db.exec('ALTER TABLE users ADD COLUMN telegram_username TEXT DEFAULT NULL'); } catch {}
try { await db.exec('CREATE TABLE IF NOT EXISTS password_reset_codes (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, code TEXT NOT NULL, expiresAt INTEGER NOT NULL, createdAt INTEGER NOT NULL, used BOOLEAN DEFAULT FALSE)'); } catch {}
try { await db.exec('ALTER TABLE test_results ADD COLUMN reviewData TEXT'); } catch {}


return db;
}


export function getDb() {
if (!db) throw new Error('Database not initialized. Call initDb first.');
return db;
}