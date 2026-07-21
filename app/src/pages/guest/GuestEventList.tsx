/**
 * qME root landing page: public event directory, not a single-event demo.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEvents } from '../../lib/eventService';
import { formatDate, formatTime } from '../../lib/utils';
import type { QEvent } from '../../types';
import '../../styles/shared.css';

const PUBLIC_EVENT_SLUGS = new Set([
  'peony-festival',
  'sotc-rock-hall',
  'sotc-test-check-in',
]);

const PUBLIC_PATHS: Record<string, string> = {
  'sotc-rock-hall': '/sotc/rockhall',
  'sotc-test-check-in': '/sotc/rockhall',
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function isPublicDirectoryEvent(event: QEvent): boolean {
  const metadata = asRecord(event.metadata);
  if (
    metadata.public_directory === false ||
    metadata.publicDirectory === false ||
    metadata.private === true ||
    metadata.internal === true
  ) {
    return false;
  }

  return (
    metadata.public_directory === true ||
    metadata.publicDirectory === true ||
    PUBLIC_EVENT_SLUGS.has(event.slug)
  );
}

function getEventPath(event: QEvent): string {
  return PUBLIC_PATHS[event.slug] || `/events/${event.slug}`;
}

function getEventStatus(event: QEvent): 'upcoming' | 'today' | 'past' | 'date-pending' {
  if (!event.event_date) return 'date-pending';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(`${event.event_date}T00:00:00`);
  eventDate.setHours(0, 0, 0, 0);

  if (eventDate.getTime() === today.getTime()) return 'today';
  return eventDate > today ? 'upcoming' : 'past';
}

function sortByEventRelevance(left: QEvent, right: QEvent): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rank = (event: QEvent) => {
    if (!event.event_date) {
      return { bucket: 2, distance: Number.MAX_SAFE_INTEGER };
    }
    const eventTime = new Date(`${event.event_date}T00:00:00`).getTime();
    const distanceDays = Math.round((eventTime - today.getTime()) / 86400000);
    if (distanceDays >= 0) return { bucket: 0, distance: distanceDays };
    return { bucket: 1, distance: Math.abs(distanceDays) };
  };

  const a = rank(left);
  const b = rank(right);
  if (a.bucket !== b.bucket) return a.bucket - b.bucket;
  return a.distance - b.distance;
}

function getBadgeLabel(event: QEvent): string {
  const status = getEventStatus(event);
  if (status === 'today') return 'Today';
  if (status === 'upcoming') return 'Upcoming';
  if (status === 'past') return 'Past';
  return 'Date pending';
}

export default function GuestEventList() {
  const [events, setEvents] = useState<QEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setError('');
      const data = await listEvents({ status: 'active' });
      setEvents(data.filter(isPublicDirectoryEvent).sort(sortByEventRelevance));
    } catch (e) {
      console.error('Failed to load public events', e);
      setError('Events could not be loaded. Direct event links still work.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const eventCountLabel = useMemo(() => {
    if (loading) return 'Loading events';
    if (events.length === 1) return '1 public event';
    return `${events.length} public events`;
  }, [events.length, loading]);

  return (
    <main className="qme-home-shell">
      <section className="qme-home-card" aria-labelledby="qme-home-title">
        <header className="qme-home-header">
          <div>
            <div className="qme-home-wordmark">qME</div>
            <p className="qme-home-kicker">Event companion</p>
          </div>
          <Link to="/admin" className="qme-home-admin-link">
            Organizer / Staff Sign In
          </Link>
        </header>

        <section className="qme-home-intro">
          <p className="qme-home-eyebrow">Find your event</p>
          <h1 id="qme-home-title">Check in, see what is happening, and follow event experiences from your phone.</h1>
          <p>
            qME helps guests use the right event link without turning the platform homepage into a single demo event.
          </p>
        </section>

        <section className="qme-home-directory" aria-labelledby="qme-event-directory-title">
          <div className="qme-section-heading">
            <div>
              <p className="qme-home-eyebrow">Event directory</p>
              <h2 id="qme-event-directory-title">Active and upcoming events</h2>
            </div>
            <span>{eventCountLabel}</span>
          </div>

          {loading && <p className="qme-home-empty">Loading public events...</p>}
          {!loading && error && <p className="qme-home-error">{error}</p>}
          {!loading && !error && events.length === 0 && (
            <p className="qme-home-empty">No public events are listed right now. Use your direct event link if you have one.</p>
          )}

          <div className="qme-event-grid">
            {events.map((event) => (
              <Link key={event.id} to={getEventPath(event)} className="qme-event-card">
                <div className="qme-event-image">
                  {event.image_url ? (
                    <img src={event.image_url} alt="" />
                  ) : (
                    <span>{event.name.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <div className="qme-event-copy">
                  <div className="qme-event-title-row">
                    <h3>{event.name}</h3>
                    <span className={`qme-event-badge qme-event-badge-${getEventStatus(event)}`}>
                      {getBadgeLabel(event)}
                    </span>
                  </div>
                  <p className="qme-event-meta">
                    {event.event_date ? formatDate(event.event_date) : 'Date pending'}
                    {event.start_time ? ` at ${formatTime(event.start_time)}` : ''}
                  </p>
                  {event.location && <p className="qme-event-meta">{event.location}</p>}
                  {event.description && <p className="qme-event-description">{event.description}</p>}
                </div>
                <span className="qme-event-action">Open Event</span>
              </Link>
            ))}
          </div>
        </section>

        <footer className="qme-home-footer">
          Direct QR codes, emails, and signage should still point straight to the event page.
        </footer>
      </section>
    </main>
  );
}
