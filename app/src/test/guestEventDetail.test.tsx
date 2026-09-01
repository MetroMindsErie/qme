import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GuestEventDetail from '../pages/guest/GuestEventDetail';
import type { EventCheckIn, QEvent } from '../types';

const event: QEvent = {
  id: 'event-1',
  organization_id: null,
  name: 'SOTC Test Event',
  slug: 'sotc-rockhall',
  description: 'Registration and event home',
  location: 'Akron',
  image_url: '',
  event_date: '2026-09-03',
  start_time: '17:00',
  end_time: '20:00',
  timezone: 'ET',
  status: 'active',
  metadata: {
    check_in: {
      enabled: true,
      completion_mode: 'staff',
      require_completed_for_participation: true,
    },
  },
  created_at: '',
  updated_at: '',
};

const completedCheckIn: EventCheckIn = {
  id: 'check-in-1',
  event_id: 'event-1',
  guest_session_id: 'guest-session-1',
  first_name: 'Hannah',
  last_name: 'Oswick',
  code: null,
  ticket_type: 'general',
  status: 'completed',
  metadata: {},
  created_at: '',
  updated_at: '',
};

const mockGetEventBySlug = vi.fn();
const mockGetEventCheckIn = vi.fn();
const mockListActiveEcesForEvent = vi.fn();

vi.mock('../lib/eventService', () => ({
  getEventBySlug: (...args: unknown[]) => mockGetEventBySlug(...args),
}));

vi.mock('../lib/queueService', () => ({
  getActiveQueueTicketForGuest: vi.fn(),
  getAuthoritativeQueueTicketForGuest: vi.fn(),
  getActiveTicketCountForQueue: vi.fn(),
  getNowServing: vi.fn(),
  isAdoptableQueueTicket: vi.fn(() => false),
  listQueuePilotTickets: vi.fn(() => Promise.resolve([])),
  listQueuesForEvent: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../lib/eceService', () => ({
  listActiveEcesForEvent: (...args: unknown[]) => mockListActiveEcesForEvent(...args),
}));

vi.mock('../lib/checkInService', () => ({
  getEventCheckIn: (...args: unknown[]) => mockGetEventCheckIn(...args),
}));

vi.mock('../lib/guestCreditService', () => ({
  getGuestCreditForCheckIn: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('../lib/guestResetService', () => ({
  clearGuestStateAfterEventReset: vi.fn(() => false),
  getEventTestDataResetMarker: vi.fn(() => ''),
}));

function renderEventDetail(path = '/events/sotc-rockhall') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/events/:eventSlug" element={<GuestEventDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('GuestEventDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetEventBySlug.mockResolvedValue(event);
    mockGetEventCheckIn.mockResolvedValue(completedCheckIn);
    mockListActiveEcesForEvent.mockResolvedValue([]);
  });

  it('renders the event home after loading for a fresh unrecognized guest', async () => {
    renderEventDetail();

    expect(await screen.findByText('SOTC Test Event')).toBeInTheDocument();
    expect(screen.getByText('Event Check-In')).toBeInTheDocument();
  });

  it('renders after adopting an existing checked-in guest from browser storage', async () => {
    localStorage.setItem('qme:eventCheckIn:event-1', JSON.stringify({
      id: completedCheckIn.id,
      firstName: completedCheckIn.first_name,
      lastName: completedCheckIn.last_name,
    }));

    renderEventDetail();

    await waitFor(() => {
      expect(mockGetEventCheckIn).toHaveBeenCalledWith(completedCheckIn.id, event.id);
    });
    expect(await screen.findByText('SOTC Test Event')).toBeInTheDocument();
    expect(screen.getByText('You are checked in. Return to the event page for next steps.')).toBeInTheDocument();
    expect(screen.queryByText(/Pick up your name tag at registration/)).not.toBeInTheDocument();
  });

  it('uses the configured post-check-in instruction on the checked-in event card', async () => {
    mockGetEventBySlug.mockResolvedValue({
      ...event,
      name: 'i-Pitch',
      slug: 'ipitch-092026',
      metadata: {
        check_in: {
          enabled: true,
          completion_mode: 'auto',
          require_completed_for_participation: true,
          post_check_in_instruction: 'Please go to the check-in desk to receive your event package.',
        },
      },
    });
    localStorage.setItem('qme:eventCheckIn:event-1', JSON.stringify({
      id: completedCheckIn.id,
      firstName: completedCheckIn.first_name,
      lastName: completedCheckIn.last_name,
    }));

    renderEventDetail('/events/ipitch-092026');

    expect(await screen.findByText('i-Pitch')).toBeInTheDocument();
    expect(screen.getByText('You are checked in. Please go to the check-in desk to receive your event package.')).toBeInTheDocument();
    expect(screen.queryByText(/schedule, resources, and headshots/)).not.toBeInTheDocument();
  });

  it('uses mode-aware Check-In card copy and neutral feature taxonomy', async () => {
    mockGetEventBySlug.mockResolvedValue({
      ...event,
      name: 'i-Pitch',
      slug: 'ipitch-092026',
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
    });

    renderEventDetail('/events/ipitch-092026');

    expect(await screen.findByText('i-Pitch')).toBeInTheDocument();
    expect(screen.getByText("Find your registration and check in when you arrive. If you're not on the list, you can register here.")).toBeInTheDocument();
    expect(screen.getByText('Feature')).toBeInTheDocument();
    expect(screen.queryByText('Sessions')).not.toBeInTheDocument();
  });

  it('shows configured finalists content independently of voting', async () => {
    mockGetEventBySlug.mockResolvedValue({
      ...event,
      name: 'i-Pitch',
      slug: 'ipitch-092026',
    });
    mockListActiveEcesForEvent.mockResolvedValue([
      {
        id: 'ece-finalists',
        event_id: event.id,
        expie_id: null,
        org_id: null,
        type: 'info',
        queue_id: null,
        queue_behavior: '',
        name: 'i-Pitch Finalists',
        slug: 'ipitch-finalists',
        description: "Meet tonight's four finalists.",
        image_url: '',
        location: '',
        sort_order: 20,
        starts_at: null,
        ends_at: null,
        metadata: {
          interaction_mode: 'content_list',
          content_list: {
            title: 'i-Pitch Finalists',
            items: [
              { name: 'VeeSafe', description: 'Cybersecurity guidance.' },
            ],
          },
        },
        status: 'active',
        created_at: '',
        updated_at: '',
      },
    ]);

    renderEventDetail('/events/ipitch-092026');

    expect(await screen.findByText('i-Pitch Finalists')).toBeInTheDocument();
    expect(screen.getByText("Meet tonight's four finalists.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/events/ipitch-092026/content/ipitch-finalists');
    expect(screen.queryByRole('link', { name: 'Vote' })).not.toBeInTheDocument();
  });

  it('renders expanded-on-home content without an Open click', async () => {
    mockGetEventBySlug.mockResolvedValue({
      ...event,
      name: 'i-Pitch',
      slug: 'ipitch-092026',
    });
    mockListActiveEcesForEvent.mockResolvedValue([
      {
        id: 'ece-agenda',
        event_id: event.id,
        expie_id: null,
        org_id: null,
        type: 'info',
        queue_id: null,
        queue_behavior: '',
        name: 'Agenda',
        slug: 'agenda',
        description: "Tonight's schedule.",
        image_url: '',
        location: '',
        sort_order: 10,
        starts_at: null,
        ends_at: null,
        metadata: {
          interaction_mode: 'content_list',
          content_list: {
            title: 'Agenda',
            presentation_mode: 'expanded_home',
            items: [
              { name: '5:00 PM', description: 'Doors Open & Network' },
              { name: '5:30 PM', description: "Let's Begin!" },
            ],
          },
        },
        status: 'active',
        created_at: '',
        updated_at: '',
      },
    ]);

    renderEventDetail('/events/ipitch-092026');

    expect(await screen.findByText('Agenda')).toBeInTheDocument();
    expect(screen.getAllByText('5:00 PM').length).toBeGreaterThan(0);
    expect(screen.getByText('Doors Open & Network')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open' })).not.toBeInTheDocument();
  });

  it('renders child-card content with individual detail links and no inactive voting controls', async () => {
    mockGetEventBySlug.mockResolvedValue({
      ...event,
      name: 'i-Pitch',
      slug: 'ipitch-092026',
    });
    mockListActiveEcesForEvent.mockResolvedValue([
      {
        id: 'ece-finalists',
        event_id: event.id,
        expie_id: null,
        org_id: null,
        type: 'info',
        queue_id: null,
        queue_behavior: '',
        name: 'i-Pitch Finalists',
        slug: 'ipitch-finalists',
        description: "Meet tonight's four finalists.",
        image_url: '',
        location: '',
        sort_order: 20,
        starts_at: null,
        ends_at: null,
        metadata: {
          interaction_mode: 'content_list',
          content_list: {
            title: 'i-Pitch Finalists',
            presentation_mode: 'child_cards',
            voting: {
              enabled: false,
              state: 'closed',
              credit_limit: 2,
            },
            items: [
              { name: 'Quantum Fluent', summary: 'Technical content.', description: 'Full detail.' },
              { name: 'VeeSafe', summary: 'Cybersecurity guidance.', description: 'Full detail.' },
            ],
          },
        },
        status: 'active',
        created_at: '',
        updated_at: '',
      },
    ]);

    renderEventDetail('/events/ipitch-092026');

    expect(await screen.findByText('i-Pitch Finalists')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Quantum Fluent/ })).toHaveAttribute('href', '/events/ipitch-092026/content/ipitch-finalists/quantum-fluent');
    expect(screen.getByRole('link', { name: /VeeSafe/ })).toHaveAttribute('href', '/events/ipitch-092026/content/ipitch-finalists/veesafe');
    expect(screen.queryByRole('link', { name: 'Vote' })).not.toBeInTheDocument();
  });

  it('maps child-card summary to event home and omits blank image placeholders', async () => {
    mockGetEventBySlug.mockResolvedValue({
      ...event,
      name: 'i-Pitch',
      slug: 'ipitch-092026',
    });
    mockListActiveEcesForEvent.mockResolvedValue([
      {
        id: 'ece-finalists',
        event_id: event.id,
        expie_id: null,
        org_id: null,
        type: 'info',
        queue_id: null,
        queue_behavior: '',
        name: 'i-Pitch Finalists',
        slug: 'ipitch-finalists',
        description: "Meet tonight's four finalists.",
        image_url: '',
        location: '',
        sort_order: 20,
        starts_at: null,
        ends_at: null,
        metadata: {
          interaction_mode: 'content_list',
          content_list: {
            title: 'i-Pitch Finalists',
            presentation_mode: 'child_cards',
            items: [
              { name: 'VeeSafe', summary: 'Home-card summary only.', description: 'Full detail for the child page.', image_url: '' },
            ],
          },
        },
        status: 'active',
        created_at: '',
        updated_at: '',
      },
    ]);

    const { container } = renderEventDetail('/events/ipitch-092026');

    expect(await screen.findByText('Home-card summary only.')).toBeInTheDocument();
    expect(screen.queryByText('Full detail for the child page.')).not.toBeInTheDocument();
    expect(screen.queryByText('*')).not.toBeInTheDocument();
    expect(container.querySelector('.ed-home-section-default img')).toBeNull();
  });
});
