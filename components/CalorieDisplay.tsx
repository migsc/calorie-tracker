import React from 'react';
import { View, Text, StyleSheet, useColorScheme, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';

export function CalorieDisplay() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { settings, dailyCalories } = useApp();

  const goal = settings?.calorie_goal ?? 2000;
  const remaining = goal - dailyCalories;
  const isOver = remaining < 0;
  const label = settings?.calorie_label === 'kcal' ? 'kcal' : 'cal';

  const progress = Math.min(dailyCalories / goal, 1);
  const progressValue = useSharedValue(0);

  React.useEffect(() => {
    progressValue.value = withTiming(progress, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.row}>
        <View style={styles.mainNumber}>
          <Text
            style={[
              styles.remainingValue,
              { color: isOver ? theme.red : theme.text },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {Math.abs(remaining).toLocaleString()}
          </Text>
          <Text style={[styles.remainingLabel, { color: theme.textSecondary }]}>
            {isOver ? `over` : `remaining`}
          </Text>
        </View>

        <View style={styles.metaCol}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaValue, { color: theme.text }]}>
              {goal.toLocaleString()}
            </Text>
            <Text style={[styles.metaLabel, { color: theme.textMuted }]}>goal</Text>
          </View>
          <View style={[styles.metaDivider, { backgroundColor: theme.border }]} />
          <View style={styles.metaItem}>
            <Text style={[styles.metaValue, { color: isOver ? theme.red : theme.text }]}>
              {dailyCalories.toLocaleString()}
            </Text>
            <Text style={[styles.metaLabel, { color: theme.textMuted }]}>eaten</Text>
          </View>
        </View>
      </View>

      <View style={[styles.barTrack, { backgroundColor: theme.surface2 }]}>
        <Animated.View
          style={[
            styles.barFill,
            barStyle,
            { backgroundColor: isOver ? theme.red : theme.green },
          ]}
        />
      </View>

      <Text style={[styles.unitLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mainNumber: {
    flex: 1,
  },
  remainingValue: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -2,
    fontFamily: 'DMSans_700Bold',
    lineHeight: 60,
  },
  remainingLabel: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metaCol: {
    alignItems: 'flex-end',
    gap: 10,
  },
  metaItem: {
    alignItems: 'flex-end',
  },
  metaValue: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'DMSans_500Medium',
    letterSpacing: -0.5,
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaDivider: {
    width: 24,
    height: 1,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  unitLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 1,
    alignSelf: 'flex-end',
    marginTop: -8,
  },
});
