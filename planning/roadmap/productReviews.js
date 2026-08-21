module.exports = [
  {
    "id": "review-post-sotc-sprint-3-rebaseline-2026-08-18",
    "date": "2026-08-18",
    "trigger": "The July 22 SOTC Rock Hall event completed and produced enough production evidence to rebaseline qMe from pre-event operational readiness into post-event operational hardening.",
    "summary": "qMe successfully moved beyond a single demo and proved meaningful event value at SOTC: guests could check in, use digital Headshot queues, and interact with event guide content. The next phase should not be broad platform expansion. Sprint 3 should preserve production evidence, create a reusable full-data internal baseline, improve recovery when browser recognition is lost, add admin CSV exports, evaluate SMS recall responsibly, and give operators clearer search, state, and override tools.",
    "observations": [
      "SOTC Rock Hall was qMe's first substantial production event and should now be treated as the evidence base for Sprint 3.",
      "The strongest Headshot insight remains that qMe can free guests from standing in a physical line while still moving them toward the service at the right time.",
      "The next problem is reliable recall and recovery: guests should not have to stare at the app, and qMe must reconnect them to existing participation if browser storage/session recognition is lost.",
      "A guest seeing 'already checked in' after searching again means server-side state existed; the missing piece was recovery from a lost browser-side session pointer.",
      "The July production record should be preserved separately from internal testing.",
      "An internal full-data working baseline is valuable for realistic testing because it preserves real queue lengths, check-in history, timing patterns, and operational edge cases.",
      "A sanitized public demo clone is useful later, but is not the first Sprint 3 block.",
      "CSV reporting is enough for the next reporting step and should be available from admin views, not station-staff-only views.",
      "SMS should be investigated in Sprint 3 for cost, compliance, consent, duplicate prevention, and secure triggering, but should not be promised until the go/no-go evidence is clear.",
      "On My Way remains an important queue commitment concept: it means the guest is responding and heading over, but only I'm Nearby makes the guest callable.",
      "Check-In should not be overgeneralized yet; SOTC and upcoming customer conversations should teach what a configurable Check-In Experience Type needs to support."
    ],
    "decisions": [
      "Move current development back into normal Sprint 3 product work, not emergency security remediation.",
      "Frame Sprint 3 as Post-SOTC Operational Hardening.",
      "Create a SOTC production archive snapshot for review.",
      "Keep the existing SOTC event as the internal full-data working baseline for ongoing testing, preserving the real dataset as-is for internal use.",
      "Track a future sanitized public demo clone separately instead of doing it as the first block.",
      "Start reports with admin-only CSV exports for attendance/check-in and Headshot activity.",
      "Prioritize guest session persistence diagnostics and already-checked-in recovery before broad new feature work.",
      "Evaluate SMS feasibility and cost in Sprint 3 without enabling broad SMS delivery by default.",
      "Treat authorized queue state override as controlled state management, not only a go-next shortcut.",
      "Keep Host Console as a later product-board item rather than a Sprint 3 build requirement."
    ],
    "risks": [
      "Production archive and internal baseline handling must avoid accidental mutation of the July 22 record.",
      "Keeping real names/contact data in the internal baseline is useful but requires treating it as private internal test data.",
      "Browser storage behavior may vary by device, browser, QR scanner, private mode, and user settings; recovery UX is still needed even after diagnostics.",
      "SMS may carry fixed monthly/provider costs and compliance requirements that make it inappropriate to turn on casually.",
      "Admin override tools can confuse queue fairness if they do not clearly show when they bypass automation or exceed max settings."
    ],
    "roadmapChanges": [
      "Renamed the current sprint to Sprint 3: Post-SOTC Operational Hardening.",
      "Added a new Sprint 3 epic with stories for production archive/full-data baseline, admin CSV exports, guest-session persistence diagnostics, already-checked-in recovery, storage-health/recovery-contact prompt, SMS feasibility, admin search/state reconciliation, and authorized queue state overrides.",
      "Kept existing queue automation observability and station operational control visibility in the current sprint because they remain relevant after SOTC.",
      "Moved the next sprint framing toward experience-type review and configuration rather than more pre-event readiness."
    ],
    "nextFocus": [
      "Start with the SOTC archive/full-data baseline block or the admin CSV reports block.",
      "Keep implementation one block at a time.",
      "Do not add broad new platform features until Sprint 3 recovery, reporting, and operator trust items are clearer."
    ]
  },
  {
    "id": "review-qme-root-landing-event-directory-2026-07-21",
    "date": "2026-07-21",
    "trigger": "The custom qME domain was connected to Vercel, revealing that the root domain still opened directly into the Walnut Ridge Farm Peony Festival event.",
    "summary": "qME now needs a platform-level root destination. The root domain should introduce qME lightly, help guests find the event they are attending, and give organizers/staff a clear sign-in path without becoming a full SaaS marketing site.",
    "observations": [
      "qME now supports more than one organization and event.",
      "The Peony Festival is no longer an appropriate platform-level root destination.",
      "Guests need a simple way to find the event they are attending.",
      "Organizers and staff need a visible path to sign in and manage events.",
      "The root page should explain qME without becoming a large marketing site.",
      "Direct event URLs should remain the primary destinations used in QR codes, emails, and signage.",
      "The event directory should prioritize events closest to the current date.",
      "Past events may remain accessible, but should not dominate the primary event list.",
      "Private or internal demo events should not automatically appear in the public directory."
    ],
    "decisions": [
      "qme.lol becomes the qME platform landing page.",
      "Individual events remain accessible through event-specific public slugs.",
      "The first public SOTC route should use /sotc/rockhall while preserving the tested SOTC event route.",
      "Peony remains directly accessible through its existing event route and /demo redirect.",
      "The homepage is guest-first.",
      "Organizer/Admin Sign In is clearly visible but visually secondary to joining an event.",
      "Public events are sorted by relevance to the current date.",
      "The page initially uses existing event records rather than a separate marketing CMS.",
      "Only events explicitly intended for public directory display should appear."
    ],
    "risks": [
      "Automatically listing every active event could expose test, rehearsal, private, or internal events.",
      "Sorting only by absolute date distance could cause a recently completed event to appear above an upcoming event.",
      "Event records may not yet have all the fields needed for an attractive public card.",
      "Changing the root route could accidentally break direct Peony guest links if route behavior is not separated carefully.",
      "Organizer Sign In must not expose unauthorized administrative content.",
      "Event directory date logic must account for multi-day events and events without reliable dates."
    ],
    "roadmapChanges": [
      "Added story-qme-root-landing-event-directory to current Operational Readiness.",
      "Moved the root route away from the Peony demo destination.",
      "Kept /demo and direct event routes available.",
      "Added /sotc/rockhall as the clean public SOTC route bridge."
    ],
    "nextFocus": [
      "Verify qme.lol and www.qme.lol load the root event portal after deployment.",
      "Confirm the public event directory shows only intended events.",
      "Add explicit event visibility controls after SOTC if the allow-list/metadata bridge becomes limiting."
    ]
  },
  {
    "id": "review-sotc-imported-registration-model-2026-07-20",
    "date": "2026-07-20",
    "trigger": "Actual SOTC Eventbrite attendee data was received, cleaned, imported, and tested through the guest/staff check-in workflow",
    "summary": "The SOTC registration model materially changed from a no-import alpha check-in simulation to an operational imported-registration workflow. Real attendee data supported a clean manual CSV import, guest self-search/claim, immediate self check-in for matched imports, Needs Help fallback, Remove/reclaim recovery, and Headshot entitlement from imported Price Tier rather than guest-entered classification.",
    "observations": [
      "Real attendee data supported a clean imported-registration workflow.",
      "All 191 attendee rows imported without duplicate attendee numbers, duplicate emails, duplicate names, missing required fields, or unknown price-tier problems.",
      "Physical name-tag/sticker handoff remains an important registration desk step, but it is no longer the qMe participation gate for matched imported registrations.",
      "Imported Price Tier, not guest classification, controls Headshot entitlement.",
      "Needs Help and Remove/reclaim keep registration exceptions visible and recoverable.",
      "Student/Professional values may remain imported source metadata, but they are not the active qME authorization model for SOTC Headshots."
    ],
    "decisions": [
      "Imported registration, guest session, and event check-in remain separate concepts.",
      "Matched imported-registration claim creates a completed qMe event check-in and unlocks event participation.",
      "Guests who cannot find themselves create pending operational work with a Needs Help marker.",
      "After self check-in, qMe directs guests to the registration desk to pick up their name tag/sticker.",
      "Headshot entitlement is derived server-side from imported attendee data or explicit staff grant, then represented as professional_headshot credit state.",
      "Eventbrite API synchronization remains deferred.",
      "Manual CSV import is sufficient for the SOTC pilot."
    ],
    "risks": [
      "Eventbrite API sync remains post-pilot work.",
      "Registration UX around duplicate names, no-match guests, recovery contact, and the physical name-tag handoff should be rehearsed with staff before the event.",
      "Future generalized registration outcomes should not be designed until post-SOTC evidence is reviewed."
    ],
    "roadmapChanges": [
      "Marked story-attendee-import done/completed.",
      "Marked the older story-registration and story-sotc-qr-entry assumptions done/superseded by the imported-registration path.",
      "Retired the Student/Professional photo-state authorization model in favor of registered/check-in/Headshot entitlement/credit state.",
      "Kept Eventbrite API synchronization deferred."
    ],
    "nextFocus": [
      "Rehearse registration desk operations with imported search, self check-in, name-tag/sticker handoff, Needs Help, Remove/reclaim, and Headshot entitlement.",
      "Confirm event staff understand that matched imported guests are checked in by qMe immediately, while Needs Help guests still require staff resolution.",
      "Continue SOTC operational readiness rather than rebuilding the import path before July 22."
    ]
  },
  {
    "id": "review-security-review-closure-2026-07-20",
    "date": "2026-07-20",
    "trigger": "Ahmed reviewed the remediation report and confirmed qME is good for the July 2026 SOTC pilot, with remaining work deferrable",
    "summary": "The independent security review is complete for the July 2026 SOTC pilot. Emergency remediation, production verification, regression testing, and smoke testing are complete, and the independent reviewer confirmed that remaining work can move back into normal post-SOTC security maturity rather than emergency remediation.",
    "observations": [
      "Independent security review completed.",
      "Emergency remediation completed.",
      "Production verification completed.",
      "Security regression testing completed.",
      "Independent reviewer confirmed the remaining work can be deferred until after the SOTC pilot.",
      "Current platform foundation is considered suitable for continued feature development.",
      "No remaining High/Critical exploit path has been identified before the July 2026 pilot.",
      "Remaining items are security maturity work rather than emergency remediation.",
      "The current security foundation is stable enough that continued feature development should not introduce architectural security debt, provided future work follows the established authorization and verification patterns."
    ],
    "decisions": [
      "Emergency security remediation is closed.",
      "Resume normal product development.",
      "Keep Security Hardening Sprint 2 on the roadmap after SOTC.",
      "Continue treating security as an ongoing engineering practice rather than a one-time project.",
      "Do not promote remaining maturity items back into emergency work unless a new High/Critical issue is identified."
    ],
    "risks": [
      "Provider-level rate limiting remains post-SOTC maturity work.",
      "Invite/password-reset workflow remains post-SOTC maturity work.",
      "Additional audited administrative RPCs remain appropriate where direct setup writes need tighter operational evidence.",
      "Browser-storage and mobile security improvements remain post-SOTC maturity work.",
      "Group-ordering remains blocked until a secure redesign exists.",
      "Additional security monitoring and auditing remain normal hardening work."
    ],
    "roadmapChanges": [
      "Moved the project back from emergency security remediation into normal Operational Readiness.",
      "Marked the external database/security review story complete.",
      "Kept remaining security work in backlog as maturity hardening, not emergency remediation.",
      "Preserved the security engineering workflow as a repeatable process: independent review, verification, risk classification, bounded remediation, regression testing, production validation, and documentation."
    ],
    "nextFocus": [
      "Focus development on SOTC operational readiness and product capabilities.",
      "Continue feature work only through the established authorization and verification patterns.",
      "Reopen emergency remediation only if a new High/Critical issue is identified."
    ]
  },
  {
    "id": "review-security-ahmed-emergency-remediation-2026-07-16",
    "date": "2026-07-16",
    "trigger": "Ahmed completed a database/security review and ChatGPT converted the feedback into an emergency verification/remediation plan",
    "summary": "The next operating-readiness focus is security evidence, not new product expansion. Recent hardening substantially improved qME, but high-risk exposure may remain in older pilot SQL, legacy permissive policies, weak Flexlink intake auth, display-name credit binding, and privileged bootstrap functions. The work must verify live Supabase state, close confirmed emergency paths, and produce evidence for Ahmed to review.",
    "observations": [
      "The hardening pass substantially improved the platform, but older pilot paths can still become production vulnerabilities if not explicitly retired.",
      "Remaining high-risk issues are concentrated in legacy/pilot policies, old auth shortcuts, and weak identity binding.",
      "Dynamic admin assignment is intentional and required for the product; the fix is stronger authorization and audit boundaries, not hard-coded administrators.",
      "UI role visibility is not authorization.",
      "Guest names must never serve as authorization identifiers.",
      "Notification, ordering, and future registration work must build on verified guest identity and narrow server enforcement.",
      "Production security status cannot be inferred from repo files alone; live grants, policies, function grants, and deployed secrets must be verified."
    ],
    "decisions": [
      "Pause nonessential platform expansion until confirmed emergency findings are fixed or classified.",
      "Preserve SOTC event-guide/content work where it does not touch vulnerable write paths.",
      "Keep dynamic role assignment, but verify all privileged role mutation functions and EXECUTE grants.",
      "Fix confirmed anonymous data exposure and write paths first.",
      "Require verified guest/check-in identity for credits and guest-owned actions.",
      "Remove committed/fake-secret bearer mechanisms from Flexlink intake.",
      "Require evidence and regression tests or SQL verification for every security closure.",
      "Re-engage Ahmed after the bounded remediation pass."
    ],
    "risks": [
      "Legacy SQL may reintroduce vulnerabilities if rerun.",
      "Deployed Supabase schema may differ from repository assumptions.",
      "Existing data may have been altered or enumerated before policies were tightened.",
      "Broad rewrites immediately before SOTC could create operational regressions.",
      "Overreliance on RLS helpers without live tests can create false confidence.",
      "Moving every write behind service-role APIs without careful design could create a large privileged backend attack surface."
    ],
    "roadmapChanges": [
      "Added emergency security remediation as the first current Operational Readiness story.",
      "Created verification/remediation packet expectations for Ahmed follow-up.",
      "Kept feature work paused unless explicitly approved while emergency findings are addressed."
    ],
    "nextFocus": [
      "Verify findings against live/current state.",
      "Fix emergency anonymous write/read paths.",
      "Rotate and rebuild Flexlink intake authentication.",
      "Fix credit identity binding.",
      "Lock down privilege-escalation functions.",
      "Run role/RPC/policy regression tests.",
      "Produce remediation matrix and deployment checklist.",
      "Ask Ahmed to review the diff and evidence.",
      "Resume nonessential feature work only after emergency closure."
    ]
  },
  {
    "id": "review-tanya-eric-sotc-operating-model-2026-07-15",
    "date": "2026-07-15",
    "trigger": "Tanya/Eric/SOTC intern meeting clarified the July 22 operating model and simplified the SOTC guest home",
    "summary": "The July operating model is clearer and narrower: Headshots remain the primary operational experience using a hybrid guest-confirmed/Supervisor-assisted model, Eventbrite self-check-in is the preferred registration direction but must wait for the actual export, walk-up paid professional headshots stay outside qME for July, and the guest home should feel like a digital event companion led by schedule, Headshots, resources, speakers, sponsors, and food/drinks.",
    "observations": [
      "Photographers should remain focused on photography rather than operating qME.",
      "Evan will serve as Station Supervisor near the photographer and use the active queue for exceptions such as Not Here or manual Mark Served.",
      "Eventbrite attendee lookup is now the preferred registration direction, but the export must be reviewed before designing lookup, duplicate handling, or walk-in recovery.",
      "Registration staff primarily need a live list of guests who have self checked in and now need name tags/materials.",
      "Walk-up professional headshots for guests without a prepaid photo remain outside qME for July and use the photographer's Venmo/payment flow.",
      "The SOTC guest home should prioritize Full Event Schedule, Professional Headshots, Event Resources, Featured Speakers, Sponsors, and Food & Drinks, with Resume Reviews and Networking visible lower on the page.",
      "The Mixer Resources Canva page cannot be embedded reliably in qME because Canva refused iframe display during testing.",
      "External content should remain external unless recreating it natively in qME adds interaction, personalization, or operational support. Canva pages, PDFs, and Google Docs should usually stay as external links.",
      "The project is now primarily waiting on customer content rather than software architecture: speakers, sponsors, logos, links, and food information remain customer-content dependencies. The attendee CSV has arrived and passed dry-run review.",
      "Scan-Code Adventure should not appear in the July guest-facing home, but can remain available as an internal/demo capability."
    ],
    "decisions": [
      "Adopt the hybrid Headshot operating model: guest-confirmed completion via I've Been Called plus Station Supervisor/Admin Mark Served and Not Here recovery.",
      "Do not add photographer-specific controls unless later testing proves they are useful.",
      "Keep walk-up Venmo headshots outside qME for July.",
      "Begin the bounded manual Eventbrite attendee import path now that the actual attendee CSV has been received and reviewed. Keep attendee lookup UX, duplicate-name handling, self-registration, and walk-in recovery scoped to evidence from the import.",
      "Use last year's speaker, sponsor, and food/drink information as temporary placeholder content until SOTC provides updated content.",
      "Update the SOTC schedule/floor assignments immediately using the Mixer Resources direction.",
      "Keep Mixer Resources as a direct external Canva link, while keeping Sticker Guide as a native qME pop-up.",
      "Remove Scan-Code Adventure from the July guest home while preserving it for demo/internal use.",
      "Keep Resume Reviews and Networking visible as lower-priority guest-home cards."
    ],
    "risks": [
      "The current Eventbrite CSV is clean, but late registrations or future exports may introduce duplicates or insufficient identifying fields.",
      "The self-check-in design should still fail safely if a future attendee file is less clean than the current dry-run.",
      "Walk-ins may require a recovery workflow that is not yet designed.",
      "Placeholder speakers, sponsors, logos, links, and food information must be replaced before production use.",
      "Event-specific styling must feel like SOTC while remaining mobile-readable and not overly hard-coded."
    ],
    "roadmapChanges": [
      "Added Tanya/Eric meeting direction as a Product Review.",
      "Prioritized guest-home updates before Eventbrite/self-registration work.",
      "Kept SMS, web push, photographer console, generalized speaker/sponsor engines, Food & Beverage ordering, and Experience hierarchy changes deferred.",
      "Captured the resource-link decision: external guide links should stay direct unless qME recreates the content natively.",
      "Clarified that Scan-Code Adventure remains a reusable/demo capability but is removed from the July SOTC guest home."
    ],
    "nextFocus": [
      "Completed: SOTC guest-home information architecture, schedule/layout, event guide structure, Event Resources with external Mixer Resources link, temporary speaker/sponsor/food content, and removal of Scan-Code Adventure from the July guest experience while preserving it as a reusable/demo capability.",
      "Waiting on SOTC: updated speaker list, updated sponsor list, updated sponsor logos, sponsor destination links, and updated food/drink information.",
      "Completed/under validation: SOTC-Mixer-List.csv was dry-run reviewed with 191 attendees, 147 Headshot-entitled records, no duplicate attendee numbers/emails/names, and no missing required fields; the live imported-registration table has been populated with 191 records.",
      "Current import focus: validate the narrow guest imported-registration search/claim path and Headshot entitlement grant. Keep duplicate-name handling, walk-in recovery, and broader registration UX limited to what the reviewed data requires.",
      "Current development focus: continue refining the Headshot operational workflow, rehearse the Station Supervisor operating model, finalize July in-app notification behavior, and continue operational readiness rather than adding platform features."
    ]
  },
  {
    "id": "review-notification-feasibility-2026-07-14",
    "date": "2026-07-14",
    "trigger": "Tanya asked whether qME can buzz guests for Headshots and other queue status changes before the July 22 SOTC event",
    "summary": "The reliable July notification path is in-app status-change messaging while the guest page is open. SMS may become valuable, but it should not be promised until sender registration, opt-in consent, delivery logging, duplicate prevention, and provider approval timing are confirmed. Mobile web push is not a good July primary channel because iPhone guests would need Home Screen installation and notification permission.",
    "observations": [
      "Current guest queue pages already detect Not Here and Return to Waiting transitions and show in-app messaging.",
      "The guest queue page currently relies on frequent refresh/polling and page-visible behavior; a closed or heavily backgrounded mobile browser cannot be treated as reachable.",
      "Optional sound can help only after a guest has interacted with the page and should not be treated as a guaranteed background buzz.",
      "SMS requires explicit consent language, provider setup, sender registration/verification, server-side triggering, delivery logs, and duplicate prevention.",
      "Queue and notification architecture should remain provider-agnostic: domain status changes should create notification events, and delivery channels should process those events."
    ],
    "decisions": [
      "Do not promise SMS for July 22 unless account/compliance setup is complete and tested.",
      "Use in-app modal/banner notifications as the July fallback for Waiting to Gathering, Your Turn, Not Here, and Return to Waiting/Cooldown.",
      "Treat sound as an optional in-app enhancement, not a replacement for SMS or push.",
      "Keep mobile web push as a later channel, not a July solution for a one-time event.",
      "Discuss low-staff Headshot operating models with Tanya/Eric before adding new queue states such as active service."
    ],
    "risks": [
      "Guests may close the page or lock their phone and miss in-app-only notifications.",
      "SMS timing may fail if sender registration, campaign approval, or consent language is not ready.",
      "Web push friction may distract guests and staff during a one-time event.",
      "Adding Headshot-specific states too quickly may make the reusable queue model less generic."
    ],
    "roadmapChanges": [
      "Added July notification fallback story for SOTC queues.",
      "Added notification-event architecture story.",
      "Added SMS notification feasibility story.",
      "Added low-staff Headshot operating model discovery story."
    ],
    "nextFocus": [
      "Choose the July Headshot notification promise: in-app only, or in-app plus SMS pilot if compliance is ready.",
      "Add in-app notifications and acknowledgement/history before any SMS channel work.",
      "Review Headshot operating models with Tanya/Eric and decide whether guest confirmation or supervisor completion is the safest alpha path."
    ]
  },
  {
    "id": "review-headshot-operating-model-2026-07-14",
    "date": "2026-07-14",
    "trigger": "Post-implementation reflection after testing the dual Headshot operating model",
    "summary": "The Headshot model now demonstrates a reusable operational pattern: queue progression can remain simple while durable service milestones capture what happened inside the station. The July prototype supports both guest-confirmed and admin-operated completion without adding an active_service ticket state.",
    "observations": [
      "Recording I've Been Called as a durable service-start marker rather than another queue state kept the queue lifecycle simpler while preserving useful operational timestamps.",
      "Headshots now demonstrates a possible Queue -> Service Starts -> Queue Complete pattern that may apply to other Experience Types later.",
      "Photographer interaction should remain minimal: guests participate, Station Supervisors handle exceptions, and photographers stay focused on photography.",
      "The admin-operated path and guest-confirmed path can coexist as two valid operating modes for the same station.",
      "The next Experience Type review should likely be Food & Beverage because it can validate menus, station-specific credits, fulfillment, approvals, and reusable station operations."
    ],
    "decisions": [
      "Prefer durable operational events/timestamps over new queue states when the state is an analytic or service milestone rather than a routing state.",
      "Do not introduce an active_service ticket state for Headshots before the Tanya/Eric discussion.",
      "Do not add photographer-specific controls unless the operating discussion proves they are necessary.",
      "Treat the Cookie Event as a product experiment for ordering, credits, approvals, fulfillment, and feedback, not as a commercial product direction.",
      "Keep the possible Experience Type -> organization-owned reusable definition -> Station layer as an open architecture question."
    ],
    "risks": [
      "If service milestones are over-generalized too soon, qME may create an abstraction before Food, Resume Reviews, Registration, and Networking validate it.",
      "If photographer controls are added prematurely, qME may create operational burden for the person who should be focused on service delivery.",
      "If completed remains the only terminal state, history display must clearly distinguish guest-called completion from admin-served completion."
    ],
    "roadmapChanges": [
      "Marked the Headshot guest-called completion prototype done.",
      "Updated the low-staff Headshot operating model notes with both the guest and admin completion paths.",
      "Captured Food & Beverage as the recommended next Experience Type review lens.",
      "Reinforced the open architecture question about an organization-owned reusable definition between Experience Type and Station."
    ],
    "nextFocus": [
      "Use the Headshot model in the Tanya/Eric meeting to validate whether guest confirmation and admin Mark Served are operationally understandable.",
      "Review Food & Beverage as the next Experience Type before introducing any new service layer.",
      "Keep SMS/phone buzzing out of the immediate build unless the meeting makes it essential and compliance setup is realistic."
    ]
  },
  {
    "id": "review-alpha-2-product-discovery-2026-07-08",
    "date": "2026-07-08",
    "trigger": "July 2 SOTC alpha, Jalani testing, queue operations testing, and follow-up product discovery",
    "summary": "Alpha 2 moved qME from a working SOTC demo toward a clearer event-companion and operations platform. The product decisions are mostly planning decisions, not immediate feature expansion: finalize operational role visibility, make station controls understandable, explain queue automation behavior, keep Not Here as a cooldown-and-return policy, and continue validating reusable Experience Type architecture before adding generalized engines.",
    "observations": [
      "The queue engine often behaved correctly while operators believed it was broken because cooldowns and automation blockers were invisible.",
      "The next role problem is less about whether permission checks exist and more about whether each role lands in the right workspace with the right tabs and controls.",
      "Station operational settings are product UI, not just configuration; staff need to understand them even when they cannot edit them.",
      "The Event Home direction is working better as a digital event companion than as an application-feature list.",
      "Guest Profile should remain event-scoped: identity, attributes, access, and station-specific credits.",
      "Credits should stay station/experience-specific for now, such as Headshot Credit, Cookie Credit, Drink Credit, or Bouquet Credit.",
      "A likely reusable layer exists between Experience Type and Station: an organization-owned reusable definition that can be placed in one or more event stations.",
      "The cookie event is useful as a product experiment for ordering, credits, approvals, fulfillment, and feedback, but not as a commercial feature direction yet."
    ],
    "decisions": [
      "Finalize operational role visibility for qME Superadmin, Organization Admin, Event Admin, Station Supervisor, and Station Staff before broader platform expansion.",
      "Determine which tabs each role sees, which tabs are hidden, which tabs are read-only, and which controls are editable.",
      "Treat Station Supervisor versus Station Staff as operational workspace authority, while preserving event-wide/destructive controls for Event Admin or higher.",
      "Show station operational controls such as Gathering Target, Gathering Max, Gathering timeout, On My Way timeout, Not Here cooldown, and Auto Flow at the station level.",
      "Whenever automation prevents an action, qME should explain why: Cooling Down, Gathering full, Auto Flow paused, Waiting for credits, or similar.",
      "Use the Not Here policy of cooldown, return to active Waiting, and resume progression according to original queue order. Cooldown itself is the penalty.",
      "Continue moving Event Home toward Welcome, Schedule, Featured Experiences, Featured Speakers, Sponsors, Food & Drinks, and Resources using reusable metadata.",
      "Keep registration outcomes Student, Professional, and Professional + Photo for SOTC; do not generalize registration policy yet.",
      "Do not build a generalized credit engine, service abstraction, configurable registration engine, generalized speaker/sponsor engines, payment, or POS integration yet.",
      "Use Product Reviews increasingly to capture hypotheses, evidence, and decisions in the Test > Discovery > Resolution > Test rhythm."
    ],
    "risks": [
      "If queue automation remains opaque, correct behavior will still feel unreliable during live operations.",
      "If role visibility is not finalized, station staff may see too much setup surface or miss the operational workspace they need.",
      "If station controls are editable without clear authority boundaries, live-event operators may accidentally change event-wide behavior.",
      "If the Experience Type hierarchy is implemented too early, qME may add a wrong abstraction before Registration, Headshots, Resume Reviews, and Food provide enough evidence.",
      "If credits are generalized too soon, simple station-specific grant/use rules may become unnecessarily heavy."
    ],
    "roadmapChanges": [
      "Moved role-aware admin landing/workspace visibility into the current Operational Readiness focus.",
      "Added station operational control visibility as a current story.",
      "Added queue automation observability as a current story.",
      "Updated queue rule configuration with state-specific timeouts and Not Here recovery policy.",
      "Updated experience hierarchy/grouping discovery with the organization reusable definition concept.",
      "Kept generalized credit engine, Service abstraction, registration config, speaker/sponsor engines, payment, and POS integration deferred.",
      "Captured cookie event as a future product experiment rather than a commercial feature."
    ],
    "nextFocus": [
      "Finalize role/tab/control visibility across Superadmin, Organization Admin, Event Admin, Station Supervisor, and Station Staff.",
      "Make station queue controls visible and explainable, even where read-only.",
      "Add operator-facing reasons when flow automation does not move someone.",
      "Review individual Experience Types, beginning with Registration and Headshots.",
      "Use the cookie event as a tiny complete experiment only after the SOTC operational foundation is stable."
    ]
  },
  {
    "id": "review-sotc-alpha-2-pretest-wrap-2026-07-02",
    "date": "2026-07-02",
    "trigger": "Pre-test wrap-up before the July 2 SOTC alpha",
    "summary": "The July 2 pre-test build shifted the SOTC guest home from a list of app capabilities toward a credible event companion. Headshots remains the hero operational experience, Scan-Code Adventure remains available as an optional queue/code demo, and the event home now uses reusable eCe metadata to show schedule, featured speakers, sponsors, food/drinks, and resources without hard-coding SOTC sections into React.",
    "observations": [
      "The product story is now clearer: qME can help guests understand what is happening at an event, not only move through a queue.",
      "The current build is good enough to test comprehension, orientation, and operational trust with real users.",
      "Most of the remaining risk is test/readiness risk rather than obvious implementation absence.",
      "The event-guide content is intentionally lightweight and seeded; speaker, sponsor, schedule, food, and resource engines are not being built yet.",
      "Reusable eCe metadata is carrying the new guest-home structure, which supports the Experience Type reuse direction.",
      "Final pre-test reset verification found a stale guest-tab edge case; clearing queue URL intent after event reset fixed it, and Headshot reset testing passed."
    ],
    "decisions": [
      "Do not add new product behavior before the July 2 test unless something is obviously broken.",
      "Use the test to observe whether guests understand arrival, check-in, photo eligibility, Headshots, and optional Scan-Code Adventure without founder narration.",
      "Keep Scan-Code Adventure visible but treat it as a demo/supporting experience rather than the featured alpha path.",
      "Treat Headshots as the featured interactive experience for the test.",
      "Capture broad feedback after the test in an Alpha 2 Product Review instead of immediately expanding scope."
    ],
    "risks": [
      "Seeded brochure content may make qME look more complete than the underlying content-management model actually is.",
      "Guests may still need clearer hierarchy between event information and action-required experiences.",
      "The optional Scan-Code demo may distract from Headshots if testers treat all cards as equally important.",
      "The current image/logo assets are sufficient for alpha, but not yet a durable media-management workflow."
    ],
    "roadmapChanges": [
      "Updated the SOTC event-guide story with the implemented metadata fields and pre-test build notes.",
      "Kept Scan-Code Adventure in scope as optional demo content.",
      "Confirmed no new abstractions should be introduced before the July 2 alpha.",
      "Left speaker/sponsor/food/resource management as future Experience Type or content-model work."
    ],
    "nextFocus": [
      "Run the July 2 alpha with a clean reset and a short smoke test first.",
      "Watch where guests hesitate, what they understand without prompting, and whether staff/admin flow feels controlled.",
      "After the test, write Alpha 2 Product Review and decide whether Registration or Headshots should be reviewed next as an Experience Type."
    ]
  },
  {
    "id": "review-sotc-pre-alpha-build-2026-07-02",
    "date": "2026-07-01",
    "trigger": "Pre-alpha build direction for the July 2 SOTC alpha",
    "summary": "This review keeps the next SOTC alpha focused on feeling like a real event companion rather than a technical demo. The immediate build should improve the guest home with reusable event-guide activities, preserve the Scan-Code demo station as optional, and avoid introducing broad new abstractions before the experience types are reviewed.",
    "observations": [
      "The alpha should show a credible event flow: arrival, registration, event home, then experiences.",
      "Registration should remain simple for tomorrow: Student, Professional, and Professional + Photo.",
      "The guest home should start showing more of the event, but through reusable eCe configuration rather than SOTC-specific code.",
      "Scan-Code Adventure is still useful as an optional demo station even if it is not part of the main alpha path.",
      "The 2025 SOTC brochure reframes the alpha around conference-companion usefulness: schedule, speakers, sponsors, food/drinks, resources, and only then interactive experiences.",
      "Guest Profile should be treated as event-scoped identity, attributes, access, and credits rather than a full user account."
    ],
    "decisions": [
      "Keep Scan-Code Adventure in the SOTC test event as an optional demo station.",
      "Make Professional Headshots the hero interactive experience.",
      "Make the Event Home feel like Welcome, Tonight's Schedule, Featured Experiences, Featured Speakers, Sponsors, Food & Drinks, and Resources rather than a list of application features.",
      "Use reusable eCe metadata to configure guest-home sections, badges, ordering, and lightweight display items.",
      "Do not create generalized registration config, generalized credit engine, Service abstraction, speaker/sponsor engines, platform-wide station permission framework, or event guidance engine for tomorrow.",
      "Keep recovery contact as a future-friendly identity field, not a password account requirement.",
      "After tomorrow's test, create an Alpha 2 Product Review rather than logging every observation as an immediate fix."
    ],
    "risks": [
      "Adding event-guide content too quickly could make the alpha look broader than the implemented operational depth.",
      "Hard-coding SOTC sections would weaken the reusable Experience Type direction.",
      "Keeping Scan-Code visible could confuse the main alpha path unless it is clearly treated as optional/demo.",
      "Registration, credits, and recovery-contact concepts could become tangled if they are overbuilt before tomorrow's test."
    ],
    "roadmapChanges": [
      "Added the SOTC pre-alpha event-guide story.",
      "Added a seed/data path for lightweight event-guide eCes rather than hard-coded guest-home content.",
      "Course-corrected the seed toward the brochure: Tonight's Schedule, workshop speakers, sponsors, food/drinks, and resources.",
      "Recorded Scan-Code Adventure as retained optional demo content.",
      "Kept the next deeper product review focused on individual Experience Types."
    ],
    "nextFocus": [
      "Run the July 2 alpha as an event companion test.",
      "Watch whether guests understand registration, photo eligibility, headshot access, and optional/demo activities.",
      "After testing, write Alpha 2 Product Review and decide whether Registration or Headshots should be the next Experience Type review."
    ]
  },
  {
    "id": "review-product-architecture-part-3-2026-07-01",
    "date": "2026-07-01",
    "trigger": "Refinement of product architecture decisions after Part 2 review",
    "summary": "This review refined the event authority, queue commitment, and experience reuse decisions. It clarified that station admin distinctions are station-defined rather than universal, live/destructive event controls remain above station authority, queue stale timing may differ by commitment state, and Experience Types should be reusable before qME introduces any new Service abstraction.",
    "observations": [
      "Most items were clarifications rather than new implementation work.",
      "Station Staff and Station Admin should not be treated as universally distinct platform roles.",
      "Some stations may need elevated local station actions, while others may have no practical difference between station staff and station admin.",
      "Experience Types should be designed for reuse across organizations, events, and repeated placements inside the same event.",
      "The Experience versus Service relationship is important but should remain unresolved until Registration, Headshots, Resume Reviews, and Food Ordering provide more evidence."
    ],
    "decisions": [
      "Station Staff versus Station Admin is station-defined, not platform-defined.",
      "Reset, destructive actions, event-wide configuration, live event control settings, and cross-station operations remain event admin or higher.",
      "On My Way extends grace time but does not make a guest callable; only I'm Nearby makes a guest callable.",
      "Future queue tuning should consider different stale timers for Gathering, On My Way, and I'm Nearby.",
      "Everything possible should be designed as a reusable Experience Type rather than a SOTC-specific implementation.",
      "Do not introduce a Service layer yet; keep Experience versus Service as an open architecture question."
    ],
    "risks": [
      "Over-modeling station admin as a universal role could create unnecessary complexity.",
      "Under-modeling elevated station actions could leave check-in and future station workflows too coarse.",
      "SOTC-specific implementations could weaken reuse if they are not generalized into Experience Types.",
      "Introducing a Service abstraction too early could make the architecture heavier before the product has enough evidence."
    ],
    "roadmapChanges": [
      "Refined the station authority decision to make station-admin differences station-defined.",
      "Refined the queue commitment decision with state-specific stale-timer guidance.",
      "Strengthened experience reuse guidance on the experience model stories.",
      "Added Experience versus Service as an explicit open architecture question.",
      "Kept implementation backlog unchanged except for planning/story-note refinements."
    ],
    "nextFocus": [
      "Begin reviewing individual Experience Types instead of adding more platform abstraction.",
      "Review Registration first, then Headshots, Resume Reviews, Passport, Sponsors, and Food Ordering.",
      "Let those experience designs validate whether qME needs a separate Service concept."
    ]
  },
  {
    "id": "review-product-architecture-part-2-2026-07-01",
    "date": "2026-07-01",
    "trigger": "Follow-up product architecture discussion after the Foundation Review",
    "summary": "This review reduced architectural ambiguity before more implementation. The discussion clarified qME as an event platform where guest participation, admin/staff operations, recoverable assets, event authority, queue commitment, live controls, and experience composition each have distinct product rules.",
    "observations": [
      "The goal of this discussion was not feature expansion, but clarifying how qME should behave as an event platform.",
      "A single person may hold admin/staff roles while also participating as a guest, but guest participation remains a separate operational context.",
      "Recoverable benefits need recoverable contact information, even when the guest experience remains accountless.",
      "Experiences are the primary product unit; queues are one reusable capability an experience may compose.",
      "Live Event Controls are distinct from Event Setup and may legitimately change during active operations."
    ],
    "decisions": [
      "Guest participation continues to use guest-session context even when the same human is signed in as an admin or staff user.",
      "Recoverable assets such as complimentary or purchased professional headshots require email or mobile number before the asset is granted.",
      "Student or Professional + Photo without recovery contact automatically becomes Needs More Info; staff should not manually decide this.",
      "Event authority hierarchy is qME superadmin, organization admin, event admin, then event staff, with future station staff/station admin distinction.",
      "Queue commitment moves from Waiting to Gathering to optional On My Way to I'm Nearby to Your Turn to Done; only I'm Nearby makes a guest callable.",
      "Live Event Controls such as flow mode, gathering target/max, stale timing, pause/resume, and intake behavior belong with operations and require event admin or higher.",
      "Experience architecture should compose reusable capabilities such as queue, ordering, menu, resources, passport, notifications, staff assignment, and status tracking."
    ],
    "risks": [
      "Admin identity and guest identity could become confusing if UI does not keep contexts visibly separate.",
      "Recoverable-contact requirements could create check-in friction if the Needs More Info path is not clear.",
      "Station-level authority could become too broad unless station staff and station admin are modeled deliberately.",
      "Queue terminology and status progression could drift across experiences unless the commitment model is documented and reused.",
      "Live controls could be mistaken for setup controls unless admin screens separate them clearly."
    ],
    "roadmapChanges": [
      "Added architecture decisions for guest/admin context separation, recoverable assets, Needs More Info, event authority, queue commitment, live event controls, and experience capabilities.",
      "Updated Foundation Validation criteria to test guest/admin context separation and station-level authority boundaries.",
      "Updated privileged action matrix criteria to include live queue controls and station-level authority.",
      "Updated headshot eligibility criteria with recoverable-contact and Needs More Info behavior.",
      "Updated experience model notes to treat queue as a reusable capability rather than the definition of an experience."
    ],
    "nextFocus": [
      "Validate role and permission boundaries before broad platform expansion.",
      "Review experience-by-experience starting with Registration, then Headshots, Resume Reviews, Passport, Sponsors, and Food Ordering.",
      "Keep architecture ahead of implementation without expanding the backlog beyond near-term validation needs."
    ]
  },
  {
    "id": "review-foundation-organization-roles-auth-rls-2026-07-01",
    "date": "2026-07-01",
    "trigger": "Sprint 2 foundation completion and external product/security review direction",
    "summary": "Sprint 2 moved qME from a founder-operated demo toward an organization-ready pilot. Named admin identities, organization ownership, event ownership, staff assignments, guest session tokens, authenticated RPC boundaries, role-scoped admin access, and audit logging for newer staff/admin actions are now real enough for external validation. qME should not be treated as fully production-hardened yet; the remaining risk has shifted from architecture design to validation and hardening.",
    "observations": [
      "Removing the old temporary admin passphrase was a major trust milestone.",
      "Role boundaries are now understandable: qME superadmin, organization admin, event admin, feature/station staff, and guest/anonymous.",
      "Guest actions and staff/admin actions are separated more clearly through guest-token and authenticated admin/staff RPCs.",
      "The product is no longer only operated by the founder in demo mode.",
      "The main remaining risk is no longer whether qME can design the foundation, but whether the implemented foundation has been tested correctly across roles and edge cases."
    ],
    "decisions": [
      "Do not jump directly into broad platform expansion.",
      "Run a short Foundation Validation checkpoint before deeper SOTC Event Builder work.",
      "Re-engage the computer engineering student now that concrete role/auth/RLS structure exists to review.",
      "Continue using role-based access rather than building a full custom permissions engine.",
      "Complete only a focused RLS/RPC consistency pass before returning toward product work."
    ],
    "risks": [
      "Some privileged actions may still have inconsistent protection paths.",
      "Role boundaries may be conceptually clear but need cross-role testing.",
      "Audit logging may not yet cover every sensitive action consistently.",
      "Temporary onboarding/password flows still need cleanup.",
      "Admin mistake recovery remains limited.",
      "Event reset/test-mode permissions may need stricter live-event rules."
    ],
    "roadmapChanges": [
      "Closed Sprint 2 as a completed foundation sprint.",
      "Created Foundation Validation as the current short checkpoint sprint.",
      "Added role/permission smoke matrix, privileged action matrix, external database/security review, and Jalani named-admin walkthrough stories.",
      "Kept temporary password first-login cleanup visible in the validation sprint.",
      "Moved full SOTC Event Builder / Program Readiness behind Foundation Validation."
    ],
    "nextFocus": [
      "Run role and permission smoke-test matrix.",
      "Document privileged action matrix.",
      "Re-engage the computer engineering student for database/security review.",
      "Run Jalani named-admin walkthrough.",
      "Decide whether temporary password cleanup is completed now or explicitly deferred."
    ]
  },
  {
    "id": "review-sotc-alpha-2026-06-24",
    "date": "2026-06-24",
    "trigger": "SOTC student alpha test and external roadmap review",
    "summary": "The SOTC alpha test validated the core event check-in, queue state, photo-credit/headshot, and admin control flows with real students. Feedback centered on polish and readiness rather than product rejection.",
    "observations": [
      "qME is converging toward an event experience platform, not simply a queue app.",
      "Guests move through events; they do not wait in lines.",
      "Jalani Ball emerged as a student partner who can help move the pilot toward ready.",
      "Near-term work should focus on production readiness before additional platform expansion."
    ],
    "decisions": [
      "Prioritize refresh behavior, mobile polish, queue messaging, Jalani readiness review, and database hardening before broader feature expansion.",
      "Keep operational dashboard and post-event analytics as future stories, not July blockers.",
      "Treat Product Reviews as learning artifacts distinct from sprint execution."
    ],
    "risks": [
      "Platform expansion may outrun customer validation.",
      "Small UX issues can become live-event operational friction.",
      "Database/RLS hardening is required before broader deployment."
    ],
    "roadmapChanges": [
      "Added SOTC alpha follow-up stories.",
      "Added SOTC admin/staff RLS hardening story.",
      "Recommended Event Rehearsal Mode and Failure Recovery as next planning candidates."
    ],
    "nextFocus": [
      "Calm refresh/blinking",
      "Mobile layout/button polish",
      "Headshot/standby messaging",
      "Jalani readiness review",
      "Staff/admin role model and RLS hardening",
      "Failure recovery checklist",
      "Event rehearsal/practice mode"
    ]
  }
];
