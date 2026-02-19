import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import DisplayField from '../components/DisplayField';
import { useMetric1 } from '../hooks/useMetric1';
import { getStoredTicket, getStoredTicketNumber, clearTicketEverywhere } from '../hooks/useTicket';
import { leaveQueue } from '../lib/supabaseService';
import '../styles/shared.css';
import '../styles/guest.css';

export default function GuestSingleView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { nowServing } = useMetric1();

  // Page config (matches loadPageWithDetails in original)
  const [queueId] = useState('qq000001');
  const [queueName] = useState('Luna Bakery');
  const [miniImg] = useState('/images/lunaLogo.jpg');
  const [miniLine1] = useState(
    'Everything at Luna is made from scratch with care including'
  );
  const [miniLine2] = useState(
    'artisan coffee and pastries, fresh soups, salads, paninis, grain bowls, crêpes, and egg dishes.'
  );

  // Display values
  const [note1, setNote1] = useState('');
  const [note2, setNote2] = useState('');
  const [buttonText, setButtonText] = useState('Join Queue');
  const [showLeave, setShowLeave] = useState(false);

  // Handle ?cleared=1 from guest2 redirect
  useEffect(() => {
    if (searchParams.get('cleared') === '1') {
      clearTicketEverywhere();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Update UI based on stored ticket
  const updateUIFromTicket = useCallback(() => {
    const t = getStoredTicket();
    const num = getStoredTicketNumber();
    if (t) {
      setButtonText('Re-Join Queue');
      setShowLeave(true);
      setNote1(`You are already in the queue with ticket: ${num}`);
      setNote2('');
    } else {
      setButtonText('Join Queue');
      setShowLeave(false);
      setNote1('');
      setNote2('');
    }
  }, []);

  useEffect(() => {
    updateUIFromTicket();
  }, [updateUIFromTicket]);

  // Cross-tab sync
  useEffect(() => {
    if (!('BroadcastChannel' in window)) return;
    const qbc = new BroadcastChannel('queue');
    qbc.onmessage = (ev) => {
      if (ev?.data?.type === 'TICKET_CLEARED') updateUIFromTicket();
    };
    return () => qbc.close();
  }, [updateUIFromTicket]);

  // Storage event sync
  useEffect(() => {
    const handler = () => updateUIFromTicket();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [updateUIFromTicket]);

  // ---------- Handlers ----------
  function handleJoin() {
    const t = getStoredTicket();
    if (t) {
      navigate('/ticket?resume=1');
    } else {
      navigate('/ticket');
    }
  }

  async function handleLeave() {
    const confirmed = window.confirm(
      'Are you sure you want to leave the queue? If you re-enter, you will be placed at the back of the queue and lose your current position.'
    );
    if (!confirmed) return;

    const id = Number(getStoredTicket() || 0);
    if (id) {
      try {
        await leaveQueue(id, 'user');
      } catch (e) {
        console.warn('leave POST failed (non-fatal)', e);
      }
    }
    clearTicketEverywhere();
    try {
      const bc = new BroadcastChannel('queue');
      bc.postMessage({ type: 'TICKET_CLEARED' });
      bc.close();
    } catch { /* */ }
    updateUIFromTicket();
  }

  // Hidden button
  const [showResetBtn, setShowResetBtn] = useState(false);

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header
        logoSrc="/images/qmeFirstLogo.jpg"
        titleLine1=""
        titleLine2=""
      />

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

      {/* NOW SERVING headline */}
      <h1
        className="headline"
        contentEditable
        suppressContentEditableWarning
        aria-label="Edit headline"
        style={{ margin: '0.5rem 0 0.75rem' }}
      >
        NOW SERVING
      </h1>

      {/* Metric1 display */}
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

      {/* Mini group */}
      <div className="miniGroup">
        <div className="mini">
          <img id="miniImg" src={miniImg} alt="Badge" className="miniImg" />
        </div>
        <div className="miniText">
          <span className="miniLine">{miniLine1}</span>
          <span className="miniLine">{miniLine2}</span>
        </div>
      </div>

      <div className="inputs">
        <DisplayField id="dsp2" label="Event Date" value="08/10/2025" className="displayInput3" />
        <DisplayField id="dsp5" label="Event Start Time" value="11:00" />
        <DisplayField id="dsp3" label="Time Zone" value="EST" />
        <DisplayField id="dsp6" label="Event End Time" value="19:00" />
      </div>

      {/* Action group */}
      <div className="actionGroup" style={{ marginTop: 'auto' }}>
        <div className="actionNote">{note1}</div>
        <div className="actionNote">{note2}</div>
        <button className="actionBtn" onClick={handleJoin}>
          {buttonText}
        </button>
        {showLeave && (
          <button
            className="actionBtn"
            id="leaveBtn"
            onClick={handleLeave}
            aria-label="Leave queue"
          >
            Leave Queue
          </button>
        )}
      </div>
      </div>

      {/* Bottom-left hidden button */}
      <button
        className={`arrowBtn hiddenBtn pinBL ${showResetBtn ? 'show' : ''}`}
        aria-label="Secret button"
        onMouseEnter={() => setShowResetBtn(true)}
        onMouseLeave={() => setTimeout(() => setShowResetBtn(false), 150)}
      >
        R
      </button>
    </div>
  );
}
