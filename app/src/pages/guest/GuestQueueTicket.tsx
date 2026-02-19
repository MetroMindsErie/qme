/**
 * Guest: Queue-scoped ticket page.
 * Shows NOW SERVING + Your Number with proximity / check-in / auto-leave logic.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import DisplayField from '../../components/DisplayField';
import { useQueueMetric } from '../../hooks/useQueueMetric';
import { useQueueTicket, clearQueueTicket } from '../../hooks/useQueueTicket';
import { getEventBySlug } from '../../lib/eventService';
import { getQueueBySlug } from '../../lib/queueService';
import { formatDate, formatTime } from '../../lib/utils';
import type { QEvent, Queue } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';

// ---------- Proximity thresholds (match original) ----------
const NO_CHECKIN_BYE = 5;   // force leave if NOT checked in and (m1 - m2) >= this
const CHECKIN_BYE = 9;      // force leave if checked in and (m1 - m2) >= this
const TIME_2_CHECKIN = 3;   // trigger "approaching" when (m2 - m1) <= this

export default function GuestQueueTicketPage() {
  const navigate = useNavigate();
  const { eventSlug, queueSlug } = useParams<{ eventSlug: string; queueSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [event, setEvent] = useState<QEvent | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [loading, setLoading] = useState(true);

  // Load event + queue metadata
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

  // Queue-scoped hooks – only activate once we know queue.id
  const { nowServing } = useQueueMetric(queue?.id);
  const {
    ticketNumber,
    hasCheckedIn,
    claimTicket,
    checkIn,
    leave,
  } = useQueueTicket(queue?.id);

  // UI state
  const [note1, setNote1] = useState('');
  const [note2, setNote2] = useState('');
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [borderColor, setBorderColor] = useState('');
  const [checkInDisabled, setCheckInDisabled] = useState(false);
  const [leaveDisabled, setLeaveDisabled] = useState(false);

  // Proximity tracking refs
  const didApproachRef = useRef(false);
  const didNowServingRef = useRef(false);
  const didAutoLeaveRef = useRef(false);

  // ---------- Handle ?nuke / ?resume ----------
  useEffect(() => {
    if (searchParams.get('nuke') === '1' && queue) {
      clearQueueTicket(queue.id);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, queue]);

  // ---------- Claim ticket on mount ----------
  useEffect(() => {
    if (!queue) return;
    claimTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  // ---------- Proximity evaluation ----------
  const evaluateProximity = useCallback(() => {
    if (nowServing == null || ticketNumber == null) return;

    const m1 = nowServing;
    const m2 = ticketNumber;

    // Auto-leave check
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

    // Far away – reset approach flag
    if (ahead > TIME_2_CHECKIN) {
      didApproachRef.current = false;
      if (!hasCheckedIn) {
        setShowCheckIn(false);
        setNote1('');
        setNote2('');
      }
    }

    // Slipped back after being now-serving
    if (m1 < m2 && didNowServingRef.current) {
      didNowServingRef.current = false;
      setBorderColor('');
      if (hasCheckedIn) {
        setShowCheckIn(false);
        setNote1("You're checked in");
        setNote2('Wait until <Your Number> matches <NOW SERVING>');
      }
    }

    // 1) Approaching
    if (!didApproachRef.current && ahead > 0 && ahead <= TIME_2_CHECKIN) {
      didApproachRef.current = true;
      if (!hasCheckedIn) {
        setShowCheckIn(true);
        setNote1('It is time to head to the queue');
        setNote2('Click on <Check In> when you arrive');
      } else {
        setShowCheckIn(false);
        setNote1("You're checked in");
        setNote2('Wait until <Your Number> matches <NOW SERVING>');
      }
    }

    // 2) Now serving (m1 >= m2)
    if (m1 - m2 >= 0) {
      if (hasCheckedIn) {
        if (!didNowServingRef.current) {
          didNowServingRef.current = true;
          setShowCheckIn(false);
          setNote1('It is your turn to place an order');
          setNote2('<NOW SERVING> has reached <Your Number>');
          setBorderColor('#00ff55');
        }
      } else {
        setShowCheckIn(true);
        setNote1('Please check in now');
        setNote2('Tap <Check In> to continue');
        setBorderColor('');
      }
    }
  }, [nowServing, ticketNumber, hasCheckedIn, leave, navigate, eventSlug, queueSlug]);

  useEffect(() => {
    evaluateProximity();
  }, [evaluateProximity]);

  // ---------- Handlers ----------
  function handleCheckIn() {
    if (hasCheckedIn) return;
    setCheckInDisabled(true);
    checkIn();
    setShowCheckIn(false);
    setNote1("You're checked in");
    setNote2('Wait until <Your Number> matches <NOW SERVING>');
  }

  async function handleLeave() {
    const confirmed = window.confirm(
      'Are you sure you want to leave the queue? If you re-enter, you will be placed at the back of the queue and lose your current position.'
    );
    if (!confirmed) return;

    setLeaveDisabled(true);
    setCheckInDisabled(true);
    await leave('user');
    navigate(`/events/${eventSlug}/q/${queueSlug}?cleared=1`);
  }

  // Hidden button
  const [showResetBtn, setShowResetBtn] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------- Render ----------
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

  return (
    <div className="card card-scrollable" style={borderColor ? { ...{ borderColor }, minHeight: '600px', maxHeight: '90vh' } : { minHeight: '600px', maxHeight: '90vh' }}>
      <Header
        logoSrc={queue.image_url || event.image_url || '/images/qmeFirstLogo.jpg'}
        titleLine1="NOW"
        titleLine2="SERVING"
      />

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

      {/* NOW SERVING value */}
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

      {/* Your Number headline */}
      <h2
        className="headline2"
        contentEditable
        suppressContentEditableWarning
        aria-label="Edit headline2"
      >
        Your Number
      </h2>

      {/* Your ticket number */}
      <div className="metric2" role="group" aria-label="Secondary metric">
        <input
          id="metric2"
          className="metricInput2"
          type="number"
          min={1}
          step={1}
          value={ticketNumber ?? ''}
          readOnly
          inputMode="numeric"
          aria-label="Metric value2"
        />
      </div>

      <div className="inputs">
        <DisplayField id="dsp2" label="Event Date" value={formatDate(event.event_date)} className="displayInput3" />
        <DisplayField id="dsp5" label="Start Time" value={formatTime(event.start_time)} />
        <DisplayField id="dsp3" label="Time Zone" value={event.timezone} />
        <DisplayField id="dsp6" label="End Time" value={formatTime(event.end_time)} />
      </div>

      {/* Action group */}
      <div id="actionGroup" className="actionGroup" style={{ marginTop: 'auto' }}>
        <div className="actionNote">{note1}</div>
        <div className="actionNote">{note2}</div>
        {showCheckIn && (
          <button
            className="actionBtn"
            id="actionBtn"
            onClick={handleCheckIn}
            disabled={checkInDisabled}
          >
            Check In
          </button>
        )}
        <button
          className="actionBtn"
          id="leaveBtn"
          onClick={handleLeave}
          disabled={leaveDisabled}
          aria-label="Leave queue"
        >
          Leave Queue
        </button>
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

      {/* Hidden button (bottom-left) */}
      <button
        className={`arrowBtn hiddenBtn pinBL ${showResetBtn ? 'show' : ''}`}
        aria-label="Secret button"
        onMouseEnter={() => {
          setShowResetBtn(true);
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          hideTimerRef.current = setTimeout(() => setShowResetBtn(false), 1000);
        }}
        onMouseLeave={() => {
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          hideTimerRef.current = setTimeout(() => setShowResetBtn(false), 150);
        }}
      >
        R
      </button>
    </div>
  );
}
