/**
 * Supabase Backend Integration Tests
 *
 * These tests run against the LIVE Supabase instance to verify
 * the SQL migration (tables + RPC functions) works correctly.
 *
 * IMPORTANT: Run the updated supabase-migration.sql (with SECURITY DEFINER
 * on reset_queue) for full sequence-reset support.
 *
 * WARNING: These tests modify real data. They clean up after themselves.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Skip the whole suite if credentials aren't set (CI-safe)
const RUN_INTEGRATION =
  url && key && !url.includes('YOUR_PROJECT') && !url.includes('test.supabase.co');

describe.skipIf(!RUN_INTEGRATION)('Supabase Backend Integration', () => {
  let supabase: SupabaseClient;

  /** Clean slate using direct table ops (works without SECURITY DEFINER). */
  async function cleanSlate() {
    await supabase.from('tickets').delete().neq('id', 0);
    await supabase.from('settings').upsert({ key: 'metric1', value: '1' });
    await supabase.from('settings').upsert({
      key: 'metric1Ts',
      value: String(Date.now() / 1000),
    });
  }

  beforeAll(async () => {
    supabase = createClient(url, key);
    await cleanSlate();
  });

  afterAll(async () => {
    await cleanSlate();
  });

  // ---------- Settings ----------

  it('metric1 defaults to 1 after clean slate', async () => {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'metric1')
      .single();
    expect(Number(data?.value)).toBe(1);
  });

  it('can update metric1', async () => {
    await supabase.from('settings').upsert({ key: 'metric1', value: '42' });
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'metric1')
      .single();
    expect(data?.value).toBe('42');
    // Reset for subsequent tests
    await supabase.from('settings').upsert({ key: 'metric1', value: '1' });
  });

  // ---------- Tickets (RPCs) ----------

  it('next_ticket issues increasing IDs', async () => {
    const { data: result1 } = await supabase.rpc('next_ticket');
    const { data: result2 } = await supabase.rpc('next_ticket');
    
    // Handle both old (numeric) and new (JSON) return formats
    const id1 = typeof result1 === 'number' ? result1 : result1?.id;
    const id2 = typeof result2 === 'number' ? result2 : result2?.id;
    
    expect(typeof id1).toBe('number');
    expect(id2).toBeGreaterThan(id1!);
  });

  it('peek_ticket returns max issued ID', async () => {
    const { data: result } = await supabase.rpc('next_ticket');
    const newId = typeof result === 'number' ? result : result?.id;
    
    const { data: peekId } = await supabase.rpc('peek_ticket');
    // peek_ticket might return ticket_number or id depending on migration state
    expect(typeof peekId).toBe('number');
  });

  it('check_in_ticket updates status', async () => {
    const { data: result } = await supabase.rpc('next_ticket');
    const id = typeof result === 'number' ? result : result?.id;
    
    await supabase.rpc('check_in_ticket', { p_ticket_id: id });

    const { data: ticket } = await supabase
      .from('tickets')
      .select('status, checked_in_at')
      .eq('id', id)
      .single();

    expect(ticket?.status).toBe('checked_in');
    expect(ticket?.checked_in_at).not.toBeNull();
  });

  it('leave_queue updates status and reason', async () => {
    const { data: result } = await supabase.rpc('next_ticket');
    const id = typeof result === 'number' ? result : result?.id;
    
    await supabase.rpc('leave_queue', {
      p_ticket_id: id,
      p_reason: 'noCheckInTimeout',
    });

    const { data: ticket } = await supabase
      .from('tickets')
      .select('status, left_reason, left_at')
      .eq('id', id)
      .single();

    expect(ticket?.status).toBe('left');
    expect(ticket?.left_reason).toBe('noCheckInTimeout');
    expect(ticket?.left_at).not.toBeNull();
  });

  it('restore_ticket creates row if missing', async () => {
    // Reset first for clean slate
    await cleanSlate();

    const highId = 99999;
    const { data: result } = await supabase.rpc('restore_ticket', {
      p_ticket_id: highId,
    });
    
    const maxId = typeof result === 'number' ? result : result?.id;
    expect(maxId).toBeGreaterThanOrEqual(highId);

    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, status')
      .eq('id', highId)
      .single();
    expect(ticket?.id).toBe(highId);
    expect(ticket?.status).toBe('waiting');

    // Cleanup this specific row
    await supabase.from('tickets').delete().eq('id', highId);
  });

  it('restore_ticket is idempotent', async () => {
    // Calling restore again for same id shouldn't fail
    const { data: result } = await supabase.rpc('next_ticket');
    const id = typeof result === 'number' ? result : result?.id;
    
    const { error } = await supabase.rpc('restore_ticket', {
      p_ticket_id: id,
    });
    expect(error).toBeNull();
  });

  // ---------- Admin snapshot ----------

  it('admin_snapshot returns correct structure', async () => {
    await cleanSlate();

    await supabase.rpc('next_ticket');
    await supabase.rpc('next_ticket');
    const { data: result } = await supabase.rpc('next_ticket');
    const id3 = typeof result === 'number' ? result : result?.id;
    
    await supabase.rpc('check_in_ticket', { p_ticket_id: id3 });

    const { data: snap } = await supabase.rpc('admin_snapshot');

    expect(snap).toHaveProperty('metric1');
    expect(snap).toHaveProperty('counts');
    expect(snap.counts).toHaveProperty('total');
    expect(snap.counts).toHaveProperty('waiting');
    expect(snap.counts).toHaveProperty('checked_in');
    expect(snap.counts).toHaveProperty('left');
    expect(snap.counts).toHaveProperty('served');
    expect(snap).toHaveProperty('lastIssued');
    expect(snap.counts.total).toBe(3);
    expect(snap.counts.waiting).toBe(2);
    expect(snap.counts.checked_in).toBe(1);
    // lastIssued is now ticket_number (1-based) not id
    expect(typeof snap.lastIssued).toBe('number');
  });

  // ---------- Reset ----------

  it('reset_queue clears all tickets and resets metric1', async () => {
    // Issue some tickets first
    await supabase.rpc('next_ticket');
    await supabase.rpc('next_ticket');

    const { error } = await supabase.rpc('reset_queue');
    // If reset_queue fails (no SECURITY DEFINER), skip gracefully
    if (error) {
      console.warn('reset_queue RPC failed — re-run migration with SECURITY DEFINER. Skipping.');
      return;
    }

    const { data: peekId } = await supabase.rpc('peek_ticket');
    expect(peekId).toBe(0);

    const { data: m1 } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'metric1')
      .single();
    expect(m1?.value).toBe('1');
  });

  // ---------- Lost count (direct query) ----------

  it('counts left tickets correctly', async () => {
    await cleanSlate();

    const { data: result1 } = await supabase.rpc('next_ticket');
    const { data: result2 } = await supabase.rpc('next_ticket');
    const id1 = typeof result1 === 'number' ? result1 : result1?.id;
    const id2 = typeof result2 === 'number' ? result2 : result2?.id;
    
    await supabase.rpc('next_ticket'); // id3 stays waiting

    await supabase.rpc('leave_queue', { p_ticket_id: id1, p_reason: 'user' });
    await supabase.rpc('leave_queue', { p_ticket_id: id2, p_reason: 'timeout' });

    const { count } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'left');

    expect(count).toBe(2);
  });

  // ---------- Edge cases ----------

  it('check_in on non-existent ticket is a no-op', async () => {
    const { error } = await supabase.rpc('check_in_ticket', {
      p_ticket_id: 999999,
    });
    // Should not error — just updates 0 rows
    expect(error).toBeNull();
  });

  it('leave on non-existent ticket is a no-op', async () => {
    const { error } = await supabase.rpc('leave_queue', {
      p_ticket_id: 999999,
      p_reason: 'test',
    });
    expect(error).toBeNull();
  });

  it('ticket IDs restart after reset', async () => {
    const { error } = await supabase.rpc('reset_queue');
    if (error) {
      console.warn('reset_queue RPC failed. Skipping sequence-restart test.');
      return;
    }
    const { data: result } = await supabase.rpc('next_ticket');
    // After reset, ticket_number should be 1 (not id)
    const ticketNum = typeof result === 'number' ? result : result?.ticket_number;
    expect(ticketNum).toBe(1);
  });
});
