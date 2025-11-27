import express from 'express';
import cors from 'cors';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const PORT = process.env.PORT || 4000;
const DB_PATH = path.resolve(process.cwd(), 'server', 'habit_hero.db');

app.use(cors());
// Increase body size limit to support base64 image in rewards (compressed client-side)
app.use(express.json({ limit: '20mb' }));

const defaultData = {
  childName: '宝贝',
  parentPin: '0000',
  totalPoints: 0,
  avatar: null,
  habits: [
    { id: '1', name: '打扫房间', points: 10, emoji: '🧹' },
    { id: '2', name: '完成作业', points: 15, emoji: '📚' },
    { id: '3', name: '认真刷牙', points: 5, emoji: '🦷' },
    { id: '4', name: '吃蔬菜', points: 5, emoji: '🥦' },
  ],
  rewards: [
    { id: '1', name: '看电视30分钟', cost: 50, emoji: '📺' },
    { id: '2', name: '吃冰淇淋', cost: 100, emoji: '🍦' },
    { id: '3', name: '买新玩具', cost: 500, emoji: '🧸' },
  ],
  pendingTasks: [],
  transactions: [],
};

let db;
async function initDb() {
  db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  await db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      childName TEXT,
      parentPin TEXT,
      totalPoints INTEGER,
      avatar TEXT
    );
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT,
      points INTEGER,
      emoji TEXT
    );
    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      name TEXT,
      cost INTEGER,
      emoji TEXT
    );
    CREATE TABLE IF NOT EXISTS pending_tasks (
      id TEXT PRIMARY KEY,
      habitId TEXT,
      habitName TEXT,
      points INTEGER,
      emoji TEXT,
      timestamp TEXT
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT,
      amount INTEGER,
      description TEXT,
      date TEXT
    );
  `);
  // Try to add image column for rewards if missing
  try {
    await db.exec('ALTER TABLE rewards ADD COLUMN image TEXT');
  } catch (e) {
    // ignore if column exists
  }
  // Try to add avatar column for settings if missing
  try {
    await db.exec('ALTER TABLE settings ADD COLUMN avatar TEXT');
  } catch (e) {
    // ignore if column exists
  }
  const row = await db.get('SELECT COUNT(1) as c FROM settings WHERE id = 1');
  if (!row || row.c === 0) {
    await db.run('INSERT INTO settings (id, childName, parentPin, totalPoints, avatar) VALUES (1, ?, ?, ?, ?)', defaultData.childName, defaultData.parentPin, defaultData.totalPoints, defaultData.avatar);
    // seed defaults for habits/rewards
    const insertHabit = await db.prepare('INSERT OR IGNORE INTO habits (id, name, points, emoji) VALUES (?, ?, ?, ?)');
    for (const h of defaultData.habits) {
      await insertHabit.run(h.id, h.name, h.points, h.emoji);
    }
    await insertHabit.finalize();
    const insertReward = await db.prepare('INSERT OR IGNORE INTO rewards (id, name, cost, emoji, image) VALUES (?, ?, ?, ?, ?)');
    for (const r of defaultData.rewards) {
      await insertReward.run(r.id, r.name, r.cost, r.emoji, null);
    }
    await insertReward.finalize();
  }
}

function normalizeData(raw) {
  return {
    childName: raw.settings.childName ?? defaultData.childName,
    parentPin: raw.settings.parentPin ?? defaultData.parentPin,
    totalPoints: raw.settings.totalPoints ?? 0,
    avatar: raw.settings.avatar ?? null,
    habits: raw.habits ?? [],
    rewards: raw.rewards ?? [],
    pendingTasks: raw.pendingTasks ?? [],
    transactions: raw.transactions ?? [],
  };
}

async function readAll() {
  const settings = await db.get('SELECT childName, parentPin, totalPoints, avatar FROM settings WHERE id = 1');
  const habits = await db.all('SELECT id, name, points, emoji FROM habits');
  const rewards = await db.all('SELECT id, name, cost, emoji, image FROM rewards');
  const pendingTasks = await db.all('SELECT id, habitId, habitName, points, emoji, timestamp FROM pending_tasks');
  const transactions = await db.all('SELECT id, type, amount, description, date FROM transactions ORDER BY date DESC');
  return normalizeData({ settings, habits, rewards, pendingTasks, transactions });
}

// Get full app data
app.get('/api/data', async (req, res) => {
  try {
    const data = await readAll();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// Save settings (partial app config) and lists
app.post('/api/settings', async (req, res) => {
  const incoming = req.body;
  let started = false;
  try {
    await db.exec('BEGIN');
    started = true;
    await db.run('UPDATE settings SET childName = ?, parentPin = ?, totalPoints = ?, avatar = ? WHERE id = 1', incoming.childName ?? defaultData.childName, incoming.parentPin ?? defaultData.parentPin, typeof incoming.totalPoints === 'number' ? incoming.totalPoints : 0, incoming.avatar ?? null);
    if (Array.isArray(incoming.habits)) {
      await db.run('DELETE FROM habits');
      const stmt = await db.prepare('INSERT INTO habits (id, name, points, emoji) VALUES (?, ?, ?, ?)');
      for (const h of incoming.habits) {
        await stmt.run(h.id, h.name, h.points, h.emoji);
      }
      await stmt.finalize();
    }
    if (Array.isArray(incoming.rewards)) {
      await db.run('DELETE FROM rewards');
      const stmt = await db.prepare('INSERT INTO rewards (id, name, cost, emoji, image) VALUES (?, ?, ?, ?, ?)');
      for (const r of incoming.rewards) {
        await stmt.run(r.id, r.name, r.cost, r.emoji ?? null, r.image ?? null);
      }
      await stmt.finalize();
    }
    if (Array.isArray(incoming.pendingTasks)) {
      await db.run('DELETE FROM pending_tasks');
      const stmt = await db.prepare('INSERT INTO pending_tasks (id, habitId, habitName, points, emoji, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
      for (const t of incoming.pendingTasks) {
        await stmt.run(t.id, t.habitId, t.habitName, t.points, t.emoji, t.timestamp);
      }
      await stmt.finalize();
    }
    await db.exec('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    if (started) {
      try { await db.exec('ROLLBACK'); } catch { }
    }
    console.error('Failed to save settings:', e);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Add single transaction
app.post('/api/transaction', async (req, res) => {
  try {
    const tx = req.body;
    await db.run('INSERT INTO transactions (id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)', tx.id, tx.type, tx.amount, tx.description, tx.date);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save transaction' });
  }
});

// Bulk add transactions
app.post('/api/bulk-transactions', async (req, res) => {
  try {
    const list = Array.isArray(req.body) ? req.body : [];
    await db.exec('BEGIN');
    const stmt = await db.prepare('INSERT INTO transactions (id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)');
    for (const t of list) {
      await stmt.run(t.id, t.type, t.amount, t.description, t.date);
    }
    await stmt.finalize();
    await db.exec('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await db.exec('ROLLBACK');
    res.status(500).json({ error: 'Failed to bulk save transactions' });
  }
});

// Import full data (replace)
app.post('/api/import', async (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data.totalPoints !== 'number') {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    await db.exec('BEGIN');
    await db.run('UPDATE settings SET childName = ?, parentPin = ?, totalPoints = ?, avatar = ? WHERE id = 1', data.childName ?? defaultData.childName, data.parentPin ?? defaultData.parentPin, data.totalPoints, data.avatar ?? null);
    await db.run('DELETE FROM habits');
    await db.run('DELETE FROM rewards');
    await db.run('DELETE FROM pending_tasks');
    await db.run('DELETE FROM transactions');
    const hStmt = await db.prepare('INSERT INTO habits (id, name, points, emoji) VALUES (?, ?, ?, ?)');
    for (const h of data.habits || []) await hStmt.run(h.id, h.name, h.points, h.emoji);
    await hStmt.finalize();
    const rStmt = await db.prepare('INSERT INTO rewards (id, name, cost, emoji, image) VALUES (?, ?, ?, ?, ?)');
    for (const r of data.rewards || []) await rStmt.run(r.id, r.name, r.cost, r.emoji ?? null, r.image ?? null);
    await rStmt.finalize();
    const pStmt = await db.prepare('INSERT INTO pending_tasks (id, habitId, habitName, points, emoji, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
    for (const t of data.pendingTasks || []) await pStmt.run(t.id, t.habitId, t.habitName, t.points, t.emoji, t.timestamp);
    await pStmt.finalize();
    const tStmt = await db.prepare('INSERT INTO transactions (id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)');
    for (const tx of data.transactions || []) await tStmt.run(tx.id, tx.type, tx.amount, tx.description, tx.date);
    await tStmt.finalize();
    await db.exec('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await db.exec('ROLLBACK');
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Export full data
app.get('/api/export', async (req, res) => {
  try {
    const data = await readAll();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Reset all data (Developer tool)
app.post('/api/reset', async (req, res) => {
  try {
    const { password } = req.body || {};
    if (password !== 'admin') {
      return res.status(403).json({ error: 'Invalid password' });
    }
    await db.exec('BEGIN');
    await db.run('UPDATE settings SET childName = ?, parentPin = ?, totalPoints = ?, avatar = ? WHERE id = 1', defaultData.childName, defaultData.parentPin, 0, null);
    await db.run('DELETE FROM habits');
    await db.run('DELETE FROM rewards');
    await db.run('DELETE FROM pending_tasks');
    await db.run('DELETE FROM transactions');
    await db.exec('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await db.exec('ROLLBACK');
    res.status(500).json({ error: 'Failed to reset data' });
  }
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`HabitHero server (SQLite) running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to init DB', err);
  process.exit(1);
});
