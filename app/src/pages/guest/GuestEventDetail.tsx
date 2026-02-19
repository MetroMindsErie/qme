/**
 * Guest: View an event's details and its available queues.
 * The guest can see which queues they've already joined
 * and enter new ones.
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import DisplayField from '../../components/DisplayField';
import { getEventBySlug } from '../../lib/eventService';
import { listQueuesForEvent, getNowServing } from '../../lib/queueService';
import { formatDate, formatTime } from '../../lib/utils';
import { getStoredQueueTicket } from '../../hooks/useQueueTicket';
import type { QEvent, Queue } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';

interface QueueWithMeta extends Queue {
  _myTicket?: string;
  _nowServing?: number;
}

export default function GuestEventDetail() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<QEvent | null>(null);
  const [queues, setQueues] = useState<QueueWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!eventSlug) return;
    try {
      const ev = await getEventBySlug(eventSlug);
      setEvent(ev);
      const qs = await listQueuesForEvent(ev.id);

      // Enrich with ticket state and now_serving
      const enriched: QueueWithMeta[] = await Promise.all(
        qs
          .filter((q) => q.status === 'active')
          .map(async (q) => {
            const ticket = getStoredQueueTicket(q.id);
            let ns = q.now_serving;
            try {
              ns = await getNowServing(q.id);
            } catch { /* */ }
            return { ...q, _myTicket: ticket || undefined, _nowServing: ns };
          })
      );
      setQueues(enriched);
    } catch (e) {
      console.error('Failed to load event', e);
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll to keep now_serving fresh
  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading…</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
          Event not found.
        </p>
        <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
          <button className="actionBtn" style={{ width: 'auto', padding: '0.5rem 1.5rem' }} onClick={() => navigate('/events')}>
            ← Back to Events
          </button>
        </div>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    active: '#00c853',
    paused: '#ff9800',
    closed: '#f44336',
  };

  return (
    <div className="card card-scrollable" style={{ maxWidth: 600, minHeight: '600px', maxHeight: '90vh' }}>
      <Header
        logoSrc={event.image_url || '/images/qmeFirstLogo.jpg'}
        titleLine1=""
        titleLine2=""
      />

      <div style={{ borderBottom: '2px solid #e0e0e0', paddingBottom: '0.5rem' }}>
        <h1 className="headline" style={{ fontSize: '1.3rem', margin: '0.5rem 0' }}>
          {event.name}
        </h1>

        {event.description && (
          <p style={{ textAlign: 'center', color: '#666', margin: '0.25rem 1.5rem 0.5rem', fontSize: '0.9rem' }}>
            {event.description}
          </p>
        )}

        <div className="inputs" style={{ marginBottom: '0.5rem' }}>
        <DisplayField id="ev-date" label="Date" value={formatDate(event.event_date)} className="displayInput3" />
        <DisplayField id="ev-start" label="Start" value={formatTime(event.start_time)} />
        <DisplayField id="ev-tz" label="TZ" value={event.timezone} />
        <DisplayField id="ev-end" label="End" value={formatTime(event.end_time)} />
        </div>

        {event.location && (
          <p style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', margin: '0.25rem 0 0.5rem' }}>
            📍 {event.location}
          </p>
        )}
      </div>

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.1rem', margin: '0.5rem 0 0.75rem', fontWeight: 700 }}>
          Choose a Queue
        </h2>

        {queues.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', padding: '2rem 1rem' }}>
            No queues available right now.
          </p>
        )}

        <div style={{ padding: '0 1.25rem' }}>
        {queues.map((q) => {
          const hasTicket = Boolean(q._myTicket);
          return (
            <div
              key={q.id}
              style={{
                border: `2px solid ${hasTicket ? '#00c853' : '#ddd'}`,
                borderRadius: 10,
                padding: '0.75rem 1rem',
                marginBottom: '0.6rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
              }}
            >
              {q.image_url && (
                <img
                  src={q.image_url}
                  alt={q.name}
                  style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{q.name}</div>
                {q.description && (
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 2 }}>{q.description}</div>
                )}
                <div style={{ fontSize: '0.8rem', marginTop: 4, display: 'flex', gap: '0.75rem' }}>
                  <span>Now Serving: <strong>{q._nowServing ?? q.now_serving}</strong></span>
                  <span style={{ color: statusColor[q.status] }}>{q.status}</span>
                </div>
                {hasTicket && (
                  <div style={{ fontSize: '0.8rem', color: '#00c853', fontWeight: 600, marginTop: 2 }}>
                    🎫 Your ticket: #{q._myTicket}
                  </div>
                )}
              </div>
              <div>
                {hasTicket ? (
                  <Link
                    to={`/events/${eventSlug}/q/${q.slug}/ticket`}
                    className="actionBtn"
                    style={{ display: 'inline-block', margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem', textDecoration: 'none' }}
                  >
                    View Ticket
                  </Link>
                ) : (
                  <Link
                    to={`/events/${eventSlug}/q/${q.slug}`}
                    className="actionBtn"
                    style={{ display: 'inline-block', margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem', textDecoration: 'none' }}
                  >
                    Join Queue
                  </Link>
                )}
              </div>
            </div>
          );
        })}
        </div>

        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <button
            className="actionBtn actionBtn-secondary"
            style={{ margin: 0, width: 'auto', padding: '0.5rem 1.5rem' }}
            onClick={() => navigate('/events')}
          >
            ← Back to Events
          </button>
        </div>
      </div>
    </div>
  );
}
