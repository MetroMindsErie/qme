/**
 * Admin: List all events with Create / Edit / Delete capabilities.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { listEvents, deleteEvent } from '../../lib/eventService';
import { formatDate } from '../../lib/utils';
import type { QEvent } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

export default function AdminEventList() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<QEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await listEvents();
      setEvents(data);
    } catch (e) {
      console.error('Failed to load events', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}" and all its queues?`)) return;
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      console.error('Delete failed', e);
      alert('Failed to delete event.');
    }
  }

  const statusColor: Record<string, string> = {
    draft: '#999',
    active: '#00c853',
    completed: '#2196f3',
    cancelled: '#f44336',
  };

  return (
    <div className="card card-scrollable" style={{ maxWidth: 700, minHeight: '600px', maxHeight: '90vh' }}>
      <Header logoSrc="/images/qmeFirstLogo.jpg" titleLine1="ADMIN" titleLine2="EVENTS" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.25rem 0.75rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700 }}>Events</h1>
        <button
          className="actionBtn actionBtn-primary"
          style={{ margin: 0, width: 'auto', padding: '0.6rem 1.4rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          onClick={() => navigate('/admin/events/new')}
        >
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> New Event
        </button>
      </div>

      {loading && <p style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>Loading…</p>}

      {!loading && events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ fontSize: '1.1rem', color: '#999', marginBottom: '1rem' }}>
            No events yet. Create your first one!
          </p>
        </div>
      )}

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        {events.map((ev) => (
          <div
            key={ev.id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 10,
              padding: '1.25rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              background: '#fafafa',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link
                to={`/admin/events/${ev.id}`}
                style={{ fontWeight: 700, fontSize: '1.15rem', color: '#2f3e4f', textDecoration: 'none', display: 'block', marginBottom: '0.4rem' }}
              >
                {ev.name}
              </Link>
              <div style={{ fontSize: '0.88rem', color: '#555', marginBottom: '0.5rem' }}>
                📅 {formatDate(ev.event_date)} {ev.location && `· 📍 ${ev.location}`}
              </div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 6,
                  color: '#fff',
                  background: statusColor[ev.status] ?? '#999',
                  textTransform: 'capitalize',
                }}
              >
                {ev.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button
                className="actionBtn actionBtn-secondary"
                style={{ margin: 0, width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => navigate(`/admin/events/${ev.id}/edit`)}
              >
                ✏️ Edit
              </button>
              <button
                className="actionBtn actionBtn-danger"
                style={{ margin: 0, width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => handleDelete(ev.id, ev.name)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
