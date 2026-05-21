/**
 * Guest: Event detail page — live queues + informational activity cards.
 * Redesigned for I-Pitch demo: Live badge, stats bar, clickable menus.
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEventBySlug } from '../../lib/eventService';
import { listQueuesForEvent, getNowServing } from '../../lib/queueService';
import { formatTime } from '../../lib/utils';
import { getStoredQueueTicket } from '../../hooks/useQueueTicket';
import MenuModal, { type MenuConfig } from '../../components/MenuModal';
import type { QEvent, Queue } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';
import '../../styles/eventDetail.css';

interface QueueWithMeta extends Queue {
  _myTicket?: string;
  _nowServing?: number;
}


// ── Menu definitions ────────────────────────────────────────────────────────
const SPEAKERS_MENU: MenuConfig = {
  id: 'speakers',
  icon: '🎤',
  color: '#2196F3',
  title: 'Main Stage – Speaker Sessions',
  availability: 'Live startup pitches · 5:30 PM – 8:00 PM',
  items: [
    { emoji: '🚀', name: 'qMe', note: 'Featured Demo' },
    { emoji: '🐾', name: 'Wags Vital', note: 'Company Presentation' },
  ],
};

const BUFFET_MENU: MenuConfig = {
  id: 'buffet',
  icon: '🍽️',
  color: '#FF9800',
  title: 'Food Buffet',
  availability: 'Available buffet-style · 5:00 PM – 8:00 PM',
  items: [
    { emoji: '🍗', name: 'Roast Chicken', note: 'Herb-seasoned, carved fresh' },
    { emoji: '🍝', name: 'Pasta Primavera', note: 'Vegetarian, with fresh veggies' },
    { emoji: '🥗', name: 'Garden Salad', note: 'Assorted dressings' },
    { emoji: '🍞', name: 'Fresh Baked Rolls', note: 'With butter' },
    { emoji: '🥔', name: 'Garlic Mashed Potatoes' },
    { emoji: '🍰', name: 'Assorted Desserts', note: 'Cakes, cookies, and more' },
    { emoji: '🍎', name: 'Seasonal Fruit' },
  ],
};

const BEVERAGE_MENU: MenuConfig = {
  id: 'beverages',
  icon: '🍷',
  color: '#9C27B0',
  title: 'Beer, Wine & Non-Alcoholic',
  availability: 'Available throughout event · 5:00 PM – 8:00 PM',
  items: [
    { emoji: '🍺', name: 'Thirsty Dog Labrador Lager', note: 'Local · Akron, OH' },
    { emoji: '🍺', name: 'Platform Beer Mosaic IPA', note: 'Local · Cleveland, OH' },
    { emoji: '🍷', name: 'Kendall-Jackson Chardonnay', note: 'Unoaked, crisp' },
    { emoji: '🍷', name: 'The Prisoner Cabernet Sauvignon' },
    { emoji: '🥂', name: 'Chandon Brut Rosé', note: 'California sparkling' },
    { emoji: '💧', name: 'Still & Sparkling Water' },
    { emoji: '🥤', name: 'Pepsi Products & Juice', note: 'Assorted' },
  ],
};

// ── Static informational activities ─────────────────────────────────────────

interface StaticActivity {
  id: string;
  icon: string;
  color: string;
  name: string;
  description: string | null;
  time: string | null;
  badge: string | null;
  menuConfig?: MenuConfig;
}

const STATIC_ACTIVITIES: StaticActivity[] = [
  {
    id: 'main-stage',
    icon: '🎤',
    color: '#2196F3',
    name: 'Main Stage – Speaker Sessions',
    description: 'Live startup pitches from I-Corps teams',
    time: '5:30 PM – 6:15 PM',
    badge: null,
    menuConfig: SPEAKERS_MENU,
  },
  {
    id: 'buffet',
    icon: '🍽️',
    color: '#FF9800',
    name: 'Food Buffet',
    description: 'Available buffet-style',
    time: '6:15 PM – 6:45 PM',
    badge: null,
    menuConfig: BUFFET_MENU,
  },
  {
    id: 'beverages',
    icon: '🍷',
    color: '#9C27B0',
    name: 'Beer, Wine & Non-Alcoholic Beverages',
    description: null,
    time: '5:00 PM – 7:45 PM',
    badge: null,
    menuConfig: BEVERAGE_MENU,
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

// ────────────────────────────────────────────────────────────────────────────

export default function GuestEventDetail() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<QEvent | null>(null);
  const [queues, setQueues] = useState<QueueWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('just now');
  const [activeMenu, setActiveMenu] = useState<MenuConfig | null>(null);

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
            try { ns = await getNowServing(q.id); } catch { /* */ }
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

  useEffect(() => { refresh(); }, [refresh]);
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
        <p style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Event not found.</p>
        <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
          <button className="actionBtn" style={{ width: 'auto', padding: '0.5rem 1.5rem' }}
            onClick={() => navigate('/demo')}>← Back</button>
        </div>
      </div>
    );
  }

  const sessionCount = queues.length + STATIC_ACTIVITIES.filter(a => a.id !== 'live-updates').length;

  return (
    <>
      <div className="card card-scrollable ed-card">

        {/* ── Event Header ── */}
        <div className="ed-header">
          <div className="ed-header-top">
            <div className="ed-header-left">
              {event.image_url ? (
                <img src={event.image_url} alt={event.name} className="ed-logo" />
              ) : (
                <div className="ed-logo-placeholder"><span>I-P</span></div>
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
            <div className="ed-stat ed-stat-right">
              <span className="ed-stat-icon">⏱</span>
              <span className="ed-stat-label">Updated {lastUpdated}</span>
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

          {/* Live joinable queues */}
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
                  {event.start_time && (
                    <div className="ed-activity-meta">
                      <span>Starts {formatTime(event.start_time)}</span>
                    </div>
                  )}
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
                    <Link to={`/events/${eventSlug}/q/${q.slug}/ticket`} className="ed-action-btn ed-action-btn-secondary">
                      View ›
                    </Link>
                  ) : (
                    <Link to={`/events/${eventSlug}/q/${q.slug}`} className="ed-action-btn">
                      Join ›
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {/* Static informational activities */}
          {STATIC_ACTIVITIES.map((act) => {
            const isClickable = Boolean(act.menuConfig);
            return (
              <div
                key={act.id}
                className={`ed-activity-card ed-activity-card-info ${isClickable ? 'ed-card-clickable' : ''}`}
                onClick={isClickable ? () => setActiveMenu(act.menuConfig!) : undefined}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={isClickable ? (e) => { if (e.key === 'Enter') setActiveMenu(act.menuConfig!); } : undefined}
              >
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
                <div className="ed-activity-right ed-activity-chevron">
                  {isClickable ? '›' : <span style={{ color: '#e0e0e0' }}>›</span>}
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* Menu bottom sheet — rendered outside card so it overlays everything */}
      <MenuModal config={activeMenu} onClose={() => setActiveMenu(null)} />
    </>
  );
}
