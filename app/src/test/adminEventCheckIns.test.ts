import { describe, expect, it } from 'vitest';
import {
  buildCheckInAttendanceExportRows,
  getCheckInAdditionalAttendees,
  getCheckInRegisteredPartySize,
  getCheckInRegistrationSource,
} from '../pages/admin/AdminEventCheckIns';
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
    const row = checkIn({
      imported_registration_id: 'registration-1',
      external_order_id: '123456789',
      registered_party_size: 4,
      actual_party_size: 3,
      party_size: 3,
      tickets: 4,
      additional_attendees: [
        { position: 1, external_order_id: '123456789-1', first_name: 'Ava', last_name: 'One' },
        { position: 3, external_order_id: '123456789-3', first_name: 'Zed', last_name: 'Three' },
      ],
    });

    expect(getCheckInPartySize(row)).toBe(3);
    expect(getCheckInRegisteredPartySize(row)).toBe(4);
  });
});

describe('getCheckInAdditionalAttendees', () => {
  it('projects persisted additional-attendee metadata with deterministic child order ids and removed gaps', () => {
    const row = checkIn({
      external_order_id: '123456789',
      registered_party_size: 4,
      actual_party_size: 3,
      additional_attendees: [
        { position: 3, first_name: 'Zed', last_name: 'Three' },
        { position: 1, external_order_id: '123456789-1', first_name: 'Ava', last_name: 'One' },
      ],
    });

    expect(getCheckInAdditionalAttendees(row)).toEqual([
      { position: 1, externalOrderId: '123456789-1', firstName: 'Ava', lastName: 'One' },
      { position: 3, externalOrderId: '123456789-3', firstName: 'Zed', lastName: 'Three' },
    ]);
  });
});

describe('buildCheckInAttendanceExportRows', () => {
  it('emits one export row per actual attendee without duplicating or renumbering removed positions', () => {
    const row = checkIn({
      imported_registration_id: 'registration-1',
      external_order_id: '123456789',
      registered_party_size: 4,
      actual_party_size: 3,
      party_size: 3,
      tickets: 4,
      additional_attendees: [
        { position: 1, external_order_id: '123456789-1', first_name: 'Ava', last_name: 'One' },
        { position: 3, external_order_id: '123456789-3', first_name: 'Zed', last_name: 'Three' },
      ],
    });

    const rows = buildCheckInAttendanceExportRows([row]);

    expect(rows).toHaveLength(3);
    expect(rows.map((exportRow) => exportRow.attendeeRole)).toEqual(['primary', 'additional', 'additional']);
    expect(rows.map((exportRow) => exportRow.attendeeExternalOrderId)).toEqual(['123456789', '123456789-1', '123456789-3']);
    expect(rows.map((exportRow) => exportRow.primaryOrderId)).toEqual(['123456789', '123456789', '123456789']);
    expect(rows.map((exportRow) => exportRow.firstName)).toEqual(['Test', 'Ava', 'Zed']);
    expect(rows.map((exportRow) => exportRow.actualPartySize)).toEqual([3, 3, 3]);
    expect(rows.map((exportRow) => exportRow.registeredPartySize)).toEqual([4, 4, 4]);
  });
});
