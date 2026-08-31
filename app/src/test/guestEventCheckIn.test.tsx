import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  default: ({ titleLine1, titleLine2 }: { titleLine1: string; titleLine2: string }) => (
    <header>{titleLine1} {titleLine2}</header>
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

function renderCheckIn() {
  return render(
    <MemoryRouter initialEntries={['/events/ipitch-2026/check-in']}>
      <Routes>
        <Route path="/events/:eventSlug/check-in" element={<GuestEventCheckIn />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('GuestEventCheckIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetEventBySlug.mockResolvedValue(event);
    mockSearchImportedRegistrationsForGuest.mockResolvedValue([]);
    mockCreateEventCheckIn.mockResolvedValue(createdCheckIn);
    mockCheckInEventGuest.mockResolvedValue(completedCheckIn);
    mockGetEventCheckIn.mockResolvedValue(completedCheckIn);
  });

  it('guides imported lookup by name or email and blocks mismatched self-registration email locally', async () => {
    const user = userEvent.setup();
    renderCheckIn();

    const searchInput = await screen.findByPlaceholderText('First name, last name, or email');
    await user.type(searchInput, 'missing@example.com');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('No matching registration was found. Try your first or last name, or register below.')).toBeInTheDocument();
    await user.click(screen.getByText("Can't find your registration?"));

    expect(screen.getByText('Please provide your information below to register for the event and check in now.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('First name'), 'Walk');
    await user.type(screen.getByLabelText('Last name'), 'Up');
    await user.type(screen.getByLabelText('Email'), 'walk@example.com');
    await user.type(screen.getByLabelText('Confirm email'), 'typo@example.com');
    await user.click(screen.getByRole('button', { name: 'Register & Check In' }));

    expect(await screen.findByText('Email and confirm email must match.')).toBeInTheDocument();
    expect(mockCreateEventCheckIn).not.toHaveBeenCalled();
  });

  it('self-registers with matching email and auto-completes check-in', async () => {
    const user = userEvent.setup();
    renderCheckIn();

    await screen.findByPlaceholderText('First name, last name, or email');
    await user.click(screen.getByText("Can't find your registration?"));
    await user.type(screen.getByLabelText('First name'), 'Walk');
    await user.type(screen.getByLabelText('Last name'), 'Up');
    await user.type(screen.getByLabelText('Email'), 'walk@example.com');
    await user.type(screen.getByLabelText('Confirm email'), 'walk@example.com');
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
  });
});
