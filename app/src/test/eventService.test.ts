/**
 * Tests for lib/eventService.ts
 * Mocks the Supabase client to verify CRUD operations.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();
const mockChannel = vi.fn();
const mockRemoveChannel = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

import {
  createEvent,
  listEvents,
  getEvent,
  getEventBySlug,
  updateEvent,
  deleteEvent,
  onEventsChange,
} from '../lib/eventService';

// Helper to set up chained query builder
function chainMock(finalData: unknown, finalError: unknown = null) {
  const terminal = { data: finalData, error: finalError };
  const chain: Record<string, unknown> = {};
  const proxy = new Proxy(chain, {
    get(_t, prop) {
      if (prop === 'then') {
        // Make it thenable (Promise-like)
        return (resolve: (v: unknown) => void) => resolve(terminal);
      }
      return (..._args: unknown[]) => proxy;
    },
  });
  return proxy;
}

describe('eventService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEvent', () => {
    it('inserts a row into events and returns the created event', async () => {
      const ev = { id: 'uuid1', name: 'Test', slug: 'test' };
      mockFrom.mockReturnValue(chainMock(ev));

      const result = await createEvent({ name: 'Test', slug: 'test' });
      expect(mockFrom).toHaveBeenCalledWith('events');
      expect(result).toEqual(ev);
    });

    it('throws if Supabase returns an error', async () => {
      mockFrom.mockReturnValue(chainMock(null, { message: 'insert failed' }));
      await expect(createEvent({ name: 'X', slug: 'x' })).rejects.toEqual({ message: 'insert failed' });
    });
  });

  describe('listEvents', () => {
    it('fetches events ordered by event_date', async () => {
      const events = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
      ];
      mockFrom.mockReturnValue(chainMock(events));

      const result = await listEvents();
      expect(mockFrom).toHaveBeenCalledWith('events');
      expect(result).toEqual(events);
    });

    it('accepts an optional status filter', async () => {
      mockFrom.mockReturnValue(chainMock([]));
      await listEvents({ status: 'active' });
      expect(mockFrom).toHaveBeenCalledWith('events');
    });
  });

  describe('getEvent', () => {
    it('fetches a single event by id', async () => {
      const ev = { id: 'uuid1', name: 'Festival' };
      mockFrom.mockReturnValue(chainMock(ev));

      const result = await getEvent('uuid1');
      expect(mockFrom).toHaveBeenCalledWith('events');
      expect(result).toEqual(ev);
    });
  });

  describe('getEventBySlug', () => {
    it('fetches a single event by slug', async () => {
      const ev = { id: 'uuid1', name: 'Festival', slug: 'festival' };
      mockFrom.mockReturnValue(chainMock(ev));

      const result = await getEventBySlug('festival');
      expect(mockFrom).toHaveBeenCalledWith('events');
      expect(result).toEqual(ev);
    });
  });

  describe('updateEvent', () => {
    it('updates an event by id', async () => {
      const ev = { id: 'uuid1', name: 'Updated' };
      mockFrom.mockReturnValue(chainMock(ev));

      const result = await updateEvent('uuid1', { name: 'Updated' });
      expect(mockFrom).toHaveBeenCalledWith('events');
      expect(result).toEqual(ev);
    });
  });

  describe('deleteEvent', () => {
    it('deletes an event by id', async () => {
      mockFrom.mockReturnValue(chainMock(null));
      await deleteEvent('uuid1');
      expect(mockFrom).toHaveBeenCalledWith('events');
    });
  });

  describe('onEventsChange', () => {
    it('subscribes to realtime changes on the events table', () => {
      const channel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      mockChannel.mockReturnValue(channel);

      const cb = vi.fn();
      const unsub = onEventsChange(cb);
      expect(mockChannel).toHaveBeenCalledWith('events-changes');
      expect(channel.on).toHaveBeenCalled();
      expect(typeof unsub).toBe('function');
    });

    it('removes channel on unsubscribe', () => {
      const channel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      mockChannel.mockReturnValue(channel);

      const unsub = onEventsChange(vi.fn());
      unsub();
      expect(mockRemoveChannel).toHaveBeenCalledWith(channel);
    });
  });
});
