import express from 'express';
import cors from 'cors';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// 在生产环境中，数据库存储在 /app/data 目录（可挂载卷）
const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'habit_hero.db');

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
        { id: '2', name: '认真刷牙', points: 5, emoji: '🦷' },
        { id: '3', name: '吃蔬菜', points: 5, emoji: '🥦' },
    ],
    rewards: [
        { id: '1', name: '看电视30分钟', cost: 50, emoji: '📺' },
        { id: '2', name: '买新玩具', cost: 500, emoji: '🧸' },
    ],
    pendingTasks: [],
    transactions: [],
};

let db;
async function initDb() {
    // 确保数据目录存在
    const dbDir = path.dirname(DB_PATH);
    const fs = await import('fs');
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

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
    };
}

function readAll() {
    const settings = db.prepare('SELECT childName, parentPin, totalPoints, avatar FROM settings WHERE id = 1').get();
    const habits = db.prepare('SELECT id, name, points, emoji FROM habits').all();
    const rewards = db.prepare('SELECT id, name, cost, emoji, image FROM rewards').all();
    const pendingTasks = db.prepare('SELECT id, habitId, habitName, points, emoji, timestamp FROM pending_tasks').all();
    const transactions = db.prepare('SELECT id, type, amount, description, date FROM transactions ORDER BY date DESC').all();
    return normalizeData({ settings, habits, rewards, pendingTasks, transactions });
}

// API 路由
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
            const hStmt = db.prepare('INSERT INTO habits (id, name, points, emoji) VALUES (?, ?, ?, ?)');
            for (const h of data.habits || []) hStmt.run(h.id, h.name, h.points, h.emoji);
            const rStmt = db.prepare('INSERT INTO rewards (id, name, cost, emoji, image) VALUES (?, ?, ?, ?, ?)');
            for (const r of data.rewards || []) rStmt.run(r.id, r.name, r.cost, r.emoji ?? null, r.image ?? null);
            const pStmt = db.prepare('INSERT INTO pending_tasks (id, habitId, habitName, points, emoji, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
            for (const t of data.pendingTasks || []) pStmt.run(t.id, t.habitId, t.habitName, t.points, t.emoji, t.timestamp);
            const tStmt = db.prepare('INSERT INTO transactions (id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)');
            for (const tx of data.transactions || []) tStmt.run(tx.id, tx.type, tx.amount, tx.description, tx.date);
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
        });
        transaction();
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to reset data' });
    }
});

// 服务静态文件（前端构建产物）
app.use(express.static(path.join(__dirname, '..', 'dist')));

// 所有其他请求返回 index.html（支持前端路由）
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// 初始化数据库并启动服务器
(async () => {
    try {
        await initDb();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ HabitHero 服务器运行中！`);
            console.log(`🌐 访问地址: http://localhost:${PORT}`);
            console.log(`📁 数据库位置: ${DB_PATH}`);
        });
    } catch (err) {
        console.error('❌ 初始化数据库失败:', err);
        process.exit(1);
    }
})();
