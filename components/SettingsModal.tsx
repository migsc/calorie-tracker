import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, useColorScheme,
  Modal, ScrollView, TextInput, Switch, Alert, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { lbToKg, kgToLb } from '@/utils/conversions';
import { getAllWeightEntries, updateAllWeightEntries } from '@/db/queries';
import type { MacroMode, CalorieLabel, WeightUnit } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function SectionHeader({ title, theme }: { title: string; theme: typeof Colors.dark }) {
  return (
    <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>{title}</Text>
  );
}

function Row({
  label, right, onPress, theme,
}: {
  label: string;
  right: React.ReactNode;
  onPress?: () => void;
  theme: typeof Colors.dark;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed && onPress ? theme.surface2 : 'transparent' },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      <View>{right}</View>
    </Pressable>
  );
}

function SegmentControl<T extends string>({
  options, value, onChange, theme,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  theme: typeof Colors.dark;
}) {
  return (
    <View style={[styles.segment, { borderColor: theme.border }]}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={[
            styles.segmentItem,
            value === opt.value && { backgroundColor: theme.accent + '22', borderColor: theme.accent },
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              { color: value === opt.value ? theme.accent : theme.textSecondary },
            ]}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function SettingsModal({ visible, onClose }: Props) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, refresh } = useApp();

  const [calorieGoal, setCalorieGoal] = useState('');
  const [macroGoalProtein, setMacroGoalProtein] = useState('');
  const [macroGoalCarbs, setMacroGoalCarbs] = useState('');
  const [macroGoalFat, setMacroGoalFat] = useState('');
  const [macroGoalSodium, setMacroGoalSodium] = useState('');

  useEffect(() => {
    if (visible && settings) {
      setCalorieGoal(String(settings.calorie_goal));
      setMacroGoalProtein(settings.macro_goal_protein_g != null ? String(settings.macro_goal_protein_g) : '');
      setMacroGoalCarbs(settings.macro_goal_carbs_g != null ? String(settings.macro_goal_carbs_g) : '');
      setMacroGoalFat(settings.macro_goal_fat_g != null ? String(settings.macro_goal_fat_g) : '');
      setMacroGoalSodium(settings.macro_goal_sodium_mg != null ? String(settings.macro_goal_sodium_mg) : '');
    }
  }, [visible, settings]);

  const handleSave = async () => {
    const cal = parseInt(calorieGoal, 10);
    if (!cal || cal <= 0) {
      Alert.alert('Invalid goal', 'Calorie goal must be a positive number.');
      return;
    }

    const parseOptional = (s: string): number | null => {
      const n = parseFloat(s);
      return isNaN(n) || n < 0 ? null : n;
    };

    await updateSettings({
      calorie_goal: cal,
      macro_goal_protein_g: parseOptional(macroGoalProtein),
      macro_goal_carbs_g: parseOptional(macroGoalCarbs),
      macro_goal_fat_g: parseOptional(macroGoalFat),
      macro_goal_sodium_mg: parseOptional(macroGoalSodium),
    });

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const handleWeightUnitChange = async (newUnit: WeightUnit) => {
    if (!settings || newUnit === settings.weight_unit) return;

    Alert.alert(
      'Convert weight data?',
      `All saved weights will be converted from ${settings.weight_unit} to ${newUnit}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Convert',
          onPress: async () => {
            const entries = await getAllWeightEntries();
            const converted = entries.map((e) => ({
              date: e.date,
              weight:
                newUnit === 'kg'
                  ? lbToKg(e.weight)
                  : kgToLb(e.weight),
            }));
            await updateAllWeightEntries(converted);
            await updateSettings({ weight_unit: newUnit });
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
      ]
    );
  };

  if (!settings) return null;

  const macroModeOptions: { label: string; value: MacroMode }[] = [
    { label: 'Off', value: 'off' },
    { label: 'Optional', value: 'optional' },
    { label: 'On', value: 'on' },
  ];

  const calLabelOptions: { label: string; value: CalorieLabel }[] = [
    { label: 'Calories', value: 'calories' },
    { label: 'kcal', value: 'kcal' },
  ];

  const weightUnitOptions: { label: string; value: WeightUnit }[] = [
    { label: 'lb', value: 'lb' },
    { label: 'kg', value: 'kg' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            paddingTop: Platform.OS === 'web' ? 67 : 0,
          },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={22} color={theme.textSecondary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
          <Pressable
            onPress={handleSave}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={[styles.saveBtn, { color: theme.green }]}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <SectionHeader title="Calories" theme={theme} />

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.cardRow}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Daily Goal</Text>
              <View style={[styles.inlineInput, { borderColor: theme.border }]}>
                <TextInput
                  style={[styles.inlineInputText, { color: theme.text }]}
                  value={calorieGoal}
                  onChangeText={setCalorieGoal}
                  keyboardType="numeric"
                  returnKeyType="done"
                  maxLength={5}
                  selectTextOnFocus
                />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.cardRow}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Label</Text>
              <SegmentControl
                options={calLabelOptions}
                value={settings.calorie_label}
                onChange={(v) => updateSettings({ calorie_label: v })}
                theme={theme}
              />
            </View>
          </View>

          <SectionHeader title="Weight" theme={theme} />

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.cardRow}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Unit</Text>
              <SegmentControl
                options={weightUnitOptions}
                value={settings.weight_unit}
                onChange={handleWeightUnitChange}
                theme={theme}
              />
            </View>
          </View>

          <SectionHeader title="Macros" theme={theme} />

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.cardRow}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Mode</Text>
              <SegmentControl
                options={macroModeOptions}
                value={settings.macro_mode}
                onChange={(v) => updateSettings({ macro_mode: v })}
                theme={theme}
              />
            </View>

            {settings.macro_mode !== 'off' && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <Text style={[styles.subHeader, { color: theme.textMuted }]}>Daily Goals (optional)</Text>
                {[
                  { label: 'Protein (g)', value: macroGoalProtein, set: setMacroGoalProtein },
                  { label: 'Carbs (g)', value: macroGoalCarbs, set: setMacroGoalCarbs },
                  { label: 'Fat (g)', value: macroGoalFat, set: setMacroGoalFat },
                  { label: 'Sodium (mg)', value: macroGoalSodium, set: setMacroGoalSodium },
                ].map((field, i, arr) => (
                  <View key={field.label}>
                    <View style={styles.cardRow}>
                      <Text style={[styles.rowLabel, { color: theme.text }]}>{field.label}</Text>
                      <View style={[styles.inlineInput, { borderColor: theme.border }]}>
                        <TextInput
                          style={[styles.inlineInputText, { color: theme.text }]}
                          value={field.value}
                          onChangeText={field.set}
                          keyboardType="decimal-pad"
                          returnKeyType="done"
                          maxLength={6}
                          placeholder="—"
                          placeholderTextColor={theme.textMuted}
                          selectTextOnFocus
                        />
                      </View>
                    </View>
                    {i < arr.length - 1 && (
                      <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    )}
                  </View>
                ))}
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'DMSans_500Medium',
  },
  saveBtn: {
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
  },
  scrollContent: {
    padding: 16,
    gap: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  subHeader: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  segmentItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    borderRadius: 7,
  },
  segmentText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
  },
  inlineInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 70,
    alignItems: 'flex-end',
  },
  inlineInputText: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'right',
    minWidth: 50,
  },
});
