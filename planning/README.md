# qME Planning Workspace

This folder is a repo-native product planning space for qME.

Open `index.html` in a browser to view:

- Roadmap: epic -> theme -> story
- Sprints: current, next, soon, and future work
- Stories: flat backlog view
- Inbox: raw product notes that need triage
- Review: current sprint checkpoint and open decisions

`roadmap-data.js` is the source of truth. The visual page reads from that file, so a story can appear in both the roadmap and sprint views without being duplicated.

Use this before turning work into GitHub issues or Trello cards. The goal is to preserve product thinking while still making the next engineering slice clear.
