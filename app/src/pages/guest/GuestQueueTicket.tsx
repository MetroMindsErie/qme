/**
 * Guest: Queue-scoped ticket page.
 * Shows queue position, NOW SERVING, progress tracker, and check-in flow.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useQueueMetric } from '../../hooks/useQueueMetric';
import { useQueueTicket, clearQueueTicket } from '../../hooks/useQueueTicket';
import { getEventBySlug } from '../../lib/eventService';
import { getQueueBySlug } from '../../lib/queueService';
import { formatTime } from '../../lib/utils';
import type { QEvent, Queue } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';
import '../../styles/ticket.css';

const NO_CHECKIN_BYE = 5;
const CHECKIN_BYE = 9;
const TIME_2_CHECKIN = 3;

// Progress step states
type StepState = 'done' | 'active' | 'pending';

const STEPS = ['In Queue', 'Called', 'Checked In', 'Enjoy!'];

function getStepStates(hasCheckedIn: boolean, nowServing: number, ticketNumber: number | null): StepState[] {
  if (!ticketNumber) return ['active', 'pending', 'pending', 'pending'];

  const ahead = ticketNumber - nowServing;

  if (hasCheckedIn && nowServing >= ticketNumber) {
    // All done — being served
    return ['done', 'done', 'done', 'active'];
  }
  if (hasCheckedIn) {
    return ['done', 'done', 'active', 'pending'];
  }
  if (ahead <= TIME_2_CHECKIN && ahead >= 0) {
    // Called — need to check in
    return ['done', 'active', 'pending', 'pending'];
  }
  return ['active', 'pending', 'pending', 'pending'];
}

export default function GuestQueueTicketPage() {
  const navigate = useNavigate();
  const { eventSlug, queueSlug } = useParams<{ eventSlug: string; queueSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [event, setEvent] = useState<QEvent | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventSlug || !queueSlug) return;
    (async () => {
      try {
        const ev = await getEventBySlug(eventSlug);
        setEvent(ev);
        const q = await getQueueBySlug(ev.id, queueSlug);
        setQueue(q);
      } catch (e) {
        console.error('Failed to load queue', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventSlug, queueSlug]);

  const { nowServing } = useQueueMetric(queue?.id);
  const {
    ticketNumber,
    hasCheckedIn,
    claimTicket,
    checkIn,
    leave,
  } = useQueueTicket(queue?.id);

  const [note1, setNote1] = useState('');
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInDisabled, setCheckInDisabled] = useState(false);
  const [leaveDisabled, setLeaveDisabled] = useState(false);

  const didApproachRef = useRef(false);
  const didNowServingRef = useRef(false);
  const didAutoLeaveRef = useRef(false);

  useEffect(() => {
    if (searchParams.get('nuke') === '1' && queue) {
      clearQueueTicket(queue.id);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, queue]);

  useEffect(() => {
    if (!queue) return;
    claimTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  const evaluateProximity = useCallback(() => {
    if (nowServing == null || ticketNumber == null) return;

    const m1 = nowServing;
    const m2 = ticketNumber;

    if (!didAutoLeaveRef.current) {
      const gap = m1 - m2;
      const shouldKick =
        (!hasCheckedIn && gap >= NO_CHECKIN_BYE) ||
        (hasCheckedIn && gap >= CHECKIN_BYE);

      if (shouldKick) {
        didAutoLeaveRef.current = true;
        const reason = hasCheckedIn ? 'checkedInTimeout' : 'noCheckInTimeout';
        leave(reason).finally(() => {
          navigate(`/events/${eventSlug}/q/${queueSlug}?cleared=1`);
        });
        return;
      }
    }

    const ahead = m2 - m1;

    if (ahead > TIME_2_CHECKIN) {
      didApproachRef.current = false;
      if (!hasCheckedIn) {
        setShowCheckIn(false);
        setNote1('');
      }
    }

    if (m1 < m2 && didNowServingRef.current) {
      didNowServingRef.current = false;
      if (hasCheckedIn) {
        setShowCheckIn(false);
        setNote1("You're checked in — wait for your number");
      }
    }

    if (!didApproachRef.current && ahead > 0 && ahead <= TIME_2_CHECKIN) {
      didApproachRef.current = true;
      if (!hasCheckedIn) {
        setShowCheckIn(true);
        setNote1('Head to the queue now and tap Check In when you arrive');
      } else {
        setShowCheckIn(false);
        setNote1("You're checked in — wait for your number");
      }
    }

    if (m1 - m2 >= 0) {
      if (hasCheckedIn) {
        if (!didNowServingRef.current) {
          didNowServingRef.current = true;
          setShowCheckIn(false);
          setNote1("It's your turn!");
        }
      } else {
        setShowCheckIn(true);
        setNote1('Please check in now — tap Check In to continue.');
      }
    }
  }, [nowServing, ticketNumber, hasCheckedIn, leave, navigate, eventSlug, queueSlug]);

  useEffect(() => {
    evaluateProximity();
  }, [evaluateProximity]);

  function handleCheckIn() {
    if (hasCheckedIn) return;
    setCheckInDisabled(true);
    checkIn();
    setShowCheckIn(false);
    setNote1("You're checked in!");
  }

  async function handleLeave() {
    const confirmed = window.confirm(
      'Leave the queue? You will lose your current position.'
    );
    if (!confirmed) return;
    setLeaveDisabled(true);
    setCheckInDisabled(true);
    await leave('user');
    navigate(`/events/${eventSlug}/q/${queueSlug}?cleared=1`);
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

  const stepStates = getStepStates(hasCheckedIn, nowServing, ticketNumber);
  const aheadCount = ticketNumber != null ? Math.max(0, ticketNumber - nowServing) : null;
  const waitMins = aheadCount != null ? aheadCount * 5 : null;
  const venueUrl = `${window.location.origin}/events/${eventSlug}/q/${queueSlug}`;

  return (
    <div className="card card-scrollable tkt-card">

      {/* ── Header ── */}
      <div className="tkt-header">
        <div className="tkt-header-left">
          {queue.image_url
            ? <img src={queue.image_url} alt={queue.name} className="tkt-logo" />
            : <div className="tkt-logo-placeholder">qMe</div>}
          <div className="tkt-header-info">
            <div className="tkt-queue-name">{queue.name}</div>
            <div className="tkt-event-name">{event.name}</div>
          </div>
        </div>
        <div className="tkt-active-badge">● Active</div>
      </div>

      {/* ── Check-in alert (shown when it's time) ── */}
      {showCheckIn && (
        <div className="tkt-alert">
          🔔 {note1 || 'Please check in now — tap Check In to continue.'}
        </div>
      )}

      <div className="tkt-scroll-body">

        {/* ── Queue Position ── */}
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

        {/* ── QR code section ── */}
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
                  <div className={`tkt-step-line ${state === 'pending' && stepStates[i - 1] !== 'done' ? 'tkt-line-gray' : 'tkt-line-purple'}`} />
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

        {/* ── Action note (non-alert version) ── */}
        {!showCheckIn && note1 && (
          <div className="tkt-note">{note1}</div>
        )}

      </div>

      {/* ── Action group ── */}
      <div className="tkt-actions">
        {showCheckIn && (
          <button
            className="tkt-btn-checkin"
            onClick={handleCheckIn}
            disabled={checkInDisabled}
          >
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
          }}>
            ⬆ Share
          </button>
          <button className="tkt-link-btn" onClick={() => navigate(`/events/${eventSlug}`)}>
            ← Event
          </button>
        </div>

        <button
          className="tkt-leave-btn"
          onClick={handleLeave}
          disabled={leaveDisabled}
        >
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
