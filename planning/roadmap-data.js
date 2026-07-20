const QME_ROADMAP = {
  meta: {
    product: "qME",
    workspace: "Product roadmap and sprint planning",
    updated: "2026-07-20",
    immediateGoal:
      "Use the Summer on the Cuyahoga Rock Hall event as the anchor for moving qME from a single demo event toward a multi-organization event platform.",
    eventAnchor: {
      organization: "Summer on the Cuyahoga",
      event: "SOTC Rock Hall Mixer",
      date: "2026-07-22",
      venue: "Rock and Roll Hall of Fame and Museum",
      purpose:
        "Demo and develop qME around a real event with registration, sponsors, headshots, resume reviews, networking, workshops, and digital resources."
    },
    statusLegend: {
      idea: "Possible but still fuzzy",
      discovery: "Needs product discussion",
      ready: "Ready to break into implementation",
      current: "Candidate for current work",
      future: "Important later",
      deferred: "Known idea intentionally parked",
      done: "Completed or already exists"
    }
  },
  sprints: [
    {
      id: "now",
      title: "Operational Readiness",
      goal:
        "Prepare qME for July SOTC operations by focusing on customer content, event operations, rehearsal, usability, and deployment readiness rather than new platform foundation.",
      storyIds: [
        "story-foundation-privileged-action-matrix",
        "story-foundation-role-permission-smoke-matrix",
        "story-foundation-jalani-admin-walkthrough",
        "story-role-aware-admin-landing",
        "story-station-operational-control-visibility",
        "story-queue-automation-observability",
        "story-temp-password-first-login"
      ]
    },
    {
      id: "next",
      title: "Next: SOTC Event Builder / Program Readiness",
      goal:
        "After Operational Readiness, deepen the Rock Hall mixer model with experiences, queues, access rules, public resources, and managed media.",
      storyIds: [
        "story-remove-hardcoded-demo-assumptions",
        "story-experience-model",
        "story-managed-image-storage",
        "story-sotc-notification-july-fallback",
        "story-headshot-queue",
        "story-headshot-low-staff-operating-model",
        "story-headshot-service-start-acknowledgement",
        "story-resume-review-queue",
        "story-resource-cards",
        "story-passport-activity"
      ]
    },
    {
      id: "soon",
      title: "Soon: SOTC Program Depth",
      goal:
        "Expand SOTC from the first event model into registration, attendee import, networking, schedules, and event activities.",
      storyIds: [
        "story-sotc-qr-entry",
        "story-attendee-import",
        "story-registration",
        "story-workshop-signups",
        "story-personal-agenda"
      ]
    },
    {
      id: "future",
      title: "Future: Optimization and Magic",
      goal:
        "Use guest intent, location, surveys, and timing to help people maximize the event without losing their place.",
      storyIds: [
        "story-workshop-signups",
        "story-guest-intentions",
        "story-location-beacons",
        "story-networking-matching",
        "story-food-filters"
      ]
    }
  ],
  completedSprints: [
    {
      id: "completed-sprint-2-foundation",
      title: "Completed: Sprint 2 Organization, Roles, Auth, and RLS Foundation",
      completedDate: "2026-07-01",
      goal:
        "Build the minimum organization, admin, staff, authentication, and RLS foundation needed before the SOTC pilot can move from guided alpha into real event readiness.",
      summary:
        "Sprint 2 moved qME from founder-operated demo toward organization-ready pilot: named admin identities, organization/event ownership, staff assignments, guest session tokens, role-scoped admin access, authenticated RPC boundaries, and audit logging for newer sensitive staff/admin actions are now in place. qME is not fully production-hardened yet, but the remaining risk has shifted from architecture design to validation and hardening.",
      storyIds: [
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
      notes: [
        "The old temporary admin passphrase path was removed.",
        "Jalani can sign in with named SOTC event-admin access and act only inside the SOTC event scope.",
        "Guest-owned actions and staff/admin-owned actions are separated more clearly through guest-token RPCs and authenticated admin/staff RPCs.",
        "Queue and check-in operational actions now have role-checked RPC boundaries and basic audit logging.",
        "Temporary password/onboarding cleanup remains visible debt and moves into Operational Readiness."
      ]
    },
    {
      id: "completed-sotc-alpha-ui-stabilization",
      title: "Completed: SOTC Alpha UI Stabilization",
      completedDate: "2026-06-26",
      goal:
        "Resolve the obvious SOTC alpha-test UI, refresh, messaging, and recovery issues before starting role/auth/database hardening.",
      summary:
        "Sprint 1 alpha follow-up is complete: calm refresh behavior, mobile button/layout polish, headshot/standby messaging, Not Here guest recovery, auto-flow recovery when admin is closed, and hidden internal ticket numbers on guest pilot screens are resolved.",
      storyIds: [
        "story-sotc-calm-refresh",
        "story-sotc-mobile-layout-polish",
        "story-headshot-queue",
        "story-sotc-not-here-recovery"
      ],
      notes: [
        "The alpha test with Jalani Ball and the SOTC student group produced polish findings, not a rejection of the core flow.",
        "Guests should see stages and clear instructions, not internal ticket mechanics.",
        "Admin/staff can retain operational identifiers and controls.",
        "Next sprint should focus on organization foundation, admin/staff roles, authentication cleanup, and Supabase RLS hardening."
      ]
    },
    {
      id: "completed-planning-cleanup",
      title: "Completed: Planning Workspace and Demo Stabilization",
      completedDate: "2026-06-11",
      goal:
        "Get qME cleaned up enough to trust the Peony Festival flow, then create a product roadmap/planning workspace for SOTC and multi-org work.",
      summary:
        "Peony Festival is stable enough to demonstrate; Bouquet Bar access, fresh reset, kiosk bad-slug handling, legacy cleanup, Node/test setup, roadmap deployment, planning data protection, Trello import, governance review, and pre-multi-org cleanup are complete.",
      storyIds: [
        "story-planning-workspace",
        "story-roadmap-data-model",
        "story-cleanup-before-multi-org",
        "story-admin-update-guest-access",
        "story-import-trello-detail-cards",
        "story-triage-inbox",
        "story-bouquet-access-fixed"
      ],
      notes: [
        "Peony Festival guest flow is good enough for now and should remain demonstrable.",
        "The planning workspace is the source of truth for the next few weeks.",
        "SOTC MVP detail is intentionally deferred until the foundation work starts.",
        "Real roadmap auth is deferred while usage remains limited."
      ]
    }
  ],
  epics: [
    {
      id: "epic-stabilization",
      title: "Cleanup and Stabilization Before Multi-Org",
      summary:
        "Clean up known issues and local workflow friction before building the larger organization/event structure.",
      status: "current",
      themes: [
        {
          id: "theme-guest-access-cleanup",
          title: "Guest Access and Queue Rules",
          status: "current",
          stories: [
            {
              id: "story-bouquet-access-fixed",
              title: "Fix Bouquet Bar eligibility messaging",
              status: "done",
              sprint: "now",
              summary:
                "Guests now see different Bouquet Bar messages depending on whether they are not checked in, checked in as general admission, or checked in with Festival + Flowers.",
              acceptanceCriteria: [
                "Not checked in guests are prompted to check in.",
                "General admission guests are blocked with the correct explanation.",
                "Festival + Flowers guests can join the queue."
              ],
              notes:
                "Verified on phone after Vercel deploy."
            },
            {
              id: "story-peony-main-event-weird-queue-number",
              title: "Hotfix Peony main event weird queue number",
              status: "current",
              sprint: "now",
              summary:
                "Fix the Peony event main guest screen showing a stale or incorrect line number that does not match the guest's actual queue position.",
              acceptanceCriteria: [
                "Reproduce the case where the main event screen shows a number like #490 while the actual guest queue position is 23.",
                "Identify whether the page is displaying ticket id, stale localStorage state, the wrong queue, or an aggregate queue value.",
                "Main event guest messaging displays the correct queue status or does not display a misleading queue number.",
                "Flower Photos and Wrapped Bouquets queue ticket displays remain correct.",
                "The fix does not break admin queue advancement or guest served/removed behavior."
              ],
              notes:
                "Captured from Product Inbox bug: Peony event - main event guest shows a weird queue number. Treat as a hotfix before deeper multi-org work."
            },
            {
              id: "story-cleanup-before-multi-org",
              title: "Complete cleanup pass before multi-organization build",
              status: "done",
              sprint: "now",
              summary:
                "Keep a short, explicit cleanup list so known issues are reviewed before the architecture expands.",
              acceptanceCriteria: [
                "Known guest-flow bugs are either fixed or documented.",
                "Known local build/workflow issues are captured.",
                "Deferred cleanup items are separated from multi-org stories."
              ],
              notes:
                "Completed with docs/pre-multi-org-cleanup.md. Demo-specific Peony behavior is intentionally preserved and deferred until the multi-org foundation can absorb it safely."
            },
            {
              id: "story-preserve-peony-demo",
              title: "Migrate Peony Festival into a demo organization without breaking it",
              status: "done",
              sprint: "now",
              summary:
                "Create a demo/test organization for Peony Festival and use it as the safety check while organizations and event ownership are introduced.",
              acceptanceCriteria: [
                "A demo/test organization exists for the Peony Festival demo.",
                "The Peony Festival event is assigned to that demo organization.",
                "Existing Peony Festival URLs keep working.",
                "Flower Photos and Wrapped Bouquets queues remain usable for demos.",
                "Demo-specific assumptions are documented before they are generalized.",
                "The migration explicitly preserves the 'please do not break the demo' requirement."
              ],
              notes:
                "Completed at the foundation level in supabase-org-event-foundation.sql: Walnut Ridge Farm is seeded as the Peony owner, Peony keeps its existing slug/guest URLs, and demo-specific assumptions remain documented in docs/hard-coded-demo-assumptions-audit.md."
            },
            {
              id: "story-admin-update-guest-access",
              title: "Allow admin to update guest access after check-in",
              status: "done",
              sprint: "now",
              summary:
                "Let an admin correct or upgrade a checked-in guest's access, such as changing a Peony guest from general admission to Festival + Flowers so they can join Wrapped Bouquets.",
              acceptanceCriteria: [
                "Admin can view a guest's current event check-in access type.",
                "Admin can upgrade a checked-in guest from general admission to Festival + Flowers.",
                "Updated access is respected by the Wrapped Bouquets queue guard without requiring a new phone/browser identity.",
                "The pattern is documented as a precursor to SOTC access tags such as student, professional, and professional-with-photo."
              ],
              notes:
                "Implemented for Peony event check-ins as a one-way correction from general to Festival + Flowers access. SOTC photo credit states should be modeled separately."
            },
            {
              id: "story-hardcoded-demo-assumptions-audit",
              title: "Identify hard-coded demo assumptions before foundation build",
              status: "ready",
              sprint: "now",
              summary:
                "Audit the app for Peony-specific, Bouquet-specific, static-image, route-guard, and demo-only assumptions before they are generalized or removed.",
              acceptanceCriteria: [
                "Hard-coded event slugs, queue slugs, ticket/access types, static event content, image paths, and demo route guards are listed.",
                "Each item is classified as keep-for-demo, migrate-to-data, generalize-now, or remove-later.",
                "Peony demo safety requirements are captured beside each risky item.",
                "Findings produce follow-up implementation stories rather than broad untracked cleanup."
              ],
              notes:
                "Identification is separate from removal so the Peony demo remains stable while the multi-org foundation is introduced."
            },
            {
              id: "story-remove-hardcoded-demo-assumptions",
              title: "Remove or generalize hard-coded demo assumptions",
              status: "ready",
              sprint: "next",
              summary:
                "Replace audited hard-coded demo assumptions with organization/event/experience data once the foundation exists.",
              acceptanceCriteria: [
                "Only items classified for removal or generalization are changed.",
                "Peony remains demonstrable after each removal/generalization step.",
                "SOTC can be modeled without copying Peony-specific code paths.",
                "Static content or images move to data/storage only after ownership is defined."
              ],
              notes:
                "This follows the hard-coded assumptions audit and should be split into smaller implementation stories if the list is large."
            },
            {
              id: "story-event-guest-data-cleanup",
              title: "Clean up event guest and check-in data before org migration",
              status: "ready",
              sprint: "now",
              summary:
                "Review and normalize Peony demo guest/check-in data before it is carried into an organization-based system.",
              acceptanceCriteria: [
                "Identify test/demo guest and event_check_ins rows that should be archived, deleted, renamed, or preserved.",
                "Identify completed event_check_ins rows with null or ambiguous ticket_type values.",
                "Decide whether null ticket_type values should become general for Peony demo rows.",
                "Confirm which Peony guest/check-in data should remain available for demonstrations.",
                "Document any cleanup SQL or manual Supabase steps before changing live data.",
                "Do not mutate production/demo data until the cleanup plan is reviewed."
              ],
              notes:
                "Prompted by observing a completed event_check_ins row with NULL ticket_type. This is data cleanup/planning first, not an immediate data mutation."
            }
          ]
        },
        {
          id: "theme-local-workflow-cleanup",
          title: "Local Build and Tooling Friction",
          status: "current",
          stories: [
            {
              id: "story-dist-images-lock",
              title: "Track recurring app/dist/images build lock",
              status: "current",
              sprint: "now",
              summary:
                "Normal npm run build can fail when Windows/Dropbox locks generated app/dist/images, even though TypeScript and Vite bundling pass.",
              acceptanceCriteria: [
                "Document that this is generated-folder lock behavior, not an app compile failure.",
                "Keep npx vite build --emptyOutDir false as a temporary verification fallback.",
                "Decide whether to move generated build output away from Dropbox or change local cleanup workflow."
              ],
              notes:
                "Observed multiple times: app compiles and bundles successfully, but Vite cannot remove app/dist/images."
            },
            {
              id: "story-sandbox-spawn-hiccup",
              title: "Track intermittent Windows sandbox spawn hiccup",
              status: "current",
              sprint: "now",
              summary:
                "Some shell commands occasionally fail before execution with a Windows sandbox spawn setup refresh error.",
              acceptanceCriteria: [
                "Capture the symptom in the cleanup list.",
                "Use approved reruns only when needed.",
                "Do not treat pre-execution spawn failures as code failures."
              ],
              notes:
                "Seen with normal build and git diff-stat/diff style commands."
            },
            {
              id: "story-git-command-friction",
              title: "Track intermittent Git command friction",
              status: "current",
              sprint: "now",
              summary:
                "Occasional diff/status commands hit local sandbox friction, but Git operations have succeeded after safe reruns.",
              acceptanceCriteria: [
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
      id: "epic-product-management",
      title: "Product Management Workspace",
      summary:
        "A repo-native planning tool that preserves epics/themes/stories and shows both roadmap hierarchy and sprint focus.",
      status: "current",
      themes: [
        {
          id: "theme-roadmap-tool",
          title: "Roadmap Tool",
          status: "current",
          stories: [
            {
              id: "story-planning-workspace",
              title: "Create static planning workspace",
              status: "done",
              sprint: "now",
              summary:
                "Add HTML pages in the repo for roadmap, backlog, and sprint review views.",
              acceptanceCriteria: [
                "Planning pages open locally without a backend.",
                "Epics expand to show themes and stories.",
                "Sprint view uses the same story data as the roadmap."
              ],
              notes:
                "This should be easy for Codex, Claude Code, or a human developer to inspect."
            },
            {
              id: "story-roadmap-data-model",
              title: "Store roadmap as structured data",
              status: "done",
              sprint: "now",
              summary:
                "Keep roadmap content in a single data file so graphical views do not duplicate cards.",
              acceptanceCriteria: [
                "Epics, themes, stories, sprints, and inbox notes live in one source file.",
                "Stories can be reused across views by id.",
                "Status and sprint assignment are visible."
              ]
            },
            {
              id: "story-triage-inbox",
              title: "Add product inbox for emailed thoughts",
              status: "done",
              sprint: "now",
              summary:
                "Create a place for raw notes to be captured, triaged, promoted to stories, or parked.",
              acceptanceCriteria: [
                "Inbox items can be tagged as consider, promote, or defer.",
                "Raw wording can be preserved while product implications are clarified.",
                "Deferred ideas remain visible without distracting the current sprint."
              ]
            },
            {
              id: "story-import-trello-detail-cards",
              title: "Import detailed Trello cards into product board",
              status: "done",
              sprint: "now",
              summary:
                "Review screenshots/PDF of detailed Trello cards and reconcile them into the repo-based product roadmap.",
              acceptanceCriteria: [
                "Trello card screenshots are collected into a PDF or readable image set.",
                "PDF is reviewed for overlap with existing roadmap epics, themes, and stories.",
                "New or missing items are added to the roadmap or product inbox.",
                "Duplicate items are merged, linked, or noted against existing stories.",
                "Open questions from Trello are captured separately as decisions or discovery items."
              ],
              notes:
                "Imported from sotc planning doc.pdf on 2026-06-10. Most items overlapped existing epics; missing details were added as role, event scheduling, eCe lifecycle, SOTC registration, and admin operations cards."
            },
            {
              id: "story-planning-admin-access-controls",
              title: "Replace planning access code with admin controls",
              status: "done",
              sprint: "now",
              summary:
                "Move the deployed planning workspace from a shared access code to qME admin-aware controls so roadmap viewing, editing, and syncing are governed like the rest of the platform.",
              acceptanceCriteria: [
                "Planning access no longer depends on the hard-coded/shared planning code as the primary control.",
                "qME superadmin can view and edit the planning workspace.",
                "Future organization/admin visibility rules are documented before exposing planning data outside qME operators.",
                "Planning document writes/syncs are restricted to approved admin roles.",
                "Temporary fallback access, if retained during transition, is labeled with risk and removal intent."
              ],
              notes:
                "Completed on 2026-06-29: /planning now unlocks from the same Supabase Auth session used by /admin, and /api/planning-data verifies that the caller is an active qME superadmin before allowing roadmap reads or writes. The old shared planning access code and cookie gate were removed from the planning route. Future expansion can add org-scoped planning visibility once the product planning model needs collaborators beyond qME operators."
            }
          ]
        },
        {
          id: "theme-sprint-review",
          title: "Sprint Review Rhythm",
          status: "ready",
          stories: [
            {
              id: "story-sprint-review-template",
              title: "Define sprint review checklist",
              status: "ready",
              sprint: "next",
              summary:
                "Use a lightweight review concept for what changed, what was learned, what is next, and what decisions are needed.",
              acceptanceCriteria: [
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
      id: "epic-org-admin",
      title: "Organizations and Admin Accounts",
      summary:
        "Support qME customers as organizations with admins, staff, and scoped access.",
      status: "ready",
      themes: [
        {
          id: "theme-organizations",
          title: "Organizations",
          status: "ready",
          stories: [
            {
              id: "story-org-table",
              title: "Create organizations table",
              status: "done",
              sprint: "now",
              summary:
                "Add the core organization model so qME is no longer only a single demo/event app.",
              acceptanceCriteria: [
                "Supabase has an organizations table.",
                "Organizations have name, slug, status, and timestamps.",
                "Existing Peony Festival data can belong to a default organization."
              ],
              notes:
                "Completed in supabase-org-event-foundation.sql: creates organizations, adds events.organization_id, seeds Walnut Ridge Farm, qME Demo, and Summer on the Cuyahoga, and keeps policies temporary until Sprint 2 roles/RLS hardening."
            },
            {
              id: "story-governance-principles-foundation",
              title: "Define governance principles for multi-org foundation",
              status: "done",
              sprint: "now",
              summary:
                "Use the authority/object governance model to settle the minimum role, authority, ownership, and audit principles before building superadmin, organization, and admin structures.",
              acceptanceCriteria: [
                "Superadmin, organization admin, and staff boundaries are defined.",
                "Active organization context behavior is decided for users who belong to multiple organizations.",
                "Organizations owning events is confirmed as a foundation rule.",
                "Role assignment/removal and sensitive governance actions are identified as audit candidates.",
                "Sensitive operations needing confirmation or later PIN/process are identified.",
                "Full custom permissions are explicitly deferred.",
                "Decisions are translated into initial table/schema requirements before implementation."
              ],
              notes:
                "Completed in docs/admin-governance-v1.md. This sets the Sprint 2 boundaries for super admin, org admin, event admin, staff, station/service provider, guest access, audit candidates, and deferred custom permissions."
            },
            {
              id: "story-image-ownership-model",
              title: "Define image ownership model before schema work",
              status: "ready",
              sprint: "now",
              summary:
                "Decide where organization logos, event images, experience images, sponsor logos, resource images, and gallery images belong before tables and storage are implemented.",
              acceptanceCriteria: [
                "Image ownership is defined for organizations, events, experiences/eCe's, sponsors, resources, and galleries.",
                "Initial database fields or image reference strategy are identified before event schema work proceeds.",
                "Managed storage implementation remains a separate story.",
                "Static app images are limited to defaults/placeholders over time.",
                "Peony and SOTC image needs are both considered."
              ],
              notes:
                "This is the pre-build design decision. The separate managed image storage story covers Supabase Storage and upload/selection implementation."
            },
            {
              id: "story-seed-sotc-org",
              title: "Seed Summer on the Cuyahoga organization",
              status: "done",
              sprint: "now",
              summary:
                "Create Summer on the Cuyahoga as a first real organization for the Rock Hall event demo.",
              acceptanceCriteria: [
                "Organization slug is stable.",
                "The organization can own the July 22 Rock Hall event.",
                "Future staff/admin records can be attached."
              ],
              notes:
                "Completed in supabase-org-event-foundation.sql with slug summer-on-the-cuyahoga and SOTC event ownership backfill for sotc-test-check-in and future sotc-rock-hall."
            },
            {
              id: "story-org-staff",
              title: "Model organization staff",
              status: "current",
              sprint: "now",
              summary:
                "Allow organizations to invite staff or assign event-specific roles.",
              acceptanceCriteria: [
                "One person can belong to one or more organizations.",
                "Staff permissions can be narrower than owner/admin permissions.",
                "Staff can be assigned to event operations later.",
                "A user with multiple organizations can choose which organization/account context to use after login."
              ],
              notes:
                "Schema foundation added in supabase-admin-role-foundation.sql with admin_principals, organization_memberships, and event_staff_assignments. App passes added: Organization Staff panel for org_admin/universal_staff memberships; Event Staff panel on admin event detail for event_admin, check_in_staff, and feature-scoped service_staff/service_provider/station_account assignments by existing admin principal email. Invite emails, smoother new-user flow, and role-aware database RLS enforcement remain in Sprint 2."
            }
          ]
        },
        {
          id: "theme-admin-roles",
          title: "Admin Account Management",
          status: "ready",
          stories: [
            {
              id: "story-admin-org-role",
              title: "Add admin and organization roles",
              status: "current",
              sprint: "now",
              summary:
                "Separate qME superadmin access from organization admin access.",
              acceptanceCriteria: [
                "A qME superadmin can manage all organizations.",
                "An organization admin can manage only their organization.",
                "Role checks are documented before sensitive admin screens expand.",
                "Superadmin can assume an admin role in an organization for support.",
                "Admin operational actions such as start, pause, end, and reset have extra friction such as confirmation or PIN."
              ],
              notes:
                "Schema foundation added in supabase-admin-role-foundation.sql with platform_roles for superadmin/support, organization memberships for org_admin/universal_staff, event staff assignments, and helper functions for the RLS pass. App enforcement pass added: AdminGate displays organization/event roles, superadmin can see all orgs/events, org admins are scoped to their organizations, event/station staff are scoped to assigned events, and setup controls are hidden from non-managers. Database RLS enforcement is still temporary until SOTC RLS hardening."
            },
            {
              id: "story-authentication-cleanup",
              title: "Clean up authentication path for admin and staff",
              status: "current",
              sprint: "now",
              summary:
                "Choose and implement the near-term authentication structure for qME admin, organization admin, event staff, and temporary pilot operations.",
              acceptanceCriteria: [
                "Current demo/admin access assumptions are listed.",
                "Near-term admin/staff login approach is chosen.",
                "qME admin, organization admin, and event/station staff access paths are separated enough to support RLS work.",
                "Temporary access shortcuts are documented with expiration or replacement intent.",
                "Guest/anon access remains available for event check-in and queue participation without exposing staff actions.",
                "The authentication decision feeds the SOTC RLS hardening story."
              ],
              notes:
                "Sprint 2 focus from post-alpha planning: do this before asking the computer engineering student to review database hardening, so the review has concrete role/auth structure. Near-term decision is documented in docs/admin-auth-transition-v1.md. AdminGate now requires Supabase Auth users linked to admin_principals and shows a visible admin identity/role bar; the old passphrase fallback has been removed. Superadmin utility added at /admin/principals to list admin principals, create named principals, link an existing Supabase Auth user UUID, and create a Supabase Auth login plus qME principal from the tool when SUPABASE_SERVICE_ROLE_KEY is configured server-side. One email/Auth user should map to one admin principal, and that principal may hold memberships in multiple organizations; UI should preserve that rather than duplicating users per organization. Role-scoped routing is active; first RLS hardening pass is drafted, while invite-email automation and temporary-password-change enforcement remain pending."
            },
            {
              id: "story-temp-password-first-login",
              title: "Require temporary admin/staff password change on first login",
              status: "current",
              sprint: "now",
              summary:
                "Make admin-created temporary passwords explicit by requiring a staff/admin user to set a new password before using protected admin tools.",
              acceptanceCriteria: [
                "Admin-created users can be marked as requiring a password change.",
                "A user with a required password change is redirected to a password-change screen after sign-in.",
                "Protected admin tools are blocked until the password change is completed.",
                "Supabase Auth password update succeeds from the signed-in user's session.",
                "The temporary-password flag is cleared only after a successful password update.",
                "The current Jalani/SOTC pilot setup is documented as a temporary manual-password bridge until this story is implemented."
              ],
              notes:
                "Added during Sprint 2 while creating Jalani as an event admin for the SOTC test. Current pilot flow can use a manually shared temporary password, but production-ready staff onboarding should not leave temporary credentials as permanent credentials."
            },
            {
              id: "story-role-permissions-audit",
              title: "Define role permissions and audit logs",
              status: "future",
              sprint: "future",
              summary:
                "Model organization roles as permission sets and record sensitive admin actions with actor, timestamp, and rationale.",
              acceptanceCriteria: [
                "Roles can grant capabilities such as create, edit, view, delete, check-in, pause/resume, skip/reorder, merge/split, and priority override.",
                "User state can be live, suspended, or unsuspended.",
                "Sensitive operational actions create audit log entries with actor identity and timestamp.",
                "The model can start with default roles and allow later customization."
              ],
              notes:
                "Imported from Trello admin/staff role cards and provisional admin console notes. Initial audit table added in supabase-admin-role-foundation.sql; audit-writing behavior and polished audit UI remain future work."
            },
            {
              id: "story-sotc-admin-staff-rls-hardening",
              title: "Define SOTC admin/staff roles and Supabase RLS boundaries",
              status: "done",
              sprint: "completed",
              summary:
                "Review and harden the SOTC pilot database permission model before moving beyond guided alpha testing.",
              acceptanceCriteria: [
                "Role matrix exists for qME admin, event admin, check-in staff, service staff/photographer, and guest/anon.",
                "Each protected SOTC pilot table has intended read/write rules documented.",
                "Current permissive policies, including broad using true and with check true policies, are listed with replacement policy recommendations.",
                "Guest-owned actions are separated from staff-owned actions such as granting photo credits, resetting queues, releasing guests, and marking headshots complete.",
                "Queue transition and ticket ownership checks needed at the database/function layer are identified.",
                "Audit needs are documented for check-in, credit granted, nearby, released, completed, not here, and reset actions.",
                "Near-term pilot auth approach is chosen: Supabase Auth, magic link, staff PIN, invite code, or a documented temporary bridge.",
                "Remaining database/security risks are documented before real event use."
              ],
              notes:
                "Alpha-test follow-up from computer engineering student feedback: the pilot works, but the database needs manual hardening around roles, RLS, action ownership, and auditability before real SOTC operations. First RLS hardening pass added in supabase-sotc-rls-hardening.sql with companion notes in docs/sotc-rls-hardening-v1.md: admin principals/roles/memberships/event staff assignments are scoped to authenticated admins, event guest designations are staff/admin managed, guest credit writes are staff/admin only, and guest-sourced scan/code marks remain open for pilot completion. Second pass added in supabase-sprint2-setup-rls.sql: active organizations/events/expies/eCes/legacy experiences/queues remain guest-readable, while setup writes are restricted to qME superadmin, organization admin, or event admin. Third pass drafted in supabase-guest-session-foundation.sql: anonymous guest browsers receive event-scoped session tokens, event_check_ins/tickets can link to guest_sessions, queue RPC overloads can attach/verify ticket ownership, and the guest check-in form can optionally capture email/phone for later recovery. Fourth pass drafted in supabase-guest-action-rls-tightening.sql: guest check-in reads/completion, ticket reads/name updates/nearby/completion, guest marks, and guest credit reads move behind guest-token verified RPCs, while direct table access for event_check_ins, tickets, event_guest_marks, and event_guest_credits becomes staff/admin scoped. July 1 app hardening update: guest-facing actions now fail closed when the scoped RPC is missing or rejects the guest token, instead of falling back to unscoped direct table access. July 1 SQL follow-up: guest-session and guest-action functions now explicitly revoke default public execution and grant only intended browser RPCs to anon/authenticated roles. Admin queue RPC boundary pass added in supabase-admin-queue-action-rpcs.sql: release, Not Here, Return to Waiting, and staff/admin completion now use authenticated role-checked RPCs with basic audit logs instead of direct browser table mutations. Admin check-in RPC boundary pass added in supabase-admin-checkin-action-rpcs.sql: check-in completion, guest access/ticket-type updates, and photo-credit grants now use authenticated role-checked RPCs with audit logs instead of direct browser mutations. Reminder: re-engage the computer engineering student after this pass is run and smoke-tested so his review can focus on concrete policies and remaining risks."
            },
            {
              id: "story-foundation-role-permission-smoke-matrix",
              title: "Run role and permission smoke-test matrix",
              status: "current",
              sprint: "now",
              summary:
                "Validate that each qME role can do what it should and cannot overreach into another organization, event, station, or guest state.",
              acceptanceCriteria: [
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
              notes:
                "Added by the 2026-07-01 Foundation Review. This is validation, not a broad new build phase. July 16 security smoke test verified the roles currently in real use: anonymous guests can check in, join Headshot, mark nearby, and complete via guest self-service; qME superadmin can complete check-in, grant photo credit, operate Headshot, and complete guests; Jalani/event admin can reset event test data after the hardening changes. Station Staff and Station Supervisor are not yet fully productized roles, so their smoke test remains pending under role-aware admin landing and station-role finalization."
            },
            {
              id: "story-foundation-privileged-action-matrix",
              title: "Document privileged action matrix",
              status: "done",
              sprint: "now",
              summary:
                "Create a concise matrix of sensitive actions, their RPC/function path, required role, audit behavior, RLS/table protection, and remaining risk.",
              acceptanceCriteria: [
                "Matrix includes release guest, mark Not Here, Return to Waiting, complete ticket, complete check-in, grant photo credit, update guest access, reset test data, edit event setup, edit queue settings, and live queue controls.",
                "Each action has a user-facing action name, code/RPC path, required role, audit behavior, RLS protection, and remaining risk.",
                "Matrix distinguishes event-wide/destructive authority from station-level staff and station-admin authority.",
                "Any direct-client/RLS-backed action is identified as accepted for now, moved to a follow-up, or replaced with an RPC."
              ],
              notes:
                "Added by the 2026-07-01 Foundation Review to prevent protection gaps from hiding inside scattered UI/service calls. Completed July 16 with docs/privileged-action-matrix-v1.md. The matrix documents guest check-in/session actions, admin check-in/photo-credit actions, queue flow/release/Not Here/Return to Waiting/completion, Headshot guest service-start self-completion, destructive reset controls, setup mutations, admin principal management, and bootstrap restrictions. Current conclusion: emergency anonymous/admin RPC boundaries are much stronger and verified live; the next layer is station-role clarity, role-aware workspace visibility, and moving remaining important setup mutations behind named audited RPCs where direct RLS is still ambiguous."
            },
            {
              id: "story-foundation-external-db-security-review",
              title: "Re-engage computer engineering student for database/security review",
              status: "done",
              sprint: "now",
              summary:
                "Ask the student reviewer to critique the implemented role/auth/RLS/RPC foundation rather than brainstorm an open-ended redesign.",
              acceptanceCriteria: [
                "Review packet includes role model, guest token approach, RLS policies, RPC boundaries, audit logging, and remaining permissive policies.",
                "Reviewer is asked to look for obvious guest/staff/admin overreach paths.",
                "Findings are captured as planning inbox items, decisions, or stories.",
                "Follow-up work is bounded before SOTC Event Builder resumes."
              ],
              notes:
                "Completed July 20 after Ahmed reviewed the security remediation report and confirmed qME is good for the July SOTC pilot, with remaining items safely deferrable. Future security reviews should continue the same evidence-based process: independent review, verification, risk classification, bounded remediation, regression testing, production validation, and documentation."
            },
            {
              id: "story-foundation-jalani-admin-walkthrough",
              title: "Run Jalani named-admin walkthrough",
              status: "current",
              sprint: "now",
              summary:
                "Have Jalani walk through the SOTC admin/event-staff flow using named access to validate whether the role and UI model makes sense without founder guidance.",
              acceptanceCriteria: [
                "Jalani can sign in with named access.",
                "If Jalani participates as a guest, that flow uses guest-session state and is not confused with admin sign-in.",
                "Jalani can reach the SOTC event and not unrelated admin areas.",
                "Walkthrough covers admin tabs, check-in flow, queue flow, Not Here, Return to Waiting, and photo-credit/headshot flow.",
                "Confusing labels, missing affordances, and permission surprises are captured."
              ],
              notes:
                "Initial sign-in and scoped event-admin access are already verified. This story is the deeper usability/operations walkthrough."
            },
            {
              id: "story-security-emergency-remediation",
              title: "Complete Ahmed security emergency remediation pass",
              status: "done",
              sprint: "now",
              summary:
                "Verify and close confirmed high-risk security findings from Ahmed's review before resuming nonessential feature expansion.",
              acceptanceCriteria: [
                "Each emergency finding is classified as confirmed/exploitable, confirmed lower-risk, already fixed, not reproducible, or deferred defense-in-depth.",
                "Anonymous group-order writes and broad guest-credit reads are verified against live Supabase and closed if present.",
                "Flexlink intake no longer contains committed secret/hash material, no longer uses a hash as a bearer cookie, and hard-fails without service-role configuration.",
                "Credit consumption requires durable guest/check-in identity and does not authorize by display name.",
                "Superadmin/bootstrap and other privileged functions have explicit execute grants and cannot be called by ordinary authenticated users.",
                "Verification SQL, remediation SQL, tests, manual deployment actions, and remaining risks are documented for Ahmed follow-up."
              ],
              notes:
                "Added by the 2026-07-16 security review. This paused unrelated feature expansion until emergency findings were verified and closed. July 16 follow-up: smoke-test reset bug was fixed, then security work resumed by updating remediation/current SQL to revoke anonymous direct table grants from admin_principals, platform_roles, organization_memberships, event_staff_assignments, event_check_ins, tickets, event_guest_marks, event_guest_credits, and event_group_order_items while preserving authenticated RLS access and scoped anonymous guest RPCs. Live verification now shows sensitive table RLS enabled, no direct anon table grants on the reviewed sensitive tables, no permissive using-true policies on those tables, no guest-credit rows without check-in ownership, clean group-order data audit, legacy unscoped guest queue RPCs revoked, queue reset restricted to event-admin-or-above internally, and admin/staff RPC execute grants cleaned so anon is false and authenticated remains true with internal role checks. Functional smoke test after remediation verified guest check-in/Headshot self-service, superadmin check-in/photo-credit/queue operation, and Jalani event-admin reset. July 17 clarification: the prior group-order pilot is disabled security debt, not a partially supported feature. Keep existing data for audit, mark old pilot SQL as superseded/dangerous, add a regression check for permissive group-order writes, and do not re-enable ordering until guest-session-owned order records, scoped RPCs, station/event staff authorization, server-side quantity/state validation, idempotency, audit logging, and draft/submitted/approved/fulfilled order states exist. July 17 finding-by-finding evidence packet added in docs/security-review-ahmed-finding-evidence-2026-07-17.md. Final bounded pre-SOTC pass added repo fixes for the remaining immediate hardening items: revoked/replaced guest sessions no longer reactivate on retry, guest self-check-in ticket type is constrained to a nonprivileged allowlist and cannot overwrite authoritative classifications, and admin/staff principal lookup now uses exact normalized email equality with duplicate-match refusal instead of wildcard-sensitive ilike. July 20 closure: production regression SQL passed, live verification remained clean, guest/admin smoke testing passed, and Ahmed confirmed the remaining work can be deferred until after the SOTC pilot. Emergency remediation is closed. Remaining items are security maturity backlog, not emergency work: provider-level rate limiting, invite/password-reset workflow, additional audited administrative RPCs where appropriate, browser-storage improvements, mobile security enhancements, group-order secure redesign, additional security monitoring/auditing, npm ci/build reproducibility after SOTC, canonical auth-user identity/multi-email modeling, and station-role product finalization."
            },
            {
              id: "story-guest-session-recovery-code",
              title: "Let guests recover their event session by email or phone code",
              status: "future",
              sprint: "future",
              summary:
                "Allow an anonymous guest to provide email or phone, receive a short code, and recover their event check-in, queue tickets, and submitted activity state on another browser/device.",
              acceptanceCriteria: [
                "Guest check-in can capture email or phone as an optional contact method.",
                "Guest can request a one-time code to recover their event session.",
                "Successful code verification restores the guest's check-in and active tickets without creating a full admin account.",
                "Codes expire and cannot be reused.",
                "The feature does not expose other guests' check-ins, tickets, credits, or order/activity submissions."
              ],
              notes:
                "Added during Sprint 2 guest-session hardening discussion. The first foundation pass stores optional email/phone on guest_sessions but does not yet send or verify recovery codes."
            },
            {
              id: "story-superadmin-role",
              title: "Define qME superadmin role",
              status: "future",
              sprint: "future",
              summary:
                "Add explicit owner/operator permissions for qME platform management.",
              acceptanceCriteria: [
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
      id: "epic-events",
      title: "Events",
      summary:
        "Create and manage events owned by organizations, including public guest pages and admin configuration.",
      status: "ready",
      themes: [
        {
          id: "theme-event-lifecycle",
          title: "Event Lifecycle",
          status: "ready",
          stories: [
            {
              id: "story-event-org-owner",
              title: "Attach events to organizations",
              status: "done",
              sprint: "now",
              summary:
                "Make event ownership explicit so each customer can manage their own events.",
              acceptanceCriteria: [
                "events.organization_id references organizations.id.",
                "Existing guest URLs keep working.",
                "Admin event lists can filter by organization."
              ],
              notes:
                "Completed in supabase-org-event-foundation.sql and app services: events.organization_id references organizations, known Peony and SOTC events are assigned, public URLs remain slug-based, and listEvents can filter by organizationId."
            },
            {
              id: "story-event-create-edit",
              title: "Create and edit events",
              status: "ready",
              sprint: "now",
              summary:
                "Allow an admin or qME operator to set up an event without code changes.",
              acceptanceCriteria: [
                "Admin can create event name, slug, date, venue, and status.",
                "Admin can edit event details.",
                "Validation protects unique slugs within an organization.",
                "Event can store short description, long description, location, and multi-day start/end windows."
              ]
            },
            {
              id: "story-event-operational-mode-config",
              title: "Make event automation and operating mode configurable",
              status: "current",
              sprint: "now",
              summary:
                "Replace hidden SOTC test/demo automation assumptions with explicit event-level operating settings so each organization knows how an event will behave.",
              acceptanceCriteria: [
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
              notes:
                "Added during Sprint 2 product discussion after confirming that SOTC's automated test behavior should be configurable by event. This supports the Sprint 2 trust goal: an organization can independently operate an event with appropriate permissions and predictable behavior. 2026-07-01 architecture review clarified the distinction between Event Setup, Live Operations, and Live Event Controls: controls such as queue flow mode, gathering target/max, stale timing, pause/resume, and intake behavior belong with operations and should be editable only by event admin or higher. Current implementation lets event admins reset test data because event_admin satisfies canManageEvent; before live production, decide whether destructive reset should require org admin/superadmin, event test mode, or a separate reset permission. Reset confirmation feedback was tightened on 2026-06-30 so wrong confirmation text reports that no reset happened."
            },
            {
              id: "story-event-schedules-recurrence",
              title: "Support event schedules and recurrence",
              status: "future",
              sprint: "future",
              summary:
                "Allow events to span multiple days, have multiple daily start/stop blocks, and later support recurring schedules.",
              acceptanceCriteria: [
                "Event can represent multi-day date/time windows.",
                "Event can represent multiple time blocks in a day, such as breakfast, lunch, happy hour, or session blocks.",
                "Calendar-style event schedule view is considered.",
                "Recurring event rules are parked for later unless a customer requires them."
              ],
              notes:
                "Imported from Trello event creation card."
            },
            {
              id: "story-event-type-templates",
              title: "Define event types and templates",
              status: "future",
              sprint: "future",
              summary:
                "Use event types such as festival, conference, concert, sporting event, speaker event, or trade show to seed useful default experiences.",
              acceptanceCriteria: [
                "Event type list is documented.",
                "Each event type can suggest expected experience types.",
                "Templates remain optional and do not block simple event creation."
              ],
              notes:
                "Imported from Trello Events have types card."
            },
            {
              id: "story-event-suspend",
              title: "Suspend or archive events",
              status: "future",
              sprint: "future",
              summary:
                "Give admins a controlled way to hide or close events without deleting them.",
              acceptanceCriteria: [
                "Suspended events are not joinable by guests.",
                "Archived events remain available for reporting.",
                "Admin can see why an event is unavailable.",
                "Editing or suspension restrictions are defined when an event has active eCe/experience instances."
              ]
            }
          ]
        },
        {
          id: "theme-sotc-anchor",
          title: "SOTC Rock Hall Event Setup",
          status: "current",
          stories: [
            {
              id: "story-sotc-anchor-event",
              title: "Create SOTC Rock Hall event plan",
              status: "done",
              sprint: "now",
              summary:
                "Use the July 22 event as the product anchor for multi-org and event-builder work.",
              acceptanceCriteria: [
                "Event basics are captured in the roadmap.",
                "Known event modules are listed.",
                "Demo priorities are separated from future ideas."
              ],
              references: [
                "I-Pitch Presentation - qMe.pptx",
                "SOTC interview notes",
                "Mixer resources page"
              ],
              notes:
                "Done as the working anchor plan in docs/sotc-rock-hall-event-plan.md. Exact July 22 operating scope will be confirmed after the first SOTC foundation demo."
            },
            {
              id: "story-sotc-experience-inventory",
              title: "Inventory SOTC event experiences",
              status: "ready",
              sprint: "now",
              summary:
                "Turn the brochure/program areas into event experience candidates.",
              acceptanceCriteria: [
                "Registration, sponsors, headshots, networking, resume reviews, food, bar, greetings, workshops, galleries, and resources are captured.",
                "Each experience has an initial treatment: queue, info card, signup, notification, map, or future experiment.",
                "Queue-bearing experiences are identified first.",
                "QR entry, attendee lookup/import, registration admin view, headshot queue, resume queue, scavenger hunts, and micro-activities are represented at least as thin backlog items."
              ],
              notes:
                "Do not overbuild this yet. Use the inventory to inform the foundation and later pick a thin SOTC MVP."
            },
            {
              id: "story-sotc-hardware-needs",
              title: "Analyze SOTC event hardware needs",
              status: "ready",
              sprint: "now",
              summary:
                "Decide what physical hardware is needed for the July 22 Rock Hall event, then purchase or source it in time for setup and testing.",
              acceptanceCriteria: [
                "Identify hardware needed for registration, QR display/signage, admin/staff use, host queues, and any guest-facing kiosk or display flow.",
                "Decide what can be handled by personal phones/laptops versus dedicated event hardware.",
                "Create a purchase/source list with quantities, owner, estimated cost, and needed-by date.",
                "Confirm hardware can be tested before the event in a realistic setup."
              ],
              notes:
                "This should happen before finalizing the operational July 22 scope. Include backup/power/connectivity considerations."
            }
          ]
        }
      ]
    },
    {
      id: "epic-experiences",
      title: "Experiences and eCe's",
      summary:
        "Model event activities as configurable experiences that can be information cards, queues, signups, resources, sponsor placements, or interactive activities.",
      status: "ready",
      themes: [
        {
          id: "theme-experience-model",
          title: "Experience Model",
          status: "ready",
          stories: [
            {
              id: "story-experience-model",
              title: "Create experience model",
              status: "ready",
              sprint: "soon",
              summary:
                "Create a flexible model for event modules such as headshots, resume reviews, sponsors, greetings, galleries, and workshops.",
              acceptanceCriteria: [
                "Experiences belong to events.",
                "Experiences have type, title, location, time window, status, and display order.",
                "An experience can optionally connect to a queue.",
                "Experience can store short/long description, image/logo/media, and configurable feature flags."
              ],
              notes:
                "Trello uses 'expie' for the reusable experienceable unit. Product language can still use Experience while eCe may represent an event-specific instance. 2026-07-01 architecture reviews clarified that Experiences are the primary product unit, while queue is one reusable capability an Experience can compose. Experience Types should be reusable across events, organizations, and repeated placements within the same event; avoid SOTC-specific implementation when a reusable Experience Type is possible. Examples: Headshots may use queue, notifications, and status tracking; Food may use ordering, menu, notifications, and status tracking; Resume Reviews may use queue, staff assignment, and status tracking; Sponsors may use resources and passport. Open question: whether service-like experiences eventually justify a separate Service layer."
            },
            {
              id: "story-experience-types",
              title: "Define experience types",
              status: "ready",
              sprint: "soon",
              summary:
                "Clarify types such as queue, sponsor, vendor, session, resource, food, bar, gallery, and announcement.",
              acceptanceCriteria: [
                "Type names are documented.",
                "Sponsor and vendor are intentionally distinguished.",
                "Types drive guest UI defaults without hard-coding the SOTC event.",
                "Experience Types are reusable across multiple organizations, multiple events, and multiple placements within one event.",
                "Service-like types such as Headshots, Resume Reviews, and Food Ordering are examined without introducing a Service abstraction prematurely.",
                "Types can later provide configuration templates for headshot photographer, food truck, food/beverage vendor, performance, speaker, and similar patterns."
              ]
            },
            {
              id: "story-experience-configuration",
              title: "Configure experience features and content",
              status: "future",
              sprint: "future",
              summary:
                "Allow an experience/expie to enable feature modules such as menu, queue, merchandising, media, guest-facing content, or later POS integration.",
              acceptanceCriteria: [
                "Experience can enable/disable feature modules with configuration flags.",
                "Queue is treated as one reusable capability, not the definition of an Experience.",
                "Experience can publish guest-facing content such as descriptions, menus, prices, modifiers, allergens, preparation time, or limited-time offerings.",
                "Food/menu items can support searchable tags such as chicken, pesto, gluten free, or nuts.",
                "POS/API integration remains a future option, not a July dependency."
              ],
              notes:
                "Imported from Trello Expies are created and provisional queue content cards."
            },
            {
              id: "story-experience-hierarchy-grouping",
              title: "Explore experience hierarchy and grouping",
              status: "discovery",
              sprint: "future",
              summary:
                "Explore the likely reusable layer between Experience Type and Station: an organization-owned reusable definition that can be placed into one or more events/stations.",
              acceptanceCriteria: [
                "Relationship between organization-owned expies and event-specific instances is documented.",
                "Same experience can appear in multiple locations or times.",
                "Grouping can support future smart ordering or routing.",
                "Examples are tested conceptually: Food & Beverage > Lemonade Stand > West Patio Station; Professional Headshots > Corporate Headshot > Photographer A.",
                "The model is validated through Registration, Headshots, Resume Reviews, and Food discussions before implementation.",
                "The discovery avoids adding a Service layer until enough evidence exists."
              ],
              notes:
                "Imported from Trello expie hierarchy notes. July 8 Alpha 2/Product Discovery identified this as a likely missing reusable layer, but explicitly deferred implementation until more Experience Type discussions validate the shape."
            },
            {
              id: "story-experience-suspend",
              title: "Suspend or hide experiences",
              status: "future",
              sprint: "future",
              summary:
                "Allow admins to turn event modules on/off before or during an event.",
              acceptanceCriteria: [
                "Hidden experiences do not appear to guests.",
                "Suspended queues stop new joins but preserve existing tickets.",
                "Admin can restore an experience."
              ]
            }
          ]
        },
        {
          id: "theme-ece-lifecycle",
          title: "eCe Lifecycle",
          status: "discovery",
          stories: [
            {
              id: "story-ece-definition",
              title: "Define eCe meaning and lifecycle",
              status: "discovery",
              sprint: "future",
              summary:
                "Clarify what an eCe is, how it is created, how it turns on, and when it resets.",
              acceptanceCriteria: [
                "The term eCe is defined in product language.",
                "Creation, edit, suspend, activation, and reset behavior are documented.",
                "The relationship between eCe, experience, queue, and event is clear.",
                "eCe is modeled as an event-specific instance that combines an event, an expie/experience, date/time, location, and optional queue behavior.",
                "Inheritance and overrides from event and expie/experience are documented."
              ],
              notes:
                "Trello import says eCe combines event + expie at specific date/time/location, can inherit properties, can be reused in multiple locations/times, and each eCe may have its own host/admin console."
            },
            {
              id: "story-ece-cross-org-permissions",
              title: "Define cross-organization eCe attachment permissions",
              status: "future",
              sprint: "future",
              summary:
                "Allow an event to attach an experience owned by another organization only when permission rules allow it.",
              acceptanceCriteria: [
                "An event organization can request to attach another organization's experience.",
                "The owning organization can approve, deny, or preconfigure attachment rules.",
                "Inherited and overridden fields are clear to both organizations."
              ],
              notes:
                "Imported from Trello eCe creation card."
            },
            {
              id: "story-ece-activation-reset",
              title: "Define eCe activation, reset, and restricted controls",
              status: "future",
              sprint: "future",
              summary:
                "Document how an eCe turns on, whether it activates by calendar/location/admin action, and who may reset it.",
              acceptanceCriteria: [
                "Activation can be manual, scheduled, or later location-triggered.",
                "Activation controls guest visibility, map display, and joinability.",
                "Reset is limited to admin or special role and has extra confirmation friction.",
                "Active eCe edit/suspend restrictions are documented."
              ],
              notes:
                "Imported from Trello eCe lifecycle cards."
            },
            {
              id: "story-ece-queue-entry-limits",
              title: "Limit queue entry by eCe state",
              status: "future",
              sprint: "future",
              summary:
                "Prevent joining too early or after the system can no longer reasonably serve the guest.",
              acceptanceCriteria: [
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
      id: "epic-queues",
      title: "Digital Queues and Service Provider Flow",
      summary:
        "Support queues for headshots, resume reviews, and similar service experiences, including guest eligibility and host/provider operation.",
      status: "ready",
      themes: [
        {
          id: "theme-headshots",
          title: "Professional Headshots",
          status: "ready",
          stories: [
            {
              id: "story-headshot-queue",
              title: "Create headshot digital queue",
              status: "done",
              sprint: "now",
              summary:
                "Model the free student headshot line and paid/approved professional access.",
              acceptanceCriteria: [
                "Headshot experience has a queue.",
                "Students can join for free.",
                "Professionals can join only when marked as professional-with-photo or equivalent access.",
                "Headshot queue copy follows the same clear state model as the pilot queue: Waiting, Almost Ready, I'm Nearby, Your Turn, Completed.",
                "Copy is tested with at least one student/contact for comprehension."
              ],
              notes:
                "This extends the Bouquet Bar access pattern into guest tags/conditions. Alpha-test finding: students responded better to standby-style queue language than custom photo queue language; keep photo-specific wording only where it adds clarity. Messaging pass completed on 2026-06-26: Headshot Photographer runtime copy now uses Waiting, Almost Ready, I'm Nearby, Your Turn, and Completed language, with photo-specific wording only around the actual photographer step. SQL seed copy was updated to match."
            },
            {
              id: "story-headshot-tags",
              title: "Add guest tags for headshot eligibility",
              status: "ready",
              sprint: "soon",
              summary:
                "Use SOTC-specific guest/photo states such as student-photo-eligible, student-photo-used, professional-general, professional-photo-eligible, and professional-photo-used.",
              acceptanceCriteria: [
                "Admin can assign or update guest tags.",
                "Queue access can read guest tags.",
                "Recoverable photo benefits require email or mobile number before the benefit is granted.",
                "If staff selects Student or Professional + Photo and no recovery contact exists, the guest is placed into a Needs More Info state automatically rather than relying on staff judgment.",
                "Needs More Info returns the guest to the check-in screen with previous information retained, a clear explanation, and email-or-phone collection.",
                "Staff sees Waiting for recovery contact while contact information is missing and Ready to Check In after the guest resubmits; staff still completes check-in manually.",
                "Photo completion can update tag/state.",
                "A separate profession/networking tag placeholder is supported for later colored-nametag or networking use."
              ],
              notes:
                "2026-06-11 PO review: photo access is marked at registration/check-in, not imported. Professional-general is a distinct state from professional-photo-eligible. 2026-07-01 architecture review clarified that guest participation remains accountless by default, but recoverable assets such as complimentary or purchased professional headshots require recoverable contact information before the asset is granted. This is recoverability, not authentication."
            },
            {
              id: "story-photographer-console",
              title: "Photographer service console",
              status: "future",
              sprint: "future",
              summary:
                "Let the photographer or booth host signal readiness and check in the next guest.",
              acceptanceCriteria: [
                "Provider can mark ready for next guest.",
                "Provider can see checked-in/nearby queue guests.",
                "Provider can mark photo complete."
              ]
            }
          ]
        },
        {
          id: "theme-resume-reviews",
          title: "Resume Reviews",
          status: "ready",
          stories: [
            {
              id: "story-resume-review-queue",
              title: "Create resume review digital queue",
              status: "ready",
              sprint: "soon",
              summary:
                "Let students join a review queue and be routed to an available reviewer.",
              acceptanceCriteria: [
                "Resume review experience has a queue.",
                "Guest can see position/status.",
                "Host/reviewer can call the next guest."
              ]
            },
            {
              id: "story-resume-upload",
              title: "Explore resume upload/release flow",
              status: "discovery",
              sprint: "future",
              summary:
                "Consider whether guests can upload resumes and release them to the assigned reviewer.",
              acceptanceCriteria: [
                "Privacy and file handling questions are identified.",
                "Mobile upload feasibility is validated.",
                "MVP alternative is documented if upload is too much for July.",
                "Forwarding or releasing a resume to an assigned reviewer is considered separately from raw upload."
              ],
              notes:
                "Trello import includes possibly forwarding resume to reviewer before guest walks up."
            },
            {
              id: "story-reviewer-ready",
              title: "Reviewer ready workflow",
              status: "future",
              sprint: "future",
              summary:
                "Let a reviewer say they are ready, then route/call the next guest.",
              acceptanceCriteria: [
                "Reviewer can request next guest.",
                "Guest can be directed to a specific reviewer or station.",
                "Admin can see reviewer availability."
              ]
            }
          ]
        },
        {
          id: "theme-host-console",
          title: "Host Console",
          status: "future",
          stories: [
            {
              id: "story-host-console-redesign",
              title: "Redesign host console around service needs",
              status: "future",
              sprint: "future",
              summary:
                "Move beyond the provisional kiosk/host console into a real operational tool.",
              acceptanceCriteria: [
                "Host can advance, pause, and inspect a queue.",
                "Host can see check-in/standby state.",
                "Console language matches the experience type.",
                "Host can see operational context such as queue length, intake rate, now serving, guests lost, and open slots where relevant."
              ]
            },
            {
              id: "story-sotc-production-pilot",
              title: "Validate SOTC scan-code queue pilot in production",
              status: "done",
              sprint: "now",
              summary:
                "Run the first SOTC queue/adventure pilot live on qme-nine.vercel.app with guest check-in, queue stages, Auto Assist, station code completion, and completed event-card state.",
              acceptanceCriteria: [
                "Production guest link works for the SOTC test event.",
                "Guests can check in, join the Scan-Code Adventure queue, move through waiting, standby, your turn, and completed states.",
                "Admin can control manual/auto flow with one active released guest and three standby guests.",
                "Completed guests return to the event view with completed treatment.",
                "Canonical guest and admin links are documented.",
                "Alpha-test findings from the student group are captured and triaged."
              ],
              notes:
                "Validated in production on 2026-06-19. Alpha-tested on 2026-06-24 with 8 SOTC students, including Jalani Ball. Core event check-in, queue states, headshot/photo-credit flow, and admin controls worked well enough for guided testing. Jalani helped lead the test, gathered students, and is willing to help move the pilot toward ready. Follow-up findings are mostly polish: refresh blinking, button alignment, and clearer photo queue/standby messaging."
            },
            {
              id: "story-sotc-pilot-ops-controls",
              title: "Polish SOTC pilot operations controls",
              status: "current",
              sprint: "now",
              summary:
                "Make the admin queue controls clear enough to rehearse without a live student group: slug admin links, readable standby/released thresholds, practice reset, and explicit remaining cleanup gaps.",
              acceptanceCriteria: [
                "Admin slug links work for the SOTC test event and Scan-Code Adventure queue.",
                "Threshold controls use operator language: standby nearby and active released.",
                "Admin sees the combined guests-in-motion count.",
                "Admin can reset the queue ticket practice run with confirmation.",
                "Full event check-in and guest-mark cleanup remains tracked separately if not implemented."
              ],
              notes:
                "This keeps momentum while external testing is paused."
            },
            {
              id: "story-sotc-calm-refresh",
              title: "Calm realtime refresh behavior on SOTC pilot screens",
              status: "done",
              sprint: "now",
              summary:
                "Make guest and admin SOTC pilot screens update without visible blinking, blanking, or layout jumps during polling/realtime refresh.",
              acceptanceCriteria: [
                "Guest event page does not blink or temporarily blank during routine refresh.",
                "Guest queue ticket page keeps the current state visible while polling.",
                "Admin queue dashboard keeps guest rows and controls stable during refresh.",
                "If fetched data is unchanged, there is no visible UI reset.",
                "If fetched data changed, the relevant state updates without moving unrelated content.",
                "Loading indicators are subtle and do not displace primary content.",
                "Verified on mobile viewport for SOTC guest flow and admin queue flow."
              ],
              notes:
                "Alpha-test inbox finding: App refresh with screen blinking is distracting. Completed on 2026-06-26: guest event polling now preserves eligibility state until fresh data is ready, guest ticket polling avoids replacing identical ticket state, and admin pilot ticket polling/auto-flow avoids identical row replacement and interval resets. User confirmed calm refresh is working."
            },
            {
              id: "story-sotc-mobile-layout-polish",
              title: "Polish SOTC pilot mobile layout and button alignment",
              status: "done",
              sprint: "now",
              summary:
                "Use alpha-test screenshots and mobile testing to clean up visible layout issues on SOTC pilot guest/admin screens.",
              acceptanceCriteria: [
                "Primary and secondary buttons align consistently on guest event, queue ticket, and admin queue screens.",
                "Button labels do not wrap awkwardly or overflow on common mobile widths.",
                "Action rows keep stable height and spacing when state changes.",
                "Back, Join, I'm Nearby, Enter Code, Apply Flow, Reset Practice Run, and admin guest-row actions are checked.",
                "Internal ticket numbers are hidden from SOTC pilot guest screens while remaining available to admin/staff.",
                "Screenshots from the alpha-test issue are reviewed against the fix.",
                "Verified at mobile widths around 360px, 390px, and desktop/tablet."
              ],
              notes:
                "Alpha-test inbox findings: misaligned buttons, screenshot evidence that pilot ticket actions could appear outside the card boundary, and guest confusion over visible internal ticket numbers. Completed on 2026-06-26: guest event card action buttons now have stable minimum dimensions, guest ticket action buttons use balanced mobile touch targets, SOTC admin pilot controls/guest row actions use shared responsive classes, the pilot ticket uses the contained ticket-card structure with compact status/location/code panels, and SOTC pilot guest screens no longer show the internal ticket number. User confirmed the layout fix works."
            },
            {
              id: "story-sotc-not-here-recovery",
              title: "Explain Not Here recovery to guests",
              status: "done",
              sprint: "now",
              summary:
                "When staff marks a released SOTC pilot guest as Not here, keep the same ticket but return the guest to Waiting/back of line so Gathering max is preserved.",
              acceptanceCriteria: [
                "Admin confirms before marking a released guest Not here.",
                "A Not here guest returns to Waiting/back of line on the same ticket.",
                "Guest sees a modal explaining they were removed because they did not come when called after saying they were nearby.",
                "Guest sees an inline recovery banner while they are back in Waiting or Gathering.",
                "The guest must be invited to Gathering again before they can tap I'm Nearby and become eligible to be called.",
                "Normal first-time Waiting or Gathering does not show the Not here modal."
              ],
              notes:
                "Completed on 2026-06-26 and revised on 2026-07-01 after multi-guest testing showed that returning Not Here guests directly to Gathering could exceed Gathering max after a freed slot was filled. First pass intentionally uses client-side transition detection rather than adding a durable database marker. If the guest page is closed during the staff action, a future database field such as not_here_at may be needed."
            },
            {
              id: "story-sotc-jalani-readiness-review",
              title: "Prepare SOTC pilot for Jalani-led readiness review",
              status: "ready",
              sprint: "now",
              summary:
                "Use alpha-test feedback from Jalani Ball and the student group to get the SOTC pilot into a ready-for-review state.",
              acceptanceCriteria: [
                "Alpha-test findings are triaged into stories or story notes.",
                "Jalani can run through the guest flow with minimal prompting.",
                "Guest event check-in, Headshot queue, Scan-Code Adventure, and admin controls are tested end-to-end after polish fixes.",
                "A short test script exists for the next student review.",
                "Known remaining issues are either fixed or explicitly deferred.",
                "Jalani confirms the flow is understandable enough for the next SOTC stakeholder demo."
              ],
              notes:
                "Alpha-test inbox finding: Alpha test went well. Jalani Ball helped lead the test and can help move the pilot toward ready."
            },
            {
              id: "story-sotc-pre-alpha-event-guide",
              title: "Shape SOTC guest home as event guide for pre-alpha",
              status: "current",
              sprint: "now",
              summary:
                "Use reusable eCe metadata to make the SOTC guest home feel like an event companion for the next alpha, without creating SOTC-only UI or removing the Scan-Code demo station.",
              acceptanceCriteria: [
                "Guest home can group event activities into reusable sections from eCe metadata.",
                "Headshot Photographer remains the primary featured operational experience.",
                "Scan-Code Adventure remains available as an optional demo station, not required for the alpha path.",
                "Tonight's Schedule, Featured Experiences, Featured Speakers, Sponsors, Food & Drinks, and Resources can appear as lightweight information/event-guide activities.",
                "The implementation does not hard-code SOTC-specific sections into the React screen.",
                "Tomorrow's alpha still keeps registration simple: Student, Professional, and Professional + Photo.",
                "Deferred architecture items remain deferred: generalized registration config, generalized credit engine, service abstraction, speaker/sponsor engines, and event guidance engine."
              ],
              notes:
                "Added from the Pre-Alpha Build direction for the July 2 SOTC alpha, then course-corrected after reviewing the 2025 SOTC brochure: qME should feel like a digital companion to a real conference, not a list of app features. First implementation uses eCe metadata fields such as home_section, home_section_title, home_section_order, home_badge, home_action_label, home_items_layout, home_items_limit, and home_items. Seed data lives in supabase-sotc-alpha-event-guide.sql. User clarified that Scan-Code Adventure should stay available because it is useful as an optional demo, while July guest-home emphasis stays on Headshots and the event guide. July 2 pre-test build added brochure-style schedule, featured speakers, sponsor logos, food/drinks, resources, generic media-row rendering, oldest-first live check-in ordering, and reset hardening so stale guest queue tabs with old join intent cannot recreate tickets after event test data is reset. July 16 content refinement grouped schedule items by time with item/location rows, kept Resume Reviews and Networking lower on the guest home, made Sticker Guide a native qME modal, and kept Mixer Resources as a direct Canva link after Canva blocked embedded display."
            },
            {
              id: "story-admin-console-needs",
              title: "Document admin console needs",
              status: "discovery",
              sprint: "future",
              summary:
                "Identify what admins need before building broader event operations screens.",
              acceptanceCriteria: [
                "Needs are grouped by qME operator, organization admin, event host, and service provider.",
                "Screens are prioritized against the SOTC event.",
                "Temporary demo-only controls are marked.",
                "Operational exception actions such as pause queue, announce delay, close intake, merge/split, redirect, and transfer are captured."
              ]
            },
            {
              id: "story-admin-event-activity-status-overview",
              title: "Add admin event activity status overview",
              status: "done",
              sprint: "now",
              summary:
                "Show read-only operating counts on the admin event screen before redesigning the queue screens into tabs.",
              acceptanceCriteria: [
                "The admin event screen shows event check-in counts for people waiting for staff and people checked in.",
                "Each queue-based event feature shows counts for Waiting, Gathering, Nearby, Your Turn, and Done.",
                "Counts use operational labels that match the guest status language.",
                "Counts update through a debounced live refresh after guest or staff actions, with a lightweight two-second fallback refresh while the admin page is open.",
                "The overview remains read-only; detailed actions still happen in Event Check-Ins or Manage Queue.",
                "The implementation supports Scan-Code Adventure and Headshot Photographer before the broader tab redesign."
              ],
              notes:
                "Added during Sprint 2 admin UX discussion. Built before the queue tab refactor so the main event screen gives hosts a quick view of people waiting for check-in, people in line, guests gathering nearby, guests ready/nearby, active guests, and completed guests. First implementation uses debounced Supabase realtime subscriptions plus a lightweight fallback refresh for pilot reliability, and was later tightened to use the safe queue count RPC for more consistent guest/admin counts. Future production-scale architecture should move these counts to operational metrics tables."
            },
            {
              id: "story-operational-metrics-tables",
              title: "Create operational metrics tables for event and queue counts",
              status: "future",
              sprint: "future",
              summary:
                "Replace repeated admin count scans with precomputed event and queue metric rows that can power live admin overview, tabs, and future dashboards.",
              acceptanceCriteria: [
                "Event-level metrics include waiting-for-staff check-ins, completed check-ins, and last updated time.",
                "Queue-level metrics include Waiting, Gathering, Nearby, Your Turn, Done, and last updated time.",
                "Metrics update reliably when guests check in, join queues, mark nearby, are released, complete, leave, are marked not here, or event test data is reset.",
                "Admin overview subscribes to lightweight metrics rows instead of high-volume ticket/check-in tables.",
                "The implementation documents whether metrics are maintained by triggers, RPC refresh, or a server process.",
                "A fallback/rebuild function exists to recalculate metrics from source tables if counts drift."
              ],
              notes:
                "Captured during Sprint 2 discussion after adding live admin status overview. This is the better long-term architecture for larger events and multiple active admin/staff screens, but the pilot can first validate the overview with debounced realtime refresh."
            },
            {
              id: "story-admin-queue-tabs",
              title: "Organize admin operational screens into focused tabs",
              status: "done",
              sprint: "now",
              summary:
                "Refactor event, queue, and check-in admin screens so staff can work from focused tabs instead of crowded operational pages.",
              acceptanceCriteria: [
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
              notes:
                "Captured from Sprint 2 admin UX discussion and inspired by the cleaner tabbed admin pattern in the user's Playing the Game app. Completed first pass across main event admin, queue detail admin, and event check-in admin. Main event admin now separates Operations, Staff, and Setup; queue detail admin separates Live Line, History, and Settings; event check-in admin separates Live Check-In, History, and Settings. July 17 update: destructive Reset Test Data is no longer exposed in the top event action row and now lives behind Setup; check-in Settings is hidden from non-event-admin operators."
            },
            {
              id: "story-role-aware-admin-landing",
              title: "Route staff to role-aware admin workspaces",
              status: "done",
              sprint: "now",
              summary:
                "Send admins and staff to the most relevant admin workspace based on their organization, event, and feature assignments.",
              acceptanceCriteria: [
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
              notes:
                "Added during Sprint 2 admin UX discussion after testing Jalani/event-staff access. The role model can already represent event-level and feature-scoped assignments, but the admin UI still behaved mostly like an event-level overview. July 8 Alpha 2 review shifted this from permission checks to workspace visibility. July 16 update: target role/workspace/control boundaries are documented in docs/station-role-visibility-matrix-v1.md, and the useful first implementation slice is complete: /admin now routes broad admins to /admin/events, single-assignment event/station/check-in staff directly to the assigned workspace, and multi-assignment staff to a simple workspace chooser. July 17 update: event detail Staff/Setup tabs, event check-in Settings, and queue/station Settings are gated to event-admin-and-up so lower-role operators stay in live operations/history surfaces; the Staff tab assignment form now creates only limited Staff access instead of exposing event-admin/station-provider role choices. Staff onboarding now supports creating a new limited staff login from the event Staff tab with generated temporary password display, then requiring the staff person to enter first and/or last name plus optional phone on first login; existing qME accounts are reused for additional event staff assignments; duplicate event assignment attempts warn the admin; the staff list can be searched by name/email; and a pilot Reset Password action keeps a generated temporary password visible until the staff person signs in again without wiping their existing profile. This remains a pilot credential flow and should be replaced with proper invite/reset-password handling later. July 17 decision: because SOTC has not requested special station/staff privilege distinctions and event admins are easy to create/manage, deeper role-specific tab hiding/read-locking is documented but intentionally deferred until a real operational need appears. July 17 SOTC pilot policy: assigned check-in staff may grant Headshot photo credit because Tanya previously said this was acceptable for the operating model; revisit after SOTC before making this a platform default."
            },
            {
              id: "story-station-operational-control-visibility",
              title: "Make station operational controls visible and understandable",
              status: "current",
              sprint: "now",
              summary:
                "Expose station-level operating settings in a way staff can understand, while preserving edit permissions for the appropriate authority level.",
              acceptanceCriteria: [
                "Station screens show Gathering Target, Gathering Max, Gathering timeout, On My Way timeout, Not Here cooldown, and Auto Flow where applicable.",
                "Visibility is separated from editability: staff can understand queue behavior even when they cannot change settings.",
                "Event Admin or higher can edit event-wide/live-control settings.",
                "Station Supervisor editability is decided per station/control rather than assumed globally.",
                "Read-only controls explain why they are locked for the current role.",
                "Settings use operational labels that match the guest queue language."
              ],
              notes:
                "Added from July 8 Alpha 2/Product Discovery review. Alpha testing showed that hidden queue settings made correct behavior look broken. Station staff need to understand why the line behaves as it does, even when only Event Admin or higher can change the controls."
            },
            {
              id: "story-queue-automation-observability",
              title: "Explain queue automation blockers to operators",
              status: "current",
              sprint: "now",
              summary:
                "When automation does not move a guest, show the reason so staff know whether the queue is working, cooling down, paused, full, or blocked by eligibility.",
              acceptanceCriteria: [
                "Queue admin surfaces show when a guest is Cooling Down and, where practical, the remaining time.",
                "Queue admin surfaces explain when Gathering is full.",
                "Queue admin surfaces explain when Auto Flow is paused or manual.",
                "Queue admin surfaces explain when a guest is waiting for a required credit or eligibility condition.",
                "Apply Flow feedback reports when no movement happened and why.",
                "Not Here recovery follows the policy: cooldown, return to active Waiting, then normal progression by original queue order with no extra punishment."
              ],
              notes:
                "Added from July 8 Alpha 2/Product Discovery review. Alpha testing showed the queue engine could be behaving correctly while operators thought it was stuck because the cooldown timer and other blockers were invisible. qME should explain automation decisions, not make staff infer them."
            },
            {
              id: "story-stale-queue-blocker-recovery",
              title: "Handle stale queue guests who block active flow",
              status: "done",
              sprint: "now",
              summary:
                "Prevent Gathering guests who have not marked themselves Nearby from indefinitely blocking newer guests and slowing down a live queue.",
              acceptanceCriteria: [
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
              notes:
                "Captured from Sprint 2 smoke testing after guest-session foundation: guest #5 could be waiting behind stale guests who had not tapped I'm Nearby, and another guest in front could block the queue. Updated after product discussion: the queue must keep moving toward Nearby candidates without hiding the overflow rule in code. Current implementation exposes Gathering target, Gathering max, and stale-after seconds on the queue controls. Auto-flow can invite newer Waiting guests into Gathering up to the max when earlier Gathering guests go stale. Staff can manually return stale non-nearby Gathering guests to Waiting; returned guests keep their ticket but move behind guests already waiting. Not Here now returns released guests to Waiting with a cooldown, and a database trigger guardrail prevents older clients from moving released guests directly back into Gathering. Validated on 2026-07-01 with a 7-guest Scan-Code Adventure test and a Headshot Photographer test: admin removals from Gathering and Your Turn moved guests to Waiting for the 15-second cooldown, Gathering max held, and guests later progressed again when space opened. Added guest-facing Return to Waiting messaging so a guest moved back by staff understands that they should wait until Gathering appears again, move to the station, and tap I'm Nearby when ready. July 2 pre-test reset hardening fixed a stale-tab edge case where an old guest queue URL with join intent could recreate a ticket after Reset Test Data; reset now clears that URL intent on queue landing and ticket pages. User confirmed the lost Headshot Gathering ticket disappeared and reset testing passed. Future production readiness should move auto-flow execution toward a durable server-side scheduler, trigger, or metrics-driven worker rather than relying on open browser screens. Future work should add richer staff controls to skip/remove/remind stale Gathering guests, automate return-to-waiting when space is needed, make real-event timing configurable, and add buzz/SMS/push/in-app notification when guests move from Waiting to Gathering."
            },
            {
              id: "story-queue-rule-configuration",
              title: "Configure queue rules and priority policies",
              status: "future",
              sprint: "future",
              summary:
                "Allow admins to configure queue capacity, pacing, intake, remote wait, commitment windows, no-show handling, and priority structures.",
              acceptanceCriteria: [
                "Queue rules can include capacity thresholds, max digital positions, intake rates, and average service time.",
                "Rules can include commitment prompts, expiration, grace periods, skip/reinsert behavior, and no-show policies.",
                "Rules can distinguish Gathering timeout, optional On My Way timeout, I'm Nearby grace, and Not Here cooldown.",
                "Priority structures can support premium tiers, staff passes, accessibility accommodations, or weighted/batched service.",
                "This remains future configuration until a concrete event requires it."
              ],
              notes:
                "Imported from Trello/provisional queue rules. July 8 Alpha 2 review clarified that Not Here should cool down, return to active Waiting, and resume normal progression without additional punishment; cooldown itself is the penalty."
            },
            {
              id: "story-notification-policies",
              title: "Configure notification policies and templates",
              status: "future",
              sprint: "future",
              summary:
                "Define guest and staff notification rules for now-serving, up-next, commitment prompts, approach reminders, and exceptions.",
              acceptanceCriteria: [
                "Notification templates can support merge fields such as queue name, estimated time, map pin, and instructions.",
                "Policies can include now serving, up next, commitment threshold, head toward venue, proceed-to-service, slowdowns, pauses, closures, or rerouting.",
                "Delivery channels such as in-app, SMS, email, and push are evaluated separately."
              ],
              notes:
                "Imported from Trello/provisional notification policy notes."
            },
            {
              id: "story-sotc-notification-july-fallback",
              title: "Define July notification fallback for SOTC queues",
              status: "current",
              sprint: "next",
              summary:
                "Determine and implement the reliable July notification behavior for Headshots and other SOTC queues before committing to SMS or web push.",
              acceptanceCriteria: [
                "Guest receives clear in-app modal/banner messaging for Waiting to Gathering, Your Turn, Not Here, and Return to Waiting/Cooldown events while the guest page is open.",
                "Guest-facing notifications include an acknowledgement action and enough timestamp/history context to understand what changed.",
                "Optional sound is evaluated only as an in-app enhancement after guest interaction, not as the primary notification channel.",
                "The fallback explicitly documents that closed pages and backgrounded mobile browsers are not reliable without SMS or push.",
                "Staff guidance and event signage explain the July fallback behavior for Headshots.",
                "SMS is not promised for July until provider setup, consent, compliance, delivery logging, and duplicate prevention are confirmed."
              ],
              notes:
                "Added from July 14 notification feasibility review. Tanya asked whether qME can buzz guests when queue status changes. Current reliable July path is in-app notification while the page is open, with SMS treated as a compliance-gated enhancement and web push treated as poor fit for a one-time iPhone-heavy event."
            },
            {
              id: "story-notification-event-architecture",
              title: "Create notification-event architecture",
              status: "ready",
              sprint: "future",
              summary:
                "Separate domain status changes from delivery channels by recording notification events before delivering in-app, SMS, push, or future channels.",
              acceptanceCriteria: [
                "Domain actions such as queue movement, Not Here, cooldown completion, order-ready, or reminders can create durable notification events.",
                "Notification events include event/check-in/ticket context, notification type, transition, idempotency key, created timestamp, and acknowledgement/read fields.",
                "Channel delivery records track in-app, SMS, push, or future delivery attempts separately.",
                "Duplicate prevention is based on idempotency keys rather than client-side timing.",
                "Untrusted browsers cannot directly trigger SMS delivery.",
                "The architecture supports audit review and future delivery channels without coupling queue logic directly to one provider."
              ],
              notes:
                "Preferred direction: domain status change -> create notification event -> deliver in-app -> optionally deliver SMS -> later support web push or other channels."
            },
            {
              id: "story-sms-notification-feasibility",
              title: "Evaluate transactional SMS for event notifications",
              status: "discovery",
              sprint: "future",
              summary:
                "Investigate whether SMS can responsibly support queue and reminder notifications after account, compliance, consent, and delivery constraints are understood.",
              acceptanceCriteria: [
                "Provider setup requirements are documented, including sender registration and approval timing.",
                "Opt-in, STOP/HELP, consent copy, and message-purpose requirements are documented before any live SMS commitment.",
                "Existing phone capture is reviewed and updated if explicit SMS consent is required.",
                "Server-side delivery architecture is documented so guests cannot trigger arbitrary SMS from the browser.",
                "Delivery logging, duplicate prevention, and failure handling are designed before SMS is used at a live event.",
                "A go/no-go decision is made before SMS becomes part of a guest promise."
              ],
              notes:
                "Twilio or similar SMS may be useful, but July 22 timing is risky unless registration/verification and compliance are already complete. Treat SMS as a pilot add-on, not the core notification fallback."
            },
            {
              id: "story-headshot-low-staff-operating-model",
              title: "Explore low-staff Headshot operating model",
              status: "current",
              sprint: "next",
              summary:
                "Review safe Headshot workflows where qME can advance the queue and the photographer may not need to operate qME directly.",
              acceptanceCriteria: [
                "At least two operating models are documented for Tanya/Eric discussion.",
                "Models distinguish photographer-free, guest-confirmed, timed, and supervisor-assisted completion options.",
                "Risks are documented for false guest confirmation, missed guests, photo-credit misuse, and inaccurate completion.",
                "Required state-model changes are identified before adding states such as active service or starting headshot.",
                "The July recommendation preserves a simple fallback that staff can execute under pressure."
              ],
              notes:
                "Final pre-meeting model supports both operating paths. In the low-staff path, qME moves the guest to Your Turn, the photographer calls their name, and the guest taps I've Been Called to record a durable service-start marker and complete the ticket. In the admin-operated path, staff calls the name from the queue list and clicks Mark Served, completing the guest directly. Not Here remains the exception path."
            },
            {
              id: "story-headshot-service-start-acknowledgement",
              title: "Prototype Headshot guest-called completion",
              status: "done",
              sprint: "next",
              summary:
                "Add a Headshot-only guest action after Your Turn so the guest can confirm they were called by the photographer; for the low-staff pilot this completes the Headshot queue ticket and frees the next guest.",
              acceptanceCriteria: [
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
              notes:
                "Built and tested for Tanya/Eric discussion. The implementation records a service-start mark/timestamp for the guest path and then uses completed as the low-staff terminal state, rather than adding an active_service ticket stage. Admin Mark Served creates the normal completion timestamp/mark without pretending the guest tapped I've Been Called."
            }
          ]
        }
      ]
    },
    {
      id: "epic-sotc-program",
      title: "SOTC Rock Hall Program",
      summary:
        "Translate the 2025/2026 mixer materials into guest-facing cards, queues, signups, prompts, and resources.",
      status: "current",
      themes: [
        {
          id: "theme-registration-passport",
          title: "Registration and Passport",
          status: "ready",
          stories: [
            {
              id: "story-registration",
              title: "Registration experience",
              status: "ready",
              sprint: "soon",
              summary:
                "Represent the 5:30-7:30 level 1 registration area and connect QR/name entry to an admin check-in console.",
              acceptanceCriteria: [
                "Registration appears as an event experience.",
                "Check-in can kick off the passport activity.",
                "Guest-facing copy explains what to do next.",
                "Registration admin view can show guest names as they enter/check in.",
                "Registration admin can mark the guest with the right tag/status, including photo access.",
                "SOTC staff can continue using their own external list/system for official attendance tracking."
              ],
              notes:
                "2026-06-11 PO review: do not import attendees for the first slice. Simulate a guest walking up, scanning QR, and entering their name. Staff see the guest in qME, mark the right tag, find the name tag/materials, and call the guest name."
            },
            {
              id: "story-sotc-qr-entry",
              title: "SOTC QR entry and guest lookup",
              status: "ready",
              sprint: "soon",
              summary:
                "Let guests scan a QR code at entry and enter their name so registration staff can handle check-in and tags from an admin console.",
              acceptanceCriteria: [
                "Guest can scan QR to enter the SOTC event experience.",
                "Guest can enter their name without relying on an imported attendee list.",
                "Guest can provide missing phone or email details.",
                "Guests who do not want digital entry can still go to the desk."
              ],
              notes:
                "2026-06-11 PO review: no attendee import for first slice. Signage and pre-event emails should explain the QR flow."
            },
            {
              id: "story-attendee-import",
              title: "Import or sync SOTC attendee list",
              status: "deferred",
              sprint: "future",
              summary:
                "Bring attendee records from Evite/Eventbrite or another registration source into qME for event check-in and personalization.",
              acceptanceCriteria: [
                "Admin can import an attendee list for the event.",
                "Imported records can be matched to guests during QR/check-in.",
                "Future API sync with Evite/Eventbrite is noted separately from manual import.",
                "Realtime updates are considered but not required for the first SOTC slice."
              ],
              notes:
                "Deferred by 2026-06-11 PO review. For the first SOTC slice, qME should not import attendees; staff can keep marking attendance in Evite/external system."
            },
            {
              id: "story-passport-activity",
              title: "Passport activity",
              status: "ready",
              sprint: "soon",
              summary:
                "Model the passport as a simple activity that can encourage sponsor engagement or QR check-ins.",
              acceptanceCriteria: [
                "Passport activity has a clear completion definition.",
                "Sponsor/registration check-ins can count toward progress.",
                "Reward or completion question is captured."
              ]
            }
          ]
        },
        {
          id: "theme-sponsors",
          title: "Sponsors",
          status: "ready",
          stories: [
            {
              id: "story-sponsor-cards",
              title: "Sponsor cards and placement",
              status: "ready",
              sprint: "soon",
              summary:
                "Show sponsors as event experiences with meaningful placement and optional passport activity.",
              acceptanceCriteria: [
                "Sponsor card includes name, logo, location, and description.",
                "Sponsor placement can be highlighted.",
                "Sponsor is distinct from vendor in the model."
              ]
            },
            {
              id: "story-sponsor-goals",
              title: "Capture sponsor goals",
              status: "discovery",
              sprint: "future",
              summary:
                "Clarify what sponsors want from the event so qME can support measurable engagement.",
              acceptanceCriteria: [
                "Sponsor desired outcomes are documented.",
                "Engagement actions are identified.",
                "Reporting needs are parked or promoted to stories."
              ]
            }
          ]
        },
        {
          id: "theme-resources",
          title: "Mixer Resources and Digital Brochure",
          status: "ready",
          stories: [
            {
              id: "story-resource-cards",
              title: "Create mixer resource cards",
              status: "ready",
              sprint: "soon",
              summary:
                "Bring the QR code/mixer resources page into qME as structured guest-facing cards.",
              acceptanceCriteria: [
                "Resources can be grouped by category.",
                "Each resource has title, link, description, and optional sponsor/source.",
                "Guest can access resources from the event page."
              ],
              references: [
                "https://sites.google.com/summeronthecuyahoga.com/mixerresourcespage?usp=sharing"
              ]
            },
            {
              id: "story-digital-brochure",
              title: "Digital brochure view",
              status: "future",
              sprint: "future",
              summary:
                "Create a richer event program that can turn modules on before, during, or after the event.",
              acceptanceCriteria: [
                "Event schedule and resources are visible.",
                "Certain interactive items can open before the event.",
                "Guest sees relevant cards without needing the old brochure."
              ]
            }
          ]
        },
        {
          id: "theme-networking-food-bar",
          title: "Networking, Food, and Bar",
          status: "discovery",
          stories: [
            {
              id: "story-networking-prompts",
              title: "Simple networking prompts",
              status: "discovery",
              sprint: "future",
              summary:
                "Start with lightweight prompts/questions before deeper matching.",
              acceptanceCriteria: [
                "Existing SOTC networking ideas are captured.",
                "MVP prompts can be shown without personal matching.",
                "Sponsor opportunity is noted separately."
              ]
            },
            {
              id: "story-food-filters",
              title: "Food tags and filters",
              status: "future",
              sprint: "future",
              summary:
                "List hors d'oeuvres and allow filtering by vegan, vegetarian, gluten free, allergens, or ingredients.",
              acceptanceCriteria: [
                "Food items have dietary tags.",
                "Guest can filter common needs.",
                "Unknown/typed needs can be captured as learning."
              ]
            },
            {
              id: "story-bar-menu",
              title: "Cocktail and mocktail menu",
              status: "future",
              sprint: "future",
              summary:
                "Show special cocktails/mocktails as a simple information card.",
              acceptanceCriteria: [
                "Bar card can list drinks.",
                "Mocktails and alcoholic drinks can be distinguished.",
                "No queue behavior is assumed unless needed later."
              ]
            }
          ]
        },
        {
          id: "theme-sessions-galleries",
          title: "Greetings, Workshops, and Galleries",
          status: "discovery",
          stories: [
            {
              id: "story-host-greetings",
              title: "Host and sponsor greetings notification",
              status: "discovery",
              sprint: "future",
              summary:
                "Notify guests to gather for host/sponsor greetings from 6:15-6:45 on level 0.",
              acceptanceCriteria: [
                "Greeting appears in the event schedule.",
                "Notification behavior is defined.",
                "QR/passport check-in alternative is considered if no beacons exist."
              ]
            },
            {
              id: "story-workshop-signups",
              title: "Pop-up mini workshop signups",
              status: "future",
              sprint: "future",
              summary:
                "Let guests sign up for workshop blocks and coordinate with queue timing.",
              acceptanceCriteria: [
                "Workshop sessions have time, location, speaker, organization, title, and description.",
                "Guest can sign up before or during the event.",
                "Queue status and workshop attendance do not fight each other."
              ]
            },
            {
              id: "story-gallery-map",
              title: "Gallery and landmark map cards",
              status: "future",
              sprint: "future",
              summary:
                "Show all galleries open for viewing, landmarks, levels, and suggested things to see.",
              acceptanceCriteria: [
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
      id: "epic-guest-intelligence",
      title: "Guest Conditions, Intentions, and Timing",
      summary:
        "Use guest identity, tags, intent, access rules, and optional location signals to drive what actions qME suggests.",
      status: "future",
      themes: [
        {
          id: "theme-guest-conditions",
          title: "Guest Conditions and Access",
          status: "ready",
          stories: [
            {
              id: "story-guest-condition-engine",
              title: "Generalize guest access conditions",
              status: "future",
              sprint: "future",
              summary:
                "Turn Bouquet Bar-style access rules into a reusable eligibility model.",
              acceptanceCriteria: [
                "Queue access can depend on guest tags, check-in state, purchase state, or completion state.",
                "Blocked guests receive context-specific messages.",
                "Rules are configurable per experience."
              ]
            },
            {
              id: "story-guest-intentions",
              title: "Guest announces intentions",
              status: "future",
              sprint: "future",
              summary:
                "Let guests indicate what they want to do so qME can coordinate queues, signups, and recommendations.",
              acceptanceCriteria: [
                "Guest can express interest in experiences.",
                "Intent can influence suggested actions.",
                "Intent history does not overcomplicate the July MVP."
              ],
              notes:
                "User note: 'Guest keeps announcing intentions (I want that).'"
            }
          ]
        },
        {
          id: "theme-location-matching",
          title: "Location, Beacons, and Matching",
          status: "deferred",
          stories: [
            {
              id: "story-location-beacons",
              title: "Explore location/beacon signals",
              status: "deferred",
              sprint: "future",
              summary:
                "Use location awareness to know whether a guest is near a queue, gathering, sponsor, or session.",
              acceptanceCriteria: [
                "Beacon feasibility is researched.",
                "No July dependency unless hardware and venue support are confirmed.",
                "QR fallback is documented."
              ]
            },
            {
              id: "story-networking-matching",
              title: "Matching and forced networking",
              status: "deferred",
              sprint: "future",
              summary:
                "Use surveys/tags/interests to create networking opportunities, possibly sponsor-backed.",
              acceptanceCriteria: [
                "Fun survey/tag concepts are captured.",
                "Sponsor need is identified.",
                "Privacy and consent questions are documented before build."
              ]
            },
            {
              id: "story-survey-icons",
              title: "Interest survey icons",
              status: "future",
              sprint: "future",
              summary:
                "Use simple icon-based survey prompts to capture interests or group identity.",
              acceptanceCriteria: [
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
      id: "epic-branding-itinerary",
      title: "Branding and Personal Event Itinerary",
      summary:
        "Allow organizations and events to feel branded while guests get a personal agenda tied to queues and activities.",
      status: "future",
      themes: [
        {
          id: "theme-branding",
          title: "Organization and Event Branding",
          status: "future",
          stories: [
            {
              id: "story-branding-settings",
              title: "Branding settings",
              status: "future",
              sprint: "future",
              summary:
                "Offer organization logo, event logo, fonts, and color settings without turning qME into a design tool.",
              acceptanceCriteria: [
                "Organization can store logo and basic color settings.",
                "Event can override limited branding fields.",
                "Branding has safe defaults."
              ]
            },
            {
              id: "story-managed-image-storage",
              title: "Move event images to managed storage",
              status: "ready",
              sprint: "soon",
              summary:
                "Move organization, event, experience, sponsor, and resource images out of hard-coded public assets and into managed storage with database references.",
              acceptanceCriteria: [
                "Inventory current static images used as event/demo content.",
                "Define which image types belong to organizations, events, experiences, sponsors, resources, and galleries.",
                "Choose a storage convention, likely Supabase Storage paths plus database URL/path fields.",
                "Admin UI can eventually upload or select images for event content.",
                "Static assets remain available only for app defaults and fallback images.",
                "Peony demo keeps working during migration.",
                "SOTC event can use managed/uploaded images instead of code-folder images."
              ],
              notes:
                "This should be considered while building multi-org/event ownership because image ownership follows organization/event/experience ownership. It may also reduce reliance on generated static images in the local Vite build pipeline."
            }
          ]
        },
        {
          id: "theme-itinerary",
          title: "Personal Event Itinerary",
          status: "future",
          stories: [
            {
              id: "story-personal-agenda",
              title: "Personal event agenda",
              status: "future",
              sprint: "future",
              summary:
                "Show each guest a personal view of joined queues, signed-up sessions, saved resources, and recommended next actions.",
              acceptanceCriteria: [
                "Guest can see active queue tickets.",
                "Guest can see selected/saved sessions.",
                "Guest can distinguish current, upcoming, and completed items."
              ]
            }
          ]
        }
      ]
    }
  ],
  productReviews: [
    {
      id: "review-security-review-closure-2026-07-20",
      date: "2026-07-20",
      trigger:
        "Ahmed reviewed the remediation report and confirmed qME is good for the July 2026 SOTC pilot, with remaining work deferrable",
      summary:
        "The independent security review is complete for the July 2026 SOTC pilot. Emergency remediation, production verification, regression testing, and smoke testing are complete, and the independent reviewer confirmed that remaining work can move back into normal post-SOTC security maturity rather than emergency remediation.",
      observations: [
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
      decisions: [
        "Emergency security remediation is closed.",
        "Resume normal product development.",
        "Keep Security Hardening Sprint 2 on the roadmap after SOTC.",
        "Continue treating security as an ongoing engineering practice rather than a one-time project.",
        "Do not promote remaining maturity items back into emergency work unless a new High/Critical issue is identified."
      ],
      risks: [
        "Provider-level rate limiting remains post-SOTC maturity work.",
        "Invite/password-reset workflow remains post-SOTC maturity work.",
        "Additional audited administrative RPCs remain appropriate where direct setup writes need tighter operational evidence.",
        "Browser-storage and mobile security improvements remain post-SOTC maturity work.",
        "Group-ordering remains blocked until a secure redesign exists.",
        "Additional security monitoring and auditing remain normal hardening work."
      ],
      roadmapChanges: [
        "Moved the project back from emergency security remediation into normal Operational Readiness.",
        "Marked the external database/security review story complete.",
        "Kept remaining security work in backlog as maturity hardening, not emergency remediation.",
        "Preserved the security engineering workflow as a repeatable process: independent review, verification, risk classification, bounded remediation, regression testing, production validation, and documentation."
      ],
      nextFocus: [
        "Focus development on SOTC operational readiness and product capabilities.",
        "Continue feature work only through the established authorization and verification patterns.",
        "Reopen emergency remediation only if a new High/Critical issue is identified."
      ]
    },
    {
      id: "review-security-ahmed-emergency-remediation-2026-07-16",
      date: "2026-07-16",
      trigger: "Ahmed completed a database/security review and ChatGPT converted the feedback into an emergency verification/remediation plan",
      summary:
        "The next operating-readiness focus is security evidence, not new product expansion. Recent hardening substantially improved qME, but high-risk exposure may remain in older pilot SQL, legacy permissive policies, weak Flexlink intake auth, display-name credit binding, and privileged bootstrap functions. The work must verify live Supabase state, close confirmed emergency paths, and produce evidence for Ahmed to review.",
      observations: [
        "The hardening pass substantially improved the platform, but older pilot paths can still become production vulnerabilities if not explicitly retired.",
        "Remaining high-risk issues are concentrated in legacy/pilot policies, old auth shortcuts, and weak identity binding.",
        "Dynamic admin assignment is intentional and required for the product; the fix is stronger authorization and audit boundaries, not hard-coded administrators.",
        "UI role visibility is not authorization.",
        "Guest names must never serve as authorization identifiers.",
        "Notification, ordering, and future registration work must build on verified guest identity and narrow server enforcement.",
        "Production security status cannot be inferred from repo files alone; live grants, policies, function grants, and deployed secrets must be verified."
      ],
      decisions: [
        "Pause nonessential platform expansion until confirmed emergency findings are fixed or classified.",
        "Preserve SOTC event-guide/content work where it does not touch vulnerable write paths.",
        "Keep dynamic role assignment, but verify all privileged role mutation functions and EXECUTE grants.",
        "Fix confirmed anonymous data exposure and write paths first.",
        "Require verified guest/check-in identity for credits and guest-owned actions.",
        "Remove committed/fake-secret bearer mechanisms from Flexlink intake.",
        "Require evidence and regression tests or SQL verification for every security closure.",
        "Re-engage Ahmed after the bounded remediation pass."
      ],
      risks: [
        "Legacy SQL may reintroduce vulnerabilities if rerun.",
        "Deployed Supabase schema may differ from repository assumptions.",
        "Existing data may have been altered or enumerated before policies were tightened.",
        "Broad rewrites immediately before SOTC could create operational regressions.",
        "Overreliance on RLS helpers without live tests can create false confidence.",
        "Moving every write behind service-role APIs without careful design could create a large privileged backend attack surface."
      ],
      roadmapChanges: [
        "Added emergency security remediation as the first current Operational Readiness story.",
        "Created verification/remediation packet expectations for Ahmed follow-up.",
        "Kept feature work paused unless explicitly approved while emergency findings are addressed."
      ],
      nextFocus: [
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
      id: "review-tanya-eric-sotc-operating-model-2026-07-15",
      date: "2026-07-15",
      trigger: "Tanya/Eric/SOTC intern meeting clarified the July 22 operating model and simplified the SOTC guest home",
      summary:
        "The July operating model is clearer and narrower: Headshots remain the primary operational experience using a hybrid guest-confirmed/Supervisor-assisted model, Eventbrite self-check-in is the preferred registration direction but must wait for the actual export, walk-up paid professional headshots stay outside qME for July, and the guest home should feel like a digital event companion led by schedule, Headshots, resources, speakers, sponsors, and food/drinks.",
      observations: [
        "Photographers should remain focused on photography rather than operating qME.",
        "Evan will serve as Station Supervisor near the photographer and use the active queue for exceptions such as Not Here or manual Mark Served.",
        "Eventbrite attendee lookup is now the preferred registration direction, but the export must be reviewed before designing lookup, duplicate handling, or walk-in recovery.",
        "Registration staff primarily need a live list of guests who have self checked in and now need name tags/materials.",
        "Walk-up professional headshots for guests without a prepaid photo remain outside qME for July and use the photographer's Venmo/payment flow.",
        "The SOTC guest home should prioritize Full Event Schedule, Professional Headshots, Event Resources, Featured Speakers, Sponsors, and Food & Drinks, with Resume Reviews and Networking visible lower on the page.",
        "The Mixer Resources Canva page cannot be embedded reliably in qME because Canva refused iframe display during testing.",
        "External content should remain external unless recreating it natively in qME adds interaction, personalization, or operational support. Canva pages, PDFs, and Google Docs should usually stay as external links.",
        "The project is now primarily waiting on customer content rather than software architecture: attendee data, speakers, sponsors, logos, links, and food information.",
        "Scan-Code Adventure should not appear in the July guest-facing home, but can remain available as an internal/demo capability."
      ],
      decisions: [
        "Adopt the hybrid Headshot operating model: guest-confirmed completion via I've Been Called plus Station Supervisor/Admin Mark Served and Not Here recovery.",
        "Do not add photographer-specific controls unless later testing proves they are useful.",
        "Keep walk-up Venmo headshots outside qME for July.",
        "Defer Eventbrite attendee import, attendee lookup, self-registration, duplicate handling, and walk-in recovery until the actual attendee data is received and reviewed.",
        "Use last year's speaker, sponsor, and food/drink information as temporary placeholder content until SOTC provides updated content.",
        "Update the SOTC schedule/floor assignments immediately using the Mixer Resources direction.",
        "Keep Mixer Resources as a direct external Canva link, while keeping Sticker Guide as a native qME pop-up.",
        "Remove Scan-Code Adventure from the July guest home while preserving it for demo/internal use.",
        "Keep Resume Reviews and Networking visible as lower-priority guest-home cards."
      ],
      risks: [
        "Eventbrite may include duplicate names or insufficient identifying fields.",
        "Unknown Eventbrite data quality could change the self-check-in design.",
        "Walk-ins may require a recovery workflow that is not yet designed.",
        "Placeholder speakers, sponsors, logos, links, and food information must be replaced before production use.",
        "Event-specific styling must feel like SOTC while remaining mobile-readable and not overly hard-coded."
      ],
      roadmapChanges: [
        "Added Tanya/Eric meeting direction as a Product Review.",
        "Prioritized guest-home updates before Eventbrite/self-registration work.",
        "Kept SMS, web push, photographer console, generalized speaker/sponsor engines, Food & Beverage ordering, and Experience hierarchy changes deferred.",
        "Captured the resource-link decision: external guide links should stay direct unless qME recreates the content natively.",
        "Clarified that Scan-Code Adventure remains a reusable/demo capability but is removed from the July SOTC guest home."
      ],
      nextFocus: [
        "Completed: SOTC guest-home information architecture, schedule/layout, event guide structure, Event Resources with external Mixer Resources link, temporary speaker/sponsor/food content, and removal of Scan-Code Adventure from the July guest experience while preserving it as a reusable/demo capability.",
        "Waiting on SOTC: Eventbrite attendee export, updated speaker list, updated sponsor list, updated sponsor logos, sponsor destination links, and updated food/drink information.",
        "On hold until Eventbrite export is reviewed: attendee lookup, self-registration, duplicate-name handling, walk-in recovery, and registration UX based on imported attendees.",
        "Current development focus: continue refining the Headshot operational workflow, rehearse the Station Supervisor operating model, finalize July in-app notification behavior, and continue operational readiness rather than adding platform features."
      ]
    },
    {
      id: "review-notification-feasibility-2026-07-14",
      date: "2026-07-14",
      trigger: "Tanya asked whether qME can buzz guests for Headshots and other queue status changes before the July 22 SOTC event",
      summary:
        "The reliable July notification path is in-app status-change messaging while the guest page is open. SMS may become valuable, but it should not be promised until sender registration, opt-in consent, delivery logging, duplicate prevention, and provider approval timing are confirmed. Mobile web push is not a good July primary channel because iPhone guests would need Home Screen installation and notification permission.",
      observations: [
        "Current guest queue pages already detect Not Here and Return to Waiting transitions and show in-app messaging.",
        "The guest queue page currently relies on frequent refresh/polling and page-visible behavior; a closed or heavily backgrounded mobile browser cannot be treated as reachable.",
        "Optional sound can help only after a guest has interacted with the page and should not be treated as a guaranteed background buzz.",
        "SMS requires explicit consent language, provider setup, sender registration/verification, server-side triggering, delivery logs, and duplicate prevention.",
        "Queue and notification architecture should remain provider-agnostic: domain status changes should create notification events, and delivery channels should process those events."
      ],
      decisions: [
        "Do not promise SMS for July 22 unless account/compliance setup is complete and tested.",
        "Use in-app modal/banner notifications as the July fallback for Waiting to Gathering, Your Turn, Not Here, and Return to Waiting/Cooldown.",
        "Treat sound as an optional in-app enhancement, not a replacement for SMS or push.",
        "Keep mobile web push as a later channel, not a July solution for a one-time event.",
        "Discuss low-staff Headshot operating models with Tanya/Eric before adding new queue states such as active service."
      ],
      risks: [
        "Guests may close the page or lock their phone and miss in-app-only notifications.",
        "SMS timing may fail if sender registration, campaign approval, or consent language is not ready.",
        "Web push friction may distract guests and staff during a one-time event.",
        "Adding Headshot-specific states too quickly may make the reusable queue model less generic."
      ],
      roadmapChanges: [
        "Added July notification fallback story for SOTC queues.",
        "Added notification-event architecture story.",
        "Added SMS notification feasibility story.",
        "Added low-staff Headshot operating model discovery story."
      ],
      nextFocus: [
        "Choose the July Headshot notification promise: in-app only, or in-app plus SMS pilot if compliance is ready.",
        "Add in-app notifications and acknowledgement/history before any SMS channel work.",
        "Review Headshot operating models with Tanya/Eric and decide whether guest confirmation or supervisor completion is the safest alpha path."
      ]
    },
    {
      id: "review-headshot-operating-model-2026-07-14",
      date: "2026-07-14",
      trigger: "Post-implementation reflection after testing the dual Headshot operating model",
      summary:
        "The Headshot model now demonstrates a reusable operational pattern: queue progression can remain simple while durable service milestones capture what happened inside the station. The July prototype supports both guest-confirmed and admin-operated completion without adding an active_service ticket state.",
      observations: [
        "Recording I've Been Called as a durable service-start marker rather than another queue state kept the queue lifecycle simpler while preserving useful operational timestamps.",
        "Headshots now demonstrates a possible Queue -> Service Starts -> Queue Complete pattern that may apply to other Experience Types later.",
        "Photographer interaction should remain minimal: guests participate, Station Supervisors handle exceptions, and photographers stay focused on photography.",
        "The admin-operated path and guest-confirmed path can coexist as two valid operating modes for the same station.",
        "The next Experience Type review should likely be Food & Beverage because it can validate menus, station-specific credits, fulfillment, approvals, and reusable station operations."
      ],
      decisions: [
        "Prefer durable operational events/timestamps over new queue states when the state is an analytic or service milestone rather than a routing state.",
        "Do not introduce an active_service ticket state for Headshots before the Tanya/Eric discussion.",
        "Do not add photographer-specific controls unless the operating discussion proves they are necessary.",
        "Treat the Cookie Event as a product experiment for ordering, credits, approvals, fulfillment, and feedback, not as a commercial product direction.",
        "Keep the possible Experience Type -> organization-owned reusable definition -> Station layer as an open architecture question."
      ],
      risks: [
        "If service milestones are over-generalized too soon, qME may create an abstraction before Food, Resume Reviews, Registration, and Networking validate it.",
        "If photographer controls are added prematurely, qME may create operational burden for the person who should be focused on service delivery.",
        "If completed remains the only terminal state, history display must clearly distinguish guest-called completion from admin-served completion."
      ],
      roadmapChanges: [
        "Marked the Headshot guest-called completion prototype done.",
        "Updated the low-staff Headshot operating model notes with both the guest and admin completion paths.",
        "Captured Food & Beverage as the recommended next Experience Type review lens.",
        "Reinforced the open architecture question about an organization-owned reusable definition between Experience Type and Station."
      ],
      nextFocus: [
        "Use the Headshot model in the Tanya/Eric meeting to validate whether guest confirmation and admin Mark Served are operationally understandable.",
        "Review Food & Beverage as the next Experience Type before introducing any new service layer.",
        "Keep SMS/phone buzzing out of the immediate build unless the meeting makes it essential and compliance setup is realistic."
      ]
    },
    {
      id: "review-alpha-2-product-discovery-2026-07-08",
      date: "2026-07-08",
      trigger: "July 2 SOTC alpha, Jalani testing, queue operations testing, and follow-up product discovery",
      summary:
        "Alpha 2 moved qME from a working SOTC demo toward a clearer event-companion and operations platform. The product decisions are mostly planning decisions, not immediate feature expansion: finalize operational role visibility, make station controls understandable, explain queue automation behavior, keep Not Here as a cooldown-and-return policy, and continue validating reusable Experience Type architecture before adding generalized engines.",
      observations: [
        "The queue engine often behaved correctly while operators believed it was broken because cooldowns and automation blockers were invisible.",
        "The next role problem is less about whether permission checks exist and more about whether each role lands in the right workspace with the right tabs and controls.",
        "Station operational settings are product UI, not just configuration; staff need to understand them even when they cannot edit them.",
        "The Event Home direction is working better as a digital event companion than as an application-feature list.",
        "Guest Profile should remain event-scoped: identity, attributes, access, and station-specific credits.",
        "Credits should stay station/experience-specific for now, such as Headshot Credit, Cookie Credit, Drink Credit, or Bouquet Credit.",
        "A likely reusable layer exists between Experience Type and Station: an organization-owned reusable definition that can be placed in one or more event stations.",
        "The cookie event is useful as a product experiment for ordering, credits, approvals, fulfillment, and feedback, but not as a commercial feature direction yet."
      ],
      decisions: [
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
      risks: [
        "If queue automation remains opaque, correct behavior will still feel unreliable during live operations.",
        "If role visibility is not finalized, station staff may see too much setup surface or miss the operational workspace they need.",
        "If station controls are editable without clear authority boundaries, live-event operators may accidentally change event-wide behavior.",
        "If the Experience Type hierarchy is implemented too early, qME may add a wrong abstraction before Registration, Headshots, Resume Reviews, and Food provide enough evidence.",
        "If credits are generalized too soon, simple station-specific grant/use rules may become unnecessarily heavy."
      ],
      roadmapChanges: [
        "Moved role-aware admin landing/workspace visibility into the current Operational Readiness focus.",
        "Added station operational control visibility as a current story.",
        "Added queue automation observability as a current story.",
        "Updated queue rule configuration with state-specific timeouts and Not Here recovery policy.",
        "Updated experience hierarchy/grouping discovery with the organization reusable definition concept.",
        "Kept generalized credit engine, Service abstraction, registration config, speaker/sponsor engines, payment, and POS integration deferred.",
        "Captured cookie event as a future product experiment rather than a commercial feature."
      ],
      nextFocus: [
        "Finalize role/tab/control visibility across Superadmin, Organization Admin, Event Admin, Station Supervisor, and Station Staff.",
        "Make station queue controls visible and explainable, even where read-only.",
        "Add operator-facing reasons when flow automation does not move someone.",
        "Review individual Experience Types, beginning with Registration and Headshots.",
        "Use the cookie event as a tiny complete experiment only after the SOTC operational foundation is stable."
      ]
    },
    {
      id: "review-sotc-alpha-2-pretest-wrap-2026-07-02",
      date: "2026-07-02",
      trigger: "Pre-test wrap-up before the July 2 SOTC alpha",
      summary:
        "The July 2 pre-test build shifted the SOTC guest home from a list of app capabilities toward a credible event companion. Headshots remains the hero operational experience, Scan-Code Adventure remains available as an optional queue/code demo, and the event home now uses reusable eCe metadata to show schedule, featured speakers, sponsors, food/drinks, and resources without hard-coding SOTC sections into React.",
      observations: [
        "The product story is now clearer: qME can help guests understand what is happening at an event, not only move through a queue.",
        "The current build is good enough to test comprehension, orientation, and operational trust with real users.",
        "Most of the remaining risk is test/readiness risk rather than obvious implementation absence.",
        "The event-guide content is intentionally lightweight and seeded; speaker, sponsor, schedule, food, and resource engines are not being built yet.",
        "Reusable eCe metadata is carrying the new guest-home structure, which supports the Experience Type reuse direction.",
        "Final pre-test reset verification found a stale guest-tab edge case; clearing queue URL intent after event reset fixed it, and Headshot reset testing passed."
      ],
      decisions: [
        "Do not add new product behavior before the July 2 test unless something is obviously broken.",
        "Use the test to observe whether guests understand arrival, check-in, photo eligibility, Headshots, and optional Scan-Code Adventure without founder narration.",
        "Keep Scan-Code Adventure visible but treat it as a demo/supporting experience rather than the featured alpha path.",
        "Treat Headshots as the featured interactive experience for the test.",
        "Capture broad feedback after the test in an Alpha 2 Product Review instead of immediately expanding scope."
      ],
      risks: [
        "Seeded brochure content may make qME look more complete than the underlying content-management model actually is.",
        "Guests may still need clearer hierarchy between event information and action-required experiences.",
        "The optional Scan-Code demo may distract from Headshots if testers treat all cards as equally important.",
        "The current image/logo assets are sufficient for alpha, but not yet a durable media-management workflow."
      ],
      roadmapChanges: [
        "Updated the SOTC event-guide story with the implemented metadata fields and pre-test build notes.",
        "Kept Scan-Code Adventure in scope as optional demo content.",
        "Confirmed no new abstractions should be introduced before the July 2 alpha.",
        "Left speaker/sponsor/food/resource management as future Experience Type or content-model work."
      ],
      nextFocus: [
        "Run the July 2 alpha with a clean reset and a short smoke test first.",
        "Watch where guests hesitate, what they understand without prompting, and whether staff/admin flow feels controlled.",
        "After the test, write Alpha 2 Product Review and decide whether Registration or Headshots should be reviewed next as an Experience Type."
      ]
    },
    {
      id: "review-sotc-pre-alpha-build-2026-07-02",
      date: "2026-07-01",
      trigger: "Pre-alpha build direction for the July 2 SOTC alpha",
      summary:
        "This review keeps the next SOTC alpha focused on feeling like a real event companion rather than a technical demo. The immediate build should improve the guest home with reusable event-guide activities, preserve the Scan-Code demo station as optional, and avoid introducing broad new abstractions before the experience types are reviewed.",
      observations: [
        "The alpha should show a credible event flow: arrival, registration, event home, then experiences.",
        "Registration should remain simple for tomorrow: Student, Professional, and Professional + Photo.",
        "The guest home should start showing more of the event, but through reusable eCe configuration rather than SOTC-specific code.",
        "Scan-Code Adventure is still useful as an optional demo station even if it is not part of the main alpha path.",
        "The 2025 SOTC brochure reframes the alpha around conference-companion usefulness: schedule, speakers, sponsors, food/drinks, resources, and only then interactive experiences.",
        "Guest Profile should be treated as event-scoped identity, attributes, access, and credits rather than a full user account."
      ],
      decisions: [
        "Keep Scan-Code Adventure in the SOTC test event as an optional demo station.",
        "Make Professional Headshots the hero interactive experience.",
        "Make the Event Home feel like Welcome, Tonight's Schedule, Featured Experiences, Featured Speakers, Sponsors, Food & Drinks, and Resources rather than a list of application features.",
        "Use reusable eCe metadata to configure guest-home sections, badges, ordering, and lightweight display items.",
        "Do not create generalized registration config, generalized credit engine, Service abstraction, speaker/sponsor engines, platform-wide station permission framework, or event guidance engine for tomorrow.",
        "Keep recovery contact as a future-friendly identity field, not a password account requirement.",
        "After tomorrow's test, create an Alpha 2 Product Review rather than logging every observation as an immediate fix."
      ],
      risks: [
        "Adding event-guide content too quickly could make the alpha look broader than the implemented operational depth.",
        "Hard-coding SOTC sections would weaken the reusable Experience Type direction.",
        "Keeping Scan-Code visible could confuse the main alpha path unless it is clearly treated as optional/demo.",
        "Registration, credits, and recovery-contact concepts could become tangled if they are overbuilt before tomorrow's test."
      ],
      roadmapChanges: [
        "Added the SOTC pre-alpha event-guide story.",
        "Added a seed/data path for lightweight event-guide eCes rather than hard-coded guest-home content.",
        "Course-corrected the seed toward the brochure: Tonight's Schedule, workshop speakers, sponsors, food/drinks, and resources.",
        "Recorded Scan-Code Adventure as retained optional demo content.",
        "Kept the next deeper product review focused on individual Experience Types."
      ],
      nextFocus: [
        "Run the July 2 alpha as an event companion test.",
        "Watch whether guests understand registration, photo eligibility, headshot access, and optional/demo activities.",
        "After testing, write Alpha 2 Product Review and decide whether Registration or Headshots should be the next Experience Type review."
      ]
    },
    {
      id: "review-product-architecture-part-3-2026-07-01",
      date: "2026-07-01",
      trigger: "Refinement of product architecture decisions after Part 2 review",
      summary:
        "This review refined the event authority, queue commitment, and experience reuse decisions. It clarified that station admin distinctions are station-defined rather than universal, live/destructive event controls remain above station authority, queue stale timing may differ by commitment state, and Experience Types should be reusable before qME introduces any new Service abstraction.",
      observations: [
        "Most items were clarifications rather than new implementation work.",
        "Station Staff and Station Admin should not be treated as universally distinct platform roles.",
        "Some stations may need elevated local station actions, while others may have no practical difference between station staff and station admin.",
        "Experience Types should be designed for reuse across organizations, events, and repeated placements inside the same event.",
        "The Experience versus Service relationship is important but should remain unresolved until Registration, Headshots, Resume Reviews, and Food Ordering provide more evidence."
      ],
      decisions: [
        "Station Staff versus Station Admin is station-defined, not platform-defined.",
        "Reset, destructive actions, event-wide configuration, live event control settings, and cross-station operations remain event admin or higher.",
        "On My Way extends grace time but does not make a guest callable; only I'm Nearby makes a guest callable.",
        "Future queue tuning should consider different stale timers for Gathering, On My Way, and I'm Nearby.",
        "Everything possible should be designed as a reusable Experience Type rather than a SOTC-specific implementation.",
        "Do not introduce a Service layer yet; keep Experience versus Service as an open architecture question."
      ],
      risks: [
        "Over-modeling station admin as a universal role could create unnecessary complexity.",
        "Under-modeling elevated station actions could leave check-in and future station workflows too coarse.",
        "SOTC-specific implementations could weaken reuse if they are not generalized into Experience Types.",
        "Introducing a Service abstraction too early could make the architecture heavier before the product has enough evidence."
      ],
      roadmapChanges: [
        "Refined the station authority decision to make station-admin differences station-defined.",
        "Refined the queue commitment decision with state-specific stale-timer guidance.",
        "Strengthened experience reuse guidance on the experience model stories.",
        "Added Experience versus Service as an explicit open architecture question.",
        "Kept implementation backlog unchanged except for planning/story-note refinements."
      ],
      nextFocus: [
        "Begin reviewing individual Experience Types instead of adding more platform abstraction.",
        "Review Registration first, then Headshots, Resume Reviews, Passport, Sponsors, and Food Ordering.",
        "Let those experience designs validate whether qME needs a separate Service concept."
      ]
    },
    {
      id: "review-product-architecture-part-2-2026-07-01",
      date: "2026-07-01",
      trigger: "Follow-up product architecture discussion after the Foundation Review",
      summary:
        "This review reduced architectural ambiguity before more implementation. The discussion clarified qME as an event platform where guest participation, admin/staff operations, recoverable assets, event authority, queue commitment, live controls, and experience composition each have distinct product rules.",
      observations: [
        "The goal of this discussion was not feature expansion, but clarifying how qME should behave as an event platform.",
        "A single person may hold admin/staff roles while also participating as a guest, but guest participation remains a separate operational context.",
        "Recoverable benefits need recoverable contact information, even when the guest experience remains accountless.",
        "Experiences are the primary product unit; queues are one reusable capability an experience may compose.",
        "Live Event Controls are distinct from Event Setup and may legitimately change during active operations."
      ],
      decisions: [
        "Guest participation continues to use guest-session context even when the same human is signed in as an admin or staff user.",
        "Recoverable assets such as complimentary or purchased professional headshots require email or mobile number before the asset is granted.",
        "Student or Professional + Photo without recovery contact automatically becomes Needs More Info; staff should not manually decide this.",
        "Event authority hierarchy is qME superadmin, organization admin, event admin, then event staff, with future station staff/station admin distinction.",
        "Queue commitment moves from Waiting to Gathering to optional On My Way to I'm Nearby to Your Turn to Done; only I'm Nearby makes a guest callable.",
        "Live Event Controls such as flow mode, gathering target/max, stale timing, pause/resume, and intake behavior belong with operations and require event admin or higher.",
        "Experience architecture should compose reusable capabilities such as queue, ordering, menu, resources, passport, notifications, staff assignment, and status tracking."
      ],
      risks: [
        "Admin identity and guest identity could become confusing if UI does not keep contexts visibly separate.",
        "Recoverable-contact requirements could create check-in friction if the Needs More Info path is not clear.",
        "Station-level authority could become too broad unless station staff and station admin are modeled deliberately.",
        "Queue terminology and status progression could drift across experiences unless the commitment model is documented and reused.",
        "Live controls could be mistaken for setup controls unless admin screens separate them clearly."
      ],
      roadmapChanges: [
        "Added architecture decisions for guest/admin context separation, recoverable assets, Needs More Info, event authority, queue commitment, live event controls, and experience capabilities.",
        "Updated Foundation Validation criteria to test guest/admin context separation and station-level authority boundaries.",
        "Updated privileged action matrix criteria to include live queue controls and station-level authority.",
        "Updated headshot eligibility criteria with recoverable-contact and Needs More Info behavior.",
        "Updated experience model notes to treat queue as a reusable capability rather than the definition of an experience."
      ],
      nextFocus: [
        "Validate role and permission boundaries before broad platform expansion.",
        "Review experience-by-experience starting with Registration, then Headshots, Resume Reviews, Passport, Sponsors, and Food Ordering.",
        "Keep architecture ahead of implementation without expanding the backlog beyond near-term validation needs."
      ]
    },
    {
      id: "review-foundation-organization-roles-auth-rls-2026-07-01",
      date: "2026-07-01",
      trigger: "Sprint 2 foundation completion and external product/security review direction",
      summary:
        "Sprint 2 moved qME from a founder-operated demo toward an organization-ready pilot. Named admin identities, organization ownership, event ownership, staff assignments, guest session tokens, authenticated RPC boundaries, role-scoped admin access, and audit logging for newer staff/admin actions are now real enough for external validation. qME should not be treated as fully production-hardened yet; the remaining risk has shifted from architecture design to validation and hardening.",
      observations: [
        "Removing the old temporary admin passphrase was a major trust milestone.",
        "Role boundaries are now understandable: qME superadmin, organization admin, event admin, feature/station staff, and guest/anonymous.",
        "Guest actions and staff/admin actions are separated more clearly through guest-token and authenticated admin/staff RPCs.",
        "The product is no longer only operated by the founder in demo mode.",
        "The main remaining risk is no longer whether qME can design the foundation, but whether the implemented foundation has been tested correctly across roles and edge cases."
      ],
      decisions: [
        "Do not jump directly into broad platform expansion.",
        "Run a short Foundation Validation checkpoint before deeper SOTC Event Builder work.",
        "Re-engage the computer engineering student now that concrete role/auth/RLS structure exists to review.",
        "Continue using role-based access rather than building a full custom permissions engine.",
        "Complete only a focused RLS/RPC consistency pass before returning toward product work."
      ],
      risks: [
        "Some privileged actions may still have inconsistent protection paths.",
        "Role boundaries may be conceptually clear but need cross-role testing.",
        "Audit logging may not yet cover every sensitive action consistently.",
        "Temporary onboarding/password flows still need cleanup.",
        "Admin mistake recovery remains limited.",
        "Event reset/test-mode permissions may need stricter live-event rules."
      ],
      roadmapChanges: [
        "Closed Sprint 2 as a completed foundation sprint.",
        "Created Foundation Validation as the current short checkpoint sprint.",
        "Added role/permission smoke matrix, privileged action matrix, external database/security review, and Jalani named-admin walkthrough stories.",
        "Kept temporary password first-login cleanup visible in the validation sprint.",
        "Moved full SOTC Event Builder / Program Readiness behind Foundation Validation."
      ],
      nextFocus: [
        "Run role and permission smoke-test matrix.",
        "Document privileged action matrix.",
        "Re-engage the computer engineering student for database/security review.",
        "Run Jalani named-admin walkthrough.",
        "Decide whether temporary password cleanup is completed now or explicitly deferred."
      ]
    },
    {
      id: "review-sotc-alpha-2026-06-24",
      date: "2026-06-24",
      trigger: "SOTC student alpha test and external roadmap review",
      summary:
        "The SOTC alpha test validated the core event check-in, queue state, photo-credit/headshot, and admin control flows with real students. Feedback centered on polish and readiness rather than product rejection.",
      observations: [
        "qME is converging toward an event experience platform, not simply a queue app.",
        "Guests move through events; they do not wait in lines.",
        "Jalani Ball emerged as a student partner who can help move the pilot toward ready.",
        "Near-term work should focus on production readiness before additional platform expansion."
      ],
      decisions: [
        "Prioritize refresh behavior, mobile polish, queue messaging, Jalani readiness review, and database hardening before broader feature expansion.",
        "Keep operational dashboard and post-event analytics as future stories, not July blockers.",
        "Treat Product Reviews as learning artifacts distinct from sprint execution."
      ],
      risks: [
        "Platform expansion may outrun customer validation.",
        "Small UX issues can become live-event operational friction.",
        "Database/RLS hardening is required before broader deployment."
      ],
      roadmapChanges: [
        "Added SOTC alpha follow-up stories.",
        "Added SOTC admin/staff RLS hardening story.",
        "Recommended Event Rehearsal Mode and Failure Recovery as next planning candidates."
      ],
      nextFocus: [
        "Calm refresh/blinking",
        "Mobile layout/button polish",
        "Headshot/standby messaging",
        "Jalani readiness review",
        "Staff/admin role model and RLS hardening",
        "Failure recovery checklist",
        "Event rehearsal/practice mode"
      ]
    }
  ],
  inbox: [
    {
      id: "inbox-cookie-event-product-experiment",
      title: "Cookie event as tiny product experiment",
      disposition: "future",
      summary:
        "Treat a cookie event as a small complete product experiment, not a commercial feature. Use it to validate ordering, station-specific credits, approvals, fulfillment, and feedback with the smallest possible event surface only after the secure ordering replacement path exists. Do not use it to justify a generalized credit engine, payment/POS integration, or service abstraction yet.",
      linkedStoryIds: [
        "story-experience-configuration",
        "story-experience-hierarchy-grouping",
        "story-guest-intentions"
      ],
      createdAt: "2026-07-08T00:00:00.000Z"
    },
    {
      id: "inbox-test-lab-group-dinner-order",
      title: "qME Test Lab group dinner order pilot",
      disposition: "future",
      summary:
        "Quick dinner test: guests check in with first and last name, join a Dinner Order feature, add tapas/drink items with quantities, see what they submitted, add more, remove their own unsubmitted items, and admin can send gathered items to an ordered bucket. Test went well but showed that a real group-order feature would need structured menu selection rather than free typing, menu URL/PDF support, per-item quantities per order, fractional/minimum quantities such as half portions, and the ability to increment an existing item. July 17 security update: ordering is blocked until the prior group-order pilot is replaced with guest-session-owned order records, verified event/guest ownership, scoped RPCs, station/event staff authorization, server-side quantity/state validation, idempotency, audit logging, and explicit draft/submitted/approved/fulfilled states. This remains a fun future qME facilitation feature, but not core SOTC readiness.",
      linkedStoryIds: ["story-guest-intentions", "story-queue-length-readiness-states", "story-testing-workspace-issue-capture"],
      createdAt: "2026-06-28T00:00:00.000Z"
    },
    {
      id: "inbox-ece-visible-before-check-in-option",
      title: "eCe visibility before completed check-in",
      disposition: "promote",
      summary:
        "Add an eCe setup option controlling whether a feature is visible before completed event check-in. Some features should be hidden entirely until check-in is complete; others should remain visible with a locked/status message such as check in first, waiting for host check-in, photo credit required, or join paused. This should be configured per eCe rather than hard-coded by feature type.",
      linkedStoryIds: ["story-ece-activation-reset", "story-guest-condition-engine"],
      createdAt: "2026-06-29T00:00:00.000Z"
    },
    {
      id: "inbox-remind-db-hardening-student-after-role-structure",
      title: "Reminder: re-engage computer engineering student for database hardening review",
      disposition: "ready",
      summary:
        "The platform stabilization pass now has enough concrete organization, admin, staff, guest-token, RLS, and RPC structure for a bounded review. Re-engage the computer engineering student and ask him to critique the implemented foundation: role model, guest token approach, RLS policies, RPC boundaries, audit logging, remaining permissive policies, and obvious ways a guest or staff user could overreach.",
      linkedStoryIds: ["story-sotc-admin-staff-rls-hardening", "story-foundation-external-db-security-review"],
      createdAt: "2026-06-26T00:00:00.000Z"
    },
    {
      id: "inbox-guest-status-color-system",
      title: "Guest card status color system",
      disposition: "idea",
      summary:
        "Define a consistent visual system for guest card states so color explains meaning instead of just decoration. Clarify why completed is green, how inQ/waiting should differ from completed, and how paused, locked, photo-credit-required, and active states should read on event cards.",
      linkedStoryIds: ["story-sotc-pilot-ops-controls"],
      createdAt: "2026-06-20T00:00:00.000Z"
    },
    {
      id: "inbox-queue-length-readiness-states",
      title: "Queue length and guest readiness states",
      disposition: "idea",
      summary:
        "Explore queue messaging beyond exact queue length: waiting, almost ready, nearby/ready, released/your turn, served, and what happens when a released guest is marked Not here. Current pilot can stay as-is, but future fairness rules should evaluate practical Not here options: a soft penalty that sorts recently missed guests after other ready guests, a simple penalty that clears nearby and puts them behind already-ready standby guests, or a hard penalty that sends them back to waiting. Goal is to avoid false precision while making readiness and fairness obvious to staff and guests.",
      linkedStoryIds: ["story-sotc-not-here-recovery"],
      createdAt: "2026-06-14T00:00:00.000Z"
    },
    {
      id: "inbox-testing-workspace-issue-capture",
      title: "Testing workspace and issue capture",
      disposition: "idea",
      summary:
        "Consider a separate testing environment or planning tab for QA notes, test plans, issue reports, screenshots/images, and event testing evidence. Start with quick text capture; image support needs a storage/security decision.",
      linkedStoryIds: [],
      createdAt: "2026-06-14T00:00:00.000Z"
    },
    {
      id: "inbox-headshot-tags",
      title: "Headshot tags from user notes",
      disposition: "promote",
      summary:
        "Student, professional, student-took-photo, professional-with-photo, professional-took-photo. Professional can add photo access before or during event; admin can change state.",
      linkedStoryIds: ["story-headshot-tags", "story-guest-condition-engine"]
    },
    {
      id: "inbox-pay-at-desk",
      title: "Headshot queue visibility and photo-credit gate",
      disposition: "consider",
      summary:
        "Keep the Headshot Photographer queue visible to checked-in guests even when they do not have a photo credit, because the queue itself communicates a paid/special-access station. Guests without credit should see a quiet locked state such as photo credit required, not a join action. Guests with available credit can join; guests who completed/used the credit see completed/history. Future purchase or pay-at-desk flow can attach to this locked state.",
      linkedStoryIds: ["story-headshot-queue", "story-guest-condition-engine"]
    },
    {
      id: "inbox-standby-near-booth",
      title: "Standby near booth and scheduling blocks",
      disposition: "future",
      summary:
        "Need people near booth when almost ready, but not physically waiting the whole time. May use location, standby, or call-ahead behavior.",
      linkedStoryIds: ["story-headshot-queue", "story-location-beacons"]
    },
    {
      id: "inbox-guest-intentions",
      title: "Guest keeps announcing intentions",
      disposition: "future",
      summary:
        "Use guest conditions and needs to drive actions generally. Guest tells the system what they want to do.",
      linkedStoryIds: ["story-guest-intentions"]
    },
    {
      id: "inbox-survey-icons",
      title: "Surveys and interest icons",
      disposition: "future",
      summary:
        "Capture interests and different groups using simple icons; later can drive networking or recommendations.",
      linkedStoryIds: ["story-survey-icons", "story-networking-matching"]
    },
    {
      id: "inbox-trello-sotc-pdf-import",
      title: "SOTC Trello PDF import",
      disposition: "promote",
      summary:
        "sotc planning doc.pdf contained 11 pages of Trello detail. Promoted missing items around role permissions/audits, event schedules/templates, expie configuration, eCe lifecycle, queue rules, notifications, SOTC attendee import/QR entry, and admin operations.",
      linkedStoryIds: [
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
  ],
  decisions: [
    {
      id: "decision-guest-admin-context-separation",
      title: "Guest participation is separate from admin/staff operations",
      status: "decided",
      prompt:
        "A person may simultaneously be qME superadmin, organization admin, event admin, event staff, and guest, but signing into admin is not the same as participating as a guest. Guest participation continues through the guest-session model; future credential management may unify identity, but operational context remains separate."
    },
    {
      id: "decision-recoverable-assets-contact-required",
      title: "Recoverable assets require recoverable contact before grant",
      status: "decided",
      prompt:
        "Guest participation remains accountless by default, but recoverable assets such as complimentary or purchased professional headshots require email or mobile number before the benefit is granted. This is about recoverability, not authentication."
    },
    {
      id: "decision-needs-more-info-recovery-contact",
      title: "Missing recovery contact creates Needs More Info state",
      status: "decided",
      prompt:
        "When staff selects Student or Professional + Photo and no recovery contact exists, the system should automatically put the guest into Needs More Info. The guest returns to check-in with prior information retained, provides email or phone, and resubmits. Staff sees Waiting for recovery contact, then Ready to Check In, and still completes check-in manually."
    },
    {
      id: "decision-event-authority-hierarchy",
      title: "Event authority hierarchy and station authority",
      status: "decided",
      prompt:
        "Authority hierarchy is qME superadmin, organization admin, event admin, and event staff. Event staff are assigned to one or more event activities/stations. A station may optionally distinguish Station Staff from Station Admin, but that distinction is station-defined rather than platform-defined: some stations may have no practical difference, while others may use Station Admin for elevated local actions such as check-in photo credit grants or guest classification resolution. Event-wide/destructive actions such as reset, event configuration, live event control settings, destructive operations, and cross-station configuration remain event admin or higher."
    },
    {
      id: "decision-queue-commitment-model",
      title: "Queue commitment model",
      status: "decided",
      prompt:
        "Queue progression is Waiting, Gathering, optional On My Way, I'm Nearby, Your Turn, Done. On My Way extends guest grace time but does not make the guest callable. Only I'm Nearby allows progression to Your Turn. Return to Waiting requires a later I'm Nearby confirmation. Future tuning should consider separate stale timers for Gathering, On My Way, and I'm Nearby."
    },
    {
      id: "decision-live-event-controls",
      title: "Live Event Controls are operational, not setup",
      status: "decided",
      prompt:
        "Distinguish Event Setup, Live Operations, and Live Event Controls. Controls such as queue flow mode, gathering target, gathering max, stale timing, pause/resume, and intake behavior may change during live operations and should be editable only by event admin or higher."
    },
    {
      id: "decision-experiences-compose-capabilities",
      title: "Experiences compose reusable platform capabilities",
      status: "decided",
      prompt:
        "Experiences are the primary product unit. Queue is one reusable capability, not the definition of an experience. Experiences may compose capabilities such as queue, ordering, menu, notifications, status tracking, staff assignment, resources, and passport. Experience Types should be reusable across multiple events, multiple organizations, and multiple times within the same event; avoid SOTC-specific implementations whenever a reusable Experience Type is possible."
    },
    {
      id: "decision-experience-service-relationship",
      title: "What is the relationship between Experience and Service?",
      status: "open",
      prompt:
        "Headshots, Resume Reviews, and Food Ordering appear to behave like services, while Sponsors, Galleries, Resources, and Passport do not naturally behave as services. Do not introduce a Service layer yet. Let the answer emerge while designing Registration, Headshots, Resume Reviews, and Food Ordering."
    },
    {
      id: "decision-event-scoped-guest-profile",
      title: "Guest Profile is event-scoped",
      status: "decided",
      prompt:
        "Guest Profile is event-scoped for now and contains identity, attributes, access, and credits for that event. It should not be treated as a full cross-event user account until product evidence requires it."
    },
    {
      id: "decision-station-specific-credits",
      title: "Credits stay station/experience-specific for now",
      status: "decided",
      prompt:
        "Credits are experience or station specific for now, such as Headshot Credit, Cookie Credit, Drink Credit, or Bouquet Credit. Do not build a generalized credit engine yet; let multiple concrete experience designs reveal what needs to be common."
    },
    {
      id: "decision-org-reusable-definition-layer",
      title: "Possible reusable layer between Experience Type and Station",
      status: "open",
      prompt:
        "A likely missing layer exists between Experience Type and Station: an organization-owned reusable definition that can be placed into one or more stations or events. Examples include Food & Beverage > Lemonade Stand > West Patio Station and Professional Headshots > Corporate Headshot > Photographer A. Do not implement yet; validate through Registration, Headshots, Resume Reviews, and Food."
    },
    {
      id: "decision-peony-demo-preservation",
      title: "Peony Festival remains the working demo",
      status: "decided",
      prompt:
        "Peony Festival guest/queue flow is good enough for now and should remain demonstrable while multi-organization and multi-event foundations are built."
    },
    {
      id: "decision-planning-workspace-source",
      title: "Planning workspace is source of truth for now",
      status: "decided",
      prompt:
        "Use the repo-based planning workspace as the product source of truth for the next few weeks."
    },
    {
      id: "decision-sotc-mvp",
      title: "What must be real by July 22?",
      status: "discovery",
      prompt:
        "Likely thin MVP: organization-owned SOTC event, public event page with structured experience cards, registration QR/name entry with admin tagging, headshot queue, resume review queue, and mixer resources/digital brochure cards. Exact demoable vs operational reliability line remains open."
    },
    {
      id: "decision-sotc-slug",
      title: "SOTC public slug",
      status: "decided",
      prompt:
        "Use sotc-rock-hall for the public event slug. Keep SOTCRH as internal shorthand only."
    },
    {
      id: "decision-sotc-attendee-import",
      title: "No SOTC attendee import for first slice",
      status: "decided",
      prompt:
        "Do not import Evite/Eventbrite attendees for the first SOTC slice. Guests scan QR and enter their name; staff can continue official attendance tracking in their existing external list/system."
    },
    {
      id: "decision-sotc-photo-states",
      title: "SOTC headshot states",
      status: "decided",
      prompt:
        "Use SOTC-specific states: student-photo-eligible, student-photo-used, professional-general, professional-photo-eligible, professional-photo-used. Leave room for a second profession/networking tag."
    },
    {
      id: "decision-sotc-day-one-queues",
      title: "SOTC day-one queue/service flows",
      status: "decided",
      prompt:
        "Day-one queue/service flows are registration check-in, professional headshots, and resume review."
    },
    {
      id: "decision-ece-language",
      title: "Should product language use experience or eCe?",
      status: "open",
      prompt:
        "The code/product model needs a clear term for event modules. Experience may be clearer for users; eCe may remain internal if useful."
    },
    {
      id: "decision-headshot-payment",
      title: "How should professional photo access be acknowledged?",
      status: "decided",
      prompt:
        "For the first SOTC slice, admin/staff marking at registration/check-in is enough. Payment or purchase workflow is deferred."
    },
    {
      id: "decision-roadmap-auth",
      title: "Real roadmap auth is deferred",
      status: "decided",
      prompt:
        "Current code/API gate is acceptable while usage is limited to the owner and possibly one trusted collaborator. Revisit real auth before adding sensitive patent/customer details or expanding collaborators."
    }
  ]
};

if (typeof window !== "undefined") {
  window.QME_ROADMAP = QME_ROADMAP;
}

if (typeof module !== "undefined") {
  module.exports = QME_ROADMAP;
}
