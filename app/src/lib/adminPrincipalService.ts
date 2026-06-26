import { supabase } from './supabase';
import type {
  AdminPrincipal,
  EventStaffAssignment,
  OrganizationMembership,
  PlatformRole,
  QEvent,
} from '../types';

export interface CurrentAdminPrincipal {
  principal: AdminPrincipal;
  platformRoles: PlatformRole[];
  organizationMemberships: OrganizationMembership[];
  eventStaffAssignments: EventStaffAssignment[];
  isSuperadmin: boolean;
}

export async function getCurrentAdminPrincipal(): Promise<CurrentAdminPrincipal | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    if (userError.name === 'AuthSessionMissingError' || userError.message === 'Auth session missing!') {
      return null;
    }
    throw userError;
  }
  const user = userData.user;
  if (!user) return null;

  const { data: principal, error: principalError } = await supabase
    .from('admin_principals')
    .select('*')
    .eq('auth_user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();
  if (principalError) throw principalError;
  if (!principal) return null;

  const { data: roles, error: rolesError } = await supabase
    .from('platform_roles')
    .select('*')
    .eq('principal_id', principal.id)
    .eq('status', 'active');
  if (rolesError) throw rolesError;

  const platformRoles = (roles ?? []) as PlatformRole[];

  const { data: memberships, error: membershipsError } = await supabase
    .from('organization_memberships')
    .select('*')
    .eq('principal_id', principal.id)
    .eq('status', 'active');
  if (membershipsError) throw membershipsError;

  const { data: assignments, error: assignmentsError } = await supabase
    .from('event_staff_assignments')
    .select('*')
    .eq('principal_id', principal.id)
    .eq('status', 'active');
  if (assignmentsError) throw assignmentsError;

  return {
    principal: principal as AdminPrincipal,
    platformRoles,
    organizationMemberships: (memberships ?? []) as OrganizationMembership[],
    eventStaffAssignments: (assignments ?? []) as EventStaffAssignment[],
    isSuperadmin: platformRoles.some((role) => role.role === 'superadmin'),
  };
}

export function getManagedOrganizationIds(admin: CurrentAdminPrincipal | null): string[] {
  if (!admin || admin.isSuperadmin) return [];
  return Array.from(new Set(
    admin.organizationMemberships
      .filter((membership) => membership.role === 'org_admin')
      .map((membership) => membership.organization_id)
  ));
}

export function getStaffOrganizationIds(admin: CurrentAdminPrincipal | null): string[] {
  if (!admin || admin.isSuperadmin) return [];
  return Array.from(new Set(
    admin.organizationMemberships
      .filter((membership) => membership.role === 'universal_staff')
      .map((membership) => membership.organization_id)
  ));
}

export function getAssignedEventIds(admin: CurrentAdminPrincipal | null): string[] {
  if (!admin || admin.isSuperadmin) return [];
  return Array.from(new Set(admin.eventStaffAssignments.map((assignment) => assignment.event_id)));
}

export function canManageOrganization(admin: CurrentAdminPrincipal | null, organizationId: string | null): boolean {
  if (!admin) return true;
  if (admin.isSuperadmin) return true;
  if (!organizationId) return false;
  return admin.organizationMemberships.some(
    (membership) => membership.organization_id === organizationId
      && membership.role === 'org_admin'
  );
}

export function canAccessEvent(admin: CurrentAdminPrincipal | null, event: QEvent): boolean {
  if (!admin) return true;
  if (admin.isSuperadmin) return true;
  if (
    event.organization_id
    && admin.organizationMemberships.some((membership) => membership.organization_id === event.organization_id)
  ) {
    return true;
  }
  return admin.eventStaffAssignments.some((assignment) => assignment.event_id === event.id);
}

export function canManageEvent(admin: CurrentAdminPrincipal | null, event: QEvent): boolean {
  if (!admin) return true;
  if (canManageOrganization(admin, event.organization_id)) return true;
  return admin.eventStaffAssignments.some(
    (assignment) => assignment.event_id === event.id && assignment.role === 'event_admin'
  );
}

export async function signInAdmin(email: string, password: string): Promise<CurrentAdminPrincipal | null> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return getCurrentAdminPrincipal();
}

export async function signOutAdmin(): Promise<void> {
  await supabase.auth.signOut();
}
