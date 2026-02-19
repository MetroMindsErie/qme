# qME (Queue Management Experience)

A lightweight queue management prototype with a Node/Express backend and static HTML/CSS/JS frontends for admins and guests.

## What’s in this repo

- Admin UI (set NOW SERVING, view queue stats): [admin/admin_QCE.html](admin/admin_QCE.html)
- Guest landing UI (join queue): [guest/guest_qCE_single_view.html](guest/guest_qCE_single_view.html)
- Guest ticket UI (check in, auto‑leave rules): [guest/guest_queue_ticket.html](guest/guest_queue_ticket.html)
- Server: In‑memory + JSON persistence: [server.js](server.js) — primary for local demos and development

## Quick start

1) Install dependencies at the repo root:

```bash
npm install
```

2) Start the server (development):

```bash
npm start
```

3) Open the UIs in a browser (served by the same server):

- Admin: http://localhost:3000/admin/admin_QCE.html
- Guest (landing): http://localhost:3000/guest/guest_qCE_single_view.html
- Guest (ticket): http://localhost:3000/guest/guest_queue_ticket.html

## Dependencies

Root [package.json](package.json) dependencies:

- `express` (HTTP server + static file hosting)

Guest [package.json](guest/package.json) exists for historical/demo purposes and is not required to run the app.

## Highlights / Features

- **Admin & Guest UIs:** Simple static admin panel and guest ticket views under `admin/` and `guest/`.
- **Real‑time metric sync:** Admin updates NOW SERVING (`metric1`) and guest UIs reflect changes quickly via polling/BroadcastChannel.
- **Ticket lifecycle:** Issue, adopt, check‑in, and auto‑leave logic to manage guest tickets robustly.
- **Cross‑tab sync:** Tickets synchronize across tabs using `localStorage` and `BroadcastChannel` guards.
- **Small, testable API:** Clear endpoints for ticketing and metrics useful for integration and automation tests.
- **Lightweight local persistence:** In‑memory server with small JSON persistence for demo durability.

## Architecture overview

### Backend

- In‑memory server: [server.js](server.js)
  - Queue state is kept in memory and partially persisted to `state.json` (counter + NOW SERVING).
  - Good for local demos; data resets on server restart except the persisted counter/metric.

### Frontend

- Admin UI: [admin/admin_QCE.html](admin/admin_QCE.html) + [admin/admin_QCE.js](admin/admin_QCE.js)
  - Updates NOW SERVING (metric1) and polls the server for last issued ticket.
  - Shows queue size as: $\max(0, \text{lastIssued} - \text{nowServing} + 1)$.

- Guest landing UI: [guest/guest_qCE_single_view.html](guest/guest_qCE_single_view.html) + [guest/guest_qCE_single_view.js](guest/guest_qCE_single_view.js)
  - Displays NOW SERVING.
  - Join queue → navigates to ticket UI. If a ticket already exists, shows “Re‑Join”.

- Guest ticket UI: [guest/guest_queue_ticket.html](guest/guest_queue_ticket.html) + [guest/guest_queue_ticket.js](guest/guest_queue_ticket.js)
  - Claims or adopts a ticket, displays “Your Number”.
  - “Check In” appears when you’re close to being served.
  - Auto‑leave rules if you miss your turn.
  - Cross‑tab sync uses `BroadcastChannel` and `localStorage` mirrors.

## Key flows

- Claiming a ticket: adopt from `localStorage`/`sessionStorage` or POST `/api/next-ticket`.
- Check‑in + Now Serving progression: guest UI compares `metric2` (your number) vs `metric1` (NOW SERVING) to show Check‑In and status.
- Auto‑leave logic: guests are auto‑removed after configurable thresholds if they miss their turn.
- Admin updates: admin UI updates `metric1` via `/api/metric1` and the frontends reflect the change.

## API surface (core)

Common endpoints (server.js):

- `GET /api/peek-ticket` → last issued ticket number
- `POST /api/next-ticket` → issue next ticket
- `GET /api/metric1` → NOW SERVING + timestamp
- `POST /api/metric1` → update NOW SERVING
- `POST /api/queue/restore` → keep counter in sync after restart
- `POST /api/queue/check-in` → mark a ticket checked in
- `POST /api/queue/leave` → mark a ticket left
- `POST /api/dev/reset` → reset queue (dev only)

In‑memory server only:

- `POST /api/reset-ticket` → reset counter to 0

## Data storage

- In‑memory server persists a small JSON file: `state.json` (counter + NOW SERVING)

## Folder map

- [admin/](admin/) — Admin UI (HTML/CSS/JS + images)
- [guest/](guest/) — Guest UIs (HTML/CSS/JS + images)
- [server.js](server.js) — In‑memory server

## Notes

- Static files are served from the repo root by Express; open UIs via http://localhost:3000/...
- The UI includes sample branding/data (logo + venue text) that can be customized in the JS files.
