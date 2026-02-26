import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  Modal, ScrollView, Keyboard, Platform,
  KeyboardAvoidingView, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import type { IntakeEntry } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  editingEntry?: IntakeEntry | null;
}

function InputField({
  label, value, onChangeText, placeholder, keyboardType = 'numeric', maxLength,
  theme, multiline, suffix,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'numeric' | 'default' | 'decimal-pad';
  maxLength?: number;
  theme: typeof Colors.dark;
  multiline?: boolean;
  suffix?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
      <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.surface2 }]}>
        <TextInput
          style={[styles.input, { color: theme.text, fontFamily: 'DMSans_400Regular' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          returnKeyType="done"
          blurOnSubmit
        />
        {suffix ? (
          <Text style={[styles.suffix, { color: theme.textMuted }]}>{suffix}</Text>
        ) : null}
      </View>
    </View>
  );
}

export function IntakeForm({ visible, onClose, editingEntry }: Props) {
  const { theme } = useTheme();
  const { settings, todayKey, addEntry, editEntry } = useApp();

  const macroMode = settings?.macro_mode ?? 'optional';
  const [macrosExpanded, setMacrosExpanded] = useState(false);

  const [calories, setCalories] = useState('');
  const [note, setNote] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [sodium, setSodium] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible) {
      if (editingEntry) {
        setCalories(String(editingEntry.calories));
        setNote(editingEntry.note ?? '');
        setProtein(editingEntry.protein_g != null ? String(editingEntry.protein_g) : '');
        setCarbs(editingEntry.carbs_g != null ? String(editingEntry.carbs_g) : '');
        setFat(editingEntry.fat_g != null ? String(editingEntry.fat_g) : '');
        setSodium(editingEntry.sodium_mg != null ? String(editingEntry.sodium_mg) : '');
        setMacrosExpanded(
          editingEntry.protein_g != null ||
          editingEntry.carbs_g != null ||
          editingEntry.fat_g != null ||
          editingEntry.sodium_mg != null
        );
      } else {
        setCalories('');
        setNote('');
        setProtein('');
        setCarbs('');
        setFat('');
        setSodium('');
        setMacrosExpanded(macroMode === 'on');
      }
    }
  }, [visible, editingEntry, macroMode]);

  const parseNum = (s: string): number | null => {
    const n = parseFloat(s);
    return isNaN(n) || n < 0 ? null : n;
  };

  const handleSave = useCallback(async () => {
    const cal = parseInt(calories, 10);
    if (!cal || cal <= 0) {
      Alert.alert('Invalid calories', 'Please enter a valid calorie amount greater than 0.');
      return;
    }

    setSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const updates = {
        calories: cal,
        protein_g: parseNum(protein),
        carbs_g: parseNum(carbs),
        fat_g: parseNum(fat),
        sodium_mg: parseNum(sodium),
        note: note.trim() || null,
      };

      if (editingEntry) {
        await editEntry(editingEntry.id, updates);
      } else {
        const id = Crypto.randomUUID();
        await addEntry({ id, date: todayKey, ...updates });
      }

      onClose();
    } catch (err) {
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [calories, note, protein, carbs, fat, sodium, editingEntry, editEntry, addEntry, todayKey, onClose]);

  const noteRemaining = 100 - note.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.modalContainer, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={22} color={theme.textSecondary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {editingEntry ? 'Edit Entry' : 'Add Entry'}
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Feather name="check" size={22} color={theme.green} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <InputField
            label="Calories *"
            value={calories}
            onChangeText={setCalories}
            placeholder="0"
            keyboardType="numeric"
            theme={theme}
          />

          <View style={styles.fieldWrap}>
            <View style={styles.noteHeader}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Note</Text>
              <Text style={[styles.charCount, { color: noteRemaining < 20 ? theme.red : theme.textMuted }]}>
                {noteRemaining}
              </Text>
            </View>
            <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.surface2 }]}>
              <TextInput
                style={[styles.input, { color: theme.text, fontFamily: 'DMSans_400Regular' }]}
                value={note}
                onChangeText={(t) => setNote(t.slice(0, 100))}
                placeholder="e.g. Stress snack, Pre-workout fuel…"
                placeholderTextColor={theme.textMuted}
                keyboardType="default"
                maxLength={100}
                returnKeyType="done"
                blurOnSubmit
              />
            </View>
          </View>

          {macroMode !== 'off' && (
            <View>
              {macroMode === 'optional' && (
                <Pressable
                  style={[styles.macroToggle, { borderColor: theme.border }]}
                  onPress={() => setMacrosExpanded(!macrosExpanded)}
                >
                  <Text style={[styles.macroToggleText, { color: theme.textSecondary }]}>
                    {macrosExpanded ? 'Hide macros' : 'Add macros'}
                  </Text>
                  <Feather
                    name={macrosExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={theme.textSecondary}
                  />
                </Pressable>
              )}

              {(macroMode === 'on' || macrosExpanded) && (
                <View style={styles.macroGrid}>
                  <View style={styles.macroRow}>
                    <View style={styles.macroHalf}>
                      <InputField
                        label="Protein"
                        value={protein}
                        onChangeText={setProtein}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        theme={theme}
                        suffix="g"
                      />
                    </View>
                    <View style={styles.macroHalf}>
                      <InputField
                        label="Carbs"
                        value={carbs}
                        onChangeText={setCarbs}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        theme={theme}
                        suffix="g"
                      />
                    </View>
                  </View>
                  <View style={styles.macroRow}>
                    <View style={styles.macroHalf}>
                      <InputField
                        label="Fat"
                        value={fat}
                        onChangeText={setFat}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        theme={theme}
                        suffix="g"
                      />
                    </View>
                    <View style={styles.macroHalf}>
                      <InputField
                        label="Sodium"
                        value={sodium}
                        onChangeText={setSodium}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        theme={theme}
                        suffix="mg"
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    margin: 0,
  },
  suffix: {
    fontSize: 14,
    marginLeft: 6,
    fontFamily: 'DMSans_400Regular',
  },
  macroToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    gap: 6,
    marginTop: 4,
  },
  macroToggleText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
  },
  macroGrid: {
    gap: 12,
    marginTop: 12,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroHalf: {
    flex: 1,
  },
});
