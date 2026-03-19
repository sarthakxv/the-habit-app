import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { neo } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';

interface StreakBadgeProps {
  count: number;
  includesFreeze: boolean;
  label?: string;
  size?: 'large' | 'small';
}

export function StreakBadge({ count, includesFreeze, label = 'Current Streak', size = 'large' }: StreakBadgeProps) {
  const colors = useThemeColors();
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.container,
        neo.shadowSm,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.row}>
        {isLarge && (
          <View style={[styles.iconBg, { backgroundColor: colors.pastelYellow }]}>
            <MaterialCommunityIcons name="star" size={18} color={colors.text} />
          </View>
        )}
        <Text style={[isLarge ? styles.countLarge : styles.countSmall, { color: colors.text }]}>
          {count} {count === 1 ? 'DAY' : 'DAYS'}
        </Text>
        {includesFreeze && (
          <MaterialCommunityIcons name="shield-check" size={16} color={colors.textSecondary} />
        )}
      </View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderWidth: neo.borderWidth,
    borderRadius: neo.borderRadiusSm,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minWidth: 130,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countLarge: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  countSmall: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
