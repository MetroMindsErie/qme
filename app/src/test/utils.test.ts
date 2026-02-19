/**
 * Tests for lib/utils.ts – slugify, formatDate, formatTime
 */
import { describe, it, expect } from 'vitest';
import { slugify, formatDate, formatTime } from '../lib/utils';

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Food Truck Festival')).toBe('food-truck-festival');
  });

  it('strips leading/trailing hyphens', () => {
    expect(slugify(' Hello World ')).toBe('hello-world');
  });

  it('removes non-alphanumeric chars except hyphens', () => {
    expect(slugify("Bob's Burgers!")).toBe('bobs-burgers');
  });

  it('collapses consecutive hyphens', () => {
    expect(slugify('a - b -- c')).toBe('a-b-c');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });
});

describe('formatDate', () => {
  it('converts YYYY-MM-DD to MM/DD/YYYY', () => {
    expect(formatDate('2025-08-10')).toBe('08/10/2025');
  });

  it('returns empty string for falsy input', () => {
    expect(formatDate(undefined as unknown as string)).toBe('');
    expect(formatDate('')).toBe('');
  });
});

describe('formatTime', () => {
  it('converts 24h to 12h AM/PM', () => {
    expect(formatTime('13:30')).toBe('1:30 PM');
    expect(formatTime('00:05')).toBe('12:05 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
    expect(formatTime('09:15')).toBe('9:15 AM');
  });

  it('returns empty string for falsy input', () => {
    expect(formatTime(undefined as unknown as string)).toBe('');
    expect(formatTime('')).toBe('');
  });
});
