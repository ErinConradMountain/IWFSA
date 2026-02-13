import assert from "node:assert/strict";
import test from "node:test";
import { parseBuildTrackerFromMarkdown } from "../src/build-tracker.mjs";

test("parseBuildTrackerFromMarkdown builds tracker from section 8 table", () => {
  const markdown = `
## 5) Phase and Checkpoint Plan

### Checkpoint 1.1 - Setup
Tasks:
- Build scaffold.
Validation:
- Validate scaffold.

### Checkpoint 1.2 - Auth and RBAC
Tasks:
- Add login flow.
- Add role checks.
Validation:
- Verify permissions.

### Checkpoint 1.3 - Member Provisioning
Tasks:
- Add import flow.
Validation:
- Verify import behavior.

## 8) Progress Tracking
Tracker Last Updated: 2026-02-07
Current Checkpoint: 1.2 - Auth and RBAC

| Checkpoint | Status | Notes |
| --- | --- | --- |
| 1.1 Setup | Done | Complete |
| 1.2 Auth and RBAC | In Progress | Working now |
| 1.3 Member Provisioning | Not Started | Next |
`;

  const tracker = parseBuildTrackerFromMarkdown(markdown, {
    sourcePath: "docs/build-playbook.md"
  });

  assert.equal(tracker.sourcePath, "docs/build-playbook.md");
  assert.equal(tracker.lastUpdatedLabel, "February 7, 2026");
  assert.deepEqual(tracker.doneItems, ["Checkpoint 1.1 - Setup is done."]);
  assert.equal(tracker.current?.title, "Checkpoint 1.2 - Auth and RBAC");
  assert.equal(tracker.current?.status, "In Progress");
  assert.deepEqual(tracker.current?.tasks, ["Add login flow.", "Add role checks."]);
  assert.deepEqual(tracker.nextSteps, [
    "Finish Checkpoint 1.2 - Auth and RBAC.",
    "Start Checkpoint 1.3 - Member Provisioning."
  ]);
});

test("parseBuildTrackerFromMarkdown warns when progress table is missing", () => {
  const markdown = `
## 5) Phase and Checkpoint Plan
### Checkpoint 1.1 - Setup
Tasks:
- Build scaffold.
`;

  const tracker = parseBuildTrackerFromMarkdown(markdown, {
    sourcePath: "docs/build-playbook.md"
  });

  assert.match(tracker.warning || "", /Progress table not found/);
  assert.equal(tracker.current?.title, "Checkpoint 1.1 - Setup");
});

test("parseBuildTrackerFromMarkdown prefers status table in-progress row over stale current checkpoint field", () => {
  const markdown = `
### Checkpoint 1.2 - Auth and RBAC
Tasks:
- Add login flow.

### Checkpoint 1.3 - Member Provisioning
Tasks:
- Add import flow.

## 8) Progress Tracking
Tracker Last Updated: 2026-02-07
Current Checkpoint: 1.2 - Auth and RBAC

| Checkpoint | Status | Notes |
| --- | --- | --- |
| 1.2 Auth and RBAC | Done | Complete |
| 1.3 Member Provisioning | In Progress | Working now |
`;

  const tracker = parseBuildTrackerFromMarkdown(markdown, {
    sourcePath: "docs/build-playbook.md"
  });

  assert.equal(tracker.current?.title, "Checkpoint 1.3 - Member Provisioning");
  assert.equal(tracker.current?.status, "In Progress");
});
