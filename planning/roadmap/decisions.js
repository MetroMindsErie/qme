module.exports = [
  {
    "id": "decision-sotc-production-archive-and-internal-baseline",
    "title": "SOTC production archive and internal full-data baseline",
    "status": "decided",
    "prompt": "Preserve the July 22 SOTC production event/data as an archive snapshot for review. Keep the existing sotc-rockhall event as the internal full-data working baseline for realistic Sprint 3 testing, with real event structure, names, contact fields, check-ins, queues, and activity as-is. Archive-locking or a separate relational clone can be added later if needed. Track a public sanitized demo clone as future work, not the first Sprint 3 block."
  },
  {
    "id": "decision-session-recovery-from-server-truth",
    "title": "Guest recovery should reconnect to server-side truth",
    "status": "decided",
    "prompt": "If qMe does not recognize the browser after a guest reopens or rescans the QR code, the guest should be able to recover by finding their registration again and reconnecting to the existing event check-in/queue state. The product fix is not to assume browser storage can be made perfect; recovery must use verified server-side participation without creating duplicates."
  },
  {
    "id": "decision-sms-feasibility-before-sms-promise",
    "title": "SMS requires cost and compliance feasibility before product promise",
    "status": "decided",
    "prompt": "SMS may become an important recall channel, and the existing Twilio direction should be evaluated in Sprint 3. Do not promise or broadly enable SMS until provider setup, sender registration, monthly/per-message cost, consent/STOP/HELP language, secure server-side triggering, delivery logging, and duplicate prevention are understood."
  },
  {
    "id": "decision-authorized-queue-state-override",
    "title": "Queue override is authorized state management",
    "status": "decided",
    "prompt": "Operational override is broader than letting a guest go next. Event Admin or approved station authority may need to move guests between valid states such as Waiting, Gathering, Nearby, Your Turn, Not Here, and recovery paths. Overrides may exceed normal automation settings when explicitly authorized, but must be visible, confirmed where disruptive, and auditable."
  },
  {
    "id": "decision-guest-admin-context-separation",
    "title": "Guest participation is separate from admin/staff operations",
    "status": "decided",
    "prompt": "A person may simultaneously be qME superadmin, organization admin, event admin, event staff, and guest, but signing into admin is not the same as participating as a guest. Guest participation continues through the guest-session model; future credential management may unify identity, but operational context remains separate."
  },
  {
    "id": "decision-recoverable-assets-contact-required",
    "title": "Recoverable assets require recoverable contact before grant",
    "status": "decided",
    "prompt": "Guest participation remains accountless by default, but recoverable assets such as complimentary or purchased professional headshots require email or mobile number before the benefit is granted. This is about recoverability, not authentication."
  },
  {
    "id": "decision-needs-more-info-recovery-contact",
    "title": "Missing recovery contact creates Needs More Info state",
    "status": "decided",
    "prompt": "When staff selects Student or Professional + Photo and no recovery contact exists, the system should automatically put the guest into Needs More Info. The guest returns to check-in with prior information retained, provides email or phone, and resubmits. Staff sees Waiting for recovery contact, then Ready to Check In, and still completes check-in manually."
  },
  {
    "id": "decision-event-authority-hierarchy",
    "title": "Event authority hierarchy and station authority",
    "status": "decided",
    "prompt": "Authority hierarchy is qME superadmin, organization admin, event admin, and event staff. Event staff are assigned to one or more event activities/stations. A station may optionally distinguish Station Staff from Station Admin, but that distinction is station-defined rather than platform-defined: some stations may have no practical difference, while others may use Station Admin for elevated local actions such as check-in photo credit grants or guest classification resolution. Event-wide/destructive actions such as reset, event configuration, live event control settings, destructive operations, and cross-station configuration remain event admin or higher."
  },
  {
    "id": "decision-queue-commitment-model",
    "title": "Queue Stage, State, and history model",
    "status": "decided",
    "prompt": "Distinguish Stage, State, and timestamps/history. Stage answers where the guest is in the workflow: Waiting -> Gathering -> Your Turn -> Completed. State answers what additional current condition affects treatment inside that stage: Waiting may be null or Cooling Down; Gathering may be null, On My Way, or Nearby. On My Way indicates response/commitment but does not make the guest callable. Nearby is the stronger Gathering State and normal progression to Your Turn requires Gathering + Nearby. Timestamps/history record meaningful actions and transitions such as joined, Gathering, On My Way, Nearby, release, service start, completion, Not Here, Return to Waiting/cooldown, and admin override. During Sprint 3, Nearby may remain derived from the tested underlying representation while the product UI/CSV exposes Stage and State separately. On My Way must receive the smallest safe additive durable marker needed for current behavior (preferably a nullable timestamp) rather than being omitted because legacy storage did not include it. Broader schema normalization remains a separate deliberate structural pass."
  },
  {
    "id": "decision-live-event-controls",
    "title": "Live Event Controls are operational, not setup",
    "status": "decided",
    "prompt": "Distinguish Event Setup, Live Operations, and Live Event Controls. Controls such as queue flow mode, gathering target, gathering max, stale timing, pause/resume, and intake behavior may change during live operations and should be editable only by event admin or higher."
  },
  {
    "id": "decision-experiences-compose-capabilities",
    "title": "Experiences compose reusable platform capabilities",
    "status": "decided",
    "prompt": "Experiences are the primary product unit. Queue is one reusable capability, not the definition of an experience. Experiences may compose capabilities such as queue, ordering, menu, notifications, status tracking, staff assignment, resources, and passport. Experience Types should be reusable across multiple events, multiple organizations, and multiple times within the same event; avoid SOTC-specific implementations whenever a reusable Experience Type is possible."
  },
  {
    "id": "decision-experience-service-relationship",
    "title": "What is the relationship between Experience and Service?",
    "status": "open",
    "prompt": "Headshots, Resume Reviews, and Food Ordering appear to behave like services, while Sponsors, Galleries, Resources, and Passport do not naturally behave as services. Do not introduce a Service layer yet. Let the answer emerge while designing Registration, Headshots, Resume Reviews, and Food Ordering."
  },
  {
    "id": "decision-event-scoped-guest-profile",
    "title": "Guest Profile is event-scoped",
    "status": "decided",
    "prompt": "Guest Profile is event-scoped for now and contains identity, attributes, access, and credits for that event. It should not be treated as a full cross-event user account until product evidence requires it."
  },
  {
    "id": "decision-station-specific-credits",
    "title": "Credits stay station/experience-specific for now",
    "status": "decided",
    "prompt": "Credits are experience or station specific for now, such as Headshot Credit, Cookie Credit, Drink Credit, or Bouquet Credit. Do not build a generalized credit engine yet; let multiple concrete experience designs reveal what needs to be common."
  },
  {
    "id": "decision-org-reusable-definition-layer",
    "title": "Possible reusable layer between Experience Type and Station",
    "status": "open",
    "prompt": "A likely missing layer exists between Experience Type and Station: an organization-owned reusable definition that can be placed into one or more stations or events. Examples include Food & Beverage > Lemonade Stand > West Patio Station and Professional Headshots > Corporate Headshot > Photographer A. Do not implement yet; validate through Registration, Headshots, Resume Reviews, and Food."
  },
  {
    "id": "decision-peony-demo-preservation",
    "title": "Peony Festival remains the working demo",
    "status": "decided",
    "prompt": "Peony Festival guest/queue flow is good enough for now and should remain demonstrable while multi-organization and multi-event foundations are built."
  },
  {
    "id": "decision-planning-workspace-source",
    "title": "Planning workspace is source of truth for now",
    "status": "decided",
    "prompt": "Use the repo-based planning workspace as the product source of truth for the next few weeks."
  },
  {
    "id": "decision-sotc-mvp",
    "title": "What must be real by July 22?",
    "status": "discovery",
    "prompt": "Likely thin MVP: organization-owned SOTC event, public event page with structured experience cards, registration QR/name entry with admin tagging, headshot queue, resume review queue, and mixer resources/digital brochure cards. Exact demoable vs operational reliability line remains open."
  },
  {
    "id": "decision-sotc-slug",
    "title": "SOTC public slug",
    "status": "decided",
    "prompt": "Use sotc-rock-hall for the public event slug. Keep SOTCRH as internal shorthand only."
  },
  {
    "id": "decision-registration-import-additive-nondestructive",
    "title": "Registration imports are additive and non-destructive",
    "status": "decided",
    "prompt": "External registration systems provide source registration facts; qME owns the evolving event participation built on top of them. Repeated full-file imports should identify registrations qME already knows and add only previously unseen source registrations. Never wipe, recreate, or silently overwrite existing qME sessions, check-ins, queues, credits, voting, profile additions, history, or other participation because a newer source export was uploaded. Preserve the full imported source record and provenance; changed source values on existing registrations require explicit future synchronization policy rather than automatic overwrite."
  },
  {
    "id": "decision-sotc-attendee-import",
    "title": "Manual SOTC attendee import is allowed after dry-run review",
    "status": "decided",
    "prompt": "The earlier no-import decision held until actual Eventbrite data was available. As of 2026-07-20, the cleaned SOTC-Mixer-List.csv has passed dry-run review with 191 importable attendees and no duplicate or missing required fields. A bounded manual import is acceptable for SOTC, with imported records kept separate from guest sessions/check-ins, Headshot entitlement derived server-side from the source Price Tier, and Reset Test Data clearing rehearsal linkage without deleting the source attendee list. Future API sync remains deferred."
  },
  {
    "id": "decision-sotc-photo-states",
    "title": "SOTC Headshot authorization model",
    "status": "decided",
    "prompt": "Retire the Student/Professional photo-state model as active qME authorization. For current SOTC operations qME needs: registered/imported or manual fallback; pending staff confirmation or checked in; Headshot entitled or not; Headshot credit unused or used. Student/Professional values from the imported attendee file may remain source metadata for reporting or nametag context, but they do not directly authorize Headshot queue access."
  },
  {
    "id": "decision-sotc-day-one-queues",
    "title": "SOTC day-one queue/service flows",
    "status": "decided",
    "prompt": "Day-one queue/service flows are registration check-in, professional headshots, and resume review."
  },
  {
    "id": "decision-ece-language",
    "title": "Should product language use experience or eCe?",
    "status": "open",
    "prompt": "The code/product model needs a clear term for event modules. Experience may be clearer for users; eCe may remain internal if useful."
  },
  {
    "id": "decision-headshot-payment",
    "title": "How should professional photo access be acknowledged?",
    "status": "decided",
    "prompt": "For the first SOTC slice, admin/staff marking at registration/check-in is enough. Payment or purchase workflow is deferred."
  },
  {
    "id": "decision-roadmap-auth",
    "title": "Real roadmap auth is deferred",
    "status": "decided",
    "prompt": "Current code/API gate is acceptable while usage is limited to the owner and possibly one trusted collaborator. Revisit real auth before adding sensitive patent/customer details or expanding collaborators."
  }
];
