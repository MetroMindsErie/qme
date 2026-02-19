/**
 * Guest: Browse active events.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import { listEvents } from '../../lib/eventService';
import { formatDate, formatTime } from '../../lib/utils';
import type { QEvent } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';

export default function GuestEventList() {
  const [events, setEvents] = useState<QEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await listEvents({ status: 'active' });
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

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header
        logoSrc="/images/qmeFirstLogo.jpg"
        titleLine1="qME"
        titleLine2="EVENTS"
      />

      <div style={{ borderBottom: '2px solid #e0e0e0', paddingBottom: '0.75rem' }}>
        <h1 className="headline" style={{ fontSize: '1.3rem', margin: '0.5rem 0' }}>
          Happening Now
        </h1>
      </div>

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0' }}>
        {loading && (
          <p style={{ textAlign: 'center', padding: '3rem 1rem', color: '#888' }}>
            Loading events…
          </p>
        )}

        {!loading && events.length === 0 && (
          <p style={{ textAlign: 'center', padding: '3rem 1rem', color: '#888' }}>
            No active events right now. Check back soon!
          </p>
        )}

        <div style={{ padding: '0 1.25rem' }}>
        {events.map((ev) => (
          <Link
            key={ev.id}
            to={`/events/${ev.slug}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              style={{
                border: '1px solid #ddd',
                borderRadius: 10,
                padding: '1rem',
                marginBottom: '0.75rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              {ev.image_url && (
                <img
                  src={ev.image_url}
                  alt={ev.name}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{ev.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 2 }}>
                  {formatDate(ev.event_date)} · {formatTime(ev.start_time)} – {formatTime(ev.end_time)} {ev.timezone}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 2 }}>
                  📍 {ev.location || 'TBA'}
                </div>
                {ev.description && (
                  <div style={{ fontSize: '0.8rem', color: '#999', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.description}
                  </div>
                )}
              </div>
              <span style={{ fontSize: '1.2rem', color: '#ccc' }}>›</span>
            </div>
          </Link>
        ))}
        </div>
      </div>
    </div>
  );
}
