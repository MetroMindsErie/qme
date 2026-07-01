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
import { listActiveEcesForEvent } from '../../lib/eceService';
import {
  applyQueuePilotFlow,
  completeQueueTicketAction,
  getQueue,
  listQueuePilotTickets,
  markReleasedTicketNotHere,
  releaseQueueTicket,
  resetQueueTickets,
  getQueueBySlug,
  updateQueue,
  updateTicketStage,
} from '../../lib/queueService';
import { getEvent } from '../../lib/eventService';
import { listEventCheckIns, onEventCheckInsChange } from '../../lib/checkInService';
import type { Queue as QueueType, QEvent, EventCheckIn, Ticket, Ece } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type PilotCompletionMode = 'guest_code' | 'staff_served';

function hasSameShape(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function hasNearbyConfirmationField(ticket: Ticket) {
  return Object.prototype.hasOwnProperty.call(ticket, 'nearby_confirmed_at');
}

function isNearbyConfirmed(ticket: Ticket) {
  return !hasNearbyConfirmationField(ticket) || Boolean(ticket.nearby_confirmed_at);
}

function ticketQueuePosition(ticket: Ticket) {
  return ticket.ticket_number ?? ticket.id;
}

function ticketCompletedTime(ticket: Ticket) {
  const parsed = Date.parse(ticket.completed_at ?? ticket.stage_updated_at ?? ticket.created_at);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ticketStageSortRank(ticket: Ticket) {
  const stage = ticket.stage ?? 'waiting';
  if (stage === 'standby' && isNearbyConfirmed(ticket)) return 1;
  if (stage === 'standby') return 2;
  const rank: Record<string, number> = {
    released: 0,
    waiting: 3,
    completed: 4,
    cancelled: 5,
    left: 6,
  };
  return rank[stage] ?? 7;
}

function getPilotCompletionMode(ece: Ece | null, queueSlug?: string): PilotCompletionMode {
  const mode = asString(asRecord(ece?.metadata).completion_mode);
  if (!mode && queueSlug === 'headshot-photo-station') return 'staff_served';
  return mode === 'staff_served' ? 'staff_served' : 'guest_code';
}

function getPilotMarkKey(ece: Ece | null, queueSlug = 'queue') {
  return asString(asRecord(ece?.metadata).mark_key) ?? `${queueSlug.replaceAll('-', '_')}_complete`;
}

function getQueueImageSrc(queue: QueueType | null | undefined) {
  if (queue?.slug === 'scan-code-adventure') return '/images/dog-through-hoop.png';
  if (queue?.slug === 'headshot-photo-station') return '/images/headshot-photo-station.png';
  return queue?.image_url || '/images/zippy.png';
}

export default function AdminQueueDashboard() {
  const navigate = useNavigate();
  const { eventId, queueId } = useParams<{ eventId: string; queueId: string }>();

  const [queue, setQueue] = useState<QueueType | null>(null);
  const [event, setEvent] = useState<QEvent | null>(null);
  const [linkedEce, setLinkedEce] = useState<Ece | null>(null);
  const metricQueueId = queue?.id ?? (queueId && UUID_RE.test(queueId) ? queueId : undefined);
  const { nowServing, setNowServing } = useQueueMetric(metricQueueId);
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
  const pilotCompletionMode = getPilotCompletionMode(linkedEce, queue?.slug);
  const stationCode = '4729';
  const stationUrl = event && queue
    ? `${window.location.origin}/events/${event.slug}/q/${queue.slug}/ticket?code=${encodeURIComponent(stationCode)}`
    : '';

  // Load queue + event metadata
  useEffect(() => {
    if (!queueId || !eventId) return;
    (async () => {
      try {
        const ev = await getEvent(eventId);
        let q: QueueType;
        try {
          q = await getQueue(queueId);
        } catch {
          q = await getQueueBySlug(ev.id, queueId);
        }
        setQueue(q);
        setEvent(ev);
        const eces = await listActiveEcesForEvent(ev.id);
        setLinkedEce(eces.find((ece) => ece.queue_id === q.id || ece.slug === q.slug) ?? null);
      } catch (e) {
        console.error('Failed to load queue', e);
        navigate(`/admin/events/${eventId}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [queueId, eventId, navigate]);

  const refreshFlowersCheckIns = useCallback(async () => {
    if (!event?.id || !isBouquetQueue) {
      setFlowersCheckIns([]);
      return;
    }
    try {
      const rows = await listEventCheckIns(event.id, null);
      setFlowersCheckIns(
        rows
          .filter((row) => row.status === 'completed' && row.ticket_type === 'flowers')
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      );
    } catch (e) {
      console.error('flowers check-ins fetch failed', e);
    }
  }, [event?.id, isBouquetQueue]);

  useEffect(() => {
    refreshFlowersCheckIns();
    if (!event?.id || !isBouquetQueue) return;
    const unsubscribe = onEventCheckInsChange(event.id, refreshFlowersCheckIns);
    const interval = setInterval(refreshFlowersCheckIns, 3000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [event?.id, isBouquetQueue, refreshFlowersCheckIns]);

  const refreshPilotTickets = useCallback(async () => {
    if (!queue?.id || !isPilotQueue) {
      setPilotTickets([]);
      return;
    }
    try {
      const rows = await listQueuePilotTickets(queue.id);
      setPilotTickets((current) => hasSameShape(current, rows) ? current : rows);
    } catch (e) {
      console.error('pilot tickets fetch failed', e);
    }
  }, [queue?.id, isPilotQueue]);

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
    if (!queue?.id) return;
    try {
      await resetQueueTickets(queue.id);
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
      const selectedTicket = pilotTickets.find((ticket) => ticket.id === ticketId);
      const guestName = selectedTicket
        ? `${selectedTicket.first_name || ''} ${selectedTicket.last_name || ''}`.trim()
        : '';
      if (stage === 'released') {
        await releaseQueueTicket(ticketId);
      } else if (stage === 'completed' && event) {
        await completeQueueTicketAction({
          eventId: event.id,
          ticketId,
          markKey: getPilotMarkKey(linkedEce, queue?.slug),
          consumeCreditKey: queue?.slug === 'headshot-photo-station' ? 'professional_headshot' : undefined,
          creditGuestName: guestName,
          source: 'admin',
          metadata: {
            queue_slug: queue?.slug,
            completion_mode: pilotCompletionMode,
            guest_name: guestName || undefined,
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

  async function markPilotTicketNotHere(ticketId: number) {
    const selectedTicket = pilotTickets.find((ticket) => ticket.id === ticketId);
    const guestName = selectedTicket
      ? `${selectedTicket.first_name || 'Guest'} ${selectedTicket.last_name || ''}`.trim()
      : 'this guest';
    const confirmed = confirm(
      `Mark ${guestName} as not here? They will return to standby and must tap I'm Nearby again before being called.`
    );
    if (!confirmed) return;
    try {
      await markReleasedTicketNotHere(ticketId);
      await refreshPilotTickets();
    } catch (e) {
      console.error('Failed to mark guest not here', e);
      alert('Could not mark this guest as not here.');
    }
  }

  const applyAutoPilotPass = useCallback(async (quiet = false) => {
    if (!queue) return;
    if (autoFlowInFlightRef.current) return;
    autoFlowInFlightRef.current = true;
    try {
      await applyQueuePilotFlow(queue.id);
      await refreshPilotTickets();
    } catch (e) {
      console.error('Auto pass failed', e);
      if (!quiet) alert('Could not apply auto flow.');
    } finally {
      autoFlowInFlightRef.current = false;
    }
  }, [queue, refreshPilotTickets]);

  useEffect(() => {
    if (!isPilotQueue || queue?.run_mode !== 'auto') return;
    void applyAutoPilotPass(true);
    const interval = setInterval(() => {
      void applyAutoPilotPass(true);
    }, 2000);
    return () => clearInterval(interval);
  }, [isPilotQueue, queue?.run_mode, queue?.standby_threshold, queue?.max_active_released, applyAutoPilotPass]);

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading…</p>
      </div>
    );
  }

  if (isPilotQueue && queue && event) {
    const isInactiveQueueTicket = (ticket: Ticket) => {
      const stage = ticket.stage ?? 'waiting';
      if (stage === 'completed') return false;
      return stage === 'left' || stage === 'cancelled' || ticket.status === 'left' || ticket.status === 'served';
    };
    const counts = pilotTickets.reduce<Record<string, number>>((acc, ticket) => {
      if (isInactiveQueueTicket(ticket)) return acc;
      const stage = ticket.stage ?? 'waiting';
      acc[stage] = (acc[stage] ?? 0) + 1;
      return acc;
    }, {});
    const activeReleased = counts.released ?? 0;
    const maxActive = queue.max_active_released ?? 1;
    const standbyTarget = queue.standby_threshold ?? 3;
    const canReleaseMore = activeReleased < maxActive;
    const nearbyConfirmedCount = pilotTickets.filter((ticket) => !isInactiveQueueTicket(ticket) && ticket.stage === 'standby' && isNearbyConfirmed(ticket)).length;
    const displayTickets = [...pilotTickets]
      .filter((ticket) => !isInactiveQueueTicket(ticket) && (ticket.stage ?? 'waiting') !== 'completed')
      .sort((a, b) => {
      const byStage = ticketStageSortRank(a) - ticketStageSortRank(b);
      if (byStage !== 0) return byStage;
      return ticketQueuePosition(a) - ticketQueuePosition(b);
    });
    const completedTickets = [...pilotTickets]
      .filter((ticket) => ticket.stage === 'completed')
      .sort((a, b) => {
        const byCompletedTime = ticketCompletedTime(a) - ticketCompletedTime(b);
        if (byCompletedTime !== 0) return byCompletedTime;
        return ticketQueuePosition(a) - ticketQueuePosition(b);
      });
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
        <Header logoSrc={getQueueImageSrc(queue)} titleLine1="ADMIN" titleLine2="QUEUE" />

        <div style={{ padding: '0 1.25rem 0.85rem', borderBottom: '2px solid #e0e0e0' }}>
          <h1 className="headline" style={{ fontSize: '1.4rem', margin: '0 0 0.35rem' }}>{queue.name}</h1>
          <p style={{ color: '#666', margin: 0, lineHeight: 1.4 }}>{event.name}</p>
        </div>

        <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
          <div style={{ border: '1px solid #d1d5db', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', background: '#f8fafc' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 800, color: '#2f3e4f' }}>
                Join Status
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
                Standby nearby
                <input type="number" min={0} value={queue.standby_threshold ?? 3} disabled={savingControls} onChange={(e) => saveQueueControls({ standby_threshold: Math.max(0, Number(e.target.value) || 0) })} style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.2 }}>Guests told they are almost ready.</span>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 800, color: '#2f3e4f' }}>
                Active released
                <input type="number" min={0} value={queue.max_active_released ?? 1} disabled={savingControls} onChange={(e) => saveQueueControls({ max_active_released: Math.max(0, Number(e.target.value) || 0) })} style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.2 }}>Guests actively sent to the station.</span>
              </label>
            </div>

            <div className="admin-pilot-action-row">
              <button className="actionBtn actionBtn-primary admin-pilot-action-btn" onClick={() => applyAutoPilotPass()}>
                Apply Flow
              </button>
              {controlSaveStatus && (
                <span style={{ color: controlSaveStatus.includes('failed') ? '#b91c1c' : '#15803d', fontWeight: 900, fontSize: '0.86rem' }}>
                  {controlSaveStatus}
                </span>
              )}
              <span style={{ color: canReleaseMore ? '#15803d' : '#c2410c', fontWeight: 900, fontSize: '0.86rem' }}>
                Released active: {activeReleased}/{maxActive}
              </span>
            </div>
            <div style={{ marginTop: '0.65rem', color: '#64748b', fontSize: '0.82rem', lineHeight: 1.35 }}>
              Manual mode waits here until staff presses Apply Flow or uses the guest buttons below. Auto assist keeps a capped Gathering/Nearby pool of {standbyTarget}; guests who do not tap I'm Nearby after 15 seconds stop counting as fresh blockers, but still need staff action if the pool is full. Only Nearby guests are released. Use Join Status to pause or reopen guest joining.
            </div>
          </div>

          {pilotCompletionMode === 'guest_code' ? (
            <div style={{ border: '1px solid #d1d5db', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', background: '#fff', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.85rem', alignItems: 'center' }}>
              {stationUrl && <QRCodeSVG value={stationUrl} size={96} bgColor="#fff" fgColor="#1a1a2e" level="M" />}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: '#6b7280' }}>Station Code</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#24364a' }}>{stationCode}</div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.35 }}>Display this four digit code at the station. QR deep links work when the guest device can reach this app URL.</div>
              </div>
            </div>
          ) : (
            <div style={{ border: '1px solid #bbf7d0', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', background: '#f0fdf4', color: '#166534', fontWeight: 900 }}>
              Click the current guest row when they step up to be served.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
            {['waiting', 'standby', 'released', 'completed'].map((stage) => (
              <div key={stage} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: stageColor[stage] }}>{counts[stage] ?? 0}</div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#6b7280' }}>{stage}</div>
                {stage === 'standby' && (
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginTop: 2 }}>{nearbyConfirmedCount} nearby</div>
                )}
              </div>
            ))}
          </div>

          {displayTickets.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '2rem 0' }}>
              {pilotTickets.length === 0 ? 'No guests have joined this queue yet.' : 'No active guests in this queue.'}
            </p>
          ) : (
            displayTickets.map((ticket) => {
              const stage = ticket.stage ?? 'waiting';
              const guestName = `${ticket.first_name || 'Guest'} ${ticket.last_name || ''}`.trim();
              const isDone = ['completed', 'cancelled', 'left'].includes(stage);
              const nearbyConfirmed = isNearbyConfirmed(ticket);
              const canReleaseTicket = canReleaseMore && stage === 'standby' && nearbyConfirmed;
              const canClickToServe = pilotCompletionMode === 'staff_served' && stage === 'released' && !isDone;
              const statusHint = stage === 'waiting'
                ? 'Waiting for flow'
                : stage === 'standby' && !nearbyConfirmed
                ? 'Waiting for nearby'
                : stage === 'standby' && nearbyConfirmed && !canReleaseMore
                ? 'Release slot full'
                : '';
              const rowStyle = canClickToServe
                ? {
                    border: '2px solid #22c55e',
                    borderRadius: 10,
                    padding: '1rem',
                    marginBottom: '0.65rem',
                    background: '#f0fdf4',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    alignItems: 'center',
                    flexWrap: 'wrap' as const,
                    cursor: 'pointer',
                    boxShadow: '0 5px 0 #15803d',
                    transform: 'translateY(-2px)',
                  }
                : {
                    border: '1px solid #e0e0e0',
                    borderRadius: 10,
                    padding: '0.85rem',
                    marginBottom: '0.65rem',
                    background: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    alignItems: 'center',
                    flexWrap: 'wrap' as const,
                  };
              return (
                <div
                  key={ticket.id}
                  role={canClickToServe ? 'button' : undefined}
                  tabIndex={canClickToServe ? 0 : undefined}
                  onClick={canClickToServe ? () => setPilotStage(ticket.id, 'completed') : undefined}
                  onKeyDown={canClickToServe ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      void setPilotStage(ticket.id, 'completed');
                    }
                  } : undefined}
                  style={rowStyle}
                >
                  <div>
                    <div style={{ fontWeight: 900, color: '#24364a' }}>#{ticket.ticket_number ?? ticket.id} {guestName}</div>
                    <div style={{ color: stageColor[stage], fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', marginTop: 3 }}>
                      {stage}{stage === 'standby' && nearbyConfirmed ? ' - nearby' : ''}
                    </div>
                    {canClickToServe && (
                      <div style={{ color: '#166534', fontSize: '0.78rem', fontWeight: 900, marginTop: 5 }}>
                        Click name when guest steps up
                      </div>
                    )}
                    {!canClickToServe && statusHint && (
                      <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 800, marginTop: 5 }}>
                        {statusHint}
                      </div>
                    )}
                  </div>
                  <div
                    className="admin-pilot-guest-actions"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {!isDone && canReleaseTicket && (
                      <button className="actionBtn actionBtn-primary admin-pilot-guest-btn" onClick={() => setPilotStage(ticket.id, 'released')}>Release</button>
                    )}
                    {stage === 'released' && !isDone && (
                      <button className="actionBtn actionBtn-secondary admin-pilot-guest-btn" onClick={() => markPilotTicketNotHere(ticket.id)}>Not here</button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {completedTickets.length > 0 && (
            <details style={{ border: '1px solid #d1d5db', borderRadius: 10, padding: '0.75rem 0.85rem', marginTop: '1rem', background: '#f8fafc' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 900, color: '#24364a' }}>
                Completed guests ({completedTickets.length})
              </summary>
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {completedTickets.map((ticket) => {
                  const guestName = `${ticket.first_name || 'Guest'} ${ticket.last_name || ''}`.trim();
                  return (
                    <div
                      key={ticket.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        padding: '0.65rem',
                        background: '#fff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        alignItems: 'baseline',
                      }}
                    >
                      <span style={{ fontWeight: 900, color: '#24364a' }}>#{ticket.ticket_number ?? ticket.id} {guestName}</span>
                      <span style={{ color: stageColor.completed, fontSize: '0.76rem', fontWeight: 900, textTransform: 'uppercase' }}>Completed</span>
                    </div>
                  );
                })}
              </div>
            </details>
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
        logoSrc={getQueueImageSrc(queue)}
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
