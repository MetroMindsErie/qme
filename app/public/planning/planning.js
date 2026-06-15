let data = null;
let allStories = [];
let storyById = new Map();

const state = {
  view: "roadmap",
  query: "",
  selectedStoryId: null,
  savingStoryId: null,
  inboxDisposition: "all",
  inboxImages: "all"
};

const statusClass = {
  idea: "status-idea",
  discovery: "status-discovery",
  ready: "status-ready",
  current: "status-current",
  future: "status-future",
  deferred: "status-deferred",
  done: "status-done"
};

function flattenStories() {
  const stories = [];
  data.epics.forEach((epic) => {
    epic.themes.forEach((theme) => {
      theme.stories.forEach((story) => {
        stories.push(Object.assign({}, story, {
          epicId: epic.id,
          epicTitle: epic.title,
          themeId: theme.id,
          themeTitle: theme.title
        }));
      });
    });
  });
  return stories;
}

function setRoadmapData(nextData) {
  data = nextData;
  allStories = flattenStories();
  storyById = new Map(allStories.map((story) => [story.id, story]));
  renderAll();
}

function matchesQuery(...values) {
  if (!state.query) return true;
  const haystack = values.filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(state.query.toLowerCase());
}

function statusBadge(status) {
  return `<span class="status ${statusClass[status] || ""}">${status || "idea"}</span>`;
}

function statusOptions(selectedStatus) {
  return Object.keys(statusClass)
    .map(
      (status) =>
        `<option value="${status}" ${status === selectedStatus ? "selected" : ""}>${status}</option>`
    )
    .join("");
}

function sprintOptions(selectedSprint) {
  const currentValue = selectedSprint || "backlog";
  const options = [
    { id: "backlog", title: "backlog" },
    ...(data.sprints || []).map((sprint) => ({ id: sprint.id, title: sprint.title || sprint.id }))
  ];

  return options
    .map(
      (sprint) =>
        `<option value="${escapeHtml(sprint.id)}" ${
          sprint.id === currentValue ? "selected" : ""
        }>${escapeHtml(sprint.title)}</option>`
    )
    .join("");
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function storyButton(story, extraClass = "") {
  return `
    <button class="story-card ${extraClass}" type="button" data-story-id="${story.id}">
      <div class="story-card-head">
        <span>${escapeHtml(story.title)}</span>
        ${statusBadge(story.status)}
      </div>
      <p>${escapeHtml(story.summary || "")}</p>
      <div class="story-meta">
        <span>${escapeHtml(story.epicTitle || "")}</span>
        <span>${escapeHtml(story.sprint || "backlog")}</span>
      </div>
    </button>
  `;
}

function renderMeta() {
  const anchor = data.meta.eventAnchor;
  document.getElementById("eventAnchor").innerHTML = `
    <strong>${escapeHtml(anchor.organization)}</strong>
    <span>${escapeHtml(anchor.event)} · ${escapeHtml(anchor.date)}</span>
    <span>${escapeHtml(anchor.venue)}</span>
  `;
  document.getElementById("immediateGoal").textContent = data.meta.immediateGoal;
  document.getElementById("stats").innerHTML = `
    <div><strong>${data.epics.length}</strong><span>Epics</span></div>
    <div><strong>${data.epics.reduce((count, epic) => count + epic.themes.length, 0)}</strong><span>Themes</span></div>
    <div><strong>${allStories.length}</strong><span>Stories</span></div>
    <div><strong>${data.decisions.length}</strong><span>Open Decisions</span></div>
  `;
}

function renderRoadmap() {
  const grid = document.getElementById("roadmapGrid");
  const epics = data.epics
    .map((epic) => {
      const themeHtml = epic.themes
        .map((theme) => {
          const stories = theme.stories.filter((story) =>
            matchesQuery(
              epic.title,
              epic.summary,
              theme.title,
              story.title,
              story.summary,
              story.notes
            )
          );
          const themeMatches = matchesQuery(epic.title, epic.summary, theme.title);
          if (!themeMatches && stories.length === 0) return "";
          return `
            <details class="theme" open>
              <summary>
                <span>${escapeHtml(theme.title)}</span>
                ${statusBadge(theme.status)}
              </summary>
              <div class="theme-stories">
                ${stories.map((story) => storyButton({ ...story, epicTitle: epic.title })).join("")}
              </div>
            </details>
          `;
        })
        .join("");

      const epicMatches = matchesQuery(epic.title, epic.summary);
      if (!epicMatches && !themeHtml.trim()) return "";

      return `
        <article class="epic-card">
          <details open>
            <summary class="epic-summary">
              <div>
                <h3>${escapeHtml(epic.title)}</h3>
                <p>${escapeHtml(epic.summary)}</p>
              </div>
              ${statusBadge(epic.status)}
            </summary>
            <div class="theme-list">${themeHtml}</div>
          </details>
        </article>
      `;
    })
    .join("");

  grid.innerHTML = epics || `<p class="empty">No roadmap items match this search.</p>`;
}

function renderSprints() {
  const grid = document.getElementById("sprintGrid");
  const currentSprint = data.sprints.find((sprint) => sprint.id === "now") || data.sprints[0];
  const currentSprintId = currentSprint ? currentSprint.id : "";
  const otherSprints = data.sprints.filter((sprint) => sprint.id !== currentSprintId);
  const completedSprints = data.completedSprints || [];

  function sprintColumn(sprint, variant = "") {
    const stories = sprint.storyIds
      .map((id) => storyById.get(id))
      .filter(Boolean)
      .filter((story) =>
        matchesQuery(sprint.title, sprint.goal, story.title, story.summary, story.epicTitle)
      );
    return `
      <article class="sprint-column ${variant}">
        <div class="sprint-head">
          <h3>${escapeHtml(sprint.title)}</h3>
          <p>${escapeHtml(sprint.goal)}</p>
        </div>
        <div class="sprint-stories">
          ${stories.map((story) => storyButton(story, "compact")).join("") || `<p class="empty">No matching stories.</p>`}
        </div>
      </article>
    `;
  }

  function completedColumn(sprint) {
    const stories = (sprint.storyIds || [])
      .map((id) => storyById.get(id))
      .filter(Boolean)
      .filter((story) =>
        matchesQuery(sprint.title, sprint.goal, sprint.summary, story.title, story.summary)
      );
    const notes = (sprint.notes || []).filter((note) => matchesQuery(sprint.title, sprint.summary, note));
    return `
      <article class="sprint-column completed">
        <div class="sprint-head">
          <span class="status status-done">${escapeHtml(sprint.completedDate || "done")}</span>
          <h3>${escapeHtml(sprint.title)}</h3>
          <p>${escapeHtml(sprint.summary || sprint.goal || "")}</p>
        </div>
        <div class="sprint-stories">
          ${notes.map((note) => `<p class="sprint-note">${escapeHtml(note)}</p>`).join("")}
          ${stories.map((story) => storyButton(story, "compact")).join("") || `<p class="empty">No matching completed stories.</p>`}
        </div>
      </article>
    `;
  }

  grid.innerHTML = `
    <div class="current-sprint-wrap">
      ${currentSprint ? sprintColumn(currentSprint, "current") : `<p class="empty">No current sprint defined.</p>`}
    </div>
    <div class="sprint-strip" aria-label="Upcoming and completed sprints">
      ${otherSprints.map((sprint) => sprintColumn(sprint)).join("")}
      ${completedSprints.map((sprint) => completedColumn(sprint)).join("")}
    </div>
  `;
}

function renderStories() {
  const table = document.getElementById("storyTable");
  const stories = allStories.filter((story) =>
    matchesQuery(story.title, story.summary, story.epicTitle, story.themeTitle, story.notes, story.sprint)
  );
  table.innerHTML = `
    <div class="table-row table-head">
      <span>Story</span>
      <span>Epic</span>
      <span>Theme</span>
      <span>Sprint</span>
      <span>Status</span>
    </div>
    ${stories
      .map(
        (story) => `
          <button class="table-row story-row" type="button" data-story-id="${story.id}">
            <span>${escapeHtml(story.title)}</span>
            <span>${escapeHtml(story.epicTitle)}</span>
            <span>${escapeHtml(story.themeTitle)}</span>
            <span>${escapeHtml(story.sprint || "backlog")}</span>
            <span>${statusBadge(story.status)}</span>
          </button>
        `
      )
      .join("")}
  `;
}

function renderInbox() {
  const grid = document.getElementById("inboxGrid");
  const notes = (data.inbox || [])
    .filter((item) =>
      matchesQuery(
        item.title,
        item.summary,
        item.disposition,
        item.linkedStoryIds ? item.linkedStoryIds.join(" ") : ""
      )
    )
    .filter((item) => state.inboxDisposition === "all" || item.disposition === state.inboxDisposition)
    .filter((item) => {
      const hasImages = Boolean(item.attachments && item.attachments.length);
      if (state.inboxImages === "with") return hasImages;
      if (state.inboxImages === "without") return !hasImages;
      return true;
    })
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  grid.innerHTML = notes.length
    ? notes
    .map(
      (item) => `
        <article class="inbox-card">
          <div class="story-card-head">
            <h3>${escapeHtml(item.title)}</h3>
            <span class="status status-${escapeHtml(item.disposition)}">${escapeHtml(item.disposition)}</span>
          </div>
          <p>${escapeHtml(item.summary)}</p>
          ${renderAttachments(item.attachments)}
          <div class="linked-list">
            ${(item.linkedStoryIds || [])
              .map((id) => {
                const story = storyById.get(id);
                if (!story) return "";
                return `<button type="button" data-story-id="${id}">${escapeHtml(story.title)}</button>`;
              })
              .join("")}
          </div>
        </article>
      `
    )
    .join("")
    : `<p class="empty">No inbox items match these filters.</p>`;
}

function renderAttachments(attachments = []) {
  if (!attachments.length) return "";
  return `
    <div class="attachment-grid">
      ${attachments
        .map(
          (attachment) => `
            <a class="attachment-thumb" href="${escapeHtml(attachment.dataUrl)}" target="_blank" rel="noreferrer">
              <img src="${escapeHtml(attachment.dataUrl)}" alt="${escapeHtml(attachment.name || "Attached image")}" />
            </a>
          `
        )
        .join("")}
    </div>
  `;
}

function renderReview() {
  const currentSprint = data.sprints.find((sprint) => sprint.id === "now");
  const currentStories = ((currentSprint && currentSprint.storyIds) || [])
    .map((id) => storyById.get(id))
    .filter(Boolean);
  document.getElementById("reviewCurrent").innerHTML = `
    <p class="review-goal">${escapeHtml((currentSprint && currentSprint.goal) || "")}</p>
    <div class="review-list">
      ${currentStories.map((story) => storyButton(story, "compact")).join("")}
    </div>
  `;

  document.getElementById("decisionList").innerHTML = data.decisions
    .filter((decision) => matchesQuery(decision.title, decision.prompt, decision.status))
    .map(
      (decision) => `
        <article class="decision-card">
          <div class="story-card-head">
            <h4>${escapeHtml(decision.title)}</h4>
            <span class="status status-${escapeHtml(decision.status)}">${escapeHtml(decision.status)}</span>
          </div>
          <p>${escapeHtml(decision.prompt)}</p>
        </article>
      `
    )
    .join("");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

async function compressImage(file) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);
  const compressed = canvas.toDataURL("image/jpeg", 0.78);
  return {
    name: file.name || "capture.jpg",
    type: "image/jpeg",
    dataUrl: compressed,
    size: compressed.length,
    originalType: file.type || "",
    createdAt: new Date().toISOString()
  };
}

async function collectCaptureAttachments(form) {
  const input = form.querySelector("input[name='images']");
  const files = Array.from(input && input.files ? input.files : []).slice(0, 4);
  const attachments = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    attachments.push(await compressImage(file));
  }

  const totalSize = attachments.reduce((sum, attachment) => sum + attachment.size, 0);
  if (totalSize > 3_000_000) {
    throw new Error("Images are too large after compression");
  }

  return attachments;
}

async function saveQuickCapture(form) {
  const message = document.getElementById("quickCaptureMessage");
  const button = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  const inboxItem = {
    title: formData.get("title"),
    disposition: formData.get("disposition"),
    summary: formData.get("summary"),
    attachments: []
  };

  message.textContent = "Preparing...";
  button.disabled = true;

  try {
    inboxItem.attachments = await collectCaptureAttachments(form);
    message.textContent = "Saving...";
    const response = await fetchRoadmap({
      method: "PATCH",
      body: JSON.stringify({ inboxItem })
    });
    setRoadmapData(response.roadmap);
    form.reset();
    document.getElementById("quickCapturePreview").innerHTML = "";
    document.getElementById("quickCaptureMessage").textContent = "Saved to Product Inbox. Ready for another.";
  } catch {
    message.textContent = "Could not save this note. Try fewer/smaller images or refresh and try again.";
  } finally {
    button.disabled = false;
  }
}

async function previewCaptureImages(input) {
  const preview = document.getElementById("quickCapturePreview");
  if (!preview) return;
  const files = Array.from(input.files || []).filter((file) => file.type.startsWith("image/")).slice(0, 4);
  preview.innerHTML = files
    .map((file) => `<div class="capture-preview-item">${escapeHtml(file.name || "image")}</div>`)
    .join("");
}

function renderDrawer(storyId) {
  const drawer = document.getElementById("storyDrawer");
  const content = document.getElementById("drawerContent");
  const story = storyById.get(storyId);
  if (!story) return;
  state.selectedStoryId = storyId;
  content.innerHTML = `
    <p class="label">Story Detail</p>
    <h2>${escapeHtml(story.title)}</h2>
    <div class="drawer-badges">
      ${statusBadge(story.status)}
      <span class="status">${escapeHtml(story.sprint || "backlog")}</span>
    </div>
    <p class="drawer-summary">${escapeHtml(story.summary || "")}</p>
    <dl class="story-context">
      <div><dt>Epic</dt><dd>${escapeHtml(story.epicTitle)}</dd></div>
      <div><dt>Theme</dt><dd>${escapeHtml(story.themeTitle)}</dd></div>
    </dl>
    <h3>Acceptance Criteria</h3>
    <ul>
      ${(story.acceptanceCriteria || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
    ${story.notes ? `<h3>Notes</h3><p>${escapeHtml(story.notes)}</p>` : ""}
    <h3>Edit Story</h3>
    <form class="story-editor" data-editor-story-id="${escapeHtml(story.id)}">
      <label>
        <span>Title</span>
        <input name="title" type="text" maxlength="160" value="${escapeHtml(story.title)}" required />
      </label>
      <div class="editor-grid">
        <label>
          <span>Status</span>
          <select name="status">${statusOptions(story.status || "idea")}</select>
        </label>
        <label>
          <span>Sprint</span>
          <select name="sprint">${sprintOptions(story.sprint)}</select>
        </label>
      </div>
      <label>
        <span>Summary</span>
        <textarea name="summary" rows="4" maxlength="1200">${escapeHtml(story.summary || "")}</textarea>
      </label>
      <label>
        <span>Notes</span>
        <textarea name="notes" rows="5" maxlength="2000">${escapeHtml(story.notes || "")}</textarea>
      </label>
      <p class="editor-message" data-editor-message></p>
      <button class="editor-save" type="submit">${
        state.savingStoryId === story.id ? "Saving..." : "Save Story"
      }</button>
    </form>
    ${
      story.references
        ? `<h3>References</h3><ul>${story.references
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul>`
        : ""
    }
  `;
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
}

async function saveStoryEdit(form) {
  const storyId = form.dataset.editorStoryId;
  const message = form.querySelector("[data-editor-message]");
  const formData = new FormData(form);
  const updates = {
    title: formData.get("title"),
    status: formData.get("status"),
    sprint: formData.get("sprint"),
    summary: formData.get("summary"),
    notes: formData.get("notes")
  };

  state.savingStoryId = storyId;
  message.textContent = "Saving...";
  form.querySelector("button[type='submit']").disabled = true;

  try {
    const response = await fetchRoadmap({
      method: "PATCH",
      body: JSON.stringify({ storyId, updates })
    });
    state.savingStoryId = null;
    setRoadmapData(response.roadmap);
    renderDrawer(storyId);
    const updatedMessage = document.querySelector("[data-editor-message]");
    if (updatedMessage) updatedMessage.textContent = "Saved.";
  } catch {
    message.textContent = "Could not save this story. Refresh and try again.";
    form.querySelector("button[type='submit']").disabled = false;
  } finally {
    state.savingStoryId = null;
  }
}

function closeDrawer() {
  const drawer = document.getElementById("storyDrawer");
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  state.selectedStoryId = null;
}

function setView(view) {
  state.view = view;
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === `${view}View`);
  });
}

function renderAll() {
  try {
    renderMeta();
    renderRoadmap();
    renderSprints();
    renderStories();
    renderInbox();
    renderReview();
  } catch (error) {
    console.error(error);
    const activeView = document.querySelector(".view.active");
    if (activeView) {
      activeView.innerHTML = `
        <div class="render-error">
          <h2>Roadmap data could not render</h2>
          <p>Refresh the page and try again. If this keeps happening, the browser may be using an old cached script.</p>
        </div>
      `;
    }
    throw error;
  }
}

async function fetchRoadmap(options = {}) {
  const response = await fetch("/api/planning-data", {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options
  });

  if (!response.ok) {
    throw new Error("Roadmap access denied");
  }

  return response.json();
}

async function initAccessGate() {
  const gate = document.getElementById("accessGate");
  const form = document.getElementById("accessForm");
  const input = document.getElementById("accessCode");
  const error = document.getElementById("gateError");

  function unlock() {
    document.body.classList.remove("planning-locked");
    gate.classList.add("unlocked");
    gate.setAttribute("aria-hidden", "true");
  }

  try {
    const roadmap = await fetchRoadmap();
    setRoadmapData(roadmap);
    unlock();
    return;
  } catch {
    gate.classList.remove("unlocked");
  }

  input.focus();
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "";
    try {
      const roadmap = await fetchRoadmap({
        method: "POST",
        body: JSON.stringify({ code: input.value.trim() })
      });
      setRoadmapData(roadmap);
      unlock();
      return;
    } catch {
      error.textContent = "That code did not work.";
      input.select();
    }
  });
}

document.addEventListener("click", (event) => {
  const storyButtonEl = event.target.closest("[data-story-id]");
  if (storyButtonEl) {
    renderDrawer(storyButtonEl.dataset.storyId);
  }

  const tab = event.target.closest(".tab");
  if (tab) setView(tab.dataset.view);
});

document.addEventListener("submit", (event) => {
  const editor = event.target.closest("[data-editor-story-id]");
  const captureForm = event.target.closest("#quickCaptureForm");
  if (editor) {
    event.preventDefault();
    saveStoryEdit(editor);
    return;
  }
  if (captureForm) {
    event.preventDefault();
    saveQuickCapture(captureForm);
  }
});

document.getElementById("drawerClose").addEventListener("click", closeDrawer);
document.getElementById("searchInput").addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  renderAll();
});

document.getElementById("inboxDispositionFilter").addEventListener("change", (event) => {
  state.inboxDisposition = event.target.value;
  renderInbox();
});

document.getElementById("inboxImageFilter").addEventListener("change", (event) => {
  state.inboxImages = event.target.value;
  renderInbox();
});

document.getElementById("clearInboxFilters").addEventListener("click", () => {
  state.inboxDisposition = "all";
  state.inboxImages = "all";
  document.getElementById("inboxDispositionFilter").value = "all";
  document.getElementById("inboxImageFilter").value = "all";
  renderInbox();
});

document.addEventListener("change", (event) => {
  if (event.target.matches("#quickCaptureForm input[name='images']")) {
    previewCaptureImages(event.target);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeDrawer();
});

initAccessGate();
