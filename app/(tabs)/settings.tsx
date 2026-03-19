import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useHabitStore } from '@/src/store/habitStore';
import { getDatabase } from '@/src/hooks/useBootLoader';
import { cancelAllNotifications } from '@/src/services/notificationService';

export default function SettingsScreen() {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Notifications */}
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Enable reminders</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={handleNotificationToggle}
          trackColor={{ true: '#4CAF50' }}
        />
      </View>

      {/* Data */}
      <Text style={styles.sectionTitle}>Data</Text>
      <Pressable style={styles.button} onPress={handleExportJSON}>
        <Text style={styles.buttonText}>Export as JSON</Text>
      </Pressable>

      {/* App Info */}
      <Text style={styles.sectionTitle}>About</Text>
      <Text style={styles.info}>The Habit App v1.0.0</Text>
      <Text style={styles.infoSub}>Track habits, build streaks, stay consistent.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 28,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowLabel: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  info: {
    fontSize: 15,
    color: '#333',
  },
  infoSub: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
