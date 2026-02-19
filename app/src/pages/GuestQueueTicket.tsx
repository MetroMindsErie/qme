import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import DisplayField from '../components/DisplayField';
import { useMetric1 } from '../hooks/useMetric1';
import { useTicket } from '../hooks/useTicket';
import '../styles/shared.css';
import '../styles/guest.css';

// ----- Settings (match original) -----
const NO_CHECKIN_BYE = 5;   // force leave if not checked in and (m1 - m2) >= this
const CHECKIN_BYE = 9;      // force leave if checked in and (m1 - m2) >= this
const TIME_2_CHECKIN = 3;   // trigger "approaching" when (m2 - m1) <= this

export default function GuestQueueTicket() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { nowServing } = useMetric1();
  const {
    ticketNumber,
    hasCheckedIn,
    claimTicket,
    checkIn,
    leave,
    setHasCheckedIn,
  } = useTicket();

  // UI state
  const [note1, setNote1] = useState('');
  const [note2, setNote2] = useState('');
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [borderColor, setBorderColor] = useState('');
  const [checkInDisabled, setCheckInDisabled] = useState(false);
  const [leaveDisabled, setLeaveDisabled] = useState(false);

  // Proximity tracking
  const didApproachRef = useRef(false);
  const didNowServingRef = useRef(false);
  const didAutoLeaveRef = useRef(false);

  // Page config (matches loadPageWithDetails)
  const [queueId] = useState('qq000001');
  const [queueName] = useState('Luna Bakery');

  // ---------- Claim ticket on mount ----------
  useEffect(() => {
    // Handle ?nuke=1
    if (searchParams.get('nuke') === '1') {
      try { localStorage.removeItem('guest:ticketId'); } catch { /* */ }
      try { localStorage.removeItem('guest2:ticket'); } catch { /* */ }
      try { sessionStorage.removeItem('guest2:ticket'); } catch { /* */ }
      try { sessionStorage.removeItem('guest2:checkedIn'); } catch { /* */ }
      setSearchParams({}, { replace: true });
    }

    claimTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Proximity logic ----------
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
          navigate('/?cleared=1');
        });
        return;
      }
    }

    const ahead = m2 - m1;

    // If far away, reset approach and hide check-in
    if (ahead > TIME_2_CHECKIN) {
      didApproachRef.current = false;
      if (!hasCheckedIn) {
        setShowCheckIn(false);
        setNote1('');
        setNote2('');
      }
    }

    // If slipped back after being now-serving
    if (m1 < m2 && didNowServingRef.current) {
      didNowServingRef.current = false;
      setBorderColor('');
      if (hasCheckedIn) {
        setShowCheckIn(false);
        setNote1("You're checked in");
        setNote2('Wait until <Your Number> matches <NOW SERVING>');
      }
    }

    // 1) Approaching: within threshold, still ahead
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
        // Not checked in: prompt
        setShowCheckIn(true);
        setNote1('Please check in now');
        setNote2('Tap <Check In> to continue');
        setBorderColor('');
      }
    }
  }, [nowServing, ticketNumber, hasCheckedIn, leave, navigate]);

  // Run proximity check whenever inputs change
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
    navigate('/?cleared=1');
  }

  // Hidden button
  const [showResetBtn, setShowResetBtn] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <div className="card" style={borderColor ? { borderColor } : undefined}>
      <Header
        logoSrc="/images/qmeFirstLogo.jpg"
        titleLine1="NOW"
        titleLine2="SERVING"
      />

      {/* Metric1: NOW SERVING */}
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
        <DisplayField id="dsp1" label="Queue ID" value={queueId} className="displayInput3" />
        <DisplayField id="dsp4" label="Queue Name" value={queueName} className="displayInput2" />
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

      {/* Metric2: Your ticket */}
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
        <DisplayField id="dsp2" label="Event Date" value="08/10/2025" className="displayInput3" />
        <DisplayField id="dsp5" label="Event Start Time" value="11:00" />
        <DisplayField id="dsp3" label="Time Zone" value="EST" />
        <DisplayField id="dsp6" label="Event End Time" value="19:00" />
      </div>

      {/* Action group */}
      <div id="actionGroup" className="actionGroup">
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

      {/* Bottom-left hidden button */}
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
