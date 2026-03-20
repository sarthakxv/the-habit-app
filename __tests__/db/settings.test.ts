import {
  hasSeenOnboarding,
  markOnboardingSeen,
} from '../../src/db/settings';
import { createMockDatabase } from '../helpers/mockDatabase';

describe('settings', () => {
  describe('hasSeenOnboarding', () => {
    it('returns false when no row exists in settings', async () => {
      const db = createMockDatabase();
      db.getFirstAsync.mockResolvedValue(null);

      const result = await hasSeenOnboarding(db);

      expect(result).toBe(false);
      expect(db.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('has_seen_onboarding'),
        []
      );
    });

    it('returns true when row exists with value 1', async () => {
      const db = createMockDatabase();
      db.getFirstAsync.mockResolvedValue({ value: '1' });

      const result = await hasSeenOnboarding(db);

      expect(result).toBe(true);
    });

    it('returns false when row exists with value 0', async () => {
      const db = createMockDatabase();
      db.getFirstAsync.mockResolvedValue({ value: '0' });

      const result = await hasSeenOnboarding(db);

      expect(result).toBe(false);
    });
  });

  describe('markOnboardingSeen', () => {
    it('inserts or replaces has_seen_onboarding with value 1', async () => {
      const db = createMockDatabase();

      await markOnboardingSeen(db);

      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('has_seen_onboarding'),
        expect.arrayContaining(['1'])
      );
    });
  });
});
