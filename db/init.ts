import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('opencalorie.db');

  await db.execAsync(`PRAGMA journal_mode = WAL;`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      calorie_goal INTEGER NOT NULL DEFAULT 2000,
      calorie_label TEXT NOT NULL DEFAULT 'calories',
      weight_unit TEXT NOT NULL DEFAULT 'lb',
      macro_mode TEXT NOT NULL DEFAULT 'optional',
      macro_goal_protein_g REAL,
      macro_goal_carbs_g REAL,
      macro_goal_fat_g REAL,
      macro_goal_sodium_mg REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS intake_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein_g REAL,
      carbs_g REAL,
      fat_g REAL,
      sodium_mg REAL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_intake_entries_date ON intake_entries(date);

    CREATE TABLE IF NOT EXISTS weight_entries (
      date TEXT PRIMARY KEY,
      weight REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const settings = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM settings WHERE id = 1'
  );
  if (!settings) {
    await db.runAsync(
      `INSERT INTO settings (id, calorie_goal, calorie_label, weight_unit, macro_mode)
       VALUES (1, 2000, 'calories', 'lb', 'optional')`
    );
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
