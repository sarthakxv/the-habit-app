import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { neo } from '../constants/theme';
import { formatReminderTime } from '../utils/notifications';

/** Preset reminder times in "HH:MM" format, 6 AM to 10 PM in 30-min steps. */
const PRESET_TIMES: string[] = [];
for (let hour = 6; hour <= 22; hour++) {
  PRESET_TIMES.push(`${hour.toString().padStart(2, '0')}:00`);
  if (hour < 22) {
    PRESET_TIMES.push(`${hour.toString().padStart(2, '0')}:30`);
  }
}

interface Props {
  value: string | null;
  onChange: (time: string | null) => void;
}

/**
 * Inline reminder row that opens a modal time picker on press.
 * Shows "No Reminder" when value is null, or formatted time when set.
 */
export function ReminderTimePicker({ value, onChange }: Props) {
  const colors = useThemeColors();
  const [visible, setVisible] = React.useState(false);

  return (
    <>
      {/* Trigger Row */}
      <Pressable
        style={[
          styles.triggerRow,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setVisible(true)}
      >
        <MaterialCommunityIcons name="bell-outline" size={20} color={colors.text} />
        <Text style={[styles.triggerLabel, { color: colors.text }]}>
          {value ? formatReminderTime(value) : 'No Reminder'}
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
      </Pressable>

      {/* Time Picker Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.background }]} onPress={() => {}}>
            {/* Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Set Reminder</Text>
              <Pressable onPress={() => setVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.timeList}>
              {/* No reminder option */}
              <Pressable
                style={[
                  styles.timeRow,
                  {
                    backgroundColor: value === null ? colors.text : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  onChange(null);
                  setVisible(false);
                }}
              >
                <MaterialCommunityIcons
                  name="bell-off-outline"
                  size={18}
                  color={value === null ? colors.card : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.timeText,
                    { color: value === null ? colors.card : colors.text },
                  ]}
                >
                  No Reminder
                </Text>
              </Pressable>

              {/* Time presets */}
              {PRESET_TIMES.map((time) => {
                const selected = value === time;
                return (
                  <Pressable
                    key={time}
                    style={[
                      styles.timeRow,
                      {
                        backgroundColor: selected ? colors.text : colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      onChange(time);
                      setVisible(false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={18}
                      color={selected ? colors.card : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.timeText,
                        { color: selected ? colors.card : colors.text },
                      ]}
                    >
                      {formatReminderTime(time)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderWidth: neo.borderWidth,
    borderRadius: neo.borderRadiusSm,
  },
  triggerLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    borderWidth: neo.borderWidth,
    borderBottomWidth: 0,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: neo.borderWidth,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  timeList: {
    padding: 16,
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: neo.borderWidth,
    borderRadius: neo.borderRadiusSm,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
