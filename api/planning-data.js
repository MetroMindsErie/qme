const crypto = require("crypto");
const fallbackRoadmap = require("../planning/roadmap-data.js");

const ACCESS_HASH = "710a141a6043f2f350c0a14076ceae0681224c460931add70fc620e330d42046";
const COOKIE_NAME = "qme_planning_access";
const ONE_DAY = 60 * 60 * 24;
const PLANNING_DOCUMENT_ID = "qme-roadmap";

function hash(value = "") {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function hasAccessCookie(req) {
  const cookie = req.headers.cookie || "";
  return cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part === `${COOKIE_NAME}=${ACCESS_HASH}`);
}

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

async function fetchRoadmapFromSupabase() {
  const config = getSupabaseConfig();
  if (!config || typeof fetch !== "function") return null;

  const response = await fetch(
    `${config.url}/rest/v1/planning_documents?id=eq.${encodeURIComponent(
      PLANNING_DOCUMENT_ID
    )}&select=data`,
    {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase planning fetch failed: ${response.status}`);
  }

  const rows = await response.json();
  return rows && rows[0] && rows[0].data ? rows[0].data : null;
}

async function saveRoadmapToSupabase(roadmap) {
  const config = getSupabaseConfig();
  if (!config || typeof fetch !== "function") {
    throw new Error("Supabase is not configured for planning writes");
  }

  const response = await fetch(
    `${config.url}/rest/v1/planning_documents?id=eq.${encodeURIComponent(PLANNING_DOCUMENT_ID)}`,
    {
      method: "PATCH",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        data: roadmap,
        updated_by: "planning-editor"
      })
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase planning save failed: ${response.status} ${message}`);
  }
}

async function getRoadmap() {
  try {
    return (await fetchRoadmapFromSupabase()) || fallbackRoadmap;
  } catch (error) {
    console.error(error);
    return fallbackRoadmap;
  }
}

async function sendRoadmap(res) {
  const roadmap = await getRoadmap();
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).json(roadmap);
}

function parseBody(req) {
  try {
    return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return {};
  }
}

function sanitizeStoryUpdates(updates = {}) {
  const allowedStatuses = new Set([
    "idea",
    "discovery",
    "ready",
    "current",
    "future",
    "deferred",
    "done"
  ]);
  const allowedSprints = new Set(["backlog", "now", "next", "soon", "future"]);
  const clean = {};

  if (typeof updates.title === "string") clean.title = updates.title.trim().slice(0, 160);
  if (typeof updates.summary === "string") clean.summary = updates.summary.trim().slice(0, 1200);
  if (typeof updates.notes === "string") clean.notes = updates.notes.trim().slice(0, 2000);
  if (allowedStatuses.has(updates.status)) clean.status = updates.status;
  if (allowedSprints.has(updates.sprint)) clean.sprint = updates.sprint === "backlog" ? "" : updates.sprint;

  return clean;
}

function applyStoryUpdate(roadmap, storyId, updates) {
  let updatedStory = null;

  for (const epic of roadmap.epics || []) {
    for (const theme of epic.themes || []) {
      for (const story of theme.stories || []) {
        if (story.id !== storyId) continue;
        Object.assign(story, updates);
        updatedStory = story;
      }
    }
  }

  if (!updatedStory) return null;

  if (Object.prototype.hasOwnProperty.call(updates, "sprint")) {
    for (const sprint of roadmap.sprints || []) {
      sprint.storyIds = (sprint.storyIds || []).filter((id) => id !== storyId);
    }
    const targetSprint = (roadmap.sprints || []).find((sprint) => sprint.id === updates.sprint);
    if (targetSprint) {
      targetSprint.storyIds = Array.from(new Set([...(targetSprint.storyIds || []), storyId]));
    }
  }

  return updatedStory;
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    if (hasAccessCookie(req)) {
      await sendRoadmap(res);
      return;
    }
    res.status(401).json({ error: "Access code required" });
    return;
  }

  if (req.method === "POST") {
    const body = parseBody(req);
    const code = body.code || "";
    if (hash(code.trim()) !== ACCESS_HASH) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=${ACCESS_HASH}; Max-Age=${ONE_DAY}; Path=/; HttpOnly; Secure; SameSite=Strict`
    );
    await sendRoadmap(res);
    return;
  }

  if (req.method === "PATCH") {
    if (!hasAccessCookie(req)) {
      res.status(401).json({ error: "Access code required" });
      return;
    }

    const body = parseBody(req);
    const storyId = String(body.storyId || "");
    const updates = sanitizeStoryUpdates(body.updates || {});
    if (!storyId || Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Story update required" });
      return;
    }

    try {
      const roadmap = await getRoadmap();
      const updatedStory = applyStoryUpdate(roadmap, storyId, updates);
      if (!updatedStory) {
        res.status(404).json({ error: "Story not found" });
        return;
      }
      await saveRoadmapToSupabase(roadmap);
      res.setHeader("Cache-Control", "private, no-store");
      res.status(200).json({ roadmap, story: updatedStory });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to save roadmap update" });
      return;
    }
  }

  res.setHeader("Allow", "GET, POST, PATCH");
  res.status(405).json({ error: "Method not allowed" });
};
