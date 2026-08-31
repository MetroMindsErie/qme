import { describe, expect, it } from 'vitest';
import { getCheckInRegistrationSource } from '../pages/admin/AdminEventCheckIns';
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
