/** Neo-Brutalism design system.
 * Thick borders, offset shadows, pastel accents, bold typography. */

export const neo = {
  /** Solid offset shadow — the signature neo-brutalist effect */
  shadow: {
    shadowColor: '#1B1A2E',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  /** Smaller shadow for interactive elements */
  shadowSm: {
    shadowColor: '#1B1A2E',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  /** Pressed state — reduced or no shadow */
  shadowPressed: {
    shadowColor: '#1B1A2E',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1,
  },
  borderWidth: 2,
  borderRadius: 16,
  borderRadiusSm: 12,
  borderRadiusLg: 20,
  borderRadiusFull: 999,
} as const;

export const theme = {
  light: {
    text: '#1B1A2E',
    textSecondary: '#6B6880',
    background: '#EDE8F5',
    card: '#FFFFFF',
    border: '#1B1A2E',
    tint: '#1B1A2E',
    tabIconDefault: '#A8A3B8',
    tabIconSelected: '#1B1A2E',
    success: '#4CAF50',
    danger: '#E53935',
    // Neo-brutalism pastels
    pastelLavender: '#D4C8F0',
    pastelYellow: '#FFF3A3',
    pastelGreen: '#C8E6C9',
    pastelPink: '#FFCDD2',
    pastelCyan: '#B2EBF2',
    pastelPeach: '#FFE0B2',
    pastelMint: '#B8DFB0',
    pastelLilac: '#E1BEE7',
  },
  dark: {
    text: '#F0ECF8',
    textSecondary: '#A8A3B8',
    background: '#141225',
    card: '#1F1D35',
    border: '#3D3A58',
    tint: '#D4C8F0',
    tabIconDefault: '#5A5672',
    tabIconSelected: '#D4C8F0',
    success: '#81C784',
    danger: '#EF5350',
    // Neo-brutalism pastels (muted for dark mode)
    pastelLavender: '#3D3560',
    pastelYellow: '#4A4530',
    pastelGreen: '#2D4A30',
    pastelPink: '#4A2D30',
    pastelCyan: '#2D4045',
    pastelPeach: '#4A3D28',
    pastelMint: '#2D4530',
    pastelLilac: '#3D2D45',
  },
} as const;

export type Theme = {
  [K in keyof (typeof theme.light)]: string;
};
export type ColorScheme = 'light' | 'dark';
