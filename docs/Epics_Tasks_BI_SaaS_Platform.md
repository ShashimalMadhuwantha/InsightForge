# Epic & Task Breakdown — Multi-Tenant BI SaaS Platform

**Branching convention used below:**
- Epic branch: `epic/<number>-<short-name>`
- Task branch (created off the epic branch): `feature/<epic>.<task>-<short-name>`
- Merge order: task branches → epic branch → `develop` → `main`

---

## Epic 0: Project Initialization & Core Infrastructure

**Branch:** `epic/0-init-infra`
**Goal:** Set up the foundational skeleton for FE, BE, DB, and Redis so all future epics can build on a working base.

| Task ID | Task Branch | Description |
|---|---|---|
| 0.1 | `feature/0.1-repo-structure` | Set up monorepo/folder structure (`/frontend`, `/backend`, `/docker`, `/docs`); add `.gitignore`, README, branching rules. |
| 0.2 | `feature/0.2-backend-skeleton` | Initialize Express.js project (TypeScript or JS), add basic folder structure (controllers/services/routes/models/middlewares). |
| 0.3 | `feature/0.3-frontend-skeleton` | Initialize React + Vite project, set up folder structure (components/pages/hooks/services/store), install base UI library. |
| 0.4 | `feature/0.4-sql-db-setup` | Set up SQL database (PostgreSQL/MySQL), create initial connection config, set up ORM/query builder (Prisma/Sequelize/Knex). |
| 0.5 | `feature/0.5-redis-setup` | Set up Redis instance, add connection client in backend, verify basic get/set operations. |
| 0.6 | `feature/0.6-docker-compose` | Create `Dockerfile`s for backend, frontend, and a `docker-compose.yml` that spins up SQL DB + Redis + backend + frontend together. |
| 0.7 | `feature/0.7-env-config` | Set up environment variable management (`.env`, `.env.example`) for DB, Redis, JWT secrets, ports across FE/BE. |
| 0.8 | `feature/0.8-ci-lint-setup` | Add linting/formatting (ESLint, Prettier), basic CI pipeline (GitHub Actions) to run lint/build on PRs. |
| 0.9 | `feature/0.9-base-migration-tool` | Set up DB migration tool (e.g., Prisma Migrate / Knex / node-pg-migrate) and create the first empty migration to confirm the pipeline works. |
| 0.10 | `feature/0.10-health-check-endpoints` | Add `/health` endpoint on backend confirming DB + Redis connectivity; add a basic FE "ping backend" test page. |
| 0.11 | `feature/0.11-migration-cli-scripts` | Add npm scripts (`migrate:make`, `migrate:up`, `migrate:down`, `migrate:status`) so every dev creates/applies/rolls back migrations the same way. |
| 0.12 | `feature/0.12-seed-scripts` | Add a separate `seed` mechanism (distinct from migrations) for reference/lookup data (e.g., default packages, roles), runnable independently per environment. |
| 0.13 | `feature/0.13-migration-ci-gate` | Add a CI step that runs all migrations against a throwaway DB on every PR, so broken migrations are caught before merge. |
| 0.14 | `feature/0.14-migration-docker-entrypoint` | Make the backend container auto-run pending migrations on startup in dev (`docker-compose`), and require an explicit manual/CI step in production (never auto-migrate prod on boot). |

**Definition of Done:** `docker-compose up` boots DB, Redis, backend, and frontend; backend health check confirms DB & Redis are reachable; frontend can call a sample backend API; migrations can be created, applied, and rolled back through a single documented CLI flow, and CI fails the build if a migration is broken.

### Migration Mechanism (Design Notes)

This defines *how* schema changes are managed for the lifetime of the project, not just the initial setup task above.

- **Tool**: pick one migration tool tied to the ORM/query-builder chosen in task 0.4 (e.g., Prisma Migrate if using Prisma, Knex migrations if using Knex/raw SQL). Do not mix tools.
- **Folder convention**: `backend/migrations/<timestamp>_<description>.js|sql` — timestamp-prefixed so ordering is unambiguous across branches.
- **Every migration must have an `up` and a `down`**: no one-way migrations except for irreversible destructive changes, which must be called out explicitly in the PR description.
- **One migration = one logical schema change** (e.g., "add tenant_id to widgets", not "add 6 unrelated tables"), so rollbacks stay safe and reviewable.
- **Environments**: the same migration files run across local, staging, and production — never hand-edit a schema directly in any environment.
- **Multi-tenant consideration**: since this project uses the shared-schema, `tenant_id`-scoped approach (see SRS §6.2), migrations only ever run once per environment against the shared schema — there is no per-tenant migration fan-out. If a future Enterprise tier moves to schema-per-tenant, a separate "migration runner" task will be needed to apply the same migration across every tenant schema; this is tracked as future scope, not part of v1.
- **Data migrations vs. schema migrations**: schema-only changes (add/drop column, index, table) live in the standard migration folder; one-off data backfills (e.g., populating a new column from existing data) are written as their own migration file, guarded to run once, and reviewed separately from seed data.
- **Rollback policy**: `migrate:down` must be tested in staging before any production deploy that includes a migration; production rollbacks are a manual, approved action, never automatic.
- **Versioning visibility**: `migrate:status` should be checked as part of the deployment pipeline (task 10.5) so it's always clear which migrations have/haven't been applied per environment.

---

## Epic 1: Authentication & Tenant Management

**Branch:** `epic/1-auth-tenant`
**Goal:** Allow businesses to register as tenants, log in, and manage their account, with full data isolation.

| Task ID | Task Branch | Description |
|---|---|---|
| 1.1 | `feature/1.1-tenant-schema` | Design & migrate `Tenant` and `User` tables (with `tenant_id` scoping strategy). |
| 1.2 | `feature/1.2-signup-api` | Build tenant signup API (creates Tenant + first Owner User). |
| 1.3 | `feature/1.3-login-api` | Build login API with JWT access + refresh token issuance. |
| 1.4 | `feature/1.4-auth-middleware` | Build Express middleware to verify JWT and inject `tenant_id`/`user_id`/`role` into request context. |
| 1.5 | `feature/1.5-tenant-scoping-middleware` | Build middleware/ORM hook to auto-scope all DB queries by `tenant_id`. |
| 1.6 | `feature/1.6-password-security` | Implement password hashing (bcrypt/argon2), password reset flow (email token). |
| 1.7 | `feature/1.7-signup-ui` | Build signup page in React (form, validation, error states). |
| 1.8 | `feature/1.8-login-ui` | Build login page in React, token storage strategy (httpOnly cookie or memory + refresh). |
| 1.9 | `feature/1.9-session-persistence` | Implement Redis-backed session/refresh-token store with logout/revocation support. |
| 1.10 | `feature/1.10-tenant-profile-settings` | Build tenant profile/settings page (business name, logo, contact info). |

**Definition of Done:** A business can sign up, log in, log out, reset password, and see their isolated workspace; no tenant can access another tenant's data.

---

## Epic 2: Package / Subscription Plan Management

**Branch:** `epic/2-packages`
**Goal:** Define subscription tiers and enforce their limits across the whole system.

| Task ID | Task Branch | Description |
|---|---|---|
| 2.1 | `feature/2.1-package-schema` | Design & migrate `Package` table (limits stored as JSON: max_sub_users, max_data_sources, max_file_size_mb, allowed_cleansing_ops, allowed_widget_types, insight_depth). |
| 2.2 | `feature/2.2-seed-default-packages` | Seed default packages: Free, Pro, Enterprise with example limits. |
| 2.3 | `feature/2.3-package-assignment` | Link `Tenant` to an active `Package`; build API to change tenant's package. |
| 2.4 | `feature/2.4-entitlement-service` | Build a reusable backend "entitlement checker" service used by all other modules to verify a feature/limit before allowing an action. |
| 2.5 | `feature/2.5-package-ui-selection` | Build UI page listing available packages with feature comparison, and an "upgrade/downgrade" action. |
| 2.6 | `feature/2.6-limit-reached-ui` | Build reusable FE component/modal for "you've hit your plan limit — upgrade" prompts. |
| 2.7 | `feature/2.7-billing-integration-stub` | Integrate payment gateway (e.g., Stripe) — checkout flow, webhook handling for plan activation/renewal. |

**Definition of Done:** Every gated feature (sub-users, cleansing ops, widgets, storage) checks the tenant's package server-side before allowing the action; upgrading a package immediately unlocks new limits.

---

## Epic 3: Data Source Management (Upload, Parsing, Status)

**Branch:** `epic/3-data-sources`
**Goal:** Let tenants upload Excel/CSV files and see a clear data status report.

| Task ID | Task Branch | Description |
|---|---|---|
| 3.1 | `feature/3.1-datasource-schema` | Design & migrate `DataSource` and `DataSourceVersion` tables. |
| 3.2 | `feature/3.2-file-upload-api` | Build file upload API (validate type/size against package limit), store raw file in object storage. |
| 3.3 | `feature/3.3-excel-parser-worker` | Build a background worker (Redis queue, e.g., BullMQ) to parse Excel/CSV: detect sheets, headers, column types, row count. |
| 3.4 | `feature/3.4-data-quality-analysis` | Compute data quality metrics: missing values per column, duplicate rows, type mismatches, overall quality score. |
| 3.5 | `feature/3.5-data-status-api` | Build API to fetch a data source's status/profile report. |
| 3.6 | `feature/3.6-upload-ui` | Build FE upload page with drag-and-drop, progress bar (polling/WebSocket for job status). |
| 3.7 | `feature/3.7-data-status-ui` | Build FE "Data Status" dashboard showing schema, quality score, missing values chart, duplicates count. |
| 3.8 | `feature/3.8-datasource-list-ui` | Build FE page listing all tenant data sources with status badges (raw/cleansed/processing/error). |
| 3.9 | `feature/3.9-refresh-datasource` | Implement re-upload/refresh flow that preserves existing widget/column mappings where possible. |

**Definition of Done:** A user can upload an Excel file, watch it process asynchronously, and view a clear data quality/status report.

---

## Epic 4: Data Cleansing (Package-Gated)

**Branch:** `epic/4-data-cleansing`
**Goal:** Provide cleansing operations, gated per package, with version history.

| Task ID | Task Branch | Description |
|---|---|---|
| 4.1 | `feature/4.1-cleansing-ops-engine` | Build backend engine supporting core operations: remove duplicates, handle missing values (mean/median/mode/drop/custom), trim/standardize text, fix data types. |
| 4.2 | `feature/4.2-outlier-detection` | Implement statistical outlier detection & removal option. |
| 4.3 | `feature/4.3-cleansing-job-queue` | Run cleansing operations as async Redis-queued jobs; store result as a new `DataSourceVersion`. |
| 4.4 | `feature/4.4-cleansing-entitlement-check` | Gate each cleansing operation behind the tenant's package entitlements. |
| 4.5 | `feature/4.5-version-history-api` | Build API to list/view/revert between data source versions (raw vs. cleansed), limited by package's retention length. |
| 4.6 | `feature/4.6-cleansing-ui` | Build FE panel to select and apply cleansing operations, with before/after preview. |
| 4.7 | `feature/4.7-version-history-ui` | Build FE version history view with revert action. |

**Definition of Done:** A user with an eligible package can clean their dataset with a few clicks, preview changes, and revert if needed.

---

## Epic 5: Chart & Widget Builder

**Branch:** `epic/5-widgets`
**Goal:** Let users generate charts/widgets from a data source with minimal configuration.

| Task ID | Task Branch | Description |
|---|---|---|
| 5.1 | `feature/5.1-widget-schema` | Design & migrate `Widget` table (type, config JSON: axes, aggregation, filters, linked data source). |
| 5.2 | `feature/5.2-chart-suggestion-engine` | Build backend logic to auto-suggest chart types based on column data types (date+numeric → line, categorical+numeric → bar, etc.). |
| 5.3 | `feature/5.3-widget-data-api` | Build API that takes a widget config and returns computed/aggregated chart-ready data. |
| 5.4 | `feature/5.4-widget-entitlement-check` | Gate available widget types by tenant's package. |
| 5.5 | `feature/5.5-chart-library-integration` | Integrate a charting library in React (e.g., Recharts/Chart.js) supporting bar/line/pie/scatter/KPI/table widgets. |
| 5.6 | `feature/5.6-widget-config-ui` | Build FE widget configuration panel (pick data source → pick widget type → map columns → preview). |
| 5.7 | `feature/5.7-widget-crud` | Implement full CRUD APIs + UI for creating/editing/deleting widgets. |

**Definition of Done:** A user can pick a dataset, get a suggested chart type, configure it, and see a live-rendered chart.

---

## Epic 6: Automated Business Insights

**Branch:** `epic/6-insights`
**Goal:** Auto-generate readable insights from a connected dataset.

| Task ID | Task Branch | Description |
|---|---|---|
| 6.1 | `feature/6.1-insight-schema` | Design & migrate `Insight` table. |
| 6.2 | `feature/6.2-basic-insight-rules` | Implement rule-based insights: top/bottom performers, period-over-period change, basic correlation between numeric columns. |
| 6.3 | `feature/6.3-insight-generation-job` | Run insight generation as a background job triggered after data upload/cleansing. |
| 6.4 | `feature/6.4-insight-entitlement-tiering` | Gate "basic" vs. "advanced" insight depth by package tier. |
| 6.5 | `feature/6.5-insight-ui` | Build FE component to display generated insights alongside relevant dashboards/widgets. |

**Definition of Done:** After uploading/cleaning data, a tenant automatically sees a list of plain-language insights relevant to their dataset.

---

## Epic 7: Dashboard Management

**Branch:** `epic/7-dashboards`
**Goal:** Let tenants organize widgets into shareable dashboards.

| Task ID | Task Branch | Description |
|---|---|---|
| 7.1 | `feature/7.1-dashboard-schema` | Design & migrate `Dashboard` table (name, folder/category, owner). |
| 7.2 | `feature/7.2-dashboard-crud-api` | Build CRUD APIs for dashboards. |
| 7.3 | `feature/7.3-dashboard-builder-ui` | Build drag-and-drop dashboard canvas (add/resize/reorder widgets) in React. |
| 7.4 | `feature/7.4-dashboard-list-ui` | Build dashboard list/home page with folders and favorites. |
| 7.5 | `feature/7.5-dashboard-sharing-internal` | Implement sharing a dashboard with specific sub-users (ties into Epic 8 permissions). |

**Definition of Done:** A tenant can create multiple dashboards, arrange widgets freely, and organize them into folders/favorites.

---

## Epic 8: Sub-User & Access Management (RBAC)

**Branch:** `epic/8-rbac`
**Goal:** Allow tenant owners to invite sub-users and control exactly what they can access.

| Task ID | Task Branch | Description |
|---|---|---|
| 8.1 | `feature/8.1-permission-schema` | Design & migrate `Permission` table (user_id, resource_type, resource_id, access_level). |
| 8.2 | `feature/8.2-invite-subuser-api` | Build API to invite a sub-user via email (invite token + expiry). |
| 8.3 | `feature/8.3-role-management-api` | Build API to assign roles (Admin/Analyst/Viewer) or custom permission sets. |
| 8.4 | `feature/8.4-permission-enforcement-middleware` | Build middleware to check resource-level permissions on every dashboard/data-source request. |
| 8.5 | `feature/8.5-subuser-limit-check` | Enforce max sub-user count per package. |
| 8.6 | `feature/8.6-invite-accept-ui` | Build FE invite acceptance flow (set password, join tenant). |
| 8.7 | `feature/8.7-user-management-ui` | Build FE page for tenant owner to view/manage sub-users, roles, and per-resource access grants. |

**Definition of Done:** A tenant owner can invite a colleague, assign them Viewer/Analyst role, grant access to specific dashboards only, and that sub-user cannot see anything else.

---

## Epic 9: Billing & Subscription Lifecycle

**Branch:** `epic/9-billing`
**Goal:** Handle payment collection and plan lifecycle events.

| Task ID | Task Branch | Description |
|---|---|---|
| 9.1 | `feature/9.1-payment-gateway-integration` | Integrate chosen payment gateway (e.g., Stripe) checkout session creation. |
| 9.2 | `feature/9.2-webhook-handling` | Handle payment gateway webhooks (payment success/failure, subscription renewal/cancellation). |
| 9.3 | `feature/9.3-invoice-history-ui` | Build FE billing history/invoices page. |
| 9.4 | `feature/9.4-plan-downgrade-logic` | Handle graceful downgrade: what happens to data/sub-users exceeding new plan's limits. |

**Definition of Done:** A tenant can subscribe, get billed, renew, cancel, and see invoice history; downgrades are handled without data loss/corruption.

---

## Epic 10: Deployment, Monitoring & DevOps

**Branch:** `epic/10-devops`
**Goal:** Make the system production-ready, observable, and easy to deploy.

| Task ID | Task Branch | Description |
|---|---|---|
| 10.1 | `feature/10.1-prod-docker-compose` | Create production-grade Docker Compose/Kubernetes manifests (or ECS task defs). |
| 10.2 | `feature/10.2-db-backup-strategy` | Set up automated SQL database backups and restore procedure. |
| 10.3 | `feature/10.3-logging-monitoring` | Add centralized logging (e.g., Winston + a log aggregator) and basic monitoring/alerting (uptime, error rate). |
| 10.4 | `feature/10.4-secrets-management` | Move secrets out of `.env` files into a proper secrets manager for production. |
| 10.5 | `feature/10.5-cd-pipeline` | Build CD pipeline to deploy backend/frontend automatically on merge to `main`, including an explicit "run pending migrations" step (with `migrate:status` check) before the new app version goes live. |
| 10.6 | `feature/10.6-load-testing` | Run load tests on file upload, parsing, and dashboard endpoints; tune worker concurrency. |

**Definition of Done:** The system can be deployed to a cloud environment with backups, logging, monitoring, and an automated deployment pipeline in place.

---

## Suggested Build Order

```
Epic 0 (Infra)
   → Epic 1 (Auth & Tenant)
   → Epic 2 (Packages) 
   → Epic 3 (Data Sources)
   → Epic 4 (Cleansing)
   → Epic 5 (Widgets)
   → Epic 6 (Insights)
   → Epic 7 (Dashboards)
   → Epic 8 (RBAC / Sub-users)
   → Epic 9 (Billing)
   → Epic 10 (DevOps / Production Readiness)
```

Epics 2 and 8 can be developed partially in parallel with Epic 3–5 once Epic 1 is stable, since packages and permissions are cross-cutting concerns used everywhere else.
