import { describe, expect, it } from 'vitest';
import { getCompletedEventCheckInMessage, getEventCheckInCardDescription, getEventCheckInConfig } from '../lib/eventConfig';
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
});
