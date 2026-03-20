import type { Habit } from '@/src/types';
import type { ExportDeps } from '@/src/utils/exportData';

// Mock expo-file-system and expo-sharing before import
jest.mock('expo-file-system', () => ({
  Paths: { cache: '/mock/cache' },
  File: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

import { exportHabitData } from '@/src/utils/exportData';

function makeMockDeps(overrides?: Partial<ExportDeps>): ExportDeps & {
  mockCreate: jest.Mock;
  mockWrite: jest.Mock;
  mockIsAvailable: jest.Mock;
  mockShare: jest.Mock;
  callOrder: string[];
} {
  const callOrder: string[] = [];
  const mockCreate = jest.fn().mockImplementation(() => {
    callOrder.push('create');
    return Promise.resolve();
  });
  const mockWrite = jest.fn().mockImplementation(() => {
    callOrder.push('write');
    return Promise.resolve();
  });
  const mockIsAvailable = jest.fn().mockImplementation(() => {
    callOrder.push('isAvailable');
    return Promise.resolve(true);
  });
  const mockShare = jest.fn().mockImplementation(() => {
    callOrder.push('share');
    return Promise.resolve();
  });

  return {
    createFile: overrides?.createFile ?? jest.fn().mockReturnValue({
      create: mockCreate,
      write: mockWrite,
      uri: 'file:///mock/cache/habit-tracker-export.json',
    }),
    isAvailable: overrides?.isAvailable ?? mockIsAvailable,
    share: overrides?.share ?? mockShare,
    mockCreate,
    mockWrite,
    mockIsAvailable,
    mockShare,
    callOrder,
  };
}

const sampleHabit: Habit = {
  id: 'h1',
  name: 'Read',
  color: '#FFB3BA',
  icon: '📖',
  frequency: { type: 'daily' },
  reminderTime: null,
  notificationId: null,
  position: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  archived: false,
};

describe('exportHabitData', () => {
  it('awaits file.create() before file.write() before share()', async () => {
    const deps = makeMockDeps();
    const completions = { h1: new Set(['2026-03-01']) };
    const freezes = {};

    await exportHabitData([sampleHabit], completions, freezes, deps);

    expect(deps.callOrder).toEqual(['create', 'write', 'isAvailable', 'share']);
  });

  it('writes correct JSON data to file', async () => {
    const deps = makeMockDeps();
    const completions = { h1: new Set(['2026-03-01', '2026-03-02']) };
    const freezes = { h1: new Set(['2026-03-03']) };

    await exportHabitData([sampleHabit], completions, freezes, deps);

    expect(deps.mockWrite).toHaveBeenCalledTimes(1);
    const written = JSON.parse(deps.mockWrite.mock.calls[0][0]);
    expect(written.habits).toEqual([sampleHabit]);
    expect(written.completions.h1).toEqual(expect.arrayContaining(['2026-03-01', '2026-03-02']));
    expect(written.freezes.h1).toEqual(['2026-03-03']);
    expect(written.exportedAt).toBeDefined();
  });

  it('skips sharing when not available', async () => {
    const deps = makeMockDeps({
      isAvailable: jest.fn().mockResolvedValue(false),
    });

    await exportHabitData([sampleHabit], {}, {}, deps);

    expect(deps.mockShare).not.toHaveBeenCalled();
  });

  it('propagates file.create() errors', async () => {
    const error = new Error('disk full');
    const deps = makeMockDeps();
    deps.createFile = jest.fn().mockReturnValue({
      create: jest.fn().mockRejectedValue(error),
      write: jest.fn(),
      uri: 'file:///mock/cache/habit-tracker-export.json',
    });

    await expect(exportHabitData([sampleHabit], {}, {}, deps)).rejects.toThrow('disk full');
  });

  it('propagates file.write() errors', async () => {
    const error = new Error('write failed');
    const deps = makeMockDeps();
    deps.createFile = jest.fn().mockReturnValue({
      create: jest.fn().mockResolvedValue(undefined),
      write: jest.fn().mockRejectedValue(error),
      uri: 'file:///mock/cache/habit-tracker-export.json',
    });

    await expect(exportHabitData([sampleHabit], {}, {}, deps)).rejects.toThrow('write failed');
  });
});
