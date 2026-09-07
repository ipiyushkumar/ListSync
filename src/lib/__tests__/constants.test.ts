import { describe, it, expect } from 'vitest';
import { 
  normalizeStatus, 
  getStatusLabel, 
  getStatusDot, 
  getCategoryLabel, 
  getCategoryColor,
  STATUS_META,
  CATEGORY_META,
  ALL_STATUSES
} from '../constants';

describe('normalizeStatus', () => {
  it('converts on-hold to on_hold', () => {
    expect(normalizeStatus('on-hold')).toBe('on_hold');
  });

  it('passes through other statuses unchanged', () => {
    expect(normalizeStatus('watching')).toBe('watching');
    expect(normalizeStatus('completed')).toBe('completed');
    expect(normalizeStatus('on_hold')).toBe('on_hold');
  });
});

describe('getStatusLabel', () => {
  it('returns label for valid status', () => {
    expect(getStatusLabel('watching')).toBe('Watching');
    expect(getStatusLabel('on-hold')).toBe('On Hold');
    expect(getStatusLabel('on_hold')).toBe('On Hold');
  });

  it('returns raw status for unknown', () => {
    expect(getStatusLabel('unknown')).toBe('unknown');
  });
});

describe('getStatusDot', () => {
  it('returns correct dot class for status', () => {
    expect(getStatusDot('watching')).toBe('bg-emerald-400');
    expect(getStatusDot('completed')).toBe('bg-blue-400');
    expect(getStatusDot('on-hold')).toBe('bg-amber-400');
  });

  it('returns default dot for unknown status', () => {
    expect(getStatusDot('unknown')).toBe('bg-gray-400');
  });
});

describe('getCategoryLabel', () => {
  it('returns label for valid category', () => {
    expect(getCategoryLabel('anime')).toBe('Anime');
    expect(getCategoryLabel('tv')).toBe('TV Shows');
  });

  it('returns raw category for unknown', () => {
    expect(getCategoryLabel('unknown')).toBe('unknown');
  });
});

describe('getCategoryColor', () => {
  it('returns color for valid category', () => {
    expect(getCategoryColor('anime')).toBe('#a855f7');
    expect(getCategoryColor('movie')).toBe('#f59e0b');
  });

  it('returns default color for unknown category', () => {
    expect(getCategoryColor('unknown')).toBe('#6b7280');
  });
});

describe('STATUS_META', () => {
  it('has all required statuses', () => {
    const requiredStatuses = ['watching', 'reading', 'listening', 'completed', 'planned', 'dropped', 'on_hold'];
    requiredStatuses.forEach(status => {
      expect(STATUS_META).toHaveProperty(status);
      expect(STATUS_META[status as keyof typeof STATUS_META]).toHaveProperty('label');
      expect(STATUS_META[status as keyof typeof STATUS_META]).toHaveProperty('color');
      expect(STATUS_META[status as keyof typeof STATUS_META]).toHaveProperty('dot');
    });
  });
});

describe('CATEGORY_META', () => {
  it('has all required categories', () => {
    const requiredCategories = ['anime', 'manhwa', 'movie', 'tv', 'music'];
    requiredCategories.forEach(category => {
      expect(CATEGORY_META).toHaveProperty(category);
      expect(CATEGORY_META[category as keyof typeof CATEGORY_META]).toHaveProperty('label');
      expect(CATEGORY_META[category as keyof typeof CATEGORY_META]).toHaveProperty('color');
    });
  });
});

describe('ALL_STATUSES', () => {
  it('contains all status values', () => {
    expect(ALL_STATUSES).toContain('watching');
    expect(ALL_STATUSES).toContain('completed');
    expect(ALL_STATUSES).toContain('on_hold');
  });
});
