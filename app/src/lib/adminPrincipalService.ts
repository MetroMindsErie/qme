import { supabase } from './supabase';
import type { AdminPrincipal, PlatformRole } from '../types';

export interface CurrentAdminPrincipal {
  principal: AdminPrincipal;
  platformRoles: PlatformRole[];
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
  return {
    principal: principal as AdminPrincipal,
    platformRoles,
    isSuperadmin: platformRoles.some((role) => role.role === 'superadmin'),
  };
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
