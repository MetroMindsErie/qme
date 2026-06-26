/**
 * Admin: View event details + manage its queues (list, create, delete).
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { getEvent } from '../../lib/eventService';
import { deleteEce, listEcesForEvent } from '../../lib/eceService';
import { listQueuesForEvent, deleteQueue } from '../../lib/queueService';
import { formatDate, formatTime } from '../../lib/utils';
import type { Ece, QEvent, Queue } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

export default function AdminEventDetail() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<QEvent | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [eces, setEces] = useState<Ece[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!eventId) return;
    try {
      const ev = await getEvent(eventId);
      const [qs, exps] = await Promise.all([
        listQueuesForEvent(ev.id),
        listEcesForEvent(ev.id),
      ]);
      setEvent(ev);
      setQueues(qs);
      setEces(exps);
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

  async function handleDeleteEce(eceId: string, name: string) {
    if (!confirm(`Delete eCe "${name}"?`)) return;
    try {
      await deleteEce(eceId);
      setEces((prev) => prev.filter((ece) => ece.id !== eceId));
    } catch (e) {
      console.error('Delete eCe failed', e);
      alert('Failed to delete eCe.');
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
  const linkedQueueIds = new Set(eces.map((ece) => ece.queue_id).filter(Boolean));
  const standaloneQueues = queues.filter((queue) => !linkedQueueIds.has(queue.id));
  const visibleEces = eces.filter((ece) => ece.type !== 'check_in');

  return (
    <div className="card card-scrollable admin-event-detail-card" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header
        logoSrc={event.slug === 'sotc-test-check-in' ? '/images/sotc-logo.png' : event.image_url || '/images/qmeFirstLogo.jpg'}
        titleLine1="ADMIN"
        titleLine2="EVENT"
      />

      {/* Event summary */}
      <div style={{ padding: '0 1.25rem 1rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>{event.name}</h1>
        <p style={{ color: '#666', margin: '0 0 0.75rem', lineHeight: 1.5 }}>{event.description}</p>
        <div style={{ fontSize: '0.88rem', color: '#555', marginBottom: '0.75rem', lineHeight: 1.6 }}>
          📍 {event.location || '—'}<br/>
          📅 {formatDate(event.event_date)}<br/>
          🕐 {formatTime(event.start_time)} – {formatTime(event.end_time)} {event.timezone}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const }}>
          <button
            className="actionBtn actionBtn-primary"
            style={{ margin: 0, width: 'auto', padding: '0.5rem 1.2rem', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}
            onClick={() => navigate(`/admin/events/${event.id}/edit`)}
          >
            ✏️ Edit Event
          </button>
          <button
            className="actionBtn actionBtn-secondary"
            style={{ margin: 0, width: 'auto', padding: '0.5rem 1.2rem', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}
            onClick={() => navigate(`/admin/events/${event.id}/check-ins`)}
          >
            {event.slug === 'peony-festival' ? 'Mobile Bar Check-Ins' : 'Event Check-Ins'}
          </button>
          <button
            className="actionBtn actionBtn-secondary"
            style={{ margin: 0, width: 'auto', padding: '0.5rem 1.2rem', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}
            onClick={() => navigate('/admin/events')}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Queues section */}
      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Event Experiences</h2>
            <button
              className="actionBtn actionBtn-primary"
              style={{ margin: 0, width: 'auto', padding: '0.5rem 1.2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => navigate(`/admin/events/${event.id}/eces/new`)}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> Add Experience
            </button>
          </div>

          {visibleEces.length === 0 && (
            <p style={{ color: '#999', padding: '1.5rem 0', textAlign: 'center' }}>
              No experiences yet. Add one to place an activity into this event.
            </p>
          )}

          {visibleEces.map((exp) => {
            const linkedQueue = exp.queue_id ? queues.find((q) => q.id === exp.queue_id) : null;

            return (
              <div
              key={exp.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 10,
                padding: 'clamp(0.75rem, 2vw, 1rem)',
                marginBottom: '0.75rem',
                background: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap' as const,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 800, fontSize: '1.02rem', color: '#2f3e4f', display: 'block', marginBottom: '0.35rem' }}>
                  {exp.name}
                </span>
                <div style={{ fontSize: '0.82rem', color: '#555', lineHeight: 1.5 }}>
                  {exp.type.replace('_', '-')} · {exp.status}
                  {exp.location ? ` · ${exp.location}` : ''}
                  {exp.queue_id ? ' · linked queue' : ''}
                </div>
                {exp.description && (
                  <div style={{ fontSize: '0.88rem', color: '#666', marginTop: '0.35rem' }}>
                    {exp.description}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' as const }}>
                {linkedQueue && (
                  <button
                    className="actionBtn actionBtn-primary"
                    style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => navigate(`/admin/events/${event.id}/queues/${linkedQueue.id}`)}
                  >
                    Manage Queue
                  </button>
                )}
                <button
                  className="actionBtn actionBtn-secondary"
                  style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  onClick={() => navigate(`/admin/events/${event.id}/eces/${exp.id}/edit`)}
                >
                  Edit
                </button>
                <button
                  className="actionBtn actionBtn-danger"
                  style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  onClick={() => handleDeleteEce(exp.id, exp.name)}
                >
                  Delete
                </button>
              </div>
              </div>
            );
          })}
        </div>

        {standaloneQueues.length > 0 && (
          <details style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 800, fontSize: '1rem', color: '#2f3e4f' }}>
              Advanced Queue Engines
            </summary>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0 0.75rem', gap: '0.75rem', flexWrap: 'wrap' }}>
            <p style={{ color: '#777', margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
              Queue engines power queue experiences. Most queue work should happen from the experience row above.
            </p>
            <button
              className="actionBtn actionBtn-primary"
              style={{ margin: 0, width: 'auto', padding: '0.5rem 1.2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => navigate(`/admin/events/${event.id}/queues/new`)}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> Add Queue
            </button>
          </div>

        {standaloneQueues.map((q) => (
          <div
            key={q.id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 10,
              padding: 'clamp(0.75rem, 2vw, 1.25rem)',
              marginBottom: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
              background: '#fafafa',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              flexWrap: 'wrap' as const,
              cursor: 'pointer',
            }}
            onClick={(e) => {
              // Prevent navigation if a button inside is clicked
              if ((e.target as HTMLElement).closest('button')) return;
              navigate(`/admin/events/${event.id}/queues/${q.id}`);
            }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate(`/admin/events/${event.id}/queues/${q.id}`);
              }
            }}
            role="button"
            aria-label={`View queue ${q.name}`}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#2f3e4f', display: 'block', marginBottom: '0.4rem' }}>
                {q.name}
              </span>
              <div style={{ fontSize: '0.85rem', color: '#555' }}>
                Now serving: <span style={{ fontWeight: 600, color: '#2f3e4f' }}>{q.now_serving}</span> ·{' '}
                <span style={{ fontWeight: 600, color: statusColor[q.status] ?? '#999' }}>{q.status}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' as const }}>
              <button
                className="actionBtn actionBtn-primary"
                style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={(e) => { e.stopPropagation(); navigate(`/admin/events/${event.id}/queues/${q.id}`); }}
              >
                📊 Manage
              </button>
              <button
                className="actionBtn actionBtn-secondary"
                style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={(e) => { e.stopPropagation(); navigate(`/admin/events/${event.id}/queues/${q.id}/edit`); }}
              >
                ✏️ Edit
              </button>
              <button
                className="actionBtn actionBtn-danger"
                style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={(e) => { e.stopPropagation(); handleDeleteQueue(q.id, q.name); }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
          </details>
        )}
      </div>
    </div>
  );
}
