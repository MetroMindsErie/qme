import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFrom = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import {
  buildEventbriteRegistrationInsertRows,
  importEventbriteRegistrationsForEvent,
  parseEventbriteRegistrationsCsv,
  previewEventbriteRegistrationsForEvent,
} from '../lib/eventbriteRegistrationImport';

const csv = [
  'Order ID,Tickets,First Name,Last Name,Email,Ticket Type',
  '1001,1,Paul,One,paul@example.com,General Admission',
  '1002,2,Paula,Two,paula@example.com,General Admission',
  '1004,4,Pat,Four,pat@example.com,General Admission',
].join('\n');

const untouchedUarfEventbriteCsv = [
  'Order Date,Last Name,Registration Answers,Email Address,Tickets,Company,Order ID,First Name,Attendee Status,Ticket Class',
  '2026-08-31,One,"How did you hear?,Partner",paul@example.com,1,UARF,1001,Paul,Attending,General Admission',
  '2026-09-01,Four,,pat@example.com,4,Vettor,1004,Pat,Attending,General Admission',
].join('\n');

function thenableQuery(result: { data?: unknown; error?: unknown }) {
  const query: Record<string, unknown> = {};
  const proxy = new Proxy(query, {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (value: unknown) => void) => resolve({
          data: result.data ?? null,
          error: result.error ?? null,
        });
      }
      return vi.fn(() => proxy);
    },
  });
  return proxy;
}

describe('Eventbrite registration import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses actual Eventbrite headers and maps Tickets 1, 2, and 4 to one registration each', () => {
    const parsed = parseEventbriteRegistrationsCsv(csv);

    expect(parsed.headerMapping).toMatchObject({
      orderId: 'Order ID',
      tickets: 'Tickets',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
    });
    expect(parsed.rows).toEqual([
      expect.objectContaining({ orderId: '1001', firstName: 'Paul', ticketCount: 1 }),
      expect.objectContaining({ orderId: '1002', firstName: 'Paula', ticketCount: 2 }),
      expect.objectContaining({ orderId: '1004', firstName: 'Pat', ticketCount: 4 }),
    ]);
    expect(parsed.rows).toHaveLength(3);
    expect(parsed.invalidRows).toHaveLength(0);
  });

  it('recognizes the untouched UARF/Eventbrite export shape with extra columns in any order', () => {
    const parsed = parseEventbriteRegistrationsCsv(untouchedUarfEventbriteCsv);

    expect(parsed.headerMapping).toMatchObject({
      orderId: 'Order ID',
      tickets: 'Tickets',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email Address',
      ticketType: 'Ticket Class',
    });
    expect(parsed.rows).toEqual([
      expect.objectContaining({
        orderId: '1001',
        firstName: 'Paul',
        lastName: 'One',
        normalizedEmail: 'paul@example.com',
        ticketCount: 1,
        ticketType: 'General Admission',
        sourceMetadata: expect.objectContaining({
          'Order Date': '2026-08-31',
          'Registration Answers': 'How did you hear?,Partner',
          Company: 'UARF',
          party_size: 1,
        }),
      }),
      expect.objectContaining({
        orderId: '1004',
        firstName: 'Pat',
        lastName: 'Four',
        normalizedEmail: 'pat@example.com',
        ticketCount: 4,
        sourceMetadata: expect.objectContaining({ additional_guests: 3 }),
      }),
    ]);
    expect(parsed.invalidRows).toHaveLength(0);
  });

  it('normalizes Tickets to a minimum party size of 1 and rejects non-numeric quantities', () => {
    const parsed = parseEventbriteRegistrationsCsv([
      'Order ID,Tickets,First Name,Last Name,Email',
      '1000,0,Zero,Guest,zero@example.com',
      '100x,nope,Bad,Guest,bad@example.com',
    ].join('\n'));

    expect(parsed.rows[0]).toMatchObject({ orderId: '1000', ticketCount: 1 });
    expect(parsed.invalidRows).toEqual([
      expect.objectContaining({ orderId: '100x', reason: 'invalid_tickets' }),
    ]);
  });

  it('preserves Order ID and party size without creating companion records', () => {
    const parsed = parseEventbriteRegistrationsCsv(csv);
    const rows = buildEventbriteRegistrationInsertRows('event-1', 'batch-1', parsed.rows);

    expect(rows).toHaveLength(3);
    expect(rows[1]).toMatchObject({
      external_order_id: '1002',
      external_attendee_id: '1002',
      party_size: 2,
      source_metadata: expect.objectContaining({
        order_id: '1002',
        tickets: 2,
        party_size: 2,
        additional_guests: 1,
      }),
    });
    expect(rows[2]).toMatchObject({
      external_order_id: '1004',
      party_size: 4,
      source_metadata: expect.objectContaining({ additional_guests: 3 }),
    });
  });

  it('skips already-imported Order IDs and adds only new registrations from a later file', async () => {
    const calls: string[] = [];
    mockFrom.mockImplementation((table: string) => {
      calls.push(table);
      if (table === 'event_imported_registrations' && calls.filter((name) => name === table).length === 1) {
        return thenableQuery({ data: [{ external_order_id: '1001' }, { external_order_id: '1002' }] });
      }
      if (table === 'event_import_batches') {
        const proxy: Record<string, unknown> = {};
        proxy.insert = vi.fn(() => proxy);
        proxy.select = vi.fn(() => proxy);
        proxy.single = vi.fn(() => Promise.resolve({ data: { id: 'batch-1' }, error: null }));
        return proxy;
      }
      if (table === 'event_imported_registrations') {
        const proxy: Record<string, unknown> = {};
        proxy.insert = vi.fn((rows) => {
          expect(rows).toHaveLength(1);
          expect(rows[0]).toMatchObject({ external_order_id: '1004', party_size: 4 });
          return Promise.resolve({ error: null });
        });
        return proxy;
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await importEventbriteRegistrationsForEvent({
      eventId: 'event-1',
      sourceFileName: 'ipitch-eventbrite.csv',
      csvText: csv,
    });

    expect(result).toMatchObject({
      processedCount: 3,
      insertedCount: 1,
      skippedExistingCount: 2,
      skippedExistingOrderIds: ['1001', '1002'],
    });
    expect(calls).not.toContain('event_check_ins');
  });

  it('previews recognized concepts and counts without committing rows', async () => {
    const calls: string[] = [];
    mockFrom.mockImplementation((table: string) => {
      calls.push(table);
      if (table === 'event_imported_registrations') {
        return thenableQuery({ data: [{ external_order_id: '1001' }] });
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const preview = await previewEventbriteRegistrationsForEvent({
      eventId: 'event-1',
      csvText: untouchedUarfEventbriteCsv,
    });

    expect(preview.recognized).toMatchObject({
      firstName: true,
      lastName: true,
      email: true,
      orderId: true,
      tickets: true,
      ticketType: true,
    });
    expect(preview).toMatchObject({
      rowCount: 2,
      totalGuestsRepresented: 5,
      newRegistrationCount: 1,
      skippedExistingCount: 1,
      skippedExistingOrderIds: ['1001'],
    });
    expect(calls).toEqual(['event_imported_registrations']);
  });

  it('blocks import with actionable validation when required concepts are missing', () => {
    expect(() => parseEventbriteRegistrationsCsv([
      'Tickets,First Name,Last Name,Email Address',
      '1,Paul,One,paul@example.com',
    ].join('\n'))).toThrow('Eventbrite CSV is missing required column: Order ID');
  });
});
