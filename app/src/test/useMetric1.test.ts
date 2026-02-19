/**
 * Tests for hooks/useMetric1.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock the service layer
vi.mock('../lib/supabaseService', () => ({
  getMetric1: vi.fn(),
  setMetric1: vi.fn(),
  onSettingsChange: vi.fn(),
}));

import { useMetric1 } from '../hooks/useMetric1';
import { getMetric1, setMetric1, onSettingsChange } from '../lib/supabaseService';

const mockGetMetric1 = vi.mocked(getMetric1);
const mockSetMetric1 = vi.mocked(setMetric1);
const mockOnSettingsChange = vi.mocked(onSettingsChange);

describe('useMetric1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGetMetric1.mockResolvedValue({ value: 1, ts: Date.now() });
    mockSetMetric1.mockResolvedValue({ value: 1, ts: Date.now() });
    mockOnSettingsChange.mockReturnValue(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with nowServing = 1', () => {
    const { result } = renderHook(() => useMetric1(60000));
    expect(result.current.nowServing).toBe(1);
  });

  it('fetches metric1 on mount', async () => {
    mockGetMetric1.mockResolvedValue({ value: 7, ts: Date.now() });
    const { result } = renderHook(() => useMetric1(60000));

    await waitFor(() => {
      expect(result.current.nowServing).toBe(7);
    });
    expect(mockGetMetric1).toHaveBeenCalledTimes(1);
  });

  it('subscribes to realtime settings changes', () => {
    renderHook(() => useMetric1(60000));
    expect(mockOnSettingsChange).toHaveBeenCalledWith(expect.any(Function));
  });

  it('unsubscribes on unmount', () => {
    const unsubFn = vi.fn();
    mockOnSettingsChange.mockReturnValue(unsubFn);

    const { unmount } = renderHook(() => useMetric1(60000));
    unmount();

    expect(unsubFn).toHaveBeenCalled();
  });

  it('setNowServing updates value and calls setMetric1 API', async () => {
    mockGetMetric1.mockResolvedValue({ value: 1, ts: Date.now() });
    const { result } = renderHook(() => useMetric1(60000));

    // Wait for initial fetch to settle
    await waitFor(() => {
      expect(mockGetMetric1).toHaveBeenCalledTimes(1);
    });

    mockSetMetric1.mockResolvedValue({ value: 5, ts: Date.now() });
    // Also update getMetric1 so subsequent refreshes don't overwrite
    mockGetMetric1.mockResolvedValue({ value: 5, ts: Date.now() });

    await act(async () => {
      await result.current.setNowServing(5);
    });

    expect(result.current.nowServing).toBe(5);
    expect(mockSetMetric1).toHaveBeenCalledWith(5);
  });

  it('clamps setNowServing to minimum of 1', async () => {
    const { result } = renderHook(() => useMetric1(60000));
    mockSetMetric1.mockResolvedValue({ value: 1, ts: Date.now() });

    await act(async () => {
      await result.current.setNowServing(-5);
    });

    expect(result.current.nowServing).toBe(1);
    expect(mockSetMetric1).toHaveBeenCalledWith(1);
  });

  it('polls at the specified interval', async () => {
    mockGetMetric1.mockResolvedValue({ value: 3, ts: Date.now() });
    renderHook(() => useMetric1(2000));

    // Initial fetch
    await waitFor(() => {
      expect(mockGetMetric1).toHaveBeenCalledTimes(1);
    });

    // Advance timer to trigger poll
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Should have fetched again
    await waitFor(() => {
      expect(mockGetMetric1).toHaveBeenCalledTimes(2);
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetMetric1.mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => useMetric1(60000));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('metric1 fetch failed', expect.any(Error));
    });

    // Should still have default value
    expect(result.current.nowServing).toBe(1);
    consoleSpy.mockRestore();
  });

  it('updates nowServing when realtime callback fires', async () => {
    let realtimeCallback: (payload: { key: string; value: string }) => void;
    mockOnSettingsChange.mockImplementation((cb) => {
      realtimeCallback = cb;
      return () => {};
    });

    const { result } = renderHook(() => useMetric1(60000));

    await waitFor(() => {
      expect(mockOnSettingsChange).toHaveBeenCalled();
    });

    // Simulate realtime update
    act(() => {
      realtimeCallback!({ key: 'metric1', value: '25' });
    });

    expect(result.current.nowServing).toBe(25);
  });

  it('ignores non-metric1 realtime updates', async () => {
    let realtimeCallback: (payload: { key: string; value: string }) => void;
    mockOnSettingsChange.mockImplementation((cb) => {
      realtimeCallback = cb;
      return () => {};
    });

    const { result } = renderHook(() => useMetric1(60000));
    await waitFor(() => expect(mockOnSettingsChange).toHaveBeenCalled());

    act(() => {
      realtimeCallback!({ key: 'metric1Ts', value: '999' });
    });

    // Should remain 1 (default), not 999
    expect(result.current.nowServing).toBe(1);
  });
});
