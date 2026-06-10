const crypto = require("crypto");
const roadmap = require("../planning/roadmap-data.js");

const ACCESS_HASH = "710a141a6043f2f350c0a14076ceae0681224c460931add70fc620e330d42046";
const COOKIE_NAME = "qme_planning_access";
const ONE_DAY = 60 * 60 * 24;

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

function sendRoadmap(res) {
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).json(roadmap);
}

module.exports = function handler(req, res) {
  if (req.method === "GET") {
    if (hasAccessCookie(req)) {
      sendRoadmap(res);
      return;
    }
    res.status(401).json({ error: "Access code required" });
    return;
  }

  if (req.method === "POST") {
    let body = {};
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    } catch {
      body = {};
    }
    const code = body.code || "";
    if (hash(code.trim()) !== ACCESS_HASH) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=${ACCESS_HASH}; Max-Age=${ONE_DAY}; Path=/; HttpOnly; Secure; SameSite=Strict`
    );
    sendRoadmap(res);
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "Method not allowed" });
};
