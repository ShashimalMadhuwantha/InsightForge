# Software Requirements Specification (SRS)

## Multi-Tenant Business Intelligence SaaS Platform

**Version:** 1.0
**Date:** September 6, 2026
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements for a **Multi-Tenant Business Intelligence (BI) SaaS Platform**. The platform allows client businesses ("tenants") to connect their own data sources (starting with Excel files), automatically clean and profile that data, generate charts/widgets and business insights, and manage dashboard access for sub-users — all gated by subscription package tiers.

### 1.2 Scope

The system will:

- Allow a business (tenant) to register and operate in an isolated workspace.
- Allow tenants to upload/connect data sources (initially Excel; extensible to databases/APIs later).
- Show data status (schema, row count, missing values, data quality score) after ingestion.
- Offer optional data cleansing operations, gated by the tenant's subscription package.
- Let users select from pre-built chart/widget types and auto-generate them from the uploaded dataset.
- Auto-generate business insights (trends, outliers, summary statistics) from the data.
- Allow the tenant owner to create sub-users and assign granular access to dashboards and resources.
- Enforce all of the above (data cleansing options, chart types, number of sub-users, storage, etc.) according to the tenant's purchased package/plan.

### 1.3 Intended Audience

- Development team (frontend, backend, DevOps)
- QA / testers
- Product owner / stakeholders
- Future maintainers

### 1.4 Definitions and Acronyms

| Term | Definition |
|---|---|
| Tenant | A client business/organization using the platform, isolated from other tenants |
| Sub-user | A user account created by a tenant owner/admin, with restricted permissions |
| Widget | A visual component (chart, KPI card, table) placed on a dashboard |
| RBAC | Role-Based Access Control |
| Package/Plan | A subscription tier that determines feature limits and access |
| Data Cleansing | Process of fixing/removing inaccurate, incomplete, or duplicate data |
| BI | Business Intelligence |

### 1.5 Overview

Section 2 gives an overall description of the product. Section 3 lists detailed functional requirements. Section 4 covers external interface requirements. Section 5 covers non-functional requirements. Section 6 covers the system architecture and tech stack. Section 7 covers the data model. Section 8 lists assumptions, constraints and future scope.

---

## 2. Overall Description

### 2.1 Product Perspective

This is a new, standalone, cloud-hosted, multi-tenant SaaS product. It is not a replacement for full BI tools like Power BI/Tableau, but a lightweight, guided BI tool aimed at small-to-mid businesses who want quick insights without hiring a data analyst.

### 2.2 Product Functions (High-Level)

1. Tenant registration, onboarding, and subscription management
2. Data source upload/connection (Excel first)
3. Data profiling and status dashboard (schema detection, quality metrics)
4. Data cleansing tools (package-gated)
5. Chart/widget builder with auto-suggested chart types
6. Automated insight generation (rule-based and/or statistical)
7. Dashboard creation, sharing, and layout management
8. Sub-user management with role/permission-based access
9. Package/plan enforcement across all features
10. Admin/billing panel for tenant owners

### 2.3 User Classes and Characteristics

| Role | Description | Typical Permissions |
|---|---|---|
| Super Admin (Platform) | Anthropic-side/your own staff managing the SaaS itself | Manage tenants, plans, system health |
| Tenant Owner | The business account that signs up and pays for a package | Full control within their tenant: billing, data sources, sub-users, all dashboards |
| Tenant Admin (optional role) | Sub-user with elevated rights | Manage data sources, dashboards, other sub-users (if delegated) |
| Sub-user / Analyst | Employee invited by tenant owner | Access only to assigned dashboards/data sources |
| Viewer | Read-only sub-user | View assigned dashboards only, no edit rights |

### 2.4 Operating Environment

- Web application, accessed via modern browsers (Chrome, Edge, Firefox, Safari)
- Backend hosted on Linux-based containers (Docker)
- Deployable on any cloud provider supporting Docker (AWS/Azure/GCP) or on-prem

### 2.5 Design and Implementation Constraints

- Must support strict tenant data isolation (no cross-tenant data leakage).
- Excel parsing must handle large files without blocking the main request thread (use background jobs/queues).
- All package-gated features must be enforced server-side, not just hidden in the UI.

### 2.6 Assumptions and Dependencies

- Initial version supports `.xlsx`/`.xls`/`.csv` uploads; live DB/API connectors are future scope.
- Tenants have basic familiarity with spreadsheets but not with data science/BI tools.
- A payment gateway (e.g., Stripe/PayPal) will be integrated for subscription billing (not detailed in this SRS unless required).

---

## 3. Functional Requirements

### 3.1 Tenant & Account Management

- **FR-1.1**: The system shall allow a new business to register and automatically provision an isolated tenant workspace.
- **FR-1.2**: The system shall support tenant login via email/password, with optional OAuth (Google) in future scope.
- **FR-1.3**: The system shall allow the tenant owner to select/upgrade/downgrade a subscription package.
- **FR-1.4**: The system shall enforce feature and resource limits based on the tenant's active package (e.g., max data sources, max sub-users, max storage, cleansing tools available).

### 3.2 Data Source Management

- **FR-2.1**: The system shall allow a tenant user (with permission) to upload an Excel file (.xlsx/.xls) or CSV as a data source.
- **FR-2.2**: The system shall parse the uploaded file and detect: sheet names, column headers, inferred data types per column, row count.
- **FR-2.3**: The system shall display a **Data Status** view showing:
  - Total rows/columns
  - Missing/null value counts per column
  - Duplicate row count
  - Detected data type mismatches
  - An overall "data quality score"
- **FR-2.4**: The system shall allow the user to trigger data cleansing actions, **only if included in their package**, such as:
  - Remove duplicate rows
  - Fill/handle missing values (mean/median/mode/custom/drop)
  - Trim whitespace, standardize text case
  - Convert/correct data types
  - Remove outliers (statistical threshold-based)
- **FR-2.5**: The system shall version each data source so a tenant can see raw vs. cleansed data, and revert if needed (package-dependent).
- **FR-2.6**: The system shall support re-uploading/refreshing a data source while preserving dashboard/widget mappings where columns match.

### 3.3 Chart & Widget Generation

- **FR-3.1**: The system shall provide a set of predefined widget types (e.g., bar chart, line chart, pie chart, KPI card, data table, scatter plot).
- **FR-3.2**: The system shall let the user pick a dataset, then pick a widget type, then map columns (X-axis, Y-axis, group-by, aggregation).
- **FR-3.3**: The system shall auto-suggest suitable chart types based on detected column data types (e.g., date + numeric → line chart; categorical + numeric → bar chart).
- **FR-3.4**: The system shall render generated charts on a dashboard canvas that supports drag, resize, and reorder of widgets.
- **FR-3.5**: The number/type of widgets available shall be limited according to the tenant's package.

### 3.4 Automated Insights

- **FR-4.1**: The system shall automatically generate textual insights from a connected dataset, such as:
  - Top/bottom performing categories
  - Month-over-month or period-over-period trend changes
  - Anomalies/outliers detected
  - Correlations between numeric columns
- **FR-4.2**: The system shall display insights alongside relevant dashboards/widgets.
- **FR-4.3**: Advanced/AI-driven insight depth (e.g., predictive forecasting) shall be gated to higher-tier packages.

### 3.5 Dashboard Management

- **FR-5.1**: The system shall allow tenant users to create multiple dashboards, each containing multiple widgets.
- **FR-5.2**: The system shall allow dashboards to be named, organized into folders/categories, and marked as favorite.
- **FR-5.3**: The system shall allow a dashboard to be shared internally (with sub-users) or, in future scope, externally via a public/shareable link.

### 3.6 Sub-User & Access Management

- **FR-6.1**: The system shall allow the tenant owner/admin to invite sub-users via email.
- **FR-6.2**: The system shall allow assigning roles (Admin, Analyst, Viewer) or custom permission sets to sub-users.
- **FR-6.3**: The system shall allow granting/revoking access to specific dashboards and specific data sources per sub-user.
- **FR-6.4**: The system shall enforce that a sub-user can only see/act on resources explicitly granted to them.
- **FR-6.5**: The number of sub-users allowed shall be limited by the tenant's package.

### 3.7 Package/Plan Management

- **FR-7.1**: The system shall define packages (e.g., Free, Pro, Enterprise) with configurable limits:
  - Max data sources
  - Max file size per upload
  - Max sub-users
  - Available cleansing operations
  - Available widget types
  - Insight depth (basic vs. advanced)
  - Data retention/version history length
- **FR-7.2**: The system shall check package entitlements on the server side before allowing any gated action.
- **FR-7.3**: The system shall notify the user when they hit a package limit and prompt an upgrade.

---

## 4. External Interface Requirements

### 4.1 User Interfaces

- Responsive web UI built with React + Vite.
- Key screens: Login/Signup, Tenant Dashboard Home, Data Source Manager, Data Status/Cleansing screen, Dashboard Builder (drag-and-drop), Widget Config Panel, Sub-user & Roles Management, Billing/Package screen.

### 4.2 Hardware Interfaces

- None beyond standard client devices (desktop/laptop/tablet) capable of running a modern browser.

### 4.3 Software Interfaces

- **Database**: SQL (e.g., PostgreSQL/MySQL) for relational/tenant/metadata storage.
- **Cache/Queue**: Redis for caching, session storage, and background job queues (e.g., Excel parsing, cleansing jobs).
- **Backend API**: Express.js (Node.js) REST (or GraphQL) API.
- **Frontend**: React.js with Vite build tooling.
- **Containerization**: Docker for DB, Redis, and service orchestration (Docker Compose for dev; Kubernetes optional for prod scale).
- **File Storage**: Object storage (e.g., S3-compatible) for raw uploaded Excel files.

### 4.4 Communication Interfaces

- HTTPS/TLS for all client-server communication.
- WebSocket (optional, future scope) for real-time dashboard updates/notifications.

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | Tenant data isolation enforced at the database query layer (tenant_id scoping) and/or schema separation. Passwords hashed (bcrypt/argon2). JWT-based auth with short-lived access tokens + refresh tokens. All file uploads scanned/validated before processing. |
| **Performance** | Excel files up to package-defined size limit should be processed asynchronously with progress feedback; dashboard should load within 2–3 seconds for typical datasets. |
| **Scalability** | Stateless Express.js API instances behind a load balancer; Redis used for shared session/cache state so instances can scale horizontally. |
| **Availability** | Target 99.5%+ uptime; use health checks and container restart policies. |
| **Usability** | Non-technical users should be able to upload a file and get a chart within a few clicks — no coding/query language required. |
| **Auditability** | Log key actions (data upload, cleansing operations, permission changes) for traceability. |
| **Data Retention/Backup** | Regular automated backups of the SQL database; retention period configurable per package. |
| **Maintainability** | Modular backend structure (controllers/services/repositories) to keep tenant, data-source, dashboard, and billing logic separated. |

---

## 6. System Architecture Overview

### 6.1 High-Level Architecture

```
[React + Vite SPA]
        |
        v
[Express.js API Layer]  <--->  [Redis: cache, sessions, job queue]
        |
        v
[Background Workers]  --> (Excel parsing, cleansing, insight generation)
        |
        v
[SQL Database]  (tenants, users, data source metadata, dashboards, widgets)
        |
[Object Storage]  (raw uploaded Excel/CSV files)
```

All services run as Docker containers, orchestrated via Docker Compose (development) and optionally Kubernetes/ECS (production).

### 6.2 Multi-Tenancy Strategy

Two common approaches — pick one and stay consistent:

1. **Shared database, shared schema, tenant_id column** (recommended starting point): simpler to build and cost-effective; every table includes a `tenant_id` and every query is scoped by it (enforced via middleware/ORM hooks).
2. **Schema-per-tenant or database-per-tenant**: stronger isolation, more operational overhead; consider this later for Enterprise clients needing dedicated isolation/compliance.

### 6.3 Background Job Processing

Since Excel parsing, data cleansing, and insight generation can be CPU/time-intensive, these should run as **queued background jobs** using Redis (e.g., via BullMQ) rather than blocking the API request/response cycle. The frontend polls or subscribes for job status/progress.

---

## 7. Data Model (Core Entities)

| Entity | Key Fields |
|---|---|
| **Tenant** | id, name, package_id, created_at |
| **User** | id, tenant_id, email, password_hash, role, status |
| **Package** | id, name, limits (json: max_sub_users, max_data_sources, max_file_size_mb, allowed_cleansing_ops, allowed_widget_types) |
| **DataSource** | id, tenant_id, name, file_path, status (raw/cleansed), schema (json), uploaded_by, created_at |
| **DataSourceVersion** | id, data_source_id, version_number, cleansing_ops_applied, created_at |
| **Dashboard** | id, tenant_id, name, created_by, created_at |
| **Widget** | id, dashboard_id, data_source_id, type, config (json: axes, aggregation, filters) |
| **Insight** | id, data_source_id, type, message, generated_at |
| **Permission** | id, user_id, resource_type (dashboard/data_source), resource_id, access_level (view/edit/manage) |

---

## 8. Assumptions, Constraints, and Future Scope

### 8.1 Assumptions

- Initial launch targets small/medium businesses; enterprise-scale data volumes are future scope.
- English-only UI for v1 (i18n can be added later).

### 8.2 Constraints

- Team tech stack fixed to: SQL, Redis, Express.js, React + Vite, Docker (as specified).
- No live database/API connectors in v1 — Excel/CSV only.

### 8.3 Future Scope (Not in v1)

- Live database connectors (MySQL, PostgreSQL, Google Sheets, etc.) and third-party API integrations.
- AI/LLM-powered natural language querying of data ("ask a question about your data").
- Predictive analytics/forecasting widgets.
- Public/embeddable dashboard sharing.
- Mobile app.
- Advanced audit logs and compliance certifications (SOC2, GDPR tooling) for Enterprise tier.

---

## 9. Appendix: Sample User Stories

- *As a tenant owner, I want to upload my sales Excel file so that I can see a data quality report before building dashboards.*
- *As a tenant owner, I want to clean missing values in my dataset automatically so I don't have to fix my spreadsheet manually.*
- *As an analyst sub-user, I want to view only the dashboards assigned to me so that I don't see other departments' confidential data.*
- *As a tenant owner, I want to invite my team members and assign them Viewer or Analyst roles so that access stays controlled.*
- *As a tenant owner, I want to see auto-generated insights about my sales trends without manually building every chart.*
