const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const REQUIRED_HEADERS = [
  "First Name",
  "Last Name",
  "Email",
  "Price Tier",
  "Ticket Type",
  "Attendee #",
];

const SOURCE_METADATA_HEADERS = [
  "Preferred Pronouns",
  "Area of Expertise",
  "Major field of study",
  "Company/Employer",
  "School",
];

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

function parseArgs(argv) {
  const args = {
    csv: DEFAULT_CSV_PATH,
    eventSlug: "sotc-test-check-in",
    summary: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--csv") {
      args.csv = path.resolve(argv[i + 1]);
      i += 1;
    } else if (arg === "--event-slug") {
      args.eventSlug = argv[i + 1];
      i += 1;
    } else if (arg === "--summary") {
      args.summary = true;
    } else if (arg === "--apply") {
      throw new Error("Apply mode is intentionally not implemented yet. Review the dry-run report first.");
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

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeText(value) {
  return String(value || "").trim();
}

function groupBy(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

function toCounts(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }

  return Array.from(groups.entries())
    .map(([value, group]) => ({
      value: value === "" ? "(blank)" : value,
      count: group.length,
    }))
    .sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)));
}

function buildReport(csvPath, eventSlug) {
  const raw = fs.readFileSync(csvPath);
  const text = raw.toString("utf8").replace(/^\uFEFF/, "");
  const parsedRows = parseCsv(text);
  if (parsedRows.length === 0) throw new Error("CSV is empty.");

  const headers = parsedRows[0].map((header) => header.trim());
  const blankHeaderIndexes = headers
    .map((header, index) => ({ header, index }))
    .filter((entry) => entry.header === "")
    .map((entry) => entry.index + 1);

  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  const headerIndexes = new Map(headers.map((header, index) => [header, index]));

  const sourceRows = parsedRows.slice(1).map((cells, index) => {
    const get = (header) => {
      const cellIndex = headerIndexes.get(header);
      return cellIndex === undefined ? "" : normalizeText(cells[cellIndex]);
    };

    const firstName = get("First Name");
    const lastName = get("Last Name");
    const email = get("Email");
    const normalizedEmail = normalizeEmail(email);
    const priceTier = get("Price Tier");
    const ticketType = get("Ticket Type");
    const attendeeNumber = get("Attendee #");
    const headshotEntitled = priceTier === "Headshot";
    const unknownPriceTier = priceTier !== "" && priceTier !== "Headshot";

    const sourceMetadata = {};
    for (const header of SOURCE_METADATA_HEADERS) {
      sourceMetadata[header] = get(header);
    }

    return {
      sourceRowNumber: index + 2,
      externalAttendeeId: attendeeNumber,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`.trim(),
      email,
      normalizedEmail,
      sourcePriceTier: priceTier,
      sourceTicketType: ticketType,
      attendeeStatus: get("Attendee Status"),
      headshotEntitled,
      unknownPriceTier,
      normalizedName: `${firstName} ${lastName}`.trim().toLowerCase(),
      sourceMetadata,
    };
  });

  const duplicateGroups = (keyName, groups) =>
    Array.from(groups.entries())
      .filter(([, group]) => group.length > 1)
      .map(([value, group]) => ({
        [keyName]: value,
        count: group.length,
        rows: group.map((row) => ({
          sourceRowNumber: row.sourceRowNumber,
          attendeeNumber: row.externalAttendeeId,
          name: row.displayName,
          email: row.email,
          priceTier: row.sourcePriceTier || "(blank)",
          ticketType: row.sourceTicketType,
        })),
      }));

  const rowsMissingRequiredFields = sourceRows
    .filter(
      (row) =>
        !row.externalAttendeeId ||
        !row.firstName ||
        !row.lastName ||
        !row.normalizedEmail
    )
    .map((row) => ({
      sourceRowNumber: row.sourceRowNumber,
      attendeeNumber: row.externalAttendeeId,
      name: row.displayName,
      email: row.email,
    }));

  const rowsWithUnknownPriceTier = sourceRows
    .filter((row) => row.unknownPriceTier)
    .map((row) => ({
      sourceRowNumber: row.sourceRowNumber,
      attendeeNumber: row.externalAttendeeId,
      name: row.displayName,
      priceTier: row.sourcePriceTier,
    }));

  const attendeeDuplicates = duplicateGroups(
    "attendeeNumber",
    groupBy(sourceRows, (row) => row.externalAttendeeId)
  );
  const emailDuplicates = duplicateGroups(
    "normalizedEmail",
    groupBy(sourceRows, (row) => row.normalizedEmail)
  );
  const nameDuplicates = duplicateGroups(
    "normalizedName",
    groupBy(sourceRows, (row) => row.normalizedName)
  );

  const flaggedRows = new Set([
    ...rowsMissingRequiredFields.map((row) => row.sourceRowNumber),
    ...rowsWithUnknownPriceTier.map((row) => row.sourceRowNumber),
    ...attendeeDuplicates.flatMap((group) => group.rows.map((row) => row.sourceRowNumber)),
    ...emailDuplicates.flatMap((group) => group.rows.map((row) => row.sourceRowNumber)),
    ...nameDuplicates.flatMap((group) => group.rows.map((row) => row.sourceRowNumber)),
  ]);

  return {
    mode: "dry_run",
    eventSlug,
    csvPath,
    sourceFileName: path.basename(csvPath),
    sourceFileHashSha256: crypto.createHash("sha256").update(raw).digest("hex"),
    headerCount: headers.length,
    headers,
    blankHeaderIndexes,
    missingHeaders,
    rowCount: sourceRows.length,
    importableRowCount: sourceRows.length - flaggedRows.size,
    flaggedRowCount: flaggedRows.size,
    headshotEntitledCount: sourceRows.filter((row) => row.headshotEntitled).length,
    noHeadshotEntitlementCount: sourceRows.filter((row) => !row.headshotEntitled).length,
    priceTierCounts: toCounts(sourceRows, (row) => row.sourcePriceTier),
    ticketTypeCounts: toCounts(sourceRows, (row) => row.sourceTicketType),
    attendeeStatusCounts: toCounts(sourceRows, (row) => row.attendeeStatus),
    missingRequiredFieldCount: rowsMissingRequiredFields.length,
    rowsMissingRequiredFields,
    unknownPriceTierCount: rowsWithUnknownPriceTier.length,
    rowsWithUnknownPriceTier,
    attendeeNumberDuplicateCount: attendeeDuplicates.length,
    attendeeNumberDuplicates: attendeeDuplicates,
    emailDuplicateCount: emailDuplicates.length,
    emailDuplicates,
    nameDuplicateCount: nameDuplicates.length,
    nameDuplicates,
    sourceMetadataHeaders: SOURCE_METADATA_HEADERS,
    sourceMetadataSample: sourceRows.slice(0, 5).map((row) => ({
      sourceRowNumber: row.sourceRowNumber,
      name: row.displayName,
      sourceMetadata: row.sourceMetadata,
    })),
    proposedHeadshotMapping: [
      {
        sourcePriceTier: "Headshot",
        headshotEntitled: true,
      },
      {
        sourcePriceTier: "(blank)",
        headshotEntitled: false,
      },
      {
        sourcePriceTier: "unknown other value",
        headshotEntitled: false,
        reviewStatus: "needs_review",
      },
    ],
  };
}

function main() {
  const args = parseArgs(process.argv);
  const report = buildReport(args.csv, args.eventSlug);
  const output = args.summary
    ? {
        mode: report.mode,
        eventSlug: report.eventSlug,
        sourceFileName: report.sourceFileName,
        sourceFileHashSha256: report.sourceFileHashSha256,
        headerCount: report.headerCount,
        blankHeaderIndexes: report.blankHeaderIndexes,
        missingHeaders: report.missingHeaders,
        rowCount: report.rowCount,
        importableRowCount: report.importableRowCount,
        flaggedRowCount: report.flaggedRowCount,
        headshotEntitledCount: report.headshotEntitledCount,
        noHeadshotEntitlementCount: report.noHeadshotEntitlementCount,
        priceTierCounts: report.priceTierCounts,
        ticketTypeCounts: report.ticketTypeCounts,
        attendeeStatusCounts: report.attendeeStatusCounts,
        missingRequiredFieldCount: report.missingRequiredFieldCount,
        unknownPriceTierCount: report.unknownPriceTierCount,
        attendeeNumberDuplicateCount: report.attendeeNumberDuplicateCount,
        emailDuplicateCount: report.emailDuplicateCount,
        nameDuplicateCount: report.nameDuplicateCount,
      }
    : report;
  console.log(JSON.stringify(output, null, 2));

  if (
    report.blankHeaderIndexes.length > 0 ||
    report.missingHeaders.length > 0 ||
    report.missingRequiredFieldCount > 0 ||
    report.unknownPriceTierCount > 0 ||
    report.attendeeNumberDuplicateCount > 0
  ) {
    process.exitCode = 1;
  }
}

main();
