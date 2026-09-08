# ⚡ InsightForge — Multi-Tenant Business Intelligence SaaS Platform

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7%2B-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen?style=flat)]()

**InsightForge** is a modern, lightweight, tier-1 multi-tenant Business Intelligence (BI) SaaS platform. It enables small-to-mid businesses to ingest spreadsheet datasets (Excel/CSV), analyze data quality, build visual transformation recipes (deduplication, imputation, type casting, mathematical outlier detection), generate interactive charts/KPIs, and collaborate with enterprise-grade role-based access control (RBAC).

---

## 📑 Table of Contents
- [Project Architecture & Directory Structure](#-project-architecture--directory-structure)
- [Implementation Progress (Epics 0 — 5)](#-implementation-progress-epics-0--5)
- [Technology Stack](#-technology-stack)
- [Developer Environment Setup](#-developer-environment-setup)
  - [Prerequisites](#prerequisites)
  - [Option A: Local Development Setup (Recommended)](#option-a-local-development-setup-recommended)
  - [Option B: Docker Compose Setup](#option-b-docker-compose-setup)
- [Default Seed Accounts & Credentials](#-default-seed-accounts--credentials)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Core API Routes Reference](#-core-api-routes-reference)
- [Git Branching Strategy](#-git-branching-strategy)

---

## 📁 Project Architecture & Directory Structure

```text
InsightForge/
├── backend/                              # Express.js REST API & Ingestion Engine
│   ├── src/
│   │   ├── common/                       # Configs (Knex, Redis, env), Middlewares (auth, tenantScope, rbac)
│   │   ├── db/                           # Knex migrations (12+ tables) and multi-tenant seed data
│   │   ├── modules/
│   │   │   ├── admin/                    # Platform administration, tenant management & global metrics
│   │   │   ├── auth/                     # JWT tokens, Refresh token rotation, bcrypt password hashing
│   │   │   ├── cleansing/                # Functional Cleansing Engine (IQR/Z-Score outliers, imputations)
│   │   │   ├── data-sources/             # Multer upload, BullMQ worker, XLSX/CSV parser, quality score
│   │   │   ├── packages/                 # Subscription plans, feature-gating engine, Stripe webhooks
│   │   │   ├── system/                   # Health checks, DB/Redis liveness probes
│   │   │   └── tenants/                  # Tenant isolation, profiles, domain whitelisting
│   │   ├── app.js                        # Express application assembly & security headers
│   │   └── server.js                     # HTTP server entry point (Port 5000)
│   └── package.json
├── frontend/                             # React 18 + Vite SPA (Linear & Geist Design System)
│   ├── src/
│   │   ├── components/                   # Reusable UI primitives (Modals, Badges, Tables, Navbars)
│   │   ├── context/                      # AuthContext, ThemeContext (Dark/Light mode)
│   │   ├── features/
│   │   │   ├── admin/                    # Platform admin dashboard & tenant directory
│   │   │   ├── auth/                     # Login, Signup, Password reset
│   │   │   ├── cleansing/                # CleansingStudio (Pipeline builder, Tabular diff, Score delta)
│   │   │   ├── data-sources/             # Upload drag-drop, dataset profiling & quality reports
│   │   │   ├── packages/                 # Tier selection, upgrade checkout, limit reached modals
│   │   │   └── tenants/                  # Tenant settings, domain management, team roles
│   │   ├── services/                     # Axios API clients with auto-refresh token interceptors
│   │   └── styles/                       # CSS tokens, design variables, utility classes
│   └── package.json
├── docker/                               # Container configurations & Dockerfiles
├── docs/                                 # Product specifications (SRS, Epics & Tasks breakdown)
└── docker-compose.yml                    # PostgreSQL + Redis + Backend + Frontend orchestration
```

---

## 🎯 Implementation Progress (Epics 0 — 5)

| Epic | Status | Key Deliverables & Features |
|---|:---:|---|
| **Epic 0: Project Setup & Infra** | ✅ Done | Modular Express & Vite repos, PostgreSQL & Redis Docker, Knex migrations & seed runner, ESLint/Prettier, CI pipeline. |
| **Epic 1: Multi-Tenancy Foundation** | ✅ Done | Row-level tenant isolation (`tenant_id`), schema migration, subdomain/slug resolution, tenant onboarding, tenant status controls. |
| **Epic 2: Auth, Authorization & RBAC** | ✅ Done | Access/Refresh JWT token rotation, bcrypt password hashing, RBAC middleware (`super_admin`, `tenant_admin`, `creator`, `viewer`), route guards. |
| **Epic 3: Subscription & Packages** | ✅ Done | Tiered packages (Free Tier, Starter, Growth Business, Enterprise), server-side entitlement assertion, mock Stripe checkout & webhook lifecycle. |
| **Epic 4: Data Source Management** | ✅ Done | Excel/CSV multipart upload, server-side size/count package gates, BullMQ Redis parsing worker, data quality scoring (completeness, duplicates, missingness). |
| **Epic 5: Data Cleansing & Outliers** | ✅ Done | Pure functional transformation engine, IQR / Z-Score outlier detection & winsorizing/filtering, dry-run previews, immutable versioning, 1-click historical rollback, Geist-grade Cleansing Studio UI. |
| **Epic 6: Chart & Widget Builder** | ⏳ Next | Interactive chart configuration studio, aggregation query engine (SUM, AVG, GROUP BY, time buckets), Recharts visualizers, export to PNG/CSV. |
| **Epic 7: Dashboard Management** | 📋 Planned | Drag-and-drop grid layout (react-grid-layout), global date/filter controls, dashboard sharing & public links. |

---

## 🛠️ Technology Stack

- **Backend**: Node.js 18+, Express.js, Knex.js, Multer, `xlsx`, `csv-parser`
- **Frontend**: React 18+, Vite, React Router v6, Lucide Icons, Pure CSS Token Design System (Dark/Light mode)
- **Database**: PostgreSQL 16 (Relational schemas with JSONB audit logs and foreign keys)
- **Background Processing / Queue**: Redis 7, BullMQ, ioredis
- **Testing**: Jest, Supertest (Backend — 18 Suites / 109 Tests), Vitest, React Testing Library (Frontend — 15 Suites / 42 Tests)
- **Containerization**: Docker, Docker Compose

---

## 🚀 Developer Environment Setup

### Prerequisites
Make sure the following dependencies are installed on your machine:
- **Node.js**: `v18.0.0` or higher ([Download](https://nodejs.org/))
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: `v14.0` or higher (Running on port `5432`)
- **Redis**: `v6.0` or higher (Running on port `6379`)
- **Git**

---

### Option A: Local Development Setup (Recommended)

#### 1. Clone the Repository
```bash
git clone https://github.com/ShashimalMadhuwantha/InsightForge.git
cd InsightForge
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run database migrations
npm run migrate

# Seed initial platform packages, tenants, and users
npm run seed

# Start development server with hot-reload (Port 5000)
npm run dev
```

#### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start Vite development server (Port 5173)
npm run dev
```

Visit **`http://localhost:5173`** in your browser!

---

### Option B: Docker Compose Setup

Run the entire platform (PostgreSQL, Redis, Backend, and Frontend) in isolated Docker containers:

```bash
# Build and start all services
docker-compose up -d --build

# View container logs
docker-compose logs -f backend

# Tear down services
docker-compose down -v
```

Services will be available at:
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`

---

## 🔐 Default Seed Accounts & Credentials

The seed script automatically provisions pre-configured test users with specific roles and package subscriptions:

| Role | Email | Password | Tenant / Plan | Capabilities |
|---|---|---|---|---|
| **Super Admin** | `superadmin@insightforge.io` | `Password123!` | Global Platform | Full system oversight, tenant management, global analytics |
| **Tenant Admin (Enterprise)** | `admin@acme.com` | `Password123!` | Acme Corp *(Enterprise)* | Data uploads, all cleansing ops, outlier removal, team settings |
| **Tenant Admin (Starter)** | `admin@globex.com` | `Password123!` | Globex *(Starter Tier)* | Basic uploads, basic cleansing, package upgrade modals |
| **Creator** | `creator@acme.com` | `Password123!` | Acme Corp | Upload datasets, build cleansing recipes, create charts |
| **Viewer** | `viewer@acme.com` | `Password123!` | Acme Corp | View datasets, status profiles, and dashboards (Read-only) |

---

## 🧪 Testing & Quality Assurance

### Run Backend Tests (Jest + Supertest)
```bash
cd backend
npm test
```
*Coverage includes multi-tenant isolation, JWT auth, package limit enforcement, Excel parser workers, functional cleansing transformations, and version rollback.*

### Run Frontend Tests (Vitest + RTL)
```bash
cd frontend
npm test -- --run
```
*Coverage includes auth flows, tenant settings, package selection/modals, dataset upload/profiling, and Cleansing Studio interactive pipelines.*

### Run Linters
```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```

---

## 📡 Core API Routes Reference

### Authentication (`/api/auth`)
- `POST /api/auth/signup` — Register tenant & initial admin account
- `POST /api/auth/login` — Authenticate and receive JWT access/refresh tokens
- `POST /api/auth/refresh` — Rotate refresh token and issue new access token
- `GET  /api/auth/me` — Retrieve current authenticated user profile & tenant info

### Data Sources (`/api/data-sources`)
- `GET    /api/data-sources` — List tenant datasets with pagination & filtering
- `POST   /api/data-sources/upload` — Upload Excel/CSV spreadsheet (Multipart)
- `GET    /api/data-sources/:id` — Get dataset details, schema profile, and quality score
- `POST   /api/data-sources/:id/refresh` — Re-upload and increment dataset version
- `DELETE /api/data-sources/:id` — Remove dataset and historical versions

### Data Cleansing & Versioning (`/api/data-sources/:id/cleanse`)
- `POST /api/data-sources/:id/cleanse/preview` — Dry-run transformation recipe & get diff/score delta
- `POST /api/data-sources/:id/cleanse/apply` — Apply recipe, transform full dataset, and create immutable version
- `GET  /api/data-sources/:id/cleanse/versions` — List historical version checkpoints & recipes
- `POST /api/data-sources/:id/versions/:versionNumber/revert` — Instant 1-click rollback to prior version

### Packages & Subscriptions (`/api/packages`)
- `GET  /api/packages` — List available subscription tiers
- `GET  /api/packages/tenant/my-plan` — Get active tenant subscription & usage limits
- `POST /api/packages/tenant/checkout-session` — Initiate mock Stripe checkout session
- `POST /api/packages/webhook` — Process Stripe subscription lifecycle webhooks

---

## 🌿 Git Branching Strategy

- **`main`**: Production-ready code releases.
- **`develop`**: Integration branch for staged features.
- **`epic/<number>-<name>`**: Epic-level branches (e.g., `epic/5-data-cleansing`).
- **`feature/<epic>.<task>-<name>`**: Task branches (e.g., `feature/5.2-outlier-detection`).

### Contribution Rules
1. Create task branches off the active epic branch.
2. Maintain 100% automated test coverage for new endpoints and components.
3. Verify that all lint checks and tests pass locally before submitting.
4. Merge feature branch into epic branch, then merge epic branch into `develop`.
