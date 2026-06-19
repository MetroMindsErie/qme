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
  updateEventCheckInStatus,
  updateEventCheckInTicketType,
} from '../../lib/checkInService';
import { listGuestCreditsForEvent, upsertGuestCreditForCheckIn } from '../../lib/guestCreditService';
import type { EventCheckIn, EventGuestCredit, QEvent } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

interface AdminEventCheckInsProps {
  checkInCode?: string | null;
  title?: string;
  completedLabel?: string;
}

export default function AdminEventCheckIns({
  checkInCode = null,
  title = 'Event Check-In',
  completedLabel = 'Checked In Today',
}: AdminEventCheckInsProps) {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<QEvent | null>(null);
  const [checkIns, setCheckIns] = useState<EventCheckIn[]>([]);
  const [photoCredits, setPhotoCredits] = useState<EventGuestCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!eventId) return;
    try {
      const ev = await getEvent(eventId);
      const [rows, credits] = await Promise.all([
        listEventCheckIns(ev.id, checkInCode),
        listGuestCreditsForEvent(ev.id, 'professional_headshot'),
      ]);
      setEvent(ev);
      setCheckIns(rows);
      setPhotoCredits(credits);
      setError('');
    } catch (e) {
      console.error('Failed to load check-ins', e);
      setError('Could not load check-ins. Confirm the event_check_ins table exists in Supabase.');
    } finally {
      setLoading(false);
    }
  }, [eventId, checkInCode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!event?.id) return;
    return onEventCheckInsChange(event.id, refresh);
  }, [event?.id, refresh]);

  useEffect(() => {
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function checkInGuest(
    id: string,
    ticketType?: NonNullable<EventCheckIn['ticket_type']>
  ) {
    try {
      if (ticketType) {
        await checkInEventGuest(id, ticketType);
      } else {
        await updateEventCheckInStatus(id, 'completed');
      }
      await refresh();
    } catch (e) {
      console.error('Failed to update check-in', e);
      alert('Could not update check-in.');
    }
  }

  async function updateGuestAccess(
    id: string,
    ticketType: NonNullable<EventCheckIn['ticket_type']>
  ) {
    try {
      await updateEventCheckInTicketType(id, ticketType);
      await refresh();
    } catch (e) {
      console.error('Failed to update guest access', e);
      alert('Could not update guest access.');
    }
  }

  async function grantPhotoCredit(row: EventCheckIn) {
    if (!event) return;
    try {
      await upsertGuestCreditForCheckIn({
        eventId: event.id,
        checkInId: row.id,
        creditKey: 'professional_headshot',
        metadata: {
          guest_name: `${row.first_name} ${row.last_name}`.trim(),
        },
      });
      await refresh();
    } catch (e) {
      console.error('Failed to grant photo credit', e);
      alert('Could not grant photo credit.');
    }
  }

  const waiting = checkIns.filter((row) => row.status === 'waiting');
  const completed = checkIns.filter((row) => row.status === 'completed');
  const eventLogoSrc = event?.slug === 'sotc-test-check-in'
    ? '/images/sotc-logo.png'
    : event?.image_url || '/images/qmeFirstLogo.jpg';

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header logoSrc={eventLogoSrc} titleLine1="ADMIN" titleLine2="CHECK-IN" />

      <div style={{ padding: '0 1.25rem 0.75rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: '1.35rem', margin: 0, fontWeight: 700 }}>
          {title}
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
                {checkInCode || event?.slug !== 'peony-festival' ? (
                  <button className="actionBtn actionBtn-primary" style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }} onClick={() => checkInGuest(row.id)}>
                    Check In
                  </button>
                ) : (
                  <>
                    <button className="actionBtn actionBtn-secondary" style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }} onClick={() => checkInGuest(row.id, 'general')}>
                      General
                    </button>
                    <button className="actionBtn actionBtn-primary" style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }} onClick={() => checkInGuest(row.id, 'flowers')}>
                      Flowers
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {completed.length > 0 && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
            <h2 style={{ fontSize: '1rem', margin: '0 0 0.75rem', color: '#2f3e4f' }}>
              {completedLabel} ({completed.length})
            </h2>
            {completed.map((row) => {
              const hasFlowersAccess = row.ticket_type === 'flowers';
              const photoCredit = photoCredits.find((credit) => credit.check_in_id === row.id);
              const hasPhotoCredit = Boolean(photoCredit && photoCredit.quantity > photoCredit.used_quantity);
              const hasUsedPhotoCredit = Boolean(photoCredit && photoCredit.quantity <= photoCredit.used_quantity);
              const accessLabel = hasFlowersAccess ? 'FLOWERS' : 'GENERAL';

              return (
              <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', padding: '0.65rem 0', borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#2f3e4f' }}>
                    {row.first_name} {row.last_name}
                  </div>
                  <div style={{ color: hasFlowersAccess ? '#5B4FCE' : '#00c853', fontSize: '0.78rem', fontWeight: 800, marginTop: 2 }}>
                    {checkInCode || event?.slug !== 'peony-festival' ? 'CHECKED IN' : accessLabel}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {!checkInCode && event?.slug === 'peony-festival' && !hasFlowersAccess && (
                    <button
                      className="actionBtn actionBtn-primary"
                      style={{ margin: 0, width: 'auto', padding: '0.4rem 0.7rem', fontSize: '0.78rem' }}
                      onClick={() => updateGuestAccess(row.id, 'flowers')}
                    >
                      Upgrade Flowers
                    </button>
                  )}
                  {event?.slug === 'sotc-test-check-in' && (
                    <button
                      className={hasPhotoCredit || hasUsedPhotoCredit ? 'actionBtn actionBtn-secondary' : 'actionBtn actionBtn-primary'}
                      style={{ margin: 0, width: 'auto', padding: '0.4rem 0.7rem', fontSize: '0.78rem' }}
                      disabled={hasPhotoCredit || hasUsedPhotoCredit}
                      onClick={() => grantPhotoCredit(row)}
                    >
                      {hasUsedPhotoCredit ? 'Photo Used' : hasPhotoCredit ? 'Photo Credit' : 'Grant Photo'}
                    </button>
                  )}
                </div>
              </div>
              );
            })}
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
