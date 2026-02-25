import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, useColorScheme,
  Modal, ScrollView, Dimensions, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { getAllWeightEntries, getRecentWeightEntries } from '@/db/queries';
import type { WeightEntry } from '@/types';
import { shortDateLabel } from '@/utils/dates';

type Range = 30 | 90 | 'all';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function WeightChartModal({ visible, onClose }: Props) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  const [range, setRange] = useState<Range>(30);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    async function load() {
      setLoading(true);
      try {
        const data =
          range === 'all'
            ? await getAllWeightEntries()
            : await getRecentWeightEntries(range);
        setEntries(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [visible, range]);

  const screenWidth = Dimensions.get('window').width;

  const chartData = entries.length > 0
    ? {
        labels: entries.map((e, i) => {
          if (entries.length <= 7 || i === 0 || i === entries.length - 1) {
            return shortDateLabel(e.date);
          }
          if (entries.length <= 30 && i % 7 === 0) return shortDateLabel(e.date);
          if (i % Math.floor(entries.length / 4) === 0) return shortDateLabel(e.date);
          return '';
        }),
        datasets: [{ data: entries.map((e) => e.weight) }],
      }
    : null;

  const minWeight = entries.length > 0 ? Math.min(...entries.map((e) => e.weight)) : 0;
  const maxWeight = entries.length > 0 ? Math.max(...entries.map((e) => e.weight)) : 0;
  const range_val = maxWeight - minWeight;

  const ranges: { label: string; value: Range }[] = [
    { label: '30d', value: 30 },
    { label: '90d', value: 90 },
    { label: 'All', value: 'all' },
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
          { backgroundColor: theme.background, paddingTop: Platform.OS === 'web' ? 67 : 0 },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Weight Trend</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={22} color={theme.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.rangeRow]}>
            {ranges.map((r) => (
              <Pressable
                key={String(r.value)}
                onPress={() => setRange(r.value)}
                style={[
                  styles.rangeBtn,
                  {
                    backgroundColor: range === r.value ? theme.accent + '22' : 'transparent',
                    borderColor: range === r.value ? theme.accent : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.rangeBtnText,
                    { color: range === r.value ? theme.accent : theme.textSecondary },
                  ]}
                >
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {loading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>Loading…</Text>
            </View>
          ) : entries.length < 2 ? (
            <View style={styles.emptyState}>
              <Feather name="activity" size={32} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                {entries.length === 0
                  ? 'No weight data yet.\nLog your weight to see trends here.'
                  : 'Log at least 2 entries to see the chart.'}
              </Text>
            </View>
          ) : (
            <View style={styles.chartWrap}>
              <LineChart
                data={chartData!}
                width={screenWidth - 32}
                height={220}
                withDots={entries.length <= 20}
                withShadow={false}
                withInnerLines={false}
                withOuterLines={false}
                withHorizontalLabels={true}
                withVerticalLabels={true}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: theme.surface,
                  backgroundGradientTo: theme.surface,
                  decimalPlaces: 1,
                  color: (opacity = 1) => isDark
                    ? `rgba(232, 224, 208, ${opacity})`
                    : `rgba(90, 82, 69, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    isDark
                      ? `rgba(154, 154, 150, ${opacity})`
                      : `rgba(102, 102, 96, ${opacity})`,
                  propsForDots: {
                    r: '3',
                    strokeWidth: '0',
                  },
                  propsForBackgroundLines: {
                    strokeWidth: 0,
                  },
                }}
                bezier
                style={styles.chart}
              />

              {entries.length > 0 && (
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                      {entries[0].weight}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Start</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: range_val > 0 ? theme.green : range_val < 0 ? theme.red : theme.text }]}>
                      {range_val > 0 ? '+' : ''}{(entries[entries.length - 1].weight - entries[0].weight).toFixed(1)}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Change</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                      {entries[entries.length - 1].weight}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Latest</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={{ height: insets.bottom + 16 }} />
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'DMSans_500Medium',
  },
  content: {
    padding: 16,
    gap: 20,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rangeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  rangeBtnText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  chartWrap: {
    gap: 16,
  },
  chart: {
    borderRadius: 12,
    marginHorizontal: -4,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'DMSans_500Medium',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
