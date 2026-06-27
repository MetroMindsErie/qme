const QME_ROADMAP = {
  meta: {
    product: "qME",
    workspace: "Product roadmap and sprint planning",
    updated: "2026-06-26",
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
      title: "Sprint 2: Organization, Roles, Auth, and RLS",
      goal:
        "Build the minimum organization, admin, staff, authentication, and RLS foundation needed before the SOTC pilot can move from guided alpha into real event readiness.",
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
        "story-sotc-admin-staff-rls-hardening"
      ]
    },
    {
      id: "next",
      title: "Next: SOTC Event Builder",
      goal:
        "Model the Rock Hall mixer as an event with experiences, queues, access rules, public resources, and managed media.",
      storyIds: [
        "story-remove-hardcoded-demo-assumptions",
        "story-experience-model",
        "story-managed-image-storage",
        "story-headshot-queue",
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
              status: "current",
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
                "Added during Sprint 2 after confirming that /planning is now part of the operating system and should be protected by the same admin/auth foundation being built for qME. Current access code is documented as a temporary assumption in docs/hard-coded-demo-assumptions-audit.md."
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
                "Schema foundation added in supabase-admin-role-foundation.sql with admin_principals, organization_memberships, and event_staff_assignments. App pass added an Organization Staff panel: org admins/superadmins can list active organization memberships, add an existing active admin principal by email as org_admin or universal_staff, and archive/remove memberships. Invite emails, new-user creation, event-specific staff assignment UI, and role-aware RLS enforcement remain in Sprint 2."
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
                "Sprint 2 focus from post-alpha planning: do this before asking the computer engineering student to review database hardening, so the review has concrete role/auth structure. Near-term decision is documented in docs/admin-auth-transition-v1.md. AdminGate now recognizes Supabase Auth users linked to admin_principals, shows a visible admin identity/role bar, and keeps the passphrase as a temporary fallback. Superadmin utility added at /admin/principals to list admin principals, create named principals, link an existing Supabase Auth user UUID, and create a Supabase Auth login plus qME principal from the tool when SUPABASE_SERVICE_ROLE_KEY is configured server-side. One email/Auth user should map to one admin principal, and that principal may hold memberships in multiple organizations; UI should preserve that rather than duplicating users per organization. Role-scoped routing is active; RLS enforcement and invite-email automation remain pending."
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
              status: "current",
              sprint: "now",
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
                "Alpha-test follow-up from computer engineering student feedback: the pilot works, but the database needs manual hardening around roles, RLS, action ownership, and auditability before real SOTC operations. Reminder: re-engage the computer engineering student after the platform is stabilized with basic organization, admin, and staff user structure so his review can focus on concrete policies and risks."
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
                "Any temporary pilot flags are documented with replacement intent before RLS hardening."
              ],
              notes:
                "Added during Sprint 2 product discussion after confirming that SOTC's automated test behavior should be configurable by event. This supports the Sprint 2 trust goal: an organization can independently operate an event with appropriate permissions and predictable behavior."
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
                "Trello uses 'expie' for the reusable experienceable unit. Product language can still use Experience while eCe may represent an event-specific instance."
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
              status: "future",
              sprint: "future",
              summary:
                "Support grouping multiple related experiences by owner, type, or location, such as the same lemonade stand in multiple locations.",
              acceptanceCriteria: [
                "Relationship between organization-owned expies and event-specific instances is documented.",
                "Same experience can appear in multiple locations or times.",
                "Grouping can support future smart ordering or routing."
              ],
              notes:
                "Imported from Trello expie hierarchy notes."
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
                "Photo completion can update tag/state.",
                "A separate profession/networking tag placeholder is supported for later colored-nametag or networking use."
              ],
              notes:
                "2026-06-11 PO review: photo access is marked at registration/check-in, not imported. Professional-general is a distinct state from professional-photo-eligible."
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
                "When staff marks a released SOTC pilot guest as Not here, keep the same ticket in standby, explain what happened, and ask the guest to tap I'm Nearby again when ready.",
              acceptanceCriteria: [
                "Admin confirms before marking a released guest Not here.",
                "A Not here guest returns to standby on the same ticket.",
                "Guest sees a modal explaining they were removed because they did not come when called after saying they were nearby.",
                "Guest sees an inline standby banner until they tap I'm Nearby again.",
                "Tapping I'm Nearby clears the recovery banner and makes the guest eligible to be called again.",
                "Normal first-time standby does not show the Not here modal."
              ],
              notes:
                "Completed on 2026-06-26. First pass intentionally uses client-side transition detection rather than adding a durable database marker. If the guest page is closed during the staff action, a future database field such as not_here_at may be needed. User confirmed the recovery flow works."
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
              id: "story-queue-rule-configuration",
              title: "Configure queue rules and priority policies",
              status: "future",
              sprint: "future",
              summary:
                "Allow admins to configure queue capacity, pacing, intake, remote wait, commitment windows, no-show handling, and priority structures.",
              acceptanceCriteria: [
                "Queue rules can include capacity thresholds, max digital positions, intake rates, and average service time.",
                "Rules can include commitment prompts, expiration, grace periods, skip/reinsert behavior, and no-show policies.",
                "Priority structures can support premium tiers, staff passes, accessibility accommodations, or weighted/batched service.",
                "This remains future configuration until a concrete event requires it."
              ],
              notes:
                "Imported from Trello/provisional queue rules."
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
      id: "inbox-remind-db-hardening-student-after-role-structure",
      title: "Reminder: re-engage computer engineering student for database hardening review",
      disposition: "reminder",
      summary:
        "After the platform stabilization pass adds basic user structure for organization, admin, and staff roles, send the database hardening message to the computer engineering student who offered to help. Wait until there is enough concrete role/auth structure for his review to be bounded and useful.",
      linkedStoryIds: ["story-sotc-admin-staff-rls-hardening"],
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
