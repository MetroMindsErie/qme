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
  additions: [],
  sprintMembership: []
};
