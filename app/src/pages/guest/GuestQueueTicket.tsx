/**
 * Guest: Queue-scoped ticket page.
 * Shows queue position, NOW SERVING, progress tracker, and check-in flow.
 *
 * Auto-leave rules:
 *   - Served:    checked in AND nowServing advances 1+ past ticketNumber
 *   - Missed:    NOT checked in AND nowServing advances 2+ past ticketNumber
 *   - Manual:    guest taps "Leave Queue"
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useQueueMetric } from '../../hooks/useQueueMetric';
import { useQueueTicket, clearQueueTicket } from '../../hooks/useQueueTicket';
import { getEventBySlug } from '../../lib/eventService';
import { getEventCheckIn } from '../../lib/checkInService';
import { getQueueBySlug } from '../../lib/queueService';
import { formatTime } from '../../lib/utils';
import type { QEvent, Queue } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';
import '../../styles/ticket.css';

// How many positions past your number before auto-removal
const NO_CHECKIN_BYE = 2;  // missed turn — skipped without checking in
const CHECKIN_BYE    = 1;  // served — admin advanced past your number
const TIME_2_CHECKIN = 3;  // start prompting check-in when this many ahead

// Delay (ms) the "Enjoy!" screen stays visible before navigating away
const SERVED_LINGER_MS = 4000;

type StepState = 'done' | 'active' | 'pending';
type BouquetAccess = 'none' | 'checked-in' | 'general' | 'flowers';
const STEPS = ['In Queue', 'Called', 'Checked In', 'Enjoy!'];

function getStepStates(
  hasCheckedIn: boolean,
  nowServing: number,
  ticketNumber: number | null
): StepState[] {
  if (!ticketNumber) return ['active', 'pending', 'pending', 'pending'];
  const ahead = ticketNumber - nowServing;
  if (hasCheckedIn && nowServing >= ticketNumber) return ['done', 'done', 'done', 'active'];
  if (hasCheckedIn)                               return ['done', 'done', 'active', 'pending'];
  if (ahead <= TIME_2_CHECKIN && ahead >= 0)      return ['done', 'active', 'pending', 'pending'];
  return ['active', 'pending', 'pending', 'pending'];
}

export default function GuestQueueTicketPage() {
  const navigate = useNavigate();
  const { eventSlug, queueSlug } = useParams<{ eventSlug: string; queueSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [event, setEvent]   = useState<QEvent | null>(null);
  const [queue, setQueue]   = useState<Queue | null>(null);
  const [loading, setLoading] = useState(true);
  const [bouquetAccess, setBouquetAccess] = useState<BouquetAccess>('none');

  useEffect(() => {
    if (!eventSlug || !queueSlug) return;
    (async () => {
      try {
        const ev = await getEventBySlug(eventSlug);
        setEvent(ev);
        const storedCheckIn = localStorage.getItem(`qme:eventCheckIn:${ev.id}`);
        if (storedCheckIn) {
          try {
            const saved = JSON.parse(storedCheckIn) as { id?: string };
            if (saved.id) {
              const row = await getEventCheckIn(saved.id);
              setBouquetAccess(row.ticket_type ?? 'checked-in');
            }
          } catch {
            setBouquetAccess('none');
          }
        }
        const q  = await getQueueBySlug(ev.id, queueSlug);
        setQueue(q);
      } catch (e) {
        console.error('Failed to load queue', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventSlug, queueSlug]);

  const { nowServing } = useQueueMetric(queue?.id);
  const { ticketNumber, hasCheckedIn, claimTicket, checkIn, leave } = useQueueTicket(queue?.id);

  const [note1, setNote1]             = useState('');
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInDisabled, setCheckInDisabled] = useState(false);
  const [leaveDisabled, setLeaveDisabled]     = useState(false);
  // Served state: show celebration screen before clearing
  const [servedView, setServedView]   = useState(false);
  const [countdown, setCountdown]     = useState(Math.round(SERVED_LINGER_MS / 1000));

  const didApproachRef    = useRef(false);
  const didNowServingRef  = useRef(false);
  const didAutoLeaveRef   = useRef(false);

  // Nuke param (dev reset)
  useEffect(() => {
    if (searchParams.get('nuke') === '1' && queue) {
      clearQueueTicket(queue.id);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, queue]);

  // Claim ticket on mount
  useEffect(() => {
    if (!queue) return;
    if (queue.slug === 'wrapped-bouquets' && bouquetAccess !== 'flowers') return;
    claimTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, bouquetAccess]);

  // Countdown timer shown on the served screen
  useEffect(() => {
    if (!servedView) return;
    const secs = Math.round(SERVED_LINGER_MS / 1000);
    setCountdown(secs);
    let remaining = secs;
    const tick = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) clearInterval(tick);
    }, 1000);
    return () => clearInterval(tick);
  }, [servedView]);

  const evaluateProximity = useCallback(() => {
    if (nowServing == null || ticketNumber == null) return;

    const gap   = nowServing - ticketNumber;   // positive = nowServing has passed you
    const ahead = ticketNumber - nowServing;   // positive = you are still waiting

    // ── Auto-leave check ──────────────────────────────────────────────────
    if (!didAutoLeaveRef.current) {
      const served  = hasCheckedIn && gap >= CHECKIN_BYE;
      const missed  = !hasCheckedIn && gap >= NO_CHECKIN_BYE;

      if (served || missed) {
        didAutoLeaveRef.current = true;

        if (served) {
          // Mark ticket served, then show celebration screen
          leave('served').finally(() => {
            setServedView(true);
            setTimeout(() => navigate(`/events/${eventSlug}`), SERVED_LINGER_MS);
          });
        } else {
          // Missed turn — leave quietly, back to event
          leave('noCheckInTimeout').finally(() => {
            navigate(`/events/${eventSlug}?missed=1`);
          });
        }
        return;
      }
    }

    // ── Proximity messaging ───────────────────────────────────────────────

    // Far away — reset approach flag
    if (ahead > TIME_2_CHECKIN) {
      didApproachRef.current = false;
      if (!hasCheckedIn) { setShowCheckIn(false); setNote1(''); }
    }

    // Slipped back after being now-serving (edge case)
    if (nowServing < ticketNumber && didNowServingRef.current) {
      didNowServingRef.current = false;
      if (hasCheckedIn) { setShowCheckIn(false); setNote1("You're checked in — wait for your number"); }
    }

    // Approaching — prompt check-in
    if (!didApproachRef.current && ahead > 0 && ahead <= TIME_2_CHECKIN) {
      didApproachRef.current = true;
      if (!hasCheckedIn) {
        setShowCheckIn(true);
        setNote1('Head to the queue now — tap Check In when you arrive');
      } else {
        setShowCheckIn(false);
        setNote1("You're checked in — wait for your number");
      }
    }

    // Now serving your number
    if (gap >= 0) {
      if (hasCheckedIn) {
        if (!didNowServingRef.current) {
          didNowServingRef.current = true;
          setShowCheckIn(false);
          setNote1("It's your turn — enjoy!");
        }
      } else {
        setShowCheckIn(true);
        setNote1('Please check in now — tap Check In to continue.');
      }
    }
  }, [nowServing, ticketNumber, hasCheckedIn, leave, navigate, eventSlug]);

  useEffect(() => { evaluateProximity(); }, [evaluateProximity]);

  function handleCheckIn() {
    if (hasCheckedIn) return;
    setCheckInDisabled(true);
    checkIn();
    setShowCheckIn(false);
    setNote1("You're checked in!");
  }

  async function handleLeave() {
    const confirmed = window.confirm('Leave the queue? You will lose your current position.');
    if (!confirmed) return;
    setLeaveDisabled(true);
    setCheckInDisabled(true);
    await leave('user');
    navigate(`/events/${eventSlug}`);
  }

  // ── Loading / error states ────────────────────────────────────────────────

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
  const hasFlowersAccess = bouquetAccess === 'flowers';
  const needsBouquetAccess = isBouquetQueue && !hasFlowersAccess;
  const hasAnyEventCheckIn = bouquetAccess !== 'none';

  if (needsBouquetAccess) {
    return (
      <div className="card card-scrollable tkt-card">
        <div className="tkt-header">
          <div className="tkt-header-left">
            <img
              src={queue.image_url || '/images/market-fresh-peonies.png'}
              alt="Bouquet Bar"
              className="tkt-logo"
            />
            <div className="tkt-header-info">
              <div className="tkt-queue-name">Bouquet Bar</div>
              <div className="tkt-event-name">{event.name}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.25rem', textAlign: 'center' }}>
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
              className="tkt-btn-checkin"
              style={{ marginTop: '1rem' }}
              onClick={() => navigate(`/events/${eventSlug}/check-in`)}
            >
              Check In at Mobile Bar
            </button>
          )}
          <button
            className="tkt-leave-btn"
            style={{ marginTop: '0.75rem' }}
            onClick={() => navigate(`/events/${eventSlug}`)}
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  // ── Served celebration screen ─────────────────────────────────────────────

  if (servedView) {
    return (
      <div className="card card-scrollable tkt-card">
        <div className="tkt-served-screen">
          <div className="tkt-served-check">✓</div>
          <h2 className="tkt-served-title">You're all set!</h2>
          <p className="tkt-served-sub">
            Thanks for visiting <strong>{queue.name}</strong>.<br />
            Enjoy the rest of {event.name}!
          </p>
          <div className="tkt-served-event-badge">
            <span>🎉</span>
            <span>{event.name}</span>
          </div>
          <p className="tkt-served-countdown">
            Returning to event in {countdown}s…
          </p>
          <button
            className="tkt-btn-checkin"
            style={{ marginTop: '8px' }}
            onClick={() => navigate(`/events/${eventSlug}`)}
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  // ── Normal ticket view ────────────────────────────────────────────────────

  const stepStates  = getStepStates(hasCheckedIn, nowServing, ticketNumber);
  const aheadCount  = ticketNumber != null ? Math.max(0, ticketNumber - nowServing) : null;
  const waitMins    = aheadCount != null ? aheadCount * 5 : null;
  const venueUrl    = `${window.location.origin}/events/${eventSlug}/q/${queueSlug}`;

  return (
    <div className="card card-scrollable tkt-card">

      {/* ── Header ── */}
      <div className="tkt-header">
        <div className="tkt-header-left">
          <img
            src={queue.image_url || '/images/zippy.png'}
            alt={queue.name}
            className="tkt-logo"
          />
          <div className="tkt-header-info">
            <div className="tkt-queue-name">{queue.name}</div>
            <div className="tkt-event-name">{event.name}</div>
          </div>
        </div>
        <div className="tkt-active-badge">● Active</div>
      </div>

      {/* ── Check-in alert ── */}
      {showCheckIn && (
        <div className="tkt-alert">
          🔔 {note1 || 'Please check in now — tap Check In to continue.'}
        </div>
      )}

      {queue.slug === 'wrapped-bouquets' && hasFlowersAccess && (
        <div style={{
          margin: '0 1rem 0.75rem',
          borderRadius: 14,
          overflow: 'hidden',
          background: '#F0EEFF',
          border: '1px solid #D8D1FF',
          color: '#2f275f',
        }}>
          <img
            src={queue.image_url || '/images/market-fresh-peonies.png'}
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

      <div className="tkt-scroll-body">

        {/* ── Queue position ── */}
        <div className="tkt-position-section">
          <div className="tkt-position-label">YOUR QUEUE POSITION</div>
          <div className="tkt-position-number">{ticketNumber ?? '—'}</div>
          <div className="tkt-now-serving">NOW SERVING: {nowServing}</div>
          {waitMins != null && waitMins > 0 && (
            <div className="tkt-wait">⏱ Estimated wait: ~{Math.min(waitMins, 60)} min</div>
          )}
        </div>

        {/* ── Info grid ── */}
        <div className="tkt-info-grid">
          <div className="tkt-info-cell">
            <div className="tkt-info-label">QUEUE</div>
            <div className="tkt-info-val">{queue.name}</div>
          </div>
          <div className="tkt-info-cell">
            <div className="tkt-info-label">EVENT</div>
            <div className="tkt-info-val">{event.name}</div>
          </div>
          <div className="tkt-info-cell">
            <div className="tkt-info-label">STARTS</div>
            <div className="tkt-info-val">{formatTime(event.start_time)}</div>
          </div>
          {event.start_time && (
            <div className="tkt-info-cell">
              <div className="tkt-info-label">JOIN FROM</div>
              <div className="tkt-info-val">4:30 PM</div>
            </div>
          )}
        </div>

        {/* ── QR code ── */}
        <div className="tkt-qr-section">
          <div className="tkt-qr-wrap">
            <QRCodeSVG value={venueUrl} size={100} bgColor="#fff" fgColor="#1a1a2e" level="M" />
          </div>
          <div className="tkt-qr-info">
            <div className="tkt-qr-title">REPORT TO</div>
            <div className="tkt-qr-name">{queue.name}</div>
            {event.location && <div className="tkt-qr-loc">{event.location}</div>}
            <div className="tkt-qr-ready">● Staff is ready for you</div>
          </div>
        </div>

        {/* ── Progress tracker ── */}
        <div className="tkt-progress">
          {STEPS.map((label, i) => {
            const state = stepStates[i];
            return (
              <div key={label} className="tkt-step">
                {i > 0 && (
                  <div className={`tkt-step-line ${
                    state === 'pending' && stepStates[i - 1] !== 'done'
                      ? 'tkt-line-gray' : 'tkt-line-purple'
                  }`} />
                )}
                <div className={`tkt-step-circle tkt-step-${state}`}>
                  {state === 'done' ? '✓' : i + 1}
                </div>
                <div className={`tkt-step-label ${state === 'active' ? 'tkt-step-label-active' : ''}`}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        {!showCheckIn && note1 && <div className="tkt-note">{note1}</div>}

      </div>

      {/* ── Actions ── */}
      <div className="tkt-actions">
        {showCheckIn && (
          <button className="tkt-btn-checkin" onClick={handleCheckIn} disabled={checkInDisabled}>
            ✓ Check In Now
          </button>
        )}
        <div className="tkt-secondary-actions">
          <button className="tkt-link-btn" onClick={() => {
            if (navigator.share) {
              navigator.share({ title: `My spot at ${queue.name}`, url: window.location.href });
            } else {
              navigator.clipboard?.writeText(window.location.href);
            }
          }}>⬆ Share</button>
          <button className="tkt-link-btn" onClick={() => navigate(`/events/${eventSlug}`)}>
            ← Event
          </button>
        </div>
        <button className="tkt-leave-btn" onClick={handleLeave} disabled={leaveDisabled}>
          Leave Queue
        </button>
      </div>

      {/* ── Footer ── */}
      <div className="tkt-footer">
        <span>{queue.name}</span>
        <span className="tkt-footer-live">● Live updates on</span>
      </div>
    </div>
  );
}
