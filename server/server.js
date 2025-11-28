import express from 'express';
import cors from 'cors';
import path from 'path';
import Database from 'better-sqlite3';

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
    { id: '1', name: '自己穿衣服', points: 10, emoji: '👕' },
    { id: '2', name: '自己吃饭', points: 10, emoji: '🍽️' },
    { id: '3', name: '收拾玩具', points: 10, emoji: '🧸' },
    { id: '4', name: '认真洗手', points: 5, emoji: '🧼' },
    { id: '5', name: '说谢谢', points: 5, emoji: '🙏' },
    { id: '6', name: '分享玩具', points: 10, emoji: '🤝' },
    { id: '7', name: '自己上厕所', points: 10, emoji: '🚽' },
    { id: '8', name: '按时睡觉', points: 15, emoji: '😴' },
    { id: '9', name: '听老师话', points: 10, emoji: '👂' },
    { id: '10', name: '帮助别人', points: 15, emoji: '💝' },
  ],
  rewards: [
    { id: '1', name: '看动画片15分钟', cost: 30, emoji: '📺' },
    { id: '2', name: '吃小零食', cost: 20, emoji: '🍪' },
    { id: '3', name: '去公园玩', cost: 50, emoji: '🌳' },
    { id: '4', name: '买小贴纸', cost: 40, emoji: '⭐' },
    { id: '5', name: '听故事', cost: 25, emoji: '📖' },
    { id: '6', name: '玩喜欢的玩具', cost: 30, emoji: '🚗' },
    { id: '7', name: '和爸爸妈妈做手工', cost: 40, emoji: '✂️' },
    { id: '8', name: '选择晚餐', cost: 35, emoji: '🍕' },
    { id: '9', name: '晚睡15分钟', cost: 50, emoji: '🌙' },
    { id: '10', name: '去游乐场', cost: 100, emoji: '🎠' },
  ],
  pendingTasks: [],
  transactions: [],
  deductions: [
    { id: '1', name: '不听话', points: 10, emoji: '😠' },
    { id: '2', name: '乱扔东西', points: 5, emoji: '🗑️' },
    { id: '3', name: '打人/推人', points: 15, emoji: '👊' },
    { id: '4', name: '不分享', points: 10, emoji: '🙅' },
    { id: '5', name: '哭闹发脾气', points: 10, emoji: '😭' },
    { id: '6', name: '不收拾玩具', points: 5, emoji: '🧹' },
    { id: '7', name: '说脏话', points: 15, emoji: '🤬' },
    { id: '8', name: '抢别人东西', points: 15, emoji: '✋' },
    { id: '9', name: '不按时睡觉', points: 10, emoji: '🌙' },
    { id: '10', name: '不礼貌', points: 5, emoji: '😤' },
  ],
};

let db;
function initDb() {
  db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');
  db.exec(`
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
    CREATE TABLE IF NOT EXISTS deductions (
      id TEXT PRIMARY KEY,
      name TEXT,
      points INTEGER,
      emoji TEXT
    );
  `);
  // Try to add image column for rewards if missing
  try {
    db.exec('ALTER TABLE rewards ADD COLUMN image TEXT');
  } catch (e) {
    // ignore if column exists
  }
  // Try to add avatar column for settings if missing
  try {
    db.exec('ALTER TABLE settings ADD COLUMN avatar TEXT');
  } catch (e) {
    // ignore if column exists
  }
  const row = db.prepare('SELECT COUNT(1) as c FROM settings WHERE id = 1').get();
  if (!row || row.c === 0) {
    db.prepare('INSERT INTO settings (id, childName, parentPin, totalPoints, avatar) VALUES (1, ?, ?, ?, ?)').run(defaultData.childName, defaultData.parentPin, defaultData.totalPoints, defaultData.avatar);
    // seed defaults for habits/rewards
    const insertHabit = db.prepare('INSERT OR IGNORE INTO habits (id, name, points, emoji) VALUES (?, ?, ?, ?)');
    for (const h of defaultData.habits) {
      insertHabit.run(h.id, h.name, h.points, h.emoji);
    }
    const insertReward = db.prepare('INSERT OR IGNORE INTO rewards (id, name, cost, emoji, image) VALUES (?, ?, ?, ?, ?)');
    for (const r of defaultData.rewards) {
      insertReward.run(r.id, r.name, r.cost, r.emoji, null);
    }
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
    deductions: raw.deductions ?? [],
  };
}

function readAll() {
  const settings = db.prepare('SELECT childName, parentPin, totalPoints, avatar FROM settings WHERE id = 1').get();
  const habits = db.prepare('SELECT id, name, points, emoji FROM habits').all();
  const rewards = db.prepare('SELECT id, name, cost, emoji, image FROM rewards').all();
  const pendingTasks = db.prepare('SELECT id, habitId, habitName, points, emoji, timestamp FROM pending_tasks').all();
  const transactions = db.prepare('SELECT id, type, amount, description, date FROM transactions ORDER BY date DESC').all();
  const deductions = db.prepare('SELECT id, name, points, emoji FROM deductions').all();
  return normalizeData({ settings, habits, rewards, pendingTasks, transactions, deductions });
}

// Get full app data
app.get('/api/data', (req, res) => {
  try {
    const data = readAll();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// Save settings (partial app config) and lists
app.post('/api/settings', (req, res) => {
  const incoming = req.body;
  try {
    const transaction = db.transaction(() => {
      db.prepare('UPDATE settings SET childName = ?, parentPin = ?, totalPoints = ?, avatar = ? WHERE id = 1').run(incoming.childName ?? defaultData.childName, incoming.parentPin ?? defaultData.parentPin, typeof incoming.totalPoints === 'number' ? incoming.totalPoints : 0, incoming.avatar ?? null);
      if (Array.isArray(incoming.habits)) {
        db.prepare('DELETE FROM habits').run();
        const stmt = db.prepare('INSERT INTO habits (id, name, points, emoji) VALUES (?, ?, ?, ?)');
        for (const h of incoming.habits) {
          stmt.run(h.id, h.name, h.points, h.emoji);
        }
      }
      if (Array.isArray(incoming.rewards)) {
        db.prepare('DELETE FROM rewards').run();
        const stmt = db.prepare('INSERT INTO rewards (id, name, cost, emoji, image) VALUES (?, ?, ?, ?, ?)');
        for (const r of incoming.rewards) {
          stmt.run(r.id, r.name, r.cost, r.emoji ?? null, r.image ?? null);
        }
      }
      if (Array.isArray(incoming.pendingTasks)) {
        db.prepare('DELETE FROM pending_tasks').run();
        const stmt = db.prepare('INSERT INTO pending_tasks (id, habitId, habitName, points, emoji, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
        for (const t of incoming.pendingTasks) {
          stmt.run(t.id, t.habitId, t.habitName, t.points, t.emoji, t.timestamp);
        }
      }
      if (Array.isArray(incoming.deductions)) {
        db.prepare('DELETE FROM deductions').run();
        const stmt = db.prepare('INSERT INTO deductions (id, name, points, emoji) VALUES (?, ?, ?, ?)');
        for (const d of incoming.deductions) {
          stmt.run(d.id, d.name, d.points, d.emoji);
        }
      }
    });
    transaction();
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to save settings:', e);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Add single transaction
app.post('/api/transaction', (req, res) => {
  try {
    const tx = req.body;
    db.prepare('INSERT INTO transactions (id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)').run(tx.id, tx.type, tx.amount, tx.description, tx.date);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save transaction' });
  }
});

// Bulk add transactions
app.post('/api/bulk-transactions', (req, res) => {
  try {
    const list = Array.isArray(req.body) ? req.body : [];
    const transaction = db.transaction(() => {
      const stmt = db.prepare('INSERT INTO transactions (id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)');
      for (const t of list) {
        stmt.run(t.id, t.type, t.amount, t.description, t.date);
      }
    });
    transaction();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to bulk save transactions' });
  }
});

// Import full data (replace)
app.post('/api/import', (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data.totalPoints !== 'number') {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    const transaction = db.transaction(() => {
      db.prepare('UPDATE settings SET childName = ?, parentPin = ?, totalPoints = ?, avatar = ? WHERE id = 1').run(data.childName ?? defaultData.childName, data.parentPin ?? defaultData.parentPin, data.totalPoints, data.avatar ?? null);
      db.prepare('DELETE FROM habits').run();
      db.prepare('DELETE FROM rewards').run();
      db.prepare('DELETE FROM pending_tasks').run();
      db.prepare('DELETE FROM transactions').run();
      db.prepare('DELETE FROM deductions').run();
      const hStmt = db.prepare('INSERT INTO habits (id, name, points, emoji) VALUES (?, ?, ?, ?)');
      for (const h of data.habits || []) hStmt.run(h.id, h.name, h.points, h.emoji);
      const rStmt = db.prepare('INSERT INTO rewards (id, name, cost, emoji, image) VALUES (?, ?, ?, ?, ?)');
      for (const r of data.rewards || []) rStmt.run(r.id, r.name, r.cost, r.emoji ?? null, r.image ?? null);
      const pStmt = db.prepare('INSERT INTO pending_tasks (id, habitId, habitName, points, emoji, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
      for (const t of data.pendingTasks || []) pStmt.run(t.id, t.habitId, t.habitName, t.points, t.emoji, t.timestamp);
      const tStmt = db.prepare('INSERT INTO transactions (id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)');
      for (const tx of data.transactions || []) tStmt.run(tx.id, tx.type, tx.amount, tx.description, tx.date);
      const dStmt = db.prepare('INSERT INTO deductions (id, name, points, emoji) VALUES (?, ?, ?, ?)');
      for (const d of data.deductions || []) dStmt.run(d.id, d.name, d.points, d.emoji);
    });
    transaction();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Export full data
app.get('/api/export', (req, res) => {
  try {
    const data = readAll();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Clear points and transactions
app.post('/api/clear-points-history', (req, res) => {
  try {
    const transaction = db.transaction(() => {
      // 只清空积分和历史记录，保留其他数据
      db.prepare('UPDATE settings SET totalPoints = 0 WHERE id = 1').run();
      db.prepare('DELETE FROM transactions').run();
    });
    transaction();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to clear points and history' });
  }
});

// Reset all data (Developer tool)
app.post('/api/reset', (req, res) => {
  try {
    const { password } = req.body || {};
    if (password !== 'admin') {
      return res.status(403).json({ error: 'Invalid password' });
    }
    const transaction = db.transaction(() => {
      db.prepare('UPDATE settings SET childName = ?, parentPin = ?, totalPoints = ?, avatar = ? WHERE id = 1').run(defaultData.childName, defaultData.parentPin, 0, null);
      db.prepare('DELETE FROM habits').run();
      db.prepare('DELETE FROM rewards').run();
      db.prepare('DELETE FROM pending_tasks').run();
      db.prepare('DELETE FROM transactions').run();
      db.prepare('DELETE FROM deductions').run();
    });
    transaction();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to reset data' });
  }
});

try {
  initDb();
  app.listen(PORT, () => {
    console.log(`HabitHero server (SQLite) running at http://localhost:${PORT}`);
  });
} catch (err) {
  console.error('Failed to init DB', err);
  process.exit(1);
}
