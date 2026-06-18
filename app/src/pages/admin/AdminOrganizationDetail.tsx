import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { listEvents } from '../../lib/eventService';
import { getOrganization } from '../../lib/organizationService';
import { formatDate } from '../../lib/utils';
import type { Organization, QEvent } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

export default function AdminOrganizationDetail() {
  const navigate = useNavigate();
  const { organizationId } = useParams<{ organizationId: string }>();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [events, setEvents] = useState<QEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!organizationId) return;
    try {
      const [org, orgEvents] = await Promise.all([
        getOrganization(organizationId),
        listEvents({ organizationId }),
      ]);
      setOrganization(org);
      setEvents(orgEvents);
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

  if (!organization) return null;

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
          <button
            className="actionBtn actionBtn-primary"
            style={{ margin: 0, width: 'auto', padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
            onClick={() => navigate(`/admin/events/new?organizationId=${organization.id}`)}
          >
            + New Event
          </button>
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
      </div>
    </div>
  );
}
