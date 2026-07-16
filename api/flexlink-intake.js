const crypto = require("crypto");

const INTAKE_DOCUMENT_ID = "flexlink-intake-2026-06-18";
const COOKIE_NAME = "flexlink_intake_session_v2";
const SESSION_TTL_SECONDS = 60 * 60 * 4;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const attempts = new Map();

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function timingSafeEqualBuffers(left, right) {
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifyPasscode(passcode, storedHash) {
  const parts = String(storedHash || "").split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, nValue, rValue, pValue, saltHex, expectedHex] = parts;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = crypto.scryptSync(String(passcode || ""), Buffer.from(saltHex, "hex"), expected.length, {
    N: Number(nValue),
    r: Number(rValue),
    p: Number(pValue),
    maxmem: 64 * 1024 * 1024
  });

  return timingSafeEqualBuffers(actual, expected);
}

function signSession(payload, secret) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token, secret) {
  const [encodedPayload, signature] = String(token || "").split(".");
  if (!encodedPayload || !signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest();
  const actualSignature = Buffer.from(signature, "base64url");
  if (!timingSafeEqualBuffers(actualSignature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function getCookieValue(req, name) {
  const cookie = req.headers.cookie || "";
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

function getAuthConfig() {
  const passcodeHash = process.env.FLEXLINK_INTAKE_PASSCODE_HASH;
  const sessionSecret = process.env.FLEXLINK_INTAKE_SESSION_SECRET;
  if (!passcodeHash || !sessionSecret) return null;
  return { passcodeHash, sessionSecret };
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

function getClientKey(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket?.remoteAddress || "unknown";
}

function isRateLimited(req) {
  const key = getClientKey(req);
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || record.resetAt <= now) {
    attempts.set(key, { count: 0, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  return record.count >= 8;
}

function recordFailedAttempt(req) {
  const key = getClientKey(req);
  const now = Date.now();
  const record = attempts.get(key) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  attempts.set(key, { count: record.count + 1, resetAt: record.resetAt });
}

function clearAttempts(req) {
  attempts.delete(getClientKey(req));
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
  const authConfig = getAuthConfig();
  if (!config || !authConfig || typeof fetch !== "function") {
    res.status(500).json({ error: "Intake storage is not configured" });
    return;
  }

  const body = parseBody(req);
  if (body.action === "verify") {
    if (isRateLimited(req)) {
      res.status(429).json({ error: "Too many attempts. Try again later." });
      return;
    }

    if (!verifyPasscode(String(body.pin || "").trim(), authConfig.passcodeHash)) {
      recordFailedAttempt(req);
      console.warn("Flexlink intake verification failed");
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    clearAttempts(req);
    const sessionToken = signSession(
      {
        exp: Date.now() + SESSION_TTL_SECONDS * 1000,
        nonce: crypto.randomBytes(16).toString("hex")
      },
      authConfig.sessionSecret
    );

    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=${sessionToken}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Strict`
    );
    res.status(200).json({ ok: true });
    return;
  }

  if (!verifySessionToken(getCookieValue(req, COOKIE_NAME), authConfig.sessionSecret)) {
    res.status(401).json({ error: "Access code required" });
    return;
  }

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
