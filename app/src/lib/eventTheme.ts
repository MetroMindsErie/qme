import type { CSSProperties } from 'react';
import type { QEvent } from '../types';

export interface GuestEventThemeConfig {
  primaryAccent: string;
  secondaryAccent: string;
  highlightAccent: string;
  headerImageUrl: string;
}

export type GuestEventTheme = Partial<GuestEventThemeConfig>;

const HEX_COLOR_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeGuestThemeColor(value: unknown): string {
  const color = asString(value);
  return HEX_COLOR_RE.test(color) ? color : '';
}

export function normalizeGuestThemeImageUrl(value: unknown): string {
  const url = asString(value);
  if (!url) return '';
  if (url.startsWith('/')) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return '';
}

export function getGuestEventTheme(event: Pick<QEvent, 'metadata'> | null | undefined): GuestEventTheme {
  const metadata = asRecord(event?.metadata);
  const rawTheme = asRecord(metadata.guest_theme || metadata.guestTheme);
  const theme: GuestEventTheme = {};

  const primaryAccent = normalizeGuestThemeColor(rawTheme.primary_accent || rawTheme.primaryAccent);
  const secondaryAccent = normalizeGuestThemeColor(rawTheme.secondary_accent || rawTheme.secondaryAccent);
  const highlightAccent = normalizeGuestThemeColor(rawTheme.highlight_accent || rawTheme.highlightAccent || rawTheme.highlight);
  const headerImageUrl = normalizeGuestThemeImageUrl(rawTheme.header_image_url || rawTheme.headerImageUrl);

  if (primaryAccent) theme.primaryAccent = primaryAccent;
  if (secondaryAccent) theme.secondaryAccent = secondaryAccent;
  if (highlightAccent) theme.highlightAccent = highlightAccent;
  if (headerImageUrl) theme.headerImageUrl = headerImageUrl;

  return theme;
}

export function hasGuestEventTheme(theme: GuestEventTheme): boolean {
  return Boolean(
    theme.primaryAccent
    || theme.secondaryAccent
    || theme.highlightAccent
    || theme.headerImageUrl
  );
}

export function buildGuestEventThemeStyle(theme: GuestEventTheme): CSSProperties {
  const style: CSSProperties = {};
  const customStyle = style as CSSProperties & Record<string, string>;
  if (theme.primaryAccent) customStyle['--guest-event-primary'] = theme.primaryAccent;
  if (theme.secondaryAccent) customStyle['--guest-event-secondary'] = theme.secondaryAccent;
  if (theme.highlightAccent) customStyle['--guest-event-highlight'] = theme.highlightAccent;
  return style;
}
