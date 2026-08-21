const fs = require("fs");
const path = require("path");
const vm = require("vm");

const FALLBACK_ROADMAP_PATH = path.join(__dirname, "../planning/roadmap-data.js");
const ROADMAP_MODULE_DIR = path.join(__dirname, "../planning/roadmap");
const OUTPUT_PATH = FALLBACK_ROADMAP_PATH;

const REQUIRED_MODULE_PATHS = {
  meta: "meta.js",
  sprints: "sprints.js",
  completedSprints: "completedSprints.js",
  epics: "epics.js",
  productReviews: "productReviews.js",
  inbox: "inbox.js",
  decisions: "decisions.js"
};

const ALLOWED_STORY_STATUSES = new Set([
  "idea",
  "discovery",
  "ready",
  "current",
  "future",
  "deferred",
  "done"
]);

function parseLegacyRoadmap(roadmapPath = FALLBACK_ROADMAP_PATH) {
  const text = fs.readFileSync(roadmapPath, "utf8");
  const startMarker = "const QME_ROADMAP = ";

  const start = text.indexOf(startMarker);
  const markerIndex = text.indexOf("if (typeof window)", start);
  const end = markerIndex >= 0 ? markerIndex : text.lastIndexOf("if (typeof module)");
  if (start < 0 || end < 0) {
    throw new Error("Failed to parse existing roadmap-data.js");
  }

  const body = text
    .slice(start + startMarker.length, end)
    .trim()
    .replace(/;+\s*$/, "");

  return vm.runInNewContext(`(${body})`);
}

function hasAllRoadmapModules() {
  return Object.values(REQUIRED_MODULE_PATHS).every((fileName) =>
    fs.existsSync(path.join(ROADMAP_MODULE_DIR, fileName))
  );
}

function loadRoadmapFromModules() {
  const roadmap = {};
  for (const [key, fileName] of Object.entries(REQUIRED_MODULE_PATHS)) {
    const modulePath = path.join(ROADMAP_MODULE_DIR, fileName);
    roadmap[key] = require(modulePath);
  }
  return roadmap;
}

function writeModuleFile(filePath, value) {
  const payload = `module.exports = ${JSON.stringify(value, null, 2)};\n`;
  fs.writeFileSync(filePath, payload, "utf8");
}

function writeRoadmapModules(roadmap) {
  for (const [key, fileName] of Object.entries(REQUIRED_MODULE_PATHS)) {
    const modulePath = path.join(ROADMAP_MODULE_DIR, fileName);
    writeModuleFile(modulePath, roadmap[key]);
  }
}

function findStory(roadmap, storyId) {
  for (const epic of roadmap.epics || []) {
    for (const theme of epic.themes || []) {
      for (const story of theme.stories || []) {
        if (story.id === storyId) {
          return { story, epic, theme };
        }
      }
    }
  }
  return null;
}

function ensureDeferredStorageStory(roadmap) {
  const storyId = "story-browser-persistence-edge-cases-degraded-storage";
  const futureSprint = (roadmap.sprints || []).find((s) => s.id === "future");
  const recoveryTheme = (() => {
    for (const epic of roadmap.epics || []) {
      for (const theme of epic.themes || []) {
        if (theme.id === "theme-guest-session-recovery") {
          return { epic, theme };
        }
      }
    }
    return { epic: null, theme: null };
  })();

  if (!recoveryTheme.theme) {
    throw new Error("Expected theme-guest-session-recovery to exist");
  }

  const existing = roadmap.epics
    ?.flatMap((epic) => epic.themes || [])
    ?.flatMap((theme) => theme.stories || [])
    ?.find((story) => story.id === storyId);

  if (!existing) {
    recoveryTheme.theme.stories.push({
      id: storyId,
      title: "Browser persistence edge cases and degraded-storage UX",
      status: "deferred",
      sprint: "future",
      summary:
        "Investigate browser persistence edge cases and degrade-state UX for guest recovery after successful initial participation.",
      acceptanceCriteria: [
        "Document storage and privacy scenarios where browser state for an existing guest becomes unusable after refresh, tab close, or re-entry.",
        "Track whether qMe preserves participation under blocked cookies, storage pressure, private mode, and similar browser constraints.",
        "Prioritize detection and UX options before any heavy client-side verification layer is added.",
        "Keep the story scoped to feasibility, diagnostics, and targeted recommendations rather than broad platform accounting changes."
      ],
      notes:
        "Capture what browser/device/privacy/storage conditions allow an initially usable qME session but later discard guest identity. Focus on repeatability, impacted event conditions, and practical intervention options:\n- whether iOS/Android/browser combinations differ;\n- whether storage pressure and content-blocking behave differently over time;\n- whether legacy storage behavior contributes;\n- why a private/blocked-storage session may reduce visible event context while still allowing reconnect attempts;\n- whether optional degraded-state guidance should be offered only when storage risk is detected."
    });
  }

  if (futureSprint) {
    if (!futureSprint.storyIds.includes(storyId)) {
      futureSprint.storyIds.push(storyId);
    }
  }
}

function applyDelegatedProductChanges(roadmap) {
  const persistence = findStory(
    roadmap,
    "story-guest-session-persistence-diagnostics"
  );
  if (persistence?.story) {
    persistence.story.status = "done";
    persistence.story.notes =
      "Rock Hall evidence showed repeat QR scans on the same phone/browser could produce an already-checked-in state without stable reconnect. Live acceptance confirmed: deliberate local/session-data clearance breaks browser identity and returns the guest to Check-In, then manual recovery via imported registration reconnects existing check-in and queue state. Normal iPhone Safari behavior after refresh, tab close/reopen, full browser close/reopen, and repeat QR entry now recovers reliably. This story is complete; recovery still assumes browser-state can be partially unreliable.";
  }

  const storageRecovery = findStory(
    roadmap,
    "story-storage-health-recovery-contact-prompt"
  );
  if (storageRecovery?.story) {
    storageRecovery.story.status = storageRecovery.story.status || "current";
    storageRecovery.story.notes =
      "Keep this story open, but frame it around two separate concepts: session viability and recovery identity/contact. Browser/session viability is about whether required local state can persist and be trusted; recoverable contact helps reconnect when viability is still present enough to support a session handoff. Optional phone/email improves recovery confidence but does not by itself fix an unusable browser storage condition. Design prompt behavior for targeted risk windows rather than broad forcing for all guests.";
  }

  ensureDeferredStorageStory(roadmap);

  return roadmap;
}

function collectStoryMap(roadmap) {
  const storyMap = new Map();
  for (const epic of roadmap.epics || []) {
    for (const theme of epic.themes || []) {
      for (const story of theme.stories || []) {
        if (!story.id) continue;
        const bucket = storyMap.get(story.id);
        if (bucket) {
          bucket.count += 1;
        } else {
          storyMap.set(story.id, { story, count: 1 });
        }
      }
    }
  }

  const missingSprintIds = [];
  const validSprintIds = new Set(
    (roadmap.sprints || []).map((sprint) => sprint.id)
  );

  const sprintIssues = [];
  for (const sprint of roadmap.sprints || []) {
    for (const storyId of sprint.storyIds || []) {
      const entry = storyMap.get(storyId);
      if (!entry) {
        missingSprintIds.push(`${storyId} in sprint ${sprint.id} not found`);
      } else if (entry.count > 1) {
        sprintIssues.push(`${storyId} appears multiple times in stories`);
      }
      if (!ALLOWED_STORY_STATUSES.has(entry?.story?.status)) {
        sprintIssues.push(`${storyId} has invalid status ${entry?.story?.status}`);
      }
      if (
        entry?.story?.sprint &&
        entry.story.sprint !== "backlog" &&
        !validSprintIds.has(entry.story.sprint)
      ) {
        sprintIssues.push(
          `${storyId} uses sprint ${entry.story.sprint}, which is not in roadmap.sprints`
        );
      }
    }
  }

  return { storyMap, missingSprintIds, sprintIssues };
}

function validateRoadmap(roadmap) {
  const { missingSprintIds, sprintIssues, storyMap } = collectStoryMap(roadmap);
  const errors = [];

  const seen = new Set();
  for (const [storyId, entry] of storyMap.entries()) {
    if (entry.count > 1 && !seen.has(storyId)) {
      errors.push(`Duplicate story ID: ${storyId} (${entry.count} occurrences)`);
      seen.add(storyId);
    }
  }

  const sprints = roadmap.sprints || [];
  const seenInSprint = new Set();
  const duplicateInSprints = [];
  const allStoryIds = new Set();
  for (const sprint of sprints) {
    for (const storyId of sprint.storyIds || []) {
      if (allStoryIds.has(storyId)) {
        duplicateInSprints.push(
          `${storyId} appears in multiple sprint lists`
        );
      } else {
        allStoryIds.add(storyId);
      }
      if (seenInSprint.has(`${sprint.id}:${storyId}`)) continue;
      seenInSprint.add(`${sprint.id}:${storyId}`);
    }
  }

  errors.push(...missingSprintIds);
  errors.push(...sprintIssues);
  errors.push(...duplicateInSprints);
  return errors;
}

function writeRoadmapData(roadmap) {
  const payload = `${`const QME_ROADMAP = ${JSON.stringify(
    roadmap,
    null,
    2
  )};\n\n`}if (typeof window !== "undefined") {\n  window.QME_ROADMAP = QME_ROADMAP;\n}\n\nif (typeof module !== "undefined") {\n  module.exports = QME_ROADMAP;\n}\n`;
  fs.writeFileSync(OUTPUT_PATH, payload, "utf8");
}

function buildRoadmap(options = {}) {
  const shouldBootstrap = !hasAllRoadmapModules();
  let roadmap;

  if (shouldBootstrap) {
    roadmap = parseLegacyRoadmap();
    roadmap = applyDelegatedProductChanges(roadmap);
    fs.mkdirSync(ROADMAP_MODULE_DIR, { recursive: true });
    writeRoadmapModules(roadmap);
    writeRoadmapData(roadmap);
    return roadmap;
  }

  roadmap = loadRoadmapFromModules();
  if (options.applyDelegatedChanges) {
    roadmap = applyDelegatedProductChanges(roadmap);
    writeRoadmapModules(roadmap);
  }

  const errors = validateRoadmap(roadmap);
  if (errors.length > 0 && options.throwOnInvalid) {
    const message = errors.map((error) => ` - ${error}`).join("\n");
    throw new Error(`Roadmap validation failed:\n${message}`);
  } else if (errors.length > 0) {
    console.error("Roadmap validation failed:\n" + errors.join("\n"));
  }

  if (!options.validateOnly) {
    writeRoadmapData(roadmap);
  }

  return roadmap;
}

if (require.main === module) {
  const args = new Set(process.argv.slice(2));
  const options = {
    validateOnly: args.has("--validate"),
    applyDelegatedChanges: args.has("--apply-delegated")
  };
  const roadmap = buildRoadmap(options);
  const errors = validateRoadmap(roadmap);
  if (errors.length > 0) {
    process.exit(1);
  }
  console.log("Planning roadmap validated and generated:", roadmap.meta?.product || "qME");
}

module.exports = {
  buildRoadmap,
  parseLegacyRoadmap,
  validateRoadmap,
  applyDelegatedProductChanges
};
