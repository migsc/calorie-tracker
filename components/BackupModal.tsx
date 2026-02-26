import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  Modal, ScrollView, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { getSettings, getAllIntakeEntries, getAllWeightEntries, restoreFromBackup } from '@/db/queries';
import { createBackupData, validateBackupData, serializeBackup } from '@/utils/backup';
import { getTimestampForFilename } from '@/utils/dates';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function BackupModal({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { refresh } = useApp();

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const [settings, intakeEntries, weightEntries] = await Promise.all([
        getSettings(),
        getAllIntakeEntries(),
        getAllWeightEntries(),
      ]);

      const backup = createBackupData(settings, intakeEntries, weightEntries);
      const json = serializeBackup(backup);

      const timestamp = getTimestampForFilename();
      const filename = `OpenCalorie_${timestamp}.backup.json`;
      const fileUri = FileSystem.cacheDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, json, {
        encoding: 'utf8',
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Export unavailable', 'File sharing is not available on this device.');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save OpenCalorie Backup',
      });
    } catch (err) {
      console.error('Export failed:', err);
      Alert.alert('Export Failed', 'Something went wrong while creating the backup. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setImporting(true);

      const fileUri = result.assets[0].uri;
      const raw = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'utf8',
      });

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        Alert.alert('Invalid file', 'The selected file is not valid JSON.');
        return;
      }

      const validation = validateBackupData(parsed);
      if (!validation.valid) {
        Alert.alert('Invalid backup', validation.error);
        return;
      }

      Alert.alert(
        'Restore Backup?',
        'This will permanently delete all your current data and replace it with the backup. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                const { settings, intake_entries, weight_entries } = validation.data;
                await restoreFromBackup(settings, intake_entries, weight_entries);
                await refresh();
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                  'Restore Complete',
                  `Restored ${intake_entries.length} intake entries and ${weight_entries.length} weight entries.`
                );
                onClose();
              } catch (err) {
                console.error('Restore failed:', err);
                Alert.alert('Restore Failed', 'Something went wrong during restore. Your data may be unchanged.');
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error('Import error:', err);
      Alert.alert('Import Failed', 'Could not read the selected file. Please try again.');
    } finally {
      setImporting(false);
    }
  };

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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Backup & Restore</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.cardInfo}>
              <Feather name="upload" size={20} color={theme.accent} />
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Export Backup</Text>
                <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                  Creates a single JSON file with all your data — settings, intake entries, and weight logs.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handleExport}
              disabled={exporting}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: theme.accent + '18', borderColor: theme.accent, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              {exporting ? (
                <ActivityIndicator size="small" color={theme.accent} />
              ) : (
                <Text style={[styles.actionBtnText, { color: theme.accent }]}>Export</Text>
              )}
            </Pressable>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.cardInfo}>
              <Feather name="download" size={20} color={theme.textSecondary} />
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Import Backup</Text>
                <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                  Restores from a backup file. All current data will be replaced. Backup is validated before any data is deleted.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handleImport}
              disabled={importing}
              style={({ pressed }) => [
                styles.actionBtn,
                { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              {importing ? (
                <ActivityIndicator size="small" color={theme.textSecondary} />
              ) : (
                <Text style={[styles.actionBtnText, { color: theme.textSecondary }]}>Import</Text>
              )}
            </Pressable>
          </View>

          <View style={[styles.infoBox, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
            <Feather name="info" size={14} color={theme.textMuted} />
            <Text style={[styles.infoText, { color: theme.textMuted }]}>
              Backup files include all settings, intake entries, and weight logs. They are plain JSON and human-readable. Keep them safe — anyone with the file can see your data.
            </Text>
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
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 16,
  },
  cardInfo: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  cardText: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'DMSans_500Medium',
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 19,
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  infoBox: {
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 18,
  },
});
