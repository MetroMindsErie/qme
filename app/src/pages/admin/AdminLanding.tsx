import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import {
  getCurrentAdminPrincipal,
  getManagedOrganizationIds,
  getStaffOrganizationIds,
  type CurrentAdminPrincipal,
} from '../../lib/adminPrincipalService';
import { listEcesForEvent } from '../../lib/eceService';
import { listEvents } from '../../lib/eventService';
import { getQueue } from '../../lib/queueService';
import type { Ece, EventStaffAssignment, QEvent, Queue } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

type AdminWorkspace = {
  id: string;
  title: string;
  detail: string;
  role: string;
  path: string;
  priority: number;
};

function roleLabel(role: EventStaffAssignment['role']): string {
  return role.replace(/_/g, ' ');
}

function isStationRole(role: EventStaffAssignment['role']): boolean {
  return ['check_in_staff', 'service_staff', 'station_account', 'service_provider'].includes(role);
}

function canUseBroadAdminLanding(admin: CurrentAdminPrincipal): boolean {
  return admin.isSuperadmin
    || getManagedOrganizationIds(admin).length > 0
    || getStaffOrganizationIds(admin).length > 0;
}

function eventName(eventsById: Map<string, QEvent>, eventId: string): string {
  return eventsById.get(eventId)?.name ?? 'Assigned event';
}

async function workspaceForAssignment(
  assignment: EventStaffAssignment,
  eventsById: Map<string, QEvent>,
): Promise<AdminWorkspace | null> {
  const eventTitle = eventName(eventsById, assignment.event_id);
  const base = {
    role: roleLabel(assignment.role),
    priority: assignment.role === 'event_admin' ? 10 : isStationRole(assignment.role) ? 20 : 30,
  };

  if (assignment.role === 'event_admin') {
    return {
      ...base,
      id: `event:${assignment.event_id}`,
      title: eventTitle,
      detail: 'Event admin overview',
      path: `/admin/events/${assignment.event_id}`,
    };
  }

  if (assignment.role === 'check_in_staff') {
    return {
      ...base,
      id: `check-in:${assignment.event_id}:${assignment.id}`,
      title: `${eventTitle} Check-In`,
      detail: 'Live check-in workspace',
      path: `/admin/events/${assignment.event_id}/check-ins`,
    };
  }

  if (assignment.queue_id) {
    let queue: Queue | null = null;
    try {
      queue = await getQueue(assignment.queue_id);
    } catch (error) {
      console.warn('Failed to load assigned queue', assignment.queue_id, error);
    }
    return {
      ...base,
      id: `queue:${assignment.queue_id}:${assignment.id}`,
      title: queue?.name ?? 'Assigned station',
      detail: `${eventTitle} queue workspace`,
      path: `/admin/events/${assignment.event_id}/queues/${assignment.queue_id}`,
    };
  }

  if (assignment.ece_id) {
    let ece: Ece | null = null;
    try {
      const eces = await listEcesForEvent(assignment.event_id);
      ece = eces.find((item) => item.id === assignment.ece_id) ?? null;
    } catch (error) {
      console.warn('Failed to load assigned event feature', assignment.ece_id, error);
    }

    if (ece?.type === 'check_in') {
      return {
        ...base,
        id: `check-in:${assignment.event_id}:${assignment.id}`,
        title: `${eventTitle} Check-In`,
        detail: 'Live check-in workspace',
        path: `/admin/events/${assignment.event_id}/check-ins`,
      };
    }

    if (ece?.queue_id) {
      return {
        ...base,
        id: `queue:${ece.queue_id}:${assignment.id}`,
        title: ece.name,
        detail: `${eventTitle} queue workspace`,
        path: `/admin/events/${assignment.event_id}/queues/${ece.queue_id}`,
      };
    }
  }

  return {
    ...base,
    id: `event:${assignment.event_id}:${assignment.id}`,
    title: eventTitle,
    detail: 'Assigned event workspace',
    path: `/admin/events/${assignment.event_id}`,
  };
}

export default function AdminLanding() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<CurrentAdminPrincipal | null>(null);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const currentAdmin = await getCurrentAdminPrincipal();
      setAdmin(currentAdmin);
      if (!currentAdmin) return;

      if (canUseBroadAdminLanding(currentAdmin)) {
        navigate('/admin/events', { replace: true });
        return;
      }

      const activeAssignments = currentAdmin.eventStaffAssignments.filter(
        (assignment) => assignment.status === 'active'
      );
      const eventIds = Array.from(new Set(activeAssignments.map((assignment) => assignment.event_id)));
      const events = await listEvents({ eventIds });
      const eventsById = new Map(events.map((event) => [event.id, event]));

      const resolved = await Promise.all(
        activeAssignments.map((assignment) => workspaceForAssignment(assignment, eventsById))
      );
      const unique = Array.from(
        new Map(
          resolved
            .filter((workspace): workspace is AdminWorkspace => Boolean(workspace))
            .map((workspace) => [workspace.id, workspace])
        ).values()
      ).sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));

      if (unique.length === 1) {
        navigate(unique[0].path, { replace: true });
        return;
      }

      setWorkspaces(unique);
    } catch (loadError) {
      console.error('Failed to resolve admin workspace', loadError);
      setError('Could not load assigned admin workspaces.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header logoSrc="/images/zippy.png" titleLine1="ADMIN" titleLine2="WORKSPACE" />

      <div style={{ padding: '0 1.25rem 0.9rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: 'clamp(1.15rem, 3vw, 1.55rem)', margin: 0 }}>
          Choose Workspace
        </h1>
        <p style={{ color: '#64748b', fontWeight: 800, margin: '0.35rem 0 0' }}>
          Staff accounts only see the event workspaces assigned to them.
        </p>
      </div>

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        {loading && (
          <p style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontWeight: 800 }}>
            Loading assigned workspaces...
          </p>
        )}

        {!loading && error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 900, padding: '0.9rem', borderRadius: 8 }}>
            {error}
          </div>
        )}

        {!loading && !error && admin && workspaces.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <p style={{ color: '#64748b', fontWeight: 900, marginBottom: '1rem' }}>
              No active event workspaces are assigned to this account yet.
            </p>
            <button
              className="actionBtn actionBtn-secondary"
              style={{ margin: 0 }}
              type="button"
              onClick={() => navigate('/')}
            >
              Back to Event
            </button>
          </div>
        )}

        {!loading && !error && workspaces.map((workspace) => (
          <button
            key={workspace.id}
            type="button"
            onClick={() => navigate(workspace.path)}
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              background: '#fff',
              borderRadius: 8,
              padding: '1rem',
              marginBottom: '0.85rem',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ color: '#4f46e5', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.72rem' }}>
              {workspace.role}
            </div>
            <div style={{ color: '#24364b', fontWeight: 900, fontSize: '1.1rem', marginTop: '0.25rem' }}>
              {workspace.title}
            </div>
            <div style={{ color: '#64748b', fontWeight: 800, marginTop: '0.2rem' }}>
              {workspace.detail}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
