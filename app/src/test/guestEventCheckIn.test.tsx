import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GuestEventCheckIn from '../pages/guest/GuestEventCheckIn';
import type { EventCheckIn, QEvent } from '../types';

const event: QEvent = {
  id: 'event-1',
  organization_id: null,
  name: 'i-Pitch',
  slug: 'ipitch-2026',
  description: '',
  location: '',
  image_url: '',
  event_date: '2026-09-03',
  start_time: '17:00',
  end_time: '20:00',
  timezone: 'ET',
  status: 'active',
  metadata: {
    check_in: {
      enabled: true,
      completion_mode: 'auto',
      require_completed_for_participation: true,
      imported_registration_lookup_enabled: true,
      post_check_in_instruction: 'Please go to the check-in desk to receive your event package.',
      self_registration: {
        enabled: true,
        required_fields: ['first_name', 'last_name', 'email'],
      },
    },
  },
  created_at: '',
  updated_at: '',
};

const createdCheckIn: EventCheckIn = {
  id: 'check-in-1',
  event_id: 'event-1',
  guest_session_id: 'guest-session-1',
  first_name: 'Walk',
  last_name: 'Up',
  code: null,
  ticket_type: null,
  status: 'waiting',
  metadata: {},
  created_at: '',
  updated_at: '',
};

const completedCheckIn = {
  ...createdCheckIn,
  ticket_type: 'general' as const,
  status: 'completed' as const,
};

const mockGetEventBySlug = vi.fn();
const mockSearchImportedRegistrationsForGuest = vi.fn();
const mockCreateEventCheckIn = vi.fn();
const mockCheckInEventGuest = vi.fn();
const mockGetEventCheckIn = vi.fn();

vi.mock('../components/Header', () => ({
  default: ({ titleLine1, titleLine2, hideMenu }: { titleLine1: string; titleLine2: string; hideMenu?: boolean }) => (
    <header>{titleLine1} {titleLine2}{hideMenu ? null : <button type="button" aria-label="Open menu">Menu</button>}</header>
  ),
}));

vi.mock('../lib/eventService', () => ({
  getEventBySlug: (...args: unknown[]) => mockGetEventBySlug(...args),
}));

vi.mock('../lib/checkInService', () => ({
  checkInEventGuest: (...args: unknown[]) => mockCheckInEventGuest(...args),
  createEventCheckIn: (...args: unknown[]) => mockCreateEventCheckIn(...args),
  createImportedRegistrationCheckInForGuest: vi.fn(),
  getEventCheckIn: (...args: unknown[]) => mockGetEventCheckIn(...args),
  reconnectImportedRegistrationCheckInForGuest: vi.fn(),
  searchImportedRegistrationsForGuest: (...args: unknown[]) => mockSearchImportedRegistrationsForGuest(...args),
}));

function renderCheckIn(path = '/events/ipitch-2026/check-in') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/events/:eventSlug/check-in" element={<GuestEventCheckIn />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('GuestEventCheckIn', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    localStorage.clear();
    mockGetEventBySlug.mockResolvedValue(event);
    mockSearchImportedRegistrationsForGuest.mockResolvedValue([]);
    mockCreateEventCheckIn.mockResolvedValue(createdCheckIn);
    mockCheckInEventGuest.mockResolvedValue(completedCheckIn);
    mockGetEventCheckIn.mockResolvedValue(completedCheckIn);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('guides imported lookup by name or email and blocks mismatched self-registration email locally', async () => {
    const user = userEvent.setup();
    renderCheckIn();

    const searchInput = await screen.findByPlaceholderText('First name, last name, or email');
    fireEvent.change(searchInput, { target: { value: 'missing@example.com' } });
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('No matching registration was found. Try your first or last name, or register below.')).toBeInTheDocument();
    await user.click(screen.getByText("Can't find your registration?"));

    expect(screen.getByText('Please provide your information below to register for the event and check in now.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Walk' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Up' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'walk@example.com' } });
    fireEvent.change(screen.getByLabelText('Confirm email'), { target: { value: 'typo@example.com' } });
    await user.click(screen.getByRole('button', { name: 'Register & Check In' }));

    const inlineError = await screen.findByText('Email and confirm email must match.');
    expect(inlineError).toBeInTheDocument();
    expect(inlineError.closest('form')).toContainElement(screen.getByRole('button', { name: 'Register & Check In' }));
    expect(screen.getByLabelText('Confirm email')).toHaveAttribute('aria-invalid', 'true');
    expect(mockCreateEventCheckIn).not.toHaveBeenCalled();
  });

  it('self-registers with matching email and auto-completes check-in', async () => {
    const user = userEvent.setup();
    renderCheckIn();

    await screen.findByPlaceholderText('First name, last name, or email');
    await user.click(screen.getByText("Can't find your registration?"));
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Walk' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Up' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'walk@example.com' } });
    fireEvent.change(screen.getByLabelText('Confirm email'), { target: { value: 'walk@example.com' } });
    await user.click(screen.getByRole('button', { name: 'Register & Check In' }));

    await waitFor(() => {
      expect(mockCreateEventCheckIn).toHaveBeenCalledWith(expect.objectContaining({
        event_id: event.id,
        first_name: 'Walk',
        last_name: 'Up',
        email: 'walk@example.com',
        needsHelp: false,
      }));
      expect(mockCheckInEventGuest).toHaveBeenCalledWith(createdCheckIn.id, 'general', event.id);
    });
    expect(await screen.findByText(/Thanks, Walk!/)).toBeInTheDocument();
    expect(screen.getByText(/Please go to the check-in desk to receive your event package./)).toBeInTheDocument();
  });

  it('clears prior guest identity and starts clean for shared-device Next Guest', async () => {
    const user = userEvent.setup();
    renderCheckIn('/events/ipitch-2026/check-in?mode=shared');

    await screen.findByPlaceholderText('First name, last name, or email');
    expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument();
    await user.click(screen.getByText("Can't find your registration?"));
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Walk' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Up' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'walk@example.com' } });
    fireEvent.change(screen.getByLabelText('Confirm email'), { target: { value: 'walk@example.com' } });
    localStorage.setItem('qme:guestSession:event-1', 'guest-a-token');
    localStorage.setItem('qme:voteAllocation:event-1:ece-1:check-in-1', JSON.stringify({ veesafe: 2 }));
    await user.click(screen.getByRole('button', { name: 'Register & Check In' }));

    expect(await screen.findByRole('button', { name: 'Next Guest' })).toBeInTheDocument();
    expect(localStorage.getItem('qme:eventCheckIn:event-1')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Next Guest' }));

    expect(await screen.findByPlaceholderText('First name, last name, or email')).toBeInTheDocument();
    expect(screen.queryByText(/Thanks, Walk!/)).not.toBeInTheDocument();
    expect(localStorage.getItem('qme:eventCheckIn:event-1')).toBeNull();
    expect(localStorage.getItem('qme:guestSession:event-1')).toBeNull();
    expect(localStorage.getItem('qme:voteAllocation:event-1:ece-1:check-in-1')).toBeNull();
  });

  it('auto-resets shared-device success after the 15-second countdown', async () => {
    vi.useFakeTimers();
    await act(async () => {
      renderCheckIn('/events/ipitch-2026/check-in?mode=shared');
    });
    await act(async () => {});

    expect(screen.getByPlaceholderText('First name, last name, or email')).toBeInTheDocument();
    fireEvent.click(screen.getByText("Can't find your registration?"));
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Walk' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Up' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'walk@example.com' } });
    fireEvent.change(screen.getByLabelText('Confirm email'), { target: { value: 'walk@example.com' } });
    localStorage.setItem('qme:guestSession:event-1', 'guest-a-token');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Register & Check In' }));
    });
    await act(async () => {});

    expect(screen.getByText('Next guest in 15 seconds...')).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(15000);
    });

    expect(screen.getByPlaceholderText('First name, last name, or email')).toBeInTheDocument();
    expect(screen.queryByText(/Thanks, Walk!/)).not.toBeInTheDocument();
    expect(localStorage.getItem('qme:eventCheckIn:event-1')).toBeNull();
    expect(localStorage.getItem('qme:guestSession:event-1')).toBeNull();
  });

  it('does not auto-reset personal-device success', async () => {
    vi.useFakeTimers();
    await act(async () => {
      renderCheckIn();
    });
    await act(async () => {});

    expect(screen.getByPlaceholderText('First name, last name, or email')).toBeInTheDocument();
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    fireEvent.click(screen.getByText("Can't find your registration?"));
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Walk' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Up' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'walk@example.com' } });
    fireEvent.change(screen.getByLabelText('Confirm email'), { target: { value: 'walk@example.com' } });
    localStorage.setItem('qme:guestSession:event-1', 'guest-a-token');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Register & Check In' }));
    });
    await act(async () => {});

    expect(screen.getByText(/Thanks, Walk!/)).toBeInTheDocument();
    expect(screen.queryByText(/Next guest in/)).not.toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(20000);
    });

    expect(screen.getByText(/Thanks, Walk!/)).toBeInTheDocument();
    expect(localStorage.getItem('qme:eventCheckIn:event-1')).not.toBeNull();
    expect(localStorage.getItem('qme:guestSession:event-1')).toBe('guest-a-token');
  });
});
