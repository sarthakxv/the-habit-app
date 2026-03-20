import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { neo, theme } from '@/src/constants/theme';
import { markOnboardingSeen } from '@/src/db/settings';
import { getDatabase } from '@/src/hooks/useBootLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const colors = theme.light;

interface OnboardingSlide {
  key: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  backgroundColor: string;
  title: string;
  body: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    key: 'welcome',
    icon: 'bullseye-arrow',
    backgroundColor: colors.pastelYellow,
    title: 'Focus beats volume.',
    body: 'You can track up to 15 habits. Less is more — a short list you actually do is worth more than a long list you ignore.',
  },
  {
    key: 'freezes',
    icon: 'snowflake',
    backgroundColor: colors.pastelCyan,
    title: 'We forgive missed days.',
    body: 'Streak freezes protect your progress when life gets busy. One freeze per 7-day window, applied automatically.',
  },
  {
    key: 'start',
    icon: 'check-circle-outline',
    backgroundColor: colors.pastelMint,
    title: "Let's build a habit.",
    body: 'Tap below to create your first habit and start your streak today.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    try {
      const db = getDatabase();
      await markOnboardingSeen(db);
    } catch {
      // Non-fatal — proceed anyway
    }
    router.replace('/habit/new');
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={[styles.iconCard, { backgroundColor: item.backgroundColor }, neo.shadow]}>
              <MaterialCommunityIcons name={item.icon} size={64} color={colors.text} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((s, i) => (
          <View
            key={s.key}
            style={[
              styles.dot,
              i === currentIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* CTA Button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            neo.shadow,
            pressed && neo.shadowPressed,
          ]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {isLast ? 'Create My First Habit' : 'Next'}
          </Text>
          <MaterialCommunityIcons
            name={isLast ? 'arrow-right-circle' : 'chevron-right'}
            size={22}
            color={colors.card}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  iconCard: {
    width: 128,
    height: 128,
    borderRadius: neo.borderRadiusLg,
    borderWidth: neo.borderWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.text,
    width: 28,
    borderRadius: 5,
  },
  dotInactive: {
    backgroundColor: 'transparent',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.text,
    borderColor: colors.border,
    borderWidth: neo.borderWidth,
    borderRadius: neo.borderRadius,
    paddingVertical: 18,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.card,
  },
});
