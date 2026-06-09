/**
 * Admin: Live queue operations dashboard for a specific queue.
 * This is the per-queue equivalent of the original AdminDashboard,
 * with NOW SERVING controls, queue count, lost count, and reset.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import DisplayField from '../../components/DisplayField';
import { useQueueMetric } from '../../hooks/useQueueMetric';
import {
  getQueue,
  resetQueueTickets,
} from '../../lib/queueService';
import { getEvent } from '../../lib/eventService';
import { listEventCheckIns, onEventCheckInsChange } from '../../lib/checkInService';
import type { Queue as QueueType, QEvent, EventCheckIn } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

export default function AdminQueueDashboard() {
  const navigate = useNavigate();
  const { eventId, queueId } = useParams<{ eventId: string; queueId: string }>();
  const { nowServing, setNowServing } = useQueueMetric(queueId);

  const [queue, setQueue] = useState<QueueType | null>(null);
  const [event, setEvent] = useState<QEvent | null>(null);
  const [flowersCheckIns, setFlowersCheckIns] = useState<EventCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastAppliedRef = useRef<string | null>(null);
  const [inputValue, setInputValue] = useState(String(nowServing));

  // Sync inputValue when nowServing changes externally
  useEffect(() => {
    setInputValue(String(nowServing));
  }, [nowServing]);

  const isBouquetQueue = queue?.slug === 'wrapped-bouquets';

  // Load queue + event metadata
  useEffect(() => {
    if (!queueId || !eventId) return;
    (async () => {
      try {
        const [q, ev] = await Promise.all([
          getQueue(queueId),
          getEvent(eventId),
        ]);
        setQueue(q);
        setEvent(ev);
      } catch (e) {
        console.error('Failed to load queue', e);
        navigate(`/admin/events/${eventId}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [queueId, eventId, navigate]);

  const refreshFlowersCheckIns = useCallback(async () => {
    if (!eventId || !isBouquetQueue) {
      setFlowersCheckIns([]);
      return;
    }
    try {
      const rows = await listEventCheckIns(eventId, null);
      setFlowersCheckIns(
        rows
          .filter((row) => row.status === 'completed' && row.ticket_type === 'flowers')
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      );
    } catch (e) {
      console.error('flowers check-ins fetch failed', e);
    }
  }, [eventId, isBouquetQueue]);

  useEffect(() => {
    refreshFlowersCheckIns();
    if (!eventId || !isBouquetQueue) return;
    const unsubscribe = onEventCheckInsChange(eventId, refreshFlowersCheckIns);
    const interval = setInterval(refreshFlowersCheckIns, 3000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [eventId, isBouquetQueue, refreshFlowersCheckIns]);

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
    const next = Math.max(1, nowServing + delta);
    if (next !== nowServing) setNowServing(next);
  }

  // ---------- Reset ----------
  const [showReset, setShowReset] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleReset() {
    if (!queueId) return;
    try {
      await resetQueueTickets(queueId);
      setNowServing(1);
      console.log('Queue reset, now_serving set to 1');
    } catch (e) {
      console.error('Reset failed', e);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header
        logoSrc={queue?.image_url || '/images/zippy.png'}
        titleLine1=""
        titleLine2=""
      />

      <div style={{ borderBottom: '2px solid #2f3e4f', paddingBottom: '0.75rem' }}>
        <h1
          className="headline"
          contentEditable
          suppressContentEditableWarning
          aria-label="Edit headline"
          style={{ margin: '0.5rem 0 0.75rem' }}
        >
          {event?.name || 'Event'}
        </h1>

        <div className="inputs" style={{ marginBottom: '0.5rem' }}>
          <DisplayField id="dsp1" label="Queue" value={queue?.name || ''} className="displayInput3" />
          <DisplayField id="dsp4" label="Event" value={event?.name || ''} className="displayInput2" />
        </div>
      </div>

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0.5rem 0' }}>

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

        {isBouquetQueue && (
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: 10,
            padding: '0.85rem',
            margin: '0.75rem 1rem',
            background: '#fafafa',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'baseline', marginBottom: '0.55rem' }}>
              <h2 style={{ fontSize: '1rem', margin: 0, color: '#2f3e4f' }}>
                Flowers Check-Ins
              </h2>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#5B4FCE' }}>
                {flowersCheckIns.length} guests
              </span>
            </div>
            {flowersCheckIns.length === 0 ? (
              <p style={{ margin: 0, color: '#999', fontSize: '0.85rem' }}>
                No Festival + Flowers guests checked in yet.
              </p>
            ) : (
              <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                {flowersCheckIns.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      padding: '0.5rem 0',
                      borderTop: '1px solid #eee',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#2f3e4f' }}>
                      {row.first_name} {row.last_name}
                    </span>
                    <span style={{ color: '#5B4FCE', fontSize: '0.74rem', fontWeight: 800 }}>
                      FLOWERS
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Back link */}
        <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
          <button
            className="actionBtn actionBtn-secondary"
            style={{ margin: 0, width: 'auto', padding: '0.5rem 1.5rem' }}
            onClick={() => navigate(`/admin/events/${eventId}`)}
          >
            ← Back to Event
          </button>
        </div>
      </div>
    </div>
  );
}
