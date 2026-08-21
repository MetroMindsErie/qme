const fs = require("fs");
const path = require("path");
const vm = require("vm");

const FALLBACK_ROADMAP_PATH = path.join(
  __dirname,
  "../planning/roadmap-data.js"
);
const ROADMAP_MODULE_DIR = path.join(__dirname, "../planning/roadmap");
const STORY_EDITS_PATH = path.join(ROADMAP_MODULE_DIR, "story-edits.js");
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

function loadStoryEdits() {
  if (!fs.existsSync(STORY_EDITS_PATH)) {
    return { patches: {}, additions: [], sprintMembership: [] };
  }
  return require(STORY_EDITS_PATH);
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

function findStoryLocation(roadmap, storyId) {
  for (const epic of roadmap.epics || []) {
    for (const theme of epic.themes || []) {
      for (const story of theme.stories || []) {
        if (story.id === storyId) {
          return { epic, theme, story };
        }
      }
    }
  }
  return null;
}

function applyStoryEdits(roadmap, edits = {}) {
  const errors = [];
  const patches = edits.patches || {};
  const additions = edits.additions || [];
  const sprintMembership = edits.sprintMembership || [];

  for (const [storyId, patch] of Object.entries(patches)) {
    const location = findStoryLocation(roadmap, storyId);
    if (!location) {
      errors.push(`Story edit patch target not found: ${storyId}`);
      continue;
    }
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      errors.push(`Story edit patch must be an object: ${storyId}`);
      continue;
    }
    Object.assign(location.story, patch);
  }

  for (const addition of additions) {
    const { epicId, themeId, story } = addition || {};
    if (!epicId || !themeId || !story?.id) {
      errors.push("Story addition requires epicId, themeId, and story.id");
      continue;
    }
    if (findStoryLocation(roadmap, story.id)) {
      errors.push(`Story addition duplicates existing story ID: ${story.id}`);
      continue;
    }
    const epic = (roadmap.epics || []).find((item) => item.id === epicId);
    const theme = epic?.themes?.find((item) => item.id === themeId);
    if (!theme) {
      errors.push(`Story addition target not found: ${epicId}/${themeId}`);
      continue;
    }
    theme.stories = theme.stories || [];
    theme.stories.push(story);
  }

  for (const membership of sprintMembership) {
    const { sprintId, add = [], remove = [] } = membership || {};
    const sprint = (roadmap.sprints || []).find((item) => item.id === sprintId);
    if (!sprint) {
      errors.push(`Sprint membership target not found: ${sprintId}`);
      continue;
    }
    sprint.storyIds = sprint.storyIds || [];
    const removeSet = new Set(remove);
    sprint.storyIds = sprint.storyIds.filter((storyId) => !removeSet.has(storyId));
    for (const storyId of add) {
      if (!sprint.storyIds.includes(storyId)) {
        sprint.storyIds.push(storyId);
      }
    }
  }

  return errors;
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

  const duplicateInSprints = [];
  for (const sprint of roadmap.sprints || []) {
    const seenInSprint = new Set();
    for (const storyId of sprint.storyIds || []) {
      if (seenInSprint.has(storyId)) {
        duplicateInSprints.push(
          `${storyId} appears multiple times in sprint ${sprint.id}`
        );
      } else {
        seenInSprint.add(storyId);
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
  const editErrors = applyStoryEdits(roadmap, loadStoryEdits());
  const errors = [...editErrors, ...validateRoadmap(roadmap)];

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
  applyStoryEdits,
  buildRoadmap,
  parseLegacyRoadmap,
  validateRoadmap,
};
