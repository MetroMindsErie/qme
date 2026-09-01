import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminEventDetail from '../pages/admin/AdminEventDetail';
import type { CurrentAdminPrincipal } from '../lib/adminPrincipalService';
import type { Ece, QEvent } from '../types';

const mockNavigate = vi.fn();
const mockGetEvent = vi.fn();
const mockResetEventTestData = vi.fn();
const mockListEcesForEvent = vi.fn();
const mockUpdateEceSortOrder = vi.fn();
const mockDeleteEce = vi.fn();
const mockListEventCheckIns = vi.fn();
const mockGetCurrentAdminPrincipal = vi.fn();

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

vi.mock('../lib/adminPrincipalService', () => ({
  canAccessEvent: () => true,
  canManageEvent: (admin: CurrentAdminPrincipal | null) => Boolean(admin?.isSuperadmin),
  getCurrentAdminPrincipal: () => mockGetCurrentAdminPrincipal(),
}));

vi.mock('../lib/adminPrincipalAdminService', () => ({
  createAdminUserWithAuth: vi.fn(),
  resetStaffPasswordWithAuth: vi.fn(),
}));

function admin(isSuperadmin: boolean): CurrentAdminPrincipal {
  return {
    principal: {
      id: 'principal-1',
      auth_user_id: 'auth-1',
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
    isSuperadmin,
  };
}

vi.mock('../lib/eventService', () => ({
  getEvent: (...args: unknown[]) => mockGetEvent(...args),
  resetEventTestData: (...args: unknown[]) => mockResetEventTestData(...args),
}));

vi.mock('../lib/eceService', () => ({
  deleteEce: (...args: unknown[]) => mockDeleteEce(...args),
  listEcesForEvent: (...args: unknown[]) => mockListEcesForEvent(...args),
  updateEceSortOrder: (...args: unknown[]) => mockUpdateEceSortOrder(...args),
}));

vi.mock('../lib/checkInService', () => ({
  listEventCheckIns: (...args: unknown[]) => mockListEventCheckIns(...args),
  onEventCheckInsChange: () => () => undefined,
}));

vi.mock('../lib/eventStaffService', () => ({
  addEventStaffAssignment: vi.fn(),
  archiveEventStaffAssignment: vi.fn(),
  listEventStaff: () => Promise.resolve([]),
}));

vi.mock('../lib/organizationStaffService', () => ({
  findAdminPrincipalByEmail: vi.fn(),
}));

vi.mock('../lib/queueService', () => ({
  deleteQueue: vi.fn(),
  getQueueStageSummary: vi.fn(() => Promise.resolve({})),
  listQueuePilotTickets: vi.fn(() => Promise.resolve([])),
  listQueuesForEvent: vi.fn(() => Promise.resolve([])),
  onQueueTicketsChange: () => () => undefined,
}));

const event: QEvent = {
  id: 'event-1',
  organization_id: 'org-1',
  name: 'i-Pitch',
  slug: 'ipitch-092026',
  description: '',
  location: '',
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

function ece(id: string, name: string, sortOrder: number): Ece {
  return {
    id,
    event_id: event.id,
    expie_id: null,
    org_id: event.organization_id,
    type: 'info',
    queue_id: null,
    queue_behavior: '',
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: '',
    image_url: '',
    location: '',
    sort_order: sortOrder,
    starts_at: null,
    ends_at: null,
    metadata: {},
    status: 'active',
    created_at: `2026-09-01T00:00:0${sortOrder}.000Z`,
    updated_at: '',
  };
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/admin/events/event-1']}>
      <Routes>
        <Route path="/admin/events/:eventId" element={<AdminEventDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminEventDetail feature management and reset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentAdminPrincipal.mockResolvedValue(admin(true));
    mockGetEvent.mockResolvedValue(event);
    mockListEcesForEvent.mockResolvedValue([
      ece('ece-agenda', 'Agenda', 10),
      ece('ece-finalists', 'i-Pitch Finalists', 20),
      ece('ece-judges', 'Meet the Judges', 30),
    ]);
    mockListEventCheckIns.mockResolvedValue([]);
    mockUpdateEceSortOrder.mockImplementation((id: string, sortOrder: number) => Promise.resolve({
      ...ece(id, id, sortOrder),
      sort_order: sortOrder,
    }));
    mockResetEventTestData.mockResolvedValue(undefined);
  });

  it('lets a managing admin edit and reorder Event Features', async () => {
    renderDetail();

    fireEvent.click(await screen.findByRole('tab', { name: 'Setup' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Down' })[0]);

    await waitFor(() => {
      expect(mockUpdateEceSortOrder).toHaveBeenCalledWith('ece-finalists', 10);
      expect(mockUpdateEceSortOrder).toHaveBeenCalledWith('ece-agenda', 20);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/events/event-1/eces/ece-finalists/edit');
  });

  it('hides setup editing controls from non-managing admins', async () => {
    mockGetCurrentAdminPrincipal.mockResolvedValue(admin(false));

    renderDetail();

    expect(await screen.findByText('Agenda')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Setup' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Down' })).not.toBeInTheDocument();
  });

  it('requires the event slug before resetting reusable event test data', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValueOnce('SOTCRST').mockReturnValueOnce(event.slug);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    renderDetail();

    fireEvent.click(await screen.findByRole('tab', { name: 'Setup' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset Test Data' }));
    expect(mockResetEventTestData).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(`Reset was not run. Type ${event.slug} to confirm.`);

    fireEvent.click(screen.getByRole('button', { name: 'Reset Test Data' }));
    await waitFor(() => {
      expect(mockResetEventTestData).toHaveBeenCalledWith(event.id);
    });
    expect(promptSpy).toHaveBeenCalledWith(expect.stringContaining('Browser-local prototype state'));
  });
});
