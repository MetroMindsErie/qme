# qME Planning Workspace

This folder is a repo-native product planning space for qME.

Open the deployed planning route to view:

- Roadmap: epic -> theme -> story
- Sprints: current, next, soon, and future work
- Stories: flat backlog view
- Inbox: raw product notes that need triage
- Review: current sprint checkpoint and open decisions

The deployed visual page requests roadmap data through `/api/planning-data` after the access code is accepted. The API reads the `qme-roadmap` row in the Supabase `planning_documents` table when available, and falls back to `roadmap-data.js` if Supabase is not configured yet.

Setup for database-backed planning:

1. Run `supabase-planning-documents.sql` in the qMe MVP Supabase SQL editor.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel for the serverless API.
3. Run `npm run planning:seed` once to copy the current `roadmap-data.js` content into Supabase.

After seeding, live roadmap edits can be made directly in the Supabase `planning_documents.data` JSON without a Git push or Vercel deployment.

The copy under `app/public/planning` is only the static page shell. Do not put roadmap data in `app/public/planning`, because files there are directly web-accessible.

Use this before turning work into GitHub issues or Trello cards. The goal is to preserve product thinking while still making the next engineering slice clear.
