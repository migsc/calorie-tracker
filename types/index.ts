export type CalorieLabel = 'calories' | 'kcal';
export type WeightUnit = 'lb' | 'kg';
export type MacroMode = 'off' | 'optional' | 'on';

export interface Settings {
  id: number;
  calorie_goal: number;
  calorie_label: CalorieLabel;
  weight_unit: WeightUnit;
  macro_mode: MacroMode;
  macro_goal_protein_g: number | null;
  macro_goal_carbs_g: number | null;
  macro_goal_fat_g: number | null;
  macro_goal_sodium_mg: number | null;
  created_at: string;
  updated_at: string;
}

export interface IntakeEntry {
  id: string;
  date: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  sodium_mg: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeightEntry {
  date: string;
  weight: number;
  created_at: string;
  updated_at: string;
}

export interface DailyMacroTotals {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sodium_mg: number;
}

export interface BackupData {
  schema_version: number;
  app_version: string;
  created_at: string;
  settings: Settings;
  intake_entries: IntakeEntry[];
  weight_entries: WeightEntry[];
}

export interface IntakeFormData {
  calories: string;
  note: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  sodium_mg: string;
}
