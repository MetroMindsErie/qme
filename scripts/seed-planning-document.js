const fs = require("fs");
const path = require("path");
const roadmap = require("../planning/roadmap-data.js");

const DOCUMENT_ID = "qme-roadmap";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(path.join(__dirname, "..", ".env"));
loadEnvFile(path.join(__dirname, "..", "app", ".env"));

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding."
  );
  process.exit(1);
}

async function seed() {
  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/planning_documents`,
    {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({
        id: DOCUMENT_ID,
        data: roadmap,
        updated_by: "seed-planning-document"
      })
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Seed failed: ${response.status} ${text}`);
  }

  console.log(`Seeded planning document: ${DOCUMENT_ID}`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
