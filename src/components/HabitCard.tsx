import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HabitIcon } from './HabitIcon';
import { neo } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';
import type { Habit } from '../types';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  streakCount: number;
  onToggle: () => void;
  onPress: () => void;
}

export function HabitCard({ habit, isCompleted, streakCount, onToggle, onPress }: HabitCardProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      style={[
        styles.container,
        neo.shadow,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        isCompleted && { opacity: 0.7 },
      ]}
      onPress={onPress}
    >
      {/* Left color stripe */}
      <View style={[styles.colorStripe, { backgroundColor: habit.color }]} />

      <View style={styles.content}>
        <HabitIcon icon={habit.icon} size={44} />

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.name,
              { color: colors.text },
              isCompleted && styles.nameCompleted,
            ]}
          >
            {habit.name}
          </Text>
          {streakCount > 0 && (
            <Text style={[styles.streak, { color: colors.textSecondary }]}>
              Day {streakCount}
            </Text>
          )}
        </View>
      </View>

      {/* Check button */}
      <Pressable
        style={[
          styles.checkButton,
          {
            borderColor: colors.border,
            backgroundColor: isCompleted ? habit.color : 'transparent',
          },
        ]}
        onPress={(e) => {
          e.stopPropagation?.();
          onToggle();
        }}
        hitSlop={8}
      >
        {isCompleted && (
          <MaterialCommunityIcons name="check" size={20} color="#fff" />
        )}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: neo.borderRadius,
    borderWidth: neo.borderWidth,
    marginHorizontal: 16,
    marginVertical: 6,
    minHeight: 72,
    overflow: 'hidden',
  },
  colorStripe: {
    width: 5,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  nameCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  streak: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
});
