module.exports = [
  {
    "id": "completed-sprint-3-post-sotc-operational-hardening",
    "title": "Completed: Sprint 3 Post-SOTC Operational Hardening",
    "completedDate": "2026-08-25",
    "goal": "Turn the July 22 SOTC production learning into a more reliable operating system: preserve production evidence, create an internal full-data baseline, improve guest recovery, add admin CSV exports, evaluate SMS costs/compliance, and make operator controls more visible without starting broad new platform expansion.",
    "summary": "Sprint 3 converted Rock Hall production evidence into a substantially more operable qME baseline. Production data is preserved and resettable for testing; attendance and Headshot activity can be exported; lost browser identity can reconnect to authoritative server-side participation; queue Stage/State/history, authorized overrides, cooldown, stale Gathering, Manual/Auto flow, On My Way, Nearby, and capacity behavior were exercised live; and operators now see meaningful queue conditions without needing unnecessary configuration access. SMS feasibility was resolved as a future event-triggered GO rather than an immediate implementation. One storage-health/contact prompt was intentionally deferred after testing showed recovery identity and browser persistence are separate problems.",
    "storyIds": [
      "story-sotc-production-archive-and-baselines",
      "story-sotc-admin-csv-exports",
      "story-guest-session-persistence-diagnostics",
      "story-already-checked-in-recovery",
      "story-storage-health-recovery-contact-prompt",
      "story-sms-cost-compliance-feasibility",
      "story-admin-guest-search-state-reconciliation",
      "story-authorized-queue-state-overrides",
      "story-queue-automation-observability",
      "story-station-operational-control-visibility",
      "story-guest-on-my-way-action"
    ],
    "notes": [
      "Archive/Baseline and reporting work preserved the July 22 SOTC record while keeping sotc-rockhall usable as an internal full-data acceptance environment.",
      "Guest recovery now treats browser/localStorage identity as a hint and authoritative server-side check-in, queue, credit, and completion data as truth.",
      "Queue operations were live-accepted across Waiting, Gathering, On My Way, Nearby, Your Turn, Completed, Not Here, Return to Waiting/cooldown, stale recovery, and authorized overrides.",
      "Fresh On My Way is an affirmative Gathering commitment that counts toward effective Target/Max but is not callable until Nearby; expired OMW becomes stale/recoverable and no longer displays as current OMW.",
      "Station staff remain focused on current operational condition rather than underlying Event Admin configuration; compact summaries and Live Line expose the readiness information needed to operate.",
      "The storage-health/recovery-contact prompt is intentionally deferred; SMS remains a future event-need-driven implementation rather than active Sprint 3 delivery."
    ]
  },
  {
    "id": "completed-sprint-2-foundation",
    "title": "Completed: Sprint 2 Organization, Roles, Auth, and RLS Foundation",
    "completedDate": "2026-07-01",
    "goal": "Build the minimum organization, admin, staff, authentication, and RLS foundation needed before the SOTC pilot can move from guided alpha into real event readiness.",
    "summary": "Sprint 2 moved qME from founder-operated demo toward organization-ready pilot: named admin identities, organization/event ownership, staff assignments, guest session tokens, role-scoped admin access, authenticated RPC boundaries, and audit logging for newer sensitive staff/admin actions are now in place. qME is not fully production-hardened yet, but the remaining risk has shifted from architecture design to validation and hardening.",
    "storyIds": [
      "story-governance-principles-foundation",
      "story-org-table",
      "story-preserve-peony-demo",
      "story-seed-sotc-org",
      "story-admin-org-role",
      "story-org-staff",
      "story-authentication-cleanup",
      "story-planning-admin-access-controls",
      "story-event-org-owner",
      "story-event-operational-mode-config",
      "story-admin-event-activity-status-overview",
      "story-admin-queue-tabs",
      "story-stale-queue-blocker-recovery",
      "story-sotc-admin-staff-rls-hardening"
    ],
    "notes": [
      "The old temporary admin passphrase path was removed.",
      "Jalani can sign in with named SOTC event-admin access and act only inside the SOTC event scope.",
      "Guest-owned actions and staff/admin-owned actions are separated more clearly through guest-token RPCs and authenticated admin/staff RPCs.",
      "Queue and check-in operational actions now have role-checked RPC boundaries and basic audit logging.",
      "Temporary password/onboarding cleanup remains visible debt and moves into Operational Readiness."
    ]
  },
  {
    "id": "completed-sotc-alpha-ui-stabilization",
    "title": "Completed: SOTC Alpha UI Stabilization",
    "completedDate": "2026-06-26",
    "goal": "Resolve the obvious SOTC alpha-test UI, refresh, messaging, and recovery issues before starting role/auth/database hardening.",
    "summary": "Sprint 1 alpha follow-up is complete: calm refresh behavior, mobile button/layout polish, headshot/standby messaging, Not Here guest recovery, auto-flow recovery when admin is closed, and hidden internal ticket numbers on guest pilot screens are resolved.",
    "storyIds": [
      "story-sotc-calm-refresh",
      "story-sotc-mobile-layout-polish",
      "story-headshot-queue",
      "story-sotc-not-here-recovery"
    ],
    "notes": [
      "The alpha test with Jalani Ball and the SOTC student group produced polish findings, not a rejection of the core flow.",
      "Guests should see stages and clear instructions, not internal ticket mechanics.",
      "Admin/staff can retain operational identifiers and controls.",
      "Next sprint should focus on organization foundation, admin/staff roles, authentication cleanup, and Supabase RLS hardening."
    ]
  },
  {
    "id": "completed-planning-cleanup",
    "title": "Completed: Planning Workspace and Demo Stabilization",
    "completedDate": "2026-06-11",
    "goal": "Get qME cleaned up enough to trust the Peony Festival flow, then create a product roadmap/planning workspace for SOTC and multi-org work.",
    "summary": "Peony Festival is stable enough to demonstrate; Bouquet Bar access, fresh reset, kiosk bad-slug handling, legacy cleanup, Node/test setup, roadmap deployment, planning data protection, Trello import, governance review, and pre-multi-org cleanup are complete.",
    "storyIds": [
      "story-planning-workspace",
      "story-roadmap-data-model",
      "story-cleanup-before-multi-org",
      "story-admin-update-guest-access",
      "story-import-trello-detail-cards",
      "story-triage-inbox",
      "story-bouquet-access-fixed"
    ],
    "notes": [
      "Peony Festival guest flow is good enough for now and should remain demonstrable.",
      "The planning workspace is the source of truth for the next few weeks.",
      "SOTC MVP detail is intentionally deferred until the foundation work starts.",
      "Real roadmap auth is deferred while usage remains limited."
    ]
  }
];
