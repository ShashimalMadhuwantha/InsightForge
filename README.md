# InsightForge — Multi-Tenant Business Intelligence SaaS Platform

InsightForge is a modern, lightweight, multi-tenant Business Intelligence (BI) SaaS platform built for small-to-mid businesses to ingest spreadsheet data, clean and profile datasets, automatically generate dynamic widgets/charts, derive statistical insights, and collaborate with role-based access control.

---

## 📁 Repository Structure

```text
InsightForge/
├── backend/          # Express.js REST API, Knex migrations/seeds, Redis workers, Jest test suite
├── frontend/         # React + Vite client, Vitest tests, modern design tokens
├── docker/           # Dockerfiles and container configuration scripts
├── docs/             # Product specifications (SRS, Epics & Tasks Breakdown)
├── .agents/          # Custom skills and agent configurations
└── docker-compose.yml # Orchestrates PostgreSQL, Redis, Backend, and Frontend
```

---

## 🚀 Tech Stack

- **Backend**: Node.js / Express.js (Modular Feature-based Architecture)
- **Frontend**: React 18+ / Vite (Vanilla CSS design system, responsive layouts)
- **Database**: PostgreSQL with Knex.js query builder, migrations, and seeds
- **Cache / Job Queue**: Redis (ioredis & BullMQ for background ingestion)
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest + Supertest (Backend), Vitest + React Testing Library (Frontend)
- **CI/CD**: GitHub Actions

---

## 🌿 Git Branching Strategy

- **Main Branch (`main`)**: Production-ready releases.
- **Develop Branch (`develop`)**: Integration branch for staged features.
- **Epic Branches (`epic/<number>-<short-name>`)**: Base branches for individual epics (e.g. `epic/0-init-infra`).
- **Feature Branches (`feature/<epic>.<task>-<short-name>`)**: Isolated task branches (e.g. `feature/0.1-repo-structure`).

### Workflow Rules
1. Create task branches off the target epic branch.
2. Implement code with full automated unit/integration test coverage.
3. Verify that all tests pass locally and DoD requirements are fulfilled.
4. Merge task branch into the epic branch.
5. Merge epic branch into `develop` once all tasks and epic-level tests pass.
