const data = window.QME_ROADMAP;
const ACCESS_CODE = "3298";
const ACCESS_KEY = "qme-planning-access";

const state = {
  view: "roadmap",
  query: "",
  selectedStoryId: null
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
        stories.push({
          ...story,
          epicId: epic.id,
          epicTitle: epic.title,
          themeId: theme.id,
          themeTitle: theme.title
        });
      });
    });
  });
  return stories;
}

const allStories = flattenStories();
const storyById = new Map(allStories.map((story) => [story.id, story]));

function matchesQuery(...values) {
  if (!state.query) return true;
  const haystack = values.filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(state.query.toLowerCase());
}

function statusBadge(status) {
  return `<span class="status ${statusClass[status] || ""}">${status || "idea"}</span>`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  grid.innerHTML = data.sprints
    .map((sprint) => {
      const stories = sprint.storyIds
        .map((id) => storyById.get(id))
        .filter(Boolean)
        .filter((story) =>
          matchesQuery(sprint.title, sprint.goal, story.title, story.summary, story.epicTitle)
        );
      return `
        <article class="sprint-column">
          <div class="sprint-head">
            <h3>${escapeHtml(sprint.title)}</h3>
            <p>${escapeHtml(sprint.goal)}</p>
          </div>
          <div class="sprint-stories">
            ${stories.map((story) => storyButton(story, "compact")).join("") || `<p class="empty">No matching stories.</p>`}
          </div>
        </article>
      `;
    })
    .join("");
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
  const notes = data.inbox.filter((item) =>
    matchesQuery(item.title, item.summary, item.disposition, item.linkedStoryIds?.join(" "))
  );
  grid.innerHTML = notes
    .map(
      (item) => `
        <article class="inbox-card">
          <div class="story-card-head">
            <h3>${escapeHtml(item.title)}</h3>
            <span class="status status-${escapeHtml(item.disposition)}">${escapeHtml(item.disposition)}</span>
          </div>
          <p>${escapeHtml(item.summary)}</p>
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
    .join("");
}

function renderReview() {
  const currentSprint = data.sprints.find((sprint) => sprint.id === "now");
  const currentStories = (currentSprint?.storyIds || []).map((id) => storyById.get(id)).filter(Boolean);
  document.getElementById("reviewCurrent").innerHTML = `
    <p class="review-goal">${escapeHtml(currentSprint?.goal || "")}</p>
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
            <span class="status status-discovery">${escapeHtml(decision.status)}</span>
          </div>
          <p>${escapeHtml(decision.prompt)}</p>
        </article>
      `
    )
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
  renderMeta();
  renderRoadmap();
  renderSprints();
  renderStories();
  renderInbox();
  renderReview();
}

function initAccessGate() {
  const gate = document.getElementById("accessGate");
  const form = document.getElementById("accessForm");
  const input = document.getElementById("accessCode");
  const error = document.getElementById("gateError");

  function unlock() {
    gate.classList.add("unlocked");
    gate.setAttribute("aria-hidden", "true");
  }

  if (window.localStorage.getItem(ACCESS_KEY) === "granted") {
    unlock();
    return;
  }

  input.focus();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (input.value.trim() === ACCESS_CODE) {
      window.localStorage.setItem(ACCESS_KEY, "granted");
      unlock();
      return;
    }
    error.textContent = "That code did not work.";
    input.select();
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

document.getElementById("drawerClose").addEventListener("click", closeDrawer);
document.getElementById("searchInput").addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  renderAll();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeDrawer();
});

renderAll();
initAccessGate();
