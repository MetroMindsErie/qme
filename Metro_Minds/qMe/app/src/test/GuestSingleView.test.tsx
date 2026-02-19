/**
 * Integration tests for GuestSingleView page
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Track navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../lib/supabaseService', () => ({
  getMetric1: vi.fn().mockResolvedValue({ value: 7, ts: Date.now() }),
  setMetric1: vi.fn().mockResolvedValue({ value: 7, ts: Date.now() }),
  onSettingsChange: vi.fn().mockReturnValue(() => {}),
  leaveQueue: vi.fn().mockResolvedValue(undefined),
}));

import GuestSingleView from '../pages/GuestSingleView';
import { leaveQueue } from '../lib/supabaseService';

const mockLeaveQueue = vi.mocked(leaveQueue);

function renderGuest1() {
  return render(
    <MemoryRouter>
      <GuestSingleView />
    </MemoryRouter>
  );
}

describe('GuestSingleView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders NOW SERVING headline', async () => {
    renderGuest1();
    await waitFor(() => {
      expect(screen.getByText('NOW SERVING')).toBeInTheDocument();
    });
  });

  it('displays metric1 value', async () => {
    renderGuest1();
    await waitFor(() => {
      const input = screen.getByLabelText('Metric value') as HTMLInputElement;
      expect(input.value).toBe('7');
    });
  });

  it('renders Queue ID and Queue Name', async () => {
    renderGuest1();
    await waitFor(() => {
      expect(screen.getByLabelText('Queue ID')).toHaveValue('qq000001');
      expect(screen.getByLabelText('Queue Name')).toHaveValue('Luna Bakery');
    });
  });

  it('renders event details', () => {
    renderGuest1();
    expect(screen.getByLabelText('Event Date')).toHaveValue('08/10/2025');
    expect(screen.getByLabelText('Event Start Time')).toHaveValue('11:00');
    expect(screen.getByLabelText('Time Zone')).toHaveValue('EST');
    expect(screen.getByLabelText('Event End Time')).toHaveValue('19:00');
  });

  it('renders mini group with description text', () => {
    renderGuest1();
    expect(
      screen.getByText(/Everything at Luna is made from scratch/)
    ).toBeInTheDocument();
  });

  it('shows "Join Queue" button when no ticket stored', () => {
    renderGuest1();
    expect(screen.getByText('Join Queue')).toBeInTheDocument();
  });

  it('shows "Re-Join Queue" when ticket exists', async () => {
    localStorage.setItem('guest:ticketId', '42');
    renderGuest1();

    await waitFor(() => {
      expect(screen.getByText('Re-Join Queue')).toBeInTheDocument();
    });
  });

  it('shows Leave Queue button when ticket exists', async () => {
    localStorage.setItem('guest:ticketId', '42');
    renderGuest1();

    await waitFor(() => {
      expect(screen.getByText('Leave Queue')).toBeInTheDocument();
    });
  });

  it('hides Leave Queue button when no ticket', () => {
    renderGuest1();
    expect(screen.queryByText('Leave Queue')).not.toBeInTheDocument();
  });

  it('shows note about existing ticket when one exists', async () => {
    localStorage.setItem('guest:ticketId', '42');
    renderGuest1();

    await waitFor(() => {
      expect(
        screen.getByText('You are already in the queue with ticket: 42')
      ).toBeInTheDocument();
    });
  });

  it('navigates to /ticket on Join Queue click', () => {
    renderGuest1();
    fireEvent.click(screen.getByText('Join Queue'));
    expect(mockNavigate).toHaveBeenCalledWith('/ticket');
  });

  it('navigates to /ticket?resume=1 on Re-Join click', async () => {
    localStorage.setItem('guest:ticketId', '42');
    renderGuest1();

    await waitFor(() => {
      expect(screen.getByText('Re-Join Queue')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Re-Join Queue'));
    expect(mockNavigate).toHaveBeenCalledWith('/ticket?resume=1');
  });

  it('calls leaveQueue and clears storage on Leave click', async () => {
    localStorage.setItem('guest:ticketId', '42');
    mockLeaveQueue.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderGuest1();

    await waitFor(() => {
      expect(screen.getByText('Leave Queue')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Leave Queue'));

    await waitFor(() => {
      expect(mockLeaveQueue).toHaveBeenCalledWith(42, 'user');
      expect(localStorage.getItem('guest:ticketId')).toBeNull();
    });

    vi.restoreAllMocks();
  });

  it('clears storage when ?cleared=1 is in URL', async () => {
    localStorage.setItem('guest:ticketId', '42');

    render(
      <MemoryRouter initialEntries={['/?cleared=1']}>
        <GuestSingleView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(localStorage.getItem('guest:ticketId')).toBeNull();
    });
  });

  it('renders the hidden reset button', () => {
    renderGuest1();
    expect(screen.getByLabelText('Secret button')).toBeInTheDocument();
  });

  it('renders the logo', () => {
    renderGuest1();
    const logo = screen.getByAltText('Logo') as HTMLImageElement;
    expect(logo).toBeInTheDocument();
  });

  it('renders the mini image', () => {
    renderGuest1();
    const img = screen.getByAltText('Badge') as HTMLImageElement;
    expect(img.src).toContain('lunaLogo.jpg');
  });
});
