// Small Product Owner edit surface for roadmap story changes.
//
// Use patches for status/title/summary/notes/acceptance changes to existing stories.
// Use additions for new stories without editing a large epic module.
// Use sprintMembership to add/remove story references from sprint lists.
//
// The roadmap generator applies these edits generically; it must never contain
// product-specific story IDs or decisions.

module.exports = {
  patches: {
    "story-storage-health-recovery-contact-prompt": {
      status: "deferred",
      notes:
        "Deferred after Sprint 3 persistence testing. Session viability and recovery identity/contact are separate concerns: optional phone/email can help identify or verify a returning guest, but it does not fix a browser environment that cannot persist qME state. Existing imported/self-registered guest records plus Reconnect to My Event provide a workable recovery path today. Revisit targeted storage-health detection or stronger recovery contact/verification only if fresh event evidence shows repeated session loss or a stronger identity requirement."
    },
    "story-sms-cost-compliance-feasibility": {
      status: "done",
      notes:
        "Sprint 3 discovery complete 2026-08-21. Product decision: GO when a confirmed event need warrants SMS recall; do not implement or purchase sender infrastructure now. Twilio Programmable Messaging is technically appropriate for backend-triggered queue-status alerts, and expected per-message operating cost is low enough that cost is not a blocker at qME event scale. SMS should remain an optional recall/notification channel; in-app/server-side queue state remains authoritative. Future implementation should use explicit guest opt-in, STOP/HELP handling, secure server-side sends, delivery logging, and duplicate-send prevention. July 14 Twilio correspondence stated that the submitted queue-status A2P 10DLC use case/campaign had been approved, but the Twilio console reviewed on 2026-08-21 is still a Trial account and currently shows no Twilio phone number, no Messaging Service, and no visible A2P campaign; resolve that account/setup discrepancy only when SMS is actually needed. The Twilio account used for this work is under ebcooper@growU.biz. No Twilio upgrade, number purchase, or Messaging Service creation is authorized at this time."
    }
  },
  additions: [
    {
      epicId: "epic-post-sotc-sprint-3",
      themeId: "theme-guest-session-recovery",
      story: {
        id: "story-reconnect-confirmation-and-event-refresh",
        title: "Make reconnect confirmation and event return reflect recovered state",
        summary: "After Reconnect to My Event, tell the guest they were reconnected rather than newly checked in, acknowledge existing participation such as an active queue ticket, and ensure Back to Event immediately renders the recovered event/experience state without requiring a manual refresh.",
        status: "ready",
        sprint: "future",
        notes: "Added from 2026-08-25 SOTC baseline acceptance testing. Hannah Oswick successfully reconnected to an existing checked-in registration and existing Gathering ticket after browser data was cleared. The confirmation reused first-time check-in copy (including language telling her to join Headshot later even though she was already in the queue), and after Back to Event the Headshot experience was initially absent until the page was manually refreshed. Preserve the working recovery behavior; fix the confirmation semantics and immediate client-state refresh."
      }
    }
  ],
  sprintMembership: [
    {
      sprintId: "future",
      add: ["story-reconnect-confirmation-and-event-refresh"],
      remove: []
    }
  ]
};
