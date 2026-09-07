import { describe, it, expect } from 'vitest';
import { normalizeStatus } from '@/lib/constants';

describe('API Media Route', () => {
  describe('normalizeStatus integration', () => {
    it('normalizes on-hold to on_hold for DB queries', () => {
      expect(normalizeStatus('on-hold')).toBe('on_hold');
    });

    it('passes through standard statuses', () => {
      expect(normalizeStatus('watching')).toBe('watching');
      expect(normalizeStatus('completed')).toBe('completed');
      expect(normalizeStatus('planned')).toBe('planned');
    });
  });
});
