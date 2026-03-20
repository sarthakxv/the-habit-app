import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Habit } from '@/src/types';

export interface ExportDeps {
  createFile: (dir: string, name: string) => { create: () => Promise<void>; write: (data: string) => Promise<void>; uri: string };
  isAvailable: () => Promise<boolean>;
  share: (uri: string, options: { mimeType: string; dialogTitle: string }) => Promise<void>;
}

const defaultDeps: ExportDeps = {
  createFile: (dir, name) => new File(dir, name),
  isAvailable: Sharing.isAvailableAsync,
  share: Sharing.shareAsync,
};

export async function exportHabitData(
  habits: Habit[],
  completions: Record<string, Set<string>>,
  freezes: Record<string, Set<string>>,
  deps: ExportDeps = defaultDeps,
): Promise<void> {
  const data = {
    exportedAt: new Date().toISOString(),
    habits,
    completions: Object.fromEntries(
      Object.entries(completions).map(([id, dates]) => [id, Array.from(dates)])
    ),
    freezes: Object.fromEntries(
      Object.entries(freezes).map(([id, dates]) => [id, Array.from(dates)])
    ),
  };

  const json = JSON.stringify(data, null, 2);
  const file = deps.createFile(Paths.cache, 'habit-tracker-export.json');
  await file.create();
  await file.write(json);

  if (await deps.isAvailable()) {
    await deps.share(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Habit Data',
    });
  }
}
