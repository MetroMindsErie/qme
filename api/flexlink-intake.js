const INTAKE_DOCUMENT_ID = "flexlink-intake-2026-06-18";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

function parseBody(req) {
  try {
    return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return {};
  }
}

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

async function fetchExisting(config) {
  const response = await fetch(
    `${config.url}/rest/v1/planning_documents?id=eq.${encodeURIComponent(INTAKE_DOCUMENT_ID)}&select=data`,
    {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase intake fetch failed: ${response.status}`);
  }

  const rows = await response.json();
  return rows && rows[0] && rows[0].data ? rows[0].data : null;
}

async function save(config, data, exists) {
  const url = exists
    ? `${config.url}/rest/v1/planning_documents?id=eq.${encodeURIComponent(INTAKE_DOCUMENT_ID)}`
    : `${config.url}/rest/v1/planning_documents`;

  const response = await fetch(url, {
    method: exists ? "PATCH" : "POST",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(
      exists
        ? { data, updated_by: "flexlink-intake" }
        : { id: INTAKE_DOCUMENT_ID, data, updated_by: "flexlink-intake" }
    )
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase intake save failed: ${response.status} ${message}`);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const config = getSupabaseConfig();
  if (!config || typeof fetch !== "function") {
    res.status(500).json({ error: "Intake storage is not configured" });
    return;
  }

  const body = parseBody(req);
  const entry = {
    id: `flexlink-${Date.now().toString(36)}`,
    name: cleanText(body.name, 160),
    title: cleanText(body.title, 160),
    jobDescription: cleanText(body.jobDescription, 2000),
    changeReasons: cleanText(body.changeReasons, 4000),
    submittedAt: new Date().toISOString()
  };

  if (!entry.name || !entry.title || !entry.jobDescription || !entry.changeReasons) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  try {
    const existing = await fetchExisting(config);
    const data = existing || {
      project: "Flexlink ERP and digital transformation discussion",
      requestedBy: "growU",
      requestedFor: "2026-06-18 09:00 America/New_York",
      responses: []
    };

    data.responses = Array.isArray(data.responses) ? data.responses : [];
    data.responses.push(entry);

    await save(config, data, Boolean(existing));
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to save response" });
  }
};
