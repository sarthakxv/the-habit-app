import { useColorScheme } from '@/components/useColorScheme';
import { theme, type Theme } from '../constants/theme';

/** Returns the current theme's color palette based on system/user preference. */
export function useThemeColors(): Theme {
  const colorScheme = useColorScheme();
  return theme[colorScheme];
}
