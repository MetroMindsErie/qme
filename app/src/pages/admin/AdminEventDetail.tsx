/**
 * Admin: View event details + manage its queues (list, create, delete).
 */
import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import {
  canAccessEvent,
  canManageEvent,
  getCurrentAdminPrincipal,
  type CurrentAdminPrincipal,
} from '../../lib/adminPrincipalService';
import { getEvent } from '../../lib/eventService';
import { deleteEce, listEcesForEvent } from '../../lib/eceService';
import {
  addEventStaffAssignment,
  archiveEventStaffAssignment,
  listEventStaff,
  type EventStaffMember,
  type EventStaffRole,
} from '../../lib/eventStaffService';
import { findAdminPrincipalByEmail } from '../../lib/organizationStaffService';
import { listQueuesForEvent, deleteQueue } from '../../lib/queueService';
import { formatDate, formatTime } from '../../lib/utils';
import type { Ece, QEvent, Queue } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

function isGroupOrderEce(ece: Ece): boolean {
  return ece.metadata?.interaction_mode === 'group_order';
}

export default function AdminEventDetail() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<QEvent | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [eces, setEces] = useState<Ece[]>([]);
  const [eventStaff, setEventStaff] = useState<EventStaffMember[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdminPrincipal | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<EventStaffRole>('check_in_staff');
  const [staffEceId, setStaffEceId] = useState('');
  const [staffSaving, setStaffSaving] = useState(false);

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
        return;
      }
      const [qs, exps, staff] = await Promise.all([
        listQueuesForEvent(ev.id),
        listEcesForEvent(ev.id),
        listEventStaff(ev.id),
      ]);
      setEvent(ev);
      setQueues(qs);
      setEces(exps);
      setEventStaff(staff);
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
    const roleRequiresFeature = !['event_admin', 'check_in_staff'].includes(staffRole);
    const scopedEce = staffEceId ? eces.find((ece) => ece.id === staffEceId) : null;
    if (roleRequiresFeature && !scopedEce) {
      alert('Station/service roles must be assigned to a specific event feature.');
      return;
    }
    setStaffSaving(true);
    try {
      const principal = await findAdminPrincipalByEmail(staffEmail);
      if (!principal) {
        alert('No active admin principal was found for that email. Create/link the admin principal first, then add the event role.');
        return;
      }
      const alreadyAssigned = eventStaff.some((member) =>
        member.assignment.principal_id === principal.id
        && member.assignment.role === staffRole
        && (member.assignment.ece_id ?? '') === (scopedEce?.id ?? '')
      );
      if (alreadyAssigned) {
        alert('That admin already has this event role.');
        return;
      }
      await addEventStaffAssignment({
        eventId: event.id,
        organizationId: event.organization_id,
        principalId: principal.id,
        role: staffRole,
        eceId: scopedEce?.id ?? null,
        queueId: scopedEce?.queue_id ?? null,
        grantedByPrincipalId: currentAdmin.principal.id,
      });
      setStaffEmail('');
      setStaffRole('check_in_staff');
      setStaffEceId('');
      setEventStaff(await listEventStaff(event.id));
    } catch (error) {
      console.error('Failed to add event staff', error);
      alert('Could not add event staff. Check whether this person already has an active/duplicate assignment.');
    } finally {
      setStaffSaving(false);
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
  const staffRolesThatRequireFeature: EventStaffRole[] = ['service_staff', 'station_account', 'service_provider'];
  const selectedRoleRequiresFeature = staffRolesThatRequireFeature.includes(staffRole);
  const eceById = new Map(eces.map((ece) => [ece.id, ece]));

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
      </div>

      {/* Queues section */}
      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.75rem', fontWeight: 700 }}>Event Staff</h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.45, margin: '0 0 0.85rem', fontWeight: 700 }}>
            Assign existing admin users to this event. Create the user/principal first, then add their event role here.
          </p>

          {canManageThisEvent && (
            <form onSubmit={handleAddEventStaff} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#2f3e4f', fontSize: '0.82rem', fontWeight: 800, flex: '1 1 210px' }}>
                Admin Email
                <input
                  value={staffEmail}
                  onChange={(formEvent) => setStaffEmail(formEvent.target.value)}
                  type="email"
                  placeholder="staff@example.com"
                  style={{ padding: '0.65rem 0.75rem', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.95rem' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#2f3e4f', fontSize: '0.82rem', fontWeight: 800, flex: '1 1 180px' }}>
                Event Role
                <select
                  value={staffRole}
                  onChange={(formEvent) => {
                    const nextRole = formEvent.target.value as EventStaffRole;
                    setStaffRole(nextRole);
                    if (['event_admin', 'check_in_staff'].includes(nextRole)) setStaffEceId('');
                  }}
                  style={{ padding: '0.65rem 0.75rem', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.95rem', background: '#fff' }}
                >
                  <option value="check_in_staff">Check-in staff</option>
                  <option value="event_admin">Event admin</option>
                  <option value="service_staff">Service/station staff</option>
                  <option value="service_provider">Service provider</option>
                  <option value="station_account">Station account</option>
                </select>
              </label>
              {selectedRoleRequiresFeature && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#2f3e4f', fontSize: '0.82rem', fontWeight: 800, flex: '1 1 190px' }}>
                  Feature
                  <select
                    value={staffEceId}
                    onChange={(formEvent) => setStaffEceId(formEvent.target.value)}
                    style={{ padding: '0.65rem 0.75rem', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.95rem', background: '#fff' }}
                  >
                    <option value="">Select feature</option>
                    {visibleEces.map((ece) => (
                      <option key={ece.id} value={ece.id}>{ece.name}</option>
                    ))}
                  </select>
                </label>
              )}
              <button
                className="actionBtn actionBtn-primary"
                type="submit"
                disabled={staffSaving || !staffEmail.trim() || (selectedRoleRequiresFeature && !staffEceId)}
                style={{ margin: 0, width: 'auto', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
              >
                {staffSaving ? 'Adding...' : 'Add Event Staff'}
              </button>
            </form>
          )}

          {eventStaff.length === 0 && (
            <p style={{ color: '#999', padding: '1.25rem 0', textAlign: 'center' }}>
              No event staff have been assigned yet.
            </p>
          )}

          {eventStaff.map((member) => {
            const scopedEce = member.assignment.ece_id ? eceById.get(member.assignment.ece_id) : null;
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
                {canManageThisEvent && (
                  <button
                    className="actionBtn actionBtn-danger"
                    type="button"
                    style={{ margin: 0, width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                    onClick={() => handleArchiveEventStaff(member)}
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Event Features</h2>
            {canManageThisEvent && (
            <button
              className="actionBtn actionBtn-primary"
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
                  style={{ margin: 0, width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  onClick={() => navigate(`/admin/events/${event.id}/eces/${exp.id}/edit`)}
                >
                  Edit
                </button>
                )}
                {canManageThisEvent && (
                <button
                  className="actionBtn actionBtn-danger"
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

        {standaloneQueues.length > 0 && (
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
      </div>
    </div>
  );
}
