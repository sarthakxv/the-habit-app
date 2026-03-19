/** Emoji icons available for habits. Cross-platform, zero asset management. */
export const HABIT_ICONS = [
  '🏃', '💪', '📚', '🧘', '💧', '🍎', '😴', '✍️',
  '🎵', '🧹', '💊', '🌱', '🎯', '🧠', '💻', '🙏',
  '🚶', '🎨', '📝', '🍳', '🦷', '💰', '📱', '☀️',
] as const;

export type HabitIcon = (typeof HABIT_ICONS)[number];

/** Map emoji to MaterialCommunityIcons name + pastel background.
 * This replaces broken emoji rendering with reliable vector icons
 * displayed inside colored circles (neo-brutalism style). */
export const ICON_MAP: Record<string, { mci: string; bg: string }> = {
  '🏃': { mci: 'run-fast', bg: '#D4C8F0' },
  '💪': { mci: 'weight-lifter', bg: '#FFE0B2' },
  '📚': { mci: 'book-open-page-variant', bg: '#BBDEFB' },
  '🧘': { mci: 'yoga', bg: '#FFCDD2' },
  '💧': { mci: 'water', bg: '#B2EBF2' },
  '🍎': { mci: 'food-apple', bg: '#C8E6C9' },
  '😴': { mci: 'power-sleep', bg: '#E1BEE7' },
  '✍️': { mci: 'pencil', bg: '#FFF3A3' },
  '🎵': { mci: 'music-note', bg: '#D4C8F0' },
  '🧹': { mci: 'broom', bg: '#C8E6C9' },
  '💊': { mci: 'pill', bg: '#FFCDD2' },
  '🌱': { mci: 'sprout', bg: '#B8DFB0' },
  '🎯': { mci: 'bullseye-arrow', bg: '#FFE0B2' },
  '🧠': { mci: 'brain', bg: '#E1BEE7' },
  '💻': { mci: 'laptop', bg: '#BBDEFB' },
  '🙏': { mci: 'hand-heart', bg: '#FFF9C4' },
  '🚶': { mci: 'walk', bg: '#C8E6C9' },
  '🎨': { mci: 'palette', bg: '#FFCCBC' },
  '📝': { mci: 'note-text-outline', bg: '#FFF3A3' },
  '🍳': { mci: 'pot-steam', bg: '#FFE0B2' },
  '🦷': { mci: 'tooth-outline', bg: '#B2EBF2' },
  '💰': { mci: 'piggy-bank', bg: '#DCEDC8' },
  '📱': { mci: 'cellphone', bg: '#BBDEFB' },
  '☀️': { mci: 'weather-sunny', bg: '#FFF3A3' },
};
