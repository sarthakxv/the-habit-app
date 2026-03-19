import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { HABIT_ICONS } from '../constants/icons';
import { HabitIcon } from './HabitIcon';
import { neo } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';

interface IconPickerProps {
  selected: string;
  onSelect: (icon: string) => void;
}

export function IconPicker({ selected, onSelect }: IconPickerProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {HABIT_ICONS.map((icon) => (
        <Pressable
          key={icon}
          style={[
            styles.item,
            { borderColor: 'transparent' },
            selected === icon && {
              borderColor: colors.border,
              backgroundColor: colors.pastelLavender,
            },
          ]}
          onPress={() => onSelect(icon)}
        >
          <HabitIcon icon={icon} size={36} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  item: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
