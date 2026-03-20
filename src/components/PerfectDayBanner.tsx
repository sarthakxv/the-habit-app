import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { neo } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';

export function PerfectDayBanner() {
  const colors = useThemeColors();

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(130)}
      style={[
        styles.container,
        neo.shadowSm,
        { backgroundColor: colors.pastelGreen, borderColor: colors.border },
      ]}
    >
      <MaterialCommunityIcons name="party-popper" size={22} color={colors.text} />
      <Text style={[styles.text, { color: colors.text }]}>All done for today!</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
  },
});
