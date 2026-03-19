import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { neo } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';

interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
}

/** Progress display card with neo-brutalist styling.
 * Shows completed/total with a bold progress bar. */
export function ProgressRing({ completed, total, size = 100 }: ProgressRingProps) {
  const colors = useThemeColors();
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const isAllDone = total > 0 && completed === total;

  return (
    <View
      style={[
        styles.container,
        neo.shadow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.motivational, { color: colors.textSecondary }]}>
        {isAllDone
          ? "You're nearly there. Keep Going!"
          : total === 0
            ? 'Add habits to start tracking'
            : `${completed} of ${total} completed`}
      </Text>
      <Text style={[styles.count, { color: colors.text }]}>
        {completed}/{total} goals completed
      </Text>

      {/* Progress bar */}
      <View style={[styles.barTrack, { backgroundColor: colors.border + '20' }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percentage}%`,
              backgroundColor: colors.text,
            },
          ]}
        />
      </View>
      <Text style={[styles.percentage, { color: colors.textSecondary }]}>
        {percentage}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: neo.borderWidth,
    borderRadius: neo.borderRadius,
    marginHorizontal: 16,
    padding: 20,
  },
  motivational: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  count: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  barTrack: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
    minWidth: 4,
  },
  percentage: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'right',
  },
});
