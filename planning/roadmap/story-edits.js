// Small Product Owner edit surface for roadmap story changes.
//
// Use patches for status/title/summary/notes/acceptance changes to existing stories.
// Use additions for new stories without editing a large epic module.
// Use sprintMembership to add/remove story references from sprint lists.
//
// The roadmap generator applies these edits generically; it must never contain
// product-specific story IDs or decisions.

module.exports = {
  patches: {},
  additions: [],
  sprintMembership: []
};
