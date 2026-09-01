import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminEceForm from '../pages/admin/AdminEceForm';
import GuestContentList from '../pages/guest/GuestContentList';
import GuestEventDetail from '../pages/guest/GuestEventDetail';
import type { CreateEceInput, Ece, EventCheckIn, Expie, QEvent, UpdateEceInput } from '../types';

const exactRow = 'VeeSafe | Cybersecurity and compliance guidance made practical for small businesses and startups. | VeeSafe Technology provides practical cybersecurity and compliance guidance for small businesses, startups, and technical founders. Our goal is to make security make sense by turning confusing requirements into clear actions businesses can actually use.';

const mockNavigate = vi.fn();
const mockCreateEce = vi.fn();
const mockGetEce = vi.fn();
const mockUpdateEce = vi.fn();
const mockGetEvent = vi.fn();
const mockGetEventBySlug = vi.fn();
const mockListActiveEcesForEvent = vi.fn();
const mockListExpiesForOrganization = vi.fn();
const mockListQueuesForEvent = vi.fn();
const mockGetEventCheckIn = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../components/Header', () => ({
  default: ({ titleLine1, titleLine2 }: { titleLine1: string; titleLine2: string }) => (
    <header>{titleLine1} {titleLine2}</header>
  ),
}));

vi.mock('../lib/eceService', () => ({
  createEce: (...args: unknown[]) => mockCreateEce(...args),
  getEce: (...args: unknown[]) => mockGetEce(...args),
  listActiveEcesForEvent: (...args: unknown[]) => mockListActiveEcesForEvent(...args),
  updateEce: (...args: unknown[]) => mockUpdateEce(...args),
}));

vi.mock('../lib/eventService', () => ({
  getEvent: (...args: unknown[]) => mockGetEvent(...args),
  getEventBySlug: (...args: unknown[]) => mockGetEventBySlug(...args),
}));

vi.mock('../lib/expieService', () => ({
  listExpiesForOrganization: (...args: unknown[]) => mockListExpiesForOrganization(...args),
}));

vi.mock('../lib/queueService', () => ({
  createQueue: vi.fn(),
  getActiveQueueTicketForGuest: vi.fn(),
  getActiveTicketCountForQueue: vi.fn(),
  getAuthoritativeQueueTicketForGuest: vi.fn(),
  getNowServing: vi.fn(),
  isAdoptableQueueTicket: vi.fn(() => false),
  listQueuePilotTickets: vi.fn(() => Promise.resolve([])),
  listQueuesForEvent: (...args: unknown[]) => mockListQueuesForEvent(...args),
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

const event: QEvent = {
  id: 'event-1',
  organization_id: 'org-1',
  name: 'i-Pitch',
  slug: 'ipitch-092026',
  description: '',
  location: 'Akron',
  image_url: '',
  event_date: '2026-09-03',
  start_time: '17:00',
  end_time: '20:00',
  timezone: 'ET',
  status: 'active',
  metadata: {},
  created_at: '',
  updated_at: '',
};

const expie: Expie = {
  id: 'expie-1',
  organization_id: 'org-1',
  name: 'Event Content List',
  slug: 'event-content-list',
  description: '',
  image_url: '',
  type: 'info',
  default_queue_behavior: '',
  default_metadata: {},
  status: 'active',
  created_at: '',
  updated_at: '',
};

const baseEce: Ece = {
  id: 'ece-finalists',
  event_id: event.id,
  expie_id: expie.id,
  org_id: 'org-1',
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
      enabled: true,
      title: 'i-Pitch Finalists',
      presentation_mode: 'child_cards',
      items: [],
    },
  },
  status: 'active',
  created_at: '',
  updated_at: '',
};

const completedCheckIn: EventCheckIn = {
  id: 'check-in-1',
  event_id: event.id,
  guest_session_id: 'guest-session-1',
  first_name: 'Test',
  last_name: 'Guest',
  code: null,
  ticket_type: 'general',
  status: 'completed',
  metadata: {},
  created_at: '',
  updated_at: '',
};

function renderAdminForm() {
  return render(
    <MemoryRouter initialEntries={['/admin/events/event-1/eces/ece-finalists/edit']}>
      <Routes>
        <Route path="/admin/events/:eventId/eces/:eceId/edit" element={<AdminEceForm />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderHome(ece: Ece) {
  return render(
    <MemoryRouter initialEntries={['/events/ipitch-092026']}>
      <Routes>
        <Route path="/events/:eventSlug" element={<GuestEventDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderChildDetail(ece: Ece) {
  return render(
    <MemoryRouter initialEntries={['/events/ipitch-092026/content/ipitch-finalists/veesafe']}>
      <Routes>
        <Route path="/events/:eventSlug/content/:eceSlug/:itemSlug" element={<GuestContentList />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('admin-saved child card rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetEvent.mockResolvedValue(event);
    mockGetEventBySlug.mockResolvedValue(event);
    mockGetEce.mockResolvedValue(baseEce);
    mockListExpiesForOrganization.mockResolvedValue([expie]);
    mockListQueuesForEvent.mockResolvedValue([]);
    mockGetEventCheckIn.mockResolvedValue(completedCheckIn);
  });

  it('preserves three-field rows as summary plus full detail with no image through save and guest render', async () => {
    mockUpdateEce.mockImplementation((_id: string, input: UpdateEceInput) => Promise.resolve({ ...baseEce, ...input }));

    const admin = renderAdminForm();
    fireEvent.change(await screen.findByDisplayValue('Child cards on event home'), { target: { value: 'child_cards' } });
    const listItemsInput = admin.container.querySelector('textarea[placeholder="Name | Description | optional image URL"]');
    expect(listItemsInput).not.toBeNull();
    fireEvent.change(listItemsInput!, { target: { value: exactRow } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(mockUpdateEce).toHaveBeenCalled());
    const savedInput = mockUpdateEce.mock.calls[0][1] as UpdateEceInput;
    const savedEce: Ece = {
      ...baseEce,
      ...savedInput,
      id: baseEce.id,
      event_id: baseEce.event_id,
      org_id: baseEce.org_id,
    } as Ece;
    expect(savedEce.metadata.content_list).toMatchObject({
      items: [
        expect.objectContaining({
          name: 'VeeSafe',
          summary: 'Cybersecurity and compliance guidance made practical for small businesses and startups.',
          description: 'VeeSafe Technology provides practical cybersecurity and compliance guidance for small businesses, startups, and technical founders. Our goal is to make security make sense by turning confusing requirements into clear actions businesses can actually use.',
          imageUrl: '',
        }),
      ],
    });

    admin.unmount();
    mockListActiveEcesForEvent.mockResolvedValue([savedEce]);

    const home = renderHome(savedEce);
    expect(await screen.findByText('Cybersecurity and compliance guidance made practical for small businesses and startups.')).toBeInTheDocument();
    expect(screen.queryByText(/VeeSafe Technology provides practical/)).not.toBeInTheDocument();
    expect(home.container.querySelector('.ed-home-section-default img')).toBeNull();
    expect(screen.queryByText('*')).not.toBeInTheDocument();

    home.unmount();
    renderChildDetail(savedEce);
    expect(await screen.findByText(/VeeSafe Technology provides practical cybersecurity/)).toBeInTheDocument();
    expect(screen.queryByText('Cybersecurity and compliance guidance made practical for small businesses and startups.')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('recovers previously mis-saved non-url imageUrl detail as full detail and suppresses image rendering', async () => {
    const savedEce: Ece = {
      ...baseEce,
      metadata: {
        interaction_mode: 'content_list',
        content_list: {
          enabled: true,
          title: 'i-Pitch Finalists',
          presentation_mode: 'child_cards',
          items: [
            {
              name: 'VeeSafe',
              description: 'Cybersecurity and compliance guidance made practical for small businesses and startups.',
              imageUrl: 'VeeSafe Technology provides practical cybersecurity and compliance guidance for small businesses, startups, and technical founders.',
            },
          ],
        },
      },
    };
    mockListActiveEcesForEvent.mockResolvedValue([savedEce]);

    renderChildDetail(savedEce);

    expect(await screen.findByText(/VeeSafe Technology provides practical cybersecurity/)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
