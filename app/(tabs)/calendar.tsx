import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { format, subMonths, addMonths, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHabitStore } from '@/src/store/habitStore';
import { isHabitScheduledForDate } from '@/src/utils/dates';
import { CalendarHeatmap } from '@/src/components/CalendarHeatmap';
import { HabitIcon } from '@/src/components/HabitIcon';
import { useThemeColors } from '@/src/hooks/useThemeColors';
import { neo } from '@/src/constants/theme';

export default function CalendarScreen() {
  const colors = useThemeColors();
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);

  const completionData = useMemo(() => {
    const monthStart = startOfMonth(new Date(currentMonth + '-01'));
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const data: Record<string, number> = {};

    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const scheduled = habits.filter((h) => isHabitScheduledForDate(h.frequency, dateStr));
      if (scheduled.length === 0) {
        data[dateStr] = 0;
        continue;
      }
      const completed = scheduled.filter((h) => completions[h.id]?.has(dateStr)).length;
      data[dateStr] = completed / scheduled.length;
    }

    return data;
  }, [currentMonth, habits, completions]);

  const dayDetail = useMemo(() => {
    if (!selectedDate) return null;
    const scheduled = habits.filter((h) => isHabitScheduledForDate(h.frequency, selectedDate));
    return scheduled.map((h) => ({
      habit: h,
      completed: completions[h.id]?.has(selectedDate) ?? false,
    }));
  }, [selectedDate, habits, completions]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((m) => format(subMonths(new Date(m + '-01'), 1), 'yyyy-MM'));
    setSelectedDate(null);
  }, []);

  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const isCurrentMonth = currentMonth === currentMonthStr;

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((m) => {
      const next = format(addMonths(new Date(m + '-01'), 1), 'yyyy-MM');
      // Don't navigate past the current month
      if (next > currentMonthStr) return m;
      return next;
    });
    setSelectedDate(null);
  }, [currentMonthStr]);

  const monthLabel = format(new Date(currentMonth + '-01'), 'MMMM yyyy');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Month navigation */}
      <View style={styles.monthHeader}>
        <Pressable onPress={handlePrevMonth} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={[styles.monthText, { color: colors.text }]}>{monthLabel}</Text>
        {!isCurrentMonth && (
          <Pressable onPress={handleNextMonth} hitSlop={12}>
            <MaterialCommunityIcons name="chevron-right" size={28} color={colors.text} />
          </Pressable>
        )}
      </View>

      {/* Heatmap */}
      <CalendarHeatmap
        month={currentMonth}
        completionData={completionData}
        onDayPress={setSelectedDate}
      />

      {/* Day detail */}
      {selectedDate && dayDetail && (
        <View
          style={[
            styles.detail,
            neo.shadow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.detailTitle, { color: colors.text }]}>{selectedDate}</Text>
          {dayDetail.length === 0 ? (
            <Text style={[styles.detailEmpty, { color: colors.textSecondary }]}>
              No habits scheduled
            </Text>
          ) : (
            dayDetail.map(({ habit, completed }) => (
              <View key={habit.id} style={[styles.detailRow, { borderBottomColor: colors.border + '30' }]}>
                <HabitIcon icon={habit.icon} size={32} />
                <Text
                  style={[
                    styles.detailName,
                    { color: colors.text },
                    completed && { textDecorationLine: 'line-through', opacity: 0.5 },
                  ]}
                >
                  {habit.name}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: completed ? colors.pastelGreen : colors.pastelPink,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.statusText, { color: colors.text }]}>
                    {completed ? 'DONE' : 'MISSED'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 20,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '800',
  },
  detail: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: neo.borderRadius,
    borderWidth: neo.borderWidth,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  detailEmpty: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  detailName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
