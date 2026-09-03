import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockChannel = vi.fn();
const mockRemoveChannel = vi.fn();
const mockGetEvent = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

vi.mock('../lib/eventService', () => ({
  getEvent: (...args: unknown[]) => mockGetEvent(...args),
}));

import { createEventCheckIn, createImportedRegistrationCheckInForGuest, recoverEventCheckInForGuest, searchImportedRegistrationsForGuest } from '../lib/checkInService';

describe('checkInService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockReset();
    mockFrom.mockReset();
    mockChannel.mockReset();
    mockRemoveChannel.mockReset();
    mockGetEvent.mockReset();
    localStorage.clear();
    mockGetEvent.mockResolvedValue({
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
      metadata: {
        check_in: {
          availability_mode: 'manual_open',
        },
      },
      created_at: '',
      updated_at: '',
    });
  });

  describe('createEventCheckIn', () => {
    it('passes p_needs_help so PostgREST selects the current guest check-in RPC overload', async () => {
      const row = { id: 'check-in-1', event_id: 'event-1', first_name: 'Ada', last_name: 'Lovelace' };
      mockRpc.mockResolvedValueOnce({ data: row, error: null });

      const result = await createEventCheckIn({
        event_id: 'event-1',
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada@example.com',
        phone: null,
        needsHelp: false,
      });

      expect(result).toEqual(row);
      expect(mockRpc).toHaveBeenCalledWith('create_event_check_in_for_guest', {
        p_event_id: 'event-1',
        p_guest_token: expect.any(String),
        p_first_name: 'Ada',
        p_last_name: 'Lovelace',
        p_code: null,
        p_email: 'ada@example.com',
        p_phone: null,
        p_needs_help: false,
      });
    });

    it('falls back to the legacy guest check-in RPC shape only when the current overload is missing', async () => {
      const row = { id: 'check-in-legacy', event_id: 'event-1', first_name: 'Grace', last_name: 'Hopper' };
      mockRpc
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST202', message: 'Could not find the function' } })
        .mockResolvedValueOnce({ data: row, error: null });

      const result = await createEventCheckIn({
        event_id: 'event-1',
        first_name: 'Grace',
        last_name: 'Hopper',
      });

      expect(result).toEqual(row);
      expect(mockRpc).toHaveBeenNthCalledWith(2, 'create_event_check_in_for_guest', {
        p_event_id: 'event-1',
        p_guest_token: expect.any(String),
        p_first_name: 'Grace',
        p_last_name: 'Hopper',
        p_code: null,
        p_email: null,
        p_phone: null,
      });
    });

    it('blocks guest check-in creation while public availability is closed', async () => {
      mockGetEvent.mockResolvedValueOnce({
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
        metadata: {
          check_in: {
            availability_mode: 'closed',
          },
        },
        created_at: '',
        updated_at: '',
      });

      await expect(createEventCheckIn({
        event_id: 'event-1',
        first_name: 'Ada',
        last_name: 'Lovelace',
      })).rejects.toThrow('Check-In is not open yet.');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('allows the authorized admin-test bypass through the app service guard', async () => {
      const row = { id: 'check-in-1', event_id: 'event-1', first_name: 'Ada', last_name: 'Lovelace' };
      mockGetEvent.mockResolvedValueOnce({
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
        metadata: {
          check_in: {
            availability_mode: 'closed',
          },
        },
        created_at: '',
        updated_at: '',
      });
      mockRpc.mockResolvedValueOnce({ data: row, error: null });

      await createEventCheckIn({
        event_id: 'event-1',
        first_name: 'Ada',
        last_name: 'Lovelace',
        bypassAvailability: true,
      });

      expect(mockGetEvent).not.toHaveBeenCalled();
      expect(mockRpc).toHaveBeenCalled();
    });
  });

  describe('searchImportedRegistrationsForGuest', () => {
    it('blocks imported registration search while public availability is closed', async () => {
      mockGetEvent.mockResolvedValueOnce({
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
        metadata: {
          check_in: {
            availability_mode: 'closed',
          },
        },
        created_at: '',
        updated_at: '',
      });

      await expect(searchImportedRegistrationsForGuest('event-1', 'Ada')).rejects.toThrow('Check-In is not open yet.');
      expect(mockRpc).not.toHaveBeenCalled();
    });
  });

  describe('createImportedRegistrationCheckInForGuest', () => {
    it('passes named additional attendees to the Eventbrite check-in RPC without changing the primary imported registration id', async () => {
      const row = { id: 'check-in-1', event_id: 'event-1', status: 'completed' };
      mockRpc.mockResolvedValueOnce({ data: row, error: null });

      const result = await createImportedRegistrationCheckInForGuest({
        eventId: 'event-1',
        importedRegistrationId: 'registration-1',
        bypassAvailability: true,
        additionalAttendees: [
          { position: 1, first_name: 'Ava', last_name: 'One' },
          { position: 3, first_name: 'Zed', last_name: 'Three' },
        ],
      });

      expect(result).toEqual(row);
      expect(mockRpc).toHaveBeenCalledWith('create_event_check_in_from_imported_registration_for_guest', {
        p_event_id: 'event-1',
        p_guest_token: expect.any(String),
        p_imported_registration_id: 'registration-1',
        p_email_confirmation: null,
        p_phone: null,
        p_additional_attendees: [
          { position: 1, first_name: 'Ava', last_name: 'One' },
          { position: 3, first_name: 'Zed', last_name: 'Three' },
        ],
      });
    });
  });

  describe('recoverEventCheckInForGuest', () => {
    it('uses the stored check-in id when the current guest token can read it', async () => {
      const row = { id: 'check-in-1', event_id: 'event-1', status: 'completed' };
      mockRpc.mockResolvedValueOnce({ data: row, error: null });

      const result = await recoverEventCheckInForGuest('event-1', {
        id: 'check-in-1',
        importedRegistrationId: 'registration-1',
      });

      expect(result).toEqual(row);
      expect(mockRpc).toHaveBeenCalledTimes(1);
      expect(mockRpc).toHaveBeenCalledWith('get_event_check_in_for_guest', {
        p_check_in_id: 'check-in-1',
        p_guest_token: expect.any(String),
      });
    });

    it('reconnects a stored imported registration when the stored check-in id belongs to an older guest token', async () => {
      const row = { id: 'server-check-in-1', event_id: 'event-1', status: 'completed' };
      mockRpc
        .mockResolvedValueOnce({ data: null, error: { message: 'No rows found' } })
        .mockResolvedValueOnce({ data: row, error: null });

      const result = await recoverEventCheckInForGuest('event-1', {
        id: 'stale-check-in-1',
        importedRegistrationId: 'registration-1',
        phone: '2165550100',
      });

      expect(result).toEqual(row);
      expect(mockRpc).toHaveBeenNthCalledWith(1, 'get_event_check_in_for_guest', {
        p_check_in_id: 'stale-check-in-1',
        p_guest_token: expect.any(String),
      });
      expect(mockRpc).toHaveBeenNthCalledWith(2, 'reconnect_event_check_in_from_imported_registration_for_guest', {
        p_event_id: 'event-1',
        p_guest_token: expect.any(String),
        p_imported_registration_id: 'registration-1',
        p_email_confirmation: null,
        p_phone: '2165550100',
      });
      expect(mockGetEvent).not.toHaveBeenCalled();
    });
  });
});
