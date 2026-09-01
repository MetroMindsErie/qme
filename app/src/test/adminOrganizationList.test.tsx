import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminOrganizationList from '../pages/admin/AdminOrganizationList';
import type { CurrentAdminPrincipal } from '../lib/adminPrincipalService';
import type { Organization } from '../types';

const mockNavigate = vi.fn();
const mockGetCurrentAdminPrincipal = vi.fn();
const mockGetManagedOrganizationIds = vi.fn();
const mockListOrganizations = vi.fn();
const mockCreateOrganization = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../lib/adminPrincipalService', () => ({
  getCurrentAdminPrincipal: () => mockGetCurrentAdminPrincipal(),
  getManagedOrganizationIds: (admin: CurrentAdminPrincipal | null) => mockGetManagedOrganizationIds(admin),
}));

vi.mock('../lib/organizationService', () => ({
  listOrganizations: (opts?: { ids?: string[] }) => mockListOrganizations(opts),
  createOrganization: (input: unknown) => mockCreateOrganization(input),
}));

function organization(overrides: Partial<Organization> = {}): Organization {
  return {
    id: 'org-1',
    name: 'Existing Org',
    slug: 'existing-org',
    description: '',
    logo_url: '',
    status: 'active',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function admin(isSuperadmin: boolean): CurrentAdminPrincipal {
  return {
    principal: {
      id: 'principal-1',
      auth_user_id: 'user-1',
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

describe('AdminOrganizationList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetManagedOrganizationIds.mockReturnValue([]);
    mockListOrganizations.mockResolvedValue([organization()]);
  });

  it('lets a superadmin create an organization and adds it to the list', async () => {
    const user = userEvent.setup();
    mockGetCurrentAdminPrincipal.mockResolvedValue(admin(true));
    mockCreateOrganization.mockResolvedValue(organization({
      id: 'org-2',
      name: 'New Partner',
      slug: 'new-partner',
      description: 'Partner org',
      status: 'inactive',
    }));

    render(<MemoryRouter><AdminOrganizationList /></MemoryRouter>);

    await user.click(await screen.findByText('+ New Organization'));
    await user.type(screen.getByLabelText('Name *'), 'New Partner');
    await user.type(screen.getByLabelText('Description'), 'Partner org');
    await user.selectOptions(screen.getByLabelText('Status'), 'inactive');
    await user.click(screen.getByText('Create Organization'));

    await waitFor(() => {
      expect(mockCreateOrganization).toHaveBeenCalledWith({
        name: 'New Partner',
        slug: 'new-partner',
        description: 'Partner org',
        logo_url: '',
        status: 'inactive',
      });
    });
    expect(await screen.findByText('New Partner')).toBeInTheDocument();
  });

  it('does not show organization creation to non-superadmin organization admins', async () => {
    mockGetCurrentAdminPrincipal.mockResolvedValue(admin(false));
    mockGetManagedOrganizationIds.mockReturnValue(['org-1']);

    render(<MemoryRouter><AdminOrganizationList /></MemoryRouter>);

    expect(await screen.findByText('Existing Org')).toBeInTheDocument();
    expect(screen.queryByText('+ New Organization')).not.toBeInTheDocument();
  });
});
