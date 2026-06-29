# qME Planning Workspace

This folder is a repo-native product planning space for qME.

Open the deployed planning route to view:

- Roadmap: epic -> theme -> story
- Sprints: current, next, soon, and future work
- Stories: flat backlog view
- Inbox: raw product notes that need triage
- Review: current sprint checkpoint and open decisions

The deployed visual page requests roadmap data through `/api/planning-data` after a named qME superadmin signs in through `/admin`. The API verifies the Supabase Auth session against `admin_principals` and `platform_roles` before reading or writing the `qme-roadmap` row in the Supabase `planning_documents` table. If the planning row is unavailable, the API falls back to `roadmap-data.js`.

Setup for database-backed planning:

1. Run `supabase-planning-documents.sql` in the qMe MVP Supabase SQL editor.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel for the serverless API.
3. Create/link the operator as an active `admin_principals` row with an active `platform_roles.role = 'superadmin'`.
4. Run `npm run planning:seed` once to copy the current `roadmap-data.js` content into Supabase.

After seeding, live roadmap edits can be made directly in the Supabase `planning_documents.data` JSON without a Git push or Vercel deployment.

The copy under `app/public/planning` is only the static page shell. Do not put roadmap data in `app/public/planning`, because files there are directly web-accessible.

Use this before turning work into GitHub issues or Trello cards. The goal is to preserve product thinking while still making the next engineering slice clear.
