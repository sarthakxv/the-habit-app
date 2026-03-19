import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHabitStore } from '@/src/store/habitStore';
import { getDatabase } from '@/src/hooks/useBootLoader';
import { cancelAllNotifications } from '@/src/services/notificationService';
import { useThemeColors } from '@/src/hooks/useThemeColors';
import { neo } from '@/src/constants/theme';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const freezes = useHabitStore((s) => s.freezes);

  const handleNotificationToggle = useCallback(async (value: boolean) => {
    setNotificationsEnabled(value);
    if (!value) {
      await cancelAllNotifications();
    }
  }, []);

  const handleExportJSON = useCallback(async () => {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        habits,
        completions: Object.fromEntries(
          Object.entries(completions).map(([id, dates]) => [id, Array.from(dates)])
        ),
        freezes: Object.fromEntries(
          Object.entries(freezes).map(([id, dates]) => [id, Array.from(dates)])
        ),
      };

      const json = JSON.stringify(data, null, 2);
      const file = new File(Paths.cache, 'habit-tracker-export.json');
      file.create();
      file.write(json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Habit Data',
        });
      }
    } catch {
      Alert.alert('Error', 'Failed to export data.');
    }
  }, [habits, completions, freezes]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Notifications */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        NOTIFICATIONS
      </Text>
      <View
        style={[
          styles.card,
          neo.shadow,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
            <Text style={[styles.rowLabel, { color: colors.text }]}>Enable reminders</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ true: colors.text, false: colors.textSecondary + '40' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Data */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        DATA
      </Text>
      <Pressable
        style={[
          styles.card,
          styles.buttonCard,
          neo.shadow,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={handleExportJSON}
      >
        <MaterialCommunityIcons name="export-variant" size={22} color={colors.text} />
        <Text style={[styles.buttonText, { color: colors.text }]}>Export as JSON</Text>
      </Pressable>

      {/* App Info */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        ABOUT
      </Text>
      <View
        style={[
          styles.card,
          neo.shadow,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.info, { color: colors.text }]}>The Habit App v1.0.0</Text>
        <Text style={[styles.infoSub, { color: colors.textSecondary }]}>
          Track habits, build streaks, stay consistent.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 28,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderWidth: neo.borderWidth,
    borderRadius: neo.borderRadius,
    padding: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoSub: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
});
