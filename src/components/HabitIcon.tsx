import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ICON_MAP } from '../constants/icons';
import { neo } from '../constants/theme';

interface HabitIconProps {
  icon: string;
  size?: number;
  /** Override the pastel background from ICON_MAP */
  backgroundColor?: string;
  /** Override icon color (default: #1B1A2E) */
  iconColor?: string;
  /** Show neo-brutalist border */
  bordered?: boolean;
}

/** Renders a habit icon inside a pastel-colored circle.
 * Maps emoji strings to MaterialCommunityIcons for reliable rendering. */
export function HabitIcon({
  icon,
  size = 48,
  backgroundColor,
  iconColor = '#1B1A2E',
  bordered = false,
}: HabitIconProps) {
  const mapped = ICON_MAP[icon];
  const bg = backgroundColor ?? mapped?.bg ?? '#D4C8F0';
  const iconName = mapped?.mci ?? 'star';
  const iconSize = size * 0.5;

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
        bordered && {
          borderWidth: neo.borderWidth,
          borderColor: '#1B1A2E',
        },
      ]}
    >
      <MaterialCommunityIcons
        name={iconName as any}
        size={iconSize}
        color={iconColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
