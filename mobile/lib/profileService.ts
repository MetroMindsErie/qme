import { supabase } from './supabase';

export type UserRole = 'super_admin' | 'org_admin' | 'guest';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  username: string | null;
  avatar_url: string;
  bio: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(userId: string, input: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').update(input).eq('id', userId).select().single();
  if (error) throw error;
  return data as Profile;
}
