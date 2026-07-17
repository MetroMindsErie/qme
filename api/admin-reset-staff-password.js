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

async function getPrincipalById(config, principalId) {
  const response = await fetch(
    `${config.url}/rest/v1/admin_principals?id=eq.${encodeURIComponent(principalId)}&status=eq.active&select=*`,
    {
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        Accept: "application/json"
      }
    }
  );
  if (!response.ok) throw new Error(`Target principal lookup failed: ${response.status}`);
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

async function getEventById(config, eventId) {
  const response = await fetch(
    `${config.url}/rest/v1/events?id=eq.${encodeURIComponent(eventId)}&select=id,organization_id`,
    {
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        Accept: "application/json"
      }
    }
  );
  if (!response.ok) throw new Error(`Event lookup failed: ${response.status}`);
  const rows = await response.json();
  return rows[0] || null;
}

async function canManageEvent(config, principalId, event) {
  if (!event) return false;

  const assignmentResponse = await fetch(
    `${config.url}/rest/v1/event_staff_assignments?principal_id=eq.${encodeURIComponent(principalId)}&event_id=eq.${encodeURIComponent(event.id)}&role=eq.event_admin&status=eq.active&select=id`,
    {
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        Accept: "application/json"
      }
    }
  );
  if (!assignmentResponse.ok) throw new Error(`Event role lookup failed: ${assignmentResponse.status}`);
  const assignments = await assignmentResponse.json();
  if (assignments.length > 0) return true;

  if (!event.organization_id) return false;
  const membershipResponse = await fetch(
    `${config.url}/rest/v1/organization_memberships?principal_id=eq.${encodeURIComponent(principalId)}&organization_id=eq.${encodeURIComponent(event.organization_id)}&role=eq.org_admin&status=eq.active&select=id`,
    {
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        Accept: "application/json"
      }
    }
  );
  if (!membershipResponse.ok) throw new Error(`Organization role lookup failed: ${membershipResponse.status}`);
  const memberships = await membershipResponse.json();
  return memberships.length > 0;
}

async function hasEventAssignment(config, principalId, eventId) {
  const response = await fetch(
    `${config.url}/rest/v1/event_staff_assignments?principal_id=eq.${encodeURIComponent(principalId)}&event_id=eq.${encodeURIComponent(eventId)}&status=eq.active&select=id`,
    {
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        Accept: "application/json"
      }
    }
  );
  if (!response.ok) throw new Error(`Target event assignment lookup failed: ${response.status}`);
  const rows = await response.json();
  return rows.length > 0;
}

async function updateAuthPassword(config, authUserId, password) {
  const response = await fetch(`${config.url}/auth/v1/admin/users/${encodeURIComponent(authUserId)}`, {
    method: "PUT",
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ password })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.msg || body.message || `Auth password reset failed: ${response.status}`;
    throw new Error(message);
  }
}

async function updatePrincipalMetadata(config, principal, password, callerPrincipalId) {
  const metadata = principal.metadata && typeof principal.metadata === "object"
    ? { ...principal.metadata }
    : {};
  // Keep the profile intact on reset. The temporary password remains visible
  // on the event staff row until this principal signs in again.
  metadata.temporary_password = password;
  metadata.password_reset_at = new Date().toISOString();
  metadata.password_reset_by_principal_id = callerPrincipalId;
  metadata.password_reset_source = "event-staff-tab";

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
    const caller = await getAuthUser(config, accessToken);
    if (!caller?.id) {
      res.status(401).json({ error: "Invalid admin access token." });
      return;
    }

    const callerPrincipal = await getAdminPrincipal(config, caller.id);
    const body = parseBody(req);
    const principalId = String(body.principalId || "").trim();
    const eventId = String(body.eventId || "").trim();
    const password = String(body.password || "");

    if (!principalId || !eventId || password.length < 8) {
      res.status(400).json({ error: "principalId, eventId, and a password of at least 8 characters are required." });
      return;
    }

    const event = await getEventById(config, eventId);
    const callerIsSuperadmin = callerPrincipal ? await isSuperadmin(config, callerPrincipal.id) : false;
    const callerCanManageEvent = callerPrincipal ? await canManageEvent(config, callerPrincipal.id, event) : false;
    if (!callerPrincipal || (!callerIsSuperadmin && !callerCanManageEvent)) {
      res.status(403).json({ error: "Only qME superadmin, organization admin, or event admin can reset staff passwords." });
      return;
    }

    const principal = await getPrincipalById(config, principalId);
    if (!principal?.auth_user_id) {
      res.status(400).json({ error: "This staff person does not have a linked Auth login." });
      return;
    }

    const assignedToEvent = await hasEventAssignment(config, principal.id, eventId);
    if (!assignedToEvent) {
      res.status(403).json({ error: "This person is not assigned to this event." });
      return;
    }

    await updateAuthPassword(config, principal.auth_user_id, password);
    const updatedPrincipal = await updatePrincipalMetadata(config, principal, password, callerPrincipal.id);
    res.status(200).json({ principal: updatedPrincipal });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ error: error.message || "Could not reset staff password." });
  }
};
