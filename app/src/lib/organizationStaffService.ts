import { supabase } from './supabase';
import type { AdminPrincipal, OrganizationMembership } from '../types';

export type OrganizationStaffRole = OrganizationMembership['role'];

export interface OrganizationStaffMember {
  membership: OrganizationMembership;
  principal: AdminPrincipal | null;
}

export async function listOrganizationStaff(organizationId: string): Promise<OrganizationStaffMember[]> {
  const { data: memberships, error: membershipsError } = await supabase
    .from('organization_memberships')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });
  if (membershipsError) throw membershipsError;

  const activeMemberships = (memberships ?? []) as OrganizationMembership[];
  const principalIds = Array.from(new Set(activeMemberships.map((membership) => membership.principal_id)));
  if (principalIds.length === 0) return [];

  const { data: principals, error: principalsError } = await supabase
    .from('admin_principals')
    .select('*')
    .in('id', principalIds);
  if (principalsError) throw principalsError;

  const principalsById = new Map(
    ((principals ?? []) as AdminPrincipal[]).map((principal) => [principal.id, principal])
  );

  return activeMemberships.map((membership) => ({
    membership,
    principal: principalsById.get(membership.principal_id) ?? null,
  }));
}

export async function findAdminPrincipalByEmail(email: string): Promise<AdminPrincipal | null> {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) return null;

  const { data, error } = await supabase
    .from('admin_principals')
    .select('*')
    .ilike('email', normalizedEmail)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;
  return (data as AdminPrincipal | null) ?? null;
}

export async function addOrganizationMembership(input: {
  organizationId: string;
  principalId: string;
  role: OrganizationStaffRole;
  grantedByPrincipalId?: string | null;
}): Promise<OrganizationMembership> {
  const { data, error } = await supabase
    .from('organization_memberships')
    .insert({
      organization_id: input.organizationId,
      principal_id: input.principalId,
      role: input.role,
      status: 'active',
      granted_by: input.grantedByPrincipalId ?? null,
      metadata: { source: 'admin-ui-existing-principal' },
    })
    .select()
    .single();
  if (error) throw error;
  return data as OrganizationMembership;
}

export async function archiveOrganizationMembership(membershipId: string): Promise<void> {
  const { error } = await supabase
    .from('organization_memberships')
    .update({ status: 'archived' })
    .eq('id', membershipId);
  if (error) throw error;
}
