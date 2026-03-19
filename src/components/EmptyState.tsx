import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { neo } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';

interface EmptyStateProps {
  onAddHabit: () => void;
}

export function EmptyState({ onAddHabit }: EmptyStateProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.pastelLavender }]}>
        <MaterialCommunityIcons name="bullseye-arrow" size={40} color={colors.text} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>No habits yet</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Add your first habit to get started
      </Text>
      <Pressable
        style={[
          styles.button,
          neo.shadow,
          { backgroundColor: colors.text, borderColor: colors.border },
        ]}
        onPress={onAddHabit}
      >
        <MaterialCommunityIcons name="plus" size={20} color={colors.card} />
        <Text style={[styles.buttonText, { color: colors.card }]}>Add Habit</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 28,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '800',
  },
});
