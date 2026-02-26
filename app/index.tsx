import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { CalorieDisplay } from '@/components/CalorieDisplay';
import { IntakeList } from '@/components/IntakeList';
import { IntakeForm } from '@/components/IntakeForm';
import { MacroSummary } from '@/components/MacroSummary';
import { WeightSection } from '@/components/WeightSection';
import { SettingsModal } from '@/components/SettingsModal';
import { BackupModal } from '@/components/BackupModal';
import type { IntakeEntry } from '@/types';
import { getTodayKey, formatDateKey } from '@/utils/dates';

export default function Dashboard() {
  const { theme, isDark, toggle: toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { refresh, isLoading, settings } = useApp();

  const [addFormVisible, setAddFormVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IntakeEntry | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [backupVisible, setBackupVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleOpenAdd = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingEntry(null);
    setAddFormVisible(true);
  }, []);

  const handleEditEntry = useCallback((entry: IntakeEntry) => {
    setEditingEntry(entry);
    setAddFormVisible(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setAddFormVisible(false);
    setEditingEntry(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const todayLabel = formatDateKey(getTodayKey());

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.appName, { color: theme.text }]}>OpenCalorie</Text>
          <Text style={[styles.dateLabel, { color: theme.textMuted }]}>{todayLabel}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleTheme();
            }}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Feather name={isDark ? 'sun' : 'moon'} size={20} color={theme.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => setBackupVisible(true)}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Feather name="archive" size={20} color={theme.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => setSettingsVisible(true)}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Feather name="sliders" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.textMuted}
          />
        }
      >
        <CalorieDisplay />

        {settings?.macro_mode !== 'off' && <MacroSummary />}

        <WeightSection />

        <IntakeList onEditEntry={handleEditEntry} />
      </ScrollView>

      <View
        style={[
          styles.fab,
          {
            bottom: bottomPad + 24,
            backgroundColor: theme.accent,
          },
        ]}
      >
        <Pressable
          onPress={handleOpenAdd}
          style={({ pressed }) => [
            styles.fabInner,
            { transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <Feather name="plus" size={26} color={isDark ? '#1a1a1a' : '#fff'} />
        </Pressable>
      </View>

      <IntakeForm
        visible={addFormVisible}
        onClose={handleCloseForm}
        editingEntry={editingEntry}
      />

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />

      <BackupModal
        visible={backupVisible}
        onClose={() => setBackupVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -0.5,
  },
  dateLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'center',
    paddingBottom: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
