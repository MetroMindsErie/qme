import { describe, expect, it } from 'vitest';
import { getCompletedEventCheckInMessage, getEventCheckInAvailability, getEventCheckInCardDescription, getEventCheckInConfig } from '../lib/eventConfig';
import type { QEvent } from '../types';

function eventWithCheckIn(checkIn: Record<string, unknown>): QEvent {
  return {
    id: 'event-1',
    organization_id: null,
    name: 'Test Event',
    slug: 'test-event',
    description: '',
    location: '',
    image_url: '',
    event_date: null,
    start_time: null,
    end_time: null,
    timezone: 'ET',
    status: 'active',
    metadata: { check_in: checkIn },
    created_at: '',
    updated_at: '',
  };
}

describe('getEventCheckInConfig', () => {
  it('defaults to enabled staff check-in without registration lookup or fallback', () => {
    expect(getEventCheckInConfig(eventWithCheckIn({}))).toEqual({
      enabled: true,
      completionMode: 'staff',
      availability: expect.objectContaining({
        mode: 'manual_open',
        isOpen: true,
        label: 'Currently open',
      }),
      requireCompletedForParticipation: false,
      importedRegistrationLookupEnabled: false,
      selfRegistrationFallbackEnabled: false,
      selfRegistrationRequiredFields: [],
      postCheckInInstruction: '',
    });
  });

  it('reads imported-registration lookup and email-required self-registration settings', () => {
    expect(getEventCheckInConfig(eventWithCheckIn({
      completion_mode: 'auto',
      require_completed_for_participation: true,
      imported_registration_lookup_enabled: true,
      post_check_in_instruction: 'Please go to the check-in desk to receive your event package.',
      self_registration: {
        enabled: true,
        required_fields: ['first_name', 'last_name', 'email', 'company'],
      },
    }))).toEqual({
      enabled: true,
      completionMode: 'auto',
      availability: expect.objectContaining({
        mode: 'manual_open',
        isOpen: true,
      }),
      requireCompletedForParticipation: true,
      importedRegistrationLookupEnabled: true,
      selfRegistrationFallbackEnabled: true,
      selfRegistrationRequiredFields: ['first_name', 'last_name', 'email'],
      postCheckInInstruction: 'Please go to the check-in desk to receive your event package.',
    });
  });

  it('disables registration options when check-in is disabled', () => {
    expect(getEventCheckInConfig(eventWithCheckIn({
      completion_mode: 'none',
      imported_registration_lookup_enabled: true,
      self_registration: {
        enabled: true,
        required_fields: ['first_name', 'last_name', 'email'],
      },
    }))).toMatchObject({
      enabled: false,
      availability: expect.objectContaining({ isOpen: true }),
      importedRegistrationLookupEnabled: false,
      selfRegistrationFallbackEnabled: false,
    });
  });

  it('describes auto imported self-registration check-in without implying staff confirmation', () => {
    const config = getEventCheckInConfig(eventWithCheckIn({
      completion_mode: 'auto',
      imported_registration_lookup_enabled: true,
      self_registration: {
        enabled: true,
        required_fields: ['first_name', 'last_name', 'email'],
      },
    }));

    expect(getEventCheckInCardDescription(config)).toBe("Find your registration and check in when you arrive. If you're not on the list, you can register here.");
  });

  it('uses configured checked-in instruction with a neutral fallback', () => {
    expect(getCompletedEventCheckInMessage(getEventCheckInConfig(eventWithCheckIn({
      post_check_in_instruction: 'Please go to the check-in desk to receive your event package.',
    })))).toBe('You are checked in. Please go to the check-in desk to receive your event package.');

    expect(getCompletedEventCheckInMessage(getEventCheckInConfig(eventWithCheckIn({})))).toBe('You are checked in. Return to the event page for next steps.');
  });

  it('supports closed, manual-open, and scheduled check-in availability in event timezone', () => {
    const scheduledEvent = eventWithCheckIn({
      availability_mode: 'scheduled',
      scheduled_open_time: '16:30',
      scheduled_close_time: '20:00',
    });
    scheduledEvent.event_date = '2026-09-03';
    scheduledEvent.timezone = 'ET';

    expect(getEventCheckInConfig(scheduledEvent).availability.mode).toBe('scheduled');
    expect(getEventCheckInConfig(scheduledEvent).availability.isOpen).toBe(false);

    const beforeOpen = new Date('2026-09-03T20:29:00.000Z');
    const duringWindow = new Date('2026-09-03T20:30:00.000Z');
    const afterClose = new Date('2026-09-04T00:01:00.000Z');

    expect(getEventCheckInAvailability(scheduledEvent, beforeOpen).isOpen).toBe(false);
    expect(getEventCheckInAvailability(scheduledEvent, duringWindow).isOpen).toBe(true);
    expect(getEventCheckInAvailability(scheduledEvent, afterClose).isOpen).toBe(false);

    expect(getEventCheckInAvailability(eventWithCheckIn({ availability_mode: 'closed' })).isOpen).toBe(false);
    expect(getEventCheckInAvailability(eventWithCheckIn({ availability_mode: 'manual_open' })).isOpen).toBe(true);
  });

  it('can read existing row-level check-in start and end fields when metadata times are absent', () => {
    const scheduledEvent = eventWithCheckIn({
      availability_mode: 'scheduled',
    }) as QEvent & { check_in_start: string; check_in_end: string };
    scheduledEvent.event_date = '2026-09-03';
    scheduledEvent.timezone = 'ET';
    scheduledEvent.check_in_start = '16:30';
    scheduledEvent.check_in_end = '20:00';

    expect(getEventCheckInAvailability(scheduledEvent, new Date('2026-09-03T20:30:00.000Z'))).toMatchObject({
      scheduledOpenTime: '16:30',
      scheduledCloseTime: '20:00',
      isOpen: true,
    });
  });

  it('uses latest manual open/close override deterministically', () => {
    expect(getEventCheckInAvailability(eventWithCheckIn({
      availability_mode: 'scheduled',
      scheduled_open_time: '16:30',
      scheduled_close_time: '20:00',
      manual_opened_at: '2026-09-02T12:00:00.000Z',
      manual_closed_at: '2026-09-02T12:05:00.000Z',
    })).isOpen).toBe(false);

    expect(getEventCheckInAvailability(eventWithCheckIn({
      availability_mode: 'closed',
      manual_opened_at: '2026-09-02T12:10:00.000Z',
      manual_closed_at: '2026-09-02T12:05:00.000Z',
    })).isOpen).toBe(false);

    expect(getEventCheckInAvailability(eventWithCheckIn({
      availability_mode: 'scheduled',
      manual_opened_at: '2026-09-02T12:10:00.000Z',
      manual_closed_at: '2026-09-02T12:05:00.000Z',
    })).isOpen).toBe(true);
  });
});
