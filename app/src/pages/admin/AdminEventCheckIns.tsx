/**
 * Admin: Named event check-ins for the mobile bar alpha flow.
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { getEvent } from '../../lib/eventService';
import {
  checkInEventGuest,
  listEventCheckIns,
  onEventCheckInsChange,
} from '../../lib/checkInService';
import type { EventCheckIn, QEvent } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

export default function AdminEventCheckIns() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<QEvent | null>(null);
  const [checkIns, setCheckIns] = useState<EventCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!eventId) return;
    try {
      const [ev, rows] = await Promise.all([
        getEvent(eventId),
        listEventCheckIns(eventId),
      ]);
      setEvent(ev);
      setCheckIns(rows);
      setError('');
    } catch (e) {
      console.error('Failed to load check-ins', e);
      setError('Could not load check-ins. Confirm the event_check_ins table exists in Supabase.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!eventId) return;
    return onEventCheckInsChange(eventId, refresh);
  }, [eventId, refresh]);

  useEffect(() => {
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function checkInGuest(
    id: string,
    ticketType: NonNullable<EventCheckIn['ticket_type']>
  ) {
    try {
      await checkInEventGuest(id, ticketType);
      await refresh();
    } catch (e) {
      console.error('Failed to update check-in', e);
      alert('Could not update check-in.');
    }
  }

  const waiting = checkIns.filter((row) => row.status === 'waiting');
  const completed = checkIns.filter((row) => row.status === 'completed');

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header logoSrc={event?.image_url || '/images/qmeFirstLogo.jpg'} titleLine1="ADMIN" titleLine2="CHECK-IN" />

      <div style={{ padding: '0 1.25rem 0.75rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: '1.35rem', margin: 0, fontWeight: 700 }}>
          Mobile Bar Check-In
        </h1>
        <p style={{ color: '#666', margin: '0.35rem 0 0' }}>
          {event?.name || 'Event'} · {waiting.length} waiting
        </p>
      </div>

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        {error && (
          <div style={{ background: '#FFEBEE', borderRadius: 8, padding: '0.75rem', marginBottom: '0.9rem', color: '#B71C1C', fontWeight: 700 }}>
            {error}
          </div>
        )}

        {waiting.length === 0 && !error && (
          <p style={{ color: '#999', padding: '2rem 0', textAlign: 'center' }}>
            No active check-ins yet.
          </p>
        )}

        {waiting.map((row) => (
          <div key={row.id} style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem', background: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#2f3e4f', fontSize: '1.05rem' }}>
                  {row.first_name} {row.last_name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#5B4FCE', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>
                  waiting
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button className="actionBtn actionBtn-secondary" style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }} onClick={() => checkInGuest(row.id, 'general')}>
                  General
                </button>
                <button className="actionBtn actionBtn-primary" style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }} onClick={() => checkInGuest(row.id, 'flowers')}>
                  Flowers
                </button>
              </div>
            </div>
          </div>
        ))}

        {completed.length > 0 && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
            <h2 style={{ fontSize: '1rem', margin: '0 0 0.75rem', color: '#2f3e4f' }}>
              Checked In Today ({completed.length})
            </h2>
            {completed.map((row) => (
              <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', padding: '0.65rem 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontWeight: 700, color: '#2f3e4f' }}>
                  {row.first_name} {row.last_name}
                </span>
                <span style={{ color: row.ticket_type === 'flowers' ? '#5B4FCE' : '#00c853', fontSize: '0.78rem', fontWeight: 800 }}>
                  {row.ticket_type === 'flowers' ? 'FLOWERS' : 'GENERAL'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #eee' }}>
        <button className="actionBtn actionBtn-secondary" style={{ margin: 0 }} onClick={() => navigate(`/admin/events/${eventId}`)}>
          Back to Event
        </button>
      </div>
    </div>
  );
}
