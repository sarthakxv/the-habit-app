import React, { useState, useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHabitStore } from '@/src/store/habitStore';
import { getDatabase } from '@/src/hooks/useBootLoader';
import { ColorPicker } from '@/src/components/ColorPicker';
import { IconPicker } from '@/src/components/IconPicker';
import { DaySelector } from '@/src/components/DaySelector';
import { ReminderTimePicker } from '@/src/components/ReminderTimePicker';
import { HABIT_COLORS } from '@/src/constants/colors';
import { HABIT_ICONS } from '@/src/constants/icons';
import { useThemeColors } from '@/src/hooks/useThemeColors';
import { neo } from '@/src/constants/theme';
import type { HabitFrequency } from '@/src/types';
import {
  scheduleHabitReminder,
  requestNotificationPermissions,
} from '@/src/utils/notifications';

export default function NewHabitScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const addHabit = useHabitStore((s) => s.addHabit);

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(HABIT_COLORS[0]);
  const [icon, setIcon] = useState<string>(HABIT_ICONS[0]);
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly'>('daily');
  const [weeklyDays, setWeeklyDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [reminderTime, setReminderTime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleDayToggle = useCallback((day: number) => {
    setWeeklyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a habit name.');
      return;
    }

    const frequency: HabitFrequency =
      frequencyType === 'daily'
        ? { type: 'daily' }
        : { type: 'weekly', days: weeklyDays.sort((a, b) => a - b) };

    if (frequencyType === 'weekly' && weeklyDays.length === 0) {
      Alert.alert('Select days', 'Pick at least one day for your habit.');
      return;
    }

    setSaving(true);
    try {
      const db = getDatabase();
      const habit = await addHabit(db, {
        name: name.trim(),
        color,
        icon,
        frequency,
        reminderTime,
      });

      // Schedule notification if reminder time was set
      if (reminderTime) {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          const notificationId = await scheduleHabitReminder(habit.name, reminderTime, frequency);
          await useHabitStore.getState().updateHabit(db, habit.id, { notificationId });
        }
      }

      if (navigation.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (e) {
      setSaving(false);
      const message = e instanceof Error ? e.message : 'Something went wrong';
      Alert.alert('Error', message);
    }
  }, [name, color, icon, frequencyType, weeklyDays, reminderTime, addHabit, router, navigation]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Name */}
      <Text style={[styles.label, { color: colors.text }]}>Name</Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.card,
          },
        ]}
        value={name}
        onChangeText={setName}
        placeholder="e.g., Exercise, Read, Meditate"
        placeholderTextColor={colors.textSecondary}
        autoFocus
        maxLength={50}
      />

      {/* Icon */}
      <Text style={[styles.label, { color: colors.text }]}>Icon</Text>
      <IconPicker selected={icon} onSelect={setIcon} />

      {/* Color */}
      <Text style={[styles.label, { color: colors.text }]}>Color</Text>
      <ColorPicker selected={color} onSelect={setColor} />

      {/* Frequency */}
      <Text style={[styles.label, { color: colors.text }]}>Frequency</Text>
      <View style={styles.freqRow}>
        <Pressable
          style={[
            styles.freqButton,
            {
              backgroundColor: frequencyType === 'daily' ? colors.text : colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setFrequencyType('daily')}
        >
          <Text
            style={[
              styles.freqText,
              { color: frequencyType === 'daily' ? colors.card : colors.text },
            ]}
          >
            Every day
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.freqButton,
            {
              backgroundColor: frequencyType === 'weekly' ? colors.text : colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setFrequencyType('weekly')}
        >
          <Text
            style={[
              styles.freqText,
              { color: frequencyType === 'weekly' ? colors.card : colors.text },
            ]}
          >
            Specific days
          </Text>
        </Pressable>
      </View>
      {frequencyType === 'weekly' && (
        <DaySelector selected={weeklyDays} onToggle={handleDayToggle} />
      )}

      {/* Reminder */}
      <Text style={[styles.label, { color: colors.text }]}>Reminder</Text>
      <ReminderTimePicker value={reminderTime} onChange={setReminderTime} />

      {/* Save */}
      <Pressable
        style={[
          styles.saveButton,
          neo.shadow,
          { backgroundColor: colors.text, borderColor: colors.border },
          saving && { opacity: 0.5 },
        ]}
        onPress={handleSave}
        disabled={saving}
      >
        <MaterialCommunityIcons name="plus" size={22} color={colors.card} />
        <Text style={[styles.saveText, { color: colors.card }]}>Create Habit</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 22,
    marginBottom: 8,
  },
  input: {
    borderWidth: neo.borderWidth,
    borderRadius: neo.borderRadiusSm,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  freqRow: {
    flexDirection: 'row',
    gap: 10,
  },
  freqButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: neo.borderRadiusSm,
    borderWidth: neo.borderWidth,
    alignItems: 'center',
  },
  freqText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: neo.borderRadiusSm,
    borderWidth: neo.borderWidth,
    marginTop: 32,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '800',
  },
});
