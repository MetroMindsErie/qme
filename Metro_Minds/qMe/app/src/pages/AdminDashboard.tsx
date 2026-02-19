import { useEffect, useState, useCallback, useRef } from 'react';
import Header from '../components/Header';
import DisplayField from '../components/DisplayField';
import { useMetric1 } from '../hooks/useMetric1';
import {
  peekTicket,
  getLostCount,
  resetQueue,
} from '../lib/supabaseService';
import '../styles/shared.css';
import '../styles/admin.css';

export default function AdminDashboard() {
  const { nowServing, setNowServing } = useMetric1();
  const [lastIssued, setLastIssued] = useState(0);
  const [lostCount, setLostCount] = useState(0);
  const [headline, setHeadline] = useState('Cedar Hill Luna Sunday');
  const [logoSrc, setLogoSrc] = useState('/images/lunaLogo.jpg');
  const [queueId] = useState('qq000001');
  const [queueName] = useState('Luna Bakery');
  const inputRef = useRef<HTMLInputElement>(null);
  const lastAppliedRef = useRef<string | null>(null);

  // Metric input value (tracks what user types)
  const [inputValue, setInputValue] = useState(String(nowServing));

  // Sync inputValue when nowServing changes externally
  useEffect(() => {
    setInputValue(String(nowServing));
  }, [nowServing]);

  // Queue count = lastIssued - nowServing + 1 (clamped ≥ 0)
  const queueCount = Math.max(0, lastIssued - nowServing + 1);

  // ---------- Refresh functions ----------
  const refreshTicket = useCallback(async () => {
    try {
      const val = await peekTicket();
      setLastIssued(val);
    } catch (e) {
      console.error('peek failed', e);
    }
  }, []);

  const refreshLost = useCallback(async () => {
    try {
      const val = await getLostCount();
      setLostCount(val);
    } catch (e) {
      console.error('lost fetch failed', e);
    }
  }, []);

  useEffect(() => {
    refreshTicket();
    refreshLost();
    const t1 = setInterval(refreshTicket, 2000);
    const t2 = setInterval(refreshLost, 2000);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, [refreshTicket, refreshLost]);

  // ---------- Metric controls ----------
  function applyMetricFromUI() {
    const v = inputValue;
    if (v === lastAppliedRef.current) return;
    lastAppliedRef.current = v;
    const n = parseInt(v, 10);
    const safe = Number.isFinite(n) ? Math.max(1, n) : 1;
    setNowServing(safe);
  }

  function updateMetric(delta: number) {
    const prev = nowServing;
    const next = Math.max(1, prev + delta);
    if (next !== prev) setNowServing(next);
  }

  // ---------- Reset ----------
  const [showReset, setShowReset] = useState(false);
  let hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleReset() {
    const confirmed = window.confirm(
      'Reset the entire queue? This will remove all tickets and reset numbering to 1. This cannot be undone.'
    );
    if (!confirmed) return;
    try {
      await resetQueue();
      setNowServing(1);
      await refreshTicket();
      console.log('Queue reset, metric1 set to 1');
    } catch (e) {
      console.error('Reset failed', e);
    }
  }

  // This exists in original as a "secret" button feature
  void setHeadline;
  void setLogoSrc;

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header
        logoSrc={logoSrc}
        titleLine1=""
        titleLine2=""
      />

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

      <h1
        className="headline"
        contentEditable
        suppressContentEditableWarning
        aria-label="Edit headline"
        style={{ margin: '0.5rem 0 0.75rem' }}
      >
        {headline}
      </h1>

      <div className="rule" aria-hidden="true" style={{ margin: '0.5rem auto' }} />

      <div className="inputs">
        <DisplayField id="dsp1" label="Queue ID" value={queueId} className="displayInput3" />
        <DisplayField id="dsp4" label="Queue Name" value={queueName} className="displayInput2" />
        <DisplayField id="dsp2" label="# in Queue" value={String(queueCount)} />
        <DisplayField id="dsp5" label="Guests lost" value={String(lostCount)} />
      </div>

      <div className="rule" aria-hidden="true" />

      <h2
        className="headline2"
        contentEditable
        suppressContentEditableWarning
        aria-label="Edit headline2"
      >
        NOW SERVING
      </h2>

      {/* Big metric */}
      <div className="metric" role="group" aria-label="Primary metric">
        <input
          ref={inputRef}
          id="metricValue"
          className="metricInput"
          type="number"
          min={1}
          step={1}
          value={inputValue}
          inputMode="numeric"
          aria-label="Metric value"
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={applyMetricFromUI}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); updateMetric(1); }
            if (e.key === 'ArrowDown') { e.preventDefault(); updateMetric(-1); }
            if (e.key === 'Enter') applyMetricFromUI();
          }}
        />
      </div>

      {/* Arrow controls */}
      <div className="arrows" id="arrows">
        <button
          className="arrowBtn"
          id="leftArrow"
          aria-label="Left arrow"
          onClick={() => updateMetric(-1)}
        >
          <img src="/images/left_arrow.jpg" alt="Left arrow" />
        </button>

        {/* Hidden middle button (reset) */}
        <button
          className={`arrowBtn hiddenBtn ${showReset ? 'show' : ''}`}
          id="middleBtn"
          aria-label="Reset queue"
          onClick={handleReset}
          onMouseEnter={() => {
            setShowReset(true);
            if (hideTimer.current) clearTimeout(hideTimer.current);
            hideTimer.current = setTimeout(() => setShowReset(false), 1000);
          }}
          onMouseLeave={() => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
            hideTimer.current = setTimeout(() => setShowReset(false), 150);
          }}
        >
          R
        </button>

        <button
          className="arrowBtn"
          id="rightArrow"
          aria-label="Right arrow"
          onClick={() => updateMetric(1)}
        >
          <img src="/images/right_arrow.jpg" alt="Right arrow" />
        </button>
      </div>

      {/* Admin controls */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 12px', marginTop: 'auto' }}>
        <button
          className="actionBtn actionBtn-danger"
          style={{ margin: 0, width: 'auto', padding: '0.5rem 1.5rem' }}
          onClick={handleReset}
        >
          Reset Queue
        </button>
      </div>
      </div>
    </div>
  );
}
