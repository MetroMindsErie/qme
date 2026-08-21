module.exports = [
  {
    "id": "inbox-guest-event-home-evolving-information-architecture",
    "title": "Evolve guest Event Home beyond indefinite long scroll",
    "disposition": "future",
    "summary": "As Event Home gains event information, active experiences, personal status, voting, networking, resources, and other guest functions, evolve the guest information architecture rather than allowing one increasingly long scrolling page. Do not prescribe tabs or another navigation pattern yet; let the structure emerge from real guest needs and Experience Types.",
    "linkedStoryIds": [
      "story-sotc-pre-alpha-event-guide",
      "story-personal-agenda"
    ],
    "createdAt": "2026-08-19T00:00:00.000Z"
  },
  {
    "id": "inbox-bubbles-physical-networking-orchestration",
    "title": "Bubbles - opt-in physical networking orchestration",
    "disposition": "future",
    "summary": "Far-future networking concept: people exist in overlapping bubbles such as university, class/year, local alumni community, employer, industry, neighborhood, friends, parents, interests, and the temporary population of a particular event. Some bubbles come from registration/source data, some may be inferred, some explicitly chosen, and some may exist only for the event. qME could use permitted registration/profile attributes, optional guest-supplied information, and event context to form temporary pair or small-group connection bubbles. Rather than behaving like a dating-app directory, participants opt in and receive a shared highly visible identifier such as a giant number on the phone: Find #27. Guests physically look around the room, hold up phones, find the matching person/group, then optionally confirm they found each other and reveal why qME connected them or receive an icebreaker. Group variants could form temporary physical bubbles and direct them to a venue area. Known-to-qME, allowed-for-matching, and allowed-to-reveal are separate permissions; data-derived membership never automatically authorizes disclosure. Progressive profile/consent may later let guests choose which company, university, role, or interest information can be used. The first experiment should test the physical interaction before intelligent matching: randomly pair willing participants, show matching giant numbers, ask them to find one another, and observe whether the interaction creates movement, laughter, easy stranger approaches, and useful connection. Only after proving the Experience should qME invest in deciding who should match with whom. This is consistent with qME orchestrating physical event flow: Headshots orchestrates return to service, future food flow may orchestrate release, and Bubbles could orchestrate a reason to connect.",
    "linkedStoryIds": [
      "story-networking-matching",
      "story-survey-icons"
    ],
    "createdAt": "2026-08-19T00:00:00.000Z"
  },
  {
    "id": "inbox-post-ipitch-provisional-patent-review",
    "title": "Post-I-Pitch provisional patent review",
    "disposition": "future",
    "summary": "After the September 3 I-Pitch event, review the January 2026 provisional patent against what qME has learned and demonstrated through Peony, SOTC, I-Pitch, and intervening product discovery. Separate original concepts reinforced in practice, original concepts that evolved, new concepts derived from event operations, speculative/future concepts such as Bubbles, and ideas that proved unimportant. Patentability/claim strategy and prior-art analysis remain attorney work; the product task is to preserve dated learning and identify what the invention appears to have become through practice.",
    "linkedStoryIds": [],
    "createdAt": "2026-08-19T00:00:00.000Z"
  },
  {
    "id": "inbox-guest-self-standby-open-capacity",
    "title": "Guest self-Standby for open service capacity",
    "disposition": "future",
    "summary": "Allow a guest who is still back in the normal Waiting order to declare that they are physically nearby and willing to fill otherwise unused service capacity. Standby should not jump normally ready/callable guests or change the guest's normal queue order; it creates an additional availability signal that qME may use only when normal callable capacity is empty. Host Console or another physical-presence interaction may later strengthen the signal.",
    "linkedStoryIds": [
      "story-authorized-queue-state-overrides",
      "story-location-beacons"
    ],
    "createdAt": "2026-08-19T00:00:00.000Z"
  },
  {
    "id": "inbox-intelligent-queue-readiness-management",
    "title": "Intelligent queue readiness management",
    "disposition": "future",
    "summary": "Move beyond managing only raw Gathering counts toward managing expected near-term service readiness. Future logic can use Stage/State, elapsed time, Nearby and On My Way response, stale/unresponsive Gathering guests, current service cadence, Not Here behavior, standby availability, and later location signals to decide when additional guests should be recalled. Start with transparent deterministic scoring/rules; consider AI/ML only after enough production data exists. Operators should be able to see why qME invited additional guests.",
    "linkedStoryIds": [
      "story-queue-automation-observability",
      "story-stale-queue-blocker-recovery",
      "story-queue-rule-configuration"
    ],
    "createdAt": "2026-08-19T00:00:00.000Z"
  },
  {
    "id": "inbox-cookie-event-product-experiment",
    "title": "Cookie event as tiny product experiment",
    "disposition": "future",
    "summary": "Treat a cookie event as a small complete product experiment, not a commercial feature. Use it to validate ordering, station-specific credits, approvals, fulfillment, and feedback with the smallest possible event surface only after the secure ordering replacement path exists. Do not use it to justify a generalized credit engine, payment/POS integration, or service abstraction yet.",
    "linkedStoryIds": [
      "story-experience-configuration",
      "story-experience-hierarchy-grouping",
      "story-guest-intentions"
    ],
    "createdAt": "2026-07-08T00:00:00.000Z"
  },
  {
    "id": "inbox-test-lab-group-dinner-order",
    "title": "qME Test Lab group dinner order pilot",
    "disposition": "future",
    "summary": "Quick dinner test: guests check in with first and last name, join a Dinner Order feature, add tapas/drink items with quantities, see what they submitted, add more, remove their own unsubmitted items, and admin can send gathered items to an ordered bucket. Test went well but showed that a real group-order feature would need structured menu selection rather than free typing, menu URL/PDF support, per-item quantities per order, fractional/minimum quantities such as half portions, and the ability to increment an existing item. July 17 security update: ordering is blocked until the prior group-order pilot is replaced with guest-session-owned order records, verified event/guest ownership, scoped RPCs, station/event staff authorization, server-side quantity/state validation, idempotency, audit logging, and explicit draft/submitted/approved/fulfilled states. This remains a fun future qME facilitation feature, but not core SOTC readiness.",
    "linkedStoryIds": [
      "story-guest-intentions",
      "story-queue-length-readiness-states",
      "story-testing-workspace-issue-capture"
    ],
    "createdAt": "2026-06-28T00:00:00.000Z"
  },
  {
    "id": "inbox-ece-visible-before-check-in-option",
    "title": "eCe visibility before completed check-in",
    "disposition": "promote",
    "summary": "Add an eCe setup option controlling whether a feature is visible before completed event check-in. Some features should be hidden entirely until check-in is complete; others should remain visible with a locked/status message such as check in first, waiting for host check-in, photo credit required, or join paused. This should be configured per eCe rather than hard-coded by feature type.",
    "linkedStoryIds": [
      "story-ece-activation-reset",
      "story-guest-condition-engine"
    ],
    "createdAt": "2026-06-29T00:00:00.000Z"
  },
  {
    "id": "inbox-remind-db-hardening-student-after-role-structure",
    "title": "Reminder: re-engage computer engineering student for database hardening review",
    "disposition": "ready",
    "summary": "The platform stabilization pass now has enough concrete organization, admin, staff, guest-token, RLS, and RPC structure for a bounded review. Re-engage the computer engineering student and ask him to critique the implemented foundation: role model, guest token approach, RLS policies, RPC boundaries, audit logging, remaining permissive policies, and obvious ways a guest or staff user could overreach.",
    "linkedStoryIds": [
      "story-sotc-admin-staff-rls-hardening",
      "story-foundation-external-db-security-review"
    ],
    "createdAt": "2026-06-26T00:00:00.000Z"
  },
  {
    "id": "inbox-guest-status-color-system",
    "title": "Guest card status color system",
    "disposition": "idea",
    "summary": "Define a consistent visual system for guest card states so color explains meaning instead of just decoration. Clarify why completed is green, how inQ/waiting should differ from completed, and how paused, locked, photo-credit-required, and active states should read on event cards.",
    "linkedStoryIds": [
      "story-sotc-pilot-ops-controls"
    ],
    "createdAt": "2026-06-20T00:00:00.000Z"
  },
  {
    "id": "inbox-queue-length-readiness-states",
    "title": "Queue length and guest readiness states",
    "disposition": "idea",
    "summary": "Explore queue messaging beyond exact queue length: waiting, almost ready, nearby/ready, released/your turn, served, and what happens when a released guest is marked Not here. Current pilot can stay as-is, but future fairness rules should evaluate practical Not here options: a soft penalty that sorts recently missed guests after other ready guests, a simple penalty that clears nearby and puts them behind already-ready standby guests, or a hard penalty that sends them back to waiting. Goal is to avoid false precision while making readiness and fairness obvious to staff and guests.",
    "linkedStoryIds": [
      "story-sotc-not-here-recovery"
    ],
    "createdAt": "2026-06-14T00:00:00.000Z"
  },
  {
    "id": "inbox-testing-workspace-issue-capture",
    "title": "Testing workspace and issue capture",
    "disposition": "idea",
    "summary": "Consider a separate testing environment or planning tab for QA notes, test plans, issue reports, screenshots/images, and event testing evidence. Start with quick text capture; image support needs a storage/security decision.",
    "linkedStoryIds": [],
    "createdAt": "2026-06-14T00:00:00.000Z"
  },
  {
    "id": "inbox-headshot-tags",
    "title": "Headshot tags from user notes",
    "disposition": "superseded",
    "summary": "Historical pre-import direction: Student, professional, student-took-photo, professional-with-photo, professional-took-photo. Superseded for SOTC by imported-registration entitlement and professional_headshot credits; Student/Professional may remain source metadata only.",
    "linkedStoryIds": [
      "story-headshot-tags",
      "story-guest-condition-engine"
    ]
  },
  {
    "id": "inbox-pay-at-desk",
    "title": "Headshot queue visibility and photo-credit gate",
    "disposition": "consider",
    "summary": "Keep the Headshot Photographer queue visible to checked-in guests even when they do not have a photo credit, because the queue itself communicates a paid/special-access station. Guests without credit should see a quiet locked state such as photo credit required, not a join action. Guests with available credit can join; guests who completed/used the credit see completed/history. Future purchase or pay-at-desk flow can attach to this locked state.",
    "linkedStoryIds": [
      "story-headshot-queue",
      "story-guest-condition-engine"
    ]
  },
  {
    "id": "inbox-standby-near-booth",
    "title": "Standby near booth and scheduling blocks",
    "disposition": "future",
    "summary": "Need people near booth when almost ready, but not physically waiting the whole time. May use location, standby, or call-ahead behavior.",
    "linkedStoryIds": [
      "story-headshot-queue",
      "story-location-beacons"
    ]
  },
  {
    "id": "inbox-guest-intentions",
    "title": "Guest intentions - bottled future concept",
    "disposition": "future",
    "summary": "Future concept only: qME may let guests express what they want, need, are interested in, or are willing to do during an event through explicit actions or lightweight prompts. Intentions may be momentary, Experience-specific, or event-long and could eventually support networking, standby/open capacity, food timing, recommendations, activities, or other event orchestration. Do not build a generalized intentions engine until concrete Experience Types demonstrate what needs to be common.",
    "linkedStoryIds": [
      "story-guest-intentions"
    ]
  },
  {
    "id": "inbox-survey-icons",
    "title": "Surveys and interest icons",
    "disposition": "future",
    "summary": "Capture interests and different groups using simple icons; later can drive networking or recommendations.",
    "linkedStoryIds": [
      "story-survey-icons",
      "story-networking-matching"
    ]
  },
  {
    "id": "inbox-trello-sotc-pdf-import",
    "title": "SOTC Trello PDF import",
    "disposition": "promote",
    "summary": "sotc planning doc.pdf contained 11 pages of Trello detail. Promoted missing items around role permissions/audits, event schedules/templates, expie configuration, eCe lifecycle, queue rules, notifications, SOTC attendee import/QR entry, and admin operations.",
    "linkedStoryIds": [
      "story-role-permissions-audit",
      "story-event-schedules-recurrence",
      "story-event-type-templates",
      "story-experience-configuration",
      "story-ece-activation-reset",
      "story-sotc-qr-entry",
      "story-attendee-import",
      "story-queue-rule-configuration",
      "story-notification-policies"
    ]
  }
];
