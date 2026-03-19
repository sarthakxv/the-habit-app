import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths } from 'date-fns';

interface CalendarHeatmapProps {
  /** YYYY-MM format for the displayed month */
  month: string;
  /** Map of YYYY-MM-DD -> completion percentage (0 to 1) */
  completionData: Record<string, number>;
  accentColor?: string;
  onDayPress?: (date: string) => void;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarHeatmap({
  month,
  completionData,
  accentColor = '#4CAF50',
  onDayPress,
}: CalendarHeatmapProps) {
  const { days, startPadding } = useMemo(() => {
    const monthStart = startOfMonth(new Date(month + '-01'));
    const monthEnd = endOfMonth(monthStart);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPad = getDay(monthStart); // 0=Sunday
    return { days: allDays, startPadding: startPad };
  }, [month]);

  return (
    <View style={styles.container}>
      {/* Day of week headers */}
      <View style={styles.row}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.dayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {/* Empty cells for padding */}
        {Array.from({ length: startPadding }).map((_, i) => (
          <View key={`pad-${i}`} style={styles.cell} />
        ))}

        {/* Day cells */}
        {days.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const pct = completionData[dateStr] ?? 0;
          const opacity = pct === 0 ? 0 : 0.2 + pct * 0.8; // 0.2 to 1.0 range

          return (
            <Pressable
              key={dateStr}
              style={styles.cell}
              onPress={() => onDayPress?.(dateStr)}
            >
              <View
                style={[
                  styles.dayDot,
                  pct > 0
                    ? { backgroundColor: accentColor, opacity }
                    : styles.dayEmpty,
                ]}
              >
                <Text style={[styles.dayNumber, pct > 0 && styles.dayNumberFilled]}>
                  {format(date, 'd')}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  dayDot: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayEmpty: {
    backgroundColor: '#f0f0f0',
  },
  dayNumber: {
    fontSize: 13,
    color: '#666',
  },
  dayNumberFilled: {
    color: '#fff',
    fontWeight: '600',
  },
});
