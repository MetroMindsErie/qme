import { supabase } from './supabase';
import type { Expie } from '../types';

export type CreateExpieInput = Pick<
  Expie,
  'organization_id' | 'name' | 'slug' | 'description' | 'image_url' | 'type' | 'status'
> & {
  default_queue_behavior?: string;
  default_metadata?: Record<string, unknown>;
};

export type UpdateExpieInput = Partial<Omit<CreateExpieInput, 'organization_id'>>;

export async function listExpiesForOrganization(organizationId: string): Promise<Expie[]> {
  const { data, error } = await supabase
    .from('expies')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Expie[];
}

export async function getExpie(id: string): Promise<Expie> {
  const { data, error } = await supabase
    .from('expies')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Expie;
}

export async function createExpie(input: CreateExpieInput): Promise<Expie> {
  const { data, error } = await supabase
    .from('expies')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Expie;
}

export async function updateExpie(id: string, input: UpdateExpieInput): Promise<Expie> {
  const { data, error } = await supabase
    .from('expies')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Expie;
}
