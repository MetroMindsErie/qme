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
import { downloadCsv, formatCsvTimestamp, safeCsvFilename } from '../../lib/csvExport';
import { listActiveEcesForEvent } from '../../lib/eceService';
import {
  adminApplyQueuePilotFlow,
  completeQueueTicketAction,
  getQueue,
  listEventGuestMarksForTickets,
  listQueuePilotTickets,
  markReleasedTicketNotHere,
  overrideQueueTicketState,
  releaseQueueTicket,
  returnGatheringTicketToWaiting,
  resetQueueTickets,
  getQueueBySlug,
  updateQueue,
  type QueueOverrideTarget,
} from '../../lib/queueService';
import { getEvent } from '../../lib/eventService';
import { isSotcEventSlug } from '../../lib/sotc';
import {
  canAccessEvent,
  canManageEvent,
  getCurrentAdminPrincipal,
  type CurrentAdminPrincipal,
} from '../../lib/adminPrincipalService';
import { listEventCheckIns, onEventCheckInsChange } from '../../lib/checkInService';
import type { Queue as QueueType, QEvent, EventCheckIn, EventGuestMark, Ticket, Ece } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type PilotCompletionMode = 'guest_code' | 'staff_served';
type AdminQueueTab = 'live' | 'history' | 'settings';
const HEADSHOT_SERVICE_STARTED_MARK_KEY = 'headshot_service_started';

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

function ticketHasCurrentOnMyWay(ticket: Ticket) {
  if ((ticket.stage ?? 'waiting') !== 'standby' || !ticket.on_my_way_at || ticket.nearby_confirmed_at) return false;
  if (!ticket.stage_updated_at) return true;
  const onMyWayTime = Date.parse(ticket.on_my_way_at);
  const stageUpdatedTime = Date.parse(ticket.stage_updated_at);
  if (!Number.isFinite(onMyWayTime) || !Number.isFinite(stageUpdatedTime)) return false;
  return onMyWayTime >= stageUpdatedTime;
}

function ticketQueuePosition(ticket: Ticket) {
  return ticket.ticket_number ?? ticket.id;
}

function ticketCompletedTime(ticket: Ticket) {
  const parsed = Date.parse(ticket.completed_at ?? ticket.stage_updated_at ?? ticket.created_at);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatServiceStartTime(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatQueueTime(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getCheckInContact(checkIn?: EventCheckIn) {
  const metadata = asRecord(checkIn?.metadata);
  return {
    email: asString(metadata.email) ?? asString(metadata.guest_email) ?? '',
    phone: asString(metadata.phone) ?? asString(metadata.guest_phone) ?? '',
  };
}

function getTicketProductState(ticket: Ticket) {
  const stage = ticket.stage ?? 'waiting';
  if (stage === 'released') return 'your_turn';
  if (stage === 'standby' && isNearbyConfirmed(ticket)) return 'nearby';
  if (stage === 'standby' && ticketHasCurrentOnMyWay(ticket)) return 'on_my_way';
  if (stage === 'standby') return 'gathering';
  return stage;
}

function getTicketWorkflowStage(ticket: Ticket) {
  const stage = ticket.stage ?? 'waiting';
  if (stage === 'standby') return 'gathering';
  if (stage === 'released') return 'your_turn';
  return stage;
}

function formatQueueLabel(value: string) {
  const labels: Record<string, string> = {
    waiting: 'Waiting',
    gathering: 'Gathering',
    on_my_way: 'On My Way',
    nearby: 'Nearby',
    your_turn: 'Your Turn',
    completed: 'Completed',
    cancelled: 'Cancelled',
    left: 'Left',
  };
  return labels[value] ?? value;
}

function getTicketProductStateLabel(ticket: Ticket) {
  return formatQueueLabel(getTicketProductState(ticket));
}

function getTicketWorkflowStageLabel(ticket: Ticket) {
  return formatQueueLabel(getTicketWorkflowStage(ticket));
}

function getCooldownRemainingSeconds(ticket: Ticket, cooldownSeconds: number) {
  if ((ticket.stage ?? 'waiting') !== 'waiting' || !ticket.gathering_snoozed_at || cooldownSeconds <= 0) return 0;
  const snoozedAt = Date.parse(ticket.gathering_snoozed_at);
  if (!Number.isFinite(snoozedAt)) return 0;
  const elapsedSeconds = Math.floor((Date.now() - snoozedAt) / 1000);
  return Math.max(0, cooldownSeconds - elapsedSeconds);
}

function getTicketConditionLabel(ticket: Ticket, cooldownSeconds: number) {
  if ((ticket.stage ?? 'waiting') === 'standby' && isNearbyConfirmed(ticket)) return 'Nearby';
  if ((ticket.stage ?? 'waiting') === 'standby' && ticketHasCurrentOnMyWay(ticket)) return 'On My Way';
  const cooldownRemaining = getCooldownRemainingSeconds(ticket, cooldownSeconds);
  if (cooldownRemaining > 0) return `Cooling Down (${cooldownRemaining}s)`;
  return '';
}

function ticketStageSortRank(ticket: Ticket) {
  const stage = ticket.stage ?? 'waiting';
  if (stage === 'standby' && isNearbyConfirmed(ticket)) return 1;
  if (stage === 'standby' && ticketHasCurrentOnMyWay(ticket)) return 2;
  if (stage === 'standby') return 3;
  const rank: Record<string, number> = {
    released: 0,
    waiting: 4,
    completed: 5,
    cancelled: 6,
    left: 7,
  };
  return rank[stage] ?? 8;
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
  const [eventCheckIns, setEventCheckIns] = useState<EventCheckIn[]>([]);
  const [pilotTickets, setPilotTickets] = useState<Ticket[]>([]);
  const [serviceStartedMarks, setServiceStartedMarks] = useState<Record<number, EventGuestMark>>({});
  const [savingControls, setSavingControls] = useState(false);
  const [controlSaveStatus, setControlSaveStatus] = useState('');
  const [activeQueueTab, setActiveQueueTab] = useState<AdminQueueTab>('live');
  const [queueSearch, setQueueSearch] = useState('');
  const [overrideBusyTicketId, setOverrideBusyTicketId] = useState<number | null>(null);
  const [overrideTargetByTicketId, setOverrideTargetByTicketId] = useState<Record<number, QueueOverrideTarget | ''>>({});
  const [overrideReasonByTicketId, setOverrideReasonByTicketId] = useState<Record<number, string>>({});
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdminPrincipal | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
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
  const isPilotQueue = Boolean(isSotcEventSlug(event?.slug) && queue);
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
        const admin = await getCurrentAdminPrincipal();
        setCurrentAdmin(admin);
        if (!admin || !canAccessEvent(admin, ev)) {
          setAccessDenied(true);
          setQueue(null);
          setEvent(ev);
          setLinkedEce(null);
          return;
        }
        setAccessDenied(false);
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

  useEffect(() => {
    if (activeQueueTab === 'settings' && event && (!currentAdmin || !canManageEvent(currentAdmin, event))) {
      setActiveQueueTab('live');
    }
  }, [activeQueueTab, currentAdmin, event]);

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
      setEventCheckIns([]);
      return;
    }
    try {
      const rows = await listQueuePilotTickets(queue.id);
      setPilotTickets((current) => hasSameShape(current, rows) ? current : rows);
      if (event?.id) {
        const checkIns = await listEventCheckIns(event.id, null);
        setEventCheckIns((current) => hasSameShape(current, checkIns) ? current : checkIns);
      } else {
        setEventCheckIns([]);
      }
      if (event?.id && queue.slug === 'headshot-photo-station') {
        const marks = await listEventGuestMarksForTickets(
          event.id,
          rows.map((row) => row.id),
          HEADSHOT_SERVICE_STARTED_MARK_KEY
        );
        setServiceStartedMarks(
          marks.reduce<Record<number, EventGuestMark>>((acc, mark) => {
            if (mark.ticket_id) acc[mark.ticket_id] = mark;
            return acc;
          }, {})
        );
      } else {
        setServiceStartedMarks({});
      }
    } catch (e) {
      console.error('pilot tickets fetch failed', e);
    }
  }, [queue?.id, queue?.slug, event?.id, isPilotQueue]);

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
          checkInId: selectedTicket?.check_in_id ?? null,
          consumeCreditKey: queue?.slug === 'headshot-photo-station' ? 'professional_headshot' : undefined,
          creditGuestName: guestName,
          source: 'admin',
          metadata: {
            queue_slug: queue?.slug,
            completion_mode: pilotCompletionMode,
            guest_name: guestName || undefined,
          },
        });
        if (queue?.run_mode === 'auto' && queue.id) {
          await adminApplyQueuePilotFlow(queue.id);
        }
      } else {
        throw new Error(`Unsupported admin queue stage transition: ${stage}`);
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
      `Mark ${guestName} as not here? They will return to Waiting/back of line and must be invited to Gathering again before they can be called.`
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

  async function returnPilotTicketToWaiting(ticketId: number) {
    const selectedTicket = pilotTickets.find((ticket) => ticket.id === ticketId);
    const guestName = selectedTicket
      ? `${selectedTicket.first_name || 'Guest'} ${selectedTicket.last_name || ''}`.trim()
      : 'this guest';
    const confirmed = confirm(
      `Return ${guestName} to Waiting? They will stay in the queue, but they will no longer hold a Gathering spot.`
    );
    if (!confirmed) return;
    try {
      await returnGatheringTicketToWaiting(ticketId);
      await refreshPilotTickets();
    } catch (e) {
      console.error('Failed to return guest to waiting', e);
      alert('Could not return this guest to Waiting.');
    }
  }

  async function overridePilotTicketState(ticket: Ticket, targetState: QueueOverrideTarget) {
    const guestName = `${ticket.first_name || 'Guest'} ${ticket.last_name || ''}`.trim();
    const targetLabels: Record<QueueOverrideTarget, string> = {
      waiting: 'Waiting',
      gathering: 'Gathering',
      on_my_way: 'On My Way',
      nearby: 'Nearby',
      your_turn: 'Your Turn',
    };
    const extraWarning = targetState === 'on_my_way'
      ? ' On My Way records that they are heading over, but they still cannot be called until they are Nearby.'
      : '';
    const confirmed = confirm(
      `Move ${guestName} to ${targetLabels[targetState]}? This bypasses normal queue automation and will be recorded.${extraWarning}`
    );
    if (!confirmed) return;
    setOverrideBusyTicketId(ticket.id);
    try {
      await overrideQueueTicketState({
        ticketId: ticket.id,
        targetState,
        reason: overrideReasonByTicketId[ticket.id],
      });
      setOverrideTargetByTicketId((current) => ({ ...current, [ticket.id]: '' }));
      setOverrideReasonByTicketId((current) => ({ ...current, [ticket.id]: '' }));
      await refreshPilotTickets();
    } catch (e) {
      console.error('Failed to override guest queue state', e);
      alert('Could not move this guest. The override was not saved.');
    } finally {
      setOverrideBusyTicketId(null);
    }
  }

  const applyAutoPilotPass = useCallback(async (quiet = false) => {
    if (!queue) return;
    if (autoFlowInFlightRef.current) return;
    autoFlowInFlightRef.current = true;
    try {
      await adminApplyQueuePilotFlow(queue.id);
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
  }, [
    isPilotQueue,
    queue?.run_mode,
    queue?.standby_threshold,
    queue?.gathering_max,
    queue?.gathering_stale_after_seconds,
    queue?.not_here_cooldown_seconds,
    queue?.max_active_released,
    applyAutoPilotPass,
  ]);

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="card">
        <Header titleLine1="ADMIN" titleLine2="QUEUE" />
        <div style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
          <h1 className="headline" style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>
            Queue access unavailable
          </h1>
          <p style={{ color: '#64748b', lineHeight: 1.45, margin: '0 0 1rem' }}>
            Your staff account is not assigned to this queue's event.
          </p>
          <button
            type="button"
            className="actionBtn actionBtn-secondary"
            onClick={() => navigate(eventId ? `/admin/events/${eventId}` : '/admin/events')}
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  if (isPilotQueue && queue && event) {
    const canManageThisEvent = Boolean(currentAdmin && canManageEvent(currentAdmin, event));
    const queueTabs: Array<[AdminQueueTab, string]> = [
      ['live', 'Live Line'],
      ['history', 'History'],
      ...(canManageThisEvent ? [['settings', 'Settings'] as [AdminQueueTab, string]] : []),
    ];
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
    const gatheringMax = Math.max(standbyTarget, queue.gathering_max ?? standbyTarget + maxActive + 2);
    const staleAfterSeconds = queue.gathering_stale_after_seconds ?? 15;
    const notHereCooldownSeconds = queue.not_here_cooldown_seconds ?? 300;
    const canReleaseMore = activeReleased < maxActive;
    const nearbyConfirmedCount = pilotTickets.filter((ticket) => !isInactiveQueueTicket(ticket) && ticket.stage === 'standby' && isNearbyConfirmed(ticket)).length;
    const onMyWayCount = pilotTickets.filter((ticket) => !isInactiveQueueTicket(ticket) && ticketHasCurrentOnMyWay(ticket)).length;
    const checkInById = eventCheckIns.reduce<Record<string, EventCheckIn>>((acc, checkIn) => {
      acc[checkIn.id] = checkIn;
      return acc;
    }, {});
    const searchText = queueSearch.trim().toLowerCase();
    const ticketMatchesSearch = (ticket: Ticket) => {
      if (!searchText) return true;
      const checkIn = ticket.check_in_id ? checkInById[ticket.check_in_id] : undefined;
      const contact = getCheckInContact(checkIn);
      return [
        ticket.id,
        ticket.ticket_number,
        ticket.first_name,
        ticket.last_name,
        `${ticket.first_name ?? ''} ${ticket.last_name ?? ''}`,
        ticket.stage,
        ticket.status,
        getTicketWorkflowStage(ticket),
        getTicketWorkflowStageLabel(ticket),
        getTicketProductState(ticket),
        getTicketProductStateLabel(ticket),
        getTicketConditionLabel(ticket, notHereCooldownSeconds),
        checkIn?.first_name,
        checkIn?.last_name,
        checkIn?.status,
        checkIn?.ticket_type,
        contact.email,
        contact.phone,
      ].some((value) => String(value ?? '').toLowerCase().includes(searchText));
    };
    const displayTickets = [...pilotTickets]
      .filter((ticket) => !isInactiveQueueTicket(ticket) && (ticket.stage ?? 'waiting') !== 'completed')
      .filter(ticketMatchesSearch)
      .sort((a, b) => {
      const byStage = ticketStageSortRank(a) - ticketStageSortRank(b);
      if (byStage !== 0) return byStage;
      return ticketQueuePosition(a) - ticketQueuePosition(b);
    });
    const completedTickets = [...pilotTickets]
      .filter((ticket) => ticket.stage === 'completed')
      .filter(ticketMatchesSearch)
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
    const exportQueueActivityCsv = () => {
      const filename = `${safeCsvFilename(`${event.slug}-${queue.slug}-activity`)}-${new Date().toISOString().slice(0, 10)}.csv`;
      downloadCsv(filename, [
        { header: 'event_name', value: () => event.name },
        { header: 'event_slug', value: () => event.slug },
        { header: 'queue_name', value: () => queue.name },
        { header: 'queue_slug', value: () => queue.slug },
        { header: 'ticket_id', value: (ticket) => ticket.id },
        { header: 'ticket_number', value: (ticket) => ticket.ticket_number ?? '' },
        { header: 'first_name', value: (ticket) => ticket.first_name ?? '' },
        { header: 'last_name', value: (ticket) => ticket.last_name ?? '' },
        { header: 'check_in_status', value: (ticket) => ticket.check_in_id ? checkInById[ticket.check_in_id]?.status ?? '' : '' },
        { header: 'check_in_ticket_type', value: (ticket) => ticket.check_in_id ? checkInById[ticket.check_in_id]?.ticket_type ?? '' : '' },
        { header: 'contact_email', value: (ticket) => ticket.check_in_id ? getCheckInContact(checkInById[ticket.check_in_id]).email : '' },
        { header: 'contact_phone', value: (ticket) => ticket.check_in_id ? getCheckInContact(checkInById[ticket.check_in_id]).phone : '' },
        { header: 'raw_ticket_stage', value: (ticket) => ticket.stage ?? 'waiting' },
        { header: 'workflow_stage', value: (ticket) => getTicketWorkflowStageLabel(ticket) },
        { header: 'workflow_state', value: (ticket) => getTicketConditionLabel(ticket, notHereCooldownSeconds) },
        { header: 'status', value: (ticket) => ticket.status },
        { header: 'nearby_confirmed', value: (ticket) => isNearbyConfirmed(ticket) ? 'yes' : 'no' },
        { header: 'service_started_at', value: (ticket) => formatCsvTimestamp(serviceStartedMarks[ticket.id]?.created_at) },
        { header: 'service_started_source', value: (ticket) => serviceStartedMarks[ticket.id]?.source ?? '' },
        { header: 'joined_at', value: (ticket) => formatCsvTimestamp(ticket.created_at) },
        { header: 'stage_updated_at', value: (ticket) => formatCsvTimestamp(ticket.stage_updated_at) },
        { header: 'on_my_way_at', value: (ticket) => formatCsvTimestamp(ticket.on_my_way_at) },
        { header: 'nearby_confirmed_at', value: (ticket) => formatCsvTimestamp(ticket.nearby_confirmed_at) },
        { header: 'released_at', value: (ticket) => formatCsvTimestamp(ticket.released_at) },
        { header: 'completed_at', value: (ticket) => formatCsvTimestamp(ticket.completed_at) },
        { header: 'left_at', value: (ticket) => formatCsvTimestamp(ticket.left_at) },
        { header: 'left_reason', value: (ticket) => ticket.left_reason ?? '' },
      ], pilotTickets);
    };

    return (
      <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
        <Header logoSrc={getQueueImageSrc(queue)} titleLine1="ADMIN" titleLine2="QUEUE" />

        <div style={{ padding: '0 1.25rem 0.85rem', borderBottom: '2px solid #e0e0e0' }}>
          <h1 className="headline" style={{ fontSize: '1.4rem', margin: '0 0 0.35rem' }}>{queue.name}</h1>
          <p style={{ color: '#666', margin: 0, lineHeight: 1.4 }}>{event.name}</p>
        </div>

        <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
          <div className="admin-tabs" role="tablist" aria-label="Queue admin sections">
            {queueTabs.map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeQueueTab === tab}
                className={`admin-tab ${activeQueueTab === tab ? 'admin-tab-active' : ''}`}
                onClick={() => setActiveQueueTab(tab as AdminQueueTab)}
              >
                {label}
              </button>
            ))}
          </div>

          {activeQueueTab !== 'settings' && (
            <div style={{ margin: '0 0 0.85rem' }}>
              <label style={{ display: 'block', fontWeight: 900, color: '#24364a', marginBottom: '0.3rem' }}>
                Find Guest
              </label>
              <input
                type="search"
                value={queueSearch}
                onChange={(event) => setQueueSearch(event.target.value)}
                placeholder="Search name, ticket #, status, email, or phone"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  fontWeight: 700,
                }}
              />
            </div>
          )}

          {activeQueueTab === 'settings' && canManageThisEvent && (
          <div style={{ border: '1px solid #d1d5db', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.8rem' }}>
              <button
                type="button"
                className="actionBtn actionBtn-secondary"
                style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }}
                onClick={exportQueueActivityCsv}
              >
                Export Queue Activity
              </button>
            </div>
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
                Gathering target
                <input type="number" min={0} value={standbyTarget} disabled={savingControls} onChange={(e) => {
                  const nextTarget = Math.max(0, Number(e.target.value) || 0);
                  void saveQueueControls({ standby_threshold: nextTarget, gathering_max: Math.max(nextTarget, gatheringMax) });
                }} style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.2 }}>Normal number asked to come nearby.</span>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 800, color: '#2f3e4f' }}>
                Gathering max
                <input type="number" min={standbyTarget} value={gatheringMax} disabled={savingControls} onChange={(e) => saveQueueControls({ gathering_max: Math.max(standbyTarget, Number(e.target.value) || 0) })} style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.2 }}>Overflow cap when earlier guests go stale.</span>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 800, color: '#2f3e4f' }}>
                Gathering stale sec
                <input type="number" min={0} value={staleAfterSeconds} disabled={savingControls} onChange={(e) => saveQueueControls({ gathering_stale_after_seconds: Math.max(0, Number(e.target.value) || 0) })} style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.2 }}>When non-nearby Gathering guests stop blocking.</span>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 800, color: '#2f3e4f' }}>
                Not Here cooldown sec
                <input type="number" min={0} value={notHereCooldownSeconds} disabled={savingControls} onChange={(e) => saveQueueControls({ not_here_cooldown_seconds: Math.max(0, Number(e.target.value) || 0) })} style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.2 }}>How long a Not Here guest waits before they can be invited again.</span>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 800, color: '#2f3e4f' }}>
                Active released
                <input type="number" min={0} value={queue.max_active_released ?? 1} disabled={savingControls} onChange={(e) => saveQueueControls({ max_active_released: Math.max(0, Number(e.target.value) || 0) })} style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.2 }}>Guests actively sent to the station.</span>
              </label>
            </div>

            <div className="admin-pilot-action-row">
              {controlSaveStatus && (
                <span style={{ color: controlSaveStatus.includes('failed') ? '#b91c1c' : '#15803d', fontWeight: 900, fontSize: '0.86rem' }}>
                  {controlSaveStatus}
                </span>
              )}
            </div>
            <div style={{ marginTop: '0.65rem', color: '#64748b', fontSize: '0.82rem', lineHeight: 1.35 }}>
              Manual mode waits here until staff presses Apply Flow or uses the guest buttons below. Auto assist targets {standbyTarget} fresh Gathering/On My Way/Nearby guests and can overflow up to {gatheringMax} when earlier Gathering guests do not tap I'm Nearby after {staleAfterSeconds} seconds. Guests marked Not Here wait {notHereCooldownSeconds} seconds before they can be invited again. Only Nearby guests are released.
            </div>
          </div>
          )}

          {activeQueueTab === 'settings' && canManageThisEvent && (
          <>
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
          </>
          )}

          {activeQueueTab === 'live' && (
          <>
          <div className="admin-pilot-action-row" style={{ marginBottom: '0.8rem' }}>
            <button className="actionBtn actionBtn-primary admin-pilot-action-btn" onClick={() => applyAutoPilotPass()}>
              Apply Flow
            </button>
            <span style={{ color: canReleaseMore ? '#15803d' : '#c2410c', fontWeight: 900, fontSize: '0.86rem' }}>
              Released active: {activeReleased}/{maxActive}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
            {([
              ['waiting', 'Waiting'],
              ['standby', 'Gathering'],
              ['released', 'Your Turn'],
              ['completed', 'Completed'],
            ] as Array<[string, string]>).map(([stage, label]) => (
              <div key={stage} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: stageColor[stage] }}>{counts[stage] ?? 0}</div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#6b7280' }}>{label}</div>
                {stage === 'standby' && (
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginTop: 2 }}>
                    {nearbyConfirmedCount} nearby{onMyWayCount ? ` - ${onMyWayCount} on my way` : ''}
                  </div>
                )}
              </div>
            ))}
          </div>

          {displayTickets.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '2rem 0' }}>
              {searchText
                ? 'No active guests match this search.'
                : pilotTickets.length === 0
                ? 'No guests have joined this queue yet.'
                : 'No active guests in this queue.'}
            </p>
          ) : (
            displayTickets.map((ticket) => {
              const stage = ticket.stage ?? 'waiting';
              const guestName = `${ticket.first_name || 'Guest'} ${ticket.last_name || ''}`.trim();
              const checkIn = ticket.check_in_id ? checkInById[ticket.check_in_id] : undefined;
              const contact = getCheckInContact(checkIn);
              const productState = getTicketProductState(ticket);
              const productStateLabel = getTicketProductStateLabel(ticket);
              const workflowStageLabel = getTicketWorkflowStageLabel(ticket);
              const conditionLabel = getTicketConditionLabel(ticket, notHereCooldownSeconds);
              const isDone = ['completed', 'cancelled', 'left'].includes(stage);
              const nearbyConfirmed = isNearbyConfirmed(ticket);
              const onMyWay = ticketHasCurrentOnMyWay(ticket);
              const canReleaseTicket = canReleaseMore && stage === 'standby' && nearbyConfirmed;
              const adminServesDirectly = pilotCompletionMode === 'staff_served' && canReleaseTicket;
              const canReturnToWaiting = stage === 'standby' && !nearbyConfirmed;
              const canClickToServe = pilotCompletionMode === 'staff_served' && stage === 'released' && !isDone;
              const serviceStartedMark = serviceStartedMarks[ticket.id];
              const serviceStartedTime = formatServiceStartTime(serviceStartedMark?.created_at);
              const currentOverrideTarget = overrideTargetByTicketId[ticket.id] ?? '';
              const overrideOptions: Array<[QueueOverrideTarget, string]> = [
                ['waiting', 'Return to Waiting'],
                ['gathering', 'Invite to Gathering'],
                ['on_my_way', 'Mark On My Way'],
                ['nearby', 'Mark Nearby'],
                ['your_turn', 'Make Your Turn'],
              ].filter(([target]) => target !== productState) as Array<[QueueOverrideTarget, string]>;
              const statusHint = stage === 'waiting'
                ? conditionLabel || 'Waiting for flow'
                : stage === 'standby' && onMyWay
                ? 'On My Way - not callable until Nearby'
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
                      {productStateLabel}
                    </div>
                    <div style={{ color: '#334155', fontSize: '0.74rem', fontWeight: 900, marginTop: 4 }}>
                      Stage: {workflowStageLabel}{conditionLabel ? ` - State: ${conditionLabel}` : ''}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.74rem', fontWeight: 800, marginTop: 5, lineHeight: 1.35 }}>
                      Joined {formatQueueTime(ticket.created_at) || 'unknown'}
                      {ticket.stage_updated_at ? ` - Stage updated ${formatQueueTime(ticket.stage_updated_at)}` : ''}
                      {onMyWay ? ` - On My Way ${formatQueueTime(ticket.on_my_way_at)}` : ''}
                      {ticket.nearby_confirmed_at ? ` - Nearby ${formatQueueTime(ticket.nearby_confirmed_at)}` : ''}
                      {ticket.released_at ? ` - Your Turn ${formatQueueTime(ticket.released_at)}` : ''}
                    </div>
                    {(checkIn || contact.email || contact.phone) && (
                      <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, marginTop: 3, lineHeight: 1.35 }}>
                        {checkIn?.status ? `Check-in ${checkIn.status}` : ''}
                        {contact.email ? ` - ${contact.email}` : ''}
                        {contact.phone ? ` - ${contact.phone}` : ''}
                      </div>
                    )}
                    {canClickToServe && (
                      <div style={{ color: '#166534', fontSize: '0.78rem', fontWeight: 900, marginTop: 5 }}>
                        Click name when guest steps up
                      </div>
                    )}
                    {serviceStartedMark && (
                      <div style={{ color: '#2563eb', fontSize: '0.78rem', fontWeight: 900, marginTop: 5 }}>
                        I've Been Called{serviceStartedTime ? ` at ${serviceStartedTime}` : ''}
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
                      <button
                        className="actionBtn actionBtn-primary admin-pilot-guest-btn"
                        onClick={() => setPilotStage(ticket.id, adminServesDirectly ? 'completed' : 'released')}
                      >
                        {adminServesDirectly ? 'Mark Served' : 'Release'}
                      </button>
                    )}
                    {!isDone && canReturnToWaiting && (
                      <button className="actionBtn actionBtn-secondary admin-pilot-guest-btn" onClick={() => returnPilotTicketToWaiting(ticket.id)}>Return to Waiting</button>
                    )}
                    {stage === 'released' && !isDone && (
                      <button className="actionBtn actionBtn-secondary admin-pilot-guest-btn" onClick={() => markPilotTicketNotHere(ticket.id)}>Not here</button>
                    )}
                    {!isDone && canManageThisEvent && (
                      <details style={{ width: '100%', marginTop: '0.45rem' }}>
                        <summary style={{ cursor: 'pointer', color: '#5b4fce', fontWeight: 900, fontSize: '0.78rem' }}>
                          Override state
                        </summary>
                        <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(130px, 1.4fr) auto', gap: '0.45rem', alignItems: 'center' }}>
                          <select
                            value={currentOverrideTarget}
                            onChange={(event) => setOverrideTargetByTicketId((current) => ({
                              ...current,
                              [ticket.id]: event.target.value as QueueOverrideTarget | '',
                            }))}
                            disabled={overrideBusyTicketId === ticket.id}
                            style={{ padding: '0.45rem', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 800 }}
                          >
                            <option value="">Move to...</option>
                            {overrideOptions.map(([target, label]) => (
                              <option key={target} value={target}>{label}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={overrideReasonByTicketId[ticket.id] ?? ''}
                            onChange={(event) => setOverrideReasonByTicketId((current) => ({
                              ...current,
                              [ticket.id]: event.target.value,
                            }))}
                            placeholder="Reason"
                            disabled={overrideBusyTicketId === ticket.id}
                            style={{ padding: '0.45rem', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 700 }}
                          />
                          <button
                            type="button"
                            className="actionBtn actionBtn-secondary admin-pilot-guest-btn"
                            disabled={!currentOverrideTarget || overrideBusyTicketId === ticket.id}
                            onClick={() => currentOverrideTarget && overridePilotTicketState(ticket, currentOverrideTarget)}
                          >
                            {overrideBusyTicketId === ticket.id ? 'Moving...' : 'Move'}
                          </button>
                        </div>
                        <div style={{ color: '#92400e', fontSize: '0.7rem', fontWeight: 800, lineHeight: 1.25, marginTop: '0.35rem' }}>
                          Manual override may bypass normal targets, cooldowns, and queue max settings. On My Way is not callable; Nearby is callable. This action will be recorded.
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              );
            })
          )}
          </>
          )}

          {activeQueueTab === 'history' && (
            <div style={{ border: '1px solid #d1d5db', borderRadius: 10, padding: '0.75rem 0.85rem', background: '#f8fafc' }}>
              <h2 style={{ fontSize: '1.05rem', margin: '0 0 0.75rem', fontWeight: 900, color: '#24364a' }}>
                Completed guests ({completedTickets.length}{searchText ? ` of ${pilotTickets.filter((ticket) => ticket.stage === 'completed').length}` : ''})
              </h2>
              {completedTickets.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '1.5rem 0', margin: 0 }}>
                  {searchText ? 'No completed guests match this search.' : 'No completed guests yet.'}
                </p>
              ) : (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {completedTickets.map((ticket) => {
                  const guestName = `${ticket.first_name || 'Guest'} ${ticket.last_name || ''}`.trim();
                  const serviceStartedTime = formatServiceStartTime(serviceStartedMarks[ticket.id]?.created_at);
                  const completedTime = formatServiceStartTime(ticket.completed_at);
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
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 900, color: '#24364a' }}>#{ticket.ticket_number ?? ticket.id} {guestName}</div>
                        <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 800, marginTop: 3 }}>
                          Joined {formatQueueTime(ticket.created_at) || 'unknown'}
                          {ticket.completed_at ? ` - Completed ${formatQueueTime(ticket.completed_at)}` : ''}
                        </div>
                      </div>
                      <div style={{ color: stageColor.completed, fontSize: '0.76rem', fontWeight: 900, textTransform: 'uppercase' }}>
                        Completed{serviceStartedTime ? ` - Called ${serviceStartedTime}` : completedTime ? ` - Served ${completedTime}` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
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
