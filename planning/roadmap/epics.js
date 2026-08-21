module.exports = [
  {
    "id": "epic-post-sotc-sprint-3",
    "title": "Post-SOTC Sprint 3 Operational Hardening",
    "summary": "Use July 22 Rock Hall production evidence to harden qMe operations before expanding the platform: archive what happened, preserve a full-data working baseline, improve guest recovery, add admin exports, make queue behavior explainable, and evaluate SMS without turning it on prematurely.",
    "status": "current",
    "themes": [
      {
        "id": "theme-sotc-post-production-data",
        "title": "Archive, Baseline, and Reports",
        "status": "current",
        "stories": [
          {
            "id": "story-sotc-production-archive-and-baselines",
            "title": "Archive SOTC production event and create working baselines",
            "status": "done",
            "sprint": "now",
            "summary": "Separate the July 22 SOTC production record from future testing by preserving an archive snapshot and treating the existing SOTC event as the internal full-data working baseline that can be reset or overwritten during Sprint 3 testing.",
            "acceptanceCriteria": [
              "The July 22 SOTC production event and activity are preserved in an archive snapshot for review.",
              "The existing SOTC event remains the internal full-data working baseline with the same event structure, real check-ins, queue history, names, contact fields, and activity patterns from the production run.",
              "The internal baseline can be used for testing recovery, queue behavior, reporting, and admin workflows while the archive snapshot preserves the production record.",
              "Future public demo data is tracked separately and may later use sanitized fake names, emails, phones, and activity while preserving realistic event shape.",
              "Reset/clone behavior is documented so testing does not accidentally overwrite the production archive."
            ],
            "notes": "Completed 2026-08-18: live Supabase now has a production archive snapshot and an internal full-data baseline snapshot for sotc-rockhall, both preserving 132 check-ins, 96 queue tickets, and 250 imported registrations. Post-SOTC direction: preserve the July 22 record in an archive snapshot and keep the existing sotc-rockhall event as the full-data internal working baseline for ongoing testing. Sprint 3 first slice added event_data_snapshots plus optional archive-lock functions/triggers and a runbook in docs/sotc-production-archive-baseline-v1.md. Archive-locking and a separate relational working event clone are deferred unless needed. A sanitized public demo clone is a useful later story, but not required before the next Sprint 3 block. Updated 2026-08-19: after the Headshot ticket/check-in linkage and credit-used reconciliation fix, live Supabase received corrected snapshots `sotc-rockhall-production-2026-07-22-corrected-headshot-credit-v1` and `sotc-rockhall-internal-full-data-baseline-v2-headshot-credit-corrected`, each verifying 132 check-ins, 96 queue tickets, and 105 guest-credit rows. The original snapshots remain preserved as historical evidence."
          },
          {
            "id": "story-sotc-admin-csv-exports",
            "title": "Add admin CSV exports for attendance and Headshot activity",
            "status": "done",
            "sprint": "now",
            "summary": "Give event admins a straightforward way to download CSV reports from the admin console, starting with attendance/check-in and Headshot activity.",
            "acceptanceCriteria": [
              "Event Admin or higher can export attendance/check-in CSV for an event.",
              "Event Admin or higher can export Headshot activity CSV including relevant timestamps and final status.",
              "Station staff do not see admin-only export controls unless their role is later expanded.",
              "Exports work from the admin console without requiring manual SQL.",
              "The report shape is documented before expanding to more advanced analytics."
            ],
            "notes": "Completed 2026-08-18: added admin-only CSV exports to Event Check-In and queue admin screens. Attendance/check-in export lives on the admin-only Settings tab, is labeled Export Check-Ins, and includes guest status, imported-registration markers, Needs Help metadata, and Headshot credit status without raw metadata JSON. Queue activity export lives on the admin-only queue Settings tab, is labeled Export Queue Activity, and includes queue stage/status timestamps plus Headshot service-start markers where present without raw metadata JSON. Report shapes are documented in docs/sotc-admin-csv-reports-v1.md. Updated 2026-08-19: fixed the Headshot completion reporting gap by linking queue tickets to event check-ins on join, passing the check-in through admin Mark Served, backfilling historical completed Headshot tickets where the name match was unique, and reconciling professional_headshot used quantities. Re-exported attendance and Headshot activity CSVs were verified against the corrected data. Deeper report views can follow once the first export format proves useful."
          }
        ]
      },
      {
        "id": "theme-guest-session-recovery",
        "title": "Guest Session Recovery",
        "status": "current",
        "stories": [
          {
            "id": "story-guest-session-persistence-diagnostics",
            "title": "Diagnose guest session persistence from repeat QR scans",
            "status": "done",
            "sprint": "now",
            "summary": "Determine why some Rock Hall guests used the same phone/default QR flow but qMe later did not recognize their browser session, even though server-side check-in state still existed.",
            "acceptanceCriteria": [
              "Test repeat QR scans on the same phone/browser after refresh, tab close, browser close, and reopening from the camera QR flow.",
              "Test private browsing, blocked cookies/storage, iOS Safari behavior, Chrome behavior, and low-storage or cleared-site-data cases where practical.",
              "Document whether the failure is localStorage, cookies, sessionStorage, browser choice, QR app behavior, or another state restoration issue.",
              "Identify which failures can be prevented and which require recovery UX.",
              "Do not assume storage can be made perfect; use findings to design recovery."
            ],
            "notes": "Rock Hall evidence showed repeat QR scans on the same phone/browser could produce an already-checked-in state without stable reconnect. Live acceptance confirmed that deliberate local/session-data clearance breaks browser identity and returns guests to Check-In, then manual registration recovery reconnects existing participation. Normal iPhone Safari behavior after refresh, tab close, browser close/reopen, and repeat QR entry is passing again; this is now complete."
          },
          {
            "id": "story-already-checked-in-recovery",
            "title": "Recover an already checked-in guest from registration search",
            "status": "done",
            "sprint": "now",
            "summary": "When qMe does not recognize the browser but the guest finds their imported registration again, let them safely reconnect to their existing event participation instead of creating a duplicate or reaching a dead end.",
            "acceptanceCriteria": [
              "Guest search can identify a previously claimed/checked-in imported registration.",
              "Search results use whatever useful identifying source fields are available for that event and display them in appropriately masked form where needed, such as email, mobile number, company/organization, or other mapped registration hints; recovery does not assume every event has the same fields.",
              "The guest sees a clear recovery path such as Reconnect to My Event instead of only an already-checked-in dead end.",
              "For the current slice, selecting the correct known registration using available masked identifying hints is sufficient lightweight recovery; SMS/email one-time-code verification is not a dependency while SMS feasibility is still under investigation.",
              "Successful recovery reconnects the current browser/session to the existing server-side event participation and preserves the existing check-in, queue tickets, Stage/State, credits, marks, and completion history rather than recreating them.",
              "Recovery never creates duplicate check-ins, queue tickets, guest credits, or completion marks.",
              "Completed experiences remain completed and active experiences resume from their existing server-side state.",
              "Ambiguous, duplicate-name, or unverifiable recovery routes the guest to event staff without exposing unnecessary attendee data.",
              "Removed/released registrations continue through the existing re-check-in/recovery behavior rather than silently reconnecting."
            ],
            "notes": "This is the product fix for lost browser recognition. It reconnects to server-side truth rather than relying on perfect local browser storage. Check-In Mode governs initial event admission; recovery restores participation that already exists and should not unnecessarily send an already checked-in guest back through Registration staff. Stronger verification such as SMS OTP can later layer onto the same recovery flow without redesigning it. Completed 2026-08-19 after multi-round live SOTC acceptance with real baseline guests including Chiderah Emeakoroha, Charlie Haslett, and Madeline Vlaeminck. Recovery now reconnects the current browser/session to existing check-ins, queue tickets, Stage/State, credits, marks, and completion history without duplicate participation. The key implementation lesson was that browser/localStorage is only a recovery hint; existing server-side participation must be rediscovered/adopted from authoritative ticket and check-in truth."
          },
          {
            "id": "story-storage-health-recovery-contact-prompt",
            "title": "Prompt for recovery contact when browser storage looks risky",
            "status": "current",
            "sprint": "now",
            "summary": "Add a lightweight diagnostic and prompt so qMe can warn guests when browser storage may not persist and ask for optional phone or email to help recovery.",
            "acceptanceCriteria": [
              "Guest flow can test whether required browser storage appears writable/readable.",
              "If storage looks risky, qMe clearly asks the guest to add a recovery phone or email.",
              "Phone/email remains optional unless a future event configuration requires it.",
              "Prompt copy explains recovery value without implying full account creation.",
              "The design accounts for domestic 10-digit phone numbers and international/WhatsApp-style numbers without overblocking legitimate guests."
            ],
            "notes": "Keep this story open, but frame it around two separate concepts: session viability (can this browser persist required qMe state?) and recovery identity/contact (how can we reconnect later). Session viability is foundational; optional phone/email improves recovery, but does not fix a browser that cannot persist state. Intervention should be targeted to detected-risk sessions only."
          },
          {
            "id": "story-browser-persistence-edge-cases-degraded-storage",
            "title": "Browser persistence edge cases and degraded-storage UX",
            "status": "deferred",
            "sprint": "future",
            "summary": "Investigate browser persistence edge cases and degraded-storage UX for guest recovery after successful initial participation.",
            "acceptanceCriteria": [
              "Document storage and privacy conditions where guest session identity works initially but degrades later after re-entry.",
              "Track whether qMe preserves participation under blocked cookies/storage pressure/private modes and note reproducible patterns.",
              "Prefer targeted, low-friction interventions only when storage risk is detected.",
              "Keep scope limited to diagnostics and UX guidance until broader feasibility/verification paths are justified."
            ],
            "notes": "Preserve for later investigation:\n- what browser/device/privacy/storage conditions allow an initially usable qMe session but later discard guest identity;\n- Android/Chrome and other combinations if future evidence warrants\n- storage pressure/content-blocker/privacy behaviors;\n- whether legacy SOTC storage implementation contributed;\n- why Safari Block All Cookies reduced visible event context and why reconnect behavior differed;\n- whether degraded modes should offer explicit guidance and when."
          }
        ]
      },
      {
        "id": "theme-recall-and-operator-controls",
        "title": "Recall and Operator Controls",
        "status": "current",
        "stories": [
          {
            "id": "story-sms-cost-compliance-feasibility",
            "title": "Evaluate SMS recall costs, compliance, and go/no-go",
            "status": "discovery",
            "sprint": "now",
            "summary": "Use the existing Twilio direction/account readiness to understand what SMS would cost and require before qMe promises phone buzzing or text recall at a live event.",
            "acceptanceCriteria": [
              "Confirm provider/account status, sending number readiness, and whether A2P 10DLC or other approval is required.",
              "Estimate monthly and per-message costs for likely event volumes.",
              "Draft consent, STOP/HELP, and event-use language before any live SMS opt-in.",
              "Document secure server-side trigger architecture with duplicate prevention and delivery logging.",
              "Make a go/no-go recommendation before enabling SMS for production event operations."
            ],
            "notes": "User likely has Twilio signed up and ready from July 20, but SMS should be investigated in Sprint 3 rather than treated as off-limits or silently enabled. In-app remains the reliable fallback until SMS compliance/costs are clear."
          },
          {
            "id": "story-admin-guest-search-state-reconciliation",
            "title": "Improve admin guest search, status, timing, and history visibility",
            "status": "done",
            "sprint": "now",
            "summary": "Help operators quickly understand who a guest is, where they are in the queue workflow, their readiness condition, their queue position and surrounding queue context, how long they have been there, and what meaningful actions happened previously.",
            "acceptanceCriteria": [
              "Admin can search by guest name, email, phone where available, ticket number, and relevant event/check-in status; name remains the primary live-operations use case.",
              "Admin sees product-facing Stage and State separately: Stage describes workflow position (Waiting, Gathering, Your Turn, Completed) while State describes a meaningful condition within that stage (for example Cooling Down, On My Way, or Nearby).",
              "Admin can see queue order/position where meaningful, active guests ahead, total active queue size, and relevant Gathering/Nearby/Your Turn counts; internal ticket IDs are never presented as queue position.",
              "When readiness, cooldown, stale guests, or authorized overrides can change actual service order, the UI distinguishes queue order from operational readiness rather than presenting false precision.",
              "Admin can see useful elapsed/current timing such as time in Gathering, time Nearby, and cooldown remaining where the underlying data supports it.",
              "Admin can see chronological operational history where it is actually persisted, including join, Gathering, On My Way, Nearby, Your Turn/release, service start, completion, Not Here, Return to Waiting/cooldown, and authorized admin overrides; the UI does not fabricate missing history.",
              "Admin can distinguish active participation from archived/history records.",
              "Search helps resolve duplicate-looking or already-checked-in cases without exposing unnecessary data to station staff.",
              "Visibility is role-aware and separates event-admin views from limited station-staff views."
            ],
            "notes": "Post-SOTC lesson: operators need to understand both queue order and readiness, not merely a technical ticket stage. Product refinement on 2026-08-19 established Stage / State / Timestamps-History: Stage is where the guest is in the workflow; State is additional current condition that affects treatment; timestamps/history record what happened and when. For the current managed queue, conceptual stages are Waiting -> Gathering -> Your Turn -> Completed. Waiting may be null or Cooling Down; Gathering may be null, On My Way, or Nearby. Completed 2026-08-19 after live SOTC acceptance confirmed admin search/state visibility, CSV/export semantics, timing/status visibility, queue context, and guest/admin reconciliation across Waiting, Gathering, On My Way, Nearby, Your Turn, Return to Waiting/cooldown, and Completed. Admin and guest surfaces now derive from the same authoritative server-side ticket truth."
          },
          {
            "id": "story-authorized-queue-state-overrides",
            "title": "Add authorized queue state override controls",
            "status": "done",
            "sprint": "now",
            "summary": "Give Event Admin or approved station authority operational controls to reconcile qME with physical event reality while preserving normal automation as the default.",
            "acceptanceCriteria": [
              "Admin actions use operational language and map to Stage + State semantics rather than exposing raw database mutations: Move/Invite to Gathering, Mark On My Way, Mark Nearby, Make Your Turn, Return to Waiting, and Mark Not Here where appropriate.",
              "Normal automatic progression to Your Turn requires Stage = Gathering and State = Nearby; On My Way indicates commitment/response but does not make the guest callable.",
              "Authorized operators may record commitment/readiness on a guest's behalf when the guest cannot interact with qME, such as a dead phone, accessibility need, or direct call to the station; history records whether the update came from guest, admin/staff, or system where practical.",
              "Authorized operators can intentionally move a Waiting guest directly to Your Turn when live operations justify it, including open service capacity and a physically present guest, even when that guest is far back in normal queue order.",
              "When an action changes normal queue order or bypasses a normal transition guard, qME clearly discloses what is happening and requests confirmation for disruptive actions without portraying legitimate live-event management as an error.",
              "Configured Gathering Target/Max and similar limits govern automation, not absolute human authority; an authorized override may temporarily exceed a configured limit without changing the configured value, with a clear warning.",
              "Every override records actor, timestamp, prior Stage/State, resulting Stage/State, reason where available, affected ticket/check-in, and whether normal automation/transition rules were bypassed.",
              "The resulting override is visible in the guest's operational history.",
              "Station staff visibility/editability is role-aware; Event Admin or higher can perform broader event-level overrides."
            ],
            "notes": "This is broader than 'let this person go next' but includes that normal operational need. Product refinement on 2026-08-19 distinguishes Stage from State: Waiting/Gathering/Your Turn/Completed are workflow stages; Cooling Down, On My Way, and Nearby are conditions within stages. Completed 2026-08-19 after Product Owner exercised authorized forward/backward operational transitions with real SOTC records, including On My Way, Nearby, Your Turn, Return to Waiting/cooldown, Not Here-related paths, and completion. On My Way is persisted as a real Gathering State marker; Nearby remains the stronger Gathering State and makes the guest callable. Overrides are accepted for live operational reconciliation while automation remains the default."
          }
        ]
      }
    ]
  },
  {
    "id": "epic-stabilization",
    "title": "Cleanup and Stabilization Before Multi-Org",
    "summary": "Clean up known issues and local workflow friction before building the larger organization/event structure.",
    "status": "current",
    "themes": [
      {
        "id": "theme-guest-access-cleanup",
        "title": "Guest Access and Queue Rules",
        "status": "current",
        "stories": [
          {
            "id": "story-bouquet-access-fixed",
            "title": "Fix Bouquet Bar eligibility messaging",
            "status": "done",
            "sprint": "now",
            "summary": "Guests now see different Bouquet Bar messages depending on whether they are not checked in, checked in as general admission, or checked in with Festival + Flowers.",
            "acceptanceCriteria": [
              "Not checked in guests are prompted to check in.",
              "General admission guests are blocked with the correct explanation.",
              "Festival + Flowers guests can join the queue."
            ],
            "notes": "Verified on phone after Vercel deploy."
          },
          {
            "id": "story-peony-main-event-weird-queue-number",
            "title": "Hotfix Peony main event weird queue number",
            "status": "current",
            "sprint": "now",
            "summary": "Fix the Peony event main guest screen showing a stale or incorrect line number that does not match the guest's actual queue position.",
            "acceptanceCriteria": [
              "Reproduce the case where the main event screen shows a number like #490 while the actual guest queue position is 23.",
              "Identify whether the page is displaying ticket id, stale localStorage state, the wrong queue, or an aggregate queue value.",
              "Main event guest messaging displays the correct queue status or does not display a misleading queue number.",
              "Flower Photos and Wrapped Bouquets queue ticket displays remain correct.",
              "The fix does not break admin queue advancement or guest served/removed behavior."
            ],
            "notes": "Captured from Product Inbox bug: Peony event - main event guest shows a weird queue number. Treat as a hotfix before deeper multi-org work."
          },
          {
            "id": "story-cleanup-before-multi-org",
            "title": "Complete cleanup pass before multi-organization build",
            "status": "done",
            "sprint": "now",
            "summary": "Keep a short, explicit cleanup list so known issues are reviewed before the architecture expands.",
            "acceptanceCriteria": [
              "Known guest-flow bugs are either fixed or documented.",
              "Known local build/workflow issues are captured.",
              "Deferred cleanup items are separated from multi-org stories."
            ],
            "notes": "Completed with docs/pre-multi-org-cleanup.md. Demo-specific Peony behavior is intentionally preserved and deferred until the multi-org foundation can absorb it safely."
          },
          {
            "id": "story-preserve-peony-demo",
            "title": "Migrate Peony Festival into a demo organization without breaking it",
            "status": "done",
            "sprint": "now",
            "summary": "Create a demo/test organization for Peony Festival and use it as the safety check while organizations and event ownership are introduced.",
            "acceptanceCriteria": [
              "A demo/test organization exists for the Peony Festival demo.",
              "The Peony Festival event is assigned to that demo organization.",
              "Existing Peony Festival URLs keep working.",
              "Flower Photos and Wrapped Bouquets queues remain usable for demos.",
              "Demo-specific assumptions are documented before they are generalized.",
              "The migration explicitly preserves the 'please do not break the demo' requirement."
            ],
            "notes": "Completed at the foundation level in supabase-org-event-foundation.sql: Walnut Ridge Farm is seeded as the Peony owner, Peony keeps its existing slug/guest URLs, and demo-specific assumptions remain documented in docs/hard-coded-demo-assumptions-audit.md."
          },
          {
            "id": "story-admin-update-guest-access",
            "title": "Allow admin to update guest access after check-in",
            "status": "done",
            "sprint": "now",
            "summary": "Let an admin correct or upgrade a checked-in guest's access, such as changing a Peony guest from general admission to Festival + Flowers so they can join Wrapped Bouquets.",
            "acceptanceCriteria": [
              "Admin can view a guest's current event check-in access type.",
              "Admin can upgrade a checked-in guest from general admission to Festival + Flowers.",
              "Updated access is respected by the Wrapped Bouquets queue guard without requiring a new phone/browser identity.",
              "The pattern is documented as a precursor to SOTC access tags such as student, professional, and professional-with-photo."
            ],
            "notes": "Implemented for Peony event check-ins as a one-way correction from general to Festival + Flowers access. SOTC photo credit states should be modeled separately."
          },
          {
            "id": "story-hardcoded-demo-assumptions-audit",
            "title": "Identify hard-coded demo assumptions before foundation build",
            "status": "ready",
            "sprint": "now",
            "summary": "Audit the app for Peony-specific, Bouquet-specific, static-image, route-guard, and demo-only assumptions before they are generalized or removed.",
            "acceptanceCriteria": [
              "Hard-coded event slugs, queue slugs, ticket/access types, static event content, image paths, and demo route guards are listed.",
              "Each item is classified as keep-for-demo, migrate-to-data, generalize-now, or remove-later.",
              "Peony demo safety requirements are captured beside each risky item.",
              "Findings produce follow-up implementation stories rather than broad untracked cleanup."
            ],
            "notes": "Identification is separate from removal so the Peony demo remains stable while the multi-org foundation is introduced."
          },
          {
            "id": "story-remove-hardcoded-demo-assumptions",
            "title": "Remove or generalize hard-coded demo assumptions",
            "status": "ready",
            "sprint": "next",
            "summary": "Replace audited hard-coded demo assumptions with organization/event/experience data once the foundation exists.",
            "acceptanceCriteria": [
              "Only items classified for removal or generalization are changed.",
              "Peony remains demonstrable after each removal/generalization step.",
              "SOTC can be modeled without copying Peony-specific code paths.",
              "Static content or images move to data/storage only after ownership is defined."
            ],
            "notes": "This follows the hard-coded assumptions audit and should be split into smaller implementation stories if the list is large."
          },
          {
            "id": "story-event-guest-data-cleanup",
            "title": "Clean up event guest and check-in data before org migration",
            "status": "ready",
            "sprint": "now",
            "summary": "Review and normalize Peony demo guest/check-in data before it is carried into an organization-based system.",
            "acceptanceCriteria": [
              "Identify test/demo guest and event_check_ins rows that should be archived, deleted, renamed, or preserved.",
              "Identify completed event_check_ins rows with null or ambiguous ticket_type values.",
              "Decide whether null ticket_type values should become general for Peony demo rows.",
              "Confirm which Peony guest/check-in data should remain available for demonstrations.",
              "Document any cleanup SQL or manual Supabase steps before changing live data.",
              "Do not mutate production/demo data until the cleanup plan is reviewed."
            ],
            "notes": "Prompted by observing a completed event_check_ins row with NULL ticket_type. This is data cleanup/planning first, not an immediate data mutation."
          }
        ]
      },
      {
        "id": "theme-local-workflow-cleanup",
        "title": "Local Build and Tooling Friction",
        "status": "current",
        "stories": [
          {
            "id": "story-dist-images-lock",
            "title": "Track recurring app/dist/images build lock",
            "status": "done",
            "sprint": "now",
            "summary": "Normal npm run build can fail when Windows/Dropbox locks generated app/dist/images, even though TypeScript and Vite bundling pass.",
            "acceptanceCriteria": [
              "Document that this is generated-folder lock behavior, not an app compile failure.",
              "Keep npx vite build --emptyOutDir false as a temporary verification fallback.",
              "Decide whether to move generated build output away from Dropbox or change local cleanup workflow."
            ],
            "notes": "Completed 2026-08-18: added npm run build:verify:local, which runs TypeScript and Vite with output directed to the system temp folder so local verification does not depend on clearing Dropbox-managed app/dist/images. Production build behavior is unchanged."
          },
          {
            "id": "story-sandbox-spawn-hiccup",
            "title": "Track intermittent Windows sandbox spawn hiccup",
            "status": "current",
            "sprint": "now",
            "summary": "Some shell commands occasionally fail before execution with a Windows sandbox spawn setup refresh error.",
            "acceptanceCriteria": [
              "Capture the symptom in the cleanup list.",
              "Use approved reruns only when needed.",
              "Do not treat pre-execution spawn failures as code failures."
            ],
            "notes": "Seen with normal build and git diff-stat/diff style commands."
          },
          {
            "id": "story-git-command-friction",
            "title": "Track intermittent Git command friction",
            "status": "current",
            "sprint": "now",
            "summary": "Occasional diff/status commands hit local sandbox friction, but Git operations have succeeded after safe reruns.",
            "acceptanceCriteria": [
              "Keep GitHub push path working.",
              "Avoid interactive Git commands.",
              "Document when command failures are environmental rather than repository state."
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "epic-product-management",
    "title": "Product Management Workspace",
    "summary": "A repo-native planning tool that preserves epics/themes/stories and shows both roadmap hierarchy and sprint focus.",
    "status": "current",
    "themes": [
      {
        "id": "theme-roadmap-tool",
        "title": "Roadmap Tool",
        "status": "current",
        "stories": [
          {
            "id": "story-planning-workspace",
            "title": "Create static planning workspace",
            "status": "done",
            "sprint": "now",
            "summary": "Add HTML pages in the repo for roadmap, backlog, and sprint review views.",
            "acceptanceCriteria": [
              "Planning pages open locally without a backend.",
              "Epics expand to show themes and stories.",
              "Sprint view uses the same story data as the roadmap."
            ],
            "notes": "This should be easy for Codex, Claude Code, or a human developer to inspect."
          },
          {
            "id": "story-roadmap-data-model",
            "title": "Store roadmap as structured data",
            "status": "done",
            "sprint": "now",
            "summary": "Keep roadmap content in a single data file so graphical views do not duplicate cards.",
            "acceptanceCriteria": [
              "Epics, themes, stories, sprints, and inbox notes live in one source file.",
              "Stories can be reused across views by id.",
              "Status and sprint assignment are visible."
            ]
          },
          {
            "id": "story-triage-inbox",
            "title": "Add product inbox for emailed thoughts",
            "status": "done",
            "sprint": "now",
            "summary": "Create a place for raw notes to be captured, triaged, promoted to stories, or parked.",
            "acceptanceCriteria": [
              "Inbox items can be tagged as consider, promote, or defer.",
              "Raw wording can be preserved while product implications are clarified.",
              "Deferred ideas remain visible without distracting the current sprint."
            ]
          },
          {
            "id": "story-import-trello-detail-cards",
            "title": "Import detailed Trello cards into product board",
            "status": "done",
            "sprint": "now",
            "summary": "Review screenshots/PDF of detailed Trello cards and reconcile them into the repo-based product roadmap.",
            "acceptanceCriteria": [
              "Trello card screenshots are collected into a PDF or readable image set.",
              "PDF is reviewed for overlap with existing roadmap epics, themes, and stories.",
              "New or missing items are added to the roadmap or product inbox.",
              "Duplicate items are merged, linked, or noted against existing stories.",
              "Open questions from Trello are captured separately as decisions or discovery items."
            ],
            "notes": "Imported from sotc planning doc.pdf on 2026-06-10. Most items overlapped existing epics; missing details were added as role, event scheduling, eCe lifecycle, SOTC registration, and admin operations cards."
          },
          {
            "id": "story-planning-admin-access-controls",
            "title": "Replace planning access code with admin controls",
            "status": "done",
            "sprint": "now",
            "summary": "Move the deployed planning workspace from a shared access code to qME admin-aware controls so roadmap viewing, editing, and syncing are governed like the rest of the platform.",
            "acceptanceCriteria": [
              "Planning access no longer depends on the hard-coded/shared planning code as the primary control.",
              "qME superadmin can view and edit the planning workspace.",
              "Future organization/admin visibility rules are documented before exposing planning data outside qME operators.",
              "Planning document writes/syncs are restricted to approved admin roles.",
              "Temporary fallback access, if retained during transition, is labeled with risk and removal intent."
            ],
            "notes": "Completed on 2026-06-29: /planning now unlocks from the same Supabase Auth session used by /admin, and /api/planning-data verifies that the caller is an active qME superadmin before allowing roadmap reads or writes. The old shared planning access code and cookie gate were removed from the planning route. Future expansion can add org-scoped planning visibility once the product planning model needs collaborators beyond qME operators."
          }
        ]
      },
      {
        "id": "theme-sprint-review",
        "title": "Sprint Review Rhythm",
        "status": "ready",
        "stories": [
          {
            "id": "story-sprint-review-template",
            "title": "Define sprint review checklist",
            "status": "ready",
            "sprint": "next",
            "summary": "Use a lightweight review concept for what changed, what was learned, what is next, and what decisions are needed.",
            "acceptanceCriteria": [
              "Review view shows current sprint goal.",
              "Done, carried, added, and deferred items are visible.",
              "Open decisions are separated from implementation work."
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "epic-org-admin",
    "title": "Organizations and Admin Accounts",
    "summary": "Support qME customers as organizations with admins, staff, and scoped access.",
    "status": "ready",
    "themes": [
      {
        "id": "theme-organizations",
        "title": "Organizations",
        "status": "ready",
        "stories": [
          {
            "id": "story-org-table",
            "title": "Create organizations table",
            "status": "done",
            "sprint": "now",
            "summary": "Add the core organization model so qME is no longer only a single demo/event app.",
            "acceptanceCriteria": [
              "Supabase has an organizations table.",
              "Organizations have name, slug, status, and timestamps.",
              "Existing Peony Festival data can belong to a default organization."
            ],
            "notes": "Completed in supabase-org-event-foundation.sql: creates organizations, adds events.organization_id, seeds Walnut Ridge Farm, qME Demo, and Summer on the Cuyahoga, and keeps policies temporary until Sprint 2 roles/RLS hardening."
          },
          {
            "id": "story-governance-principles-foundation",
            "title": "Define governance principles for multi-org foundation",
            "status": "done",
            "sprint": "now",
            "summary": "Use the authority/object governance model to settle the minimum role, authority, ownership, and audit principles before building superadmin, organization, and admin structures.",
            "acceptanceCriteria": [
              "Superadmin, organization admin, and staff boundaries are defined.",
              "Active organization context behavior is decided for users who belong to multiple organizations.",
              "Organizations owning events is confirmed as a foundation rule.",
              "Role assignment/removal and sensitive governance actions are identified as audit candidates.",
              "Sensitive operations needing confirmation or later PIN/process are identified.",
              "Full custom permissions are explicitly deferred.",
              "Decisions are translated into initial table/schema requirements before implementation."
            ],
            "notes": "Completed in docs/admin-governance-v1.md. This sets the Sprint 2 boundaries for super admin, org admin, event admin, staff, station/service provider, guest access, audit candidates, and deferred custom permissions."
          },
          {
            "id": "story-image-ownership-model",
            "title": "Define image ownership model before schema work",
            "status": "ready",
            "sprint": "now",
            "summary": "Decide where organization logos, event images, experience images, sponsor logos, resource images, and gallery images belong before tables and storage are implemented.",
            "acceptanceCriteria": [
              "Image ownership is defined for organizations, events, experiences/eCe's, sponsors, resources, and galleries.",
              "Initial database fields or image reference strategy are identified before event schema work proceeds.",
              "Managed storage implementation remains a separate story.",
              "Static app images are limited to defaults/placeholders over time.",
              "Peony and SOTC image needs are both considered."
            ],
            "notes": "This is the pre-build design decision. The separate managed image storage story covers Supabase Storage and upload/selection implementation."
          },
          {
            "id": "story-seed-sotc-org",
            "title": "Seed Summer on the Cuyahoga organization",
            "status": "done",
            "sprint": "now",
            "summary": "Create Summer on the Cuyahoga as a first real organization for the Rock Hall event demo.",
            "acceptanceCriteria": [
              "Organization slug is stable.",
              "The organization can own the July 22 Rock Hall event.",
              "Future staff/admin records can be attached."
            ],
            "notes": "Completed in supabase-org-event-foundation.sql with slug summer-on-the-cuyahoga and SOTC event ownership backfill for sotc-test-check-in and future sotc-rock-hall."
          },
          {
            "id": "story-org-staff",
            "title": "Model organization staff",
            "status": "current",
            "sprint": "now",
            "summary": "Allow organizations to invite staff or assign event-specific roles.",
            "acceptanceCriteria": [
              "One person can belong to one or more organizations.",
              "Staff permissions can be narrower than owner/admin permissions.",
              "Staff can be assigned to event operations later.",
              "A user with multiple organizations can choose which organization/account context to use after login."
            ],
            "notes": "Schema foundation added in supabase-admin-role-foundation.sql with admin_principals, organization_memberships, and event_staff_assignments. App passes added: Organization Staff panel for org_admin/universal_staff memberships; Event Staff panel on admin event detail for event_admin, check_in_staff, and feature-scoped service_staff/service_provider/station_account assignments by existing admin principal email. Invite emails, smoother new-user flow, and role-aware database RLS enforcement remain in Sprint 2."
          }
        ]
      },
      {
        "id": "theme-admin-roles",
        "title": "Admin Account Management",
        "status": "ready",
        "stories": [
          {
            "id": "story-admin-org-role",
            "title": "Add admin and organization roles",
            "status": "current",
            "sprint": "now",
            "summary": "Separate qME superadmin access from organization admin access.",
            "acceptanceCriteria": [
              "A qME superadmin can manage all organizations.",
              "An organization admin can manage only their organization.",
              "Role checks are documented before sensitive admin screens expand.",
              "Superadmin can assume an admin role in an organization for support.",
              "Admin operational actions such as start, pause, end, and reset have extra friction such as confirmation or PIN."
            ],
            "notes": "Schema foundation added in supabase-admin-role-foundation.sql with platform_roles for superadmin/support, organization memberships for org_admin/universal_staff, event staff assignments, and helper functions for the RLS pass. App enforcement pass added: AdminGate displays organization/event roles, superadmin can see all orgs/events, org admins are scoped to their organizations, event/station staff are scoped to assigned events, and setup controls are hidden from non-managers. Database RLS enforcement is still temporary until SOTC RLS hardening."
          },
          {
            "id": "story-authentication-cleanup",
            "title": "Clean up authentication path for admin and staff",
            "status": "current",
            "sprint": "now",
            "summary": "Choose and implement the near-term authentication structure for qME admin, organization admin, event staff, and temporary pilot operations.",
            "acceptanceCriteria": [
              "Current demo/admin access assumptions are listed.",
              "Near-term admin/staff login approach is chosen.",
              "qME admin, organization admin, and event/station staff access paths are separated enough to support RLS work.",
              "Temporary access shortcuts are documented with expiration or replacement intent.",
              "Guest/anon access remains available for event check-in and queue participation without exposing staff actions.",
              "The authentication decision feeds the SOTC RLS hardening story."
            ],
            "notes": "Sprint 2 focus from post-alpha planning: do this before asking the computer engineering student to review database hardening, so the review has concrete role/auth structure. Near-term decision is documented in docs/admin-auth-transition-v1.md. AdminGate now requires Supabase Auth users linked to admin_principals and shows a visible admin identity/role bar; the old passphrase fallback has been removed. Superadmin utility added at /admin/principals to list admin principals, create named principals, link an existing Supabase Auth user UUID, and create a Supabase Auth login plus qME principal from the tool when SUPABASE_SERVICE_ROLE_KEY is configured server-side. One email/Auth user should map to one admin principal, and that principal may hold memberships in multiple organizations; UI should preserve that rather than duplicating users per organization. Role-scoped routing is active; first RLS hardening pass is drafted, while invite-email automation and temporary-password-change enforcement remain pending."
          },
          {
            "id": "story-temp-password-first-login",
            "title": "Require temporary admin/staff password change on first login",
            "status": "current",
            "sprint": "now",
            "summary": "Make admin-created temporary passwords explicit by requiring a staff/admin user to set a new password before using protected admin tools.",
            "acceptanceCriteria": [
              "Admin-created users can be marked as requiring a password change.",
              "A user with a required password change is redirected to a password-change screen after sign-in.",
              "Protected admin tools are blocked until the password change is completed.",
              "Supabase Auth password update succeeds from the signed-in user's session.",
              "The temporary-password flag is cleared only after a successful password update.",
              "The current Jalani/SOTC pilot setup is documented as a temporary manual-password bridge until this story is implemented."
            ],
            "notes": "Added during Sprint 2 while creating Jalani as an event admin for the SOTC test. Current pilot flow can use a manually shared temporary password, but production-ready staff onboarding should not leave temporary credentials as permanent credentials."
          },
          {
            "id": "story-role-permissions-audit",
            "title": "Define role permissions and audit logs",
            "status": "future",
            "sprint": "future",
            "summary": "Model organization roles as permission sets and record sensitive admin actions with actor, timestamp, and rationale.",
            "acceptanceCriteria": [
              "Roles can grant capabilities such as create, edit, view, delete, check-in, pause/resume, skip/reorder, merge/split, and priority override.",
              "User state can be live, suspended, or unsuspended.",
              "Sensitive operational actions create audit log entries with actor identity and timestamp.",
              "The model can start with default roles and allow later customization."
            ],
            "notes": "Imported from Trello admin/staff role cards and provisional admin console notes. Initial audit table added in supabase-admin-role-foundation.sql; audit-writing behavior and polished audit UI remain future work."
          },
          {
            "id": "story-sotc-admin-staff-rls-hardening",
            "title": "Define SOTC admin/staff roles and Supabase RLS boundaries",
            "status": "done",
            "sprint": "completed",
            "summary": "Review and harden the SOTC pilot database permission model before moving beyond guided alpha testing.",
            "acceptanceCriteria": [
              "Role matrix exists for qME admin, event admin, check-in staff, service staff/photographer, and guest/anon.",
              "Each protected SOTC pilot table has intended read/write rules documented.",
              "Current permissive policies, including broad using true and with check true policies, are listed with replacement policy recommendations.",
              "Guest-owned actions are separated from staff-owned actions such as granting photo credits, resetting queues, releasing guests, and marking headshots complete.",
              "Queue transition and ticket ownership checks needed at the database/function layer are identified.",
              "Audit needs are documented for check-in, credit granted, nearby, released, completed, not here, and reset actions.",
              "Near-term pilot auth approach is chosen: Supabase Auth, magic link, staff PIN, invite code, or a documented temporary bridge.",
              "Remaining database/security risks are documented before real event use."
            ],
            "notes": "Alpha-test follow-up from computer engineering student feedback: the pilot works, but the database needs manual hardening around roles, RLS, action ownership, and auditability before real SOTC operations. First RLS hardening pass added in supabase-sotc-rls-hardening.sql with companion notes in docs/sotc-rls-hardening-v1.md: admin principals/roles/memberships/event staff assignments are scoped to authenticated admins, event guest designations are staff/admin managed, guest credit writes are staff/admin only, and guest-sourced scan/code marks remain open for pilot completion. Second pass added in supabase-sprint2-setup-rls.sql: active organizations/events/expies/eCes/legacy experiences/queues remain guest-readable, while setup writes are restricted to qME superadmin, organization admin, or event admin. Third pass drafted in supabase-guest-session-foundation.sql: anonymous guest browsers receive event-scoped session tokens, event_check_ins/tickets can link to guest_sessions, queue RPC overloads can attach/verify ticket ownership, and the guest check-in form can optionally capture email/phone for later recovery. Fourth pass drafted in supabase-guest-action-rls-tightening.sql: guest check-in reads/completion, ticket reads/name updates/nearby/completion, guest marks, and guest credit reads move behind guest-token verified RPCs, while direct table access for event_check_ins, tickets, event_guest_marks, and event_guest_credits becomes staff/admin scoped. July 1 app hardening update: guest-facing actions now fail closed when the scoped RPC is missing or rejects the guest token, instead of falling back to unscoped direct table access. July 1 SQL follow-up: guest-session and guest-action functions now explicitly revoke default public execution and grant only intended browser RPCs to anon/authenticated roles. Admin queue RPC boundary pass added in supabase-admin-queue-action-rpcs.sql: release, Not Here, Return to Waiting, and staff/admin completion now use authenticated role-checked RPCs with basic audit logs instead of direct browser table mutations. Admin check-in RPC boundary pass added in supabase-admin-checkin-action-rpcs.sql: check-in completion, guest access/ticket-type updates, and photo-credit grants now use authenticated role-checked RPCs with audit logs instead of direct browser mutations. Reminder: re-engage the computer engineering student after this pass is run and smoke-tested so his review can focus on concrete policies and remaining risks."
          },
          {
            "id": "story-foundation-role-permission-smoke-matrix",
            "title": "Run role and permission smoke-test matrix",
            "status": "current",
            "sprint": "now",
            "summary": "Validate that each qME role can do what it should and cannot overreach into another organization, event, station, or guest state.",
            "acceptanceCriteria": [
              "qME superadmin, organization admin, event admin, check-in staff, feature/station staff, and guest/anonymous paths are tested.",
              "A signed-in admin/staff user participating as a guest is tested as a separate guest-session context, not as an admin identity.",
              "Guest attempting an admin URL is blocked.",
              "Check-in staff attempting queue admin is blocked unless assigned that scope.",
              "Feature/station staff attempting event setup is blocked.",
              "Station staff and station admin boundaries are tested where a station has elevated local actions.",
              "Organization admin attempting another organization's event is blocked.",
              "Event admin attempting an unrelated event is blocked.",
              "Superadmin can access support/admin areas.",
              "Guest token cannot read or mutate another guest's state."
            ],
            "notes": "Added by the 2026-07-01 Foundation Review. This is validation, not a broad new build phase. July 16 security smoke test verified the roles currently in real use: anonymous guests can check in, join Headshot, mark nearby, and complete via guest self-service; qME superadmin can complete check-in, grant photo credit, operate Headshot, and complete guests; Jalani/event admin can reset event test data after the hardening changes. Station Staff and Station Supervisor are not yet fully productized roles, so their smoke test remains pending under role-aware admin landing and station-role finalization."
          },
          {
            "id": "story-foundation-privileged-action-matrix",
            "title": "Document privileged action matrix",
            "status": "done",
            "sprint": "now",
            "summary": "Create a concise matrix of sensitive actions, their RPC/function path, required role, audit behavior, RLS/table protection, and remaining risk.",
            "acceptanceCriteria": [
              "Matrix includes release guest, mark Not Here, Return to Waiting, complete ticket, complete check-in, grant photo credit, update guest access, reset test data, edit event setup, edit queue settings, and live queue controls.",
              "Each action has a user-facing action name, code/RPC path, required role, audit behavior, RLS protection, and remaining risk.",
              "Matrix distinguishes event-wide/destructive authority from station-level staff and station-admin authority.",
              "Any direct-client/RLS-backed action is identified as accepted for now, moved to a follow-up, or replaced with an RPC."
            ],
            "notes": "Added by the 2026-07-01 Foundation Review to prevent protection gaps from hiding inside scattered UI/service calls. Completed July 16 with docs/privileged-action-matrix-v1.md. The matrix documents guest check-in/session actions, admin check-in/photo-credit actions, queue flow/release/Not Here/Return to Waiting/completion, Headshot guest service-start self-completion, destructive reset controls, setup mutations, admin principal management, and bootstrap restrictions. Current conclusion: emergency anonymous/admin RPC boundaries are much stronger and verified live; the next layer is station-role clarity, role-aware workspace visibility, and moving remaining important setup mutations behind named audited RPCs where direct RLS is still ambiguous."
          },
          {
            "id": "story-foundation-external-db-security-review",
            "title": "Re-engage computer engineering student for database/security review",
            "status": "done",
            "sprint": "now",
            "summary": "Ask the student reviewer to critique the implemented role/auth/RLS/RPC foundation rather than brainstorm an open-ended redesign.",
            "acceptanceCriteria": [
              "Review packet includes role model, guest token approach, RLS policies, RPC boundaries, audit logging, and remaining permissive policies.",
              "Reviewer is asked to look for obvious guest/staff/admin overreach paths.",
              "Findings are captured as planning inbox items, decisions, or stories.",
              "Follow-up work is bounded before SOTC Event Builder resumes."
            ],
            "notes": "Completed July 20 after Ahmed reviewed the security remediation report and confirmed qME is good for the July SOTC pilot, with remaining items safely deferrable. Future security reviews should continue the same evidence-based process: independent review, verification, risk classification, bounded remediation, regression testing, production validation, and documentation."
          },
          {
            "id": "story-foundation-jalani-admin-walkthrough",
            "title": "Run Jalani named-admin walkthrough",
            "status": "current",
            "sprint": "now",
            "summary": "Have Jalani walk through the SOTC admin/event-staff flow using named access to validate whether the role and UI model makes sense without founder guidance.",
            "acceptanceCriteria": [
              "Jalani can sign in with named access.",
              "If Jalani participates as a guest, that flow uses guest-session state and is not confused with admin sign-in.",
              "Jalani can reach the SOTC event and not unrelated admin areas.",
              "Walkthrough covers admin tabs, check-in flow, queue flow, Not Here, Return to Waiting, and photo-credit/headshot flow.",
              "Confusing labels, missing affordances, and permission surprises are captured."
            ],
            "notes": "Initial sign-in and scoped event-admin access are already verified. This story is the deeper usability/operations walkthrough."
          },
          {
            "id": "story-security-emergency-remediation",
            "title": "Complete Ahmed security emergency remediation pass",
            "status": "done",
            "sprint": "now",
            "summary": "Verify and close confirmed high-risk security findings from Ahmed's review before resuming nonessential feature expansion.",
            "acceptanceCriteria": [
              "Each emergency finding is classified as confirmed/exploitable, confirmed lower-risk, already fixed, not reproducible, or deferred defense-in-depth.",
              "Anonymous group-order writes and broad guest-credit reads are verified against live Supabase and closed if present.",
              "Flexlink intake no longer contains committed secret/hash material, no longer uses a hash as a bearer cookie, and hard-fails without service-role configuration.",
              "Credit consumption requires durable guest/check-in identity and does not authorize by display name.",
              "Superadmin/bootstrap and other privileged functions have explicit execute grants and cannot be called by ordinary authenticated users.",
              "Verification SQL, remediation SQL, tests, manual deployment actions, and remaining risks are documented for Ahmed follow-up."
            ],
            "notes": "Added by the 2026-07-16 security review. This paused unrelated feature expansion until emergency findings were verified and closed. July 16 follow-up: smoke-test reset bug was fixed, then security work resumed by updating remediation/current SQL to revoke anonymous direct table grants from admin_principals, platform_roles, organization_memberships, event_staff_assignments, event_check_ins, tickets, event_guest_marks, event_guest_credits, and event_group_order_items while preserving authenticated RLS access and scoped anonymous guest RPCs. Live verification now shows sensitive table RLS enabled, no direct anon table grants on the reviewed sensitive tables, no permissive using-true policies on those tables, no guest-credit rows without check-in ownership, clean group-order data audit, legacy unscoped guest queue RPCs revoked, queue reset restricted to event-admin-or-above internally, and admin/staff RPC execute grants cleaned so anon is false and authenticated remains true with internal role checks. Functional smoke test after remediation verified guest check-in/Headshot self-service, superadmin check-in/photo-credit/queue operation, and Jalani event-admin reset. July 17 clarification: the prior group-order pilot is disabled security debt, not a partially supported feature. Keep existing data for audit, mark old pilot SQL as superseded/dangerous, add a regression check for permissive group-order writes, and do not re-enable ordering until guest-session-owned order records, scoped RPCs, station/event staff authorization, server-side quantity/state validation, idempotency, audit logging, and draft/submitted/approved/fulfilled order states exist. July 17 finding-by-finding evidence packet added in docs/security-review-ahmed-finding-evidence-2026-07-17.md. Final bounded pre-SOTC pass added repo fixes for the remaining immediate hardening items: revoked/replaced guest sessions no longer reactivate on retry, guest self-check-in ticket type is constrained to a nonprivileged allowlist and cannot overwrite authoritative classifications, and admin/staff principal lookup now uses exact normalized email equality with duplicate-match refusal instead of wildcard-sensitive ilike. July 20 closure: production regression SQL passed, live verification remained clean, guest/admin smoke testing passed, and Ahmed confirmed the remaining work can be deferred until after the SOTC pilot. Emergency remediation is closed. Remaining items are security maturity backlog, not emergency work: provider-level rate limiting, invite/password-reset workflow, additional audited administrative RPCs where appropriate, browser-storage improvements, mobile security enhancements, group-order secure redesign, additional security monitoring/auditing, npm ci/build reproducibility after SOTC, canonical auth-user identity/multi-email modeling, and station-role product finalization."
          },
          {
            "id": "story-guest-session-recovery-code",
            "title": "Let guests recover their event session by email or phone code",
            "status": "future",
            "sprint": "future",
            "summary": "Allow an anonymous guest to provide email or phone, receive a short code, and recover their event check-in, queue tickets, and submitted activity state on another browser/device.",
            "acceptanceCriteria": [
              "Guest check-in can capture email or phone as an optional contact method.",
              "Guest can request a one-time code to recover their event session.",
              "Successful code verification restores the guest's check-in and active tickets without creating a full admin account.",
              "Codes expire and cannot be reused.",
              "The feature does not expose other guests' check-ins, tickets, credits, or order/activity submissions."
            ],
            "notes": "Added during Sprint 2 guest-session hardening discussion. The first foundation pass stores optional email/phone on guest_sessions but does not yet send or verify recovery codes."
          },
          {
            "id": "story-superadmin-role",
            "title": "Define qME superadmin role",
            "status": "future",
            "sprint": "future",
            "summary": "Add explicit owner/operator permissions for qME platform management.",
            "acceptanceCriteria": [
              "Superadmin role is distinct from event host role.",
              "Superadmin can create organizations.",
              "Superadmin can assist customer event setup."
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "epic-events",
    "title": "Events",
    "summary": "Create and manage events owned by organizations, including public guest pages and admin configuration.",
    "status": "ready",
    "themes": [
      {
        "id": "theme-event-lifecycle",
        "title": "Event Lifecycle",
        "status": "ready",
        "stories": [
          {
            "id": "story-event-org-owner",
            "title": "Attach events to organizations",
            "status": "done",
            "sprint": "now",
            "summary": "Make event ownership explicit so each customer can manage their own events.",
            "acceptanceCriteria": [
              "events.organization_id references organizations.id.",
              "Existing guest URLs keep working.",
              "Admin event lists can filter by organization."
            ],
            "notes": "Completed in supabase-org-event-foundation.sql and app services: events.organization_id references organizations, known Peony and SOTC events are assigned, public URLs remain slug-based, and listEvents can filter by organizationId."
          },
          {
            "id": "story-event-create-edit",
            "title": "Create and edit events",
            "status": "ready",
            "sprint": "now",
            "summary": "Allow an admin or qME operator to set up an event without code changes.",
            "acceptanceCriteria": [
              "Admin can create event name, slug, date, venue, and status.",
              "Admin can edit event details.",
              "Validation protects unique slugs within an organization.",
              "Event can store short description, long description, location, and multi-day start/end windows."
            ]
          },
          {
            "id": "story-event-operational-mode-config",
            "title": "Make event automation and operating mode configurable",
            "status": "current",
            "sprint": "now",
            "summary": "Replace hidden SOTC test/demo automation assumptions with explicit event-level operating settings so each organization knows how an event will behave.",
            "acceptanceCriteria": [
              "Event setup can represent whether check-in, guest participation, and queue flow are manual, self-service, pilot/demo, or automated where relevant.",
              "SOTC Test Check-in keeps its current automated/pilot behavior through explicit configuration rather than hard-coded event assumptions.",
              "Production events default to conservative/manual behavior unless automation is intentionally enabled.",
              "Admin-facing language explains the selected mode well enough for qME operator, organization admin, and event staff use.",
              "Live Event Controls are distinguished from Event Setup: queue flow mode, gathering target, gathering max, stale timing, pause/resume, and intake behavior are operational controls that may change during an active event.",
              "Only event admin, organization admin, or qME superadmin can modify live event controls; station staff can operate assigned stations without changing event-wide controls unless separately granted station-admin authority.",
              "Test-data reset permissions distinguish test/demo rehearsal operations from live-event destructive operations.",
              "If a reset confirmation is typed incorrectly, the admin receives a clear message that no reset happened.",
              "Any temporary pilot flags are documented with replacement intent before RLS hardening."
            ],
            "notes": "Added during Sprint 2 product discussion after confirming that SOTC's automated test behavior should be configurable by event. This supports the Sprint 2 trust goal: an organization can independently operate an event with appropriate permissions and predictable behavior. 2026-07-01 architecture review clarified the distinction between Event Setup, Live Operations, and Live Event Controls: controls such as queue flow mode, gathering target/max, stale timing, pause/resume, and intake behavior belong with operations and should be editable only by event admin or higher. Current implementation lets event admins reset test data because event_admin satisfies canManageEvent; before live production, decide whether destructive reset should require org admin/superadmin, event test mode, or a separate reset permission. Reset confirmation feedback was tightened on 2026-06-30 so wrong confirmation text reports that no reset happened."
          },
          {
            "id": "story-event-schedules-recurrence",
            "title": "Support event schedules and recurrence",
            "status": "future",
            "sprint": "future",
            "summary": "Allow events to span multiple days, have multiple daily start/stop blocks, and later support recurring schedules.",
            "acceptanceCriteria": [
              "Event can represent multi-day date/time windows.",
              "Event can represent multiple time blocks in a day, such as breakfast, lunch, happy hour, or session blocks.",
              "Calendar-style event schedule view is considered.",
              "Recurring event rules are parked for later unless a customer requires them."
            ],
            "notes": "Imported from Trello event creation card."
          },
          {
            "id": "story-event-type-templates",
            "title": "Define event types and templates",
            "status": "future",
            "sprint": "future",
            "summary": "Use event types such as festival, conference, concert, sporting event, speaker event, or trade show to seed useful default experiences.",
            "acceptanceCriteria": [
              "Event type list is documented.",
              "Each event type can suggest expected experience types.",
              "Templates remain optional and do not block simple event creation."
            ],
            "notes": "Imported from Trello Events have types card."
          },
          {
            "id": "story-event-suspend",
            "title": "Suspend or archive events",
            "status": "future",
            "sprint": "future",
            "summary": "Give admins a controlled way to hide or close events without deleting them.",
            "acceptanceCriteria": [
              "Suspended events are not joinable by guests.",
              "Archived events remain available for reporting.",
              "Admin can see why an event is unavailable.",
              "Editing or suspension restrictions are defined when an event has active eCe/experience instances."
            ]
          }
        ]
      },
      {
        "id": "theme-sotc-anchor",
        "title": "SOTC Rock Hall Event Setup",
        "status": "current",
        "stories": [
          {
            "id": "story-sotc-anchor-event",
            "title": "Create SOTC Rock Hall event plan",
            "status": "done",
            "sprint": "now",
            "summary": "Use the July 22 event as the product anchor for multi-org and event-builder work.",
            "acceptanceCriteria": [
              "Event basics are captured in the roadmap.",
              "Known event modules are listed.",
              "Demo priorities are separated from future ideas."
            ],
            "references": [
              "I-Pitch Presentation - qMe.pptx",
              "SOTC interview notes",
              "Mixer resources page"
            ],
            "notes": "Done as the working anchor plan in docs/sotc-rock-hall-event-plan.md. Exact July 22 operating scope will be confirmed after the first SOTC foundation demo."
          },
          {
            "id": "story-sotc-experience-inventory",
            "title": "Inventory SOTC event experiences",
            "status": "ready",
            "sprint": "now",
            "summary": "Turn the brochure/program areas into event experience candidates.",
            "acceptanceCriteria": [
              "Registration, sponsors, headshots, networking, resume reviews, food, bar, greetings, workshops, galleries, and resources are captured.",
              "Each experience has an initial treatment: queue, info card, signup, notification, map, or future experiment.",
              "Queue-bearing experiences are identified first.",
              "QR entry, attendee lookup/import, registration admin view, headshot queue, resume queue, scavenger hunts, and micro-activities are represented at least as thin backlog items."
            ],
            "notes": "Do not overbuild this yet. Use the inventory to inform the foundation and later pick a thin SOTC MVP."
          },
          {
            "id": "story-sotc-hardware-needs",
            "title": "Analyze SOTC event hardware needs",
            "status": "ready",
            "sprint": "now",
            "summary": "Decide what physical hardware is needed for the July 22 Rock Hall event, then purchase or source it in time for setup and testing.",
            "acceptanceCriteria": [
              "Identify hardware needed for registration, QR display/signage, admin/staff use, host queues, and any guest-facing kiosk or display flow.",
              "Decide what can be handled by personal phones/laptops versus dedicated event hardware.",
              "Create a purchase/source list with quantities, owner, estimated cost, and needed-by date.",
              "Confirm hardware can be tested before the event in a realistic setup."
            ],
            "notes": "This should happen before finalizing the operational July 22 scope. Include backup/power/connectivity considerations."
          }
        ]
      }
    ]
  },
  {
    "id": "epic-experiences",
    "title": "Experiences and eCe's",
    "summary": "Model event activities as configurable experiences that can be information cards, queues, signups, resources, sponsor placements, or interactive activities.",
    "status": "ready",
    "themes": [
      {
        "id": "theme-experience-model",
        "title": "Experience Model",
        "status": "ready",
        "stories": [
          {
            "id": "story-experience-model",
            "title": "Create experience model",
            "status": "ready",
            "sprint": "soon",
            "summary": "Create a flexible model for event modules such as headshots, resume reviews, sponsors, greetings, galleries, and workshops.",
            "acceptanceCriteria": [
              "Experiences belong to events.",
              "Experiences have type, title, location, time window, status, and display order.",
              "An experience can optionally connect to a queue.",
              "Experience can store short/long description, image/logo/media, and configurable feature flags."
            ],
            "notes": "Trello uses 'expie' for the reusable experienceable unit. Product language can still use Experience while eCe may represent an event-specific instance. 2026-07-01 architecture reviews clarified that Experiences are the primary product unit, while queue is one reusable capability an Experience can compose. Experience Types should be reusable across events, organizations, and repeated placements within the same event; avoid SOTC-specific implementation when a reusable Experience Type is possible. Examples: Headshots may use queue, notifications, and status tracking; Food may use ordering, menu, notifications, and status tracking; Resume Reviews may use queue, staff assignment, and status tracking; Sponsors may use resources and passport. Open question: whether service-like experiences eventually justify a separate Service layer."
          },
          {
            "id": "story-experience-types",
            "title": "Define experience types",
            "status": "ready",
            "sprint": "soon",
            "summary": "Clarify types such as queue, sponsor, vendor, session, resource, food, bar, gallery, and announcement.",
            "acceptanceCriteria": [
              "Type names are documented.",
              "Sponsor and vendor are intentionally distinguished.",
              "Types drive guest UI defaults without hard-coding the SOTC event.",
              "Experience Types are reusable across multiple organizations, multiple events, and multiple placements within one event.",
              "Service-like types such as Headshots, Resume Reviews, and Food Ordering are examined without introducing a Service abstraction prematurely.",
              "Types can later provide configuration templates for headshot photographer, food truck, food/beverage vendor, performance, speaker, and similar patterns."
            ]
          },
          {
            "id": "story-experience-configuration",
            "title": "Configure experience features and content",
            "status": "future",
            "sprint": "future",
            "summary": "Allow an experience/expie to enable feature modules such as menu, queue, merchandising, media, guest-facing content, or later POS integration.",
            "acceptanceCriteria": [
              "Experience can enable/disable feature modules with configuration flags.",
              "Queue is treated as one reusable capability, not the definition of an Experience.",
              "Experience can publish guest-facing content such as descriptions, menus, prices, modifiers, allergens, preparation time, or limited-time offerings.",
              "Food/menu items can support searchable tags such as chicken, pesto, gluten free, or nuts.",
              "POS/API integration remains a future option, not a July dependency."
            ],
            "notes": "Imported from Trello Expies are created and provisional queue content cards."
          },
          {
            "id": "story-experience-hierarchy-grouping",
            "title": "Explore experience hierarchy and grouping",
            "status": "discovery",
            "sprint": "future",
            "summary": "Explore the likely reusable layer between Experience Type and Station: an organization-owned reusable definition that can be placed into one or more events/stations.",
            "acceptanceCriteria": [
              "Relationship between organization-owned expies and event-specific instances is documented.",
              "Same experience can appear in multiple locations or times.",
              "Grouping can support future smart ordering or routing.",
              "Examples are tested conceptually: Food & Beverage > Lemonade Stand > West Patio Station; Professional Headshots > Corporate Headshot > Photographer A.",
              "The model is validated through Registration, Headshots, Resume Reviews, and Food discussions before implementation.",
              "The discovery avoids adding a Service layer until enough evidence exists."
            ],
            "notes": "Imported from Trello expie hierarchy notes. July 8 Alpha 2/Product Discovery identified this as a likely missing reusable layer, but explicitly deferred implementation until more Experience Type discussions validate the shape."
          },
          {
            "id": "story-experience-suspend",
            "title": "Suspend or hide experiences",
            "status": "future",
            "sprint": "future",
            "summary": "Allow admins to turn event modules on/off before or during an event.",
            "acceptanceCriteria": [
              "Hidden experiences do not appear to guests.",
              "Suspended queues stop new joins but preserve existing tickets.",
              "Admin can restore an experience."
            ]
          }
        ]
      },
      {
        "id": "theme-ece-lifecycle",
        "title": "eCe Lifecycle",
        "status": "discovery",
        "stories": [
          {
            "id": "story-ece-definition",
            "title": "Define eCe meaning and lifecycle",
            "status": "discovery",
            "sprint": "future",
            "summary": "Clarify what an eCe is, how it is created, how it turns on, and when it resets.",
            "acceptanceCriteria": [
              "The term eCe is defined in product language.",
              "Creation, edit, suspend, activation, and reset behavior are documented.",
              "The relationship between eCe, experience, queue, and event is clear.",
              "eCe is modeled as an event-specific instance that combines an event, an expie/experience, date/time, location, and optional queue behavior.",
              "Inheritance and overrides from event and expie/experience are documented."
            ],
            "notes": "Trello import says eCe combines event + expie at specific date/time/location, can inherit properties, can be reused in multiple locations/times, and each eCe may have its own host/admin console."
          },
          {
            "id": "story-ece-cross-org-permissions",
            "title": "Define cross-organization eCe attachment permissions",
            "status": "future",
            "sprint": "future",
            "summary": "Allow an event to attach an experience owned by another organization only when permission rules allow it.",
            "acceptanceCriteria": [
              "An event organization can request to attach another organization's experience.",
              "The owning organization can approve, deny, or preconfigure attachment rules.",
              "Inherited and overridden fields are clear to both organizations."
            ],
            "notes": "Imported from Trello eCe creation card."
          },
          {
            "id": "story-ece-activation-reset",
            "title": "Define eCe activation, reset, and restricted controls",
            "status": "future",
            "sprint": "future",
            "summary": "Document how an eCe turns on, whether it activates by calendar/location/admin action, and who may reset it.",
            "acceptanceCriteria": [
              "Activation can be manual, scheduled, or later location-triggered.",
              "Activation controls guest visibility, map display, and joinability.",
              "Reset is limited to admin or special role and has extra confirmation friction.",
              "Active eCe edit/suspend restrictions are documented."
            ],
            "notes": "Imported from Trello eCe lifecycle cards."
          },
          {
            "id": "story-ece-queue-entry-limits",
            "title": "Limit queue entry by eCe state",
            "status": "future",
            "sprint": "future",
            "summary": "Prevent joining too early or after the system can no longer reasonably serve the guest.",
            "acceptanceCriteria": [
              "Queue entry can depend on experience time, capacity, and guest eligibility.",
              "Guest receives a clear reason when they cannot join.",
              "Admin can understand blocked entry counts.",
              "Queue entry can close near the end of the eCe window when the system predicts the guest cannot be served or order in time."
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "epic-queues",
    "title": "Digital Queues and Service Provider Flow",
    "summary": "Support queues for headshots, resume reviews, and similar service experiences, including guest eligibility and host/provider operation.",
    "status": "ready",
    "themes": [
      {
        "id": "theme-headshots",
        "title": "Professional Headshots",
        "status": "ready",
        "stories": [
          {
            "id": "story-headshot-queue",
            "title": "Create headshot digital queue",
            "status": "done",
            "sprint": "now",
            "summary": "Model the Headshot Photographer queue using imported-registration entitlement and staff-confirmed event check-in.",
            "acceptanceCriteria": [
              "Headshot experience has a queue.",
              "Checked-in guests can join only when the imported registration or staff grant provides an unused professional_headshot credit.",
              "Student/Professional values from the attendee file remain source metadata and do not drive queue authorization directly.",
              "Headshot queue copy follows the same clear state model as the pilot queue: Waiting, Almost Ready, I'm Nearby, Your Turn, Completed.",
              "Copy is tested with at least one student/contact for comprehension."
            ],
            "notes": "This extends the Bouquet Bar access pattern into guest credits/conditions. Alpha-test finding: students responded better to standby-style queue language than custom photo queue language; keep photo-specific wording only where it adds clarity. Messaging pass completed on 2026-06-26: Headshot Photographer runtime copy now uses Waiting, Almost Ready, I'm Nearby, Your Turn, and Completed language, with photo-specific wording only around the actual photographer step. July attendee-import update retired the Student/Professional operational authorization model; the active SOTC gate is checked-in status plus Headshot entitlement/unused credit."
          },
          {
            "id": "story-headshot-tags",
            "title": "Retire Student/Professional headshot tag authorization",
            "status": "done",
            "sprint": "completed",
            "summary": "Do not use Student/Professional photo states as the active qME authorization model for SOTC Headshots.",
            "acceptanceCriteria": [
              "SOTC operational authorization uses registered/imported-or-manual, pending staff confirmation or checked in, Headshot entitled or not, and Headshot credit unused or used.",
              "Student/Professional values may remain imported source metadata for reporting or nametag context.",
              "Student/Professional values do not grant queue access directly.",
              "Headshot completion consumes/completes the professional_headshot credit/ticket path rather than updating a student/professional photo tag.",
              "Future configurable registration outcomes can revisit broader grant-policy modeling after SOTC."
            ],
            "notes": "Supersedes the 2026-06-11/2026-07-01 Student/Professional photo-state direction after the actual attendee import was implemented. For current SOTC operations, imported entitlement and staff-granted credits are authoritative; Student/Professional remains source metadata, not the active authorization model."
          },
          {
            "id": "story-photographer-console",
            "title": "Photographer service console",
            "status": "future",
            "sprint": "future",
            "summary": "Let the photographer or booth host signal readiness and check in the next guest.",
            "acceptanceCriteria": [
              "Provider can mark ready for next guest.",
              "Provider can see checked-in/nearby queue guests.",
              "Provider can mark photo complete."
            ]
          }
        ]
      },
      {
        "id": "theme-resume-reviews",
        "title": "Resume Reviews",
        "status": "ready",
        "stories": [
          {
            "id": "story-resume-review-queue",
            "title": "Create resume review digital queue",
            "status": "ready",
            "sprint": "soon",
            "summary": "Let students join a review queue and be routed to an available reviewer.",
            "acceptanceCriteria": [
              "Resume review experience has a queue.",
              "Guest can see position/status.",
              "Host/reviewer can call the next guest."
            ]
          },
          {
            "id": "story-resume-upload",
            "title": "Explore resume upload/release flow",
            "status": "discovery",
            "sprint": "future",
            "summary": "Consider whether guests can upload resumes and release them to the assigned reviewer.",
            "acceptanceCriteria": [
              "Privacy and file handling questions are identified.",
              "Mobile upload feasibility is validated.",
              "MVP alternative is documented if upload is too much for July.",
              "Forwarding or releasing a resume to an assigned reviewer is considered separately from raw upload."
            ],
            "notes": "Trello import includes possibly forwarding resume to reviewer before guest walks up."
          },
          {
            "id": "story-reviewer-ready",
            "title": "Reviewer ready workflow",
            "status": "future",
            "sprint": "future",
            "summary": "Let a reviewer say they are ready, then route/call the next guest.",
            "acceptanceCriteria": [
              "Reviewer can request next guest.",
              "Guest can be directed to a specific reviewer or station.",
              "Admin can see reviewer availability."
            ]
          }
        ]
      },
      {
        "id": "theme-host-console",
        "title": "Host Console",
        "status": "future",
        "stories": [
          {
            "id": "story-host-console-redesign",
            "title": "Redesign host console around service needs",
            "status": "future",
            "sprint": "future",
            "summary": "Move beyond the provisional kiosk/host console into a real operational tool.",
            "acceptanceCriteria": [
              "Host can advance, pause, and inspect a queue.",
              "Host can see check-in/standby state.",
              "Console language matches the experience type.",
              "Host can see operational context such as queue length, intake rate, now serving, guests lost, and open slots where relevant."
            ]
          },
          {
            "id": "story-sotc-production-pilot",
            "title": "Validate SOTC scan-code queue pilot in production",
            "status": "done",
            "sprint": "now",
            "summary": "Run the first SOTC queue/adventure pilot live on qme-nine.vercel.app with guest check-in, queue stages, Auto Assist, station code completion, and completed event-card state.",
            "acceptanceCriteria": [
              "Production guest link works for the SOTC test event.",
              "Guests can check in, join the Scan-Code Adventure queue, move through waiting, standby, your turn, and completed states.",
              "Admin can control manual/auto flow with one active released guest and three standby guests.",
              "Completed guests return to the event view with completed treatment.",
              "Canonical guest and admin links are documented.",
              "Alpha-test findings from the student group are captured and triaged."
            ],
            "notes": "Validated in production on 2026-06-19. Alpha-tested on 2026-06-24 with 8 SOTC students, including Jalani Ball. Core event check-in, queue states, headshot/photo-credit flow, and admin controls worked well enough for guided testing. Jalani helped lead the test, gathered students, and is willing to help move the pilot toward ready. Follow-up findings are mostly polish: refresh blinking, button alignment, and clearer photo queue/standby messaging."
          },
          {
            "id": "story-sotc-pilot-ops-controls",
            "title": "Polish SOTC pilot operations controls",
            "status": "current",
            "sprint": "now",
            "summary": "Make the admin queue controls clear enough to rehearse without a live student group: slug admin links, readable standby/released thresholds, practice reset, and explicit remaining cleanup gaps.",
            "acceptanceCriteria": [
              "Admin slug links work for the SOTC test event and Scan-Code Adventure queue.",
              "Threshold controls use operator language: standby nearby and active released.",
              "Admin sees the combined guests-in-motion count.",
              "Admin can reset the queue ticket practice run with confirmation.",
              "Full event check-in and guest-mark cleanup remains tracked separately if not implemented."
            ],
            "notes": "This keeps momentum while external testing is paused."
          },
          {
            "id": "story-sotc-calm-refresh",
            "title": "Calm realtime refresh behavior on SOTC pilot screens",
            "status": "done",
            "sprint": "now",
            "summary": "Make guest and admin SOTC pilot screens update without visible blinking, blanking, or layout jumps during polling/realtime refresh.",
            "acceptanceCriteria": [
              "Guest event page does not blink or temporarily blank during routine refresh.",
              "Guest queue ticket page keeps the current state visible while polling.",
              "Admin queue dashboard keeps guest rows and controls stable during refresh.",
              "If fetched data is unchanged, there is no visible UI reset.",
              "If fetched data changed, the relevant state updates without moving unrelated content.",
              "Loading indicators are subtle and do not displace primary content.",
              "Verified on mobile viewport for SOTC guest flow and admin queue flow."
            ],
            "notes": "Alpha-test inbox finding: App refresh with screen blinking is distracting. Completed on 2026-06-26: guest event polling now preserves eligibility state until fresh data is ready, guest ticket polling avoids replacing identical ticket state, and admin pilot ticket polling/auto-flow avoids identical row replacement and interval resets. User confirmed calm refresh is working."
          },
          {
            "id": "story-sotc-mobile-layout-polish",
            "title": "Polish SOTC pilot mobile layout and button alignment",
            "status": "done",
            "sprint": "now",
            "summary": "Use alpha-test screenshots and mobile testing to clean up visible layout issues on SOTC pilot guest/admin screens.",
            "acceptanceCriteria": [
              "Primary and secondary buttons align consistently on guest event, queue ticket, and admin queue screens.",
              "Button labels do not wrap awkwardly or overflow on common mobile widths.",
              "Action rows keep stable height and spacing when state changes.",
              "Back, Join, I'm Nearby, Enter Code, Apply Flow, Reset Practice Run, and admin guest-row actions are checked.",
              "Internal ticket numbers are hidden from SOTC pilot guest screens while remaining available to admin/staff.",
              "Screenshots from the alpha-test issue are reviewed against the fix.",
              "Verified at mobile widths around 360px, 390px, and desktop/tablet."
            ],
            "notes": "Alpha-test inbox findings: misaligned buttons, screenshot evidence that pilot ticket actions could appear outside the card boundary, and guest confusion over visible internal ticket numbers. Completed on 2026-06-26: guest event card action buttons now have stable minimum dimensions, guest ticket action buttons use balanced mobile touch targets, SOTC admin pilot controls/guest row actions use shared responsive classes, the pilot ticket uses the contained ticket-card structure with compact status/location/code panels, and SOTC pilot guest screens no longer show the internal ticket number. User confirmed the layout fix works."
          },
          {
            "id": "story-sotc-not-here-recovery",
            "title": "Explain Not Here recovery to guests",
            "status": "done",
            "sprint": "now",
            "summary": "When staff marks a released SOTC pilot guest as Not here, keep the same ticket but return the guest to Waiting/back of line so Gathering max is preserved.",
            "acceptanceCriteria": [
              "Admin confirms before marking a released guest Not here.",
              "A Not here guest returns to Waiting/back of line on the same ticket.",
              "Guest sees a modal explaining they were removed because they did not come when called after saying they were nearby.",
              "Guest sees an inline recovery banner while they are back in Waiting or Gathering.",
              "The guest must be invited to Gathering again before they can tap I'm Nearby and become eligible to be called.",
              "Normal first-time Waiting or Gathering does not show the Not here modal."
            ],
            "notes": "Completed on 2026-06-26 and revised on 2026-07-01 after multi-guest testing showed that returning Not Here guests directly to Gathering could exceed Gathering max after a freed slot was filled. First pass intentionally uses client-side transition detection rather than adding a durable database marker. If the guest page is closed during the staff action, a future database field such as not_here_at may be needed."
          },
          {
            "id": "story-sotc-jalani-readiness-review",
            "title": "Prepare SOTC pilot for Jalani-led readiness review",
            "status": "ready",
            "sprint": "now",
            "summary": "Use alpha-test feedback from Jalani Ball and the student group to get the SOTC pilot into a ready-for-review state.",
            "acceptanceCriteria": [
              "Alpha-test findings are triaged into stories or story notes.",
              "Jalani can run through the guest flow with minimal prompting.",
              "Guest event check-in, Headshot queue, Scan-Code Adventure, and admin controls are tested end-to-end after polish fixes.",
              "A short test script exists for the next student review.",
              "Known remaining issues are either fixed or explicitly deferred.",
              "Jalani confirms the flow is understandable enough for the next SOTC stakeholder demo."
            ],
            "notes": "Alpha-test inbox finding: Alpha test went well. Jalani Ball helped lead the test and can help move the pilot toward ready."
          },
          {
            "id": "story-sotc-pre-alpha-event-guide",
            "title": "Shape SOTC guest home as event guide for pre-alpha",
            "status": "current",
            "sprint": "now",
            "summary": "Use reusable eCe metadata to make the SOTC guest home feel like an event companion for the next alpha, without creating SOTC-only UI or removing the Scan-Code demo station.",
            "acceptanceCriteria": [
              "Guest home can group event activities into reusable sections from eCe metadata.",
              "Headshot Photographer remains the primary featured operational experience.",
              "Scan-Code Adventure remains available as an optional demo station, not required for the alpha path.",
              "Tonight's Schedule, Featured Experiences, Featured Speakers, Sponsors, Food & Drinks, and Resources can appear as lightweight information/event-guide activities.",
              "The implementation does not hard-code SOTC-specific sections into the React screen.",
              "Tomorrow's alpha still keeps registration simple: Student, Professional, and Professional + Photo.",
              "Deferred architecture items remain deferred: generalized registration config, generalized credit engine, service abstraction, speaker/sponsor engines, and event guidance engine."
            ],
            "notes": "Added from the Pre-Alpha Build direction for the July 2 SOTC alpha, then course-corrected after reviewing the 2025 SOTC brochure: qME should feel like a digital companion to a real conference, not a list of app features. First implementation uses eCe metadata fields such as home_section, home_section_title, home_section_order, home_badge, home_action_label, home_items_layout, home_items_limit, and home_items. Seed data lives in supabase-sotc-alpha-event-guide.sql. User clarified that Scan-Code Adventure should stay available because it is useful as an optional demo, while July guest-home emphasis stays on Headshots and the event guide. July 2 pre-test build added brochure-style schedule, featured speakers, sponsor logos, food/drinks, resources, generic media-row rendering, oldest-first live check-in ordering, and reset hardening so stale guest queue tabs with old join intent cannot recreate tickets after event test data is reset. July 16 content refinement grouped schedule items by time with item/location rows, kept Resume Reviews and Networking lower on the guest home, made Sticker Guide a native qME modal, and kept Mixer Resources as a direct Canva link after Canva blocked embedded display."
          },
          {
            "id": "story-admin-console-needs",
            "title": "Document admin console needs",
            "status": "discovery",
            "sprint": "future",
            "summary": "Identify what admins need before building broader event operations screens.",
            "acceptanceCriteria": [
              "Needs are grouped by qME operator, organization admin, event host, and service provider.",
              "Screens are prioritized against the SOTC event.",
              "Temporary demo-only controls are marked.",
              "Operational exception actions such as pause queue, announce delay, close intake, merge/split, redirect, and transfer are captured."
            ]
          },
          {
            "id": "story-admin-event-activity-status-overview",
            "title": "Add admin event activity status overview",
            "status": "done",
            "sprint": "now",
            "summary": "Show read-only operating counts on the admin event screen before redesigning the queue screens into tabs.",
            "acceptanceCriteria": [
              "The admin event screen shows event check-in counts for people waiting for staff and people checked in.",
              "Each queue-based event feature shows counts for Waiting, Gathering, Nearby, Your Turn, and Done.",
              "Counts use operational labels that match the guest status language.",
              "Counts update through a debounced live refresh after guest or staff actions, with a lightweight two-second fallback refresh while the admin page is open.",
              "The overview remains read-only; detailed actions still happen in Event Check-Ins or Manage Queue.",
              "The implementation supports Scan-Code Adventure and Headshot Photographer before the broader tab redesign."
            ],
            "notes": "Added during Sprint 2 admin UX discussion. Built before the queue tab refactor so the main event screen gives hosts a quick view of people waiting for check-in, people in line, guests gathering nearby, guests ready/nearby, active guests, and completed guests. First implementation uses debounced Supabase realtime subscriptions plus a lightweight fallback refresh for pilot reliability, and was later tightened to use the safe queue count RPC for more consistent guest/admin counts. Future production-scale architecture should move these counts to operational metrics tables."
          },
          {
            "id": "story-operational-metrics-tables",
            "title": "Create operational metrics tables for event and queue counts",
            "status": "future",
            "sprint": "future",
            "summary": "Replace repeated admin count scans with precomputed event and queue metric rows that can power live admin overview, tabs, and future dashboards.",
            "acceptanceCriteria": [
              "Event-level metrics include waiting-for-staff check-ins, completed check-ins, and last updated time.",
              "Queue-level metrics include Waiting, Gathering, Nearby, Your Turn, Done, and last updated time.",
              "Metrics update reliably when guests check in, join queues, mark nearby, are released, complete, leave, are marked not here, or event test data is reset.",
              "Admin overview subscribes to lightweight metrics rows instead of high-volume ticket/check-in tables.",
              "The implementation documents whether metrics are maintained by triggers, RPC refresh, or a server process.",
              "A fallback/rebuild function exists to recalculate metrics from source tables if counts drift."
            ],
            "notes": "Captured during Sprint 2 discussion after adding live admin status overview. This is the better long-term architecture for larger events and multiple active admin/staff screens, but the pilot can first validate the overview with debounced realtime refresh."
          },
          {
            "id": "story-admin-queue-tabs",
            "title": "Organize admin operational screens into focused tabs",
            "status": "done",
            "sprint": "now",
            "summary": "Refactor event, queue, and check-in admin screens so staff can work from focused tabs instead of crowded operational pages.",
            "acceptanceCriteria": [
              "Main event admin is split into Operations, Staff, and Setup tabs.",
              "Headshot Photographer admin has a clean active queue tab showing only guests currently waiting, standby, nearby, or released for photo service.",
              "Queue history is moved to a separate tab showing completed, left, cancelled, not-here, and stale/expired guests.",
              "Queue settings are moved to a separate tab for join status, run mode, standby threshold, max released, reset/practice controls, and other operational configuration.",
              "Event Check-Ins are split into Live Check-In, History, and Settings tabs.",
              "Event check-in behavior settings are available from the check-in workspace.",
              "Main event admin overview summarizes queue health across event features, such as guests waiting, guests in standby/ready/nearby state, released guests, people needing check-in, and people ready for photo/service.",
              "Event admins can spot operational attention areas without opening each individual queue.",
              "Similar tab structure can be reused by Scan-Code Adventure, future resume review, and other service queues.",
              "Tabs are role-aware so service staff see operational work first while event admins can access settings.",
              "Feature-scoped staff do not default into unrelated event setup, staff management, reset, or advanced queue-engine panels.",
              "Mobile and tablet layouts keep the active work view uncluttered during live operations."
            ],
            "notes": "Captured from Sprint 2 admin UX discussion and inspired by the cleaner tabbed admin pattern in the user's Playing the Game app. Completed first pass across main event admin, queue detail admin, and event check-in admin. Main event admin now separates Operations, Staff, and Setup; queue detail admin separates Live Line, History, and Settings; event check-in admin separates Live Check-In, History, and Settings. July 17 update: destructive Reset Test Data is no longer exposed in the top event action row and now lives behind Setup; check-in Settings is hidden from non-event-admin operators."
          },
          {
            "id": "story-role-aware-admin-landing",
            "title": "Route staff to role-aware admin workspaces",
            "status": "done",
            "sprint": "now",
            "summary": "Send admins and staff to the most relevant admin workspace based on their organization, event, and feature assignments.",
            "acceptanceCriteria": [
              "Event admins land on the event overview with setup, staff, check-in, feature, and reset context available.",
              "Check-in staff land on the event check-in workspace or a check-in-focused event tab.",
              "Feature-scoped service staff land on their assigned station or queue active-work tab.",
              "A staff user with one assignment is routed directly to that work area after sign-in.",
              "A staff user with multiple assignments gets a simple workspace chooser.",
              "Feature-scoped staff do not see unrelated setup panels by default.",
              "Superadmins and organization admins retain broader navigation for support and setup.",
              "Role visibility is explicit: each role has documented visible tabs, hidden tabs, read-only tabs, and editable controls.",
              "Station Staff and Station Supervisor boundaries are finalized before broader platform expansion.",
              "Station Supervisor versus Event Admin control ownership is documented for queue controls, photo-credit/service controls, reset, and cross-station actions."
            ],
            "notes": "Added during Sprint 2 admin UX discussion after testing Jalani/event-staff access. The role model can already represent event-level and feature-scoped assignments, but the admin UI still behaved mostly like an event-level overview. July 8 Alpha 2 review shifted this from permission checks to workspace visibility. July 16 update: target role/workspace/control boundaries are documented in docs/station-role-visibility-matrix-v1.md, and the useful first implementation slice is complete: /admin now routes broad admins to /admin/events, single-assignment event/station/check-in staff directly to the assigned workspace, and multi-assignment staff to a simple workspace chooser. July 17 update: event detail Staff/Setup tabs, event check-in Settings, and queue/station Settings are gated to event-admin-and-up so lower-role operators stay in live operations/history surfaces; the Staff tab assignment form now creates only limited Staff access instead of exposing event-admin/station-provider role choices. Staff onboarding now supports creating a new limited staff login from the event Staff tab with generated temporary password display, then requiring the staff person to enter first and/or last name plus optional phone on first login; existing qME accounts are reused for additional event staff assignments; duplicate event assignment attempts warn the admin; the staff list can be searched by name/email; and a pilot Reset Password action keeps a generated temporary password visible until the staff person signs in again without wiping their existing profile. This remains a pilot credential flow and should be replaced with proper invite/reset-password handling later. July 17 decision: because SOTC has not requested special station/staff privilege distinctions and event admins are easy to create/manage, deeper role-specific tab hiding/read-locking is documented but intentionally deferred until a real operational need appears. July 17 SOTC pilot policy: assigned check-in staff may grant Headshot photo credit because Tanya previously said this was acceptable for the operating model; revisit after SOTC before making this a platform default."
          },
          {
            "id": "story-qme-root-landing-event-directory",
            "title": "Create qME root landing page and public event directory",
            "status": "current",
            "sprint": "now",
            "summary": "Replace the Peony-specific root route with a lightweight qME platform landing page that introduces qME, lists public events in useful date order, and provides a clear organizer/admin sign-in path.",
            "acceptanceCriteria": [
              "The root route at qme.lol / www.qme.lol shows a qME platform landing page instead of redirecting to the Peony Festival.",
              "The page is guest-first and functions primarily as an event portal, not a SaaS marketing site.",
              "Guests can see active/upcoming public events and open the correct event route.",
              "Organizer / Staff Sign In is clearly visible but visually secondary to joining an event.",
              "Direct event URLs for Peony, SOTC, and future events continue to work.",
              "The public SOTC route /sotc/rockhall is supported while preserving the currently tested SOTC event slug.",
              "The canonical SOTC guest URL is /events/sotc-rockhall, derived from the event slug.",
              "A printable SOTC entry sign page gives guests a QR code and short instructions for self check-in, event details, and the Headshot digital queue.",
              "Public events are sorted with upcoming/current events before older past events.",
              "Private, internal, rehearsal, and test events do not appear unless explicitly allowed for public directory display.",
              "The implementation uses existing event records first rather than adding a separate marketing CMS."
            ],
            "notes": "Added after qme.lol and www.qme.lol were connected in Vercel and exposed that the platform root still opened the Walnut Ridge Farm Peony Festival. The first implementation uses a conservative allow-list/metadata filter so active internal events are not automatically exposed. July 21 update: SOTC direct routing now treats /events/sotc-rockhall as the canonical guest URL from the event slug, keeps legacy SOTC aliases working, and adds a printable /events/sotc-rockhall/sign QR entry page for the registration entrance. Future cleanup should add an explicit public-directory/event-visibility field in event setup and consider organization/event slug nesting such as /org-slug/event-slug."
          },
          {
            "id": "story-station-operational-control-visibility",
            "title": "Make station operational controls visible and understandable",
            "status": "current",
            "sprint": "now",
            "summary": "Expose station-level operating settings in a way staff can understand, while preserving edit permissions for the appropriate authority level.",
            "acceptanceCriteria": [
              "Station screens show Gathering Target, Gathering Max, Gathering timeout, On My Way timeout, Not Here cooldown, and Auto Flow where applicable.",
              "Visibility is separated from editability: staff can understand queue behavior even when they cannot change settings.",
              "Event Admin or higher can edit event-wide/live-control settings.",
              "Station Supervisor editability is decided per station/control rather than assumed globally.",
              "Read-only controls explain why they are locked for the current role.",
              "Settings use operational labels that match the guest queue language."
            ],
            "notes": "Added from July 8 Alpha 2/Product Discovery review. Alpha testing showed that hidden queue settings made correct behavior look broken. Station staff need to understand why the line behaves as it does, even when only Event Admin or higher can change the controls."
          },
          {
            "id": "story-queue-automation-observability",
            "title": "Explain queue automation blockers to operators",
            "status": "current",
            "sprint": "now",
            "summary": "When automation does not move a guest, show the reason so staff know whether the queue is working, cooling down, paused, full, or blocked by eligibility.",
            "acceptanceCriteria": [
              "Queue admin surfaces show when a guest is Cooling Down and, where practical, the remaining time.",
              "Queue admin surfaces explain when Gathering is full.",
              "Queue admin surfaces explain when Auto Flow is paused or manual.",
              "Queue admin surfaces explain when a guest is waiting for a required credit or eligibility condition.",
              "Apply Flow feedback reports when no movement happened and why.",
              "Not Here recovery follows the policy: cooldown, return to active Waiting, then normal progression by original queue order with no extra punishment."
            ],
            "notes": "Added from July 8 Alpha 2/Product Discovery review. Alpha testing showed the queue engine could be behaving correctly while operators thought it was stuck because the cooldown timer and other blockers were invisible. qME should explain automation decisions, not make staff infer them."
          },
          {
            "id": "story-stale-queue-blocker-recovery",
            "title": "Handle stale queue guests who block active flow",
            "status": "done",
            "sprint": "now",
            "summary": "Prevent Gathering guests who have not marked themselves Nearby from indefinitely blocking newer guests and slowing down a live queue.",
            "acceptanceCriteria": [
              "Gathering is treated as a prompt state, not a protected blocking position.",
              "A non-nearby Gathering guest stops counting against the Gathering/Nearby target after a pilot bypass window.",
              "Auto-flow targets the configured Gathering threshold for fresh guests.",
              "Auto-flow can overflow Gathering/Nearby up to a configurable max when earlier Gathering guests go stale.",
              "A non-nearby Gathering guest stops counting as a fresh blocker after a configurable pilot bypass window.",
              "Auto-release still only releases guests who tapped I'm Nearby.",
              "The queue does not automatically remove or cancel stale Gathering guests during the first SOTC pilot.",
              "Staff can manually return a non-nearby Gathering guest to Waiting so they no longer hold a Gathering spot.",
              "Returned guests remain in the queue and go behind guests already waiting.",
              "A follow-up automation pass can move stale Gathering guests back to Waiting when space is needed.",
              "The first pilot setting uses a short 15-second bypass window for testing, with real-event timing to be configured later.",
              "The story captures later staff actions such as nudge, skip for now, remove, and recover.",
              "The story captures later notification support so guests can be buzzed or messaged when moved from Waiting to Gathering."
            ],
            "notes": "Captured from Sprint 2 smoke testing after guest-session foundation: guest #5 could be waiting behind stale guests who had not tapped I'm Nearby, and another guest in front could block the queue. Updated after product discussion: the queue must keep moving toward Nearby candidates without hiding the overflow rule in code. Current implementation exposes Gathering target, Gathering max, and stale-after seconds on the queue controls. Auto-flow can invite newer Waiting guests into Gathering up to the max when earlier Gathering guests go stale. Staff can manually return stale non-nearby Gathering guests to Waiting; returned guests keep their ticket but move behind guests already waiting. Not Here now returns released guests to Waiting with a cooldown, and a database trigger guardrail prevents older clients from moving released guests directly back into Gathering. Validated on 2026-07-01 with a 7-guest Scan-Code Adventure test and a Headshot Photographer test: admin removals from Gathering and Your Turn moved guests to Waiting for the 15-second cooldown, Gathering max held, and guests later progressed again when space opened. Added guest-facing Return to Waiting messaging so a guest moved back by staff understands that they should wait until Gathering appears again, move to the station, and tap I'm Nearby when ready. July 2 pre-test reset hardening fixed a stale-tab edge case where an old guest queue URL with join intent could recreate a ticket after Reset Test Data; reset now clears that URL intent on queue landing and ticket pages. User confirmed the lost Headshot Gathering ticket disappeared and reset testing passed. Future production readiness should move auto-flow execution toward a durable server-side scheduler, trigger, or metrics-driven worker rather than relying on open browser screens. Future work should add richer staff controls to skip/remove/remind stale Gathering guests, automate return-to-waiting when space is needed, make real-event timing configurable, and add buzz/SMS/push/in-app notification when guests move from Waiting to Gathering."
          },
          {
            "id": "story-queue-rule-configuration",
            "title": "Configure queue rules and priority policies",
            "status": "future",
            "sprint": "future",
            "summary": "Allow admins to configure queue capacity, pacing, intake, remote wait, commitment windows, no-show handling, and priority structures.",
            "acceptanceCriteria": [
              "Queue rules can include capacity thresholds, max digital positions, intake rates, and average service time.",
              "Rules can include commitment prompts, expiration, grace periods, skip/reinsert behavior, and no-show policies.",
              "Rules can distinguish Gathering timeout, optional On My Way timeout, I'm Nearby grace, and Not Here cooldown.",
              "Priority structures can support premium tiers, staff passes, accessibility accommodations, or weighted/batched service.",
              "This remains future configuration until a concrete event requires it."
            ],
            "notes": "Imported from Trello/provisional queue rules. July 8 Alpha 2 review clarified that Not Here should cool down, return to active Waiting, and resume normal progression without additional punishment; cooldown itself is the penalty."
          },
          {
            "id": "story-notification-policies",
            "title": "Configure notification policies and templates",
            "status": "future",
            "sprint": "future",
            "summary": "Define guest and staff notification rules for now-serving, up-next, commitment prompts, approach reminders, and exceptions.",
            "acceptanceCriteria": [
              "Notification templates can support merge fields such as queue name, estimated time, map pin, and instructions.",
              "Policies can include now serving, up next, commitment threshold, head toward venue, proceed-to-service, slowdowns, pauses, closures, or rerouting.",
              "Delivery channels such as in-app, SMS, email, and push are evaluated separately."
            ],
            "notes": "Imported from Trello/provisional notification policy notes."
          },
          {
            "id": "story-sotc-notification-july-fallback",
            "title": "Define July notification fallback for SOTC queues",
            "status": "current",
            "sprint": "next",
            "summary": "Determine and implement the reliable July notification behavior for Headshots and other SOTC queues before committing to SMS or web push.",
            "acceptanceCriteria": [
              "Guest receives clear in-app modal/banner messaging for Waiting to Gathering, Your Turn, Not Here, and Return to Waiting/Cooldown events while the guest page is open.",
              "Guest-facing notifications include an acknowledgement action and enough timestamp/history context to understand what changed.",
              "Optional sound is evaluated only as an in-app enhancement after guest interaction, not as the primary notification channel.",
              "The fallback explicitly documents that closed pages and backgrounded mobile browsers are not reliable without SMS or push.",
              "Staff guidance and event signage explain the July fallback behavior for Headshots.",
              "SMS is not promised for July until provider setup, consent, compliance, delivery logging, and duplicate prevention are confirmed."
            ],
            "notes": "Added from July 14 notification feasibility review. Tanya asked whether qME can buzz guests when queue status changes. Current reliable July path is in-app notification while the page is open, with SMS treated as a compliance-gated enhancement and web push treated as poor fit for a one-time iPhone-heavy event."
          },
          {
            "id": "story-notification-event-architecture",
            "title": "Create notification-event architecture",
            "status": "ready",
            "sprint": "future",
            "summary": "Separate domain status changes from delivery channels by recording notification events before delivering in-app, SMS, push, or future channels.",
            "acceptanceCriteria": [
              "Domain actions such as queue movement, Not Here, cooldown completion, order-ready, or reminders can create durable notification events.",
              "Notification events include event/check-in/ticket context, notification type, transition, idempotency key, created timestamp, and acknowledgement/read fields.",
              "Channel delivery records track in-app, SMS, push, or future delivery attempts separately.",
              "Duplicate prevention is based on idempotency keys rather than client-side timing.",
              "Untrusted browsers cannot directly trigger SMS delivery.",
              "The architecture supports audit review and future delivery channels without coupling queue logic directly to one provider."
            ],
            "notes": "Preferred direction: domain status change -> create notification event -> deliver in-app -> optionally deliver SMS -> later support web push or other channels."
          },
          {
            "id": "story-sms-notification-feasibility",
            "title": "Evaluate transactional SMS for event notifications",
            "status": "discovery",
            "sprint": "future",
            "summary": "Investigate whether SMS can responsibly support queue and reminder notifications after account, compliance, consent, and delivery constraints are understood.",
            "acceptanceCriteria": [
              "Provider setup requirements are documented, including sender registration and approval timing.",
              "Opt-in, STOP/HELP, consent copy, and message-purpose requirements are documented before any live SMS commitment.",
              "Existing phone capture is reviewed and updated if explicit SMS consent is required.",
              "Server-side delivery architecture is documented so guests cannot trigger arbitrary SMS from the browser.",
              "Delivery logging, duplicate prevention, and failure handling are designed before SMS is used at a live event.",
              "A go/no-go decision is made before SMS becomes part of a guest promise."
            ],
            "notes": "Twilio or similar SMS may be useful, but July 22 timing is risky unless registration/verification and compliance are already complete. Treat SMS as a pilot add-on, not the core notification fallback."
          },
          {
            "id": "story-headshot-low-staff-operating-model",
            "title": "Explore low-staff Headshot operating model",
            "status": "current",
            "sprint": "next",
            "summary": "Review safe Headshot workflows where qME can advance the queue and the photographer may not need to operate qME directly.",
            "acceptanceCriteria": [
              "At least two operating models are documented for Tanya/Eric discussion.",
              "Models distinguish photographer-free, guest-confirmed, timed, and supervisor-assisted completion options.",
              "Risks are documented for false guest confirmation, missed guests, photo-credit misuse, and inaccurate completion.",
              "Required state-model changes are identified before adding states such as active service or starting headshot.",
              "The July recommendation preserves a simple fallback that staff can execute under pressure."
            ],
            "notes": "Final pre-meeting model supports both operating paths. In the low-staff path, qME moves the guest to Your Turn, the photographer calls their name, and the guest taps I've Been Called to record a durable service-start marker and complete the ticket. In the admin-operated path, staff calls the name from the queue list and clicks Mark Served, completing the guest directly. Not Here remains the exception path."
          },
          {
            "id": "story-headshot-service-start-acknowledgement",
            "title": "Prototype Headshot guest-called completion",
            "status": "done",
            "sprint": "next",
            "summary": "Add a Headshot-only guest action after Your Turn so the guest can confirm they were called by the photographer; for the low-staff pilot this completes the Headshot queue ticket and frees the next guest.",
            "acceptanceCriteria": [
              "I’ve Been Called appears only for Headshot guests in Your Turn.",
              "Supporting copy says: Tap this when the photographer calls your name and you are starting your headshot.",
              "The action writes a durable headshot_service_started marker tied to the guest/ticket.",
              "Repeated taps do not create duplicate service-start records.",
              "The action completes the Headshot ticket after the marker is recorded, moving the guest into admin history and freeing queue capacity.",
              "The guest sees completion progress and then the normal all-set return-to-event state.",
              "Admin or Station Supervisor can see the service-start timestamp where practical.",
              "Admin-operated Headshot queues can also mark a nearby guest served directly, completing the ticket and moving it to history.",
              "Completion by either guest or admin nudges auto-flow so the next ready guest can advance.",
              "Not Here controls remain available before the guest taps I've Been Called.",
              "No SMS, photographer screen, or durable notification-event infrastructure is introduced for this prototype."
            ],
            "notes": "Built and tested for Tanya/Eric discussion. The implementation records a service-start mark/timestamp for the guest path and then uses completed as the low-staff terminal state, rather than adding an active_service ticket stage. Admin Mark Served creates the normal completion timestamp/mark without pretending the guest tapped I've Been Called."
          }
        ]
      }
    ]
  },
  {
    "id": "epic-sotc-program",
    "title": "SOTC Rock Hall Program",
    "summary": "Translate the 2025/2026 mixer materials into guest-facing cards, queues, signups, prompts, and resources.",
    "status": "current",
    "themes": [
      {
        "id": "theme-registration-passport",
        "title": "Registration and Passport",
        "status": "ready",
        "stories": [
          {
            "id": "story-registration",
            "title": "Registration experience",
            "status": "done",
            "sprint": "completed",
            "summary": "Represent the 5:30-7:30 level 1 registration area and connect QR/name entry to imported-attendee lookup, staff confirmation, and the admin check-in console.",
            "acceptanceCriteria": [
              "Registration appears as an event experience.",
              "Guest-facing check-in starts from the Event Check-In card.",
              "Guest-facing copy explains what to do next.",
              "Guests search and claim an imported registration, or submit a manual Needs Help fallback if they cannot find themselves.",
              "Registration admin view shows pending guests as they enter/check in.",
              "Staff confirm the guest after giving the name tag/sticker, then the guest can use gated event features.",
              "Headshot access is derived from the imported attendee entitlement rather than arbitrary guest-entered or staff-entered classification.",
              "SOTC staff can still use their external materials/name-tag process while qME manages the guest digital flow."
            ],
            "notes": "Superseded by story-attendee-import after the actual SOTC attendee file arrived. The 2026-06-11 no-import assumption was historically correct for the first alpha slice, but the implemented July SOTC path now uses imported Eventbrite registrations, masked guest search/claim, Needs Help fallback, staff confirmation, and server-derived Headshot entitlement."
          },
          {
            "id": "story-sotc-qr-entry",
            "title": "SOTC QR entry and guest lookup",
            "status": "done",
            "sprint": "completed",
            "summary": "Let guests scan a QR code at entry, search the imported SOTC attendee list, and enter the staff-confirmed check-in flow.",
            "acceptanceCriteria": [
              "Guest can scan QR to enter the SOTC event experience.",
              "Guest can search imported registrations by name with masked email hints.",
              "Guest can claim their imported registration or use the Needs Help fallback.",
              "Guest can provide optional phone details for check-in recovery.",
              "Guests who do not want digital entry or cannot find themselves can still go to the desk.",
              "Staff confirmation remains required before event features are available."
            ],
            "notes": "Superseded by story-attendee-import after the actual SOTC attendee file arrived. The older acceptance criterion about not relying on an imported attendee list is no longer the SOTC July implementation; the current flow uses imported registration search plus manual fallback for unresolved guests."
          },
          {
            "id": "story-attendee-import",
            "title": "Import or sync SOTC attendee list",
            "status": "done",
            "sprint": "completed",
            "summary": "Bring the received SOTC Eventbrite attendee records into qME for event check-in, Headshot entitlement, and narrow guest self check-in.",
            "acceptanceCriteria": [
              "Imported attendee records are stored separately from guest sessions/check-ins.",
              "Headshot entitlement is derived from the imported Price Tier rather than guest-entered classification.",
              "Reset Test Data clears rehearsal check-in/linkage state without deleting the imported attendee source list.",
              "A dry-run import report identifies missing fields, unknown price tiers, and duplicates before live import.",
              "Imported records can be searched by guest name with limited, masked results.",
              "Guests can claim a selected imported registration and self check in immediately.",
              "Guests who cannot find their registration can submit a manual fallback that appears in the same Live Check-In list with a Needs Help marker.",
              "Matched imported-registration self check-in stamps the imported registration check-in time and unlocks event participation.",
              "After self check-in, guest messaging directs the guest to the registration desk for the physical name tag/sticker handoff.",
              "Needs Help/manual fallback rows remain pending operational work until staff resolves or removes them.",
              "Staff can remove an unresolved Live Check-In row; removed rows move to History and imported-registration claims are released for the correct guest to reclaim.",
              "Duplicate-name claims require server-side email confirmation.",
              "Headshot-entitled imported registrations receive one professional_headshot credit idempotently from the authoritative import.",
              "Future API sync with Evite/Eventbrite is noted separately from manual import.",
              "Realtime updates are considered but not required for the July SOTC slice."
            ],
            "notes": "Deferred by the 2026-06-11 PO review until actual attendee data arrived. Updated 2026-07-20 after receiving cleaned SOTC-Mixer-List.csv: dry-run analysis found 191 rows, 191 importable, 147 Headshot price-tier rows, 44 blank price-tier rows, 145 student registrations, 46 professional registrations, 0 duplicate attendee numbers, 0 duplicate emails, 0 duplicate names, 0 missing required fields, and 0 unknown price tiers. Local foundation SQL added event_import_batches and event_imported_registrations, with reset behavior that clears linked check-in/session fields while preserving the imported attendee list for audit. The live table was manually populated with 191 imported registrations. App/SQL slice added scoped guest registration search and claim RPCs: guests search by name, see masked email hints, claim one imported record, and are created as check-in rows from the authoritative import. July 21 Tanya direction removed the extra staff-confirmation gate for matched imported registrations: successful imported claims now self check in immediately, unlock event participation, stamp checked_in_at, and direct the guest to the registration desk for the physical name tag/sticker. Manual fallback rows remain Needs Help in the same admin list rather than sent to a separate hidden queue. Duplicate-name claims require exact email confirmation. Headshot credit is granted only from imported Headshot entitlement. Follow-up recovery slice added an audited staff Remove action for Live Check-In rows; imported matches are unlinked so a mistaken claim can be reclaimed, removed rows remain in History, and the guest-facing event/check-in screens show a removed state with a Check In Again path. Eventbrite API sync remains deferred."
          },
          {
            "id": "story-registration-import-tool",
            "title": "Build superadmin registration import and field-mapping tool",
            "status": "ready",
            "sprint": "next",
            "summary": "Let qME Superadmin upload the organizer's existing electronic attendee export, have qME inspect the file and suggest field mappings, preview the result, and add only registrations qME has not previously imported.",
            "acceptanceCriteria": [
              "The first version is visible and usable only by qME Superadmin.",
              "Superadmin can upload a common attendee export such as CSV without first reshaping it into a qME-specific template.",
              "qME proposes mappings for useful normalized fields such as first name, last name or full name, email, mobile, company/organization, registration type, and stable external registration id where available.",
              "Superadmin can review and correct proposed mappings before committing the import.",
              "Import preview shows total source rows, already-known registrations, new registrations, ambiguous/problem rows, and the fields qME intends to map.",
              "All source fields are preserved with the imported source record even when qME does not yet have a normalized use for them.",
              "Repeated full-file imports are additive and non-destructive: existing source registrations are recognized and left intact while only previously unseen registrations are added.",
              "Existing qME participation accumulated after registration is never wiped or recreated by a later source-file import.",
              "Changed values on an already-known source registration are surfaced for review rather than silently overwriting qME-owned participation or profile state.",
              "Import records preserve source/provenance information sufficient to support later provider synchronization."
            ],
            "notes": "Near-term direction from 2026-08-19 discovery. The organizer should be able to give qME the electronic export they already have rather than learning CSV preparation. File import is a legitimate general capability, not merely a temporary Eventbrite workaround. Direct provider integration can later automate ongoing ingestion and late-registration discovery using the same source-registration model."
          },
          {
            "id": "story-registration-late-arrival-walk-in-policy",
            "title": "Define configurable late-registration and walk-in policy",
            "status": "discovery",
            "sprint": "future",
            "summary": "Define how each event handles a person who arrives but is not yet known to qME, whether because they registered after the last import, were invited late, or are a true walk-in.",
            "acceptanceCriteria": [
              "Explore event-configurable policies including closed list, staff-approved addition, and open/self-registration.",
              "Treat a qME-created walk-in registration as another registration source rather than an error condition.",
              "Clarify what minimum identity/contact fields are required for each policy.",
              "Clarify how late external registrations are added without disturbing existing qME participation.",
              "Keep provider/API integration separate from the exception policy because even synchronized events may still have true walk-ins."
            ],
            "notes": "A later full registration export should normally discover and add only new source registrations. Integration reduces late-registration exceptions but does not eliminate the need for an event-specific not-found/walk-in policy."
          },
          {
            "id": "story-passport-activity",
            "title": "Passport activity",
            "status": "ready",
            "sprint": "soon",
            "summary": "Model the passport as a simple activity that can encourage sponsor engagement or QR check-ins.",
            "acceptanceCriteria": [
              "Passport activity has a clear completion definition.",
              "Sponsor/registration check-ins can count toward progress.",
              "Reward or completion question is captured."
            ]
          }
        ]
      },
      {
        "id": "theme-sponsors",
        "title": "Sponsors",
        "status": "ready",
        "stories": [
          {
            "id": "story-sponsor-cards",
            "title": "Sponsor cards and placement",
            "status": "ready",
            "sprint": "soon",
            "summary": "Show sponsors as event experiences with meaningful placement and optional passport activity.",
            "acceptanceCriteria": [
              "Sponsor card includes name, logo, location, and description.",
              "Sponsor placement can be highlighted.",
              "Sponsor is distinct from vendor in the model."
            ]
          },
          {
            "id": "story-sponsor-goals",
            "title": "Capture sponsor goals",
            "status": "discovery",
            "sprint": "future",
            "summary": "Clarify what sponsors want from the event so qME can support measurable engagement.",
            "acceptanceCriteria": [
              "Sponsor desired outcomes are documented.",
              "Engagement actions are identified.",
              "Reporting needs are parked or promoted to stories."
            ]
          }
        ]
      },
      {
        "id": "theme-resources",
        "title": "Mixer Resources and Digital Brochure",
        "status": "ready",
        "stories": [
          {
            "id": "story-resource-cards",
            "title": "Create mixer resource cards",
            "status": "ready",
            "sprint": "soon",
            "summary": "Bring the QR code/mixer resources page into qME as structured guest-facing cards.",
            "acceptanceCriteria": [
              "Resources can be grouped by category.",
              "Each resource has title, link, description, and optional sponsor/source.",
              "Guest can access resources from the event page."
            ],
            "references": [
              "https://sites.google.com/summeronthecuyahoga.com/mixerresourcespage?usp=sharing"
            ]
          },
          {
            "id": "story-digital-brochure",
            "title": "Digital brochure view",
            "status": "future",
            "sprint": "future",
            "summary": "Create a richer event program that can turn modules on before, during, or after the event.",
            "acceptanceCriteria": [
              "Event schedule and resources are visible.",
              "Certain interactive items can open before the event.",
              "Guest sees relevant cards without needing the old brochure."
            ]
          }
        ]
      },
      {
        "id": "theme-networking-food-bar",
        "title": "Networking, Food, and Bar",
        "status": "discovery",
        "stories": [
          {
            "id": "story-networking-prompts",
            "title": "Simple networking prompts",
            "status": "discovery",
            "sprint": "future",
            "summary": "Start with lightweight prompts/questions before deeper matching.",
            "acceptanceCriteria": [
              "Existing SOTC networking ideas are captured.",
              "MVP prompts can be shown without personal matching.",
              "Sponsor opportunity is noted separately."
            ]
          },
          {
            "id": "story-food-filters",
            "title": "Food tags and filters",
            "status": "future",
            "sprint": "future",
            "summary": "List hors d'oeuvres and allow filtering by vegan, vegetarian, gluten free, allergens, or ingredients.",
            "acceptanceCriteria": [
              "Food items have dietary tags.",
              "Guest can filter common needs.",
              "Unknown/typed needs can be captured as learning."
            ]
          },
          {
            "id": "story-bar-menu",
            "title": "Cocktail and mocktail menu",
            "status": "future",
            "sprint": "future",
            "summary": "Show special cocktails/mocktails as a simple information card.",
            "acceptanceCriteria": [
              "Bar card can list drinks.",
              "Mocktails and alcoholic drinks can be distinguished.",
              "No queue behavior is assumed unless needed later."
            ]
          }
        ]
      },
      {
        "id": "theme-sessions-galleries",
        "title": "Greetings, Workshops, and Galleries",
        "status": "discovery",
        "stories": [
          {
            "id": "story-host-greetings",
            "title": "Host and sponsor greetings notification",
            "status": "discovery",
            "sprint": "future",
            "summary": "Notify guests to gather for host/sponsor greetings from 6:15-6:45 on level 0.",
            "acceptanceCriteria": [
              "Greeting appears in the event schedule.",
              "Notification behavior is defined.",
              "QR/passport check-in alternative is considered if no beacons exist."
            ]
          },
          {
            "id": "story-workshop-signups",
            "title": "Pop-up mini workshop signups",
            "status": "future",
            "sprint": "future",
            "summary": "Let guests sign up for workshop blocks and coordinate with queue timing.",
            "acceptanceCriteria": [
              "Workshop sessions have time, location, speaker, organization, title, and description.",
              "Guest can sign up before or during the event.",
              "Queue status and workshop attendance do not fight each other."
            ]
          },
          {
            "id": "story-gallery-map",
            "title": "Gallery and landmark map cards",
            "status": "future",
            "sprint": "future",
            "summary": "Show all galleries open for viewing, landmarks, levels, and suggested things to see.",
            "acceptanceCriteria": [
              "Gallery cards include level/location.",
              "Map or wayfinding view is explored.",
              "Scavenger hunt/tour ideas are parked for later."
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "epic-guest-intelligence",
    "title": "Guest Conditions, Intentions, and Timing",
    "summary": "Use guest identity, tags, intent, access rules, and optional location signals to drive what actions qME suggests.",
    "status": "future",
    "themes": [
      {
        "id": "theme-guest-conditions",
        "title": "Guest Conditions and Access",
        "status": "ready",
        "stories": [
          {
            "id": "story-guest-condition-engine",
            "title": "Generalize guest access conditions",
            "status": "future",
            "sprint": "future",
            "summary": "Turn Bouquet Bar-style access rules into a reusable eligibility model.",
            "acceptanceCriteria": [
              "Queue access can depend on guest tags, check-in state, purchase state, or completion state.",
              "Blocked guests receive context-specific messages.",
              "Rules are configurable per experience."
            ]
          },
          {
            "id": "story-guest-intentions",
            "title": "Guest announces intentions",
            "status": "future",
            "sprint": "future",
            "summary": "Let guests indicate what they want to do so qME can coordinate queues, signups, and recommendations.",
            "acceptanceCriteria": [
              "Guest can express interest in experiences.",
              "Intent can influence suggested actions.",
              "Intent history does not overcomplicate the July MVP."
            ],
            "notes": "User note: 'Guest keeps announcing intentions (I want that).'"
          }
        ]
      },
      {
        "id": "theme-location-matching",
        "title": "Location, Beacons, and Matching",
        "status": "deferred",
        "stories": [
          {
            "id": "story-location-beacons",
            "title": "Explore location/beacon signals",
            "status": "deferred",
            "sprint": "future",
            "summary": "Use location awareness to know whether a guest is near a queue, gathering, sponsor, or session.",
            "acceptanceCriteria": [
              "Beacon feasibility is researched.",
              "No July dependency unless hardware and venue support are confirmed.",
              "QR fallback is documented."
            ]
          },
          {
            "id": "story-networking-matching",
            "title": "Matching and forced networking",
            "status": "deferred",
            "sprint": "future",
            "summary": "Use surveys/tags/interests to create networking opportunities, possibly sponsor-backed.",
            "acceptanceCriteria": [
              "Fun survey/tag concepts are captured.",
              "Sponsor need is identified.",
              "Privacy and consent questions are documented before build."
            ]
          },
          {
            "id": "story-survey-icons",
            "title": "Interest survey icons",
            "status": "future",
            "sprint": "future",
            "summary": "Use simple icon-based survey prompts to capture interests or group identity.",
            "acceptanceCriteria": [
              "Survey prompts are lightweight.",
              "Interest tags can feed networking or recommendations.",
              "Guests can skip without breaking the event experience."
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "epic-branding-itinerary",
    "title": "Branding and Personal Event Itinerary",
    "summary": "Allow organizations and events to feel branded while guests get a personal agenda tied to queues and activities.",
    "status": "future",
    "themes": [
      {
        "id": "theme-branding",
        "title": "Organization and Event Branding",
        "status": "future",
        "stories": [
          {
            "id": "story-branding-settings",
            "title": "Branding settings",
            "status": "future",
            "sprint": "future",
            "summary": "Offer organization logo, event logo, fonts, and color settings without turning qME into a design tool.",
            "acceptanceCriteria": [
              "Organization can store logo and basic color settings.",
              "Event can override limited branding fields.",
              "Branding has safe defaults."
            ]
          },
          {
            "id": "story-managed-image-storage",
            "title": "Move event images to managed storage",
            "status": "ready",
            "sprint": "soon",
            "summary": "Move organization, event, experience, sponsor, and resource images out of hard-coded public assets and into managed storage with database references.",
            "acceptanceCriteria": [
              "Inventory current static images used as event/demo content.",
              "Define which image types belong to organizations, events, experiences, sponsors, resources, and galleries.",
              "Choose a storage convention, likely Supabase Storage paths plus database URL/path fields.",
              "Admin UI can eventually upload or select images for event content.",
              "Static assets remain available only for app defaults and fallback images.",
              "Peony demo keeps working during migration.",
              "SOTC event can use managed/uploaded images instead of code-folder images."
            ],
            "notes": "This should be considered while building multi-org/event ownership because image ownership follows organization/event/experience ownership. It may also reduce reliance on generated static images in the local Vite build pipeline."
          }
        ]
      },
      {
        "id": "theme-itinerary",
        "title": "Personal Event Itinerary",
        "status": "future",
        "stories": [
          {
            "id": "story-personal-agenda",
            "title": "Personal event agenda",
            "status": "future",
            "sprint": "future",
            "summary": "Show each guest a personal view of joined queues, signed-up sessions, saved resources, and recommended next actions.",
            "acceptanceCriteria": [
              "Guest can see active queue tickets.",
              "Guest can see selected/saved sessions.",
              "Guest can distinguish current, upcoming, and completed items."
            ]
          }
        ]
      }
    ]
  }
];
