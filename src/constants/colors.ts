/** Curated color palette for habit colors. 12 distinct, vibrant colors
 * that look good on both light and dark backgrounds. */
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

export type HabitColor = (typeof HABIT_COLORS)[number];
