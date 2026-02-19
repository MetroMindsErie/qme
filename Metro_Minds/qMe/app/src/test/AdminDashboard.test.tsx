/**
 * Integration tests for AdminDashboard page
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock all service calls
vi.mock('../lib/supabaseService', () => ({
  getMetric1: vi.fn().mockResolvedValue({ value: 5, ts: Date.now() }),
  setMetric1: vi.fn().mockResolvedValue({ value: 5, ts: Date.now() }),
  onSettingsChange: vi.fn().mockReturnValue(() => {}),
  peekTicket: vi.fn().mockResolvedValue(10),
  getLostCount: vi.fn().mockResolvedValue(2),
  resetQueue: vi.fn().mockResolvedValue(undefined),
}));

import AdminDashboard from '../pages/AdminDashboard';
import {
  getMetric1,
  setMetric1,
  peekTicket,
  getLostCount,
  resetQueue,
} from '../lib/supabaseService';

const mockGetMetric1 = vi.mocked(getMetric1);
const mockSetMetric1 = vi.mocked(setMetric1);
const mockPeekTicket = vi.mocked(peekTicket);
const mockGetLostCount = vi.mocked(getLostCount);
const mockResetQueue = vi.mocked(resetQueue);

function renderAdmin() {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  );
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGetMetric1.mockResolvedValue({ value: 5, ts: Date.now() });
    mockSetMetric1.mockResolvedValue({ value: 5, ts: Date.now() });
    mockPeekTicket.mockResolvedValue(10);
    mockGetLostCount.mockResolvedValue(2);
    mockResetQueue.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the card with headline', async () => {
    renderAdmin();
    await waitFor(() => {
      expect(screen.getByText('Cedar Hill Luna Sunday')).toBeInTheDocument();
    });
  });

  it('renders NOW SERVING headline', async () => {
    renderAdmin();
    await waitFor(() => {
      expect(screen.getByText('NOW SERVING')).toBeInTheDocument();
    });
  });

  it('displays the metric1 value', async () => {
    renderAdmin();
    await waitFor(() => {
      const input = screen.getByLabelText('Metric value') as HTMLInputElement;
      expect(input.value).toBe('5');
    });
  });

  it('displays Queue ID and Queue Name', async () => {
    renderAdmin();
    await waitFor(() => {
      expect(screen.getByLabelText('Queue ID')).toHaveValue('qq000001');
      expect(screen.getByLabelText('Queue Name')).toHaveValue('Luna Bakery');
    });
  });

  it('displays queue count (lastIssued - nowServing + 1)', async () => {
    renderAdmin();
    await waitFor(() => {
      // lastIssued=10, nowServing=5 → queueCount = 10 - 5 + 1 = 6
      const queueInput = screen.getByLabelText('# in Queue') as HTMLInputElement;
      expect(queueInput.value).toBe('6');
    });
  });

  it('displays guests lost count', async () => {
    renderAdmin();
    await waitFor(() => {
      const lostInput = screen.getByLabelText('Guests lost') as HTMLInputElement;
      expect(lostInput.value).toBe('2');
    });
  });

  it('increments metric on right arrow click', async () => {
    mockSetMetric1.mockResolvedValue({ value: 6, ts: Date.now() });
    renderAdmin();

    await waitFor(() => {
      expect(screen.getByLabelText('Metric value')).toHaveValue(5);
    });

    fireEvent.click(screen.getByLabelText('Right arrow'));

    await waitFor(() => {
      expect(mockSetMetric1).toHaveBeenCalledWith(6);
    });
  });

  it('decrements metric on left arrow click', async () => {
    mockSetMetric1.mockResolvedValue({ value: 4, ts: Date.now() });
    renderAdmin();

    await waitFor(() => {
      expect(screen.getByLabelText('Metric value')).toHaveValue(5);
    });

    fireEvent.click(screen.getByLabelText('Left arrow'));

    await waitFor(() => {
      expect(mockSetMetric1).toHaveBeenCalledWith(4);
    });
  });

  it('does not decrement below 1', async () => {
    mockGetMetric1.mockResolvedValue({ value: 1, ts: Date.now() });
    renderAdmin();

    await waitFor(() => {
      expect(screen.getByLabelText('Metric value')).toHaveValue(1);
    });

    fireEvent.click(screen.getByLabelText('Left arrow'));

    // Should not call setMetric1 since 1 - 1 = 0, but max(1, 0) = 1
    // and 1 === prev so no call
    await waitFor(() => {
      expect(mockSetMetric1).not.toHaveBeenCalled();
    });
  });

  it('renders arrow images', () => {
    renderAdmin();
    expect(screen.getByAltText('Left arrow')).toBeInTheDocument();
    expect(screen.getByAltText('Right arrow')).toBeInTheDocument();
  });

  it('renders the reset button (hidden by default)', () => {
    renderAdmin();
    const resetBtn = screen.getByLabelText('Reset queue');
    expect(resetBtn).toBeInTheDocument();
    // Should have hiddenBtn class (opacity: 0)
    expect(resetBtn.classList.contains('hiddenBtn')).toBe(true);
  });

  it('calls resetQueue when reset button is clicked', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderAdmin();
    const resetBtn = screen.getByLabelText('Reset queue');

    // Show it first
    fireEvent.mouseEnter(resetBtn);

    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(mockResetQueue).toHaveBeenCalled();
    });

    vi.restoreAllMocks();
  });

  it('polls for ticket and lost count', async () => {
    renderAdmin();

    await waitFor(() => {
      expect(mockPeekTicket).toHaveBeenCalledTimes(1);
      expect(mockGetLostCount).toHaveBeenCalledTimes(1);
    });

    // Advance timer for next poll
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(mockPeekTicket).toHaveBeenCalledTimes(2);
      expect(mockGetLostCount).toHaveBeenCalledTimes(2);
    });
  });

  it('renders the logo', () => {
    renderAdmin();
    const logo = screen.getByAltText('Logo') as HTMLImageElement;
    expect(logo.src).toContain('lunaLogo.jpg');
  });
});

// Need to import act
import { act } from '@testing-library/react';
