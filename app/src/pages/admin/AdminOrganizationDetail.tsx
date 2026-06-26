import { useCallback, useEffect, useState } from 'react';
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
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdminPrincipal | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!organizationId) return;
    try {
      const admin = await getCurrentAdminPrincipal();
      setCurrentAdmin(admin);
      if (admin && !canManageOrganization(admin, organizationId)) {
        setAccessDenied(true);
        return;
      }
      const [org, orgEvents, orgExpies] = await Promise.all([
        getOrganization(organizationId),
        listEvents({ organizationId }),
        listExpiesForOrganization(organizationId),
      ]);
      setOrganization(org);
      setEvents(orgEvents);
      setExpies(orgExpies);
    } catch (error) {
      console.error('Failed to load organization', error);
      alert('Organization not found');
      navigate('/admin/organizations');
    } finally {
      setLoading(false);
    }
  }, [organizationId, navigate]);

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
