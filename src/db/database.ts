import { CREATE_TABLES_SQL } from './schema';
import { runMigrations } from './migrations';
import type { Habit, Completion, StreakFreeze, HabitRow, CompletionRow, StreakFreezeRow, HabitFrequency } from '../types';

/** Minimal DB interface (matches expo-sqlite SQLiteDatabase subset).
 * Using an interface enables dependency injection for testing. */
export interface DatabaseLike {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: unknown[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getFirstAsync<T>(sql: string, params: unknown[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params: unknown[]): Promise<T[]>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
}

// --- Row mapping ---

function habitRowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    frequency: JSON.parse(row.frequency) as HabitFrequency,
    reminderTime: row.reminder_time,
    notificationId: row.notification_id,
    position: row.position,
    createdAt: row.created_at,
    archived: row.archived === 1,
  };
}

function completionRowToCompletion(row: CompletionRow): Completion {
  return {
    id: row.id,
    habitId: row.habit_id,
    completedAt: row.completed_at,
  };
}

function freezeRowToFreeze(row: StreakFreezeRow): StreakFreeze {
  return {
    id: row.id,
    habitId: row.habit_id,
    freezeDate: row.freeze_date,
    createdAt: row.created_at,
  };
}

// --- Initialization ---

export async function initializeDatabase(db: DatabaseLike): Promise<void> {
  await db.execAsync(CREATE_TABLES_SQL);
  await runMigrations(db);
}

// --- Queries ---

export async function getHabits(db: DatabaseLike): Promise<Habit[]> {
  const rows = await db.getAllAsync<HabitRow>(
    'SELECT * FROM habits WHERE archived = 0 ORDER BY position ASC',
    []
  );
  return rows.map(habitRowToHabit);
}

export async function getArchivedHabits(db: DatabaseLike): Promise<Habit[]> {
  const rows = await db.getAllAsync<HabitRow>(
    'SELECT * FROM habits WHERE archived = 1 ORDER BY name ASC',
    []
  );
  return rows.map(habitRowToHabit);
}

export async function getAllCompletions(db: DatabaseLike): Promise<Completion[]> {
  const rows = await db.getAllAsync<CompletionRow>(
    'SELECT * FROM completions',
    []
  );
  return rows.map(completionRowToCompletion);
}

export async function getStreakFreezes(db: DatabaseLike): Promise<StreakFreeze[]> {
  const rows = await db.getAllAsync<StreakFreezeRow>(
    'SELECT * FROM streak_freezes',
    []
  );
  return rows.map(freezeRowToFreeze);
}

// --- Mutations ---

export async function insertHabit(db: DatabaseLike, habit: Habit): Promise<void> {
  await db.runAsync(
    `INSERT INTO habits (id, name, color, icon, frequency, reminder_time, notification_id, position, created_at, archived)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      habit.id,
      habit.name,
      habit.color,
      habit.icon,
      JSON.stringify(habit.frequency),
      habit.reminderTime,
      habit.notificationId,
      habit.position,
      habit.createdAt,
      habit.archived ? 1 : 0,
    ]
  );
}

export async function updateHabit(
  db: DatabaseLike,
  id: string,
  updates: Partial<Pick<Habit, 'name' | 'color' | 'icon' | 'frequency' | 'reminderTime' | 'notificationId' | 'position'>>
): Promise<void> {
  const setClauses: string[] = [];
  const params: unknown[] = [];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    params.push(updates.name);
  }
  if (updates.color !== undefined) {
    setClauses.push('color = ?');
    params.push(updates.color);
  }
  if (updates.icon !== undefined) {
    setClauses.push('icon = ?');
    params.push(updates.icon);
  }
  if (updates.frequency !== undefined) {
    setClauses.push('frequency = ?');
    params.push(JSON.stringify(updates.frequency));
  }
  if (updates.reminderTime !== undefined) {
    setClauses.push('reminder_time = ?');
    params.push(updates.reminderTime);
  }
  if (updates.notificationId !== undefined) {
    setClauses.push('notification_id = ?');
    params.push(updates.notificationId);
  }
  if (updates.position !== undefined) {
    setClauses.push('position = ?');
    params.push(updates.position);
  }

  if (setClauses.length === 0) return;

  params.push(id);
  await db.runAsync(
    `UPDATE habits SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );
}

export async function archiveHabit(db: DatabaseLike, id: string): Promise<void> {
  await db.runAsync('UPDATE habits SET archived = 1 WHERE id = ?', [id]);
}

export async function unarchiveHabit(db: DatabaseLike, id: string): Promise<void> {
  await db.runAsync('UPDATE habits SET archived = 0 WHERE id = ?', [id]);
}

export async function deleteHabitPermanently(db: DatabaseLike, id: string): Promise<void> {
  await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
}

export async function insertCompletion(db: DatabaseLike, completion: Completion): Promise<void> {
  await db.runAsync(
    'INSERT INTO completions (id, habit_id, completed_at) VALUES (?, ?, ?)',
    [completion.id, completion.habitId, completion.completedAt]
  );
}

export async function deleteCompletion(db: DatabaseLike, habitId: string, date: string): Promise<void> {
  await db.runAsync(
    'DELETE FROM completions WHERE habit_id = ? AND completed_at = ?',
    [habitId, date]
  );
}

export async function insertStreakFreeze(db: DatabaseLike, freeze: StreakFreeze): Promise<void> {
  await db.runAsync(
    'INSERT INTO streak_freezes (id, habit_id, freeze_date, created_at) VALUES (?, ?, ?, ?)',
    [freeze.id, freeze.habitId, freeze.freezeDate, freeze.createdAt]
  );
}

export async function updateHabitPositions(
  db: DatabaseLike,
  positions: Array<{ id: string; position: number }>
): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const { id, position } of positions) {
      await db.runAsync('UPDATE habits SET position = ? WHERE id = ?', [position, id]);
    }
  });
}
