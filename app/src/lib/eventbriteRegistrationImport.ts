import { supabase } from './supabase';

export type EventbriteRegistrationRow = {
  sourceRowNumber: number;
  orderId: string;
  firstName: string;
  lastName: string;
  email: string;
  normalizedEmail: string;
  ticketCount: number;
  ticketType: string;
  sourceMetadata: Record<string, string | number>;
};

export type EventbriteRegistrationInvalidRow = {
  sourceRowNumber: number;
  reason: string;
  orderId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  tickets?: string;
};

export type EventbriteRegistrationParseResult = {
  headers: string[];
  headerMapping: {
    orderId: string;
    tickets: string;
    firstName: string;
    lastName: string;
    email: string;
    ticketType: string;
  };
  rows: EventbriteRegistrationRow[];
  invalidRows: EventbriteRegistrationInvalidRow[];
  rowCount: number;
};

export type EventbriteRegistrationImportResult = EventbriteRegistrationParseResult & {
  processedCount: number;
  insertedCount: number;
  skippedExistingCount: number;
  skippedExistingOrderIds: string[];
  importBatchId: string | null;
};

const REQUIRED_COLUMNS = {
  orderId: ['Order ID'],
  tickets: ['Tickets'],
  firstName: ['First Name', 'Attendee First Name', 'Buyer First Name'],
  lastName: ['Last Name', 'Attendee Last Name', 'Buyer Last Name'],
  email: ['Email', 'Attendee Email', 'Buyer Email'],
};

const OPTIONAL_COLUMNS = {
  ticketType: ['Ticket Type', 'Ticket Class', 'Ticket Name'],
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        value += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(value);
      value = '';
    } else if (ch === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else if (ch !== '\r') {
      value += ch;
    }
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeEmail(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function findHeader(headers: string[], candidates: string[], required: boolean): string {
  const found = candidates.find((candidate) => headers.includes(candidate));
  if (found) return found;
  if (required) {
    throw new Error(`Eventbrite CSV is missing required column: ${candidates[0]}`);
  }
  return '';
}

export function normalizeTicketCount(value: unknown): number | null {
  const trimmed = normalizeText(value);
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed.replace(/,/g, ''), 10);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(1, parsed);
}

export function parseEventbriteRegistrationsCsv(csvText: string): EventbriteRegistrationParseResult {
  const parsedRows = parseCsv(csvText.replace(/^\uFEFF/, ''));
  if (parsedRows.length === 0) throw new Error('Eventbrite CSV is empty.');

  const headers = parsedRows[0].map((header) => header.trim());
  const headerMapping = {
    orderId: findHeader(headers, REQUIRED_COLUMNS.orderId, true),
    tickets: findHeader(headers, REQUIRED_COLUMNS.tickets, true),
    firstName: findHeader(headers, REQUIRED_COLUMNS.firstName, true),
    lastName: findHeader(headers, REQUIRED_COLUMNS.lastName, true),
    email: findHeader(headers, REQUIRED_COLUMNS.email, true),
    ticketType: findHeader(headers, OPTIONAL_COLUMNS.ticketType, false),
  };
  const headerIndexes = new Map(headers.map((header, index) => [header, index]));
  const get = (cells: string[], header: string) => {
    const index = headerIndexes.get(header);
    return index === undefined ? '' : normalizeText(cells[index]);
  };

  const rows: EventbriteRegistrationRow[] = [];
  const invalidRows: EventbriteRegistrationInvalidRow[] = [];
  const seenOrderIds = new Set<string>();

  parsedRows.slice(1).forEach((cells, index) => {
    const sourceRowNumber = index + 2;
    const orderId = get(cells, headerMapping.orderId);
    const firstName = get(cells, headerMapping.firstName);
    const lastName = get(cells, headerMapping.lastName);
    const email = get(cells, headerMapping.email);
    const tickets = get(cells, headerMapping.tickets);
    const ticketCount = normalizeTicketCount(tickets);
    const invalidBase = { sourceRowNumber, orderId, firstName, lastName, email, tickets };

    if (!orderId || !firstName || !lastName || !normalizeEmail(email)) {
      invalidRows.push({ ...invalidBase, reason: 'missing_required_field' });
      return;
    }
    if (ticketCount === null) {
      invalidRows.push({ ...invalidBase, reason: 'invalid_tickets' });
      return;
    }
    const normalizedOrderId = orderId.toLowerCase();
    if (seenOrderIds.has(normalizedOrderId)) {
      invalidRows.push({ ...invalidBase, reason: 'duplicate_order_id_in_file' });
      return;
    }
    seenOrderIds.add(normalizedOrderId);

    const ticketType = headerMapping.ticketType ? get(cells, headerMapping.ticketType) : '';
    const sourceMetadata: Record<string, string | number> = {
      order_id: orderId,
      tickets: ticketCount,
      party_size: ticketCount,
      additional_guests: Math.max(0, ticketCount - 1),
    };
    headers.forEach((header, headerIndex) => {
      sourceMetadata[header] = normalizeText(cells[headerIndex]);
    });

    rows.push({
      sourceRowNumber,
      orderId,
      firstName,
      lastName,
      email,
      normalizedEmail: normalizeEmail(email),
      ticketCount,
      ticketType,
      sourceMetadata,
    });
  });

  return {
    headers,
    headerMapping,
    rows,
    invalidRows,
    rowCount: parsedRows.length - 1,
  };
}

export function buildEventbriteRegistrationInsertRows(
  eventId: string,
  importBatchId: string,
  rows: EventbriteRegistrationRow[]
) {
  return rows.map((row) => ({
    event_id: eventId,
    import_batch_id: importBatchId,
    import_source: 'eventbrite',
    external_order_id: row.orderId,
    external_attendee_id: row.orderId,
    first_name: row.firstName,
    last_name: row.lastName,
    normalized_email: row.normalizedEmail,
    email: row.email,
    headshot_entitled: false,
    source_price_tier: null,
    source_ticket_type: row.ticketType || null,
    source_row_number: row.sourceRowNumber,
    source_metadata: row.sourceMetadata,
    party_size: row.ticketCount,
    review_status: 'ready',
  }));
}

export async function importEventbriteRegistrationsForEvent(input: {
  eventId: string;
  csvText: string;
  sourceFileName: string;
}): Promise<EventbriteRegistrationImportResult> {
  const parsed = parseEventbriteRegistrationsCsv(input.csvText);
  const orderIds = parsed.rows.map((row) => row.orderId);
  const existingOrderIds = new Set<string>();

  if (orderIds.length > 0) {
    const { data, error } = await supabase
      .from('event_imported_registrations')
      .select('external_order_id, external_attendee_id')
      .eq('event_id', input.eventId)
      .eq('import_source', 'eventbrite')
      .in('external_order_id', orderIds);
    if (error) throw error;
    (data ?? []).forEach((row) => {
      const record = row as Record<string, unknown>;
      const externalOrderId = normalizeText(record.external_order_id || record.external_attendee_id);
      if (externalOrderId) existingOrderIds.add(externalOrderId.toLowerCase());
    });
  }

  const newRows = parsed.rows.filter((row) => !existingOrderIds.has(row.orderId.toLowerCase()));
  const skippedExistingOrderIds = parsed.rows
    .filter((row) => existingOrderIds.has(row.orderId.toLowerCase()))
    .map((row) => row.orderId);

  let importBatchId: string | null = null;
  if (newRows.length > 0) {
    const report = {
      source_file_name: input.sourceFileName,
      row_count: parsed.rowCount,
      processed_count: parsed.rows.length,
      imported_count: newRows.length,
      skipped_existing_count: skippedExistingOrderIds.length,
      invalid_count: parsed.invalidRows.length,
      invalid_rows: parsed.invalidRows,
      header_mapping: parsed.headerMapping,
    };
    const { data: batch, error: batchError } = await supabase
      .from('event_import_batches')
      .insert({
        event_id: input.eventId,
        import_source: 'eventbrite',
        source_file_name: input.sourceFileName,
        status: 'imported',
        row_count: parsed.rowCount,
        imported_count: newRows.length,
        updated_count: 0,
        flagged_count: parsed.invalidRows.length,
        report,
      })
      .select('id')
      .single();
    if (batchError) throw batchError;
    importBatchId = String((batch as { id: string }).id);

    const { error: insertError } = await supabase
      .from('event_imported_registrations')
      .insert(buildEventbriteRegistrationInsertRows(input.eventId, importBatchId, newRows));
    if (insertError) throw insertError;
  }

  return {
    ...parsed,
    processedCount: parsed.rows.length,
    insertedCount: newRows.length,
    skippedExistingCount: skippedExistingOrderIds.length,
    skippedExistingOrderIds,
    importBatchId,
  };
}
