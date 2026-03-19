import React, { useState, useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useHabitStore } from '@/src/store/habitStore';
import { getDatabase } from '@/src/hooks/useBootLoader';
import { ColorPicker } from '@/src/components/ColorPicker';
import { IconPicker } from '@/src/components/IconPicker';
import { DaySelector } from '@/src/components/DaySelector';
import { HABIT_COLORS } from '@/src/constants/colors';
import { HABIT_ICONS } from '@/src/constants/icons';
import type { HabitFrequency } from '@/src/types';

export default function NewHabitScreen() {
  const router = useRouter();
  const addHabit = useHabitStore((s) => s.addHabit);

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(HABIT_COLORS[0]);
  const [icon, setIcon] = useState<string>(HABIT_ICONS[0]);
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly'>('daily');
  const [weeklyDays, setWeeklyDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default: weekdays

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
      await addHabit(db, {
        name: name.trim(),
        color,
        icon,
        frequency,
        reminderTime: null, // TODO: Add time picker in this form
      });
      router.back();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      Alert.alert('Error', message);
    }
  }, [name, color, icon, frequencyType, weeklyDays, addHabit, router]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Name */}
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g., Exercise, Read, Meditate"
        placeholderTextColor="#aaa"
        autoFocus
        maxLength={50}
      />

      {/* Icon */}
      <Text style={styles.label}>Icon</Text>
      <IconPicker selected={icon} onSelect={setIcon} />

      {/* Color */}
      <Text style={styles.label}>Color</Text>
      <ColorPicker selected={color} onSelect={setColor} />

      {/* Frequency */}
      <Text style={styles.label}>Frequency</Text>
      <View style={styles.freqRow}>
        <Pressable
          style={[styles.freqButton, frequencyType === 'daily' && styles.freqButtonActive]}
          onPress={() => setFrequencyType('daily')}
        >
          <Text style={[styles.freqText, frequencyType === 'daily' && styles.freqTextActive]}>
            Every day
          </Text>
        </Pressable>
        <Pressable
          style={[styles.freqButton, frequencyType === 'weekly' && styles.freqButtonActive]}
          onPress={() => setFrequencyType('weekly')}
        >
          <Text style={[styles.freqText, frequencyType === 'weekly' && styles.freqTextActive]}>
            Specific days
          </Text>
        </Pressable>
      </View>
      {frequencyType === 'weekly' && (
        <DaySelector selected={weeklyDays} onToggle={handleDayToggle} />
      )}

      {/* Save */}
      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Create Habit</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
  },
  freqRow: {
    flexDirection: 'row',
    gap: 10,
  },
  freqButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  freqButtonActive: {
    backgroundColor: '#4CAF50',
  },
  freqText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  freqTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  saveText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
