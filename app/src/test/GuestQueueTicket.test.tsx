/**
 * Integration tests for GuestQueueTicket page
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../lib/supabaseService', () => ({
  getMetric1: vi.fn().mockResolvedValue({ value: 1, ts: Date.now() }),
  setMetric1: vi.fn().mockResolvedValue({ value: 1, ts: Date.now() }),
  onSettingsChange: vi.fn().mockReturnValue(() => {}),
  nextTicket: vi.fn().mockResolvedValue({ id: 10, ticketNumber: 10 }),
  peekTicket: vi.fn().mockResolvedValue(10),
  restoreTicket: vi.fn().mockResolvedValue({ id: 10, ticketNumber: 10 }),
  checkInTicket: vi.fn().mockResolvedValue(undefined),
  leaveQueue: vi.fn().mockResolvedValue(undefined),
}));

import GuestQueueTicket from '../pages/GuestQueueTicket';
import {
  getMetric1,
  nextTicket,
  restoreTicket,
  checkInTicket,
  leaveQueue,
} from '../lib/supabaseService';

const mockGetMetric1 = vi.mocked(getMetric1);
const mockNextTicket = vi.mocked(nextTicket);
const mockRestoreTicket = vi.mocked(restoreTicket);
const mockCheckInTicket = vi.mocked(checkInTicket);
const mockLeaveQueue = vi.mocked(leaveQueue);

function renderGuest2(initialEntries = ['/ticket']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <GuestQueueTicket />
    </MemoryRouter>
  );
}

describe('GuestQueueTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockGetMetric1.mockResolvedValue({ value: 1, ts: Date.now() });
    mockNextTicket.mockResolvedValue({ id: 10, ticketNumber: 10 });
    mockRestoreTicket.mockResolvedValue({ id: 10, ticketNumber: 10 });
    mockCheckInTicket.mockResolvedValue(undefined);
    mockLeaveQueue.mockResolvedValue(undefined);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders NOW SERVING header', async () => {
    renderGuest2();
    await waitFor(() => {
      expect(screen.getByText('NOW')).toBeInTheDocument();
      expect(screen.getByText('SERVING')).toBeInTheDocument();
    });
  });

  it('renders "Your Number" headline', () => {
    renderGuest2();
    expect(screen.getByText('Your Number')).toBeInTheDocument();
  });

  it('displays metric1 (NOW SERVING) value', async () => {
    mockGetMetric1.mockResolvedValue({ value: 3, ts: Date.now() });
    renderGuest2();

    await waitFor(() => {
      const input = screen.getByLabelText('Metric value') as HTMLInputElement;
      expect(input.value).toBe('3');
    });
  });

  it('claims a fresh ticket on mount when none stored', async () => {
    renderGuest2();

    await waitFor(() => {
      expect(mockNextTicket).toHaveBeenCalled();
    });

    await waitFor(() => {
      const input = screen.getByLabelText('Metric value2') as HTMLInputElement;
      expect(input.value).toBe('10');
    });
  });

  it('restores existing ticket from localStorage', async () => {
    localStorage.setItem('guest:ticketId', '25');
    renderGuest2();

    await waitFor(() => {
      const input = screen.getByLabelText('Metric value2') as HTMLInputElement;
      expect(input.value).toBe('25');
    });

    expect(mockRestoreTicket).toHaveBeenCalledWith(25);
  });

  it('renders Queue ID and Queue Name', () => {
    renderGuest2();
    expect(screen.getByLabelText('Queue ID')).toHaveValue('qq000001');
    expect(screen.getByLabelText('Queue Name')).toHaveValue('Luna Bakery');
  });

  it('renders event details', () => {
    renderGuest2();
    expect(screen.getByLabelText('Event Date')).toHaveValue('08/10/2025');
    expect(screen.getByLabelText('Event Start Time')).toHaveValue('11:00');
    expect(screen.getByLabelText('Time Zone')).toHaveValue('EST');
    expect(screen.getByLabelText('Event End Time')).toHaveValue('19:00');
  });

  it('always shows Leave Queue button', async () => {
    renderGuest2();
    await waitFor(() => {
      expect(screen.getByText('Leave Queue')).toBeInTheDocument();
    });
  });

  it('calls leaveQueue and navigates on Leave click', async () => {
    localStorage.setItem('guest:ticketId', '10');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderGuest2();

    await waitFor(() => {
      expect(screen.getByText('Leave Queue')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Leave Queue'));

    await waitFor(() => {
      expect(mockLeaveQueue).toHaveBeenCalledWith(10, 'user');
      expect(mockNavigate).toHaveBeenCalledWith('/?cleared=1');
    });

    vi.restoreAllMocks();
  });

  describe('proximity logic', () => {
    it('shows Check In button when approaching (within threshold)', async () => {
      // m1=7, m2=10 → ahead=3 → within TIME_2_CHECKIN (3)
      mockGetMetric1.mockResolvedValue({ value: 7, ts: Date.now() });
      localStorage.setItem('guest:ticketId', '10');
      mockRestoreTicket.mockResolvedValue({ id: 10, ticketNumber: 10 });

      renderGuest2();

      await waitFor(() => {
        expect(screen.getByText('Check In')).toBeInTheDocument();
        expect(
          screen.getByText('It is time to head to the queue')
        ).toBeInTheDocument();
      });
    });

    it('hides Check In when far away', async () => {
      // m1=1, m2=10 → ahead=9 → beyond threshold
      mockGetMetric1.mockResolvedValue({ value: 1, ts: Date.now() });
      localStorage.setItem('guest:ticketId', '10');
      mockRestoreTicket.mockResolvedValue({ id: 10, ticketNumber: 10 });

      renderGuest2();

      await waitFor(() => {
        expect(screen.queryByText('Check In')).not.toBeInTheDocument();
      });
    });

    it('shows "Please check in now" when now serving and not checked in', async () => {
      // m1=10, m2=10 → at turn, not checked in
      mockGetMetric1.mockResolvedValue({ value: 10, ts: Date.now() });
      localStorage.setItem('guest:ticketId', '10');
      mockRestoreTicket.mockResolvedValue({ id: 10, ticketNumber: 10 });

      renderGuest2();

      await waitFor(() => {
        expect(screen.getByText('Please check in now')).toBeInTheDocument();
        expect(screen.getByText('Check In')).toBeInTheDocument();
      });
    });

    it('shows green border when now serving and checked in', async () => {
      mockGetMetric1.mockResolvedValue({ value: 10, ts: Date.now() });
      localStorage.setItem('guest:ticketId', '10');
      localStorage.setItem('guest:checkedIn:10', '1');
      mockRestoreTicket.mockResolvedValue({ id: 10, ticketNumber: 10 });

      const { container } = renderGuest2();

      await waitFor(() => {
        const card = container.querySelector('.card');
        expect(card).toHaveStyle({ borderColor: '#00ff55' });
        expect(
          screen.getByText('It is your turn to place an order')
        ).toBeInTheDocument();
      });
    });

    it('performs check-in when Check In button clicked', async () => {
      mockGetMetric1.mockResolvedValue({ value: 8, ts: Date.now() });
      localStorage.setItem('guest:ticketId', '10');
      mockRestoreTicket.mockResolvedValue({ id: 10, ticketNumber: 10 });

      renderGuest2();

      await waitFor(() => {
        expect(screen.getByText('Check In')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Check In'));

      await waitFor(() => {
        expect(mockCheckInTicket).toHaveBeenCalledWith(10);
        expect(localStorage.getItem('guest:checkedIn:10')).toBe('1');
      });
    });

    it('triggers auto-leave when far past without check-in', async () => {
      // m1=15, m2=10, gap=5 → should auto-leave (noChkInByBye=5)
      mockGetMetric1.mockResolvedValue({ value: 15, ts: Date.now() });
      localStorage.setItem('guest:ticketId', '10');
      mockRestoreTicket.mockResolvedValue({ id: 10, ticketNumber: 10 });

      renderGuest2();

      await waitFor(() => {
        expect(mockLeaveQueue).toHaveBeenCalledWith(10, 'noCheckInTimeout');
        expect(mockNavigate).toHaveBeenCalledWith('/?cleared=1');
      });
    });

    it('triggers auto-leave when checked in but far past', async () => {
      // m1=19, m2=10, gap=9 → should auto-leave (chkInByBye=9)
      mockGetMetric1.mockResolvedValue({ value: 19, ts: Date.now() });
      localStorage.setItem('guest:ticketId', '10');
      localStorage.setItem('guest:checkedIn:10', '1');
      mockRestoreTicket.mockResolvedValue({ id: 10, ticketNumber: 10 });

      renderGuest2();

      await waitFor(() => {
        expect(mockLeaveQueue).toHaveBeenCalledWith(10, 'checkedInTimeout');
        expect(mockNavigate).toHaveBeenCalledWith('/?cleared=1');
      });
    });
  });

  it('handles ?nuke=1 by clearing all storage', async () => {
    localStorage.setItem('guest:ticketId', '42');
    sessionStorage.setItem('guest2:ticket', '42');

    render(
      <MemoryRouter initialEntries={['/ticket?nuke=1']}>
        <GuestQueueTicket />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(localStorage.getItem('guest:ticketId')).toBeNull();
      expect(sessionStorage.getItem('guest2:ticket')).toBeNull();
    });
  });

  it('renders the hidden reset button', () => {
    renderGuest2();
    expect(screen.getByLabelText('Secret button')).toBeInTheDocument();
  });
});
