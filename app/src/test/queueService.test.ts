/**
 * Tests for lib/queueService.ts
 * Mocks the Supabase client to verify CRUD + ticket operations.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import {
  createQueue,
  listQueuesForEvent,
  getQueue,
  getQueueBySlug,
  updateQueue,
  deleteQueue,
  getNowServing,
  setNowServing,
  nextTicketForQueue,
  peekTicketForQueue,
  restoreTicketForQueue,
  checkInTicket,
  leaveQueue,
  getAdminSnapshotForQueue,
  getLostCountForQueue,
  resetQueueTickets,
  applyQueuePilotFlow,
  markReleasedTicketNotHere,
  onQueuesChange,
  onQueueChange,
} from '../lib/queueService';

// chainMock helper for chained Supabase query builder
function chainMock(finalData: unknown, finalError: unknown = null) {
  const terminal = { data: finalData, error: finalError };
  const chain: Record<string, unknown> = {};
  const proxy = new Proxy(chain, {
    get(_t, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(terminal);
      }
      return () => proxy;
    },
  });
  return proxy;
}

describe('queueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ===== CRUD =====

  describe('createQueue', () => {
    it('inserts and returns the created queue', async () => {
      const q = { id: 'q1', name: 'Tacos', event_id: 'e1' };
      mockFrom.mockReturnValue(chainMock(q));

      const result = await createQueue({ name: 'Tacos', slug: 'tacos', event_id: 'e1' });
      expect(mockFrom).toHaveBeenCalledWith('queues');
      expect(result).toEqual(q);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock(null, { message: 'dup' }));
      await expect(
        createQueue({ name: 'X', slug: 'x', event_id: 'e1' })
      ).rejects.toEqual({ message: 'dup' });
    });
  });

  describe('listQueuesForEvent', () => {
    it('fetches queues for a given event_id', async () => {
      const queues = [{ id: 'q1' }, { id: 'q2' }];
      mockFrom.mockReturnValue(chainMock(queues));

      const result = await listQueuesForEvent('e1');
      expect(mockFrom).toHaveBeenCalledWith('queues');
      expect(result).toEqual(queues);
    });
  });

  describe('getQueue', () => {
    it('fetches a single queue by id', async () => {
      const q = { id: 'q1', name: 'Burgers' };
      mockFrom.mockReturnValue(chainMock(q));

      const result = await getQueue('q1');
      expect(result).toEqual(q);
    });
  });

  describe('getQueueBySlug', () => {
    it('fetches a queue by event_id + slug', async () => {
      const q = { id: 'q1', slug: 'burgers' };
      mockFrom.mockReturnValue(chainMock(q));

      const result = await getQueueBySlug('e1', 'burgers');
      expect(result).toEqual(q);
    });
  });

  describe('updateQueue', () => {
    it('updates a queue by id', async () => {
      const q = { id: 'q1', name: 'Updated' };
      mockFrom.mockReturnValue(chainMock(q));

      const result = await updateQueue('q1', { name: 'Updated' });
      expect(result).toEqual(q);
    });
  });

  describe('deleteQueue', () => {
    it('deletes a queue by id', async () => {
      mockFrom.mockReturnValue(chainMock(null));
      await deleteQueue('q1');
      expect(mockFrom).toHaveBeenCalledWith('queues');
    });
  });

  // ===== Now-serving =====

  describe('getNowServing', () => {
    it('reads now_serving from the queue row', async () => {
      mockFrom.mockReturnValue(chainMock({ now_serving: 5 }));
      const result = await getNowServing('q1');
      expect(result).toBe(5);
    });
  });

  describe('setNowServing', () => {
    it('updates now_serving on the queue row', async () => {
      mockFrom.mockReturnValue(chainMock({ now_serving: 10 }));
      const result = await setNowServing('q1', 10);
      expect(result).toBe(10);
    });
  });

  // ===== Queue-scoped RPCs =====

  describe('nextTicketForQueue', () => {
    it('requires event scope for guest ticket claims', async () => {
      await expect(nextTicketForQueue('q1')).rejects.toThrow('Guest queue action requires queue and event scope.');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('calls rpc("next_ticket_for_queue") with queue id and guest token', async () => {
      mockRpc
        .mockResolvedValueOnce({ data: { id: 7, ticket_number: 7 }, error: null })
        .mockResolvedValueOnce({ data: null, error: null });
      const result = await nextTicketForQueue('q1', 'e1');
      expect(mockRpc).toHaveBeenNthCalledWith(1, 'next_ticket_for_queue', {
        p_queue_id: 'q1',
        p_guest_token: expect.any(String),
      });
      expect(mockRpc).toHaveBeenNthCalledWith(2, 'apply_queue_pilot_flow', { p_queue_id: 'q1' });
      expect(result).toEqual({ id: 7, ticketNumber: 7 });
    });

    it('handles legacy numeric return', async () => {
      mockRpc
        .mockResolvedValueOnce({ data: 7, error: null })
        .mockResolvedValueOnce({ data: null, error: null });
      const result = await nextTicketForQueue('q1', 'e1');
      expect(result).toEqual({ id: 7, ticketNumber: 7 });
    });

    it('throws on error', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'err' } });
      await expect(nextTicketForQueue('q1', 'e1')).rejects.toEqual({ message: 'err' });
    });

    it('fails closed when guest-session overload is missing', async () => {
      mockRpc
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST202', message: 'missing function' } });
      await expect(nextTicketForQueue('q1', 'e1')).rejects.toEqual({ code: 'PGRST202', message: 'missing function' });
      expect(mockRpc).toHaveBeenNthCalledWith(1, 'next_ticket_for_queue', {
        p_queue_id: 'q1',
        p_guest_token: expect.any(String),
      });
      expect(mockRpc).toHaveBeenCalledTimes(1);
    });
  });

  describe('applyQueuePilotFlow', () => {
    it('calls the database auto-flow RPC', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });
      await applyQueuePilotFlow('q1');
      expect(mockRpc).toHaveBeenCalledWith('apply_queue_pilot_flow', { p_queue_id: 'q1' });
    });
  });

  describe('peekTicketForQueue', () => {
    it('returns 0 when no tickets exist', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });
      const result = await peekTicketForQueue('q1');
      expect(result).toBe(0);
    });

    it('returns max ticket id', async () => {
      mockRpc.mockResolvedValueOnce({ data: 42, error: null });
      const result = await peekTicketForQueue('q1');
      expect(result).toBe(42);
    });
  });

  describe('restoreTicketForQueue', () => {
    it('requires event scope for guest ticket restore', async () => {
      await expect(restoreTicketForQueue(5, 'q1')).rejects.toThrow('Guest queue action requires queue and event scope.');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('calls rpc("restore_ticket_for_queue") with ticket id, queue id, and guest token', async () => {
      mockRpc.mockResolvedValueOnce({ data: { id: 5, ticket_number: 5 }, error: null });
      const result = await restoreTicketForQueue(5, 'q1', 'e1');
      expect(mockRpc).toHaveBeenCalledWith('restore_ticket_for_queue', {
        p_ticket_id: 5,
        p_queue_id: 'q1',
        p_guest_token: expect.any(String),
      });
      expect(result).toEqual({ id: 5, ticketNumber: 5 });
    });

    it('handles legacy numeric return', async () => {
      mockRpc.mockResolvedValueOnce({ data: 5, error: null });
      const result = await restoreTicketForQueue(5, 'q1', 'e1');
      expect(result).toEqual({ id: 5, ticketNumber: 5 });
    });
  });

  describe('checkInTicket', () => {
    it('requires event scope for guest ticket check-in', async () => {
      await expect(checkInTicket(10)).rejects.toThrow('Guest queue action requires queue and event scope.');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('calls rpc("check_in_ticket") with the ticket id and guest token', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });
      await checkInTicket(10, 'q1', 'e1');
      expect(mockRpc).toHaveBeenCalledWith('check_in_ticket', {
        p_ticket_id: 10,
        p_guest_token: expect.any(String),
      });
    });
  });

  describe('leaveQueue', () => {
    it('requires event scope for guest queue leave', async () => {
      await expect(leaveQueue(10, 'user')).rejects.toThrow('Guest queue action requires queue and event scope.');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('calls rpc("leave_queue") with ticket id, reason, and guest token', async () => {
      mockRpc
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null });
      await leaveQueue(10, 'user', 'q1', 'e1');
      expect(mockRpc).toHaveBeenNthCalledWith(1, 'leave_queue', {
        p_ticket_id: 10,
        p_reason: 'user',
        p_guest_token: expect.any(String),
      });
      expect(mockRpc).toHaveBeenNthCalledWith(2, 'apply_queue_pilot_flow', { p_queue_id: 'q1' });
    });
  });

  describe('markReleasedTicketNotHere', () => {
    it('uses the admin RPC boundary', async () => {
      mockRpc.mockResolvedValueOnce({
        data: { id: 10, queue_id: 'q1', stage: 'waiting', gathering_snoozed_at: 'now' },
        error: null,
      });

      const result = await markReleasedTicketNotHere(10);

      expect(mockRpc).toHaveBeenCalledWith('admin_mark_queue_ticket_not_here', { p_ticket_id: 10 });
      expect(mockFrom).not.toHaveBeenCalledWith('tickets');
      expect(mockRpc).not.toHaveBeenCalledWith('apply_queue_pilot_flow', expect.anything());
      expect(result.stage).toBe('waiting');
    });
  });

  describe('getAdminSnapshotForQueue', () => {
    it('calls rpc and returns the snapshot', async () => {
      const snap = { total: 10, waiting: 5, checked_in: 3, served: 2 };
      mockRpc.mockResolvedValueOnce({ data: snap, error: null });
      const result = await getAdminSnapshotForQueue('q1');
      expect(mockRpc).toHaveBeenCalledWith('admin_snapshot_for_queue', { p_queue_id: 'q1' });
      expect(result).toEqual(snap);
    });
  });

  describe('getLostCountForQueue', () => {
    it('calls rpc and returns the count', async () => {
      mockRpc.mockResolvedValueOnce({ data: 3, error: null });
      const result = await getLostCountForQueue('q1');
      expect(result).toBe(3);
    });
  });

  describe('resetQueueTickets', () => {
    it('calls rpc("reset_queue_for_queue") and resets now_serving', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });
      mockFrom.mockReturnValue(chainMock(null));
      await resetQueueTickets('q1');
      expect(mockRpc).toHaveBeenCalledWith('reset_queue_for_queue', { p_queue_id: 'q1' });
    });
  });

  // ===== Realtime =====

  describe('onQueuesChange', () => {
    it('subscribes to changes filtered by event id', () => {
      const channel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      mockChannel.mockReturnValue(channel);

      const unsub = onQueuesChange('e1', vi.fn());
      expect(mockChannel).toHaveBeenCalled();
      expect(typeof unsub).toBe('function');
    });
  });

  describe('onQueueChange', () => {
    it('subscribes to changes for a specific queue', () => {
      const channel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      mockChannel.mockReturnValue(channel);

      const unsub = onQueueChange('q1', vi.fn());
      expect(mockChannel).toHaveBeenCalled();
      expect(typeof unsub).toBe('function');
    });

    it('removes channel on unsubscribe', () => {
      const channel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      mockChannel.mockReturnValue(channel);

      const unsub = onQueueChange('q1', vi.fn());
      unsub();
      expect(mockRemoveChannel).toHaveBeenCalledWith(channel);
    });
  });
});
