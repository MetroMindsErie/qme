import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import {
  canManageOrganization,
  getCurrentAdminPrincipal,
  type CurrentAdminPrincipal,
} from '../../lib/adminPrincipalService';
import { listEvents } from '../../lib/eventService';
import { listExpiesForOrganization } from '../../lib/expieService';
import { getOrganization } from '../../lib/organizationService';
import {
  addOrganizationMembership,
  archiveOrganizationMembership,
  findAdminPrincipalByEmail,
  listOrganizationStaff,
  type OrganizationStaffMember,
  type OrganizationStaffRole,
} from '../../lib/organizationStaffService';
import { formatDate } from '../../lib/utils';
import type { Expie, Organization, QEvent } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

export default function AdminOrganizationDetail() {
  const navigate = useNavigate();
  const { organizationId } = useParams<{ organizationId: string }>();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [events, setEvents] = useState<QEvent[]>([]);
  const [expies, setExpies] = useState<Expie[]>([]);
  const [staffMembers, setStaffMembers] = useState<OrganizationStaffMember[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdminPrincipal | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<OrganizationStaffRole>('universal_staff');
  const [staffSaving, setStaffSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!organizationId) return;
    try {
      const admin = await getCurrentAdminPrincipal();
      setCurrentAdmin(admin);
      if (admin && !canManageOrganization(admin, organizationId)) {
        setAccessDenied(true);
        return;
      }
      const [org, orgEvents, orgExpies, orgStaff] = await Promise.all([
        getOrganization(organizationId),
        listEvents({ organizationId }),
        listExpiesForOrganization(organizationId),
        listOrganizationStaff(organizationId),
      ]);
      setOrganization(org);
      setEvents(orgEvents);
      setExpies(orgExpies);
      setStaffMembers(orgStaff);
    } catch (error) {
      console.error('Failed to load organization', error);
      alert('Organization not found');
      navigate('/admin/organizations');
    } finally {
      setLoading(false);
    }
  }, [organizationId, navigate]);

  async function handleAddStaffMember(event: FormEvent) {
    event.preventDefault();
    if (!organization || !currentAdmin || !staffEmail.trim()) return;
    setStaffSaving(true);
    try {
      const principal = await findAdminPrincipalByEmail(staffEmail);
      if (!principal) {
        alert('No active admin principal was found for that email. Create/link the admin principal first, then add them here.');
        return;
      }
      const alreadyHasRole = staffMembers.some(
        (member) => member.membership.principal_id === principal.id && member.membership.role === staffRole
      );
      if (alreadyHasRole) {
        alert('That admin already has this organization role.');
        return;
      }
      await addOrganizationMembership({
        organizationId: organization.id,
        principalId: principal.id,
        role: staffRole,
        grantedByPrincipalId: currentAdmin.principal.id,
      });
      setStaffEmail('');
      setStaffRole('universal_staff');
      setStaffMembers(await listOrganizationStaff(organization.id));
    } catch (error) {
      console.error('Failed to add staff member', error);
      alert('Could not add staff member. Check whether this person already has an active/duplicate role.');
    } finally {
      setStaffSaving(false);
    }
  }

  async function handleArchiveStaffMember(member: OrganizationStaffMember) {
    if (!organization) return;
    const name = member.principal?.display_name || member.principal?.email || 'this staff member';
    if (!confirm(`Remove ${name} from this organization role?`)) return;
    try {
      await archiveOrganizationMembership(member.membership.id);
      setStaffMembers(await listOrganizationStaff(organization.id));
    } catch (error) {
      console.error('Failed to remove staff member', error);
      alert('Could not remove staff member.');
    }
  }

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="card" style={{ minHeight: '600px', padding: '2rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h1 className="headline" style={{ fontSize: '1.4rem', margin: '0 0 0.75rem' }}>Organization access unavailable</h1>
          <p style={{ color: '#64748b', fontWeight: 700, lineHeight: 1.5 }}>
            This admin account does not have organization admin access here.
          </p>
          <button className="actionBtn actionBtn-secondary" type="button" onClick={() => navigate('/admin/events')}>
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  if (!organization) return null;
  const canManageThisOrganization = canManageOrganization(currentAdmin, organization.id);

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header logoSrc={organization.logo_url || '/images/qmeFirstLogo.jpg'} titleLine1="ADMIN" titleLine2="ORG" />

      <div style={{ padding: '0 1.25rem 1rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: '1.45rem', margin: '0 0 0.35rem', fontWeight: 800 }}>
          {organization.name}
        </h1>
        <p style={{ color: '#666', margin: 0, lineHeight: 1.45 }}>
          {organization.description || `Organization slug: ${organization.slug}`}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
          {canManageThisOrganization && (
          <button
            className="actionBtn actionBtn-primary"
            style={{ margin: 0, width: 'auto', padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
            onClick={() => navigate(`/admin/events/new?organizationId=${organization.id}`)}
          >
            + New Event
          </button>
          )}
          {canManageThisOrganization && (
          <button
            className="actionBtn actionBtn-primary"
            style={{ margin: 0, width: 'auto', padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
            onClick={() => navigate(`/admin/organizations/${organization.id}/expies/new`)}
          >
            + New Expie
          </button>
          )}
          <button
            className="actionBtn actionBtn-secondary"
            style={{ margin: 0, width: 'auto', padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
            onClick={() => navigate('/admin/organizations')}
          >
            Back to Organizations
          </button>
        </div>
      </div>

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.8rem', color: '#2f3e4f' }}>Events</h2>

        {events.length === 0 && (
          <p style={{ color: '#999', padding: '2rem 0', textAlign: 'center' }}>
            No events are attached to this organization yet.
          </p>
        )}

        {events.map((event) => (
          <div
            key={event.id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 10,
              padding: '1rem',
              marginBottom: '0.75rem',
              background: '#fafafa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 800, color: '#2f3e4f', fontSize: '1.05rem' }}>
                {event.name}
              </div>
              <div style={{ color: '#666', fontSize: '0.85rem', marginTop: 4 }}>
                {formatDate(event.event_date)} · /{event.slug} · {event.status}
              </div>
            </div>
            <button
              className="actionBtn actionBtn-primary"
              style={{ margin: 0, width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
              onClick={() => navigate(`/admin/events/${event.id}`)}
            >
              Manage
            </button>
          </div>
        ))}

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.35rem', color: '#2f3e4f' }}>
            Organization Staff
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.85rem', lineHeight: 1.45 }}>
            Add existing admin principals here. Invite emails and new-user creation are still handled separately during this foundation pass.
          </p>

          {canManageThisOrganization && (
            <form
              onSubmit={handleAddStaffMember}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 10,
                padding: '1rem',
                marginBottom: '0.9rem',
                background: '#fafafa',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.65rem',
                alignItems: 'end',
              }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#2f3e4f', fontSize: '0.82rem', fontWeight: 800, flex: '1 1 210px' }}>
                Admin Email
                <input
                  value={staffEmail}
                  onChange={(event) => setStaffEmail(event.target.value)}
                  type="email"
                  placeholder="staff@example.com"
                  style={{
                    padding: '0.65rem 0.75rem',
                    border: '1.5px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: '0.95rem',
                  }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#2f3e4f', fontSize: '0.82rem', fontWeight: 800, flex: '1 1 160px' }}>
                Role
                <select
                  value={staffRole}
                  onChange={(event) => setStaffRole(event.target.value as OrganizationStaffRole)}
                  style={{
                    padding: '0.65rem 0.75rem',
                    border: '1.5px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: '0.95rem',
                    background: '#fff',
                  }}
                >
                  <option value="universal_staff">Universal staff</option>
                  <option value="org_admin">Organization admin</option>
                </select>
              </label>
              <button
                className="actionBtn actionBtn-primary"
                type="submit"
                disabled={staffSaving || !staffEmail.trim()}
                style={{ margin: 0, width: 'auto', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
              >
                {staffSaving ? 'Adding...' : 'Add Staff'}
              </button>
            </form>
          )}

          {staffMembers.length === 0 && (
            <p style={{ color: '#999', padding: '1.25rem 0', textAlign: 'center' }}>
              No organization staff have been assigned yet.
            </p>
          )}

          {staffMembers.map((member) => (
            <div
              key={member.membership.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 10,
                padding: '1rem',
                marginBottom: '0.75rem',
                background: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#2f3e4f', fontSize: '1.02rem' }}>
                  {member.principal?.display_name || member.principal?.email || 'Unknown admin principal'}
                </div>
                <div style={{ color: '#666', fontSize: '0.85rem', marginTop: 4 }}>
                  {(member.principal?.email || 'No email')} · {member.membership.role.replace('_', ' ')}
                </div>
              </div>
              {canManageThisOrganization && (
                <button
                  className="actionBtn actionBtn-danger"
                  type="button"
                  style={{ margin: 0, width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                  onClick={() => handleArchiveStaffMember(member)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.8rem', color: '#2f3e4f' }}>
            Reusable Expies
          </h2>

          {expies.length === 0 && (
            <p style={{ color: '#999', padding: '1.25rem 0', textAlign: 'center' }}>
              No reusable expies yet. Create expies here, then place them into events as eCes.
            </p>
          )}

          {expies.map((expie) => (
            <div
              key={expie.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 10,
                padding: '1rem',
                marginBottom: '0.75rem',
                background: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#2f3e4f', fontSize: '1.05rem' }}>
                  {expie.name}
                </div>
                <div style={{ color: '#666', fontSize: '0.85rem', marginTop: 4 }}>
                  {expie.type.replace('_', '-')} · /{expie.slug} · {expie.status}
                </div>
                {expie.description && (
                  <div style={{ color: '#555', fontSize: '0.9rem', marginTop: 6 }}>
                    {expie.description}
                  </div>
                )}
              </div>
              {canManageThisOrganization && (
              <button
                className="actionBtn actionBtn-secondary"
                style={{ margin: 0, width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                onClick={() => navigate(`/admin/organizations/${organization.id}/expies/${expie.id}/edit`)}
              >
                Edit
              </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
