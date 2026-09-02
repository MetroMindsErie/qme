import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminEventForm from '../pages/admin/AdminEventForm';
import type { QEvent, Organization } from '../types';
import type { CurrentAdminPrincipal } from '../lib/adminPrincipalService';

const mockNavigate = vi.fn();
const mockGetCurrentAdminPrincipal = vi.fn();
const mockListOrganizations = vi.fn();
const mockGetEvent = vi.fn();
const mockCreateEvent = vi.fn();
const mockUpdateEvent = vi.fn();

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
  canManageEvent: vi.fn(() => true),
  canManageOrganization: vi.fn(() => true),
  getCurrentAdminPrincipal: (...args: unknown[]) => mockGetCurrentAdminPrincipal(...args),
  getManagedOrganizationIds: vi.fn(() => []),
}));

vi.mock('../lib/organizationService', () => ({
  listOrganizations: (...args: unknown[]) => mockListOrganizations(...args),
}));

vi.mock('../lib/eventService', () => ({
  createEvent: (...args: unknown[]) => mockCreateEvent(...args),
  getEvent: (...args: unknown[]) => mockGetEvent(...args),
  updateEvent: (...args: unknown[]) => mockUpdateEvent(...args),
}));

const admin: CurrentAdminPrincipal = {
  principal: {
    id: 'principal-1',
    auth_user_id: null,
    principal_type: 'person',
    display_name: 'Super Admin',
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

const organization: Organization = {
  id: 'org-1',
  name: 'UARF',
  slug: 'uarf',
  description: '',
  logo_url: '',
  status: 'active',
  created_at: '',
  updated_at: '',
};

const event: QEvent = {
  id: 'event-1',
  organization_id: 'org-1',
  name: 'i-Pitch',
  slug: 'ipitch-092026',
  description: '',
  location: 'Akron',
  image_url: '/images/ipitch-logo.png',
  event_date: '2026-09-03',
  start_time: '17:00',
  end_time: '20:00',
  timezone: 'ET',
  status: 'active',
  metadata: {
    check_in: {
      enabled: true,
      completion_mode: 'auto',
    },
    guest_theme: {
      primary_accent: '#4B2E83',
      secondary_accent: '#2563EB',
      highlight_accent: '#F59E0B',
      header_image_url: '/images/ipitch-banner.jpg',
    },
  },
  created_at: '',
  updated_at: '',
};

function renderEditForm() {
  return render(
    <MemoryRouter initialEntries={['/admin/events/event-1/edit']}>
      <Routes>
        <Route path="/admin/events/:eventId/edit" element={<AdminEventForm />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminEventForm guest event theme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentAdminPrincipal.mockResolvedValue(admin);
    mockListOrganizations.mockResolvedValue([organization]);
    mockGetEvent.mockResolvedValue(event);
    mockUpdateEvent.mockResolvedValue(event);
    mockCreateEvent.mockResolvedValue(event);
  });

  it('reloads and persists bounded guest theme metadata through normal event admin', async () => {
    renderEditForm();

    expect(await screen.findByText('Guest Event Theme')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#4B2E83')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#2563EB')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#F59E0B')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/images/ipitch-banner.jpg')).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('#4B2E83'), { target: { value: '#522D80' } });
    fireEvent.change(screen.getByDisplayValue('#2563EB'), { target: { value: '#008EE6' } });
    fireEvent.change(screen.getByDisplayValue('#F59E0B'), { target: { value: '#F59F00' } });
    fireEvent.change(screen.getByDisplayValue('/images/ipitch-banner.jpg'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/ }));

    await waitFor(() => {
      expect(mockUpdateEvent).toHaveBeenCalledWith('event-1', expect.objectContaining({
        metadata: expect.objectContaining({
          check_in: event.metadata?.check_in,
          guest_theme: {
            primary_accent: '#522D80',
            secondary_accent: '#008EE6',
            highlight_accent: '#F59F00',
          },
        }),
      }));
    });
    expect(mockNavigate).toHaveBeenCalledWith('/admin/events');
  });
});
