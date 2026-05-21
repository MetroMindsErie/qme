/**
 * Guest: Event detail page — shows live queues and event activities.
 * Redesigned for I-Pitch demo with Live badge, stats, and activity cards.
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEventBySlug } from '../../lib/eventService';
import { listQueuesForEvent, getNowServing } from '../../lib/queueService';
import { formatTime } from '../../lib/utils';
import { getStoredQueueTicket } from '../../hooks/useQueueTicket';
import type { QEvent, Queue } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';
import '../../styles/eventDetail.css';

interface QueueWithMeta extends Queue {
  _myTicket?: string;
  _nowServing?: number;
}

// Static informational activities shown below live queues
const STATIC_ACTIVITIES = [
  {
    id: 'main-stage',
    icon: '🎤',
    color: '#2196F3',
    name: 'Main Stage – Speaker Sessions',
    description: 'Live startup pitches from I-Corps teams',
    time: '5:00 PM – 8:00 PM',
    badge: null,
  },
  {
    id: 'qme-demo',
    icon: 'qMe',
    color: '#00C853',
    name: 'qMe Demo',
    description: 'See how qMe works in a live event',
    time: 'Available throughout event',
    badge: 'FEATURED',
  },
  {
    id: 'charcuterie',
    icon: '🧀',
    color: '#FF9800',
    name: 'Charcuterie & Light Appetizers',
    description: 'Available buffet-style',
    time: '5:00 PM – 8:00 PM',
    badge: null,
  },
  {
    id: 'beverages',
    icon: '🍷',
    color: '#FFC107',
    name: 'Beer, Wine & Non-Alcoholic Beverages',
    description: null,
    time: '5:00 PM – 8:00 PM',
    badge: null,
  },
  {
    id: 'live-updates',
    icon: '🔔',
    color: '#5B4FCE',
    name: 'Live updates all event',
    description: 'Event details update in real time so you can plan your time and enjoy more.',
    time: null,
    badge: null,
  },
];

export default function GuestEventDetail() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<QEvent | null>(null);
  const [queues, setQueues] = useState<QueueWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('just now');

  const refresh = useCallback(async () => {
    if (!eventSlug) return;
    try {
      const ev = await getEventBySlug(eventSlug);
      setEvent(ev);
      const qs = await listQueuesForEvent(ev.id);

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
      setLastUpdated('just now');
    } catch (e) {
      console.error('Failed to load event', e);
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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

  const sessionCount = queues.length + STATIC_ACTIVITIES.filter(a => a.id !== 'live-updates').length;

  return (
    <div className="card card-scrollable ed-card">

      {/* ── Event Header ── */}
      <div className="ed-header">
        <div className="ed-header-top">
          <div className="ed-header-left">
            {event.image_url ? (
              <img src={event.image_url} alt={event.name} className="ed-logo" />
            ) : (
              <div className="ed-logo-placeholder">
                <span>I-P</span>
              </div>
            )}
            <div className="ed-header-info">
              <div className="ed-event-name">{event.name}</div>
              {event.location && (
                <div className="ed-location">📍 {event.location}</div>
              )}
            </div>
          </div>
          <div className="ed-live-badge">● Live</div>
        </div>

        {/* Stats row */}
        <div className="ed-stats">
          <div className="ed-stat">
            <span className="ed-stat-icon">🎙</span>
            <span className="ed-stat-val">{sessionCount}</span>
            <span className="ed-stat-label">Sessions</span>
          </div>
          {event.start_time && (
            <div className="ed-stat">
              <span className="ed-stat-icon">🕖</span>
              <span className="ed-stat-val">{formatTime(event.start_time)}</span>
              <span className="ed-stat-label">Starts</span>
            </div>
          )}
          <div className="ed-stat">
            <span className="ed-stat-icon">⏱</span>
            <span className="ed-stat-label ed-stat-updated">Updated {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* ── Guest View Label ── */}
      <div className="ed-section-header">
        <span className="ed-section-title">GUEST VIEW</span>
        <span className="ed-section-sub">See what's happening across the event.</span>
      </div>

      {/* ── Activity list ── */}
      <div className="ed-activity-list">

        {/* Live joinable queues from Supabase */}
        {queues.map((q) => {
          const hasTicket = Boolean(q._myTicket);
          return (
            <div key={q.id} className={`ed-activity-card ${hasTicket ? 'ed-card-joined' : ''}`}>
              <div className="ed-activity-icon-wrap" style={{ background: '#EDE9FF' }}>
                {q.image_url
                  ? <img src={q.image_url} alt={q.name} className="ed-activity-icon-img" />
                  : <span style={{ fontSize: '1.1rem' }}>🎟</span>}
              </div>
              <div className="ed-activity-body">
                <div className="ed-activity-name-row">
                  <span className="ed-activity-name">{q.name}</span>
                  <span className="ed-badge ed-badge-active">ACTIVE</span>
                </div>
                {q.description && (
                  <div className="ed-activity-desc">{q.description}</div>
                )}
                <div className="ed-activity-meta">
                  {event.start_time && <span>Starts {formatTime(event.start_time)}</span>}
                </div>
                {hasTicket && (
                  <div className="ed-ticket-note">🎫 You're in line — #{q._myTicket}</div>
                )}
              </div>
              <div className="ed-activity-right">
                <div className="ed-serving-badge">
                  <div className="ed-serving-label">Now Serving</div>
                  <div className="ed-serving-num">{q._nowServing ?? q.now_serving}</div>
                </div>
                {hasTicket ? (
                  <Link
                    to={`/events/${eventSlug}/q/${q.slug}/ticket`}
                    className="ed-action-btn ed-action-btn-secondary"
                  >
                    View ›
                  </Link>
                ) : (
                  <Link
                    to={`/events/${eventSlug}/q/${q.slug}`}
                    className="ed-action-btn"
                  >
                    Join ›
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {/* Static informational activities */}
        {STATIC_ACTIVITIES.map((act) => (
          <div key={act.id} className="ed-activity-card ed-activity-card-info">
            <div
              className="ed-activity-icon-wrap"
              style={{ background: act.color + '22' }}
            >
              {act.icon === 'qMe'
                ? <span style={{ fontSize: '0.65rem', fontWeight: 800, color: act.color }}>qMe</span>
                : <span style={{ fontSize: '1.1rem' }}>{act.icon}</span>}
            </div>
            <div className="ed-activity-body">
              <div className="ed-activity-name-row">
                <span className="ed-activity-name">{act.name}</span>
                {act.badge && (
                  <span className="ed-badge ed-badge-featured">{act.badge}</span>
                )}
              </div>
              {act.description && (
                <div className="ed-activity-desc">{act.description}</div>
              )}
              {act.time && (
                <div className="ed-activity-time" style={{ color: act.color }}>
                  {act.time}
                </div>
              )}
            </div>
            <div className="ed-activity-right ed-activity-chevron">›</div>
          </div>
        ))}

      </div>

      <div style={{ textAlign: 'center', padding: '0.75rem 0 0.25rem' }}>
        <button
          className="actionBtn actionBtn-secondary"
          style={{ margin: 0, width: 'auto', padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}
          onClick={() => navigate('/events')}
        >
          ← All Events
        </button>
      </div>
    </div>
  );
}
