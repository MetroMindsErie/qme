/**
 * Tests for hooks/useQueueMetric.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../lib/queueService', () => ({
  getNowServing: vi.fn(),
  setNowServing: vi.fn(),
  onQueueChange: vi.fn(),
}));

import { useQueueMetric } from '../hooks/useQueueMetric';
import { getNowServing, setNowServing, onQueueChange } from '../lib/queueService';

const mockGetNowServing = vi.mocked(getNowServing);
const mockSetNowServing = vi.mocked(setNowServing);
const mockOnQueueChange = vi.mocked(onQueueChange);

describe('useQueueMetric', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGetNowServing.mockResolvedValue(1);
    mockSetNowServing.mockResolvedValue(1);
    mockOnQueueChange.mockReturnValue(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with nowServing = 1', () => {
    const { result } = renderHook(() => useQueueMetric('q1', 60000));
    expect(result.current.nowServing).toBe(1);
  });

  it('does not fetch when queueId is undefined', () => {
    renderHook(() => useQueueMetric(undefined, 60000));
    expect(mockGetNowServing).not.toHaveBeenCalled();
  });

  it('fetches now_serving on mount', async () => {
    mockGetNowServing.mockResolvedValue(5);
    const { result } = renderHook(() => useQueueMetric('q1', 60000));

    await waitFor(() => {
      expect(result.current.nowServing).toBe(5);
    });
    expect(mockGetNowServing).toHaveBeenCalledWith('q1');
  });

  it('subscribes to realtime changes for the queue', () => {
    renderHook(() => useQueueMetric('q1', 60000));
    expect(mockOnQueueChange).toHaveBeenCalledWith('q1', expect.any(Function));
  });

  it('unsubscribes on unmount', () => {
    const unsubFn = vi.fn();
    mockOnQueueChange.mockReturnValue(unsubFn);

    const { unmount } = renderHook(() => useQueueMetric('q1', 60000));
    unmount();

    expect(unsubFn).toHaveBeenCalled();
  });
});
