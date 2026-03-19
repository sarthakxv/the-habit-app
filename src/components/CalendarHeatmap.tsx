import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { neo } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';

interface CalendarHeatmapProps {
  month: string;
  completionData: Record<string, number>;
  accentColor?: string;
  onDayPress?: (date: string) => void;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarHeatmap({
  month,
  completionData,
  accentColor = '#1B1A2E',
  onDayPress,
}: CalendarHeatmapProps) {
  const colors = useThemeColors();

  const { days, startPadding } = useMemo(() => {
    const monthStart = startOfMonth(new Date(month + '-01'));
    const monthEnd = endOfMonth(monthStart);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPad = getDay(monthStart);
    return { days: allDays, startPadding: startPad };
  }, [month]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <View
      style={[
        styles.container,
        neo.shadow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Day of week headers */}
      <View style={styles.row}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={styles.cell}>
            <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {Array.from({ length: startPadding }).map((_, i) => (
          <View key={`pad-${i}`} style={styles.cell} />
        ))}

        {days.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const pct = completionData[dateStr] ?? 0;
          const isToday = dateStr === todayStr;

          return (
            <Pressable
              key={dateStr}
              style={styles.cell}
              onPress={() => onDayPress?.(dateStr)}
            >
              <View
                style={[
                  styles.dayDot,
                  {
                    backgroundColor: pct > 0
                      ? accentColor
                      : colors.background,
                    opacity: pct > 0 ? 0.3 + pct * 0.7 : 1,
                    borderColor: isToday ? accentColor : 'transparent',
                    borderWidth: isToday ? 2 : 0,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    {
                      color: pct > 0 ? '#fff' : colors.textSecondary,
                      fontWeight: isToday ? '900' : '500',
                    },
                  ]}
                >
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
    marginHorizontal: 16,
    padding: 14,
    borderWidth: neo.borderWidth,
    borderRadius: neo.borderRadius,
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
    fontWeight: '700',
  },
  dayDot: {
    width: '88%',
    height: '88%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 13,
  },
});
