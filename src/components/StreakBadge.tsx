import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StreakBadgeProps {
  count: number;
  includesFreeze: boolean;
  label?: string;
  size?: 'large' | 'small';
}

export function StreakBadge({ count, includesFreeze, label = 'Current Streak', size = 'large' }: StreakBadgeProps) {
  const isLarge = size === 'large';
  return (
    <View style={styles.container}>
      <Text style={isLarge ? styles.countLarge : styles.countSmall}>
        {count}{includesFreeze ? ' 🛡️' : ''}
      </Text>
      <Text style={isLarge ? styles.unitLarge : styles.unitSmall}>
        {count === 1 ? 'day' : 'days'}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  countLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  countSmall: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  unitLarge: {
    fontSize: 16,
    color: '#666',
    marginTop: -4,
  },
  unitSmall: {
    fontSize: 13,
    color: '#666',
  },
  label: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
});
