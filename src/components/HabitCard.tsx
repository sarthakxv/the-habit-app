import React from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import type { Habit } from '../types';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  streakCount: number;
  onToggle: () => void;
  onPress: () => void;
}

export function HabitCard({ habit, isCompleted, streakCount, onToggle, onPress }: HabitCardProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <Pressable
      style={[
        styles.container,
        { backgroundColor: isDark ? '#1E1E1E' : '#fff' },
        isCompleted && styles.completed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.colorStripe, { backgroundColor: habit.color }]} />
      <View style={styles.content}>
        <Text style={styles.icon}>{habit.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={[
            styles.name,
            { color: isDark ? '#fff' : '#1a1a1a' },
            isCompleted && styles.nameCompleted,
          ]}>
            {habit.name}
          </Text>
          {streakCount > 0 && (
            <Text style={[styles.streak, { color: isDark ? '#aaa' : '#888' }]}>
              Day {streakCount}
            </Text>
          )}
        </View>
      </View>
      <Pressable
        style={[
          styles.checkButton,
          { borderColor: isDark ? '#555' : '#ddd' },
          isCompleted && { backgroundColor: habit.color, borderColor: habit.color },
        ]}
        onPress={(e) => {
          e.stopPropagation?.();
          onToggle();
        }}
        hitSlop={8}
      >
        <Text style={[styles.checkText, isCompleted && styles.checkTextDone]}>
          {isCompleted ? '✓' : ''}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    minHeight: 64,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  completed: {
    opacity: 0.6,
  },
  colorStripe: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  nameCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  streak: {
    fontSize: 13,
    marginTop: 2,
  },
  checkButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkText: {
    fontSize: 18,
    color: '#ddd',
  },
  checkTextDone: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
