function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return null;
  return { url: url.replace(/\/$/, ""), serviceKey };
}

function parseBody(req) {
  try {
    return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return {};
  }
}

function bearerToken(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

async function getAuthUser(config, accessToken) {
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });
  if (!response.ok) return null;
  return response.json();
}

async function getAdminPrincipal(config, authUserId) {
  const response = await fetch(
    `${config.url}/rest/v1/admin_principals?auth_user_id=eq.${encodeURIComponent(authUserId)}&status=eq.active&select=*`,
    {
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        Accept: "application/json"
      }
    }
  );
  if (!response.ok) throw new Error(`Principal lookup failed: ${response.status}`);
  const rows = await response.json();
  return rows[0] || null;
}

async function isSuperadmin(config, principalId) {
  const response = await fetch(
    `${config.url}/rest/v1/platform_roles?principal_id=eq.${encodeURIComponent(principalId)}&role=eq.superadmin&status=eq.active&select=id`,
    {
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        Accept: "application/json"
      }
    }
  );
  if (!response.ok) throw new Error(`Role lookup failed: ${response.status}`);
  const rows = await response.json();
  return rows.length > 0;
}

async function createAuthUser(config, input) {
  const response = await fetch(`${config.url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        display_name: input.displayName,
        source: "qme-admin-users"
      }
    })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.msg || body.message || `Auth user creation failed: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return body;
}

async function findPrincipalByEmail(config, email) {
  const response = await fetch(
    `${config.url}/rest/v1/admin_principals?email=ilike.${encodeURIComponent(email)}&select=*`,
    {
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        Accept: "application/json"
      }
    }
  );
  if (!response.ok) throw new Error(`Principal email lookup failed: ${response.status}`);
  const rows = await response.json();
  return rows[0] || null;
}

async function saveAdminPrincipal(config, input, authUserId) {
  const existing = await findPrincipalByEmail(config, input.email);
  const url = existing
    ? `${config.url}/rest/v1/admin_principals?id=eq.${encodeURIComponent(existing.id)}`
    : `${config.url}/rest/v1/admin_principals`;
  const response = await fetch(url, {
    method: existing ? "PATCH" : "POST",
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      Accept: "application/json"
    },
    body: JSON.stringify({
      auth_user_id: authUserId,
      principal_type: input.principalType,
      display_name: input.displayName,
      email: input.email,
      phone: input.phone || null,
      status: "active",
      metadata: {
        ...(existing?.metadata || {}),
        source: "qme-admin-create-user",
        created_by_principal_id: input.createdByPrincipalId
      }
    })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`Principal upsert failed: ${response.status} ${message}`);
  }
  return Array.isArray(body) ? body[0] : body;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const config = getSupabaseConfig();
  if (!config) {
    res.status(500).json({ error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required." });
    return;
  }

  const accessToken = bearerToken(req);
  if (!accessToken) {
    res.status(401).json({ error: "Missing admin access token." });
    return;
  }

  try {
    const caller = await getAuthUser(config, accessToken);
    if (!caller?.id) {
      res.status(401).json({ error: "Invalid admin access token." });
      return;
    }

    const callerPrincipal = await getAdminPrincipal(config, caller.id);
    if (!callerPrincipal || !(await isSuperadmin(config, callerPrincipal.id))) {
      res.status(403).json({ error: "Only qME superadmin can create admin users." });
      return;
    }

    const body = parseBody(req);
    const input = {
      email: String(body.email || "").trim().toLowerCase(),
      password: String(body.password || ""),
      displayName: String(body.displayName || "").trim(),
      phone: String(body.phone || "").trim(),
      principalType: String(body.principalType || "person"),
      createdByPrincipalId: callerPrincipal.id
    };

    const allowedTypes = new Set(["person", "station", "service_provider", "support"]);
    if (!input.email || !input.password || !input.displayName || !allowedTypes.has(input.principalType)) {
      res.status(400).json({ error: "email, password, displayName, and valid principalType are required." });
      return;
    }
    if (input.password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters." });
      return;
    }

    const authUser = await createAuthUser(config, input);
    const principal = await saveAdminPrincipal(config, input, authUser.id);
    res.status(200).json({ authUserId: authUser.id, principal });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ error: error.message || "Could not create admin user." });
  }
};
