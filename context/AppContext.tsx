import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { getTodayKey } from '@/utils/dates';
import { getSettings, updateSettings as dbUpdateSettings, getIntakeEntriesForDate, getDailyCalories, getDailyMacros, insertIntakeEntry, updateIntakeEntry as dbUpdateIntakeEntry, deleteIntakeEntry as dbDeleteIntakeEntry, getWeightEntry, upsertWeightEntry } from '@/db/queries';
import type { Settings, IntakeEntry, DailyMacroTotals } from '@/types';

interface AppContextValue {
  settings: Settings | null;
  todayKey: string;
  dailyCalories: number;
  dailyMacros: DailyMacroTotals;
  entries: IntakeEntry[];
  todayWeight: number | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  updateSettings: (updates: Partial<Omit<Settings, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  addEntry: (entry: Omit<IntakeEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editEntry: (id: string, updates: Partial<Pick<IntakeEntry, 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'sodium_mg' | 'note'>>) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  logWeight: (weight: number) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [dailyMacros, setDailyMacros] = useState<DailyMacroTotals>({ protein_g: 0, carbs_g: 0, fat_g: 0, sodium_mg: 0 });
  const [entries, setEntries] = useState<IntakeEntry[]>([]);
  const [todayWeight, setTodayWeight] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const todayKey = getTodayKey();

  const refresh = useCallback(async () => {
    try {
      const [s, cal, macros, ents, wEntry] = await Promise.all([
        getSettings(),
        getDailyCalories(todayKey),
        getDailyMacros(todayKey),
        getIntakeEntriesForDate(todayKey),
        getWeightEntry(todayKey),
      ]);
      setSettings(s);
      setDailyCalories(cal);
      setDailyMacros(macros);
      setEntries(ents);
      setTodayWeight(wEntry?.weight ?? null);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [todayKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateSettings = useCallback(async (
    updates: Partial<Omit<Settings, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    await dbUpdateSettings(updates);
    await refresh();
  }, [refresh]);

  const addEntry = useCallback(async (entry: Omit<IntakeEntry, 'id' | 'created_at' | 'updated_at'>) => {
    await insertIntakeEntry(entry as IntakeEntry);
    await refresh();
  }, [refresh]);

  const editEntry = useCallback(async (
    id: string,
    updates: Partial<Pick<IntakeEntry, 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'sodium_mg' | 'note'>>
  ) => {
    await dbUpdateIntakeEntry(id, updates);
    await refresh();
  }, [refresh]);

  const removeEntry = useCallback(async (id: string) => {
    await dbDeleteIntakeEntry(id);
    await refresh();
  }, [refresh]);

  const logWeight = useCallback(async (weight: number) => {
    await upsertWeightEntry(todayKey, weight);
    setTodayWeight(weight);
  }, [todayKey]);

  const value = useMemo(() => ({
    settings,
    todayKey,
    dailyCalories,
    dailyMacros,
    entries,
    todayWeight,
    isLoading,
    refresh,
    updateSettings,
    addEntry,
    editEntry,
    removeEntry,
    logWeight,
  }), [settings, todayKey, dailyCalories, dailyMacros, entries, todayWeight, isLoading, refresh, updateSettings, addEntry, editEntry, removeEntry, logWeight]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
