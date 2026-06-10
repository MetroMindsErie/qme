# qME Planning Workspace

This folder is a repo-native product planning space for qME.

Open the deployed planning route to view:

- Roadmap: epic -> theme -> story
- Sprints: current, next, soon, and future work
- Stories: flat backlog view
- Inbox: raw product notes that need triage
- Review: current sprint checkpoint and open decisions

`roadmap-data.js` is the source of truth. The deployed visual page requests it through `/api/planning-data` after the access code is accepted, so a story can appear in both the roadmap and sprint views without being duplicated.

The copy under `app/public/planning` is only the static page shell. Do not put roadmap data in `app/public/planning`, because files there are directly web-accessible.

Use this before turning work into GitHub issues or Trello cards. The goal is to preserve product thinking while still making the next engineering slice clear.
