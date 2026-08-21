const fs = require("fs");
const path = require("path");
const vm = require("vm");

const FALLBACK_ROADMAP_PATH = path.join(
  __dirname,
  "../planning/roadmap-data.js"
);
const ROADMAP_MODULE_DIR = path.join(__dirname, "../planning/roadmap");
const OUTPUT_PATH = FALLBACK_ROADMAP_PATH;

const REQUIRED_MODULE_PATHS = {
  meta: "meta.js",
  sprints: "sprints.js",
  completedSprints: "completedSprints.js",
  epics: "epics.js",
  productReviews: "productReviews.js",
  inbox: "inbox.js",
  decisions: "decisions.js",
};

const ALLOWED_STORY_STATUSES = new Set([
  "idea",
  "discovery",
  "ready",
  "current",
  "future",
  "deferred",
  "done",
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
  const validSprintIds = new Set((roadmap.sprints || []).map((sprint) => sprint.id));

  const sprintIssues = [];
  for (const sprint of roadmap.sprints || []) {
    for (const storyId of sprint.storyIds || []) {
      const entry = storyMap.get(storyId);
      if (!entry) {
        missingSprintIds.push(`${storyId} in sprint ${sprint.id} not found`);
        continue;
      }

      if (entry.count > 1) {
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

  const allStoryIds = new Set();
  const duplicateInSprints = [];
  for (const sprint of roadmap.sprints || []) {
    for (const storyId of sprint.storyIds || []) {
      if (allStoryIds.has(storyId)) {
        duplicateInSprints.push(`${storyId} appears in multiple sprint lists`);
      } else {
        allStoryIds.add(storyId);
      }
    }
  }

  errors.push(...missingSprintIds);
  errors.push(...sprintIssues);
  errors.push(...duplicateInSprints);
  return errors;
}

function writeRoadmapData(roadmap) {
  const payload = `${`const QME_ROADMAP = ${JSON.stringify(roadmap, null, 2)};\n\n`}if (typeof window !== "undefined") {\n  window.QME_ROADMAP = QME_ROADMAP;\n}\n\nif (typeof module !== "undefined") {\n  module.exports = QME_ROADMAP;\n}\n`;
  fs.writeFileSync(OUTPUT_PATH, payload, "utf8");
}

function buildRoadmap(options = {}) {
  const shouldBootstrap = !hasAllRoadmapModules();
  let roadmap;

  if (shouldBootstrap) {
    roadmap = parseLegacyRoadmap();
    fs.mkdirSync(ROADMAP_MODULE_DIR, { recursive: true });
    writeRoadmapModules(roadmap);
    writeRoadmapData(roadmap);
    return roadmap;
  }

  roadmap = loadRoadmapFromModules();

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
    throwOnInvalid: true,
  };

  const roadmap = buildRoadmap(options);
  const errors = validateRoadmap(roadmap);
  if (errors.length > 0) {
    process.exit(1);
  }
  console.log(
    "Planning roadmap validated and generated:",
    roadmap.meta?.product || "qME"
  );
}

module.exports = {
  buildRoadmap,
  parseLegacyRoadmap,
  validateRoadmap,
};
