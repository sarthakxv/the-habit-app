import React, { useState, useCallback } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHabitStore } from '@/src/store/habitStore';
import { getDatabase } from '@/src/hooks/useBootLoader';
import { ColorPicker } from '@/src/components/ColorPicker';
import { IconPicker } from '@/src/components/IconPicker';
import { DaySelector } from '@/src/components/DaySelector';
import { ReminderTimePicker } from '@/src/components/ReminderTimePicker';
import { useThemeColors } from '@/src/hooks/useThemeColors';
import { neo } from '@/src/constants/theme';
import type { Habit, HabitFrequency } from '@/src/types';
import {
  scheduleHabitReminder,
  cancelHabitReminder,
  requestNotificationPermissions,
} from '@/src/utils/notifications';

interface Props {
  habit: Habit;
  onClose: () => void;
}

export function EditHabitModal({ habit, onClose }: Props) {
  const colors = useThemeColors();
  const updateHabit = useHabitStore((s) => s.updateHabit);

  const [name, setName] = useState(habit.name);
  const [color, setColor] = useState(habit.color);
  const [icon, setIcon] = useState(habit.icon);
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly'>(
    habit.frequency.type
  );
  const [weeklyDays, setWeeklyDays] = useState<number[]>(
    habit.frequency.type === 'weekly' ? habit.frequency.days : [1, 2, 3, 4, 5]
  );
  const [reminderTime, setReminderTime] = useState<string | null>(habit.reminderTime);

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

    try {
      const db = getDatabase();
      let newNotificationId = habit.notificationId;

      // Handle reminder time change
      const reminderChanged = reminderTime !== habit.reminderTime;
      if (reminderChanged) {
        if (habit.notificationId) {
          await cancelHabitReminder(habit.notificationId);
        }
        newNotificationId = null;

        if (reminderTime) {
          const hasPermission = await requestNotificationPermissions();
          if (!hasPermission) {
            Alert.alert(
              'Permission Required',
              'Please enable notifications in Settings to use reminders.'
            );
            return;
          }
          newNotificationId = await scheduleHabitReminder(name.trim(), reminderTime, frequency);
        }
      }

      await updateHabit(db, habit.id, {
        name: name.trim(),
        color,
        icon,
        frequency,
        reminderTime,
        notificationId: newNotificationId,
      });

      onClose();
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    }
  }, [name, color, icon, frequencyType, weeklyDays, reminderTime, habit, updateHabit, onClose]);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Edit Habit</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Name */}
          <Text style={[styles.label, { color: colors.text }]}>Name</Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Exercise, Read, Meditate"
            placeholderTextColor={colors.textSecondary}
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
            ]}
            onPress={handleSave}
          >
            <MaterialCommunityIcons name="check" size={22} color={colors.card} />
            <Text style={[styles.saveText, { color: colors.card }]}>Save Changes</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: neo.borderWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
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
