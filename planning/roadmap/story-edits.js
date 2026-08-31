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
    },
    "story-queue-automation-observability": {
      status: "done",
      notes:
        "Completed by live SOTC baseline acceptance on 2026-08-25. Operators can see Cooling Down with remaining time, Manual/Auto mode behavior, effective Gathering composition through compact OMW/NRBY/STALE subcounts, and Apply Flow/recovery behavior without treating raw stale Gathering as active capacity. Not Here and Return to Waiting were verified through cooldown back to ordinary Waiting. Effective Gathering replenishment was verified in Manual and Auto, including stale guests not starving invitations. Final On My Way acceptance also confirmed fresh OMW counts toward effective Target/Max while remaining non-callable until Nearby, and expired OMW becomes stale/recoverable rather than continuing to block capacity."
    },
    "story-station-operational-control-visibility": {
      status: "done",
      notes:
        "Completed by Product Owner live acceptance on 2026-08-25. Event Admin/Superadmin Settings exposes Join Status, Run mode, Gathering Target/Max, Gathering stale timing, Not Here cooldown, and Active Released with explanatory copy. Product review clarified that station/check-in staff do not need read-only access to underlying queue configuration merely to operate the station; their Live Line already exposes the current operational condition through queue totals, OMW/NRBY/STALE readiness detail, Released active, guest Stage/State/timestamps, cooldown visibility, search/order, and authorized actions. Product principle: station operators should understand the current operational condition without needing access to the configuration that produces it. Final consistency acceptance added fresh OMW to the compact higher-level queue summary only when nonzero; live testing confirmed OMW appears while fresh and disappears on expiry while Gathering and Nearby totals remain correct."
    },
    "story-remove-hardcoded-demo-assumptions": {
      sprint: "now"
    },
    "story-sotc-notification-july-fallback": {
      sprint: "now"
    },
    "story-headshot-low-staff-operating-model": {
      sprint: "now"
    },
    "story-headshot-service-start-acknowledgement": {
      sprint: "now"
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
        status: "done",
        acceptanceCriteria: [
          "A guest in Gathering can explicitly mark On My Way before marking Nearby.",
          "On My Way remains Stage = Gathering and is shown as State = On My Way on guest and admin surfaces.",
          "On My Way counts as an active Gathering commitment for flow capacity while it remains fresh, but it is not callable and cannot normally progress to Your Turn until the guest marks Nearby.",
          "The guest can subsequently mark Nearby without losing queue position or participation history.",
          "Admin history records the guest On My Way transition consistently with other Stage/State transitions.",
          "Initial implementation may use the existing Gathering stale timing; a distinct longer On My Way stale policy should be introduced only if event evidence justifies it."
        ],
        notes: "Completed by live SOTC acceptance on 2026-08-25. Guest-facing I'm On My Way is available from Gathering, starts a fresh OMW window using the configured Gathering stale duration, counts toward effective Target/Max while fresh, remains non-callable until Nearby, and transitions cleanly OMW -> Nearby. Capacity acceptance with 1 OMW + 2 Nearby + 4 stale confirmed one Nearby released and exactly five new invitations, proving OMW counted correctly. Expired OMW remains Gathering/recoverable, moves from OMW to STALE operationally, no longer displays as current On My Way, and open guest/main-event surfaces now re-evaluate automatically at the freshness deadline. Approved Gathering guidance is: Let us know when you're heading over by tapping I'm On My Way. When you arrive at the station, tap I'm Nearby."
      }
    }
  ],
  sprintMembership: [
    {
      sprintId: "future",
      add: ["story-reconnect-confirmation-and-event-refresh"],
      remove: ["story-guest-on-my-way-action"]
    }
  ]
};
