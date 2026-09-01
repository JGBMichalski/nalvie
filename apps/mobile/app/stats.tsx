import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { computeDailyStats, computeStreak, type FocusSession } from '@nalvie/core';

import { GlassPanel } from '../components/GlassPanel';
import { BackButton } from '../components/BackButton';
import { Heatmap } from '../components/Heatmap';
import { TankBackdrop } from '../components/TankBackdrop';
import { sessionRepository } from '../lib/repository';
import { buildHeatmapDays, formatFocusDuration, isStreakAtRisk } from '../lib/stats-view';
import { useTheme } from '../lib/ThemeProvider';

export default function StatsScreen() {
  const theme = useTheme();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [tankItemCount, setTankItemCount] = useState(0);

  const load = useCallback(async () => {
    const [loadedSessions, tankItems] = await Promise.all([
      sessionRepository.listSessions(),
      sessionRepository.listTankItems(),
    ]);
    setSessions(loadedSessions);
    setTankItemCount(tankItems.length);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Picks up sessions completed since this screen was last shown.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const dailyStats = useMemo(() => computeDailyStats(sessions), [sessions]);
  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const heatmapDays = useMemo(() => buildHeatmapDays(dailyStats), [dailyStats]);
  const atRisk = isStreakAtRisk(streak.current, dailyStats);

  const totals = useMemo(
    () =>
      dailyStats.reduce(
        (acc, day) => ({
          totalFocusMinutes: acc.totalFocusMinutes + day.totalFocusMinutes,
          completedSessions: acc.completedSessions + day.completedSessions,
          failedSessions: acc.failedSessions + day.failedSessions,
        }),
        { totalFocusMinutes: 0, completedSessions: 0, failedSessions: 0 },
      ),
    [dailyStats],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          padding: 20,
          gap: 16,
        },
        title: {
          color: theme.colors.textPrimary,
          fontSize: 22,
          fontWeight: '600',
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        header: {
          gap: 4,
        },
        row: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 8,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.glassBorder,
        },
        lastRow: {
          borderBottomWidth: 0,
        },
        label: {
          color: theme.colors.textSecondary,
          fontSize: 14,
        },
        value: {
          color: theme.colors.textPrimary,
          fontSize: 14,
          fontWeight: '600',
        },
        scrollContent: {
          paddingVertical: 8,
          gap: 12,
        },
        emptyMessage: {
          color: theme.colors.textSecondary,
          fontSize: 13,
        },
      }),
    [theme],
  );

  return (
    <TankBackdrop>
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <View style={styles.headerRow}>
          <BackButton />
          <Text style={styles.title}>Stats</Text>
        </View>

        <GlassPanel style={styles.header}>
          <View style={styles.row}>
            <Text style={styles.label}>Total focus time</Text>
            <Text style={styles.value}>{formatFocusDuration(totals.totalFocusMinutes)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Current streak</Text>
            <Text style={styles.value}>
              {streak.current} {streak.current === 1 ? 'day' : 'days'}
              {atRisk ? ' · at risk today' : ''}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Longest streak</Text>
            <Text style={styles.value}>
              {streak.longest} {streak.longest === 1 ? 'day' : 'days'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Completed / Failed</Text>
            <Text style={styles.value}>
              {totals.completedSessions} / {totals.failedSessions}
            </Text>
          </View>
          <View style={[styles.row, styles.lastRow]}>
            <Text style={styles.label}>Items in tank</Text>
            <Text style={styles.value}>{tankItemCount}</Text>
          </View>
        </GlassPanel>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Heatmap days={heatmapDays} />
          {totals.completedSessions === 0 && (
            <Text style={styles.emptyMessage}>Complete a session to start your streak</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </TankBackdrop>
  );
}
