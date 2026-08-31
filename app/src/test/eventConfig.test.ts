import { describe, expect, it } from 'vitest';
import { getEventCheckInConfig } from '../lib/eventConfig';
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
    });
  });

  it('reads imported-registration lookup and email-required self-registration settings', () => {
    expect(getEventCheckInConfig(eventWithCheckIn({
      completion_mode: 'auto',
      require_completed_for_participation: true,
      imported_registration_lookup_enabled: true,
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
});
