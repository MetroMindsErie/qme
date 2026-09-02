import { describe, expect, it } from 'vitest';
import {
  buildGuestEventThemeStyle,
  getGuestEventTheme,
  hasGuestEventTheme,
  normalizeGuestThemeColor,
  normalizeGuestThemeImageUrl,
} from '../lib/eventTheme';
import type { QEvent } from '../types';

function eventWithMetadata(metadata: Record<string, unknown>): Pick<QEvent, 'metadata'> {
  return { metadata };
}

describe('eventTheme', () => {
  it('returns no theme for events without guest theme metadata', () => {
    const theme = getGuestEventTheme(eventWithMetadata({}));

    expect(theme).toEqual({});
    expect(hasGuestEventTheme(theme)).toBe(false);
    expect(buildGuestEventThemeStyle(theme)).toEqual({});
  });

  it('reads valid reusable guest event theme metadata', () => {
    const theme = getGuestEventTheme(eventWithMetadata({
      guest_theme: {
        primary_accent: '#4B2E83',
        secondary_accent: '#2563EB',
        highlight_accent: '#F59E0B',
        header_image_url: '/images/ipitch-banner.jpg',
      },
    }));

    expect(theme).toEqual({
      primaryAccent: '#4B2E83',
      secondaryAccent: '#2563EB',
      highlightAccent: '#F59E0B',
      headerImageUrl: '/images/ipitch-banner.jpg',
    });
    expect(hasGuestEventTheme(theme)).toBe(true);
    expect(buildGuestEventThemeStyle(theme)).toMatchObject({
      '--guest-event-primary': '#4B2E83',
      '--guest-event-secondary': '#2563EB',
      '--guest-event-highlight': '#F59E0B',
    });
  });

  it('drops invalid colors before applying theme styles', () => {
    expect(normalizeGuestThemeColor('blue')).toBe('');
    expect(normalizeGuestThemeColor('javascript:alert(1)')).toBe('');

    const theme = getGuestEventTheme(eventWithMetadata({
      guest_theme: {
        primary_accent: 'blue',
        secondary_accent: '#2563EB',
        highlight_accent: 'rgb(1, 2, 3)',
      },
    }));

    expect(theme).toEqual({ secondaryAccent: '#2563EB' });
    expect(buildGuestEventThemeStyle(theme)).toEqual({
      '--guest-event-secondary': '#2563EB',
    });
  });

  it('drops unsafe header image URL schemes before rendering', () => {
    expect(normalizeGuestThemeImageUrl('/images/ipitch-banner.jpg')).toBe('/images/ipitch-banner.jpg');
    expect(normalizeGuestThemeImageUrl('https://example.com/banner.jpg')).toBe('https://example.com/banner.jpg');
    expect(normalizeGuestThemeImageUrl('javascript:alert(1)')).toBe('');

    const theme = getGuestEventTheme(eventWithMetadata({
      guest_theme: {
        header_image_url: 'javascript:alert(1)',
      },
    }));

    expect(theme).toEqual({});
  });
});
