/**
 * Tests for hooks/useQueueTicket.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../lib/queueService', () => ({
  nextTicketForQueue: vi.fn(),
  peekTicketForQueue: vi.fn(),
  restoreTicketForQueue: vi.fn(),
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
  restoreTicketForQueue,
  checkInTicket,
  leaveQueue,
} from '../lib/queueService';

const mockNextTicket = vi.mocked(nextTicketForQueue);
const mockRestore = vi.mocked(restoreTicketForQueue);
const mockCheckIn = vi.mocked(checkInTicket);
const mockLeave = vi.mocked(leaveQueue);

describe('useQueueTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockNextTicket.mockResolvedValue({ id: 10, ticketNumber: 10 });
    mockRestore.mockResolvedValue({ id: 10, ticketNumber: 10 });
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
    const { result } = renderHook(() => useQueueTicket('q1'));

    await act(async () => {
      await result.current.claimTicket();
    });

    expect(mockNextTicket).toHaveBeenCalledWith('q1');
    expect(result.current.ticketId).toBe(20);
    expect(result.current.ticketNumber).toBe(20);
    expect(localStorage.getItem('qme:ticket:q1')).toBe('20');
    expect(localStorage.getItem('qme:ticketNum:q1')).toBe('20');
  });

  it('claimTicket restores existing ticket', async () => {
    localStorage.setItem('qme:ticket:q1', '15');
    mockRestore.mockResolvedValue({ id: 15, ticketNumber: 15 });
    const { result } = renderHook(() => useQueueTicket('q1'));

    await act(async () => {
      await result.current.claimTicket();
    });

    expect(mockRestore).toHaveBeenCalledWith(15, 'q1');
    expect(result.current.ticketId).toBe(15);
  });

  it('checkIn sets hasCheckedIn and calls API', async () => {
    localStorage.setItem('qme:ticket:q1', '15');
    const { result } = renderHook(() => useQueueTicket('q1'));

    await act(async () => {
      await result.current.checkIn();
    });

    expect(result.current.hasCheckedIn).toBe(true);
    expect(mockCheckIn).toHaveBeenCalledWith(15);
    expect(localStorage.getItem('qme:checkedIn:q1:15')).toBe('1');
  });

  it('leave clears localStorage and calls API', async () => {
    localStorage.setItem('qme:ticket:q1', '15');
    const { result } = renderHook(() => useQueueTicket('q1'));

    await act(async () => {
      await result.current.leave('user');
    });

    expect(mockLeave).toHaveBeenCalledWith(15, 'user');
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
