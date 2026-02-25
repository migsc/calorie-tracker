import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, useColorScheme,
  TextInput, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { parseWeight, formatWeight } from '@/utils/conversions';
import { WeightChartModal } from './WeightChartModal';

export function WeightSection() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { todayWeight, logWeight, settings } = useApp();

  const unit = settings?.weight_unit ?? 'lb';
  const [inputVisible, setInputVisible] = useState(false);
  const [weightText, setWeightText] = useState('');
  const [chartVisible, setChartVisible] = useState(false);

  const handleOpenInput = useCallback(() => {
    setWeightText(todayWeight != null ? String(todayWeight) : '');
    setInputVisible(true);
  }, [todayWeight]);

  const handleSaveWeight = useCallback(async () => {
    const parsed = parseWeight(weightText);
    if (parsed === null) {
      Alert.alert('Invalid weight', 'Please enter a valid weight greater than 0.');
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await logWeight(parsed);
    setInputVisible(false);
  }, [weightText, logWeight]);

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Weight</Text>
        <Pressable
          onPress={() => setChartVisible(true)}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, flexDirection: 'row', alignItems: 'center', gap: 4 })}
        >
          <Text style={[styles.trendLabel, { color: theme.accentDim }]}>Trend</Text>
          <Feather name="trending-up" size={14} color={theme.accentDim} />
        </Pressable>
      </View>

      <Pressable
        style={[styles.weightRow, { borderColor: theme.border }]}
        onPress={handleOpenInput}
      >
        {todayWeight != null ? (
          <Text style={[styles.weightValue, { color: theme.text }]}>
            {formatWeight(todayWeight, unit)}
          </Text>
        ) : (
          <Text style={[styles.weightPlaceholder, { color: theme.textMuted }]}>
            Log today's weight
          </Text>
        )}
        <Feather name="edit-2" size={16} color={theme.textMuted} />
      </Pressable>

      <Modal
        visible={inputVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInputVisible(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setInputVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Pressable
              style={[styles.popover, { backgroundColor: theme.surface2, borderColor: theme.border }]}
              onPress={() => {}}
            >
              <Text style={[styles.popoverTitle, { color: theme.textSecondary }]}>
                Weight ({unit})
              </Text>
              <TextInput
                style={[styles.popoverInput, { color: theme.text, borderColor: theme.border }]}
                value={weightText}
                onChangeText={setWeightText}
                placeholder={unit === 'lb' ? '160.0' : '72.5'}
                placeholderTextColor={theme.textMuted}
                keyboardType="decimal-pad"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveWeight}
                fontFamily="DMSans_400Regular"
              />
              <View style={styles.popoverButtons}>
                <Pressable
                  onPress={() => setInputVisible(false)}
                  style={[styles.popoverBtn, { borderColor: theme.border }]}
                >
                  <Text style={[styles.popoverBtnText, { color: theme.textSecondary }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveWeight}
                  style={[styles.popoverBtn, styles.popoverBtnPrimary, { backgroundColor: theme.green }]}
                >
                  <Text style={[styles.popoverBtnText, { color: '#fff' }]}>Save</Text>
                </Pressable>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <WeightChartModal
        visible={chartVisible}
        onClose={() => setChartVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  trendLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  weightValue: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'DMSans_500Medium',
    letterSpacing: -0.5,
  },
  weightPlaceholder: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popover: {
    width: 300,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  popoverTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
  },
  popoverInput: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    borderBottomWidth: 1,
    paddingVertical: 8,
    letterSpacing: -1,
  },
  popoverButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  popoverBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  popoverBtnPrimary: {
    borderWidth: 0,
  },
  popoverBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
});
