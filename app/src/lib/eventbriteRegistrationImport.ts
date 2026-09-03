import { supabase } from './supabase';
import * as XLSX from 'xlsx';

export type EventbriteRegistrationRow = {
  sourceRowNumber: number;
  sourceRowNumbers?: number[];
  sourceRowCount?: number;
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
  sourceRowNumbers?: number[];
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
  sourceRowCount: number;
  ignoredFooterRowCount: number;
  canonicalRegistrationCount: number;
};

export type EventbriteRegistrationFileFormat = 'csv' | 'xls' | 'xlsx';

export type EventbriteRegistrationFileData = {
  sourceFileName: string;
  format: EventbriteRegistrationFileFormat;
  rows: string[][];
  worksheetName?: string;
};

export type EventbriteRegistrationImportResult = EventbriteRegistrationParseResult & {
  processedCount: number;
  insertedCount: number;
  skippedExistingCount: number;
  skippedExistingOrderIds: string[];
  importBatchId: string | null;
};

export type EventbriteRegistrationPreviewResult = EventbriteRegistrationParseResult & {
  recognized: {
    firstName: boolean;
    lastName: boolean;
    email: boolean;
    orderId: boolean;
    tickets: boolean;
    ticketType: boolean;
  };
  totalGuestsRepresented: number;
  newRegistrationCount: number;
  skippedExistingCount: number;
  skippedExistingOrderIds: string[];
};

type ParsedSourceRegistrationRow = {
  sourceRowNumber: number;
  orderId: string;
  firstName: string;
  lastName: string;
  email: string;
  normalizedEmail: string;
  tickets: string;
  ticketCount: number | null;
  ticketType: string;
  cells: string[];
};

const REQUIRED_COLUMNS = {
  orderId: {
    aliases: ['Order ID'],
    missingMessage: 'This file is missing the Eventbrite Order ID column required for safe repeat imports. Please use an Eventbrite export that includes Order ID.',
  },
  tickets: {
    aliases: ['Tickets', 'Ticket quantity'],
    missingMessage: 'This file is missing the Eventbrite ticket quantity column (Tickets or Ticket quantity).',
  },
  firstName: {
    aliases: ['First Name', 'Attendee First Name', 'Buyer First Name'],
    missingMessage: 'Eventbrite import file is missing required column: First Name',
  },
  lastName: {
    aliases: ['Last Name', 'Attendee Last Name', 'Buyer Last Name'],
    missingMessage: 'Eventbrite import file is missing required column: Last Name',
  },
  email: {
    aliases: ['Email', 'Email Address', 'Attendee Email', 'Buyer Email'],
    missingMessage: 'Eventbrite import file is missing required column: Email Address',
  },
};

const OPTIONAL_COLUMNS = {
  ticketType: {
    aliases: ['Ticket Type', 'Ticket Class', 'Ticket Name'],
  },
};

export const EVENTBRITE_IMPORT_ACCEPT = [
  '.csv',
  '.xls',
  '.xlsx',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
].join(',');

const MAX_IMPORT_FILE_BYTES = 8 * 1024 * 1024;
const MAX_WORKSHEET_ROWS = 10000;
const MAX_WORKSHEET_COLUMNS = 200;

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

function normalizeHeader(value: unknown): string {
  return normalizeText(value).replace(/\s+/g, ' ').toLowerCase();
}

function normalizeEmail(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function normalizeIdentity(value: unknown): string {
  return normalizeText(value).replace(/\s+/g, ' ').toLowerCase();
}

function findHeader(headers: string[], config: { aliases: string[]; missingMessage?: string }, required: boolean): string {
  const normalizedAliases = new Set(config.aliases.map(normalizeHeader));
  const found = headers.find((header) => normalizedAliases.has(normalizeHeader(header)));
  if (found) return found;
  if (required) {
    throw new Error(config.missingMessage ?? `Eventbrite import file is missing required column: ${config.aliases[0]}`);
  }
  return '';
}

function hasRequiredEventbriteHeaders(headers: string[]): boolean {
  return Object.values(REQUIRED_COLUMNS).every((config) => Boolean(findHeader(headers, config, false)));
}

function isEventbriteTotalsFooterRow(cells: string[], headerMapping: EventbriteRegistrationParseResult['headerMapping'], get: (cells: string[], header: string) => string): boolean {
  if (normalizeIdentity(get(cells, headerMapping.orderId)) === 'totals') return true;

  const firstPopulatedCell = cells.map(normalizeText).find((cell) => cell !== '');
  if (normalizeIdentity(firstPopulatedCell) !== 'totals') return false;

  return [
    get(cells, headerMapping.orderId),
    get(cells, headerMapping.firstName),
    get(cells, headerMapping.lastName),
    get(cells, headerMapping.email),
  ].every((value) => normalizeText(value) === '');
}

export function normalizeTicketCount(value: unknown): number | null {
  const trimmed = normalizeText(value);
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed.replace(/,/g, ''), 10);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 1) return null;
  return parsed;
}

export function parseEventbriteRegistrationsRows(parsedRows: string[][]): EventbriteRegistrationParseResult {
  if (parsedRows.length === 0) throw new Error('Eventbrite import file is empty.');

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
  const rowGroups = new Map<string, ParsedSourceRegistrationRow[]>();
  let ignoredFooterRowCount = 0;

  parsedRows.slice(1).forEach((cells, index) => {
    const sourceRowNumber = index + 2;
    if (isEventbriteTotalsFooterRow(cells, headerMapping, get)) {
      ignoredFooterRowCount += 1;
      return;
    }

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
    const ticketType = headerMapping.ticketType ? get(cells, headerMapping.ticketType) : '';
    const groupRow = {
      sourceRowNumber,
      orderId,
      firstName,
      lastName,
      email,
      normalizedEmail: normalizeEmail(email),
      tickets,
      ticketCount,
      ticketType,
      cells,
    };
    rowGroups.set(orderId, [...(rowGroups.get(orderId) ?? []), groupRow]);
  });

  rowGroups.forEach((group) => {
    const primary = group[0];
    const sourceRowNumbers = group.map((row) => row.sourceRowNumber);
    const invalidTicketRow = group.find((row) => row.ticketCount === null);
    const invalidBase = {
      sourceRowNumber: primary.sourceRowNumber,
      sourceRowNumbers,
      orderId: primary.orderId,
      firstName: primary.firstName,
      lastName: primary.lastName,
      email: primary.email,
      tickets: primary.tickets,
    };

    if (invalidTicketRow) {
      invalidRows.push({
        ...invalidBase,
        sourceRowNumber: invalidTicketRow.sourceRowNumber,
        tickets: invalidTicketRow.tickets,
        reason: 'invalid_tickets',
      });
      return;
    }

    const hasIdentityConflict = group.some((row) => (
      normalizeIdentity(row.firstName) !== normalizeIdentity(primary.firstName)
      || normalizeIdentity(row.lastName) !== normalizeIdentity(primary.lastName)
      || normalizeEmail(row.email) !== normalizeEmail(primary.email)
    ));
    if (hasIdentityConflict) {
      invalidRows.push({ ...invalidBase, reason: 'conflicting_order_rows' });
      return;
    }

    const ticketCount = group.reduce((sum, row) => sum + (row.ticketCount ?? 0), 0);
    const sourceMetadata: Record<string, string | number> = {
      order_id: primary.orderId,
      tickets: ticketCount,
      party_size: ticketCount,
      additional_guests: Math.max(0, ticketCount - 1),
      source_row_count: group.length,
      source_row_numbers: sourceRowNumbers.join(','),
      source_export_shape: group.length > 1 ? 'ticket_rows_consolidated' : 'order_rows',
    };
    headers.forEach((header, headerIndex) => {
      const metadataKey = Object.prototype.hasOwnProperty.call(sourceMetadata, header) ? `source_${header}` : header;
      sourceMetadata[metadataKey] = normalizeText(primary.cells[headerIndex]);
    });
    if (group.length > 1) {
      sourceMetadata.summed_ticket_quantity = ticketCount;
    }

    rows.push({
      sourceRowNumber: primary.sourceRowNumber,
      sourceRowNumbers,
      sourceRowCount: group.length,
      orderId: primary.orderId,
      firstName: primary.firstName,
      lastName: primary.lastName,
      email: primary.email,
      normalizedEmail: primary.normalizedEmail,
      ticketCount,
      ticketType: primary.ticketType,
      sourceMetadata,
    });
  });

  return {
    headers,
    headerMapping,
    rows,
    invalidRows,
    rowCount: parsedRows.length - 1,
    sourceRowCount: parsedRows.length - 1 - ignoredFooterRowCount,
    ignoredFooterRowCount,
    canonicalRegistrationCount: rows.length + invalidRows.length,
  };
}

export function parseEventbriteRegistrationsCsv(csvText: string): EventbriteRegistrationParseResult {
  return parseEventbriteRegistrationsRows(parseCsv(csvText.replace(/^\uFEFF/, '')));
}

function detectImportFormat(fileName: string, mimeType = ''): EventbriteRegistrationFileFormat {
  const lowerName = fileName.toLowerCase();
  const lowerType = mimeType.toLowerCase();
  if (lowerName.endsWith('.csv') || lowerType === 'text/csv') return 'csv';
  if (lowerName.endsWith('.xlsx') || lowerType.includes('openxmlformats-officedocument.spreadsheetml.sheet')) return 'xlsx';
  if (lowerName.endsWith('.xls') || lowerType === 'application/vnd.ms-excel') return 'xls';
  throw new Error('Unsupported Eventbrite import file. Please choose a .csv, .xls, or .xlsx file.');
}

function cellToText(cell: XLSX.CellObject | undefined): string {
  if (!cell) return '';
  if (cell.w !== undefined) return normalizeText(cell.w);
  if (cell.v === undefined || cell.v === null) return '';
  return normalizeText(cell.v);
}

function worksheetToRows(sheet: XLSX.WorkSheet): string[][] {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  if (range.e.r - range.s.r + 1 > MAX_WORKSHEET_ROWS || range.e.c - range.s.c + 1 > MAX_WORKSHEET_COLUMNS) {
    throw new Error('Eventbrite workbook is too large for browser import. Please use a smaller attendee export.');
  }

  const rows: string[][] = [];
  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const row: string[] = [];
    for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      row.push(cellToText(sheet[address] as XLSX.CellObject | undefined));
    }
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
}

function chooseEventbriteWorksheet(workbook: XLSX.WorkBook): { name: string; rows: string[][] } {
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const rows = worksheetToRows(sheet);
    const headers = rows[0]?.map((header) => header.trim()) ?? [];
    if (headers.length > 0 && hasRequiredEventbriteHeaders(headers)) {
      return { name, rows };
    }
  }

  if (workbook.SheetNames.length === 1) {
    const name = workbook.SheetNames[0];
    const sheet = workbook.Sheets[name];
    if (sheet) {
      const rows = worksheetToRows(sheet);
      if (rows.length > 0) return { name, rows };
    }
  }

  throw new Error('Could not find an Eventbrite attendee worksheet with Order ID, Tickets, name, and email columns.');
}

export function parseEventbriteRegistrationsWorkbookData(
  data: ArrayBuffer | Uint8Array,
  sourceFileName = 'eventbrite-export.xls'
): EventbriteRegistrationFileData {
  try {
    const workbook = XLSX.read(data, {
      type: data instanceof Uint8Array ? 'array' : 'array',
      cellFormula: false,
      cellHTML: false,
      cellNF: false,
      cellStyles: false,
      cellDates: false,
    });
    const worksheet = chooseEventbriteWorksheet(workbook);
    return {
      sourceFileName,
      format: detectImportFormat(sourceFileName),
      rows: worksheet.rows,
      worksheetName: worksheet.name,
    };
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Could not find')) throw e;
    if (e instanceof Error && e.message.includes('too large')) throw e;
    throw new Error('Could not read the Eventbrite Excel file. Please choose a valid .xls or .xlsx export.');
  }
}

export async function readEventbriteRegistrationFile(file: File): Promise<EventbriteRegistrationFileData> {
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error('Eventbrite import file is too large for browser import. Please choose a smaller attendee export.');
  }

  const format = detectImportFormat(file.name, file.type);
  if (format === 'csv') {
    const text = typeof file.text === 'function'
      ? await file.text()
      : await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(reader.error ?? new Error('File could not be read.'));
        reader.readAsText(file);
      });
    return {
      sourceFileName: file.name,
      format,
      rows: parseCsv(text.replace(/^\uFEFF/, '')),
    };
  }

  const data = await file.arrayBuffer();
  const parsed = parseEventbriteRegistrationsWorkbookData(data, file.name);
  return { ...parsed, format };
}

function parseEventbriteRegistrationInput(input: { csvText?: string; fileData?: EventbriteRegistrationFileData }) {
  if (input.fileData) return parseEventbriteRegistrationsRows(input.fileData.rows);
  if (input.csvText !== undefined) return parseEventbriteRegistrationsCsv(input.csvText);
  throw new Error('No Eventbrite import file data was provided.');
}

async function getExistingEventbriteOrderIds(eventId: string, orderIds: string[]): Promise<Set<string>> {
  const existingOrderIds = new Set<string>();
  if (orderIds.length === 0) return existingOrderIds;

  const { data, error } = await supabase
    .from('event_imported_registrations')
    .select('external_order_id, external_attendee_id')
    .eq('event_id', eventId)
    .eq('import_source', 'eventbrite')
    .in('external_order_id', orderIds);
  if (error) throw error;
  (data ?? []).forEach((row) => {
    const record = row as Record<string, unknown>;
    const externalOrderId = normalizeText(record.external_order_id || record.external_attendee_id);
    if (externalOrderId) existingOrderIds.add(externalOrderId.toLowerCase());
  });

  return existingOrderIds;
}

export async function previewEventbriteRegistrationsForEvent(input: {
  eventId: string;
  csvText?: string;
  fileData?: EventbriteRegistrationFileData;
}): Promise<EventbriteRegistrationPreviewResult> {
  const parsed = parseEventbriteRegistrationInput(input);
  const orderIds = parsed.rows.map((row) => row.orderId);
  const existingOrderIds = await getExistingEventbriteOrderIds(input.eventId, orderIds);
  const skippedExistingOrderIds = parsed.rows
    .filter((row) => existingOrderIds.has(row.orderId.toLowerCase()))
    .map((row) => row.orderId);

  return {
    ...parsed,
    recognized: {
      firstName: Boolean(parsed.headerMapping.firstName),
      lastName: Boolean(parsed.headerMapping.lastName),
      email: Boolean(parsed.headerMapping.email),
      orderId: Boolean(parsed.headerMapping.orderId),
      tickets: Boolean(parsed.headerMapping.tickets),
      ticketType: Boolean(parsed.headerMapping.ticketType),
    },
    totalGuestsRepresented: parsed.rows.reduce((sum, row) => sum + row.ticketCount, 0),
    newRegistrationCount: parsed.rows.length - skippedExistingOrderIds.length,
    skippedExistingCount: skippedExistingOrderIds.length,
    skippedExistingOrderIds,
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
  csvText?: string;
  fileData?: EventbriteRegistrationFileData;
  sourceFileName: string;
}): Promise<EventbriteRegistrationImportResult> {
  const parsed = parseEventbriteRegistrationInput(input);
  const orderIds = parsed.rows.map((row) => row.orderId);
  const existingOrderIds = await getExistingEventbriteOrderIds(input.eventId, orderIds);

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
      source_row_count: parsed.sourceRowCount,
      ignored_footer_row_count: parsed.ignoredFooterRowCount,
      canonical_registration_count: parsed.canonicalRegistrationCount,
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
