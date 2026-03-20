import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { neo } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/useThemeColors';

type ToastType = 'error' | 'success' | 'info';

interface ToastMessage {
  text: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (text: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_DURATION = 3000;

const ICON_MAP: Record<ToastType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  error: 'alert-circle-outline',
  success: 'check-circle-outline',
  info: 'information-outline',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [translateY]);

  const showToast = useCallback(
    (text: string, type: ToastType = 'error') => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setToast({ text, type });
      translateY.setValue(-120);

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }).start();

      timeoutRef.current = setTimeout(dismiss, TOAST_DURATION);
    },
    [translateY, dismiss],
  );

  const bgColor =
    toast?.type === 'error'
      ? colors.pastelPink
      : toast?.type === 'success'
        ? colors.pastelGreen
        : colors.pastelCyan;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            neo.shadowSm,
            {
              transform: [{ translateY }],
              top: insets.top + 8,
              backgroundColor: bgColor,
              borderColor: colors.border,
            },
          ]}
          pointerEvents="box-none"
        >
          <Pressable style={styles.inner} onPress={dismiss}>
            <MaterialCommunityIcons
              name={ICON_MAP[toast.type]}
              size={20}
              color={colors.text}
            />
            <Text style={[styles.text, { color: colors.text }]} numberOfLines={2}>
              {toast.text}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderWidth: neo.borderWidth,
    borderRadius: neo.borderRadiusSm,
    zIndex: 9999,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
});
