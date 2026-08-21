module.exports = [
  {
    "id": "now",
    "title": "Sprint 3: Post-SOTC Operational Hardening",
    "goal": "Turn the July 22 SOTC production learning into a more reliable operating system: preserve production evidence, create an internal full-data baseline, improve guest recovery, add admin CSV exports, evaluate SMS costs/compliance, and make operator controls more visible without starting broad new platform expansion.",
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
      "story-station-operational-control-visibility"
    ]
  },
  {
    "id": "next",
    "title": "Next: Experience Type Review and Configuration",
    "goal": "After Sprint 3 hardening, review concrete experience types and decide which configuration deserves productization, starting with Check-In, Headshots, Food & Beverage, Resume Reviews, and lightweight event content.",
    "storyIds": [
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
    "id": "soon",
    "title": "Soon: SOTC Program Depth",
    "goal": "Expand SOTC from the first event model into registration, attendee import, networking, schedules, and event activities.",
    "storyIds": [
      "story-workshop-signups",
      "story-personal-agenda"
    ]
  },
  {
    "id": "future",
    "title": "Future: Optimization and Magic",
    "goal": "Use guest intent, location, surveys, and timing to help people maximize the event without losing their place.",
    "storyIds": [
      "story-workshop-signups",
      "story-guest-intentions",
      "story-location-beacons",
      "story-networking-matching",
      "story-food-filters",
      "story-browser-persistence-edge-cases-degraded-storage"
    ]
  }
];
