import { supabase } from './supabase';
import type {
  AdminPrincipal,
  CreateAdminPrincipalInput,
  UpdateAdminPrincipalInput,
} from '../types';

export async function listAdminPrincipals(): Promise<AdminPrincipal[]> {
  const { data, error } = await supabase
    .from('admin_principals')
    .select('*')
    .order('display_name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminPrincipal[];
}

export async function createAdminPrincipal(input: CreateAdminPrincipalInput): Promise<AdminPrincipal> {
  const { data, error } = await supabase
    .from('admin_principals')
    .insert({
      ...input,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      auth_user_id: input.auth_user_id?.trim() || null,
      metadata: input.metadata ?? { source: 'admin-principals-ui' },
    })
    .select()
    .single();
  if (error) throw error;
  return data as AdminPrincipal;
}

export async function updateAdminPrincipal(
  id: string,
  input: UpdateAdminPrincipalInput
): Promise<AdminPrincipal> {
  const { data, error } = await supabase
    .from('admin_principals')
    .update({
      ...input,
      email: input.email === undefined ? undefined : input.email?.trim() || null,
      phone: input.phone === undefined ? undefined : input.phone?.trim() || null,
      auth_user_id: input.auth_user_id === undefined ? undefined : input.auth_user_id?.trim() || null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as AdminPrincipal;
}

export async function findAdminPrincipalByEmail(email: string): Promise<AdminPrincipal | null> {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) return null;

  const { data, error } = await supabase
    .from('admin_principals')
    .select('*')
    .ilike('email', normalizedEmail)
    .maybeSingle();
  if (error) throw error;
  return (data as AdminPrincipal | null) ?? null;
}

export async function createAdminUserWithAuth(input: {
  displayName: string;
  email: string;
  password: string;
  phone?: string | null;
  principalType: AdminPrincipal['principal_type'];
  eventId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ authUserId: string; principal: AdminPrincipal }> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error('No active admin session.');

  const response = await fetch('/api/admin-create-user', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || 'Could not create admin user.');
  }
  return body as { authUserId: string; principal: AdminPrincipal };
}

export async function completeOwnAdminProfile(input: {
  firstName: string;
  lastName: string;
  phone?: string | null;
}): Promise<AdminPrincipal> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error('No active admin session.');

  const response = await fetch('/api/admin-complete-profile', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || 'Could not complete admin profile.');
  }
  return body.principal as AdminPrincipal;
}
