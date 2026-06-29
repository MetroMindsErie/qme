import { supabase } from './supabase';
import type { AdminPrincipal, EventStaffAssignment } from '../types';

export type EventStaffRole = EventStaffAssignment['role'];

export interface EventStaffMember {
  assignment: EventStaffAssignment;
  principal: AdminPrincipal | null;
}

export async function listEventStaff(eventId: string): Promise<EventStaffMember[]> {
  const { data: assignments, error: assignmentsError } = await supabase
    .from('event_staff_assignments')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });
  if (assignmentsError) throw assignmentsError;

  const activeAssignments = (assignments ?? []) as EventStaffAssignment[];
  const principalIds = Array.from(new Set(activeAssignments.map((assignment) => assignment.principal_id)));
  if (principalIds.length === 0) return [];

  const { data: principals, error: principalsError } = await supabase
    .from('admin_principals')
    .select('*')
    .in('id', principalIds);
  if (principalsError) throw principalsError;

  const principalsById = new Map(
    ((principals ?? []) as AdminPrincipal[]).map((principal) => [principal.id, principal])
  );

  return activeAssignments.map((assignment) => ({
    assignment,
    principal: principalsById.get(assignment.principal_id) ?? null,
  }));
}

export async function addEventStaffAssignment(input: {
  eventId: string;
  organizationId: string;
  principalId: string;
  role: EventStaffRole;
  eceId?: string | null;
  queueId?: string | null;
  grantedByPrincipalId?: string | null;
}): Promise<EventStaffAssignment> {
  const { data, error } = await supabase
    .from('event_staff_assignments')
    .insert({
      event_id: input.eventId,
      organization_id: input.organizationId,
      principal_id: input.principalId,
      role: input.role,
      queue_id: input.queueId ?? null,
      ece_id: input.eceId ?? null,
      status: 'active',
      granted_by: input.grantedByPrincipalId ?? null,
      metadata: { source: 'admin-event-staff-ui' },
    })
    .select()
    .single();
  if (error) throw error;
  return data as EventStaffAssignment;
}

export async function archiveEventStaffAssignment(assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from('event_staff_assignments')
    .update({ status: 'archived' })
    .eq('id', assignmentId);
  if (error) throw error;
}
