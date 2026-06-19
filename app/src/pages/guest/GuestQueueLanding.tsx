/**
 * Guest: Queue landing page (scoped to a specific queue within an event).
 * Shows NOW SERVING, queue info, and Join / Re-Join / Leave actions.
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import DisplayField from '../../components/DisplayField';
import { useQueueMetric } from '../../hooks/useQueueMetric';
import { getStoredQueueTicket, clearQueueTicket } from '../../hooks/useQueueTicket';
import { getEventCheckIn } from '../../lib/checkInService';
import { getEventCheckInConfig } from '../../lib/eventConfig';
import { getEventBySlug } from '../../lib/eventService';
import { getGuestCreditForCheckIn } from '../../lib/guestCreditService';
import { getQueueBySlug, leaveQueue } from '../../lib/queueService';
import { formatDate, formatTime } from '../../lib/utils';
import type { QEvent, Queue } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';

type BouquetAccess = 'none' | 'checked-in' | 'general' | 'flowers';
type CreditStatus = 'none' | 'available' | 'used';

export default function GuestQueueLanding() {
  const navigate = useNavigate();
  const { eventSlug, queueSlug } = useParams<{ eventSlug: string; queueSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [event, setEvent] = useState<QEvent | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [loading, setLoading] = useState(true);
  const [bouquetAccess, setBouquetAccess] = useState<BouquetAccess>('none');
  const [headshotCreditStatus, setHeadshotCreditStatus] = useState<CreditStatus>('none');

  const { nowServing } = useQueueMetric(queue?.id);

  const [note1, setNote1] = useState('');
  const [buttonText, setButtonText] = useState('Join Queue');
  const [showLeave, setShowLeave] = useState(false);

  // Load event + queue
  useEffect(() => {
    if (!eventSlug || !queueSlug) return;
    (async () => {
      try {
        const ev = await getEventBySlug(eventSlug);
        setEvent(ev);
        const storedCheckIn = localStorage.getItem(`qme:eventCheckIn:${ev.id}`);
        setBouquetAccess('none');
        setHeadshotCreditStatus('none');
        if (storedCheckIn) {
          try {
            const saved = JSON.parse(storedCheckIn) as { id?: string };
            if (saved.id) {
              const row = await getEventCheckIn(saved.id);
              setBouquetAccess(row.status === 'completed' ? row.ticket_type ?? 'checked-in' : 'none');
              if (row.status === 'completed') {
                const credit = await getGuestCreditForCheckIn(row.id, 'professional_headshot');
                setHeadshotCreditStatus(credit
                  ? credit.quantity > credit.used_quantity ? 'available' : 'used'
                  : 'none');
              }
            }
          } catch {
            setBouquetAccess('none');
            setHeadshotCreditStatus('none');
          }
        }
        const q = await getQueueBySlug(ev.id, queueSlug);
        setQueue(q);
      } catch (e) {
        console.error('Failed to load queue', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventSlug, queueSlug]);

  // Handle ?cleared=1
  useEffect(() => {
    if (searchParams.get('cleared') === '1' && queue) {
      clearQueueTicket(queue.id);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, queue]);

  // Update UI based on stored ticket
  const updateUI = useCallback(() => {
    if (!queue) return;
    const t = getStoredQueueTicket(queue.id);
    if (t) {
      setButtonText('Re-Join Queue');
      setShowLeave(true);
      setNote1(`You have ticket #${t} in this queue`);
    } else {
      setButtonText('Join Queue');
      setShowLeave(false);
      setNote1('');
    }
  }, [queue]);

  useEffect(() => {
    updateUI();
  }, [updateUI]);

  // Cross-tab sync
  useEffect(() => {
    const handler = () => updateUI();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [updateUI]);

  // Handlers
  function handleJoin() {
    if (!queue || !eventSlug || !queueSlug) return;
    const t = getStoredQueueTicket(queue.id);
    if (t) {
      navigate(`/events/${eventSlug}/q/${queueSlug}/ticket?resume=1`);
    } else {
      navigate(`/events/${eventSlug}/q/${queueSlug}/ticket`);
    }
  }

  async function handleLeave() {
    if (!queue) return;
    const id = Number(getStoredQueueTicket(queue.id) || 0);
    if (id) {
      try { await leaveQueue(id, 'user'); } catch (e) {
        console.warn('leave POST failed (non-fatal)', e);
      }
    }
    clearQueueTicket(queue.id);
    updateUI();
  }

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading…</p>
      </div>
    );
  }

  if (!event || !queue) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Queue not found.</p>
      </div>
    );
  }

  const isBouquetQueue = queue.slug === 'wrapped-bouquets';
  const isHeadshotQueue = queue.slug === 'headshot-photo-station';
  const checkInConfig = getEventCheckInConfig(event);
  const requiresCompletedCheckIn = checkInConfig.requireCompletedForParticipation;
  const hasFlowersAccess = bouquetAccess === 'flowers';
  const needsBouquetAccess = isBouquetQueue && !hasFlowersAccess;
  const needsHeadshotCredit = isHeadshotQueue && headshotCreditStatus !== 'available';
  const hasAnyEventCheckIn = bouquetAccess !== 'none';
  const eventLogoSrc = event.slug === 'sotc-test-check-in'
    ? '/images/sotc-logo.png'
    : event.image_url || '/images/qmeFirstLogo.jpg';
  const queueImageSrc = queue.slug === 'scan-code-adventure'
    ? '/images/dog-through-hoop.png'
    : queue.slug === 'headshot-photo-station'
    ? '/images/headshot-photo-station.png'
    : queue.image_url || '';
  const queueHeaderLogoSrc = queueImageSrc || eventLogoSrc;

  if (requiresCompletedCheckIn && !hasAnyEventCheckIn) {
    return (
      <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
        <Header
          logoSrc={queueHeaderLogoSrc}
          titleLine1="CHECK"
          titleLine2="IN"
        />
        <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ background: '#E8F5E9', borderRadius: 14, padding: '1.25rem', color: '#1B5E20' }}>
            <h1 style={{ fontSize: '1.35rem', margin: '0 0 0.65rem' }}>
              Check in before joining
            </h1>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              You can view event information now. Complete event check-in before joining this experience.
            </p>
          </div>
          <button
            className="actionBtn actionBtn-primary"
            style={{ marginTop: '1rem' }}
            onClick={() => navigate(`/events/${eventSlug}/check-in`)}
          >
            Check In
          </button>
          <button
            className="actionBtn actionBtn-secondary"
            style={{ marginTop: '0.75rem' }}
            onClick={() => navigate(`/events/${eventSlug}`)}
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  if (needsBouquetAccess) {
    return (
      <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
        <Header
          logoSrc={queueHeaderLogoSrc}
          titleLine1=""
          titleLine2=""
        />
        <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ background: '#F0EEFF', borderRadius: 14, padding: '1.25rem', color: '#2f275f' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>
              Festival + Flowers Access
            </div>
            <h1 style={{ fontSize: '1.35rem', margin: '0.45rem 0 0.65rem' }}>
              {hasAnyEventCheckIn
                ? 'Bouquet Bar access is not on your check-in'
                : 'Check in before joining the Bouquet Bar'}
            </h1>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              {hasAnyEventCheckIn
                ? 'You are checked in for general admission. Bouquet Bar queue access is reserved for Festival + Flowers ticket holders.'
                : 'Bouquet Bar queue access is reserved for Festival + Flowers ticket holders. If you purchased Festival + Flowers, please check in at the mobile bar first.'}
            </p>
            <p style={{ margin: '0.85rem 0 0', lineHeight: 1.5 }}>
              If you would like to buy a bouquet today, please visit the bouquet team for availability.
            </p>
          </div>

          {!hasAnyEventCheckIn && (
            <button
              className="actionBtn actionBtn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => navigate(`/events/${eventSlug}/check-in`)}
            >
              Check In at Mobile Bar
            </button>
          )}
          <button
            className="actionBtn actionBtn-secondary"
            style={{ marginTop: '0.75rem' }}
            onClick={() => navigate(`/events/${eventSlug}`)}
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  if (needsHeadshotCredit) {
    return (
      <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
        <Header
          logoSrc={queueHeaderLogoSrc}
          titleLine1=""
          titleLine2=""
        />
        <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '1.25rem', color: '#24364a', border: '1px solid #d1d5db' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>
              {headshotCreditStatus === 'used' ? 'Photo Credit Used' : 'Photo Credit Required'}
            </div>
            <h1 style={{ fontSize: '1.35rem', margin: '0.45rem 0 0.65rem' }}>
              {headshotCreditStatus === 'used'
                ? 'Your headshot is already complete'
                : 'Headshot access is not on your check-in'}
            </h1>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              {headshotCreditStatus === 'used'
                ? 'Your photo credit has already been used for this event.'
                : 'This station is reserved for guests with a headshot photo credit. Please check with the event team if you expected one.'}
            </p>
          </div>
          <button
            className="actionBtn actionBtn-secondary"
            style={{ marginTop: '0.75rem' }}
            onClick={() => navigate(`/events/${eventSlug}`)}
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header
        logoSrc={queueHeaderLogoSrc}
        titleLine1=""
        titleLine2=""
      />

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

      <h1 className="headline" contentEditable suppressContentEditableWarning aria-label="Edit headline" style={{ margin: '0.5rem 0 0.75rem' }}>
        NOW SERVING
      </h1>

      <div className="metric1" role="group" aria-label="Primary metric">
        <input
          id="metric1"
          className="metricInput1"
          type="number"
          min={1}
          step={1}
          value={nowServing || ''}
          readOnly
          inputMode="numeric"
          aria-label="Metric value"
        />
      </div>

      <div className="inputs">
        <DisplayField id="dsp1" label="Queue" value={queue.name} className="displayInput3" />
        <DisplayField id="dsp4" label="Event" value={event.name} className="displayInput2" />
      </div>

      <div className="rule" aria-hidden="true" />

      {/* Queue description */}
      {queue.description && (
        <div className="miniGroup">
          {queueImageSrc && (
            <div className="mini">
              <img id="miniImg" src={queueImageSrc} alt="Badge" className="miniImg" />
            </div>
          )}
          <div className="miniText">
            <span className="miniLine">{queue.description}</span>
          </div>
        </div>
      )}

      {queue.slug === 'wrapped-bouquets' && hasFlowersAccess && (
        <div style={{
          margin: '0.75rem 1rem',
          borderRadius: 14,
          overflow: 'hidden',
          background: '#F0EEFF',
          border: '1px solid #D8D1FF',
          color: '#2f275f',
        }}>
          <img
            src={queueImageSrc || '/images/market-fresh-peonies.png'}
            alt="Festival and flowers access"
            style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }}
          />
          <div style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>
              Festival + Flowers Access
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, marginTop: 4 }}>
              Show this at the Bouquet Bar
            </div>
          </div>
        </div>
      )}

      <div className="inputs">
        <DisplayField id="dsp2" label="Event Date" value={formatDate(event.event_date)} className="displayInput3" />
        <DisplayField id="dsp5" label="Start Time" value={formatTime(event.start_time)} />
        <DisplayField id="dsp3" label="Time Zone" value={event.timezone} />
        <DisplayField id="dsp6" label="End Time" value={formatTime(event.end_time)} />
      </div>

      <div className="actionGroup" style={{ marginTop: 'auto' }}>
        <div className="actionNote">{note1}</div>
        <button className="actionBtn" onClick={handleJoin}>
          {buttonText}
        </button>
        {showLeave && (
          <button className="actionBtn" id="leaveBtn" onClick={handleLeave} aria-label="Leave queue">
            Leave Queue
          </button>
        )}
      </div>

      <div style={{ textAlign: 'center', paddingBottom: '1rem' }}>
        <button
          className="actionBtn actionBtn-secondary"
          style={{ margin: 0, width: 'auto', padding: '0.5rem 1.5rem' }}
          onClick={() => navigate(`/events/${eventSlug}`)}
        >
          ← Back to Event
        </button>
      </div>
      </div>
    </div>
  );
}
