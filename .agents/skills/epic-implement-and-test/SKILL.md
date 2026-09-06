---
name: epic-implement-and-test
description: >
  Use this skill whenever the user asks to build, implement, or work on a specific
  Epic (e.g., "Epic 0", "Epic 3 - Data Sources") from the project's Epic & Task
  Breakdown document. This skill drives full implementation of every task inside
  the given epic, writes and runs automated tests for each task, and keeps
  iterating — fixing failures and re-testing — until every task in the epic
  passes its tests and the epic's overall "Definition of Done" is met. Do not
  consider an epic finished just because code was written; it is only finished
  once tests pass and the Definition of Done is verified.
---

# Skill: Epic Implementation & Test-to-Completion

## Purpose

Given one Epic from `docs/Epics_Tasks_BI_SaaS_Platform.md` (e.g., "Epic 3: Data Source
Management"), implement every task listed under it, write real automated tests
for each task, run those tests, and loop — fix, re-test, repeat — until:

1. Every task under the epic is implemented.
2. Every task has passing automated tests.
3. The epic's stated **Definition of Done** is verifiably true.

This skill is not "write code once and move on." It is a closed loop: implement →
test → fix → re-test → confirm, repeated per task and then for the epic as a
whole, before declaring the epic complete.

## Tech Stack Context (assume this unless told otherwise)

- **Backend**: Express.js (Node.js)
- **Frontend**: React + Vite
- **Database**: SQL (PostgreSQL/MySQL) via the project's chosen ORM/query builder
- **Cache/Queue**: Redis (e.g., BullMQ for background jobs)
- **Containerization**: Docker / Docker Compose
- **Multi-tenancy**: shared schema, `tenant_id`-scoped queries

Testing tools to default to unless the project already specifies otherwise:

- Backend unit/integration tests: **Jest** + **Supertest** (for API routes), a
  disposable/test SQL database, and `ioredis-mock` or a test Redis instance for
  queue-related code.
- Frontend unit/component tests: **Vitest** + **React Testing Library**.
- End-to-end (only when the epic includes user-facing flows spanning FE+BE):
  **Playwright**.

## Folder Structure Conventions

Before placing any new file, check whether the repo already has an established
structure — if so, follow it. If the repo is new/empty, use one of the two
options below. **Default to Option A (feature-based)** for this project, since
epics map cleanly to self-contained domains (data-sources, cleansing, widgets,
insights, dashboards, rbac, billing) that each own their own routes, logic,
and tests — this keeps an epic's code physically grouped together, which
makes the per-epic test loop in this skill easier to run and reason about.
Only use Option B (layer-based) if the user/repo explicitly prefers it.

### Backend (Express.js)

**Option A — Feature-based (recommended default)**
```
backend/
  src/
    modules/
      auth/
        auth.routes.js
        auth.controller.js
        auth.service.js
        auth.middleware.js
        auth.test.js
      tenants/
      packages/
      data-sources/
        data-sources.routes.js
        data-sources.controller.js
        data-sources.service.js
        data-sources.worker.js       # Redis/BullMQ background job
        data-sources.test.js
      cleansing/
      widgets/
      insights/
      dashboards/
      rbac/
      billing/
    common/
      middlewares/                    # tenant-scoping, auth, error handler
      utils/
      config/                         # env, db, redis clients
    db/
      migrations/
      seeds/
    app.js
    server.js
  Dockerfile
  package.json
```
Each module owns its own routes/controller/service/tests. A task from a given
epic (e.g., Epic 3, Data Sources) lives entirely inside `modules/data-sources/`.

**Option B — Layer-based (classic MVC-style)**
```
backend/
  src/
    controllers/
      authController.js
      dataSourceController.js
      ...
    services/
      authService.js
      dataSourceService.js
      ...
    routes/
      authRoutes.js
      dataSourceRoutes.js
      ...
    models/                           # ORM models/schemas
    middlewares/
    workers/                          # Redis/BullMQ jobs
    config/
    db/
      migrations/
      seeds/
    app.js
    server.js
  tests/
    auth.test.js
    dataSource.test.js
    ...
  Dockerfile
  package.json
```
Here, a task's code is split across multiple top-level folders by layer
instead of grouped by feature; tests live in a parallel `tests/` tree.

### Frontend (React + Vite)

**Option A — Feature-based (recommended default)**
```
frontend/
  src/
    features/
      auth/
        LoginPage.jsx
        SignupPage.jsx
        authApi.js
        authSlice.js (or authStore.js)
        auth.test.jsx
      data-sources/
        DataSourceUploadPage.jsx
        DataStatusView.jsx
        dataSourcesApi.js
        dataSources.test.jsx
      cleansing/
      widgets/
      insights/
      dashboards/
      rbac/
      billing/
    components/                       # shared/reusable UI (buttons, modals, tables)
    hooks/                            # shared hooks
    layouts/                          # page shells/navigation
    services/                         # shared API client (axios/fetch wrapper)
    store/                            # global state setup (if using Redux/Zustand)
    routes/                           # route definitions/router config
    App.jsx
    main.jsx
  index.html
  vite.config.js
  package.json
```
A task from a given epic (e.g., Epic 5, Widgets) lives entirely inside
`features/widgets/`, including its own tests, colocated with the code.

**Option B — Type-based (classic separation)**
```
frontend/
  src/
    pages/
      LoginPage.jsx
      DataSourceUploadPage.jsx
      DashboardBuilderPage.jsx
      ...
    components/
      DataStatusCard.jsx
      WidgetConfigPanel.jsx
      ...
    hooks/
    services/                         # all API calls, grouped by domain file
      authApi.js
      dataSourcesApi.js
      ...
    store/
    routes/
    App.jsx
    main.jsx
  tests/
    pages/
    components/
  index.html
  vite.config.js
  package.json
```
Here, a single task's code is spread across `pages/`, `components/`, and
`services/` rather than grouped under one feature folder; tests live in a
parallel `tests/` tree mirroring `src/`.

### Rule for this skill regardless of option chosen
- State which option (A or B, per side) is in use the first time this skill
  runs on a fresh repo, so it stays consistent across all later epics.
- Never mix conventions within the same side of the stack (e.g., don't put
  some backend modules feature-based and others layer-based).
- Tests always live next to (Option A) or mirrored against (Option B) the
  code they test — never in a disconnected, hard-to-find location.

## Required Inputs Before Starting

If any of these are missing, ask for them before writing code:

1. **Which epic** (number + name) to work on.
2. **Location of the Epic & Task Breakdown doc** and the **SRS**, if not already
   in context — read both before starting; the epic's tasks and Definition of
   Done must come from those documents, not be invented.
3. **Current repo state** — check what already exists (e.g., is Epic 0
   infrastructure already in place?) before assuming a clean slate.

## Workflow

### Step 1 — Load Epic Context
- Open the Epic & Task Breakdown doc and extract:
  - The epic's goal statement
  - The full task table (Task ID, branch name, description)
  - The epic's "Definition of Done"
- Open the SRS and pull any functional requirements (FR-x.x) referenced by
  this epic's scope, so implementation matches the spec, not assumptions.

### Step 2 — Plan Branching
- Create/confirm the epic branch: `epic/<number>-<short-name>`.
- For each task, work on its own task branch: `feature/<epic>.<task>-<short-name>`.
- Do not merge a task branch into the epic branch until its own tests pass.

### Step 3 — Per-Task Loop (repeat for every task in the epic)
For each task, in the order listed in the breakdown doc:

1. **Implement** the task's functionality (backend route/service, frontend
   component, migration, worker, etc. — whatever the task specifies).
2. **Write tests** for that task specifically:
   - Backend: at least one happy-path test and one failure/edge-case test per
     new endpoint or service function (e.g., invalid input, unauthorized
     tenant, missing package entitlement).
   - Frontend: render tests + at least one interaction test (form submit,
     button click, state change) for new components.
   - Anything touching multi-tenancy: include a test proving tenant A cannot
     access tenant B's data.
   - Anything touching package/entitlement gating: include a test proving the
     feature is blocked when the package doesn't allow it, and allowed when it
     does.
3. **Run the tests.**
4. **If any test fails:** fix the implementation (or the test, if the test
   itself was wrong) and re-run. Do not proceed to the next task while a test
   in the current task is failing.
5. **Mark the task done** only when all its tests pass.

### Step 4 — Epic-Level Verification
Once every individual task's tests pass:

1. Run the **full test suite for the epic** (all task tests together), not
   just each one in isolation — integration between tasks in the same epic is
   where bugs hide.
2. Manually walk through the epic's **Definition of Done** line by line and
   confirm each condition is actually true in the running system (e.g., spin
   up `docker-compose`, exercise the feature end-to-end).
3. If the Definition of Done references cross-epic dependencies (e.g., Epic 3
   depending on Epic 1's auth), verify that integration explicitly rather than
   assuming it works.

### Step 5 — Iterate Until Fully Complete
- If Step 4 surfaces any gap (a missed task, a DoD condition not met, a test
  that passes in isolation but breaks when combined with another task), go
  back to Step 3 for the affected task(s). Repeat Steps 3–4 until nothing is
  left unresolved.
- Only after a full pass with no failures and every Definition of Done item
  verified should the epic be reported as complete.

### Step 6 — Report
When the epic is genuinely complete, report:

- List of tasks completed, with their branch names.
- Test summary (number of tests written, pass/fail count, coverage if
  available).
- Explicit confirmation of each Definition of Done item, e.g.:
  - [x] "docker-compose up boots DB, Redis, backend, frontend" — verified
  - [x] "backend health check confirms DB & Redis reachable" — verified
- Anything intentionally deferred (and why), so it isn't silently dropped.

## Hard Rules

- **Never mark a task or epic "done" without a passing test run to prove it.**
  Code that "should work" is not done.
- **Never skip the failure/edge-case tests** for tenant isolation and package
  entitlement checks — these are the two most common sources of security and
  billing bugs in this project.
- **Never merge a task branch with failing tests**, even temporarily.
- **Never invent tasks or Definition-of-Done criteria** — pull them from the
  Epic & Task Breakdown doc and SRS; if something seems missing or unclear,
  flag it rather than guessing.
- **Re-run the full epic test suite after every task**, not just the newest
  task's tests, to catch regressions early.
- **If a task depends on an earlier epic that isn't finished/verified, stop
  and flag it** rather than building on an unverified foundation.

## Example Invocation

> "Use the epic-implement-and-test skill on Epic 3: Data Source Management."

Expected behavior: the agent reads Epic 3's tasks (3.1–3.9) and its Definition
of Done from the breakdown doc, implements each task on its own branch with
tests, loops on failures, verifies the full Definition of Done against a
running system, and reports back only when Epic 3 is fully feature-complete
and tested.
