import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';

interface MacroBarProps {
  label: string;
  value: number;
  goal: number | null;
  unit: string;
  theme: typeof Colors.dark;
  color: string;
}

function MacroBar({ label, value, goal, unit, theme, color }: MacroBarProps) {
  const progress = goal && goal > 0 ? Math.min(value / goal, 1) : 0;
  const progressValue = useSharedValue(0);

  React.useEffect(() => {
    progressValue.value = withTiming(progress, { duration: 500 });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  return (
    <View style={styles.macroItem}>
      <View style={styles.macroRow}>
        <Text style={[styles.macroLabel, { color: theme.textMuted }]}>{label}</Text>
        <Text style={[styles.macroValue, { color: theme.text }]}>
          {Math.round(value * 10) / 10}
          <Text style={[styles.macroUnit, { color: theme.textMuted }]}> {unit}</Text>
          {goal ? (
            <Text style={[styles.macroGoal, { color: theme.textMuted }]}>
              {' / '}{goal}{unit}
            </Text>
          ) : null}
        </Text>
      </View>
      {goal ? (
        <View style={[styles.barTrack, { backgroundColor: theme.surface2 }]}>
          <Animated.View style={[styles.barFill, barStyle, { backgroundColor: color }]} />
        </View>
      ) : null}
    </View>
  );
}

export function MacroSummary() {
  const { theme } = useTheme();
  const { dailyMacros, settings } = useApp();

  if (!settings || settings.macro_mode === 'off') return null;

  const macros = [
    {
      label: 'Protein',
      value: dailyMacros.protein_g,
      goal: settings.macro_goal_protein_g,
      unit: 'g',
      color: '#7eb8d4',
    },
    {
      label: 'Carbs',
      value: dailyMacros.carbs_g,
      goal: settings.macro_goal_carbs_g,
      unit: 'g',
      color: '#d4b87e',
    },
    {
      label: 'Fat',
      value: dailyMacros.fat_g,
      goal: settings.macro_goal_fat_g,
      unit: 'g',
      color: '#d47eb8',
    },
    {
      label: 'Sodium',
      value: dailyMacros.sodium_mg,
      goal: settings.macro_goal_sodium_mg,
      unit: 'mg',
      color: '#7ed4b8',
    },
  ];

  const hasAnyMacro = macros.some((m) => m.value > 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Macros</Text>
      <View style={styles.grid}>
        {macros.map((m) => (
          <MacroBar
            key={m.label}
            label={m.label}
            value={m.value}
            goal={m.goal}
            unit={m.unit}
            theme={theme}
            color={m.color}
          />
        ))}
      </View>
      {!hasAnyMacro && (
        <Text style={[styles.emptyNote, { color: theme.textMuted }]}>
          Log macros with your entries to see totals here.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  grid: {
    gap: 12,
  },
  macroItem: {
    gap: 5,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  macroLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
  },
  macroValue: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  macroUnit: {
    fontSize: 12,
  },
  macroGoal: {
    fontSize: 12,
  },
  barTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyNote: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    paddingVertical: 4,
  },
});
