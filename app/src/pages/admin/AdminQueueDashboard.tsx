/**
 * Admin: Live queue operations dashboard for a specific queue.
 * This is the per-queue equivalent of the original AdminDashboard,
 * with NOW SERVING controls, queue count, lost count, and reset.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Header from '../../components/Header';
import DisplayField from '../../components/DisplayField';
import { useQueueMetric } from '../../hooks/useQueueMetric';
import {
  completeQueueTicketAction,
  getQueue,
  listQueuePilotTickets,
  releaseQueueTicket,
  resetQueueTickets,
  updateQueue,
  updateTicketStage,
} from '../../lib/queueService';
import { getEvent } from '../../lib/eventService';
import { listEventCheckIns, onEventCheckInsChange } from '../../lib/checkInService';
import type { Queue as QueueType, QEvent, EventCheckIn, Ticket } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

export default function AdminQueueDashboard() {
  const navigate = useNavigate();
  const { eventId, queueId } = useParams<{ eventId: string; queueId: string }>();
  const { nowServing, setNowServing } = useQueueMetric(queueId);

  const [queue, setQueue] = useState<QueueType | null>(null);
  const [event, setEvent] = useState<QEvent | null>(null);
  const [flowersCheckIns, setFlowersCheckIns] = useState<EventCheckIn[]>([]);
  const [pilotTickets, setPilotTickets] = useState<Ticket[]>([]);
  const [savingControls, setSavingControls] = useState(false);
  const [controlSaveStatus, setControlSaveStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastAppliedRef = useRef<string | null>(null);
  const autoFlowInFlightRef = useRef(false);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inputValue, setInputValue] = useState(String(nowServing));

  // Sync inputValue when nowServing changes externally
  useEffect(() => {
    setInputValue(String(nowServing));
  }, [nowServing]);

  const isBouquetQueue = queue?.slug === 'wrapped-bouquets';
  const isPilotQueue = Boolean(event?.slug === 'sotc-test-check-in' && queue);
  const stationCode = '4729';
  const stationUrl = event && queue
    ? `${window.location.origin}/events/${event.slug}/q/${queue.slug}/ticket?code=${encodeURIComponent(stationCode)}`
    : '';

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

  const refreshPilotTickets = useCallback(async () => {
    if (!queueId || !isPilotQueue) {
      setPilotTickets([]);
      return;
    }
    try {
      const rows = await listQueuePilotTickets(queueId);
      setPilotTickets(rows);
    } catch (e) {
      console.error('pilot tickets fetch failed', e);
    }
  }, [queueId, isPilotQueue]);

  useEffect(() => {
    refreshPilotTickets();
    if (!isPilotQueue) return;
    const interval = setInterval(refreshPilotTickets, 2500);
    return () => clearInterval(interval);
  }, [isPilotQueue, refreshPilotTickets]);

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

  async function saveQueueControls(patch: Partial<QueueType>) {
    if (!queue) return;
    setSavingControls(true);
    setControlSaveStatus('Saving...');
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    try {
      const updated = await updateQueue(queue.id, patch);
      setQueue(updated);
      setControlSaveStatus('Saved');
      saveStatusTimerRef.current = setTimeout(() => setControlSaveStatus(''), 1800);
    } catch (e) {
      console.error('Failed to update queue controls', e);
      setControlSaveStatus('Save failed');
      alert('Could not save queue controls.');
    } finally {
      setSavingControls(false);
    }
  }

  async function setPilotStage(ticketId: number, stage: NonNullable<Ticket['stage']>) {
    try {
      if (stage === 'released') {
        await releaseQueueTicket(ticketId);
      } else if (stage === 'completed' && event) {
        await completeQueueTicketAction({
          eventId: event.id,
          ticketId,
          markKey: 'scan_code_adventure_complete',
          source: 'admin',
          metadata: {
            queue_slug: queue?.slug,
          },
        });
      } else {
        await updateTicketStage(ticketId, stage);
      }
      await refreshPilotTickets();
    } catch (e) {
      console.error('Failed to update guest stage', e);
      alert('Could not update guest stage.');
    }
  }

  async function applyAutoPilotPass(quiet = false) {
    if (!queue) return;
    if (autoFlowInFlightRef.current) return;
    autoFlowInFlightRef.current = true;
    const activeReleased = pilotTickets.filter((t) => t.stage === 'released').length;
    const maxActive = queue.max_active_released ?? 1;
    const standbyTarget = queue.standby_threshold ?? 3;

    const activeTickets = pilotTickets.filter((t) =>
      !['completed', 'cancelled', 'left'].includes(t.stage ?? 'waiting')
    );
    const waiting = activeTickets.filter((t) => (t.stage ?? 'waiting') === 'waiting');
    const standby = activeTickets.filter((t) => t.stage === 'standby');

    try {
      for (const ticket of waiting.slice(0, Math.max(0, standbyTarget - standby.length))) {
        await updateTicketStage(ticket.id, 'standby');
      }

      const slots = Math.max(0, maxActive - activeReleased);
      const releaseCandidates = [...standby, ...waiting].slice(0, slots);
      for (const ticket of releaseCandidates) {
        await releaseQueueTicket(ticket.id);
      }
      await refreshPilotTickets();
    } catch (e) {
      console.error('Auto pass failed', e);
      if (!quiet) alert('Could not apply auto flow.');
    } finally {
      autoFlowInFlightRef.current = false;
    }
  }

  useEffect(() => {
    if (!isPilotQueue || queue?.run_mode !== 'auto') return;
    void applyAutoPilotPass(true);
    const interval = setInterval(() => {
      void applyAutoPilotPass(true);
    }, 2000);
    return () => clearInterval(interval);
  }, [isPilotQueue, queue?.run_mode, queue?.standby_threshold, queue?.max_active_released, pilotTickets]);

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading…</p>
      </div>
    );
  }

  if (isPilotQueue && queue && event) {
    const counts = pilotTickets.reduce<Record<string, number>>((acc, ticket) => {
      const stage = ticket.stage ?? 'waiting';
      acc[stage] = (acc[stage] ?? 0) + 1;
      return acc;
    }, {});
    const activeReleased = counts.released ?? 0;
    const maxActive = queue.max_active_released ?? 1;
    const canReleaseMore = activeReleased < maxActive;
    const stageColor: Record<string, string> = {
      waiting: '#6b7280',
      standby: '#8a5a00',
      released: '#c2410c',
      completed: '#15803d',
      cancelled: '#991b1b',
      left: '#6b7280',
    };

    return (
      <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
        <Header logoSrc={queue.slug === 'scan-code-adventure' ? '/images/dog-through-hoop.png' : queue.image_url || '/images/zippy.png'} titleLine1="ADMIN" titleLine2="QUEUE" />

        <div style={{ padding: '0 1.25rem 0.85rem', borderBottom: '2px solid #e0e0e0' }}>
          <h1 className="headline" style={{ fontSize: '1.4rem', margin: '0 0 0.35rem' }}>{queue.name}</h1>
          <p style={{ color: '#666', margin: 0, lineHeight: 1.4 }}>{event.name}</p>
        </div>

        <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
          <div style={{ border: '1px solid #d1d5db', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', background: '#f8fafc' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 800, color: '#2f3e4f' }}>
                Join
                <select value={queue.join_status ?? 'open'} disabled={savingControls} onChange={(e) => saveQueueControls({ join_status: e.target.value as QueueType['join_status'] })} style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                  <option value="open">Open</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 800, color: '#2f3e4f' }}>
                Run
                <select value={queue.run_mode ?? 'manual'} disabled={savingControls} onChange={(e) => saveQueueControls({ run_mode: e.target.value as QueueType['run_mode'] })} style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                  <option value="manual">Manual</option>
                  <option value="auto">Auto assist</option>
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 800, color: '#2f3e4f' }}>
                Standby
                <input type="number" min={0} value={queue.standby_threshold ?? 3} disabled={savingControls} onChange={(e) => saveQueueControls({ standby_threshold: Math.max(0, Number(e.target.value) || 0) })} style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #cbd5e1' }} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 800, color: '#2f3e4f' }}>
                Released
                <input type="number" min={0} value={queue.max_active_released ?? 1} disabled={savingControls} onChange={(e) => saveQueueControls({ max_active_released: Math.max(0, Number(e.target.value) || 0) })} style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #cbd5e1' }} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.85rem', alignItems: 'center' }}>
              <button className="actionBtn actionBtn-primary" style={{ margin: 0, width: 'auto', padding: '0.5rem 0.95rem' }} onClick={() => applyAutoPilotPass()}>
                Apply Flow
              </button>
              {controlSaveStatus && (
                <span style={{ color: controlSaveStatus === 'Save failed' ? '#b91c1c' : '#15803d', fontWeight: 900, fontSize: '0.86rem' }}>
                  {controlSaveStatus}
                </span>
              )}
              <span style={{ color: canReleaseMore ? '#15803d' : '#c2410c', fontWeight: 900, fontSize: '0.86rem' }}>
                Released active: {activeReleased}/{maxActive}
              </span>
            </div>
            <div style={{ marginTop: '0.65rem', color: '#64748b', fontSize: '0.82rem', lineHeight: 1.35 }}>
              Manual mode waits here until staff presses Apply Flow or uses the guest buttons below. Auto assist uses the same thresholds for testing.
            </div>
          </div>

          <div style={{ border: '1px solid #d1d5db', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', background: '#fff', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.85rem', alignItems: 'center' }}>
            {stationUrl && <QRCodeSVG value={stationUrl} size={96} bgColor="#fff" fgColor="#1a1a2e" level="M" />}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: '#6b7280' }}>Station Code</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#24364a' }}>{stationCode}</div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.35 }}>Display this four digit code at the station. QR deep links work when the guest device can reach this app URL.</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
            {['waiting', 'standby', 'released', 'completed'].map((stage) => (
              <div key={stage} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: stageColor[stage] }}>{counts[stage] ?? 0}</div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#6b7280' }}>{stage}</div>
              </div>
            ))}
          </div>

          {pilotTickets.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '2rem 0' }}>No guests have joined this queue yet.</p>
          ) : (
            pilotTickets.map((ticket) => {
              const stage = ticket.stage ?? 'waiting';
              const guestName = `${ticket.first_name || 'Guest'} ${ticket.last_name || ''}`.trim();
              const isDone = ['completed', 'cancelled', 'left'].includes(stage);
              return (
                <div key={ticket.id} style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: '0.85rem', marginBottom: '0.65rem', background: '#fff', display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 900, color: '#24364a' }}>#{ticket.ticket_number ?? ticket.id} {guestName}</div>
                    <div style={{ color: stageColor[stage], fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', marginTop: 3 }}>{stage}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {!isDone && stage !== 'standby' && (
                      <button className="actionBtn actionBtn-secondary" style={{ margin: 0, width: 'auto', padding: '0.4rem 0.7rem' }} onClick={() => setPilotStage(ticket.id, 'standby')}>Standby</button>
                    )}
                    {!isDone && stage !== 'released' && (
                      <button className="actionBtn actionBtn-primary" style={{ margin: 0, width: 'auto', padding: '0.4rem 0.7rem' }} disabled={!canReleaseMore} onClick={() => setPilotStage(ticket.id, 'released')}>Release</button>
                    )}
                    {!isDone && (
                      <button className="actionBtn actionBtn-secondary" style={{ margin: 0, width: 'auto', padding: '0.4rem 0.7rem' }} onClick={() => setPilotStage(ticket.id, 'completed')}>Complete</button>
                    )}
                    {!isDone && (
                      <button className="actionBtn actionBtn-danger" style={{ margin: 0, width: 'auto', padding: '0.4rem 0.7rem' }} onClick={() => setPilotStage(ticket.id, 'cancelled')}>Cancel</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #eee' }}>
          <button className="actionBtn actionBtn-secondary" style={{ margin: 0 }} onClick={() => navigate(`/admin/events/${eventId}`)}>Back to Event</button>
        </div>
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
