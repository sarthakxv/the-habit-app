import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
  return (
    <View style={styles.container}>
      {DAYS.map(({ label, value }) => {
        const isSelected = selected.includes(value);
        return (
          <Pressable
            key={`${label}-${value}`}
            style={[styles.day, isSelected && styles.daySelected]}
            onPress={() => onToggle(value)}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
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
    gap: 6,
    paddingVertical: 8,
  },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  daySelected: {
    backgroundColor: '#4CAF50',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  labelSelected: {
    color: '#fff',
  },
});
