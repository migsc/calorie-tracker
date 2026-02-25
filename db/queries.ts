import { getDatabase } from './init';
import type { Settings, IntakeEntry, WeightEntry, DailyMacroTotals } from '@/types';

// ─── Settings ───────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Settings> {
  const db = getDatabase();
  const row = await db.getFirstAsync<Settings>('SELECT * FROM settings WHERE id = 1');
  if (!row) throw new Error('Settings not found');
  return row;
}

export async function updateSettings(
  updates: Partial<Omit<Settings, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const db = getDatabase();
  const keys = Object.keys(updates) as (keyof typeof updates)[];
  if (keys.length === 0) return;

  const setClauses = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => updates[k] ?? null);

  await db.runAsync(
    `UPDATE settings SET ${setClauses}, updated_at = datetime('now') WHERE id = 1`,
    values
  );
}

// ─── Intake Entries ──────────────────────────────────────────────────────────

export async function getIntakeEntriesForDate(date: string): Promise<IntakeEntry[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<IntakeEntry>(
    'SELECT * FROM intake_entries WHERE date = ? ORDER BY created_at DESC',
    [date]
  );
  return rows;
}

export async function getAllIntakeEntries(): Promise<IntakeEntry[]> {
  const db = getDatabase();
  return db.getAllAsync<IntakeEntry>(
    'SELECT * FROM intake_entries ORDER BY date DESC, created_at DESC'
  );
}

export async function insertIntakeEntry(
  entry: Omit<IntakeEntry, 'created_at' | 'updated_at'>
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO intake_entries (id, date, calories, protein_g, carbs_g, fat_g, sodium_mg, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.date,
      entry.calories,
      entry.protein_g ?? null,
      entry.carbs_g ?? null,
      entry.fat_g ?? null,
      entry.sodium_mg ?? null,
      entry.note ?? null,
    ]
  );
}

export async function updateIntakeEntry(
  id: string,
  updates: Partial<Pick<IntakeEntry, 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'sodium_mg' | 'note'>>
): Promise<void> {
  const db = getDatabase();
  const keys = Object.keys(updates) as (keyof typeof updates)[];
  if (keys.length === 0) return;

  const setClauses = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (updates[k] === undefined ? null : updates[k]));

  await db.runAsync(
    `UPDATE intake_entries SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`,
    [...values, id]
  );
}

export async function deleteIntakeEntry(id: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM intake_entries WHERE id = ?', [id]);
}

export async function getDailyCalories(date: string): Promise<number> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(calories), 0) as total FROM intake_entries WHERE date = ?',
    [date]
  );
  return row?.total ?? 0;
}

export async function getDailyMacros(date: string): Promise<DailyMacroTotals> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sodium_mg: number;
  }>(
    `SELECT
       COALESCE(SUM(protein_g), 0) as protein_g,
       COALESCE(SUM(carbs_g), 0) as carbs_g,
       COALESCE(SUM(fat_g), 0) as fat_g,
       COALESCE(SUM(sodium_mg), 0) as sodium_mg
     FROM intake_entries WHERE date = ?`,
    [date]
  );
  return {
    protein_g: row?.protein_g ?? 0,
    carbs_g: row?.carbs_g ?? 0,
    fat_g: row?.fat_g ?? 0,
    sodium_mg: row?.sodium_mg ?? 0,
  };
}

// ─── Weight Entries ──────────────────────────────────────────────────────────

export async function getWeightEntry(date: string): Promise<WeightEntry | null> {
  const db = getDatabase();
  return db.getFirstAsync<WeightEntry>(
    'SELECT * FROM weight_entries WHERE date = ?',
    [date]
  );
}

export async function getAllWeightEntries(): Promise<WeightEntry[]> {
  const db = getDatabase();
  return db.getAllAsync<WeightEntry>(
    'SELECT * FROM weight_entries ORDER BY date ASC'
  );
}

export async function getRecentWeightEntries(days: number): Promise<WeightEntry[]> {
  const db = getDatabase();
  return db.getAllAsync<WeightEntry>(
    `SELECT * FROM weight_entries
     WHERE date >= date('now', ?)
     ORDER BY date ASC`,
    [`-${days} days`]
  );
}

export async function upsertWeightEntry(date: string, weight: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO weight_entries (date, weight)
     VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET weight = excluded.weight, updated_at = datetime('now')`,
    [date, weight]
  );
}

export async function updateAllWeightEntries(entries: { date: string; weight: number }[]): Promise<void> {
  const db = getDatabase();
  for (const e of entries) {
    await db.runAsync(
      `UPDATE weight_entries SET weight = ?, updated_at = datetime('now') WHERE date = ?`,
      [e.weight, e.date]
    );
  }
}

// ─── Bulk / Restore ──────────────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  const db = getDatabase();
  await db.execAsync(`
    DELETE FROM intake_entries;
    DELETE FROM weight_entries;
    DELETE FROM settings;
  `);
}

export async function restoreFromBackup(
  settings: Settings,
  intakeEntries: IntakeEntry[],
  weightEntries: WeightEntry[]
): Promise<void> {
  const db = getDatabase();

  await db.execAsync(`
    DELETE FROM intake_entries;
    DELETE FROM weight_entries;
    DELETE FROM settings;
  `);

  await db.runAsync(
    `INSERT INTO settings (
       id, calorie_goal, calorie_label, weight_unit, macro_mode,
       macro_goal_protein_g, macro_goal_carbs_g, macro_goal_fat_g, macro_goal_sodium_mg,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      1,
      settings.calorie_goal,
      settings.calorie_label,
      settings.weight_unit,
      settings.macro_mode,
      settings.macro_goal_protein_g ?? null,
      settings.macro_goal_carbs_g ?? null,
      settings.macro_goal_fat_g ?? null,
      settings.macro_goal_sodium_mg ?? null,
      settings.created_at,
      settings.updated_at,
    ]
  );

  for (const entry of intakeEntries) {
    await db.runAsync(
      `INSERT INTO intake_entries (id, date, calories, protein_g, carbs_g, fat_g, sodium_mg, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id, entry.date, entry.calories,
        entry.protein_g ?? null, entry.carbs_g ?? null, entry.fat_g ?? null,
        entry.sodium_mg ?? null, entry.note ?? null,
        entry.created_at, entry.updated_at,
      ]
    );
  }

  for (const entry of weightEntries) {
    await db.runAsync(
      `INSERT INTO weight_entries (date, weight, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
      [entry.date, entry.weight, entry.created_at, entry.updated_at]
    );
  }
}
