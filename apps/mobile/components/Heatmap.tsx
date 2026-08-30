import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { heatmapIntensity, type HeatmapDay } from '../lib/stats-view';
import { useTheme } from '../lib/ThemeProvider';

const CELL_GAP = 3;
const DAYS_PER_WEEK = 7;

const INTENSITY_OPACITY: Record<0 | 1 | 2 | 3, number> = {
  0: 0.12,
  1: 0.4,
  2: 0.7,
  3: 1,
};

function chunkIntoWeeks(days: HeatmapDay[]): HeatmapDay[][] {
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < days.length; i += DAYS_PER_WEEK) {
    weeks.push(days.slice(i, i + DAYS_PER_WEEK));
  }
  return weeks;
}

// Rolling 12-week (84-day) GitHub-contribution-style grid — weeks as
// columns, oldest to newest left to right, days-of-week stacked within.
// Cells stretch to fill the available width rather than a fixed size.
export function Heatmap({ days }: { days: HeatmapDay[] }) {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        grid: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
        },
        week: {
          gap: CELL_GAP,
        },
        cell: {
          borderRadius: 2,
          backgroundColor: theme.colors.fabBackground,
        },
      }),
    [theme],
  );
  const weeks = chunkIntoWeeks(days);
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const cellSize = width > 0 ? (width - (weeks.length - 1) * CELL_GAP) / weeks.length : 0;

  return (
    <View style={styles.grid} onLayout={onLayout} testID="stats-heatmap">
      {width > 0 &&
        weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((day) => (
              <View
                key={day.date}
                accessibilityLabel={`${day.date}: ${day.completedSessions} completed`}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    opacity: INTENSITY_OPACITY[heatmapIntensity(day.completedSessions)],
                  },
                ]}
              />
            ))}
          </View>
        ))}
    </View>
  );
}
