import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
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

  const [trackWidth, setTrackWidth] = useState(0);
  const animatedFillWidth = useSharedValue(0);

  useEffect(() => {
    if (trackWidth > 0) {
      animatedFillWidth.value = withTiming((percentage / 100) * trackWidth, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [percentage, trackWidth]);

  const barAnimatedStyle = useAnimatedStyle(() => ({
    width: animatedFillWidth.value,
  }));

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
      <View
        style={[styles.barTrack, { backgroundColor: colors.border + '20' }]}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[styles.barFill, { backgroundColor: colors.text }, barAnimatedStyle]}
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
  },
  percentage: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'right',
  },
});
