// Core domain types for the habit tracker

export interface HabitFrequencyDaily {
  type: 'daily';
}

export interface HabitFrequencyWeekly {
  type: 'weekly';
  /** Day numbers using JS getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday */
  days: number[];
}

export type HabitFrequency = HabitFrequencyDaily | HabitFrequencyWeekly;

export interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  frequency: HabitFrequency;
  reminderTime: string | null;
  notificationId: string | null;
  position: number;
  createdAt: string;
  archived: boolean;
}

export interface Completion {
  id: string;
  habitId: string;
  completedAt: string; // YYYY-MM-DD
}

export interface StreakFreeze {
  id: string;
  habitId: string;
  freezeDate: string; // YYYY-MM-DD
  createdAt: string;
}

/** Raw habit row from SQLite (before JSON parsing / boolean conversion) */
export interface HabitRow {
  id: string;
  name: string;
  color: string;
  icon: string;
  frequency: string; // JSON string
  reminder_time: string | null;
  notification_id: string | null;
  position: number;
  created_at: string;
  archived: number; // 0 or 1
}

/** Raw completion row from SQLite */
export interface CompletionRow {
  id: string;
  habit_id: string;
  completed_at: string;
}

/** Raw streak freeze row from SQLite */
export interface StreakFreezeRow {
  id: string;
  habit_id: string;
  freeze_date: string;
  created_at: string;
}
