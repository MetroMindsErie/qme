/**
 * Admin: View event details + manage its queues (list, create, delete).
 */
import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import {
  canAccessEvent,
  canManageEvent,
  getCurrentAdminPrincipal,
  type CurrentAdminPrincipal,
} from '../../lib/adminPrincipalService';
import { createAdminUserWithAuth, resetStaffPasswordWithAuth } from '../../lib/adminPrincipalAdminService';
import { getEvent, resetEventTestData } from '../../lib/eventService';
import { deleteEce, listEcesForEvent } from '../../lib/eceService';
import { listEventCheckIns, onEventCheckInsChange } from '../../lib/checkInService';
import {
  addEventStaffAssignment,
  archiveEventStaffAssignment,
  listEventStaff,
  type EventStaffMember,
} from '../../lib/eventStaffService';
import { findAdminPrincipalByEmail } from '../../lib/organizationStaffService';
import { getQueueStageSummary, listQueuesForEvent, deleteQueue, listQueuePilotTickets, onQueueTicketsChange } from '../../lib/queueService';
import { formatDate, formatTime } from '../../lib/utils';
import type { Ece, EventCheckIn, QEvent, Queue, Ticket } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

function isGroupOrderEce(ece: Ece): boolean {
  return ece.metadata?.interaction_mode === 'group_order';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function generateStaffPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

type CheckInSummary = {
  waitingForStaff: number;
  checkedIn: number;
};

type QueueSummary = {
  waiting: number;
  gathering: number;
  nearby: number;
  released: number;
  completed: number;
};

type AdminEventTab = 'operations' | 'staff' | 'setup';

const EVENT_STAFF_ROLE = 'check_in_staff' as const;

const emptyQueueSummary: QueueSummary = {
  waiting: 0,
  gathering: 0,
  nearby: 0,
  released: 0,
  completed: 0,
};

function summarizeCheckIns(checkIns: EventCheckIn[]): CheckInSummary {
  return checkIns.reduce<CheckInSummary>(
    (summary, checkIn) => {
      if (checkIn.status === 'completed') summary.checkedIn += 1;
      if (checkIn.status === 'waiting' || checkIn.status === 'called') summary.waitingForStaff += 1;
      return summary;
    },
    { waitingForStaff: 0, checkedIn: 0 }
  );
}

function summarizeQueueTickets(tickets: Ticket[]): QueueSummary {
  return tickets.reduce<QueueSummary>(
    (summary, ticket) => {
      const stage = ticket.stage ?? 'waiting';
      if (stage === 'completed') {
        summary.completed += 1;
        return summary;
      }
      if (ticket.status === 'left' || ticket.status === 'served') return summary;
      if (stage === 'left' || stage === 'cancelled') return summary;
      if (stage === 'waiting') summary.waiting += 1;
      if (stage === 'standby' && ticket.nearby_confirmed_at) summary.nearby += 1;
      if (stage === 'standby' && !ticket.nearby_confirmed_at) summary.gathering += 1;
      if (stage === 'released') summary.released += 1;
      return summary;
    },
    { ...emptyQueueSummary }
  );
}

function StatusPill({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'attention' | 'ready' | 'active' | 'done';
}) {
  const tones = {
    default: { background: '#f8fafc', border: '#e2e8f0', color: '#475569' },
    attention: { background: '#fff7ed', border: '#fed7aa', color: '#9a3412' },
    ready: { background: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
    active: { background: '#eef2ff', border: '#c7d2fe', color: '#4338ca' },
    done: { background: '#ecfdf5', border: '#a7f3d0', color: '#047857' },
  }[tone];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      border: `1px solid ${tones.border}`,
      borderRadius: 999,
      padding: '0.28rem 0.55rem',
      background: tones.background,
      color: tones.color,
      fontSize: '0.72rem',
      fontWeight: 900,
      lineHeight: 1,
      whiteSpace: 'nowrap',
    }}>
      {label} <strong style={{ fontSize: '0.82rem' }}>{value}</strong>
    </span>
  );
}

export default function AdminEventDetail() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<QEvent | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [eces, setEces] = useState<Ece[]>([]);
  const [eventStaff, setEventStaff] = useState<EventStaffMember[]>([]);
  const [checkInSummary, setCheckInSummary] = useState<CheckInSummary>({ waitingForStaff: 0, checkedIn: 0 });
  const [queueSummaries, setQueueSummaries] = useState<Record<string, QueueSummary>>({});
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdminPrincipal | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffNotice, setStaffNotice] = useState('');
  const [createdStaffPassword, setCreatedStaffPassword] = useState<{ email: string; password: string } | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ email: string; password: string } | null>(null);
  const [resettingEventData, setResettingEventData] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminEventTab>('operations');
  const refreshTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (!eventId) return;
    try {
      const ev = await getEvent(eventId);
      const admin = await getCurrentAdminPrincipal();
      setCurrentAdmin(admin);
      if (admin && !canAccessEvent(admin, ev)) {
        setAccessDenied(true);
        setEvent(null);
        setQueues([]);
        setEces([]);
        setEventStaff([]);
        setCheckInSummary({ waitingForStaff: 0, checkedIn: 0 });
        setQueueSummaries({});
        return;
      }
      const [qs, exps, staff, checkIns] = await Promise.all([
        listQueuesForEvent(ev.id),
        listEcesForEvent(ev.id),
        listEventStaff(ev.id),
        listEventCheckIns(ev.id),
      ]);
      const queueSummaryPairs = await Promise.all(
        qs.map(async (queue) => {
          try {
            const summary = await getQueueStageSummary(queue.id);
            return [queue.id, summary] as const;
          } catch (error) {
            console.warn('Could not load queue summary', queue.id, error);
            try {
              const tickets = await listQueuePilotTickets(queue.id);
              return [queue.id, summarizeQueueTickets(tickets)] as const;
            } catch {
              return [queue.id, { ...emptyQueueSummary }] as const;
            }
          }
        })
      );
      setEvent(ev);
      setQueues(qs);
      setEces(exps);
      setEventStaff(staff);
      setCheckInSummary(summarizeCheckIns(checkIns));
      setQueueSummaries(Object.fromEntries(queueSummaryPairs));
    } catch (e) {
      console.error('Failed to load event', e);
      alert('Event not found');
      navigate('/admin/events');
    } finally {
      setLoading(false);
    }
  }, [eventId, navigate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      void refresh();
    }, 750);
  }, [refresh]);

  useEffect(() => {
    if (!event?.id) return;
    const unsubscribe = onEventCheckInsChange(event.id, scheduleRefresh);
    return () => {
      unsubscribe();
    };
  }, [event?.id, scheduleRefresh]);

  useEffect(() => {
    const queueIds = queues.map((queue) => queue.id);
    if (queueIds.length === 0) return;
    const unsubscribes = queueIds.map((queueId) => onQueueTicketsChange(queueId, scheduleRefresh));
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [queues, scheduleRefresh]);

  useEffect(() => {
    if (!event?.id) return;
    const intervalId = window.setInterval(scheduleRefresh, 2000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [event?.id, scheduleRefresh]);

  useEffect(() => {
    if (!event) return;
    if (!canManageEvent(currentAdmin, event) && activeTab !== 'operations') {
      setActiveTab('operations');
    }
  }, [activeTab, currentAdmin, event]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    };
  }, []);

  async function handleDeleteQueue(qId: string, name: string) {
    if (!confirm(`Delete queue "${name}" and all its tickets?`)) return;
    try {
      await deleteQueue(qId);
      setQueues((prev) => prev.filter((q) => q.id !== qId));
    } catch (e) {
      console.error('Delete queue failed', e);
      alert('Failed to delete queue.');
    }
  }

  async function handleDeleteEce(eceId: string, name: string) {
    if (!confirm(`Delete eCe "${name}"?`)) return;
    try {
      await deleteEce(eceId);
      setEces((prev) => prev.filter((ece) => ece.id !== eceId));
    } catch (e) {
      console.error('Delete eCe failed', e);
      alert('Failed to delete eCe.');
    }
  }

  async function handleAddEventStaff(eventForm: FormEvent) {
    eventForm.preventDefault();
    if (!event || !currentAdmin || !staffEmail.trim()) return;
    if (!event.organization_id) {
      alert('Assign this event to an organization before adding event staff.');
      return;
    }
    setStaffSaving(true);
    try {
      const normalizedEmail = staffEmail.trim().toLowerCase();
      let principal = await findAdminPrincipalByEmail(normalizedEmail);
      let temporaryPassword = '';
      const existingPrincipal = Boolean(principal);
      if (!principal) {
        temporaryPassword = generateStaffPassword();
        const created = await createAdminUserWithAuth({
          displayName: `Staff (${normalizedEmail})`,
          email: normalizedEmail,
          password: temporaryPassword,
          principalType: 'person',
          eventId: event.id,
          metadata: {
            onboarding_required: true,
            temporary_password: temporaryPassword,
            onboarding_source: 'event-staff-tab',
          },
        });
        principal = created.principal;
      }
      if (existingPrincipal && !principal.auth_user_id) {
        setStaffNotice(`${normalizedEmail} has a qME profile, but it is not linked to a login yet. Create or link their login from Admin Users before assigning event staff access.`);
        alert('This qME profile is not linked to a login yet.');
        return;
      }
      const alreadyAssigned = eventStaff.some((member) =>
        member.assignment.principal_id === principal.id
        && member.assignment.role === EVENT_STAFF_ROLE
        && !member.assignment.ece_id
      );
      if (alreadyAssigned) {
        setStaffNotice(`${normalizedEmail} already has staff access for this event.`);
        alert('That admin already has staff access for this event.');
        return;
      }
      await addEventStaffAssignment({
        eventId: event.id,
        organizationId: event.organization_id,
        principalId: principal.id,
        role: EVENT_STAFF_ROLE,
        eceId: null,
        queueId: null,
        grantedByPrincipalId: currentAdmin.principal.id,
      });
      setStaffEmail('');
      setCreatedStaffPassword(temporaryPassword ? { email: normalizedEmail, password: temporaryPassword } : null);
      setStaffNotice(existingPrincipal
        ? `${normalizedEmail} already has a qME login. They can use their existing credentials for this event, or you can reset their password from their staff row.`
        : ''
      );
      setEventStaff(await listEventStaff(event.id));
    } catch (error) {
      console.error('Failed to add event staff', error);
      alert('Could not add event staff. Check whether this person already has an active/duplicate assignment.');
    } finally {
      setStaffSaving(false);
    }
  }

  async function handleResetStaffPassword(member: EventStaffMember) {
    if (!event || !member.principal?.id || !member.principal.email) return;
    if (!member.principal.auth_user_id) {
      alert('This staff profile is not linked to a login yet.');
      return;
    }
    const name = member.principal.display_name || member.principal.email;
    if (!confirm(`Reset the password for ${name}? They will need the new temporary password to sign in.`)) return;

    const temporaryPassword = generateStaffPassword();
    try {
      await resetStaffPasswordWithAuth({
        principalId: member.principal.id,
        eventId: event.id,
        password: temporaryPassword,
      });
      setPasswordModal({ email: member.principal.email, password: temporaryPassword });
      setCreatedStaffPassword(null);
      setStaffNotice(`${member.principal.email} has a new temporary password. Share it with them directly.`);
      setEventStaff(await listEventStaff(event.id));
    } catch (error) {
      console.error('Failed to reset staff password', error);
      alert('Could not reset staff password.');
    }
  }

  async function handleArchiveEventStaff(member: EventStaffMember) {
    if (!event) return;
    const name = member.principal?.display_name || member.principal?.email || 'this staff member';
    if (!confirm(`Remove ${name} from this event role?`)) return;
    try {
      await archiveEventStaffAssignment(member.assignment.id);
      setEventStaff(await listEventStaff(event.id));
    } catch (error) {
      console.error('Failed to remove event staff', error);
      alert('Could not remove event staff.');
    }
  }

  async function handleResetEventTestData() {
    if (!event || resettingEventData) return;
    const confirmation = window.prompt(
      `Reset all test guest data for "${event.name}"?\n\nThis removes check-ins, queue tickets, guest sessions, guest marks/completions, credits, designations, and group order submissions. Event setup, features, queues, and staff access will stay.\n\nType the secret reset password to continue.`
    );
    if (confirmation === null) {
      alert('Reset canceled. No test data was changed.');
      return;
    }
    if (confirmation.trim().toUpperCase() !== 'SOTCRST') {
      alert('Reset was not run. Type the secret reset password to confirm.');
      return;
    }

    setResettingEventData(true);
    try {
      await resetEventTestData(event.id);
      await refresh();
      alert('Event test data reset.');
    } catch (error) {
      console.error('Failed to reset event test data', error);
      alert('Could not reset event test data.');
    } finally {
      setResettingEventData(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading…</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="card" style={{ minHeight: '600px', padding: '2rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h1 className="headline" style={{ fontSize: '1.4rem', margin: '0 0 0.75rem' }}>Event access unavailable</h1>
          <p style={{ color: '#64748b', fontWeight: 700, lineHeight: 1.5 }}>
            This admin account is not assigned to this event or its organization.
          </p>
          <button className="actionBtn actionBtn-secondary" type="button" onClick={() => navigate('/admin/events')}>
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const statusColor: Record<string, string> = {
    active: '#00c853',
    paused: '#ff9800',
    closed: '#f44336',
  };
  const linkedQueueIds = new Set(eces.map((ece) => ece.queue_id).filter(Boolean));
  const standaloneQueues = queues.filter((queue) => !linkedQueueIds.has(queue.id));
  const visibleEces = eces.filter((ece) => ece.type !== 'check_in');
  const canManageThisEvent = canManageEvent(currentAdmin, event);
  const eventTabs: Array<[AdminEventTab, string]> = [
    ['operations', 'Operations'],
    ...(canManageThisEvent
      ? [
          ['staff', 'Staff'],
          ['setup', 'Setup'],
        ] as Array<[AdminEventTab, string]>
      : []),
  ];
  const eceById = new Map(eces.map((ece) => [ece.id, ece]));
  const staffSearchText = staffSearch.trim().toLowerCase();
  const filteredEventStaff = staffSearchText
    ? eventStaff.filter((member) => {
        const principal = member.principal;
        return [
          principal?.display_name,
          principal?.email,
          member.assignment.role.replaceAll('_', ' '),
        ].some((value) => value?.toLowerCase().includes(staffSearchText));
      })
    : eventStaff;

  return (
    <div className="card card-scrollable admin-event-detail-card" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header
        logoSrc={event.slug === 'sotc-test-check-in' ? '/images/sotc-logo.png' : event.image_url || '/images/qmeFirstLogo.jpg'}
        titleLine1="ADMIN"
        titleLine2="EVENT"
      />

      {/* Event summary */}
      <div style={{ padding: '0 1.25rem 1rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>{event.name}</h1>
        <p style={{ color: '#666', margin: '0 0 0.75rem', lineHeight: 1.5 }}>{event.description}</p>
        <div style={{ fontSize: '0.88rem', color: '#555', marginBottom: '0.75rem', lineHeight: 1.6 }}>
          📍 {event.location || '—'}<br/>
          📅 {formatDate(event.event_date)}<br/>
          🕐 {formatTime(event.start_time)} – {formatTime(event.end_time)} {event.timezone}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const }}>
          {canManageThisEvent && (
          <button
            className="actionBtn actionBtn-primary"
            style={{ margin: 0, width: 'auto', padding: '0.5rem 1.2rem', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}
            onClick={() => navigate(`/admin/events/${event.id}/edit`)}
          >
            ✏️ Edit Event
          </button>
          )}
          <button
            className="actionBtn actionBtn-secondary"
            style={{ margin: 0, width: 'auto', padding: '0.5rem 1.2rem', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}
            onClick={() => navigate(`/admin/events/${event.id}/check-ins`)}
          >
            {event.slug === 'peony-festival' ? 'Mobile Bar Check-Ins' : 'Event Check-Ins'}
          </button>
          <button
            className="actionBtn actionBtn-secondary"
            style={{ margin: 0, width: 'auto', padding: '0.5rem 1.2rem', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}
            onClick={() => navigate('/admin/events')}
          >
            ← Back
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          <StatusPill label="Waiting for staff" value={checkInSummary.waitingForStaff} tone={checkInSummary.waitingForStaff > 0 ? 'attention' : 'default'} />
          <StatusPill label="Checked in" value={checkInSummary.checkedIn} tone="done" />
        </div>
      </div>

      {/* Queues section */}
      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        <div className="admin-tabs" role="tablist" aria-label="Event admin sections">
          {eventTabs.map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`admin-tab ${activeTab === tab ? 'admin-tab-active' : ''}`}
              onClick={() => setActiveTab(tab as AdminEventTab)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'operations' && (
        <>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <StatusPill label="Waiting for staff" value={checkInSummary.waitingForStaff} tone={checkInSummary.waitingForStaff > 0 ? 'attention' : 'default'} />
          <StatusPill label="Checked in" value={checkInSummary.checkedIn} tone="done" />
        </div>
        </>
        )}

        {activeTab === 'staff' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.75rem', fontWeight: 700 }}>Event Staff</h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.45, margin: '0 0 0.85rem', fontWeight: 700 }}>
            Assign existing admin users as limited staff for this event. Event admin access is managed separately by qME/organization admins.
          </p>

          {canManageThisEvent && currentAdmin && (
            <>
            <form onSubmit={handleAddEventStaff} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#2f3e4f', fontSize: '0.82rem', fontWeight: 800, flex: '1 1 210px' }}>
                Staff Email
                <input
                  value={staffEmail}
                  onChange={(formEvent) => {
                    setStaffEmail(formEvent.target.value);
                    setCreatedStaffPassword(null);
                    setStaffNotice('');
                  }}
                  type="email"
                  placeholder="staff@example.com"
                  style={{ padding: '0.65rem 0.75rem', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.95rem' }}
                />
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#2f3e4f', fontSize: '0.82rem', fontWeight: 800, flex: '1 1 180px' }}>
                Access Level
                <div style={{ padding: '0.65rem 0.75rem', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.95rem', background: '#f8fafc', color: '#2f3e4f' }}>
                  Staff
                  <span style={{ display: 'block', marginTop: 3, color: '#64748b', fontSize: '0.72rem', fontWeight: 800 }}>
                    Limited operational access
                  </span>
                </div>
              </div>
              <button
                className="actionBtn actionBtn-primary"
                type="submit"
                disabled={staffSaving || !staffEmail.trim()}
                style={{ margin: 0, width: 'auto', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
              >
                {staffSaving ? 'Adding...' : 'Add Event Staff'}
              </button>
            </form>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#2f3e4f', fontSize: '0.82rem', fontWeight: 800, marginBottom: '1rem' }}>
              Search Event Staff
              <input
                value={staffSearch}
                onChange={(formEvent) => setStaffSearch(formEvent.target.value)}
                type="search"
                placeholder="Search first, last, or email"
                style={{ padding: '0.65rem 0.75rem', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.95rem' }}
              />
            </label>
            </>
          )}

          {createdStaffPassword && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', color: '#065f46', fontWeight: 800, lineHeight: 1.45 }}>
              New staff login created for {createdStaffPassword.email}. Password: <span style={{ fontFamily: 'monospace' }}>{createdStaffPassword.password}</span>
            </div>
          )}

          {staffNotice && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', color: '#1d4ed8', fontWeight: 800, lineHeight: 1.45 }}>
              {staffNotice}
            </div>
          )}

          {!currentAdmin && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', color: '#9a3412', fontWeight: 800, lineHeight: 1.45 }}>
              Sign in with named admin access to view or manage event staff.
            </div>
          )}

          {currentAdmin && eventStaff.length === 0 && (
            <p style={{ color: '#999', padding: '1.25rem 0', textAlign: 'center' }}>
              No event staff have been assigned yet.
            </p>
          )}

          {currentAdmin && eventStaff.length > 0 && filteredEventStaff.length === 0 && (
            <p style={{ color: '#999', padding: '1.25rem 0', textAlign: 'center' }}>
              No event staff match that search.
            </p>
          )}

          {filteredEventStaff.map((member) => {
            const scopedEce = member.assignment.ece_id ? eceById.get(member.assignment.ece_id) : null;
            const principalMetadata = asRecord(member.principal?.metadata);
            const temporaryPassword = typeof principalMetadata.temporary_password === 'string'
              ? principalMetadata.temporary_password
              : '';
            return (
              <div key={member.assignment.id} style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#2f3e4f', fontSize: '1.02rem' }}>
                    {member.principal?.display_name || member.principal?.email || 'Unknown admin principal'}
                  </div>
                  <div style={{ color: '#666', fontSize: '0.85rem', marginTop: 4 }}>
                    {(member.principal?.email || 'No email')} · {member.assignment.role.replaceAll('_', ' ')}
                    {scopedEce ? ` · ${scopedEce.name}` : ''}
                  </div>
                </div>
                {canManageThisEvent && currentAdmin && (
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {temporaryPassword && member.principal?.email && (
                    <button
                      className="actionBtn actionBtn-secondary"
                      type="button"
                      style={{ margin: 0, width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                      onClick={() => setPasswordModal({ email: member.principal?.email ?? '', password: temporaryPassword })}
                    >
                      Password
                    </button>
                  )}
                  {!temporaryPassword && member.principal?.auth_user_id && member.principal?.email && (
                    <button
                      className="actionBtn actionBtn-secondary"
                      type="button"
                      style={{ margin: 0, width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                      onClick={() => handleResetStaffPassword(member)}
                    >
                      Reset Password
                    </button>
                  )}
                  <button
                    className="actionBtn actionBtn-danger"
                    type="button"
                    style={{ margin: 0, width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                    onClick={() => handleArchiveEventStaff(member)}
                  >
                    Remove
                  </button>
                  </div>
                )}
              </div>
            );
          })}

          {passwordModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
              <div style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 10, padding: '1rem', border: '1px solid #d1d5db', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)' }}>
                <h3 style={{ margin: '0 0 0.5rem', color: '#1f2d3d', fontSize: '1.1rem' }}>Staff Password</h3>
                <p style={{ margin: '0 0 0.75rem', color: '#64748b', fontWeight: 700, lineHeight: 1.4 }}>
                  Share this with {passwordModal.email}. The Password button remains on this staff row until they sign in with this temporary password.
                </p>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '0.85rem', fontFamily: 'monospace', fontWeight: 900, background: '#f8fafc', color: '#1f2d3d', marginBottom: '0.85rem' }}>
                  {passwordModal.password}
                </div>
                <button
                  className="actionBtn actionBtn-primary"
                  type="button"
                  style={{ margin: 0 }}
                  onClick={() => setPasswordModal(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {activeTab === 'setup' && canManageThisEvent && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem', marginBottom: '1rem', background: '#f8fafc' }}>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.75rem', fontWeight: 700 }}>Event Setup</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const }}>
            <button
              className="actionBtn actionBtn-primary"
              style={{ margin: 0, width: 'auto', padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
              onClick={() => navigate(`/admin/events/${event.id}/edit`)}
            >
              Edit Event
            </button>
            <button
              className="actionBtn actionBtn-danger"
              disabled={resettingEventData}
              style={{ margin: 0, width: 'auto', padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
              onClick={handleResetEventTestData}
            >
              {resettingEventData ? 'Resetting...' : 'Reset Test Data'}
            </button>
          </div>
        </div>
        )}

        {activeTab !== 'staff' && (
        <>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Event Features</h2>
            {canManageThisEvent && (
            <button
              className="actionBtn actionBtn-primary"
              hidden={activeTab !== 'setup'}
              style={{ margin: 0, width: 'auto', padding: '0.5rem 1.2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => navigate(`/admin/events/${event.id}/eces/new`)}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> Add Feature
            </button>
            )}
          </div>

          {visibleEces.length === 0 && (
            <p style={{ color: '#999', padding: '1.5rem 0', textAlign: 'center' }}>
              No features yet. Add one to place an activity into this event.
            </p>
          )}

          {visibleEces.map((exp) => {
            const linkedQueue = exp.queue_id ? queues.find((q) => q.id === exp.queue_id) : null;
            const queueSummary = linkedQueue ? queueSummaries[linkedQueue.id] ?? emptyQueueSummary : null;

            return (
              <div
              key={exp.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 10,
                padding: 'clamp(0.75rem, 2vw, 1rem)',
                marginBottom: '0.75rem',
                background: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap' as const,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 800, fontSize: '1.02rem', color: '#2f3e4f', display: 'block', marginBottom: '0.35rem' }}>
                  {exp.name}
                </span>
                <div style={{ fontSize: '0.82rem', color: '#555', lineHeight: 1.5 }}>
                  {exp.type.replace('_', '-')} · {exp.status}
                  {exp.location ? ` · ${exp.location}` : ''}
                  {exp.queue_id ? ' · linked queue' : ''}
                </div>
                {exp.description && (
                  <div style={{ fontSize: '0.88rem', color: '#666', marginTop: '0.35rem' }}>
                    {exp.description}
                  </div>
                )}
                {queueSummary && (
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
                    <StatusPill label="Waiting" value={queueSummary.waiting} tone={queueSummary.waiting > 0 ? 'attention' : 'default'} />
                    <StatusPill label="Gathering" value={queueSummary.gathering} tone={queueSummary.gathering > 0 ? 'active' : 'default'} />
                    <StatusPill label="Nearby" value={queueSummary.nearby} tone={queueSummary.nearby > 0 ? 'ready' : 'default'} />
                    <StatusPill label="Your Turn" value={queueSummary.released} tone={queueSummary.released > 0 ? 'active' : 'default'} />
                    <StatusPill label="Done" value={queueSummary.completed} tone="done" />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' as const }}>
                {linkedQueue && (
                  <button
                    className="actionBtn actionBtn-primary"
                    style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => navigate(`/admin/events/${event.id}/queues/${linkedQueue.id}`)}
                  >
                    Manage Queue
                  </button>
                )}
                {isGroupOrderEce(exp) && (
                  <button
                    className="actionBtn actionBtn-primary"
                    style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => navigate(`/admin/events/${event.id}/group-order`)}
                  >
                    Group Order
                  </button>
                )}
                {canManageThisEvent && (
                <button
                  className="actionBtn actionBtn-secondary"
                  hidden={activeTab !== 'setup'}
                  style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  onClick={() => navigate(`/admin/events/${event.id}/eces/${exp.id}/edit`)}
                >
                  Edit
                </button>
                )}
                {canManageThisEvent && (
                <button
                  className="actionBtn actionBtn-danger"
                  hidden={activeTab !== 'setup'}
                  style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  onClick={() => handleDeleteEce(exp.id, exp.name)}
                >
                  Delete
                </button>
                )}
              </div>
              </div>
            );
          })}
        </div>

        {activeTab === 'setup' && standaloneQueues.length > 0 && (
          <details style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 800, fontSize: '1rem', color: '#2f3e4f' }}>
              Advanced Queue Engines
            </summary>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0 0.75rem', gap: '0.75rem', flexWrap: 'wrap' }}>
            <p style={{ color: '#777', margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
              Queue engines power queue features. Most queue work should happen from the feature row above.
            </p>
            {canManageThisEvent && (
            <button
              className="actionBtn actionBtn-primary"
              style={{ margin: 0, width: 'auto', padding: '0.5rem 1.2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => navigate(`/admin/events/${event.id}/queues/new`)}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> Add Queue
            </button>
            )}
          </div>

        {standaloneQueues.map((q) => (
          <div
            key={q.id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 10,
              padding: 'clamp(0.75rem, 2vw, 1.25rem)',
              marginBottom: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
              background: '#fafafa',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              flexWrap: 'wrap' as const,
              cursor: 'pointer',
            }}
            onClick={(e) => {
              // Prevent navigation if a button inside is clicked
              if ((e.target as HTMLElement).closest('button')) return;
              navigate(`/admin/events/${event.id}/queues/${q.id}`);
            }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate(`/admin/events/${event.id}/queues/${q.id}`);
              }
            }}
            role="button"
            aria-label={`View queue ${q.name}`}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#2f3e4f', display: 'block', marginBottom: '0.4rem' }}>
                {q.name}
              </span>
              <div style={{ fontSize: '0.85rem', color: '#555' }}>
                Now serving: <span style={{ fontWeight: 600, color: '#2f3e4f' }}>{q.now_serving}</span> ·{' '}
                <span style={{ fontWeight: 600, color: statusColor[q.status] ?? '#999' }}>{q.status}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' as const }}>
              <button
                className="actionBtn actionBtn-primary"
                style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={(e) => { e.stopPropagation(); navigate(`/admin/events/${event.id}/queues/${q.id}`); }}
              >
                📊 Manage
              </button>
              <button
                className="actionBtn actionBtn-secondary"
                style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={(e) => { e.stopPropagation(); navigate(`/admin/events/${event.id}/queues/${q.id}/edit`); }}
              >
                ✏️ Edit
              </button>
              <button
                className="actionBtn actionBtn-danger"
                style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={(e) => { e.stopPropagation(); handleDeleteQueue(q.id, q.name); }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
          </details>
        )}
        </>
        )}
      </div>
    </div>
  );
}
