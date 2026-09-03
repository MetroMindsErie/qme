import { describe, expect, it } from 'vitest';
import { getCheckInRegistrationSource } from '../pages/admin/AdminEventCheckIns';
import { getCheckInPartySize } from '../lib/checkInPartySize';
import type { EventCheckIn } from '../types';

function checkIn(metadata: Record<string, unknown>): EventCheckIn {
  return {
    id: 'check-in-1',
    event_id: 'event-1',
    first_name: 'Test',
    last_name: 'Guest',
    code: null,
    ticket_type: 'general',
    status: 'completed',
    metadata,
    created_at: '',
    updated_at: '',
  };
}

describe('getCheckInRegistrationSource', () => {
  it('reports imported check-ins from durable imported-registration metadata', () => {
    expect(getCheckInRegistrationSource(checkIn({
      imported_registration_id: 'registration-1',
      registration_match_status: 'matched',
    }))).toBe('imported');
  });

  it('reports direct qME walk-up self-registrations when no imported linkage exists', () => {
    expect(getCheckInRegistrationSource(checkIn({
      source: 'guest_self_check_in',
      registration_match_status: 'manual',
    }))).toBe('self_registered');
  });

  it('preserves needs-help provenance for unresolved not-found fallback rows', () => {
    expect(getCheckInRegistrationSource(checkIn({
      source: 'guest_registration_not_found',
      needs_help: true,
      registration_match_status: 'needs_help',
    }))).toBe('needs_help');
  });
});

describe('getCheckInPartySize', () => {
  it('uses actual attending party size for Guests Represented while preserving registered Tickets metadata', () => {
    expect(getCheckInPartySize(checkIn({
      imported_registration_id: 'registration-1',
      external_order_id: '123456789',
      registered_party_size: 4,
      actual_party_size: 3,
      party_size: 3,
      tickets: 4,
      additional_attendees: [
        { external_order_id: '123456789-1', first_name: 'Ava', last_name: 'One' },
        { external_order_id: '123456789-3', first_name: 'Zed', last_name: 'Three' },
      ],
    }))).toBe(3);
  });
});
