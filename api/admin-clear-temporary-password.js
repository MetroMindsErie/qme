function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return null;
  return { url: url.replace(/\/$/, ""), serviceKey };
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

async function clearTemporaryPassword(config, principal) {
  const metadata = principal.metadata && typeof principal.metadata === "object"
    ? { ...principal.metadata }
    : {};
  delete metadata.temporary_password;
  metadata.temporary_password_last_used_at = new Date().toISOString();

  const response = await fetch(
    `${config.url}/rest/v1/admin_principals?id=eq.${encodeURIComponent(principal.id)}`,
    {
      method: "PATCH",
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        Accept: "application/json"
      },
      body: JSON.stringify({ metadata })
    }
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`Principal metadata update failed: ${response.status} ${message}`);
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
    const authUser = await getAuthUser(config, accessToken);
    if (!authUser?.id) {
      res.status(401).json({ error: "Invalid admin access token." });
      return;
    }

    const principal = await getAdminPrincipal(config, authUser.id);
    if (!principal) {
      res.status(403).json({ error: "No active qME admin principal found." });
      return;
    }

    const metadata = principal.metadata && typeof principal.metadata === "object"
      ? principal.metadata
      : {};
    if (metadata.onboarding_required === true || typeof metadata.temporary_password !== "string") {
      res.status(200).json({ principal });
      return;
    }

    const updatedPrincipal = await clearTemporaryPassword(config, principal);
    res.status(200).json({ principal: updatedPrincipal });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ error: error.message || "Could not clear temporary password." });
  }
};
