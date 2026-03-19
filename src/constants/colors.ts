/** Curated color palette for habit colors — neo-brutalism pastels.
 * Each color has a main swatch and a lighter background variant. */
export const HABIT_COLORS = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FF5722', // Deep Orange
  '#9C27B0', // Purple
  '#FF9800', // Orange
  '#00BCD4', // Cyan
  '#E91E63', // Pink
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#FFEB3B', // Yellow
  '#8BC34A', // Light Green
  '#3F51B5', // Indigo
] as const;

/** Pastel background for each habit color — used for icon circles */
export const HABIT_COLOR_PASTEL: Record<string, string> = {
  '#4CAF50': '#C8E6C9',
  '#2196F3': '#BBDEFB',
  '#FF5722': '#FFCCBC',
  '#9C27B0': '#E1BEE7',
  '#FF9800': '#FFE0B2',
  '#00BCD4': '#B2EBF2',
  '#E91E63': '#F8BBD0',
  '#795548': '#D7CCC8',
  '#607D8B': '#CFD8DC',
  '#FFEB3B': '#FFF9C4',
  '#8BC34A': '#DCEDC8',
  '#3F51B5': '#C5CAE9',
};

export type HabitColor = (typeof HABIT_COLORS)[number];
