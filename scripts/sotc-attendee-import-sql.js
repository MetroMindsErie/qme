const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DEFAULT_CSV_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "sotc",
  "sotc@rockhall",
  "attendance list",
  "SOTC-Mixer-List.csv"
);

const DEFAULT_OUTPUT_PATH = path.resolve(
  __dirname,
  "..",
  "tmp",
  "sotc-attendee-import.generated.sql"
);

const REQUIRED_HEADERS = [
  "First Name",
  "Last Name",
  "Email",
  "Price Tier",
  "Ticket Type",
  "Attendee #",
];

const METADATA_HEADERS = [
  "Order #",
  "Attendee Status",
  "Preferred Pronouns",
  "Area of Expertise",
  "Major field of study",
  "Company/Employer",
  "School",
];

function parseArgs(argv) {
  const args = {
    csv: DEFAULT_CSV_PATH,
    eventSlug: "sotc-test-check-in",
    output: DEFAULT_OUTPUT_PATH,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--csv") {
      args.csv = path.resolve(argv[i + 1]);
      i += 1;
    } else if (arg === "--event-slug") {
      args.eventSlug = argv[i + 1];
      i += 1;
    } else if (arg === "--output") {
      args.output = path.resolve(argv[i + 1]);
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
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
    } else if (ch === ",") {
      row.push(value);
      value = "";
    } else if (ch === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (ch !== "\r") {
      value += ch;
    }
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function sqlText(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlBool(value) {
  return value ? "true" : "false";
}

function sqlJson(value) {
  return `${sqlText(JSON.stringify(value))}::jsonb`;
}

function loadRows(csvPath) {
  const raw = fs.readFileSync(csvPath);
  const text = raw.toString("utf8").replace(/^\uFEFF/, "");
  const parsed = parseCsv(text);
  if (parsed.length === 0) throw new Error("CSV is empty.");

  const headers = parsed[0].map((header) => header.trim());
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`CSV is missing required headers: ${missingHeaders.join(", ")}`);
  }

  const headerIndexes = new Map(headers.map((header, index) => [header, index]));
  const get = (cells, header) => {
    const index = headerIndexes.get(header);
    return index === undefined ? "" : normalizeText(cells[index]);
  };

  const rows = parsed.slice(1).map((cells, index) => {
    const firstName = get(cells, "First Name");
    const lastName = get(cells, "Last Name");
    const email = get(cells, "Email");
    const attendeeNumber = get(cells, "Attendee #");
    const priceTier = get(cells, "Price Tier");
    const ticketType = get(cells, "Ticket Type");
    const metadata = {};

    for (const header of METADATA_HEADERS) {
      metadata[header] = get(cells, header);
    }

    return {
      sourceRowNumber: index + 2,
      externalAttendeeId: attendeeNumber,
      firstName,
      lastName,
      email,
      normalizedEmail: normalizeEmail(email),
      headshotEntitled: priceTier === "Headshot",
      sourcePriceTier: priceTier,
      sourceTicketType: ticketType,
      sourceMetadata: metadata,
    };
  });

  const badRows = rows.filter(
    (row) =>
      !row.externalAttendeeId ||
      !row.firstName ||
      !row.lastName ||
      !row.normalizedEmail ||
      (row.sourcePriceTier && row.sourcePriceTier !== "Headshot")
  );
  if (badRows.length > 0) {
    throw new Error(`CSV has ${badRows.length} row(s) that need review. Run the dry-run script first.`);
  }

  return {
    rows,
    sourceFileName: path.basename(csvPath),
    sourceFileHash: crypto.createHash("sha256").update(raw).digest("hex"),
  };
}

function buildSql({ rows, sourceFileName, sourceFileHash }, eventSlug) {
  const report = {
    generated_at: new Date().toISOString(),
    source_file_name: sourceFileName,
    source_file_hash_sha256: sourceFileHash,
    row_count: rows.length,
    headshot_entitled_count: rows.filter((row) => row.headshotEntitled).length,
    no_headshot_entitlement_count: rows.filter((row) => !row.headshotEntitled).length,
  };

  const values = rows.map((row) => `(
    ${sqlText(row.externalAttendeeId)},
    ${sqlText(row.firstName)},
    ${sqlText(row.lastName)},
    ${sqlText(row.normalizedEmail)},
    ${sqlText(row.email)},
    ${sqlBool(row.headshotEntitled)},
    ${sqlText(row.sourcePriceTier || null)},
    ${sqlText(row.sourceTicketType || null)},
    ${row.sourceRowNumber},
    ${sqlJson(row.sourceMetadata)}
  )`).join(",\n");

  return `-- Generated SOTC attendee import.
-- Contains attendee names/emails. Do not commit this generated file.
-- Source: ${sourceFileName}
-- SHA-256: ${sourceFileHash}

begin;

do $$
begin
  if not exists (select 1 from public.events where slug = ${sqlText(eventSlug)}) then
    raise exception 'event slug not found: ${eventSlug.replace(/'/g, "''")}';
  end if;
end;
$$;

create temporary table pg_temp.sotc_attendee_import_rows (
  external_attendee_id text not null,
  first_name text not null,
  last_name text not null,
  normalized_email text not null,
  email text not null,
  headshot_entitled boolean not null,
  source_price_tier text,
  source_ticket_type text,
  source_row_number integer,
  source_metadata jsonb not null
) on commit drop;

insert into pg_temp.sotc_attendee_import_rows (
  external_attendee_id,
  first_name,
  last_name,
  normalized_email,
  email,
  headshot_entitled,
  source_price_tier,
  source_ticket_type,
  source_row_number,
  source_metadata
)
values
${values};

with target_event as (
  select id
  from public.events
  where slug = ${sqlText(eventSlug)}
),
new_batch as (
  insert into public.event_import_batches (
    event_id,
    import_source,
    source_file_name,
    source_file_hash,
    status,
    row_count,
    imported_count,
    updated_count,
    flagged_count,
    report
  )
  select
    target_event.id,
    'eventbrite',
    ${sqlText(sourceFileName)},
    ${sqlText(sourceFileHash)},
    'imported',
    ${rows.length},
    ${rows.length},
    0,
    0,
    ${sqlJson(report)}
  from target_event
  returning id, event_id
)
insert into public.event_imported_registrations (
  event_id,
  import_batch_id,
  import_source,
  external_attendee_id,
  first_name,
  last_name,
  normalized_email,
  email,
  headshot_entitled,
  source_price_tier,
  source_ticket_type,
  source_row_number,
  source_metadata,
  review_status
)
select
  new_batch.event_id,
  new_batch.id,
  'eventbrite',
  source.external_attendee_id,
  source.first_name,
  source.last_name,
  source.normalized_email,
  source.email,
  source.headshot_entitled,
  source.source_price_tier,
  source.source_ticket_type,
  source.source_row_number,
  source.source_metadata,
  'ready'
from new_batch
cross join pg_temp.sotc_attendee_import_rows source
on conflict (event_id, external_attendee_id) do update
set
  import_batch_id = excluded.import_batch_id,
  import_source = excluded.import_source,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  normalized_email = excluded.normalized_email,
  email = excluded.email,
  headshot_entitled = excluded.headshot_entitled,
  source_price_tier = excluded.source_price_tier,
  source_ticket_type = excluded.source_ticket_type,
  source_row_number = excluded.source_row_number,
  source_metadata = excluded.source_metadata,
  review_status = excluded.review_status,
  review_reason = null,
  updated_at = now();

commit;
`;
}

function main() {
  const args = parseArgs(process.argv);
  const loaded = loadRows(args.csv);
  const sql = buildSql(loaded, args.eventSlug);
  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, sql, "utf8");
  console.log(JSON.stringify({
    output: args.output,
    eventSlug: args.eventSlug,
    sourceFileName: loaded.sourceFileName,
    rowCount: loaded.rows.length,
    headshotEntitledCount: loaded.rows.filter((row) => row.headshotEntitled).length,
    noHeadshotEntitlementCount: loaded.rows.filter((row) => !row.headshotEntitled).length,
  }, null, 2));
}

main();
