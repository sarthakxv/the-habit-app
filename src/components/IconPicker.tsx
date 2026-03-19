import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HABIT_ICONS } from '../constants/icons';

interface IconPickerProps {
  selected: string;
  onSelect: (icon: string) => void;
}

export function IconPicker({ selected, onSelect }: IconPickerProps) {
  return (
    <View style={styles.container}>
      {HABIT_ICONS.map((icon) => (
        <Pressable
          key={icon}
          style={[styles.item, selected === icon && styles.selected]}
          onPress={() => onSelect(icon)}
        >
          <Text style={styles.icon}>{icon}</Text>
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
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  selected: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  icon: {
    fontSize: 24,
  },
});
