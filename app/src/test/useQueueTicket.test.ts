/**
 * Tests for hooks/useQueueTicket.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../lib/queueService', () => ({
  nextTicketForQueue: vi.fn(),
  peekTicketForQueue: vi.fn(),
  getAuthoritativeQueueTicketForGuest: vi.fn(),
  isAdoptableQueueTicket: vi.fn((ticket) => {
    if (!ticket) return false;
    const stage = ticket.stage ?? 'waiting';
    return !['cancelled', 'left'].includes(stage) && ticket.status !== 'left';
  }),
  checkInTicket: vi.fn(),
  leaveQueue: vi.fn(),
}));

import {
  useQueueTicket,
  getStoredQueueTicket,
  getStoredQueueTicketNumber,
  clearQueueTicket,
  getActiveQueueIds,
} from '../hooks/useQueueTicket';
import {
  nextTicketForQueue,
  getAuthoritativeQueueTicketForGuest,
  checkInTicket,
  leaveQueue,
} from '../lib/queueService';

const mockNextTicket = vi.mocked(nextTicketForQueue);
const mockGetAuthoritativeTicket = vi.mocked(getAuthoritativeQueueTicketForGuest);
const mockCheckIn = vi.mocked(checkInTicket);
const mockLeave = vi.mocked(leaveQueue);

describe('useQueueTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockNextTicket.mockResolvedValue({ id: 10, ticketNumber: 10 });
    mockGetAuthoritativeTicket.mockResolvedValue(null);
    mockCheckIn.mockResolvedValue(undefined as never);
    mockLeave.mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('starts with null ticketId when no stored ticket', () => {
    const { result } = renderHook(() => useQueueTicket('q1'));
    expect(result.current.ticketId).toBeNull();
    expect(result.current.ticketNumber).toBeNull();
    expect(result.current.hasCheckedIn).toBe(false);
  });

  it('restores ticket from localStorage', () => {
    localStorage.setItem('qme:ticket:q1', '15');
    const { result } = renderHook(() => useQueueTicket('q1'));
    expect(result.current.ticketId).toBe(15);
  });

  it('restores checked-in state from localStorage', () => {
    localStorage.setItem('qme:ticket:q1', '15');
    localStorage.setItem('qme:checkedIn:q1:15', '1');
    const { result } = renderHook(() => useQueueTicket('q1'));
    expect(result.current.ticketId).toBe(15);
    expect(result.current.hasCheckedIn).toBe(true);
  });

  it('claimTicket creates a new ticket if none stored', async () => {
    mockNextTicket.mockResolvedValue({ id: 20, ticketNumber: 20 });
    const { result } = renderHook(() => useQueueTicket('q1', 'e1'));

    await act(async () => {
      await result.current.claimTicket();
    });

    expect(mockNextTicket).toHaveBeenCalledWith('q1', 'e1', undefined);
    expect(result.current.ticketId).toBe(20);
    expect(result.current.ticketNumber).toBe(20);
    expect(localStorage.getItem('qme:ticket:q1')).toBe('20');
    expect(localStorage.getItem('qme:ticketNum:q1')).toBe('20');
  });

  it('claimTicket restores existing ticket', async () => {
    localStorage.setItem('qme:ticket:q1', '15');
    mockGetAuthoritativeTicket.mockResolvedValue({
      id: 15,
      queue_id: 'q1',
      ticket_number: 15,
      stage: 'waiting',
      status: 'waiting',
      created_at: '',
      checked_in_at: null,
      left_reason: null,
      left_at: null,
    });
    const { result } = renderHook(() => useQueueTicket('q1', 'e1'));

    await act(async () => {
      await result.current.claimTicket();
    });

    expect(mockGetAuthoritativeTicket).toHaveBeenCalledWith('q1', 'e1', 15);
    expect(result.current.ticketId).toBe(15);
  });

  it('recoverExistingTicket adopts a server ticket without creating a new one', async () => {
    mockGetAuthoritativeTicket.mockResolvedValue({
      id: 133,
      queue_id: 'q1',
      ticket_number: 133,
      stage: 'released',
      status: 'waiting',
      created_at: '',
      checked_in_at: null,
      left_reason: null,
      left_at: null,
    });
    const { result } = renderHook(() => useQueueTicket('q1', 'e1'));

    await act(async () => {
      await result.current.recoverExistingTicket();
    });

    expect(mockGetAuthoritativeTicket).toHaveBeenCalledWith('q1', 'e1', undefined);
    expect(mockNextTicket).not.toHaveBeenCalled();
    expect(result.current.ticketId).toBe(133);
    expect(result.current.ticketNumber).toBe(133);
    expect(localStorage.getItem('qme:ticket:q1')).toBe('133');
  });

  it('does not claim until event scope is available', async () => {
    const { result } = renderHook(() => useQueueTicket('q1'));

    await act(async () => {
      await result.current.claimTicket();
    });

    expect(mockNextTicket).not.toHaveBeenCalled();
  });

  it('checkIn sets hasCheckedIn and calls API', async () => {
    localStorage.setItem('qme:ticket:q1', '15');
    const { result } = renderHook(() => useQueueTicket('q1', 'e1'));

    await act(async () => {
      await result.current.checkIn();
    });

    expect(result.current.hasCheckedIn).toBe(true);
    expect(mockCheckIn).toHaveBeenCalledWith(15, 'q1', 'e1');
    expect(localStorage.getItem('qme:checkedIn:q1:15')).toBe('1');
  });

  it('leave clears localStorage and calls API', async () => {
    localStorage.setItem('qme:ticket:q1', '15');
    const { result } = renderHook(() => useQueueTicket('q1', 'e1'));

    await act(async () => {
      await result.current.leave('user');
    });

    expect(mockLeave).toHaveBeenCalledWith(15, 'user', 'q1', 'e1');
    expect(result.current.ticketId).toBeNull();
    expect(result.current.ticketNumber).toBeNull();
    expect(localStorage.getItem('qme:ticket:q1')).toBeNull();
  });

  it('does nothing when queueId is undefined', () => {
    const { result } = renderHook(() => useQueueTicket(undefined));
    expect(result.current.ticketId).toBeNull();
  });
});

describe('getStoredQueueTicket', () => {
  beforeEach(() => { localStorage.clear(); });

  it('returns stored ticket string', () => {
    localStorage.setItem('qme:ticket:q1', '42');
    expect(getStoredQueueTicket('q1')).toBe('42');
  });

  it('returns empty string if none', () => {
    expect(getStoredQueueTicket('q999')).toBe('');
  });
});

describe('getStoredQueueTicketNumber', () => {
  beforeEach(() => { localStorage.clear(); });

  it('returns stored guest-facing ticket number instead of internal ticket id', () => {
    localStorage.setItem('qme:ticket:q1', '490');
    localStorage.setItem('qme:ticketNum:q1', '23');
    expect(getStoredQueueTicketNumber('q1')).toBe('23');
  });

  it('falls back to stored ticket id for legacy tickets without ticket number', () => {
    localStorage.setItem('qme:ticket:q1', '42');
    expect(getStoredQueueTicketNumber('q1')).toBe('42');
  });
});

describe('clearQueueTicket', () => {
  beforeEach(() => { localStorage.clear(); });

  it('removes ticket, ticketNum, and checkedIn keys', () => {
    localStorage.setItem('qme:ticket:q1', '5');
    localStorage.setItem('qme:ticketNum:q1', '5');
    localStorage.setItem('qme:checkedIn:q1:5', '1');
    clearQueueTicket('q1');
    expect(localStorage.getItem('qme:ticket:q1')).toBeNull();
    expect(localStorage.getItem('qme:ticketNum:q1')).toBeNull();
    expect(localStorage.getItem('qme:checkedIn:q1:5')).toBeNull();
  });
});

describe('getActiveQueueIds', () => {
  beforeEach(() => { localStorage.clear(); });

  it('returns queue ids with stored tickets', () => {
    localStorage.setItem('qme:ticket:q1', '5');
    localStorage.setItem('qme:ticket:q2', '10');
    localStorage.setItem('other:key', 'val');
    const ids = getActiveQueueIds();
    expect(ids).toContain('q1');
    expect(ids).toContain('q2');
    expect(ids).not.toContain('other:key');
  });

  it('returns empty array when none', () => {
    expect(getActiveQueueIds()).toEqual([]);
  });
});
