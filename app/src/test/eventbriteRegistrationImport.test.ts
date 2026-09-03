import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';

const mockFrom = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import {
  EVENTBRITE_IMPORT_ACCEPT,
  buildEventbriteRegistrationInsertRows,
  importEventbriteRegistrationsForEvent,
  parseEventbriteRegistrationsCsv,
  parseEventbriteRegistrationsRows,
  parseEventbriteRegistrationsWorkbookData,
  previewEventbriteRegistrationsForEvent,
} from '../lib/eventbriteRegistrationImport';

const eventbriteRows = [
  ['Order ID', 'Tickets', 'First Name', 'Last Name', 'Email', 'Ticket Type'],
  ['1001', '1', 'Paul', 'One', 'paul@example.com', 'General Admission'],
  ['1002', '2', 'Paula', 'Two', 'paula@example.com', 'General Admission'],
  ['1004', '4', 'Pat', 'Four', 'pat@example.com', 'General Admission'],
];

const csv = eventbriteRows.map((row) => row.join(',')).join('\n');

const untouchedUarfEventbriteRows = [
  ['Order Date', 'Last Name', 'Registration Answers', 'Email Address', 'Tickets', 'Company', 'Order ID', 'First Name', 'Attendee Status', 'Ticket Class'],
  ['2026-08-31', 'One', 'How did you hear?,Partner', 'paul@example.com', '1', 'UARF', '1001', 'Paul', 'Attending', 'General Admission'],
  ['2026-09-01', 'Four', '', 'pat@example.com', '4', 'Vettor', '1004', 'Pat', 'Attending', 'General Admission'],
];

const newEventbriteRows = [
  ['Order ID', 'Attendee first name', 'Attendee last name', 'Attendee email', 'Ticket quantity', 'Ticket Class'],
  ['1001', 'Paul', 'One', 'paul@example.com', '1', 'General Admission'],
  ['1004', 'Pat', 'Four', 'pat@example.com', '4', 'General Admission'],
];

const ticketRowEventbriteRows = [
  ['Order ID', 'Attendee first name', 'Attendee last name', 'Attendee email', 'Ticket quantity', 'Ticket Class'],
  ['15545403573', 'Mourad', 'Krifa', 'mourad.krifa@gmail.com', '1', 'General Admission'],
  ['15545403573', 'Mourad', 'Krifa', 'mourad.krifa@gmail.com', '1', 'General Admission'],
  ['15545403573', 'Mourad', 'Krifa', 'mourad.krifa@gmail.com', '1', 'General Admission'],
  ['15563970373', 'Terica', 'Lacey', 'terica@example.com', '1', 'General Admission'],
  ['15563970373', 'Terica', 'Lacey', 'terica@example.com', '1', 'General Admission'],
  ['15563970373', 'Terica', 'Lacey', 'terica@example.com', '1', 'General Admission'],
  ['15563970373', 'Terica', 'Lacey', 'terica@example.com', '1', 'General Admission'],
];

function triciaStyleRowsWithTotalsFooter() {
  const headers = ['Order ID', 'Attendee first name', 'Attendee last name', 'Attendee email', 'Ticket quantity', 'Ticket Class'];
  const rows: string[][] = [headers];
  for (let orderIndex = 1; orderIndex <= 43; orderIndex += 1) {
    rows.push([
      `155000000${String(orderIndex).padStart(2, '0')}`,
      `Guest${orderIndex}`,
      'Single',
      `guest${orderIndex}@example.com`,
      '1',
      'General Admission',
    ]);
  }
  for (let orderIndex = 1; orderIndex <= 12; orderIndex += 1) {
    rows.push([
      `155100000${String(orderIndex).padStart(2, '0')}`,
      `Group${orderIndex}`,
      'Pair',
      `group${orderIndex}@example.com`,
      '1',
      'General Admission',
    ]);
    rows.push([
      `155100000${String(orderIndex).padStart(2, '0')}`,
      `Group${orderIndex}`,
      'Pair',
      `group${orderIndex}@example.com`,
      '1',
      'General Admission',
    ]);
  }
  rows.push(...ticketRowEventbriteRows.slice(1));
  rows.push(['TOTALS', '', '', '', '74', '']);
  return rows;
}

function triciaStyleSkippedOrderIds() {
  return [
    ...Array.from({ length: 43 }, (_value, index) => `155000000${String(index + 1).padStart(2, '0')}`),
    ...Array.from({ length: 6 }, (_value, index) => `155100000${String(index + 1).padStart(2, '0')}`),
  ];
}

const untouchedUarfEventbriteCsvWithExtraColumns = [
  'Order Date,Last Name,Registration Answers,Email Address,Tickets,Company,Order ID,First Name,Attendee Status,Ticket Class',
  '2026-08-31,One,"How did you hear?,Partner",paul@example.com,1,UARF,1001,Paul,Attending,General Admission',
  '2026-09-01,Four,,pat@example.com,4,Vettor,1004,Pat,Attending,General Admission',
].join('\n');

const newEventbriteCsv = newEventbriteRows.map((row) => row.join(',')).join('\n');

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

function workbookData(rows: string[][], bookType: 'xls' | 'xlsx', extraSheets: string[][][] = []) {
  const workbook = XLSX.utils.book_new();
  extraSheets.forEach((sheetRows, index) => {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheetRows), `Sheet${index + 1}`);
  });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Attendees');
  return XLSX.write(workbook, { bookType, type: 'array' }) as ArrayBuffer;
}

function normalizedFieldsFromRows(rows: ReturnType<typeof parseEventbriteRegistrationsCsv>['rows']) {
  return rows.map((row) => ({
    orderId: row.orderId,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    ticketCount: row.ticketCount,
    ticketType: row.ticketType,
  }));
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
    expect(parsed).toMatchObject({
      rowCount: 3,
      sourceRowCount: 3,
      canonicalRegistrationCount: 3,
    });
    expect(parsed.invalidRows).toHaveLength(0);
  });

  it('recognizes the untouched UARF/Eventbrite export shape with extra columns in any order', () => {
    const parsed = parseEventbriteRegistrationsCsv(untouchedUarfEventbriteCsvWithExtraColumns);

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

  it('recognizes the new Eventbrite attendee header vocabulary as the same canonical fields', () => {
    const parsed = parseEventbriteRegistrationsCsv(newEventbriteCsv);

    expect(parsed.headerMapping).toMatchObject({
      orderId: 'Order ID',
      tickets: 'Ticket quantity',
      firstName: 'Attendee first name',
      lastName: 'Attendee last name',
      email: 'Attendee email',
      ticketType: 'Ticket Class',
    });
    expect(normalizedFieldsFromRows(parsed.rows)).toEqual([
      {
        orderId: '1001',
        firstName: 'Paul',
        lastName: 'One',
        email: 'paul@example.com',
        ticketCount: 1,
        ticketType: 'General Admission',
      },
      {
        orderId: '1004',
        firstName: 'Pat',
        lastName: 'Four',
        email: 'pat@example.com',
        ticketCount: 4,
        ticketType: 'General Admission',
      },
    ]);
    expect(parsed.rows[1].sourceMetadata).toMatchObject({
      order_id: '1004',
      tickets: 4,
      party_size: 4,
      additional_guests: 3,
      'Ticket quantity': '4',
    });
    expect(parsed.invalidRows).toHaveLength(0);
  });

  it('normalizes old and new Eventbrite header vocabularies to equivalent key fields', () => {
    const oldParsed = parseEventbriteRegistrationsCsv(untouchedUarfEventbriteCsvWithExtraColumns);
    const newParsed = parseEventbriteRegistrationsCsv(newEventbriteCsv);

    expect(normalizedFieldsFromRows(newParsed.rows)).toEqual(normalizedFieldsFromRows(oldParsed.rows));
  });

  it('matches supported Eventbrite aliases despite harmless case and whitespace changes', () => {
    const parsed = parseEventbriteRegistrationsCsv([
      ' order id , attendee FIRST   name , Attendee LAST name , attendee EMAIL , ticket QUANTITY ',
      ' Exact-001 , Avery , Alias , alias@example.com , 2 ',
    ].join('\n'));

    expect(parsed.headerMapping).toMatchObject({
      orderId: 'order id',
      tickets: 'ticket QUANTITY',
      firstName: 'attendee FIRST   name',
      lastName: 'Attendee LAST name',
      email: 'attendee EMAIL',
    });
    expect(parsed.rows[0]).toMatchObject({
      orderId: 'Exact-001',
      firstName: 'Avery',
      lastName: 'Alias',
      normalizedEmail: 'alias@example.com',
      ticketCount: 2,
    });
  });

  it('normalizes equivalent Eventbrite CSV, XLS, and XLSX exports to the same import fields', () => {
    const csvParsed = parseEventbriteRegistrationsCsv(untouchedUarfEventbriteCsvWithExtraColumns);
    const xlsData = parseEventbriteRegistrationsWorkbookData(workbookData(untouchedUarfEventbriteRows, 'xls'), 'ipitch-eventbrite.xls');
    const xlsxData = parseEventbriteRegistrationsWorkbookData(workbookData(untouchedUarfEventbriteRows, 'xlsx'), 'ipitch-eventbrite.xlsx');
    const xlsParsed = parseEventbriteRegistrationsRows(xlsData.rows);
    const xlsxParsed = parseEventbriteRegistrationsRows(xlsxData.rows);

    expect(normalizedFieldsFromRows(xlsParsed.rows)).toEqual(normalizedFieldsFromRows(csvParsed.rows));
    expect(normalizedFieldsFromRows(xlsxParsed.rows)).toEqual(normalizedFieldsFromRows(csvParsed.rows));
    expect(xlsData).toMatchObject({ format: 'xls', worksheetName: 'Attendees' });
    expect(xlsxData).toMatchObject({ format: 'xlsx', worksheetName: 'Attendees' });
  });

  it('chooses the worksheet containing the Eventbrite attendee table', () => {
    const data = parseEventbriteRegistrationsWorkbookData(
      workbookData(untouchedUarfEventbriteRows, 'xlsx', [[['Report generated'], ['Not attendee data']]]),
      'multi-sheet-eventbrite.xlsx'
    );

    expect(data.worksheetName).toBe('Attendees');
    expect(parseEventbriteRegistrationsRows(data.rows).rows).toHaveLength(2);
  });

  it('chooses a workbook worksheet using the new alias-aware Eventbrite vocabulary', () => {
    const data = parseEventbriteRegistrationsWorkbookData(
      workbookData(newEventbriteRows, 'xlsx', [[['Report generated'], ['Not attendee data']]]),
      'new-eventbrite-export.xlsx'
    );

    expect(data.worksheetName).toBe('Attendees');
    expect(parseEventbriteRegistrationsRows(data.rows).headerMapping).toMatchObject({
      orderId: 'Order ID',
      tickets: 'Ticket quantity',
      firstName: 'Attendee first name',
      lastName: 'Attendee last name',
      email: 'Attendee email',
    });
  });

  it('consolidates three compatible ticket rows for Mourad into one canonical order with party size 3', () => {
    const parsed = parseEventbriteRegistrationsRows([
      ticketRowEventbriteRows[0],
      ticketRowEventbriteRows[1],
      ticketRowEventbriteRows[2],
      ticketRowEventbriteRows[3],
    ]);

    expect(parsed).toMatchObject({
      rowCount: 3,
      sourceRowCount: 3,
      canonicalRegistrationCount: 1,
    });
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.invalidRows).toHaveLength(0);
    expect(parsed.rows[0]).toMatchObject({
      sourceRowNumber: 2,
      sourceRowNumbers: [2, 3, 4],
      sourceRowCount: 3,
      orderId: '15545403573',
      firstName: 'Mourad',
      lastName: 'Krifa',
      normalizedEmail: 'mourad.krifa@gmail.com',
      ticketCount: 3,
      sourceMetadata: expect.objectContaining({
        order_id: '15545403573',
        tickets: 3,
        party_size: 3,
        additional_guests: 2,
        source_row_count: 3,
        source_row_numbers: '2,3,4',
        source_export_shape: 'ticket_rows_consolidated',
        summed_ticket_quantity: 3,
      }),
    });
  });

  it('consolidates mixed compatible quantities for the same Order ID into one party size', () => {
    const parsed = parseEventbriteRegistrationsCsv([
      'Order ID,Attendee first name,Attendee last name,Attendee email,Ticket quantity',
      'SUM-3,Sam,Sum,sam@example.com,2',
      'SUM-3,Sam,Sum,sam@example.com,1',
    ].join('\n'));

    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]).toMatchObject({
      orderId: 'SUM-3',
      ticketCount: 3,
      sourceRowNumbers: [2, 3],
      sourceRowCount: 2,
    });
    expect(parsed.invalidRows).toHaveLength(0);
  });

  it('consolidates Terica-style four repeated ticket rows into party size 4', () => {
    const parsed = parseEventbriteRegistrationsRows(ticketRowEventbriteRows);

    expect(parsed.rows).toEqual([
      expect.objectContaining({ orderId: '15545403573', ticketCount: 3 }),
      expect.objectContaining({ orderId: '15563970373', firstName: 'Terica', ticketCount: 4 }),
    ]);
    expect(parsed.invalidRows).toHaveLength(0);
  });

  it('does not emit duplicate_order_id_in_file for compatible repeated ticket rows', () => {
    const parsed = parseEventbriteRegistrationsRows(ticketRowEventbriteRows);

    expect(parsed.invalidRows.map((row) => row.reason)).not.toContain('duplicate_order_id_in_file');
  });

  it('flags a repeated Order ID group invalid when first names conflict', () => {
    const parsed = parseEventbriteRegistrationsCsv([
      'Order ID,Attendee first name,Attendee last name,Attendee email,Ticket quantity',
      'CONFLICT-1,Alex,Guest,alex@example.com,1',
      'CONFLICT-1,Avery,Guest,alex@example.com,1',
    ].join('\n'));

    expect(parsed.rows).toHaveLength(0);
    expect(parsed.invalidRows).toEqual([
      expect.objectContaining({
        orderId: 'CONFLICT-1',
        sourceRowNumbers: [2, 3],
        reason: 'conflicting_order_rows',
      }),
    ]);
  });

  it('flags a repeated Order ID group invalid when last names conflict', () => {
    const parsed = parseEventbriteRegistrationsCsv([
      'Order ID,Attendee first name,Attendee last name,Attendee email,Ticket quantity',
      'CONFLICT-2,Alex,Guest,alex@example.com,1',
      'CONFLICT-2,Alex,Other,alex@example.com,1',
    ].join('\n'));

    expect(parsed.rows).toHaveLength(0);
    expect(parsed.invalidRows[0]).toMatchObject({
      orderId: 'CONFLICT-2',
      reason: 'conflicting_order_rows',
    });
  });

  it('flags a repeated Order ID group invalid when emails conflict', () => {
    const parsed = parseEventbriteRegistrationsCsv([
      'Order ID,Attendee first name,Attendee last name,Attendee email,Ticket quantity',
      'CONFLICT-3,Alex,Guest,alex@example.com,1',
      'CONFLICT-3,Alex,Guest,other@example.com,1',
    ].join('\n'));

    expect(parsed.rows).toHaveLength(0);
    expect(parsed.invalidRows[0]).toMatchObject({
      orderId: 'CONFLICT-3',
      reason: 'conflicting_order_rows',
    });
  });

  it('does not falsely conflict on harmless primary identity case and whitespace differences', () => {
    const parsed = parseEventbriteRegistrationsCsv([
      'Order ID,Attendee first name,Attendee last name,Attendee email,Ticket quantity',
      'CASE-1, Alex , Guest , Alex@Example.com ,1',
      'CASE-1,alex,guest,alex@example.com,1',
    ].join('\n'));

    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]).toMatchObject({
      orderId: 'CASE-1',
      firstName: 'Alex',
      lastName: 'Guest',
      email: 'Alex@Example.com',
      normalizedEmail: 'alex@example.com',
      ticketCount: 2,
    });
    expect(parsed.invalidRows).toHaveLength(0);
  });

  it('ignores an exact TOTALS footer in the Order ID position before validation', () => {
    const parsed = parseEventbriteRegistrationsRows([
      ticketRowEventbriteRows[0],
      ticketRowEventbriteRows[1],
      ['TOTALS', '', '', '', '3', ''],
    ]);

    expect(parsed).toMatchObject({
      rowCount: 2,
      sourceRowCount: 1,
      ignoredFooterRowCount: 1,
      canonicalRegistrationCount: 1,
    });
    expect(parsed.rows).toEqual([
      expect.objectContaining({ orderId: '15545403573', ticketCount: 1 }),
    ]);
    expect(parsed.invalidRows).toHaveLength(0);
  });

  it('ignores TOTALS footer case and whitespace variants in the identifying position', () => {
    const parsed = parseEventbriteRegistrationsCsv([
      'Order ID,Attendee first name,Attendee last name,Attendee email,Ticket quantity',
      'CASE-TOTALS,Case,Footer,case@example.com,1',
      '  totals  ,,,,1',
    ].join('\n'));

    expect(parsed).toMatchObject({
      rowCount: 2,
      sourceRowCount: 1,
      ignoredFooterRowCount: 1,
      canonicalRegistrationCount: 1,
    });
    expect(parsed.invalidRows).toHaveLength(0);
  });

  it('ignores a TOTALS footer when it is the first populated cell and identity fields are empty', () => {
    const parsed = parseEventbriteRegistrationsCsv([
      'Order Date,Order ID,Attendee first name,Attendee last name,Attendee email,Ticket quantity',
      '2026-09-03,FIRST-CELL,First,Cell,first@example.com,1',
      'TOTALS,,,,,1',
    ].join('\n'));

    expect(parsed).toMatchObject({
      sourceRowCount: 1,
      ignoredFooterRowCount: 1,
      canonicalRegistrationCount: 1,
    });
    expect(parsed.invalidRows).toHaveLength(0);
  });

  it('does not let a TOTALS footer increment invalid orders, canonical orders, or guests represented', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'event_imported_registrations') return thenableQuery({ data: [] });
      throw new Error(`Unexpected table ${table}`);
    });

    const preview = await previewEventbriteRegistrationsForEvent({
      eventId: 'event-1',
      fileData: {
        sourceFileName: 'ticket-row-eventbrite.xlsx',
        format: 'xlsx',
        rows: [
          ticketRowEventbriteRows[0],
          ticketRowEventbriteRows[1],
          ['TOTALS', '', '', '', '99', ''],
        ],
        worksheetName: 'Attendees',
      },
    });

    expect(preview).toMatchObject({
      rowCount: 2,
      sourceRowCount: 1,
      ignoredFooterRowCount: 1,
      canonicalRegistrationCount: 1,
      totalGuestsRepresented: 1,
      newRegistrationCount: 1,
      skippedExistingCount: 0,
    });
    expect(preview.invalidRows).toHaveLength(0);
  });

  it('keeps normal malformed rows invalid instead of broadly skipping them', () => {
    const parsed = parseEventbriteRegistrationsCsv([
      'Order ID,Attendee first name,Attendee last name,Attendee email,Ticket quantity',
      'BAD-MISSING,,Guest,bad@example.com,1',
    ].join('\n'));

    expect(parsed).toMatchObject({
      sourceRowCount: 1,
      ignoredFooterRowCount: 0,
      canonicalRegistrationCount: 1,
    });
    expect(parsed.invalidRows).toEqual([
      expect.objectContaining({ orderId: 'BAD-MISSING', reason: 'missing_required_field' }),
    ]);
  });

  it('does not skip a legitimate order when another cell contains TOTALS', () => {
    const parsed = parseEventbriteRegistrationsCsv([
      'Order ID,Attendee first name,Attendee last name,Attendee email,Ticket quantity,Company',
      'REAL-TOTALS,Real,Guest,real@example.com,1,TOTALS',
    ].join('\n'));

    expect(parsed).toMatchObject({
      sourceRowCount: 1,
      ignoredFooterRowCount: 0,
      canonicalRegistrationCount: 1,
    });
    expect(parsed.rows[0]).toMatchObject({ orderId: 'REAL-TOTALS', ticketCount: 1 });
    expect(parsed.invalidRows).toHaveLength(0);
  });

  it('projects the Tricia-style workbook as 74 source rows, 57 orders, 74 guests, and no invalid orders', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'event_imported_registrations') {
        return thenableQuery({
          data: triciaStyleSkippedOrderIds().map((external_order_id) => ({ external_order_id })),
        });
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const preview = await previewEventbriteRegistrationsForEvent({
      eventId: 'event-1',
      fileData: {
        sourceFileName: 'tricia-eventbrite.xlsx',
        format: 'xlsx',
        rows: triciaStyleRowsWithTotalsFooter(),
        worksheetName: 'Attendees',
      },
    });

    expect(preview).toMatchObject({
      rowCount: 75,
      sourceRowCount: 74,
      ignoredFooterRowCount: 1,
      canonicalRegistrationCount: 57,
      totalGuestsRepresented: 74,
      newRegistrationCount: 8,
      skippedExistingCount: 49,
      skippedExistingOrderIds: triciaStyleSkippedOrderIds(),
    });
    expect(preview.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ orderId: '15545403573', firstName: 'Mourad', ticketCount: 3 }),
      expect.objectContaining({ orderId: '15563970373', firstName: 'Terica', ticketCount: 4 }),
    ]));
    expect(preview.invalidRows).toHaveLength(0);
  });

  it('preserves string Order IDs exactly from Excel workbooks', () => {
    const rows = [
      ['Order ID', 'Tickets', 'First Name', 'Last Name', 'Email'],
      ['00123456789012345678', '2', 'Exact', 'Order', 'exact@example.com'],
    ];
    const data = parseEventbriteRegistrationsWorkbookData(workbookData(rows, 'xls'), 'exact-orders.xls');
    const parsed = parseEventbriteRegistrationsRows(data.rows);

    expect(parsed.rows[0]).toMatchObject({
      orderId: '00123456789012345678',
      ticketCount: 2,
    });
  });

  it('rejects non-positive and non-numeric ticket quantities', () => {
    const parsed = parseEventbriteRegistrationsCsv([
      'Order ID,Tickets,First Name,Last Name,Email',
      '1000,0,Zero,Guest,zero@example.com',
      '100x,nope,Bad,Guest,bad@example.com',
    ].join('\n'));

    expect(parsed.invalidRows).toEqual([
      expect.objectContaining({ orderId: '1000', reason: 'invalid_tickets' }),
      expect.objectContaining({ orderId: '100x', reason: 'invalid_tickets' }),
    ]);
  });

  it('invalidates a grouped order when any ticket quantity is invalid', () => {
    const parsed = parseEventbriteRegistrationsCsv([
      'Order ID,Attendee first name,Attendee last name,Attendee email,Ticket quantity',
      'BAD-GROUP,Quantity,Guest,quantity@example.com,1',
      'BAD-GROUP,Quantity,Guest,quantity@example.com,nope',
    ].join('\n'));

    expect(parsed.rows).toHaveLength(0);
    expect(parsed.invalidRows).toEqual([
      expect.objectContaining({
        orderId: 'BAD-GROUP',
        sourceRowNumbers: [2, 3],
        sourceRowNumber: 3,
        reason: 'invalid_tickets',
      }),
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

  it('skips already-imported exact Order IDs from the new Eventbrite vocabulary', async () => {
    const calls: string[] = [];
    mockFrom.mockImplementation((table: string) => {
      calls.push(table);
      if (table === 'event_imported_registrations' && calls.filter((name) => name === table).length === 1) {
        return thenableQuery({ data: [{ external_order_id: '1001' }] });
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
      sourceFileName: 'new-eventbrite-export.xlsx',
      fileData: {
        sourceFileName: 'new-eventbrite-export.xlsx',
        format: 'xlsx',
        rows: newEventbriteRows,
        worksheetName: 'Attendees',
      },
    });

    expect(result).toMatchObject({
      processedCount: 2,
      insertedCount: 1,
      skippedExistingCount: 1,
      skippedExistingOrderIds: ['1001'],
    });
    expect(calls).not.toContain('event_check_ins');
  });

  it('skips an existing repeated-row Order ID once after canonical consolidation', async () => {
    const calls: string[] = [];
    mockFrom.mockImplementation((table: string) => {
      calls.push(table);
      if (table === 'event_imported_registrations') {
        return thenableQuery({ data: [{ external_order_id: '15545403573' }] });
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const preview = await previewEventbriteRegistrationsForEvent({
      eventId: 'event-1',
      fileData: {
        sourceFileName: 'ticket-row-eventbrite.xlsx',
        format: 'xlsx',
        rows: [
          ticketRowEventbriteRows[0],
          ticketRowEventbriteRows[1],
          ticketRowEventbriteRows[2],
          ticketRowEventbriteRows[3],
        ],
        worksheetName: 'Attendees',
      },
    });

    expect(preview).toMatchObject({
      rowCount: 3,
      sourceRowCount: 3,
      canonicalRegistrationCount: 1,
      totalGuestsRepresented: 3,
      newRegistrationCount: 0,
      skippedExistingCount: 1,
      skippedExistingOrderIds: ['15545403573'],
    });
  });

  it('imports a new repeated-row Order ID once with summed registered party size', async () => {
    const calls: string[] = [];
    mockFrom.mockImplementation((table: string) => {
      calls.push(table);
      if (table === 'event_imported_registrations' && calls.filter((name) => name === table).length === 1) {
        return thenableQuery({ data: [] });
      }
      if (table === 'event_import_batches') {
        const proxy: Record<string, unknown> = {};
        proxy.insert = vi.fn((batch) => {
          expect(batch).toMatchObject({
            row_count: 3,
            imported_count: 1,
            report: expect.objectContaining({
              source_row_count: 3,
              canonical_registration_count: 1,
            }),
          });
          return proxy;
        });
        proxy.select = vi.fn(() => proxy);
        proxy.single = vi.fn(() => Promise.resolve({ data: { id: 'batch-1' }, error: null }));
        return proxy;
      }
      if (table === 'event_imported_registrations') {
        const proxy: Record<string, unknown> = {};
        proxy.insert = vi.fn((rows) => {
          expect(rows).toHaveLength(1);
          expect(rows[0]).toMatchObject({
            external_order_id: '15545403573',
            external_attendee_id: '15545403573',
            party_size: 3,
            source_row_number: 2,
            source_metadata: expect.objectContaining({
              tickets: 3,
              source_row_count: 3,
              source_export_shape: 'ticket_rows_consolidated',
              summed_ticket_quantity: 3,
            }),
          });
          return Promise.resolve({ error: null });
        });
        return proxy;
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await importEventbriteRegistrationsForEvent({
      eventId: 'event-1',
      sourceFileName: 'ticket-row-eventbrite.xlsx',
      fileData: {
        sourceFileName: 'ticket-row-eventbrite.xlsx',
        format: 'xlsx',
        rows: [
          ticketRowEventbriteRows[0],
          ticketRowEventbriteRows[1],
          ticketRowEventbriteRows[2],
          ticketRowEventbriteRows[3],
        ],
        worksheetName: 'Attendees',
      },
    });

    expect(result).toMatchObject({
      processedCount: 1,
      insertedCount: 1,
      skippedExistingCount: 0,
      sourceRowCount: 3,
      canonicalRegistrationCount: 1,
    });
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
      csvText: untouchedUarfEventbriteCsvWithExtraColumns,
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
      sourceRowCount: 2,
      canonicalRegistrationCount: 2,
      totalGuestsRepresented: 5,
      newRegistrationCount: 1,
      skippedExistingCount: 1,
      skippedExistingOrderIds: ['1001'],
    });
    expect(calls).toEqual(['event_imported_registrations']);
  });

  it('previews source-row count separately from canonical registrations and total guests', async () => {
    const calls: string[] = [];
    mockFrom.mockImplementation((table: string) => {
      calls.push(table);
      if (table === 'event_imported_registrations') {
        return thenableQuery({ data: [] });
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const preview = await previewEventbriteRegistrationsForEvent({
      eventId: 'event-1',
      fileData: parseEventbriteRegistrationsWorkbookData(
        workbookData(ticketRowEventbriteRows, 'xlsx', [[['Report generated'], ['Not attendee data']]]),
        'ticket-row-eventbrite.xlsx'
      ),
    });

    expect(preview).toMatchObject({
      rowCount: 7,
      sourceRowCount: 7,
      canonicalRegistrationCount: 2,
      totalGuestsRepresented: 7,
      newRegistrationCount: 2,
      skippedExistingCount: 0,
    });
    expect(preview.rows).toEqual([
      expect.objectContaining({ orderId: '15545403573', ticketCount: 3 }),
      expect.objectContaining({ orderId: '15563970373', ticketCount: 4 }),
    ]);
    expect(calls).toEqual(['event_imported_registrations']);
  });

  it('previews XLSX file data with the same counts and duplicate Order ID skips as CSV', async () => {
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
      fileData: parseEventbriteRegistrationsWorkbookData(workbookData(untouchedUarfEventbriteRows, 'xlsx'), 'ipitch-eventbrite.xlsx'),
    });

    expect(preview).toMatchObject({
      rowCount: 2,
      sourceRowCount: 2,
      canonicalRegistrationCount: 2,
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
    ].join('\n'))).toThrow('This file is missing the Eventbrite Order ID column required for safe repeat imports');
  });

  it('blocks reduced files missing both Tickets and Ticket quantity', () => {
    expect(() => parseEventbriteRegistrationsCsv([
      'Order ID,Attendee first name,Attendee last name,Attendee email',
      '1001,Paul,One,paul@example.com',
    ].join('\n'))).toThrow('This file is missing the Eventbrite ticket quantity column (Tickets or Ticket quantity).');
  });

  it('continues rejecting edited files without safe required Eventbrite concepts', () => {
    expect(() => parseEventbriteRegistrationsCsv([
      'First Name,Last Name,Email Address,Company',
      'Paul,One,paul@example.com,UARF',
    ].join('\n'))).toThrow('This file is missing the Eventbrite Order ID column required for safe repeat imports');
  });

  it('rejects corrupt Excel input with a clear error before database writes', async () => {
    const fileData = parseEventbriteRegistrationsWorkbookData(new Uint8Array([1, 2, 3, 4]), 'broken.xls');

    await expect(previewEventbriteRegistrationsForEvent({ eventId: 'event-1', fileData }))
      .rejects.toThrow('This file is missing the Eventbrite Order ID column required for safe repeat imports');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('allows CSV, XLS, and XLSX files in the browser file picker', () => {
    expect(EVENTBRITE_IMPORT_ACCEPT).toContain('.csv');
    expect(EVENTBRITE_IMPORT_ACCEPT).toContain('.xls');
    expect(EVENTBRITE_IMPORT_ACCEPT).toContain('.xlsx');
    expect(EVENTBRITE_IMPORT_ACCEPT).toContain('application/vnd.ms-excel');
  });
});
