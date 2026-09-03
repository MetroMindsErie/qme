import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GuestEventCheckIn from '../pages/guest/GuestEventCheckIn';
import type { CurrentAdminPrincipal } from '../lib/adminPrincipalService';
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

const superAdmin: CurrentAdminPrincipal = {
  principal: {
    id: 'principal-1',
    auth_user_id: null,
    principal_type: 'person',
    display_name: 'Admin',
    email: 'admin@example.com',
    phone: null,
    status: 'active',
    metadata: {},
    created_at: '',
    updated_at: '',
  },
  platformRoles: [],
  organizationMemberships: [],
  eventStaffAssignments: [],
  isSuperadmin: true,
};

const mockGetEventBySlug = vi.fn();
const mockSearchImportedRegistrationsForGuest = vi.fn();
const mockCreateEventCheckIn = vi.fn();
const mockCheckInEventGuest = vi.fn();
const mockGetEventCheckIn = vi.fn();
const mockCreateImportedRegistrationCheckInForGuest = vi.fn();
const mockReconnectImportedRegistrationCheckInForGuest = vi.fn();
const mockRecoverEventCheckInForGuest = vi.fn();
const mockGetCurrentAdminPrincipal = vi.fn();

vi.mock('../components/Header', () => ({
  default: ({ titleLine1, titleLine2, hideMenu }: { titleLine1: string; titleLine2: string; hideMenu?: boolean }) => (
    <header>{titleLine1} {titleLine2}{hideMenu ? null : <button type="button" aria-label="Open menu">Menu</button>}</header>
  ),
}));

vi.mock('../lib/eventService', () => ({
  getEventBySlug: (...args: unknown[]) => mockGetEventBySlug(...args),
}));

vi.mock('../lib/adminPrincipalService', () => ({
  canManageEvent: vi.fn((admin: CurrentAdminPrincipal | null) => Boolean(admin?.isSuperadmin)),
  getCurrentAdminPrincipal: (...args: unknown[]) => mockGetCurrentAdminPrincipal(...args),
}));

vi.mock('../lib/checkInService', () => ({
  checkInEventGuest: (...args: unknown[]) => mockCheckInEventGuest(...args),
  createEventCheckIn: (...args: unknown[]) => mockCreateEventCheckIn(...args),
  createImportedRegistrationCheckInForGuest: (...args: unknown[]) => mockCreateImportedRegistrationCheckInForGuest(...args),
  getEventCheckIn: (...args: unknown[]) => mockGetEventCheckIn(...args),
  reconnectImportedRegistrationCheckInForGuest: (...args: unknown[]) => mockReconnectImportedRegistrationCheckInForGuest(...args),
  recoverEventCheckInForGuest: (...args: unknown[]) => mockRecoverEventCheckInForGuest(...args),
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
    mockCreateImportedRegistrationCheckInForGuest.mockResolvedValue(completedCheckIn);
    mockReconnectImportedRegistrationCheckInForGuest.mockResolvedValue(completedCheckIn);
    mockRecoverEventCheckInForGuest.mockResolvedValue(completedCheckIn);
    mockGetCurrentAdminPrincipal.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('applies guest event theme accents to the check-in surface', async () => {
    mockGetEventBySlug.mockResolvedValue({
      ...event,
      metadata: {
        ...event.metadata,
        guest_theme: {
          primary_accent: '#4B2E83',
          secondary_accent: '#2563EB',
          highlight_accent: '#F59E0B',
        },
      },
    });

    const { container } = renderCheckIn();

    expect(await screen.findByText('Event Check-In')).toBeInTheDocument();
    const themedCard = container.querySelector<HTMLElement>('.guest-event-themed');
    expect(themedCard).not.toBeNull();
    expect(themedCard?.style.getPropertyValue('--guest-event-primary')).toBe('#4B2E83');
    expect(themedCard?.style.getPropertyValue('--guest-event-secondary')).toBe('#2563EB');
    expect(themedCard?.style.getPropertyValue('--guest-event-highlight')).toBe('#F59E0B');
  });

  it('blocks ordinary shared-device check-in route and actions while availability is closed', async () => {
    mockGetEventBySlug.mockResolvedValue({
      ...event,
      metadata: {
        ...event.metadata,
        check_in: {
          ...(event.metadata?.check_in as Record<string, unknown>),
          availability_mode: 'closed',
        },
      },
    });

    renderCheckIn('/events/ipitch-2026/check-in?mode=shared');

    expect(await screen.findByText('Check-In is not open yet.')).toBeInTheDocument();
    expect(screen.getByText('You can explore the event information in the meantime.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to Event' })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('First name, last name, or email')).not.toBeInTheDocument();
    expect(mockSearchImportedRegistrationsForGuest).not.toHaveBeenCalled();
    expect(mockCreateEventCheckIn).not.toHaveBeenCalled();
  });

  it('does not offer Back to Event from shared-device no-check-in state', async () => {
    mockGetEventBySlug.mockResolvedValue({
      ...event,
      metadata: {
        ...event.metadata,
        check_in: {
          ...(event.metadata?.check_in as Record<string, unknown>),
          completion_mode: 'none',
        },
      },
    });

    renderCheckIn('/events/ipitch-2026/check-in?mode=shared');

    expect(await screen.findByText('Check-in is not needed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to Event' })).not.toBeInTheDocument();
  });

  it('allows authenticated admin test mode to exercise the real guest flow while public check-in is closed', async () => {
    mockGetCurrentAdminPrincipal.mockResolvedValue(superAdmin);
    mockGetEventBySlug.mockResolvedValue({
      ...event,
      metadata: {
        ...event.metadata,
        check_in: {
          ...(event.metadata?.check_in as Record<string, unknown>),
          availability_mode: 'closed',
        },
      },
    });

    const user = userEvent.setup();
    renderCheckIn('/events/ipitch-2026/check-in?mode=shared&adminTest=1');

    expect(await screen.findByText(/Admin test mode/)).toBeInTheDocument();
    expect(screen.getByText('Enter your name or email to find your registration.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument();
    expect(screen.queryByText('Recovery phone')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to Event' })).not.toBeInTheDocument();
    await user.click(screen.getByText("Can't find your registration?"));
    expect(screen.queryByRole('button', { name: 'Back to Event' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Walk' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Up' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'walk@example.com' } });
    fireEvent.change(screen.getByLabelText('Confirm email'), { target: { value: 'walk@example.com' } });
    await user.click(screen.getByRole('button', { name: 'Register & Check In' }));

    await waitFor(() => {
      expect(mockCreateEventCheckIn).toHaveBeenCalled();
      expect(mockCheckInEventGuest).toHaveBeenCalledWith(createdCheckIn.id, 'general', event.id, { bypassAvailability: true });
    });
    expect(await screen.findByText(/Thanks, Walk!/)).toBeInTheDocument();
    expect(screen.getByText(/Please show this confirmation to the person at the desk to receive your evening's event package./)).toBeInTheDocument();
    expect(screen.queryByText(/Please go to the check-in desk to receive your event package./)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to Event' })).not.toBeInTheDocument();
  });

  it('guides imported lookup by name or email and blocks mismatched self-registration email locally', async () => {
    renderCheckIn();

    const searchInput = await screen.findByPlaceholderText('First name, last name, or email');
    fireEvent.change(searchInput, { target: { value: 'missing@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('No matching registration was found. Try your first or last name, or register below.')).toBeInTheDocument();
    fireEvent.click(screen.getByText("Can't find your registration?"));

    expect(screen.getByText('Please provide your information below to register for the event and check in now.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Walk' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Up' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'walk@example.com' } });
    fireEvent.change(screen.getByLabelText('Confirm email'), { target: { value: 'typo@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register & Check In' }));

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
      expect(mockCheckInEventGuest).toHaveBeenCalledWith(createdCheckIn.id, 'general', event.id, { bypassAvailability: false });
    });
    expect(await screen.findByText(/Thanks, Walk!/)).toBeInTheDocument();
    expect(screen.getByText(/Please go to the check-in desk to receive your event package./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to Event' })).toBeInTheDocument();
    expect(screen.getByText('Total guests: 1')).toBeInTheDocument();
  });

  it('recovers an already-completed imported check-in from older local storage without showing pending staff state', async () => {
    localStorage.setItem('qme:eventCheckIn:event-1', JSON.stringify({
      id: 'stale-check-in-id',
      firstName: 'Evan',
      lastName: 'Guest',
      importedRegistrationId: 'registration-evan',
      phone: '2165550100',
    }));
    mockRecoverEventCheckInForGuest.mockResolvedValue({
      ...completedCheckIn,
      id: 'server-check-in-evan',
      first_name: 'Evan',
      last_name: 'Guest',
      status: 'completed',
      ticket_type: 'general',
      metadata: {
        imported_registration_id: 'registration-evan',
        party_size: 1,
      },
    });

    renderCheckIn();

    expect(await screen.findByText(/Thanks, Evan!/)).toBeInTheDocument();
    expect(screen.getByText(/Please go to the check-in desk to receive your event package./)).toBeInTheDocument();
    expect(screen.queryByText(/Please wait for the host/)).not.toBeInTheDocument();
    expect(mockRecoverEventCheckInForGuest).toHaveBeenCalledWith(event.id, expect.objectContaining({
      id: 'stale-check-in-id',
      importedRegistrationId: 'registration-evan',
      phone: '2165550100',
    }));
    expect(JSON.parse(localStorage.getItem('qme:eventCheckIn:event-1') || '{}')).toMatchObject({
      id: 'server-check-in-evan',
      firstName: 'Evan',
      lastName: 'Guest',
      importedRegistrationId: 'registration-evan',
    });
  });

  it.each([
    [1, 'Thanks, Paul! You are checked in.', 'Total guests: 1'],
    [2, 'Thanks, Paul! You and your 1 guest are checked in.', 'Total guests: 2'],
    [4, 'Thanks, Paul! You and your 3 guests are checked in.', 'Total guests: 4'],
  ])('shows party-size confirmation for imported registration with Tickets=%s', async (partySize, message, totalGuests) => {
    const user = userEvent.setup();
    mockSearchImportedRegistrationsForGuest.mockResolvedValue([{
      id: `registration-${partySize}`,
      first_name: 'Paul',
      last_name: 'Pitch',
      email_hint: 'pa**@example.com',
      ticket_hint: 'General Admission',
      party_size: partySize,
      external_order_id: `order-${partySize}`,
      headshot_entitled: false,
      already_checked_in: false,
      requires_email_confirmation: false,
    }]);
    mockCreateImportedRegistrationCheckInForGuest.mockResolvedValue({
      ...completedCheckIn,
      first_name: 'Paul',
      last_name: 'Pitch',
      metadata: {
        imported_registration_id: `registration-${partySize}`,
        external_order_id: `order-${partySize}`,
        party_size: partySize,
      },
    });
    mockGetEventCheckIn.mockResolvedValue({
      ...completedCheckIn,
      first_name: 'Paul',
      last_name: 'Pitch',
      metadata: {
        imported_registration_id: `registration-${partySize}`,
        external_order_id: `order-${partySize}`,
        party_size: partySize,
      },
    });

    renderCheckIn();

    const searchInput = await screen.findByPlaceholderText('First name, last name, or email');
    fireEvent.change(searchInput, { target: { value: 'Paul' } });
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(await screen.findByRole('button', { name: 'This is me' }));
    if (partySize > 1) {
      for (let position = 1; position < partySize; position += 1) {
        expect(await screen.findByLabelText(`Guest ${position} first name`)).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText(`Guest ${position} first name`), { target: { value: `Guest${position}` } });
        fireEvent.change(screen.getByLabelText(`Guest ${position} last name`), { target: { value: 'Friend' } });
      }
      await user.click(screen.getByRole('button', { name: 'Check In' }));
    }

    expect(await screen.findByText(new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
    expect(screen.getByText(/Please go to the check-in desk to receive your event package./)).toBeInTheDocument();
    expect(screen.getByText(totalGuests)).toBeInTheDocument();
  });

  it('captures named additional attendees with stable child identities and actual party size after removing an absent guest', async () => {
    const user = userEvent.setup();
    mockSearchImportedRegistrationsForGuest.mockResolvedValue([{
      id: 'registration-party',
      first_name: 'Mourad',
      last_name: 'Krifa',
      email_hint: 'mo**@example.com',
      ticket_hint: 'General Admission',
      party_size: 4,
      external_order_id: '123456789',
      headshot_entitled: false,
      already_checked_in: false,
      requires_email_confirmation: false,
    }]);
    mockCreateImportedRegistrationCheckInForGuest.mockImplementation(async (input) => ({
      ...completedCheckIn,
      first_name: 'Mourad',
      last_name: 'Krifa',
      metadata: {
        imported_registration_id: 'registration-party',
        external_order_id: '123456789',
        registered_party_size: 4,
        actual_party_size: 1 + input.additionalAttendees.length,
        party_size: 1 + input.additionalAttendees.length,
        tickets: 4,
        additional_attendees: input.additionalAttendees.map((guest: { position: number; first_name: string; last_name: string }) => ({
          position: guest.position,
          external_order_id: `123456789-${guest.position}`,
          first_name: guest.first_name,
          last_name: guest.last_name,
        })),
      },
    }));
    mockGetEventCheckIn.mockImplementation(async () => mockCreateImportedRegistrationCheckInForGuest.mock.results.at(-1)?.value ?? completedCheckIn);

    renderCheckIn();

    fireEvent.change(await screen.findByPlaceholderText('First name, last name, or email'), { target: { value: 'Mourad' } });
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(await screen.findByRole('button', { name: 'This is me' }));

    expect(await screen.findByLabelText('Guest 1 first name')).toBeInTheDocument();
    expect(screen.getByLabelText('Guest 2 first name')).toBeInTheDocument();
    expect(screen.getByLabelText('Guest 3 first name')).toBeInTheDocument();

    const removeButtons = screen.getAllByRole('button', { name: 'Remove guest' });
    await user.click(removeButtons[1]);
    expect(screen.queryByLabelText('Guest 2 first name')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Guest 1 first name'), { target: { value: 'Ava' } });
    fireEvent.change(screen.getByLabelText('Guest 1 last name'), { target: { value: 'One' } });
    fireEvent.change(screen.getByLabelText('Guest 3 first name'), { target: { value: 'Zed' } });
    fireEvent.change(screen.getByLabelText('Guest 3 last name'), { target: { value: 'Three' } });
    await user.click(screen.getByRole('button', { name: 'Check In' }));

    await waitFor(() => {
      expect(mockCreateImportedRegistrationCheckInForGuest).toHaveBeenCalledWith(expect.objectContaining({
        importedRegistrationId: 'registration-party',
        additionalAttendees: [
          { position: 1, first_name: 'Ava', last_name: 'One' },
          { position: 3, first_name: 'Zed', last_name: 'Three' },
        ],
      }));
    });
    expect(await screen.findByText(/Thanks, Mourad! You and your 2 guests are checked in./)).toBeInTheDocument();
    expect(screen.getByText('Total guests: 3')).toBeInTheDocument();
  });

  it('blocks whitespace-only additional guest names before completing the imported check-in', async () => {
    const user = userEvent.setup();
    mockSearchImportedRegistrationsForGuest.mockResolvedValue([{
      id: 'registration-whitespace',
      first_name: 'Pat',
      last_name: 'Party',
      email_hint: 'pa**@example.com',
      ticket_hint: 'General Admission',
      party_size: 2,
      external_order_id: 'order-whitespace',
      headshot_entitled: false,
      already_checked_in: false,
      requires_email_confirmation: false,
    }]);

    renderCheckIn();

    fireEvent.change(await screen.findByPlaceholderText('First name, last name, or email'), { target: { value: 'Pat' } });
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(await screen.findByRole('button', { name: 'This is me' }));
    fireEvent.change(await screen.findByLabelText('Guest 1 first name'), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText('Guest 1 last name'), { target: { value: 'Guest' } });
    await user.click(screen.getByRole('button', { name: 'Check In' }));

    expect(await screen.findByText('First and last name are required for each additional guest who is attending.')).toBeInTheDocument();
    expect(mockCreateImportedRegistrationCheckInForGuest).not.toHaveBeenCalled();
  });

  it('uses kiosk-specific completion wording with shared imported party-size confirmation', async () => {
    const user = userEvent.setup();
    mockSearchImportedRegistrationsForGuest.mockResolvedValue([{
      id: 'registration-meredith',
      first_name: 'Meredith',
      last_name: 'Guest',
      email_hint: 'me**@example.com',
      ticket_hint: 'General Admission',
      party_size: 2,
      external_order_id: 'order-meredith',
      headshot_entitled: false,
      already_checked_in: false,
      requires_email_confirmation: false,
    }]);
    mockCreateImportedRegistrationCheckInForGuest.mockResolvedValue({
      ...completedCheckIn,
      first_name: 'Meredith',
      last_name: 'Guest',
      metadata: {
        imported_registration_id: 'registration-meredith',
        external_order_id: 'order-meredith',
        party_size: 2,
      },
    });
    mockGetEventCheckIn.mockResolvedValue({
      ...completedCheckIn,
      first_name: 'Meredith',
      last_name: 'Guest',
      metadata: {
        imported_registration_id: 'registration-meredith',
        external_order_id: 'order-meredith',
        party_size: 2,
      },
    });

    renderCheckIn('/events/ipitch-2026/check-in?mode=shared');

    const searchInput = await screen.findByPlaceholderText('First name, last name, or email');
    fireEvent.change(searchInput, { target: { value: 'Meredith' } });
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(await screen.findByRole('button', { name: 'This is me' }));
    fireEvent.change(await screen.findByLabelText('Guest 1 first name'), { target: { value: 'Alex' } });
    fireEvent.change(screen.getByLabelText('Guest 1 last name'), { target: { value: 'Guest' } });
    await user.click(screen.getByRole('button', { name: 'Check In' }));

    expect(await screen.findByText(/Thanks, Meredith! You and your 1 guest are checked in./)).toBeInTheDocument();
    expect(screen.getByText(/Please show this confirmation to the person at the desk to receive your evening's event package./)).toBeInTheDocument();
    expect(screen.queryByText(/Please go to the check-in desk to receive your event package./)).not.toBeInTheDocument();
    expect(screen.getByText('Total guests: 2')).toBeInTheDocument();
    expect(screen.getByText('Next guest in 15 seconds...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next Guest' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to Event' })).not.toBeInTheDocument();
  });

  it('clears prior guest identity and starts clean for shared-device Next Guest', async () => {
    const user = userEvent.setup();
    renderCheckIn('/events/ipitch-2026/check-in?mode=shared');

    await screen.findByPlaceholderText('First name, last name, or email');
    expect(screen.getByText('Enter your name or email to find your registration.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument();
    expect(screen.queryByText('Recovery phone')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to Event' })).not.toBeInTheDocument();
    await user.click(screen.getByText("Can't find your registration?"));
    expect(screen.queryByRole('button', { name: 'Back to Event' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Walk' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Up' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'walk@example.com' } });
    fireEvent.change(screen.getByLabelText('Confirm email'), { target: { value: 'walk@example.com' } });
    localStorage.setItem('qme:guestSession:event-1', 'guest-a-token');
    localStorage.setItem('qme:voteAllocation:event-1:ece-1:check-in-1', JSON.stringify({ veesafe: 2 }));
    await user.click(screen.getByRole('button', { name: 'Register & Check In' }));

    expect(await screen.findByRole('button', { name: 'Next Guest' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to Event' })).not.toBeInTheDocument();
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
    expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument();
    expect(screen.getByText('Recovery phone')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to Event' })).toBeInTheDocument();
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
