/** Emoji icons available for habits. Cross-platform, zero asset management. */
export const HABIT_ICONS = [
  '🏃', '💪', '📚', '🧘', '💧', '🍎', '😴', '✍️',
  '🎵', '🧹', '💊', '🌱', '🎯', '🧠', '💻', '🙏',
  '🚶', '🎨', '📝', '🍳', '🦷', '💰', '📱', '☀️',
] as const;

export type HabitIcon = (typeof HABIT_ICONS)[number];
