import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useHabitStore } from '@/src/store/habitStore';
import { getDatabase } from '@/src/hooks/useBootLoader';
import { cancelAllNotifications } from '@/src/utils/notifications';
import { exportHabitData } from '@/src/utils/exportData';
import { useToast } from '@/src/components/Toast';
import { useThemeColors } from '@/src/hooks/useThemeColors';
import { neo } from '@/src/constants/theme';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { showToast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const habits = useHabitStore((s) => s.habits);
  const archivedHabits = useHabitStore((s) => s.archivedHabits);
  const completions = useHabitStore((s) => s.completions);
  const freezes = useHabitStore((s) => s.freezes);
  const unarchiveHabit = useHabitStore((s) => s.unarchiveHabit);
  const deleteHabitPermanently = useHabitStore((s) => s.deleteHabitPermanently);

  const handleRestore = useCallback((id: string) => {
    Alert.alert('Restore Habit', 'This habit will reappear in your daily view.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        onPress: async () => {
          try {
            const db = getDatabase();
            await unarchiveHabit(db, id);
          } catch {
            showToast('Could not restore habit. Please try again.');
          }
        },
      },
    ]);
  }, [unarchiveHabit, showToast]);

  const handleDeleteForever = useCallback((id: string, name: string) => {
    Alert.alert(
      'Delete Forever',
      `"${name}" and all its history will be permanently deleted. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getDatabase();
              await deleteHabitPermanently(db, id);
            } catch {
              showToast('Could not delete habit. Please try again.');
            }
          },
        },
      ]
    );
  }, [deleteHabitPermanently, showToast]);

  const handleNotificationToggle = useCallback(async (value: boolean) => {
    setNotificationsEnabled(value);
    if (!value) {
      await cancelAllNotifications();
    }
  }, []);

  const handleExportJSON = useCallback(async () => {
    try {
      await exportHabitData(habits, completions, freezes);
    } catch {
      showToast('Failed to export data.');
    }
  }, [habits, completions, freezes, showToast]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
    <ScrollView
      style={styles.container}
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

      {/* Archived Habits */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        ARCHIVED HABITS
      </Text>
      {archivedHabits.length === 0 ? (
        <View
          style={[
            styles.card,
            neo.shadow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No archived habits
          </Text>
        </View>
      ) : (
        archivedHabits.map((habit) => (
          <View
            key={habit.id}
            style={[
              styles.card,
              styles.archivedRow,
              neo.shadow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.archivedName, { color: colors.text }]} numberOfLines={1}>
              {habit.icon} {habit.name}
            </Text>
            <View style={styles.archivedActions}>
              <Pressable
                style={[
                  styles.actionChip,
                  { backgroundColor: colors.pastelGreen, borderColor: colors.border },
                ]}
                onPress={() => handleRestore(habit.id)}
              >
                <Text style={[styles.actionChipText, { color: colors.text }]}>Restore</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionChip,
                  { backgroundColor: colors.pastelPink, borderColor: colors.border },
                ]}
                onPress={() => handleDeleteForever(habit.id, habit.name)}
              >
                <Text style={[styles.actionChipText, { color: colors.text }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

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

      {/* About */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        ABOUT
      </Text>
      <Pressable
        style={[
          styles.card,
          styles.buttonCard,
          neo.shadow,
          { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 8 },
        ]}
        onPress={() => router.push('/privacy-policy')}
      >
        <MaterialCommunityIcons name="shield-lock-outline" size={22} color={colors.text} />
        <Text style={[styles.buttonText, { color: colors.text }]}>Privacy Policy</Text>
      </Pressable>
      <View
        style={[
          styles.card,
          neo.shadow,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.info, { color: colors.text }]}>The Habit App v0.1.0</Text>
        <Text style={[styles.infoSub, { color: colors.textSecondary }]}>
          Track habits, build streaks, stay consistent.
        </Text>
      </View>
    </ScrollView>
    </SafeAreaView>
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
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 4,
  },
  archivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  archivedName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  archivedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: neo.borderRadiusFull,
    borderWidth: neo.borderWidth,
  },
  actionChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
