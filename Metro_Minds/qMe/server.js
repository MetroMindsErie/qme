const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// before express.static(...)
app.set('etag', false); // avoid 304s from ETag
app.use((req, res, next) => {
  if (/\.(?:js|css|html|map)$/.test(req.path)) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
  }
  next();
});

// add this line ↓↓↓ (prevents favicon 404s in dev)
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Dev-friendly static caching (avoid stale JS while iterating)
const DEV = process.env.NODE_ENV !== 'production';
app.use(express.static(__dirname, {
  setHeaders(res, filePath) {
    if (DEV && (filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.css'))) {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));

// --------- In-memory state (swap to Redis/DB for persistence) ----------
let state = {
  counter: 0,           // last issued ticket number
  metric1: 1,           // NOW SERVING
  metric1Ts: Date.now(),
  tickets: new Map(),   // id -> { id, createdTs, checkedIn, status, updates[], updatedTs }
  leaves: []            // history of { ticketId, reason, ts }
};

// ---- Persistence (tiny JSON file) ----
const stateFile = path.join(__dirname, 'state.json');

// Load saved state on boot (best-effort)
try {
  const saved = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  if (saved && typeof saved.counter === 'number') state.counter = saved.counter;
  if (saved && typeof saved.metric1 === 'number') state.metric1 = saved.metric1;
  if (saved && typeof saved.metric1Ts === 'number') state.metric1Ts = saved.metric1Ts;
} catch {}

let __saveTimer;
function saveState() {
  clearTimeout(__saveTimer);
  __saveTimer = setTimeout(() => {
    try { fs.writeFileSync(stateFile, JSON.stringify({
      counter: state.counter,
      metric1: state.metric1,
      metric1Ts: state.metric1Ts
    })); } catch {}
  }, 120);
}



// ---- Ticket APIs ----
app.get('/api/peek-ticket', (req, res) => {
  res.json({ value: state.counter });
});


app.post('/api/next-ticket', (req, res) => {
  state.counter += 1;
  const id = state.counter;
  state.tickets.set(id, {
    id,
    createdTs: Date.now(),
    checkedIn: false,
    status: 'queued',
    updates: [],
    updatedTs: Date.now()
  });
  saveState();
  res.json({ value: id });
});

app.post('/api/reset-ticket', (req, res) => {
  state.counter = 0;
  saveState();
  res.json({ value: state.counter });
});

// ---- metric1 APIs ----
app.get('/api/metric1', (req, res) => {
  res.json({ value: state.metric1, ts: state.metric1Ts });
});

app.post('/api/metric1', (req, res) => {
  const n = parseInt(req.body?.value, 10);
  const safe = Number.isFinite(n) ? Math.max(1, n) : 1;
  state.metric1 = safe;
  state.metric1Ts = Date.now();
  saveState();
  res.json({ value: state.metric1, ts: state.metric1Ts });
});

// ---- Queue events ----

// Mark a ticket as checked-in (optional; wire your guest2 "Check In" click to POST here)
app.post('/api/queue/check-in', (req, res) => {
  const id = parseInt(req.body?.ticketId, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ticketId required' });

  const now = Date.now();
  const t = state.tickets.get(id) || { id, createdTs: now, updates: [] };
  t.checkedIn = true;
  t.status = 'queued';
  t.updatedTs = now;
  t.updates.push({ type: 'check-in', ts: now });
  state.tickets.set(id, t);

  saveState();
  res.json({ ok: true, ticket: t });
});

// Record that a ticket left the queue (user clicked Leave or timeout)
app.post('/api/queue/leave', (req, res) => {
  const id = parseInt(req.body?.ticketId, 10);
  const reason = String(req.body?.reason || 'user');
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ticketId required' });

  const now = Date.now();
  let t = state.tickets.get(id);
  if (!t) {
    t = { id, createdTs: now, updates: [] };
  }
  t.checkedIn = !!t.checkedIn;
  t.status = 'left';
  t.updatedTs = now;
  t.updates.push({ type: 'leave', reason, ts: now });
  state.tickets.set(id, t);

  state.leaves.push({ ticketId: id, reason, ts: now });
  saveState();
  res.json({ ok: true });
});

// Bump counter if a client restores an existing ticket after restart
app.post('/api/queue/restore', (req, res) => {
  const t = parseInt(req.body?.ticketId, 10);
  if (!Number.isFinite(t)) return res.status(400).json({ error: 'ticketId required' });
  state.counter = Math.max(state.counter, t);
  saveState();
  res.json({ counter: state.counter });
});


// (Optional) Inspect a ticket
app.get('/api/queue/ticket/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const t = state.tickets.get(id);
  if (!t) return res.status(404).json({ error: 'not found' });
  res.json(t);
});

// Dev convenience: reset everything
app.post('/api/dev/reset', (req, res) => {
  state.counter = 0;
  state.metric1 = 1;
  state.metric1Ts = Date.now();
  state.tickets.clear();
  state.leaves = [];
  saveState();
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`Server on http://localhost:${PORT}`)
);
