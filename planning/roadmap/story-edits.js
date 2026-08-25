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
    },
    {
      epicId: "epic-post-sotc-sprint-3",
      themeId: "theme-recall-and-operator-controls",
      story: {
        id: "story-guest-on-my-way-action",
        title: "Let Gathering guests say On My Way",
        summary: "Give a guest who has been invited to Gathering an explicit On My Way action so qME can distinguish an acknowledged commitment from an unanswered invitation before the guest becomes Nearby.",
        status: "ready",
        sprint: "future",
        acceptanceCriteria: [
          "A guest in Gathering can explicitly mark On My Way before marking Nearby.",
          "On My Way remains Stage = Gathering and is shown as State = On My Way on guest and admin surfaces.",
          "On My Way counts as an active Gathering commitment for flow capacity while it remains fresh, but it is not callable and cannot normally progress to Your Turn until the guest marks Nearby.",
          "The guest can subsequently mark Nearby without losing queue position or participation history.",
          "Admin history records the guest On My Way transition consistently with other Stage/State transitions.",
          "Initial implementation may use the existing Gathering stale timing; a distinct longer On My Way stale policy should be introduced only if event evidence justifies it."
        ],
        notes: "Added from 2026-08-25 effective-Gathering acceptance testing. On My Way already exists in ticket data, admin override/state handling, and the guest progress indicator, but the live guest Gathering screen currently offers no On My Way action; the guest can only mark Nearby. Product intent is Invited/unconfirmed -> On My Way -> Nearby, with On My Way representing an affirmative commitment that counts toward effective Gathering but is not callable. Keep this near-term because it improves the signal used by automatic replenishment and will become especially useful with future SMS recall."
      }
    }
  ],
  sprintMembership: [
    {
      sprintId: "future",
      add: [
        "story-reconnect-confirmation-and-event-refresh",
        "story-guest-on-my-way-action"
      ],
      remove: []
    }
  ]
};
