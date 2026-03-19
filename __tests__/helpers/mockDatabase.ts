/** Creates a mock expo-sqlite database for testing.
 * Each method is a jest.fn() that can be configured per test. */
export function createMockDatabase() {
  return {
    execAsync: jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue({ changes: 0, lastInsertRowId: 0 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    withTransactionAsync: jest.fn<Promise<void>, [() => Promise<void>]>().mockImplementation(
      async (fn: () => Promise<void>) => { await fn(); }
    ),
  };
}

export type MockDatabase = ReturnType<typeof createMockDatabase>;
