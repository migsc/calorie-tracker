import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import type { IntakeEntry } from '@/types';

interface Props {
  onEditEntry: (entry: IntakeEntry) => void;
}

function EntryRow({
  entry,
  onEdit,
  onDelete,
  theme,
}: {
  entry: IntakeEntry;
  onEdit: () => void;
  onDelete: () => void;
  theme: typeof Colors.dark;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.surface2 : 'transparent' },
      ]}
      onPress={onEdit}
    >
      <View style={styles.rowLeft}>
        <Text style={[styles.rowCalories, { color: theme.text }]}>
          {entry.calories.toLocaleString()}
        </Text>
        {entry.note ? (
          <Text style={[styles.rowNote, { color: theme.textSecondary }]} numberOfLines={1}>
            {entry.note}
          </Text>
        ) : null}
      </View>

      <View style={styles.rowRight}>
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <Feather name="edit-2" size={15} color={theme.textMuted} />
        </Pressable>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <Feather name="trash-2" size={15} color={theme.textMuted} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export function IntakeList({ onEditEntry }: Props) {
  const { theme } = useTheme();
  const { entries, removeEntry, settings } = useApp();

  const label = settings?.calorie_label === 'kcal' ? 'kcal' : 'cal';

  const handleDelete = (entry: IntakeEntry) => {
    Alert.alert(
      'Delete Entry',
      `Remove ${entry.calories} ${label}${entry.note ? ` — "${entry.note}"` : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await removeEntry(entry.id);
          },
        },
      ]
    );
  };

  if (entries.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
        <Feather name="inbox" size={28} color={theme.textMuted} />
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          No entries yet today
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Today's Entries</Text>
      {entries.map((entry, index) => (
        <Animated.View key={entry.id} entering={FadeInDown.duration(280).springify()}>
          <EntryRow
            entry={entry}
            onEdit={() => onEditEntry(entry)}
            onDelete={() => handleDelete(entry)}
            theme={theme}
          />
          {index < entries.length - 1 && (
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          )}
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  rowLeft: {
    flex: 1,
    gap: 2,
  },
  rowCalories: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'DMSans_500Medium',
    letterSpacing: -0.3,
  },
  rowNote: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
  },
  rowRight: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  emptyContainer: {
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
  },
});
