import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks/useThemeColors';
import { neo } from '@/src/constants/theme';
import {
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_LAST_UPDATED,
} from '@/src/constants/privacyPolicy';

export default function PrivacyPolicyScreen() {
  const colors = useThemeColors();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.headerCard,
            neo.shadow,
            { backgroundColor: colors.pastelLavender, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Privacy Policy
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Last updated: {PRIVACY_POLICY_LAST_UPDATED}
          </Text>
        </View>

        {PRIVACY_POLICY_SECTIONS.map((section) => (
          <View
            key={section.title}
            style={[
              styles.card,
              neo.shadow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
              {section.body}
            </Text>
          </View>
        ))}
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
    gap: 12,
  },
  headerCard: {
    borderWidth: neo.borderWidth,
    borderRadius: neo.borderRadius,
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    borderWidth: neo.borderWidth,
    borderRadius: neo.borderRadius,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
});
