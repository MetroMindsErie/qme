/**
 * Tests for lib/supabaseService.ts
 * Mocks the supabase client to verify each service function calls the
 * correct Supabase methods with the correct arguments.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// We'll mock the supabase module so all calls go through our mock
const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockChannel = vi.fn();
const mockRemoveChannel = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

// Import AFTER mocking
import {
  nextTicket,
  peekTicket,
  restoreTicket,
  checkInTicket,
  leaveQueue,
  getMetric1,
  setMetric1,
  getLostCount,
  getAdminSnapshot,
  resetQueue,
  onSettingsChange,
  onTicketsChange,
} from '../lib/supabaseService';

describe('supabaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== Ticket RPCs ====================

  describe('nextTicket', () => {
    it('calls rpc("next_ticket") and returns the new ticket id', async () => {
      mockRpc.mockResolvedValueOnce({ data: { id: 42, ticket_number: 42 }, error: null });
      const result = await nextTicket();
      expect(mockRpc).toHaveBeenCalledWith('next_ticket');
      expect(result).toEqual({ id: 42, ticketNumber: 42 });
    });

    it('handles legacy numeric return', async () => {
      mockRpc.mockResolvedValueOnce({ data: 42, error: null });
      const result = await nextTicket();
      expect(result).toEqual({ id: 42, ticketNumber: 42 });
    });

    it('throws on error', async () => {
      const err = { message: 'db error' };
      mockRpc.mockResolvedValueOnce({ data: null, error: err });
      await expect(nextTicket()).rejects.toEqual(err);
    });
  });

  describe('peekTicket', () => {
    it('calls rpc("peek_ticket") and returns 0 when no tickets', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });
      const result = await peekTicket();
      expect(mockRpc).toHaveBeenCalledWith('peek_ticket');
      expect(result).toBe(0);
    });

    it('returns the max ticket id', async () => {
      mockRpc.mockResolvedValueOnce({ data: 99, error: null });
      const result = await peekTicket();
      expect(result).toBe(99);
    });
  });

  describe('restoreTicket', () => {
    it('calls rpc("restore_ticket") with the ticket id', async () => {
      mockRpc.mockResolvedValueOnce({ data: { id: 10, ticket_number: 10 }, error: null });
      const result = await restoreTicket(10);
      expect(mockRpc).toHaveBeenCalledWith('restore_ticket', { p_ticket_id: 10 });
      expect(result).toEqual({ id: 10, ticketNumber: 10 });
    });

    it('handles legacy numeric return', async () => {
      mockRpc.mockResolvedValueOnce({ data: 10, error: null });
      const result = await restoreTicket(10);
      expect(result).toEqual({ id: 10, ticketNumber: 10 });
    });
  });

  describe('checkInTicket', () => {
    it('calls rpc("check_in_ticket")', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });
      await checkInTicket(5);
      expect(mockRpc).toHaveBeenCalledWith('check_in_ticket', { p_ticket_id: 5 });
    });

    it('throws on error', async () => {
      const err = { message: 'not found' };
      mockRpc.mockResolvedValueOnce({ data: null, error: err });
      await expect(checkInTicket(99)).rejects.toEqual(err);
    });
  });

  describe('leaveQueue', () => {
    it('calls rpc("leave_queue") with default reason', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });
      await leaveQueue(7);
      expect(mockRpc).toHaveBeenCalledWith('leave_queue', {
        p_ticket_id: 7,
        p_reason: 'user',
      });
    });

    it('calls rpc("leave_queue") with custom reason', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });
      await leaveQueue(7, 'noCheckInTimeout');
      expect(mockRpc).toHaveBeenCalledWith('leave_queue', {
        p_ticket_id: 7,
        p_reason: 'noCheckInTimeout',
      });
    });
  });

  // ==================== Metric1 ====================

  describe('getMetric1', () => {
    it('returns metric1 value and timestamp from settings table', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: [
            { key: 'metric1', value: '5' },
            { key: 'metric1Ts', value: '1700000000000' },
          ],
          error: null,
        }),
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getMetric1();
      expect(mockFrom).toHaveBeenCalledWith('settings');
      expect(result).toEqual({ value: 5, ts: 1700000000000 });
    });

    it('returns defaults when no settings exist', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getMetric1();
      expect(result.value).toBe(1);
      expect(result.ts).toBeGreaterThan(0);
    });
  });

  describe('setMetric1', () => {
    it('upserts metric1 and metric1Ts into settings table', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const result = await setMetric1(10);
      expect(mockFrom).toHaveBeenCalledWith('settings');
      expect(result.value).toBe(10);
      expect(result.ts).toBeGreaterThan(0);
      // Called twice: once for metric1, once for metric1Ts
      expect(mockUpsert).toHaveBeenCalledTimes(2);
    });

    it('throws if first upsert fails', async () => {
      const err = { message: 'upsert error' };
      const mockUpsert = vi.fn().mockResolvedValue({ error: err });
      mockFrom.mockReturnValue({ upsert: mockUpsert });
      await expect(setMetric1(5)).rejects.toEqual(err);
    });
  });

  // ==================== Stats ====================

  describe('getLostCount', () => {
    it('returns count of tickets with status "left"', async () => {
      const mockEq = vi.fn().mockResolvedValue({ count: 3, error: null });
      const mockHead = vi.fn().mockReturnValue({ eq: mockEq });
      const mockSelect = vi.fn().mockReturnValue(mockHead);
      // Need to chain: from('tickets').select('*', opts).eq('status', 'left')
      // Actually the chain is: from().select().eq()
      // Let me match the actual implementation
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      const result = await getLostCount();
      expect(mockFrom).toHaveBeenCalledWith('tickets');
      expect(result).toBe(3);
    });

    it('returns 0 when count is null', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: null, error: null }),
        }),
      });

      const result = await getLostCount();
      expect(result).toBe(0);
    });
  });

  // ==================== Admin ====================

  describe('getAdminSnapshot', () => {
    it('calls rpc("admin_snapshot") and returns data', async () => {
      const snapshot = {
        metric1: 5,
        counts: { total: 10, waiting: 3, checked_in: 2, left: 4, served: 1 },
        lastIssued: 10,
      };
      mockRpc.mockResolvedValueOnce({ data: snapshot, error: null });
      const result = await getAdminSnapshot();
      expect(mockRpc).toHaveBeenCalledWith('admin_snapshot');
      expect(result).toEqual(snapshot);
    });
  });

  // ==================== Reset ====================

  describe('resetQueue', () => {
    it('calls rpc("reset_queue")', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });
      await resetQueue();
      expect(mockRpc).toHaveBeenCalledWith('reset_queue');
    });
  });

  // ==================== Realtime ====================

  describe('onSettingsChange', () => {
    it('subscribes to settings changes and returns unsubscribe function', () => {
      const mockSubscribe = vi.fn().mockReturnValue({});
      const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe });
      mockChannel.mockReturnValue({ on: mockOn });

      const callback = vi.fn();
      const unsub = onSettingsChange(callback);

      expect(mockChannel).toHaveBeenCalledWith('settings-changes');
      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        expect.any(Function)
      );
      expect(mockSubscribe).toHaveBeenCalled();
      expect(typeof unsub).toBe('function');
    });

    it('calls callback when a change is received', () => {
      const mockSubscribe = vi.fn().mockReturnValue({});
      let capturedHandler: (payload: unknown) => void;
      const mockOn = vi.fn().mockImplementation((_event, _filter, handler) => {
        capturedHandler = handler;
        return { subscribe: mockSubscribe };
      });
      mockChannel.mockReturnValue({ on: mockOn });

      const callback = vi.fn();
      onSettingsChange(callback);

      // Simulate a change event
      capturedHandler!({ new: { key: 'metric1', value: '42' } });
      expect(callback).toHaveBeenCalledWith({ key: 'metric1', value: '42' });
    });
  });

  describe('onTicketsChange', () => {
    it('subscribes to tickets changes', () => {
      const mockSubscribe = vi.fn().mockReturnValue({});
      const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe });
      mockChannel.mockReturnValue({ on: mockOn });

      const callback = vi.fn();
      const unsub = onTicketsChange(callback);

      expect(mockChannel).toHaveBeenCalledWith('tickets-changes');
      expect(typeof unsub).toBe('function');
    });
  });
});
