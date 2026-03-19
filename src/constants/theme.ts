export const theme = {
  light: {
    text: '#000000',
    textSecondary: '#666666',
    background: '#FFFFFF',
    card: '#F5F5F5',
    border: '#E0E0E0',
    tint: '#4CAF50',
    tabIconDefault: '#CCCCCC',
    tabIconSelected: '#4CAF50',
    success: '#4CAF50',
    danger: '#F44336',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    background: '#121212',
    card: '#1E1E1E',
    border: '#333333',
    tint: '#81C784',
    tabIconDefault: '#666666',
    tabIconSelected: '#81C784',
    success: '#81C784',
    danger: '#EF5350',
  },
} as const;

export type Theme = typeof theme.light;
export type ColorScheme = 'light' | 'dark';
