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
import { listActiveEcesForEvent } from '../../lib/eceService';
import { getEventCheckInConfig } from '../../lib/eventConfig';
import { getGuestCreditForCheckIn } from '../../lib/guestCreditService';
import {
  applyQueuePilotFlow,
  confirmTicketNearby,
  completeQueueTicketAction,
  getQueueBySlug,
  getQueueTicket,
  updateTicketGuestName,
} from '../../lib/queueService';
import { formatTime } from '../../lib/utils';
import type { Ece, QEvent, Queue, Ticket } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';
import '../../styles/ticket.css';

// How many positions past your number before auto-removal
const NO_CHECKIN_BYE = 2;  // missed turn — skipped without checking in
const CHECKIN_BYE    = 1;  // served — admin advanced past your number
const TIME_2_CHECKIN = 3;  // start prompting check-in when this many ahead

// Delay (ms) the "Enjoy!" screen stays visible before navigating away
const SERVED_LINGER_MS = 4000;
const PILOT_COMPLETION_CODE = '4729';
const NOT_HERE_NOTICE =
  "Staff called you after you marked yourself nearby, but you were not at the station. You are still in standby. When you are nearby and ready to be called again, tap I'm Nearby.";

type StepState = 'done' | 'active' | 'pending';
type BouquetAccess = 'none' | 'checked-in' | 'general' | 'flowers';
type CreditStatus = 'none' | 'available' | 'used';
type PilotCompletionMode = 'guest_code' | 'staff_served';
type PilotStageCopy = {
  title?: string;
  detail?: string;
  instruction?: string;
};
const STEPS = ['In Queue', 'Called', 'Checked In', 'Enjoy!'];

function hasSameShape(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function isMissingTicketError(error: unknown): boolean {
  const record = asRecord(error);
  const code = typeof record.code === 'string' ? record.code : '';
  const message = typeof record.message === 'string' ? record.message.toLowerCase() : '';
  return code === 'PGRST116' || message.includes('0 rows') || message.includes('json object requested');
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function hydrateTemplate(
  value: string,
  vars: { location: string; queue: string; event: string }
) {
  return value
    .replaceAll('{{location}}', vars.location)
    .replaceAll('{{queue}}', vars.queue)
    .replaceAll('{{event}}', vars.event);
}

function getPilotStageCopy(
  ece: Ece | null,
  stage: string,
  vars: { location: string; queue: string; event: string }
): PilotStageCopy {
  const stageCopy = asRecord(asRecord(ece?.metadata).stage_copy);
  const stageConfig = asRecord(stageCopy[stage]);

  return {
    title: asString(stageConfig.title)
      ? hydrateTemplate(asString(stageConfig.title)!, vars)
      : undefined,
    detail: asString(stageConfig.detail)
      ? hydrateTemplate(asString(stageConfig.detail)!, vars)
      : undefined,
    instruction: asString(stageConfig.instruction)
      ? hydrateTemplate(asString(stageConfig.instruction)!, vars)
      : undefined,
  };
}

function getPilotCompletionMode(ece: Ece | null, queueSlug?: string): PilotCompletionMode {
  const mode = asString(asRecord(ece?.metadata).completion_mode);
  if (!mode && queueSlug === 'headshot-photo-station') return 'staff_served';
  return mode === 'staff_served' ? 'staff_served' : 'guest_code';
}

function getPilotCompletionCode(ece: Ece | null) {
  return asString(asRecord(ece?.metadata).completion_code) ?? PILOT_COMPLETION_CODE;
}

function getPilotMarkKey(ece: Ece | null, queueSlug = 'queue') {
  return asString(asRecord(ece?.metadata).mark_key) ?? `${queueSlug.replaceAll('-', '_')}_complete`;
}

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
  const [linkedEce, setLinkedEce] = useState<Ece | null>(null);
  const [loading, setLoading] = useState(true);
  const [bouquetAccess, setBouquetAccess] = useState<BouquetAccess>('none');
  const [headshotCreditStatus, setHeadshotCreditStatus] = useState<CreditStatus>('none');
  const [eventCheckInId, setEventCheckInId] = useState<string | null>(null);
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestNameSaved, setGuestNameSaved] = useState(false);
  const [pilotTicket, setPilotTicket] = useState<Ticket | null>(null);
  const [completionCode, setCompletionCode] = useState('');
  const [completionError, setCompletionError] = useState('');
  const [completionSaving, setCompletionSaving] = useState(false);
  const [nearbySaving, setNearbySaving] = useState(false);
  const [notHereNoticeActive, setNotHereNoticeActive] = useState(false);
  const [showNotHereModal, setShowNotHereModal] = useState(false);

  useEffect(() => {
    if (!eventSlug || !queueSlug) return;
    (async () => {
      try {
        const ev = await getEventBySlug(eventSlug);
        setEvent(ev);
        const storedCheckIn = localStorage.getItem(`qme:eventCheckIn:${ev.id}`);
        let checkInGuestName: { firstName: string; lastName: string } | null = null;
        setEventCheckInId(null);
        setBouquetAccess('none');
        setHeadshotCreditStatus('none');
        if (storedCheckIn) {
          try {
            const saved = JSON.parse(storedCheckIn) as { id?: string };
            if (saved.id) {
              const row = await getEventCheckIn(saved.id);
              if (row.status === 'completed') {
                setEventCheckInId(row.id);
                checkInGuestName = {
                  firstName: row.first_name || '',
                  lastName: row.last_name || '',
                };
                setGuestFirstName(checkInGuestName.firstName);
                setGuestLastName(checkInGuestName.lastName);
                setGuestNameSaved(Boolean(checkInGuestName.firstName || checkInGuestName.lastName));
                setBouquetAccess(row.ticket_type ?? 'checked-in');
                const credit = await getGuestCreditForCheckIn(row.id, 'professional_headshot');
                setHeadshotCreditStatus(credit
                  ? credit.quantity > credit.used_quantity ? 'available' : 'used'
                  : 'none');
              } else {
                setEventCheckInId(null);
                setBouquetAccess('none');
                setHeadshotCreditStatus('none');
              }
            }
          } catch {
            setEventCheckInId(null);
            setBouquetAccess('none');
            setHeadshotCreditStatus('none');
          }
        }
        const q  = await getQueueBySlug(ev.id, queueSlug);
        setQueue(q);
        if (checkInGuestName) {
          localStorage.setItem(queueGuestStorageKey(q.id), JSON.stringify(checkInGuestName));
        }
        const eces = await listActiveEcesForEvent(ev.id);
        setLinkedEce(eces.find((ece) => ece.queue_id === q.id) ?? null);
      } catch (e) {
        console.error('Failed to load queue', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventSlug, queueSlug]);

  const { nowServing } = useQueueMetric(queue?.id);
  const { ticketId, ticketNumber, hasCheckedIn, claimTicket, checkIn, leave } = useQueueTicket(queue?.id);

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
  const didSyncGuestNameRef = useRef(false);
  const lastPilotTicketRef = useRef<Ticket | null>(null);
  const autoNearbyFlowInFlightRef = useRef(false);

  const checkInConfig = getEventCheckInConfig(event);
  const isPilotQueue = event?.slug === 'sotc-test-check-in';
  const hasRequiredEventCheckIn = !checkInConfig.requireCompletedForParticipation || bouquetAccess !== 'none';
  const pilotStage = pilotTicket?.stage ?? 'waiting';
  const pilotCompletionMode = getPilotCompletionMode(linkedEce, queue?.slug);
  const pilotCompletionCode = getPilotCompletionCode(linkedEce);
  const queueImageSrc = queue?.slug === 'scan-code-adventure'
    ? '/images/dog-through-hoop.png'
    : queue?.slug === 'headshot-photo-station'
    ? '/images/headshot-photo-station.png'
    : queue?.image_url || '';

  function queueGuestStorageKey(qId: string) {
    return `qme:queueGuest:${qId}`;
  }

  function notHereStorageKey(tId: number) {
    return `qme:notHereNotice:${tId}`;
  }

  const clearNotHereNotice = useCallback((tId = ticketId) => {
    setNotHereNoticeActive(false);
    setShowNotHereModal(false);
    if (tId) localStorage.removeItem(notHereStorageKey(tId));
  }, [ticketId]);

  useEffect(() => {
    if (!queue) return;
    try {
      const stored = localStorage.getItem(queueGuestStorageKey(queue.id));
      if (!stored) return;
      const saved = JSON.parse(stored) as { firstName?: string; lastName?: string };
      setGuestFirstName(saved.firstName || '');
      setGuestLastName(saved.lastName || '');
      setGuestNameSaved(Boolean(saved.firstName || saved.lastName));
    } catch {
      setGuestNameSaved(false);
    }
  }, [queue]);

  useEffect(() => {
    didSyncGuestNameRef.current = false;
  }, [queue?.id]);

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
    const hasStoredTicket = Boolean(localStorage.getItem(`qme:ticket:${queue.id}`));
    const hasJoinIntent = searchParams.get('join') === '1';
    if (!hasStoredTicket && !hasJoinIntent) return;
    if (queue.slug === 'wrapped-bouquets' && bouquetAccess !== 'flowers') return;
    if (queue.slug === 'headshot-photo-station' && headshotCreditStatus !== 'available') return;
    if (!hasRequiredEventCheckIn) return;
    if ((queue.join_status ?? 'open') !== 'open') return;
    if (isPilotQueue && !guestNameSaved) return;
    void claimTicket().then((claimedTicketId) => {
      if (!claimedTicketId || searchParams.get('join') !== '1') return;
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('join');
      setSearchParams(nextParams, { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, bouquetAccess, headshotCreditStatus, hasRequiredEventCheckIn, isPilotQueue, guestNameSaved, searchParams, setSearchParams]);

  useEffect(() => {
    if (!isPilotQueue || !ticketId || didSyncGuestNameRef.current) return;
    if (!guestFirstName.trim() && !guestLastName.trim()) return;
    didSyncGuestNameRef.current = true;
    updateTicketGuestName(ticketId, {
      firstName: guestFirstName,
      lastName: guestLastName,
    })
      .then((row) => setPilotTicket(row))
      .catch((err) => {
        didSyncGuestNameRef.current = false;
        console.error('Failed to sync event check-in name to queue ticket', err);
      });
  }, [isPilotQueue, ticketId, guestFirstName, guestLastName]);

  useEffect(() => {
    if (!queue || !ticketId || !isPilotQueue) return;

    const activeTicketId = ticketId;
    const queueId = queue.id;
    const targetEventSlug = eventSlug;
    let stopped = false;
    async function refreshTicket() {
      try {
        const row = await getQueueTicket(activeTicketId);
        if (['cancelled', 'left'].includes(row.stage ?? 'waiting')) {
          clearNotHereNotice(row.id);
          clearQueueTicket(queueId);
          setPilotTicket(null);
          navigate(`/events/${targetEventSlug}`, { replace: true });
          return;
        }
        const previous = lastPilotTicketRef.current;
        const isNotHereReset =
          previous?.id === row.id &&
          previous.stage === 'released' &&
          row.stage === 'standby' &&
          !row.nearby_confirmed_at;
        if (isNotHereReset) {
          localStorage.setItem(notHereStorageKey(row.id), '1');
          setNotHereNoticeActive(true);
          setShowNotHereModal(true);
        }
        if (row.stage !== 'standby' || row.nearby_confirmed_at) {
          clearNotHereNotice(row.id);
        } else if (localStorage.getItem(notHereStorageKey(row.id)) === '1') {
          setNotHereNoticeActive(true);
        }
        lastPilotTicketRef.current = row;
        if (!stopped) setPilotTicket((current) => hasSameShape(current, row) ? current : row);
      } catch (e) {
        if (!stopped && isMissingTicketError(e)) {
          if (activeTicketId) clearNotHereNotice(activeTicketId);
          clearQueueTicket(queueId);
          setPilotTicket(null);
          navigate(`/events/${targetEventSlug}`, { replace: true });
          return;
        }
        console.warn('pilot ticket refresh failed', e);
      }
    }

    refreshTicket();
    const interval = setInterval(refreshTicket, 2500);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [queue, ticketId, isPilotQueue, navigate, eventSlug, clearNotHereNotice]);

  useEffect(() => {
    lastPilotTicketRef.current = null;
    if (!ticketId || !isPilotQueue) {
      setNotHereNoticeActive(false);
      setShowNotHereModal(false);
      return;
    }
    const hasStoredNotice = localStorage.getItem(notHereStorageKey(ticketId)) === '1';
    setNotHereNoticeActive(hasStoredNotice);
    setShowNotHereModal(false);
  }, [ticketId, isPilotQueue]);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code || !isPilotQueue || !event || !ticketId) return;
    if (pilotCompletionMode !== 'guest_code') return;
    if (code.trim().toUpperCase() !== pilotCompletionCode.toUpperCase()) return;
    if (pilotStage === 'completed') return;
    void completePilotAction(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isPilotQueue, event, ticketId, pilotStage, pilotCompletionMode, pilotCompletionCode]);

  useEffect(() => {
    if (!isPilotQueue || queue?.run_mode !== 'auto' || !pilotTicket?.queue_id) return;
    if (pilotTicket.stage !== 'standby' || !pilotTicket.nearby_confirmed_at) return;
    if (autoNearbyFlowInFlightRef.current) return;

    const pilotQueueId = pilotTicket.queue_id;
    const activeTicketId = pilotTicket.id;
    autoNearbyFlowInFlightRef.current = true;
    (async () => {
      try {
        await applyQueuePilotFlow(pilotQueueId);
        const refreshed = await getQueueTicket(activeTicketId);
        setPilotTicket((current) => hasSameShape(current, refreshed) ? current : refreshed);
      } catch (err) {
        console.warn('Auto flow after nearby confirmation failed', err);
      } finally {
        autoNearbyFlowInFlightRef.current = false;
      }
    })();
  }, [isPilotQueue, queue?.run_mode, pilotTicket?.id, pilotTicket?.queue_id, pilotTicket?.stage, pilotTicket?.nearby_confirmed_at]);

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
    if (isPilotQueue) return;
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
  }, [isPilotQueue, nowServing, ticketNumber, hasCheckedIn, leave, navigate, eventSlug]);

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

  async function completePilotAction(rawCode = completionCode) {
    if (!event || !ticketId) return;
    const normalized = rawCode.trim().toUpperCase();
    if (pilotCompletionMode !== 'guest_code') {
      setCompletionError('This step is completed by staff.');
      return;
    }
    if (normalized !== pilotCompletionCode.toUpperCase()) {
      setCompletionError('That code does not match this station.');
      return;
    }
    setCompletionSaving(true);
    setCompletionError('');
    try {
      const mark = await completeQueueTicketAction({
        eventId: event.id,
        ticketId,
        markKey: getPilotMarkKey(linkedEce, queue?.slug),
        checkInId: eventCheckInId,
        consumeCreditKey: queue?.slug === 'headshot-photo-station' ? 'professional_headshot' : undefined,
        metadata: {
          queue_slug: queue?.slug,
          code: normalized,
          guest_name: `${guestFirstName} ${guestLastName}`.trim() || undefined,
        },
      });
      clearNotHereNotice();
      setPilotTicket((prev) => prev ? { ...prev, stage: 'completed', completed_at: mark.created_at } : prev);
      setServedView(true);
      setTimeout(() => navigate(`/events/${eventSlug}`), SERVED_LINGER_MS);
    } catch (err) {
      console.error('Failed to complete pilot action', err);
      setCompletionError('Could not record completion. Please show staff this screen.');
    } finally {
      setCompletionSaving(false);
    }
  }

  async function confirmNearby() {
    if (!ticketId) return;
    setNearbySaving(true);
    setCompletionError('');
    try {
      const row = await confirmTicketNearby(ticketId);
      clearNotHereNotice(row.id);
      if (queue?.run_mode === 'auto' && row.queue_id) {
        await applyQueuePilotFlow(row.queue_id);
        const refreshed = await getQueueTicket(row.id);
        setPilotTicket(refreshed);
      } else {
        setPilotTicket(row);
      }
    } catch (err) {
      console.error('Failed to confirm nearby status', err);
      setCompletionError('Could not mark you nearby. Please try again or show staff this screen.');
    } finally {
      setNearbySaving(false);
    }
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
  const isHeadshotQueue = queue.slug === 'headshot-photo-station';
  const hasFlowersAccess = bouquetAccess === 'flowers';
  const needsBouquetAccess = isBouquetQueue && !hasFlowersAccess;
  const needsHeadshotCredit = isHeadshotQueue && !ticketId && headshotCreditStatus !== 'available';
  const hasAnyEventCheckIn = bouquetAccess !== 'none';
  const pilotJoinStatus = queue.join_status ?? 'open';
  const joinPaused = !ticketId && pilotJoinStatus !== 'open';

  if (isPilotQueue && !hasRequiredEventCheckIn) {
    return (
      <div className="card card-scrollable tkt-card">
        <div className="tkt-header">
          <div className="tkt-header-left">
            <img
              src={queueImageSrc || '/images/zippy.png'}
              alt={queue.name}
              className="tkt-logo"
            />
            <div className="tkt-header-info">
              <div className="tkt-queue-name">{queue.name}</div>
              <div className="tkt-event-name">{event.name}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.25rem', textAlign: 'center' }}>
          <h1 className="headline" style={{ fontSize: '1.75rem', margin: '0 0 0.65rem' }}>
            Check in first
          </h1>
          <p style={{ color: '#4b5563', lineHeight: 1.5, margin: 0 }}>
            Complete event check-in before joining this experience.
          </p>
          <button
            className="tkt-btn-checkin"
            style={{ marginTop: '1rem' }}
            onClick={() => navigate(`/events/${eventSlug}/check-in`)}
          >
            Check In
          </button>
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

  if (needsBouquetAccess) {
    return (
      <div className="card card-scrollable tkt-card">
        <div className="tkt-header">
          <div className="tkt-header-left">
            <img
              src={queueImageSrc || '/images/market-fresh-peonies.png'}
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

  if (needsHeadshotCredit) {
    return (
      <div className="card card-scrollable tkt-card">
        <div className="tkt-header">
          <div className="tkt-header-left">
            <img
              src={queueImageSrc || '/images/headshot-photo-station.png'}
              alt={queue.name}
              className="tkt-logo"
            />
            <div className="tkt-header-info">
              <div className="tkt-queue-name">{queue.name}</div>
              <div className="tkt-event-name">{event.name}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '1.25rem', color: '#24364a', border: '1px solid #d1d5db' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>
              {headshotCreditStatus === 'used' ? 'Photo Credit Used' : 'Photo Credit Required'}
            </div>
            <h1 style={{ fontSize: '1.35rem', margin: '0.45rem 0 0.65rem' }}>
              {headshotCreditStatus === 'used'
                ? 'Your headshot is already complete'
                : 'Headshot access is not on your check-in'}
            </h1>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              {headshotCreditStatus === 'used'
                ? 'Your photo credit has already been used for this event.'
                : 'This station is reserved for guests with a headshot photo credit. Please check with the event team if you expected one.'}
            </p>
          </div>
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

  if (joinPaused) {
    return (
      <div className="card card-scrollable tkt-card">
        <div className="tkt-header">
          <div className="tkt-header-left">
            <img
              src={queueImageSrc || '/images/zippy.png'}
              alt={queue.name}
              className="tkt-logo"
            />
            <div className="tkt-header-info">
              <div className="tkt-queue-name">{queue.name}</div>
              <div className="tkt-event-name">{event.name}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '1.25rem', color: '#24364a', border: '1px solid #d1d5db' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>
              Queue Paused
            </div>
            <h1 style={{ fontSize: '1.35rem', margin: '0.45rem 0 0.65rem' }}>
              Joining is paused right now
            </h1>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              The event team is resetting or preparing this station. Please check back shortly.
            </p>
          </div>
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

  if (isPilotQueue && !guestNameSaved && pilotJoinStatus !== 'open') {
    const title = pilotJoinStatus === 'paused' ? 'Queue is paused' : 'Queue is closed';
    const detail = pilotJoinStatus === 'paused'
      ? 'Please stay nearby. Staff will reopen the queue when ready.'
      : 'This step is not accepting new guests right now.';

    return (
      <div className="card card-scrollable tkt-card">
        <div className="tkt-header">
          <div className="tkt-header-left">
            <img
              src={queueImageSrc || '/images/zippy.png'}
              alt={queue.name}
              className="tkt-logo"
            />
            <div className="tkt-header-info">
              <div className="tkt-queue-name">{queue.name}</div>
              <div className="tkt-event-name">{event.name}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.25rem', textAlign: 'center' }}>
          <h1 className="headline" style={{ fontSize: '1.75rem', margin: '0 0 0.65rem' }}>
            {title}
          </h1>
          <p style={{ color: '#4b5563', lineHeight: 1.5, margin: 0 }}>
            {detail}
          </p>
          <button
            className="tkt-leave-btn"
            style={{ marginTop: '1rem' }}
            onClick={() => navigate(`/events/${eventSlug}`)}
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  if (isPilotQueue && !guestNameSaved) {
    return (
      <div className="card card-scrollable tkt-card">
        <div className="tkt-header">
          <div className="tkt-header-left">
            <img
              src={queueImageSrc || '/images/zippy.png'}
              alt={queue.name}
              className="tkt-logo"
            />
            <div className="tkt-header-info">
              <div className="tkt-queue-name">{queue.name}</div>
              <div className="tkt-event-name">{event.name}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.25rem' }}>
          <h1 className="headline" style={{ fontSize: '1.45rem', margin: '0 0 0.5rem' }}>
            Event Check-In Needed
          </h1>
          <p style={{ color: '#666', lineHeight: 1.5, marginTop: 0 }}>
            Complete Event Check-In first so we know who is joining this experience.
          </p>
          <button
            className="tkt-btn-checkin"
            onClick={() => navigate(`/events/${eventSlug}/check-in`)}
          >
            Event Check-In
          </button>
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

  if (isPilotQueue) {
    const locationText = linkedEce?.location || event.location || queue.name;
    const copyVars = { location: locationText, queue: queue.name, event: event.name };
    const metadataCopy = getPilotStageCopy(linkedEce, pilotStage, copyVars);
    const hasNearbyField = pilotTicket ? Object.prototype.hasOwnProperty.call(pilotTicket, 'nearby_confirmed_at') : false;
    const nearbyConfirmed = Boolean(pilotTicket?.nearby_confirmed_at);
    const needsNearbyConfirmation = pilotStage === 'standby' && hasNearbyField && !nearbyConfirmed;
    const defaultInstruction = pilotStage === 'standby'
      ? nearbyConfirmed
        ? "You're marked nearby. Keep this page open."
        : `When you are close to ${locationText}, tap I'm Nearby. Keep this page open.`
      : linkedEce?.description || queue.description || 'Keep this page open for the next step.';
    const instructionText = pilotStage === 'standby' && nearbyConfirmed
      ? defaultInstruction
      : metadataCopy.instruction ?? defaultInstruction;
    const statusCopy: Record<string, { title: string; detail: string }> = {
      waiting: {
        title: 'Waiting',
        detail: 'You are checked in and in line. No action is needed yet.',
      },
      standby: {
        title: 'Standby',
        detail: nearbyConfirmed
          ? 'Thanks. Stay nearby. You will be called soon.'
          : `You are almost ready. Please make your way closer to ${locationText}.`,
      },
      released: {
        title: 'Your Turn',
        detail: pilotCompletionMode === 'staff_served'
          ? `Go to ${locationText}. Staff will complete this step when you are served.`
          : `Go to ${locationText}. Enter the station code there to complete this step.`,
      },
      completed: {
        title: 'Completed',
        detail: 'This step is complete. You can return to the event.',
      },
      cancelled: {
        title: 'Cancelled',
        detail: 'Please check with staff if you still need help.',
      },
      left: {
        title: 'Left Queue',
        detail: 'You are no longer active in this queue.',
      },
    };
    const defaultStatus = statusCopy[pilotStage] ?? statusCopy.waiting;
    const status = {
      title: metadataCopy.title ?? defaultStatus.title,
      detail: pilotStage === 'standby' && nearbyConfirmed
        ? defaultStatus.detail
        : metadataCopy.detail ?? defaultStatus.detail,
    };
    const statusTheme: Record<string, { border: string; background: string; title: string; label: string }> = {
      waiting: { border: '#7c3aed', background: '#f5f3ff', title: '#4c1d95', label: '#6d28d9' },
      standby: { border: '#eab308', background: '#fefce8', title: '#854d0e', label: '#a16207' },
      released: { border: '#f97316', background: '#fff7ed', title: '#9a3412', label: '#c2410c' },
      completed: { border: '#15803d', background: '#ecfdf5', title: '#14532d', label: '#15803d' },
      cancelled: { border: '#991b1b', background: '#fef2f2', title: '#7f1d1d', label: '#991b1b' },
      left: { border: '#6b7280', background: '#f8fafc', title: '#374151', label: '#6b7280' },
    };
    const theme = statusTheme[pilotStage] ?? statusTheme.waiting;
    const showLocation = pilotStage === 'standby' || pilotStage === 'released' || pilotStage === 'completed';
    const showInstruction = pilotStage === 'standby';

    return (
      <div className="card card-scrollable tkt-card tkt-pilot-card">
        {showNotHereModal && (
          <div className="tkt-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="not-here-title">
            <div className="tkt-modal">
              <h2 id="not-here-title">You were marked not here</h2>
              <p>{NOT_HERE_NOTICE}</p>
              <button className="tkt-btn-checkin" onClick={() => setShowNotHereModal(false)}>
                OK
              </button>
            </div>
          </div>
        )}

        <div className="tkt-pilot-header">
          <div className="tkt-pilot-title-wrap">
            <div className="tkt-pilot-event">
                {event.name}
              </div>
              <h1 className="tkt-pilot-title">
                {queue.name}
              </h1>
            </div>
          </div>

        <div className="tkt-pilot-scroll-body">
          <div
            className="tkt-pilot-status"
            style={{ borderColor: theme.border, background: theme.background }}
          >
            <div className="tkt-pilot-label" style={{ color: theme.label }}>
              Status
            </div>
            <div className="tkt-pilot-status-title" style={{ color: theme.title }}>
              {status.title}
            </div>
            <p className="tkt-pilot-status-detail">
              {status.detail}
            </p>
          </div>

          {showLocation && (
            <div className="tkt-pilot-panel">
              <div className="tkt-pilot-label">
                Location
              </div>
              <div className="tkt-pilot-location">
                {locationText}
              </div>
            </div>
          )}

          {showInstruction && (
            <div className="tkt-pilot-instruction">
              {instructionText}
            </div>
          )}

          {notHereNoticeActive && needsNearbyConfirmation && (
            <div className="tkt-pilot-not-here-banner">
              <strong>You were marked not here.</strong> Tap I'm Nearby again when you are at the station and ready to be called.
            </div>
          )}

          {needsNearbyConfirmation && (
            <button
              className="tkt-btn-checkin"
              onClick={confirmNearby}
              disabled={nearbySaving}
            >
              {nearbySaving ? 'Marking Nearby...' : "I'm Nearby"}
            </button>
          )}

          {completionError && pilotStage === 'standby' && (
            <div className="tkt-pilot-error">
              {completionError}
            </div>
          )}

          {pilotStage === 'released' && pilotCompletionMode === 'guest_code' && (
            <div className="tkt-pilot-panel tkt-pilot-code-panel">
              <h2>
                Enter the station code
              </h2>
              <p>
                Find the posted four digit code at the station.
              </p>
              {completionError && (
                <div className="tkt-pilot-error">
                  {completionError}
                </div>
              )}
              <input
                value={completionCode}
                onChange={(e) => setCompletionCode(e.target.value)}
                placeholder="Station code"
                className="tkt-pilot-code-input"
              />
              <button
                className="tkt-btn-checkin"
                onClick={() => completePilotAction()}
                disabled={completionSaving}
              >
                {completionSaving ? 'Completing...' : 'Complete Step'}
              </button>
            </div>
          )}
        </div>

        <div className="tkt-actions tkt-pilot-actions">
          {pilotStage === 'completed' ? (
            <button
              className="tkt-btn-checkin"
              onClick={() => navigate(`/events/${eventSlug}`)}
            >
              Back to Event
            </button>
          ) : (
            <>
              <button
                className="tkt-btn-checkin"
                onClick={() => navigate(`/events/${eventSlug}`)}
              >
                Back to Event
              </button>
              <button
                className="tkt-leave-btn"
                onClick={handleLeave}
                disabled={leaveDisabled}
              >
                Leave Queue
              </button>
            </>
          )}
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
            src={queueImageSrc || '/images/zippy.png'}
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
            src={queueImageSrc || '/images/market-fresh-peonies.png'}
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
