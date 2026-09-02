import { describe, expect, it } from 'vitest';
import { eventLocalDateTimeToDate, getEventTemporalStatus } from '../lib/eventTiming';
import type { QEvent } from '../types';

function event(overrides: Partial<QEvent> = {}): QEvent {
  return {
    id: 'event-1',
    organization_id: null,
    name: 'i-Pitch',
    slug: 'ipitch-092026',
    description: '',
    location: '',
    image_url: '',
    event_date: '2026-09-03',
    start_time: '17:00',
    end_time: '20:00',
    timezone: 'ET',
    status: 'active',
    metadata: {},
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('eventTiming', () => {
  it('converts event-local ET date/time deterministically', () => {
    expect(eventLocalDateTimeToDate('2026-09-03', '16:30', 'ET')?.toISOString()).toBe('2026-09-03T20:30:00.000Z');
  });

  it('derives guest-facing temporal event state from schedule rather than active status', () => {
    expect(getEventTemporalStatus(event(), new Date('2026-09-03T20:59:00.000Z'))).toMatchObject({
      state: 'upcoming',
      label: 'Upcoming',
    });
    expect(getEventTemporalStatus(event(), new Date('2026-09-03T21:00:00.000Z'))).toMatchObject({
      state: 'live',
      label: 'Live',
    });
    expect(getEventTemporalStatus(event(), new Date('2026-09-04T00:01:00.000Z'))).toMatchObject({
      state: 'ended',
      label: 'Ended',
    });
  });

  it('respects administrative unavailable states', () => {
    expect(getEventTemporalStatus(event({ status: 'draft' }))).toMatchObject({ state: 'unavailable' });
    expect(getEventTemporalStatus(event({ status: 'completed' }))).toMatchObject({ state: 'ended' });
  });
});
