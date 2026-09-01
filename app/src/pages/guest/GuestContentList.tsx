import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { getContentListConfig } from '../../lib/contentListConfig';
import { listActiveEcesForEvent } from '../../lib/eceService';
import { getEventBySlug } from '../../lib/eventService';
import { isSotcEventSlug } from '../../lib/sotc';
import type { Ece, QEvent } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';

export default function GuestContentList() {
  const navigate = useNavigate();
  const { eventSlug, eceSlug } = useParams<{ eventSlug: string; eceSlug: string }>();
  const [event, setEvent] = useState<QEvent | null>(null);
  const [ece, setEce] = useState<Ece | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventSlug || !eceSlug) return;
    let stopped = false;
    (async () => {
      try {
        const ev = await getEventBySlug(eventSlug);
        const eces = await listActiveEcesForEvent(ev.id);
        if (stopped) return;
        setEvent(ev);
        setEce(eces.find((item) => item.slug === eceSlug) ?? null);
      } catch (error) {
        console.error('Failed to load content list', error);
      } finally {
        if (!stopped) setLoading(false);
      }
    })();
    return () => {
      stopped = true;
    };
  }, [eventSlug, eceSlug]);

  const config = useMemo(() => getContentListConfig(ece), [ece]);
  const eventLogoSrc = isSotcEventSlug(event?.slug)
    ? '/images/sotc-logo.png'
    : event?.image_url || '/images/qmeFirstLogo.jpg';

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>
      </div>
    );
  }

  if (!event || !ece || !config.enabled) {
    return (
      <div className="card" style={{ minHeight: '600px', padding: '2rem 1.25rem', textAlign: 'center' }}>
        <h1 className="headline" style={{ fontSize: '1.35rem' }}>Content unavailable</h1>
        <button className="actionBtn actionBtn-secondary" type="button" onClick={() => navigate(`/events/${eventSlug}`)}>
          Back to Event
        </button>
      </div>
    );
  }

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header logoSrc={eventLogoSrc} titleLine1="EVENT" titleLine2="INFO" />
      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        <h1 className="headline" style={{ fontSize: '1.45rem', margin: '0 0 0.5rem' }}>{config.title}</h1>
        {ece.description && (
          <p style={{ color: '#64748b', lineHeight: 1.5, fontWeight: 700, marginTop: 0 }}>
            {ece.description}
          </p>
        )}

        <div style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}>
          {config.items.map((item, index) => (
            <div key={`${item.name}-${index}`} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.9rem', background: '#fff' }}>
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', flexShrink: 0 }}
                  />
                )}
                <div>
                  <div style={{ color: '#1f2937', fontWeight: 900, fontSize: '1.05rem' }}>
                    {item.name || `Item ${index + 1}`}
                  </div>
                  {item.description && (
                    <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.45, margin: '0.35rem 0 0' }}>
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Link className="actionBtn actionBtn-secondary" to={`/events/${event.slug}`}>
          Back to Event
        </Link>
      </div>
    </div>
  );
}
