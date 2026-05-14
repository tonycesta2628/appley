import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '..', 'applens.sqlite'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    shop TEXT PRIMARY KEY,
    access_token TEXT NOT NULL,
    scope TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS scans_shop_idx ON scans(shop, created_at DESC);

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    shop TEXT NOT NULL,
    name TEXT NOT NULL,
    cadence TEXT DEFAULT 'weekly',
    channels TEXT DEFAULT '["email"]',
    subscribers INTEGER DEFAULT 0,
    last_sent TEXT,
    enabled INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS reports_shop_idx ON reports(shop);

  CREATE TABLE IF NOT EXISTS alert_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop TEXT NOT NULL,
    tone TEXT NOT NULL,
    title TEXT NOT NULL,
    detail TEXT,
    enabled INTEGER DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS alerts_shop_idx ON alert_rules(shop);

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop TEXT NOT NULL,
    kind TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS activity_shop_idx ON activity_log(shop, created_at DESC);
`);

// ── Sessions ─────────────────────────────────────────────────────────────────

export const sessionsDB = {
  get(shop) {
    return db.prepare('SELECT * FROM sessions WHERE shop = ?').get(shop);
  },
  upsert(shop, token, scope) {
    db.prepare(`
      INSERT INTO sessions (shop, access_token, scope)
      VALUES (?, ?, ?)
      ON CONFLICT(shop) DO UPDATE SET
        access_token = excluded.access_token,
        scope = excluded.scope,
        updated_at = unixepoch()
    `).run(shop, token, scope);
  },
  delete(shop) {
    db.prepare('DELETE FROM sessions WHERE shop = ?').run(shop);
  },
};

// ── Scans ─────────────────────────────────────────────────────────────────────

export const scansDB = {
  getLatest(shop) {
    const row = db.prepare(
      'SELECT * FROM scans WHERE shop = ? ORDER BY created_at DESC LIMIT 1'
    ).get(shop);
    if (!row) return null;
    return { ...row, data: JSON.parse(row.data) };
  },
  save(shop, data) {
    db.prepare('INSERT INTO scans (shop, data) VALUES (?, ?)').run(shop, JSON.stringify(data));
    // Keep only last 20 scans per shop
    db.prepare(`
      DELETE FROM scans WHERE shop = ? AND id NOT IN (
        SELECT id FROM scans WHERE shop = ? ORDER BY created_at DESC LIMIT 20
      )
    `).run(shop, shop);
  },
  history(shop, limit = 10) {
    return db.prepare(
      'SELECT id, shop, created_at FROM scans WHERE shop = ? ORDER BY created_at DESC LIMIT ?'
    ).all(shop, limit);
  },
};

// ── Reports ───────────────────────────────────────────────────────────────────

const DEFAULT_REPORTS = [
  { id: 'merchant-exec', name: 'Merchant executive summary', cadence: 'Weekly', channels: '["email"]', subscribers: 0, last_sent: null },
  { id: 'perf-audit',    name: 'Performance impact audit',  cadence: 'On scan', channels: '["email","slack"]', subscribers: 1, last_sent: null },
  { id: 'cost-renewal',  name: 'Cost & renewal report',     cadence: 'Monthly', channels: '["email"]', subscribers: 0, last_sent: null },
  { id: 'theme-changelog', name: 'Theme cleanup change log', cadence: 'On edit', channels: '["webhook"]', subscribers: 0, last_sent: null },
  { id: 'agency-client', name: 'Agency client report',      cadence: 'Monthly', channels: '["email"]', subscribers: 0, last_sent: null },
];

export const reportsDB = {
  list(shop) {
    let rows = db.prepare('SELECT * FROM reports WHERE shop = ?').all(shop);
    if (rows.length === 0) {
      // Seed defaults
      const insert = db.prepare(
        'INSERT OR IGNORE INTO reports (id, shop, name, cadence, channels, subscribers) VALUES (?, ?, ?, ?, ?, ?)'
      );
      DEFAULT_REPORTS.forEach(r => insert.run(r.id + '-' + shop, shop, r.name, r.cadence, r.channels, r.subscribers));
      rows = db.prepare('SELECT * FROM reports WHERE shop = ?').all(shop);
    }
    return rows.map(r => ({ ...r, channels: JSON.parse(r.channels) }));
  },
  upsert(report) {
    db.prepare(`
      INSERT INTO reports (id, shop, name, cadence, channels, subscribers, last_sent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        cadence = excluded.cadence,
        channels = excluded.channels,
        subscribers = excluded.subscribers,
        last_sent = excluded.last_sent
    `).run(
      report.id, report.shop, report.name, report.cadence,
      JSON.stringify(report.channels), report.subscribers || 0, report.last_sent || null
    );
  },
  delete(id) {
    db.prepare('DELETE FROM reports WHERE id = ?').run(id);
  },
};

// ── Activity Log ──────────────────────────────────────────────────────────────

export const activityDB = {
  log(shop, kind, message) {
    db.prepare('INSERT INTO activity_log (shop, kind, message) VALUES (?, ?, ?)').run(shop, kind, message);
  },
  recent(shop, limit = 20) {
    return db.prepare(
      'SELECT * FROM activity_log WHERE shop = ? ORDER BY created_at DESC LIMIT ?'
    ).all(shop, limit);
  },
};

export default db;
