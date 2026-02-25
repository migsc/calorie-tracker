import type { BackupData, Settings, IntakeEntry, WeightEntry } from '@/types';

const SCHEMA_VERSION = 1;
const APP_VERSION = '1.0.0';

export function createBackupData(
  settings: Settings,
  intakeEntries: IntakeEntry[],
  weightEntries: WeightEntry[]
): BackupData {
  return {
    schema_version: SCHEMA_VERSION,
    app_version: APP_VERSION,
    created_at: new Date().toISOString(),
    settings,
    intake_entries: intakeEntries,
    weight_entries: weightEntries,
  };
}

export type ValidationResult =
  | { valid: true; data: BackupData }
  | { valid: false; error: string };

export function validateBackupData(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, error: 'Backup file is not a valid JSON object.' };
  }

  const data = raw as Record<string, unknown>;

  if (typeof data.schema_version !== 'number') {
    return { valid: false, error: 'Missing or invalid schema_version.' };
  }

  if (data.schema_version > SCHEMA_VERSION) {
    return {
      valid: false,
      error: `Backup schema version ${data.schema_version} is newer than this app supports (${SCHEMA_VERSION}). Please update the app.`,
    };
  }

  if (typeof data.created_at !== 'string') {
    return { valid: false, error: 'Missing created_at timestamp.' };
  }

  if (typeof data.settings !== 'object' || data.settings === null) {
    return { valid: false, error: 'Missing settings in backup.' };
  }

  const settings = data.settings as Record<string, unknown>;
  if (
    typeof settings.calorie_goal !== 'number' ||
    !['calories', 'kcal'].includes(settings.calorie_label as string) ||
    !['lb', 'kg'].includes(settings.weight_unit as string) ||
    !['off', 'optional', 'on'].includes(settings.macro_mode as string)
  ) {
    return { valid: false, error: 'Settings in backup are invalid or missing required fields.' };
  }

  if (!Array.isArray(data.intake_entries)) {
    return { valid: false, error: 'Missing or invalid intake_entries array.' };
  }

  for (let i = 0; i < (data.intake_entries as unknown[]).length; i++) {
    const entry = (data.intake_entries as Record<string, unknown>[])[i];
    if (typeof entry.id !== 'string') {
      return { valid: false, error: `intake_entries[${i}]: missing id.` };
    }
    if (typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
      return { valid: false, error: `intake_entries[${i}]: invalid date format.` };
    }
    if (typeof entry.calories !== 'number' || entry.calories <= 0) {
      return { valid: false, error: `intake_entries[${i}]: invalid calories.` };
    }
    if (entry.note !== null && entry.note !== undefined) {
      if (typeof entry.note !== 'string') {
        return { valid: false, error: `intake_entries[${i}]: note must be a string.` };
      }
      if (entry.note.length > 100) {
        return {
          valid: false,
          error: `intake_entries[${i}]: note exceeds 100 characters.`,
        };
      }
    }
  }

  if (!Array.isArray(data.weight_entries)) {
    return { valid: false, error: 'Missing or invalid weight_entries array.' };
  }

  for (let i = 0; i < (data.weight_entries as unknown[]).length; i++) {
    const entry = (data.weight_entries as Record<string, unknown>[])[i];
    if (typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
      return { valid: false, error: `weight_entries[${i}]: invalid date format.` };
    }
    if (typeof entry.weight !== 'number' || entry.weight <= 0) {
      return { valid: false, error: `weight_entries[${i}]: invalid weight value.` };
    }
  }

  return { valid: true, data: data as unknown as BackupData };
}

export function serializeBackup(data: BackupData): string {
  return JSON.stringify(data, null, 2);
}
