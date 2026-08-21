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
    }
  },
  additions: [],
  sprintMembership: []
};
