import { supabase } from './supabase';
import type {
  CreateOrganizationInput,
  Organization,
  UpdateOrganizationInput,
} from '../types';

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Organization;
}

export async function listOrganizations(opts: { ids?: string[] } = {}): Promise<Organization[]> {
  let query = supabase
    .from('organizations')
    .select('*')
    .order('name', { ascending: true });

  if (opts.ids) {
    if (opts.ids.length === 0) return [];
    query = query.in('id', opts.ids);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Organization[];
}

export async function getOrganization(id: string): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Organization;
}

export async function getOrganizationBySlug(slug: string): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) throw error;
  return data as Organization;
}

export async function updateOrganization(
  id: string,
  input: UpdateOrganizationInput
): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Organization;
}
