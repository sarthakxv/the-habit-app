import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HABIT_COLORS } from '../constants/colors';
import { neo } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';

interface ColorPickerProps {
  selected: string;
  onSelect: (color: string) => void;
}

export function ColorPicker({ selected, onSelect }: ColorPickerProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {HABIT_COLORS.map((color) => (
        <Pressable
          key={color}
          style={[
            styles.swatch,
            { backgroundColor: color },
            selected === color && {
              borderWidth: 3,
              borderColor: colors.border,
            },
          ]}
          onPress={() => onSelect(color)}
        >
          {selected === color && (
            <MaterialCommunityIcons name="check" size={18} color="#fff" />
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 8,
  },
  swatch: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
