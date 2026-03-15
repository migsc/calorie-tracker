import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring, withSequence, Easing } from 'react-native-reanimated';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';

export function CalorieDisplay() {
  const { theme } = useTheme();
  const { settings, dailyCalories } = useApp();

  const goal = settings?.calorie_goal ?? 2000;
  const remaining = goal - dailyCalories;
  const isOver = remaining < 0;
  const label = settings?.calorie_label === 'kcal' ? 'kcal' : 'cal';

  const progress = Math.min(dailyCalories / goal, 1);
  const progressValue = useSharedValue(0);
  const scaleValue = useSharedValue(1);
  const prevCalories = React.useRef(0);

  React.useEffect(() => {
    progressValue.value = withTiming(progress, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  React.useEffect(() => {
    if (dailyCalories > 0 && dailyCalories !== prevCalories.current) {
      scaleValue.value = withSequence(
        withSpring(1.06, { damping: 4, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
    }
    prevCalories.current = dailyCalories;
  }, [dailyCalories]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.row}>
        <View style={styles.mainNumber}>
          <Animated.View style={numberStyle}>
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
          </Animated.View>
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
    borderRadius: 20,
    padding: 24,
    gap: 20,
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
    fontSize: 68,
    fontWeight: '700',
    letterSpacing: -3,
    fontFamily: 'DMSans_700Bold',
    lineHeight: 72,
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
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
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
