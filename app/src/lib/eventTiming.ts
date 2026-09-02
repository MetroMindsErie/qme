import type { QEvent } from '../types';

export type EventTemporalState = 'upcoming' | 'live' | 'ended' | 'unavailable';

export interface EventTemporalStatus {
  state: EventTemporalState;
  label: 'Upcoming' | 'Live' | 'Ended' | 'Unavailable';
}

const TIMEZONE_MAP: Record<string, string> = {
  ET: 'America/New_York',
  EST: 'America/New_York',
  EDT: 'America/New_York',
  CT: 'America/Chicago',
  CST: 'America/Chicago',
  CDT: 'America/Chicago',
  MT: 'America/Denver',
  MST: 'America/Denver',
  MDT: 'America/Denver',
  PT: 'America/Los_Angeles',
  PST: 'America/Los_Angeles',
  PDT: 'America/Los_Angeles',
  UTC: 'UTC',
};

function normalizeTimeZone(timezone: string | null | undefined): string {
  return TIMEZONE_MAP[(timezone || '').trim().toUpperCase()] || timezone || 'UTC';
}

function parseTimeParts(time: string | null | undefined): { hour: number; minute: number } | null {
  const match = (time || '').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return { hour, minute };
}

function getTimeZoneOffsetMs(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour === '24' ? '0' : lookup.hour),
    Number(lookup.minute),
    Number(lookup.second)
  );
  return asUtc - date.getTime();
}

export function eventLocalDateTimeToDate(
  eventDate: string | null | undefined,
  time: string | null | undefined,
  timezone: string | null | undefined
): Date | null {
  const dateMatch = (eventDate || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeParts = parseTimeParts(time);
  if (!dateMatch || !timeParts) return null;
  const zone = normalizeTimeZone(timezone);
  const utcGuess = new Date(Date.UTC(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    timeParts.hour,
    timeParts.minute,
    0
  ));
  const offset = getTimeZoneOffsetMs(utcGuess, zone);
  return new Date(utcGuess.getTime() - offset);
}

export function getEventTemporalStatus(
  event: Pick<QEvent, 'event_date' | 'start_time' | 'end_time' | 'timezone' | 'status'> | null | undefined,
  now = new Date()
): EventTemporalStatus {
  if (!event || event.status === 'draft' || event.status === 'cancelled') {
    return { state: 'unavailable', label: 'Unavailable' };
  }
  if (event.status === 'completed') {
    return { state: 'ended', label: 'Ended' };
  }

  const start = eventLocalDateTimeToDate(event.event_date, event.start_time, event.timezone);
  const end = eventLocalDateTimeToDate(event.event_date, event.end_time, event.timezone);
  if (start && now < start) return { state: 'upcoming', label: 'Upcoming' };
  if (start && end && now >= start && now <= end) return { state: 'live', label: 'Live' };
  if (end && now > end) return { state: 'ended', label: 'Ended' };
  if (start && now >= start) return { state: 'live', label: 'Live' };
  return { state: 'upcoming', label: 'Upcoming' };
}

export function formatEventLocalDateTime(
  event: Pick<QEvent, 'event_date' | 'timezone'>,
  time: string,
  options: { includeDate?: boolean } = {}
): string {
  const date = eventLocalDateTimeToDate(event.event_date, time, event.timezone);
  if (!date) return time;
  const timeZone = normalizeTimeZone(event.timezone);
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: options.includeDate ? 'short' : undefined,
    month: options.includeDate ? 'short' : undefined,
    day: options.includeDate ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}
