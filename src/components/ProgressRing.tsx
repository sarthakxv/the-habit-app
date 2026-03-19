import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
}

/** Simple progress display. Uses text for V1; can be replaced with
 * an animated SVG ring in Step 8 (animations). */
export function ProgressRing({ completed, total, size = 80 }: ProgressRingProps) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const isAllDone = total > 0 && completed === total;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.count, isAllDone && styles.countDone]}>
        {completed}/{total}
      </Text>
      <Text style={styles.label}>{percentage}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  count: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  countDone: {
    color: '#4CAF50',
  },
  label: {
    fontSize: 12,
    color: '#888',
  },
});
