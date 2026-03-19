import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { neo } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';

/** Day labels mapped to getDay() numbers: [1,2,3,4,5,6,0] = M T W T F S S */
const DAYS = [
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
  { label: 'S', value: 0 },
];

interface DaySelectorProps {
  selected: number[];
  onToggle: (day: number) => void;
}

export function DaySelector({ selected, onToggle }: DaySelectorProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {DAYS.map(({ label, value }) => {
        const isSelected = selected.includes(value);
        return (
          <Pressable
            key={`${label}-${value}`}
            style={[
              styles.day,
              {
                backgroundColor: isSelected ? colors.text : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => onToggle(value)}
          >
            <Text
              style={[
                styles.label,
                { color: isSelected ? colors.card : colors.text },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
  },
  day: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
  },
});
