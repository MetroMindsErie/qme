/**
 * Admin: View event details + manage its queues (list, create, delete).
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Header from '../../components/Header';
import { getEvent } from '../../lib/eventService';
import { listQueuesForEvent, deleteQueue } from '../../lib/queueService';
import { formatDate, formatTime } from '../../lib/utils';
import type { QEvent, Queue } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

export default function AdminEventDetail() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<QEvent | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!eventId) return;
    try {
      const [ev, qs] = await Promise.all([
        getEvent(eventId),
        listQueuesForEvent(eventId),
      ]);
      setEvent(ev);
      setQueues(qs);
    } catch (e) {
      console.error('Failed to load event', e);
      alert('Event not found');
      navigate('/admin/events');
    } finally {
      setLoading(false);
    }
  }, [eventId, navigate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleDeleteQueue(qId: string, name: string) {
    if (!confirm(`Delete queue "${name}" and all its tickets?`)) return;
    try {
      await deleteQueue(qId);
      setQueues((prev) => prev.filter((q) => q.id !== qId));
    } catch (e) {
      console.error('Delete queue failed', e);
      alert('Failed to delete queue.');
    }
  }

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading…</p>
      </div>
    );
  }

  if (!event) return null;

  const statusColor: Record<string, string> = {
    active: '#00c853',
    paused: '#ff9800',
    closed: '#f44336',
  };

  return (
    <div className="card card-scrollable" style={{ maxWidth: 700, minHeight: '600px', maxHeight: '90vh' }}>
      <Header logoSrc="/images/qmeFirstLogo.jpg" titleLine1="ADMIN" titleLine2="EVENT" />

      {/* Event summary */}
      <div style={{ padding: '0 1.25rem 1rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>{event.name}</h1>
        <p style={{ color: '#666', margin: '0 0 0.75rem', lineHeight: 1.5 }}>{event.description}</p>
        <div style={{ fontSize: '0.88rem', color: '#555', marginBottom: '0.75rem', lineHeight: 1.6 }}>
          📍 {event.location || '—'}<br/>
          📅 {formatDate(event.event_date)}<br/>
          🕐 {formatTime(event.start_time)} – {formatTime(event.end_time)} {event.timezone}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="actionBtn actionBtn-primary"
            style={{ margin: 0, width: 'auto', padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
            onClick={() => navigate(`/admin/events/${eventId}/edit`)}
          >
            ✏️ Edit Event
          </button>
          <button
            className="actionBtn actionBtn-secondary"
            style={{ margin: 0, width: 'auto', padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
            onClick={() => navigate('/admin/events')}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Queues section */}
      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Queues</h2>
          <button
            className="actionBtn actionBtn-primary"
            style={{ margin: 0, width: 'auto', padding: '0.5rem 1.2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => navigate(`/admin/events/${eventId}/queues/new`)}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> Add Queue
          </button>
        </div>

        {queues.length === 0 && (
          <p style={{ color: '#999', padding: '2rem 0', textAlign: 'center' }}>
            No queues yet. Add one to get started.
          </p>
        )}

        {queues.map((q) => (
          <div
            key={q.id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 10,
              padding: '1rem 1.25rem',
              marginBottom: '0.75rem',
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
                to={`/admin/events/${eventId}/queues/${q.id}`}
                style={{ fontWeight: 700, fontSize: '1.05rem', color: '#2f3e4f', textDecoration: 'none', display: 'block', marginBottom: '0.4rem' }}
              >
                {q.name}
              </Link>
              <div style={{ fontSize: '0.85rem', color: '#555' }}>
                Now serving: <span style={{ fontWeight: 600, color: '#2f3e4f' }}>{q.now_serving}</span> ·{' '}
                <span style={{ fontWeight: 600, color: statusColor[q.status] ?? '#999' }}>{q.status}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
              <button
                className="actionBtn actionBtn-primary"
                style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => navigate(`/admin/events/${eventId}/queues/${q.id}`)}
              >
                📊 Manage
              </button>
              <button
                className="actionBtn actionBtn-secondary"
                style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => navigate(`/admin/events/${eventId}/queues/${q.id}/edit`)}
              >
                ✏️ Edit
              </button>
              <button
                className="actionBtn actionBtn-danger"
                style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => handleDeleteQueue(q.id, q.name)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
