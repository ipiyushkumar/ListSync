import { describe, it, expect } from 'vitest';
import { parseGenres } from '../utils';

describe('parseGenres', () => {
  it('parses valid JSON array', () => {
    expect(parseGenres('["Action","Comedy"]')).toEqual(['Action', 'Comedy']);
  });

  it('returns empty array for empty string', () => {
    expect(parseGenres('')).toEqual([]);
  });

  it('returns empty array for invalid JSON', () => {
    expect(parseGenres('not json')).toEqual([]);
  });

  it('returns empty array for non-array JSON', () => {
    expect(parseGenres('{"key": "value"}')).toEqual([]);
  });

  it('handles genres with special characters', () => {
    expect(parseGenres('["Sci-Fi","Rom-com"]')).toEqual(['Sci-Fi', 'Rom-com']);
  });
});
