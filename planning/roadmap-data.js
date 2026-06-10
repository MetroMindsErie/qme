window.QME_ROADMAP = {
  meta: {
    product: "qME",
    workspace: "Product roadmap and sprint planning",
    updated: "2026-06-10",
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
      title: "Now: Planning Workspace and SOTC Shape",
      goal:
        "Create the product management space, preserve epics/themes, and identify the first SOTC stories without losing the bigger roadmap.",
      storyIds: [
        "story-planning-workspace",
        "story-roadmap-data-model",
        "story-sotc-anchor-event",
        "story-sotc-experience-inventory",
        "story-cleanup-before-multi-org",
        "story-triage-inbox"
      ]
    },
    {
      id: "next",
      title: "Next: Multi-Org Foundation",
      goal:
        "Create the minimum organization/admin/event foundation needed to set up Summer on the Cuyahoga without hard-coded demo behavior.",
      storyIds: [
        "story-org-table",
        "story-admin-org-role",
        "story-event-org-owner",
        "story-event-create-edit",
        "story-seed-sotc-org"
      ]
    },
    {
      id: "soon",
      title: "Soon: SOTC Event Builder",
      goal:
        "Model the Rock Hall mixer as an event with experiences, queues, access rules, and public resource cards.",
      storyIds: [
        "story-experience-model",
        "story-headshot-queue",
        "story-resume-review-queue",
        "story-resource-cards",
        "story-passport-activity"
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
              id: "story-cleanup-before-multi-org",
              title: "Complete cleanup pass before multi-organization build",
              status: "current",
              sprint: "now",
              summary:
                "Keep a short, explicit cleanup list so known issues are reviewed before the architecture expands.",
              acceptanceCriteria: [
                "Known guest-flow bugs are either fixed or documented.",
                "Known local build/workflow issues are captured.",
                "Deferred cleanup items are separated from multi-org stories."
              ]
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
              status: "current",
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
              status: "current",
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
              status: "current",
              sprint: "now",
              summary:
                "Create a place for raw notes to be captured, triaged, promoted to stories, or parked.",
              acceptanceCriteria: [
                "Inbox items can be tagged as consider, promote, or defer.",
                "Raw wording can be preserved while product implications are clarified.",
                "Deferred ideas remain visible without distracting the current sprint."
              ]
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
              status: "ready",
              sprint: "next",
              summary:
                "Add the core organization model so qME is no longer only a single demo/event app.",
              acceptanceCriteria: [
                "Supabase has an organizations table.",
                "Organizations have name, slug, status, and timestamps.",
                "Existing Peony Festival data can belong to a default organization."
              ]
            },
            {
              id: "story-seed-sotc-org",
              title: "Seed Summer on the Cuyahoga organization",
              status: "ready",
              sprint: "next",
              summary:
                "Create Summer on the Cuyahoga as a first real organization for the Rock Hall event demo.",
              acceptanceCriteria: [
                "Organization slug is stable.",
                "The organization can own the July 22 Rock Hall event.",
                "Future staff/admin records can be attached."
              ]
            },
            {
              id: "story-org-staff",
              title: "Model organization staff",
              status: "future",
              sprint: "future",
              summary:
                "Allow organizations to invite staff or assign event-specific roles.",
              acceptanceCriteria: [
                "One person can belong to one or more organizations.",
                "Staff permissions can be narrower than owner/admin permissions.",
                "Staff can be assigned to event operations later."
              ]
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
              status: "ready",
              sprint: "next",
              summary:
                "Separate qME superadmin access from organization admin access.",
              acceptanceCriteria: [
                "A qME superadmin can manage all organizations.",
                "An organization admin can manage only their organization.",
                "Role checks are documented before sensitive admin screens expand."
              ]
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
              status: "ready",
              sprint: "next",
              summary:
                "Make event ownership explicit so each customer can manage their own events.",
              acceptanceCriteria: [
                "events.organization_id references organizations.id.",
                "Existing guest URLs keep working.",
                "Admin event lists can filter by organization."
              ]
            },
            {
              id: "story-event-create-edit",
              title: "Create and edit events",
              status: "ready",
              sprint: "next",
              summary:
                "Allow an admin or qME operator to set up an event without code changes.",
              acceptanceCriteria: [
                "Admin can create event name, slug, date, venue, and status.",
                "Admin can edit event details.",
                "Validation protects unique slugs within an organization."
              ]
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
                "Admin can see why an event is unavailable."
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
              status: "current",
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
              ]
            },
            {
              id: "story-sotc-experience-inventory",
              title: "Inventory SOTC event experiences",
              status: "current",
              sprint: "now",
              summary:
                "Turn the brochure/program areas into event experience candidates.",
              acceptanceCriteria: [
                "Registration, sponsors, headshots, networking, resume reviews, food, bar, greetings, workshops, galleries, and resources are captured.",
                "Each experience has an initial treatment: queue, info card, signup, notification, map, or future experiment.",
                "Queue-bearing experiences are identified first."
              ]
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
                "An experience can optionally connect to a queue."
              ]
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
                "Types drive guest UI defaults without hard-coding the SOTC event."
              ]
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
                "The relationship between eCe, experience, queue, and event is clear."
              ]
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
                "Admin can understand blocked entry counts."
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
              status: "ready",
              sprint: "soon",
              summary:
                "Model the free student headshot line and paid/approved professional access.",
              acceptanceCriteria: [
                "Headshot experience has a queue.",
                "Students can join for free.",
                "Professionals can join only when marked as professional-with-photo or equivalent access."
              ],
              notes:
                "This extends the Bouquet Bar access pattern into guest tags/conditions."
            },
            {
              id: "story-headshot-tags",
              title: "Add guest tags for headshot eligibility",
              status: "ready",
              sprint: "soon",
              summary:
                "Use guest tags such as student, professional, student-took-photo, professional-with-photo, and professional-took-photo.",
              acceptanceCriteria: [
                "Admin can assign or update guest tags.",
                "Queue access can read guest tags.",
                "Photo completion can update tag/state."
              ]
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
                "MVP alternative is documented if upload is too much for July."
              ]
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
                "Console language matches the experience type."
              ]
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
                "Temporary demo-only controls are marked."
              ]
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
                "Represent the 5:30-7:30 level 1 registration area and connect it to guest entry/check-in.",
              acceptanceCriteria: [
                "Registration appears as an event experience.",
                "Check-in can kick off the passport activity.",
                "Guest-facing copy explains what to do next."
              ]
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
  inbox: [
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
      title: "Professional pays at desk for photo access",
      disposition: "consider",
      summary:
        "Pay at desk, check-in can mark professional-with-photo, and photo booth queue requires student or professional-with-photo.",
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
    }
  ],
  decisions: [
    {
      id: "decision-sotc-mvp",
      title: "What must be real by July 22?",
      status: "open",
      prompt:
        "Choose the smallest useful SOTC demo: organization/event setup, public event page, resource cards, and one or two queues."
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
      status: "open",
      prompt:
        "For July, decide whether admin marking at check-in is enough or whether payment/photo purchase needs a richer flow."
    }
  ]
};
