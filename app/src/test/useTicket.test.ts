/**
 * Tests for hooks/useTicket.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock the service layer
vi.mock('../lib/supabaseService', () => ({
  nextTicket: vi.fn(),
  peekTicket: vi.fn(),
  restoreTicket: vi.fn(),
  checkInTicket: vi.fn(),
  leaveQueue: vi.fn(),
}));

import { useTicket, getStoredTicket, getStoredTicketNumber, clearTicketEverywhere } from '../hooks/useTicket';
import {
  nextTicket,
  restoreTicket,
  checkInTicket,
  leaveQueue,
} from '../lib/supabaseService';

const mockNextTicket = vi.mocked(nextTicket);
const mockRestoreTicket = vi.mocked(restoreTicket);
const mockCheckInTicket = vi.mocked(checkInTicket);
const mockLeaveQueue = vi.mocked(leaveQueue);

describe('useTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('getStoredTicket', () => {
    it('returns empty string when no ticket stored', () => {
      expect(getStoredTicket()).toBe('');
    });

    it('returns ticket from localStorage', () => {
      localStorage.setItem('guest:ticketId', '42');
      expect(getStoredTicket()).toBe('42');
    });

    it('returns ticket from sessionStorage when localStorage is empty', () => {
      sessionStorage.setItem('guest2:ticket', '99');
      expect(getStoredTicket()).toBe('99');
    });

    it('prefers localStorage over sessionStorage', () => {
      localStorage.setItem('guest:ticketId', '42');
      sessionStorage.setItem('guest2:ticket', '99');
      expect(getStoredTicket()).toBe('42');
    });
  });

  describe('clearTicketEverywhere', () => {
    it('clears all storage keys', () => {
      localStorage.setItem('guest:ticketId', '42');
      localStorage.setItem('guest:ticketNum', '42');
      sessionStorage.setItem('guest2:ticket', '99');
      sessionStorage.setItem('guest2:checkedIn', '1');
      localStorage.setItem('guest2:ticket', '50');

      clearTicketEverywhere();

      expect(localStorage.getItem('guest:ticketId')).toBeNull();
      expect(localStorage.getItem('guest:ticketNum')).toBeNull();
      expect(sessionStorage.getItem('guest2:ticket')).toBeNull();
      expect(sessionStorage.getItem('guest2:checkedIn')).toBeNull();
      expect(localStorage.getItem('guest2:ticket')).toBeNull();
    });
  });

  describe('useTicket hook', () => {
    it('initializes with null ticketId when no stored ticket', () => {
      const { result } = renderHook(() => useTicket());
      expect(result.current.ticketId).toBeNull();
      expect(result.current.ticketNumber).toBeNull();
      expect(result.current.hasCheckedIn).toBe(false);
    });

    it('restores ticketId from localStorage on mount', async () => {
      localStorage.setItem('guest:ticketId', '42');
      const { result } = renderHook(() => useTicket());

      await waitFor(() => {
        expect(result.current.ticketId).toBe(42);
      });
    });

    it('restores checked-in state from localStorage', async () => {
      localStorage.setItem('guest:ticketId', '42');
      localStorage.setItem('guest:checkedIn:42', '1');

      const { result } = renderHook(() => useTicket());

      await waitFor(() => {
        expect(result.current.ticketId).toBe(42);
        expect(result.current.hasCheckedIn).toBe(true);
      });
    });

    describe('claimTicket', () => {
      it('adopts existing ticket from localStorage', async () => {
        localStorage.setItem('guest:ticketId', '15');
        localStorage.setItem('guest:ticketNum', '15');
        mockRestoreTicket.mockResolvedValue({ id: 15, ticketNumber: 15 });

        const { result } = renderHook(() => useTicket());

        let claimed: number | null = null;
        await act(async () => {
          claimed = await result.current.claimTicket();
        });

        expect(claimed).toBe(15);
        expect(result.current.ticketId).toBe(15);
        expect(result.current.ticketNumber).toBe(15);
        expect(mockRestoreTicket).toHaveBeenCalledWith(15);
      });

      it('claims a fresh ticket from server when none stored', async () => {
        mockNextTicket.mockResolvedValue({ id: 100, ticketNumber: 100 });

        const { result } = renderHook(() => useTicket());

        let claimed: number | null = null;
        await act(async () => {
          claimed = await result.current.claimTicket();
        });

        expect(claimed).toBe(100);
        expect(result.current.ticketId).toBe(100);
        expect(result.current.ticketNumber).toBe(100);
        expect(mockNextTicket).toHaveBeenCalled();
        // Should persist to storage
        expect(localStorage.getItem('guest:ticketId')).toBe('100');
        expect(localStorage.getItem('guest:ticketNum')).toBe('100');
      });

      it('handles server error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockNextTicket.mockRejectedValue(new Error('server down'));

        const { result } = renderHook(() => useTicket());

        let claimed: number | null = null;
        await act(async () => {
          claimed = await result.current.claimTicket();
        });

        expect(claimed).toBeNull();
        consoleSpy.mockRestore();
      });
    });

    describe('checkIn', () => {
      it('marks ticket as checked in', async () => {
        localStorage.setItem('guest:ticketId', '20');
        mockCheckInTicket.mockResolvedValue();

        const { result } = renderHook(() => useTicket());
        await waitFor(() => expect(result.current.ticketId).toBe(20));

        await act(async () => {
          await result.current.checkIn();
        });

        expect(result.current.hasCheckedIn).toBe(true);
        expect(localStorage.getItem('guest:checkedIn:20')).toBe('1');
        expect(mockCheckInTicket).toHaveBeenCalledWith(20);
      });

      it('does nothing when already checked in', async () => {
        localStorage.setItem('guest:ticketId', '20');
        localStorage.setItem('guest:checkedIn:20', '1');

        const { result } = renderHook(() => useTicket());
        await waitFor(() => expect(result.current.hasCheckedIn).toBe(true));

        await act(async () => {
          await result.current.checkIn();
        });

        // Should not call API again
        expect(mockCheckInTicket).not.toHaveBeenCalled();
      });

      it('does nothing when no ticket', async () => {
        const { result } = renderHook(() => useTicket());

        await act(async () => {
          await result.current.checkIn();
        });

        expect(mockCheckInTicket).not.toHaveBeenCalled();
      });
    });

    describe('leave', () => {
      it('calls leaveQueue API and clears storage', async () => {
        localStorage.setItem('guest:ticketId', '30');
        mockLeaveQueue.mockResolvedValue();

        const { result } = renderHook(() => useTicket());
        await waitFor(() => expect(result.current.ticketId).toBe(30));

        await act(async () => {
          await result.current.leave();
        });

        expect(mockLeaveQueue).toHaveBeenCalledWith(30, 'user');
        expect(result.current.ticketId).toBeNull();
        expect(result.current.hasCheckedIn).toBe(false);
        expect(localStorage.getItem('guest:ticketId')).toBeNull();
      });

      it('uses custom reason', async () => {
        localStorage.setItem('guest:ticketId', '30');
        mockLeaveQueue.mockResolvedValue();

        const { result } = renderHook(() => useTicket());
        await waitFor(() => expect(result.current.ticketId).toBe(30));

        await act(async () => {
          await result.current.leave('noCheckInTimeout');
        });

        expect(mockLeaveQueue).toHaveBeenCalledWith(30, 'noCheckInTimeout');
      });

      it('clears checked-in state', async () => {
        localStorage.setItem('guest:ticketId', '30');
        localStorage.setItem('guest:checkedIn:30', '1');
        mockLeaveQueue.mockResolvedValue();

        const { result } = renderHook(() => useTicket());
        await waitFor(() => expect(result.current.hasCheckedIn).toBe(true));

        await act(async () => {
          await result.current.leave();
        });

        expect(localStorage.getItem('guest:checkedIn:30')).toBeNull();
      });

      it('handles API failure gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        localStorage.setItem('guest:ticketId', '30');
        mockLeaveQueue.mockRejectedValue(new Error('fail'));

        const { result } = renderHook(() => useTicket());
        await waitFor(() => expect(result.current.ticketId).toBe(30));

        await act(async () => {
          await result.current.leave();
        });

        // Should still clear locally despite API failure
        expect(result.current.ticketId).toBeNull();
        consoleSpy.mockRestore();
      });
    });

    describe('legacy migration', () => {
      it('migrates guest2:ticket to guest:ticketId', async () => {
        localStorage.setItem('guest2:ticket', '50');

        renderHook(() => useTicket());

        await waitFor(() => {
          expect(localStorage.getItem('guest:ticketId')).toBe('50');
          expect(localStorage.getItem('guest2:ticket')).toBeNull();
        });
      });

      it('does not overwrite existing canonical key', async () => {
        localStorage.setItem('guest:ticketId', '42');
        localStorage.setItem('guest2:ticket', '50');

        renderHook(() => useTicket());

        await waitFor(() => {
          // Canonical key should remain 42
          expect(localStorage.getItem('guest:ticketId')).toBe('42');
        });
      });
    });
  });
});
