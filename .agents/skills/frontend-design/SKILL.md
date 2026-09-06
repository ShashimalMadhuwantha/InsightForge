---
name: bi-saas-frontend-design
description: >
  Use this skill whenever building or refining any user-facing screen, page,
  component, or dashboard for the multi-tenant BI SaaS platform (Chartify).
  Triggers include: building a new page/component, styling a dashboard or
  widget, reviewing an existing screen for visual quality, or any task where
  the output is something a user will look at and interact with. This skill
  defines the design system, layout patterns, and an iterate-until-polished
  review loop so the UI stays consistent across every epic instead of each
  feature looking like it was designed separately.
---

# Skill: Frontend Design for Chartify (BI SaaS Platform)

## Purpose

Guided, non-technical SMB users (per the SRS) need a UI that feels clean,
trustworthy, and effortless — not like a raw admin panel and not like a
overwhelming enterprise BI tool. This skill ensures every screen built across
every epic follows one consistent design system, and is not considered done
until it has passed a visual/UX review pass — not just a functional one.

**Core rule: implementing a feature is not "done" until it also looks
intentional.** A working-but-unstyled screen (default browser buttons, no
spacing, wall-of-text tables) fails this skill's definition of done, the same
way untested code fails the `epic-implement-and-test` skill.

## Design Principles

1. **Clarity over density.** This is a BI tool for non-analysts — favor
   whitespace, clear labels, and one primary action per screen over cramming
   in every possible control.
2. **Data is the hero.** Charts, tables, and KPI numbers should visually
   dominate; chrome (nav, borders, buttons) should recede.
3. **Guided, not blank.** Every empty state (no data sources yet, no
   dashboards yet, no insights yet) must include a clear next action, not a
   blank page or a generic "no data" message.
4. **Consistent feedback for async work.** Uploads, cleansing jobs, and
   insight generation are background jobs (per the architecture) — every one
   of them needs a visible progress/loading state and a clear success/failure
   state. Never leave the user guessing whether something is happening.
5. **Trust through consistency.** Same spacing scale, same color meanings,
   same component behavior everywhere — a user should never have to relearn
   an interaction pattern between the Data Sources page and the Dashboards
   page.

## Design System / Tokens

Use Tailwind CSS utility classes as the styling layer (pairs cleanly with
React + Vite). Define these as actual Tailwind config values, not ad-hoc
one-off styles, so every component pulls from the same source of truth.

**Color roles** (map to actual hex values in `tailwind.config.js`, not just
names):
- `brand` — primary brand color, used for primary buttons/links/active states
- `surface` — page/card backgrounds
- `border` — dividers, card outlines
- `text-primary` / `text-secondary` — main copy vs. muted/help copy
- `success` / `warning` / `danger` — status colors, used consistently for:
  data-quality scores, package-limit warnings, job failures, permission errors
- Chart palette — a fixed, ordered list of 6–8 colors reused across every
  chart/widget so the same category always renders in the same color across
  a dashboard (assign colors deterministically by category, not randomly).

**Typography**
- One font family, max 2 weights in regular use (regular + semibold), one
  heavier weight reserved for page titles/KPI numbers only.
- Fixed type scale (e.g., `text-xs` through `text-3xl`) — no arbitrary
  one-off font sizes.

**Spacing & layout**
- 4px/8px base spacing scale (Tailwind defaults) applied consistently —
  no arbitrary margins like `mt-[13px]`.
- Consistent card pattern: rounded corners, subtle border or shadow, fixed
  internal padding — used for every widget, data-source card, and settings
  panel so the whole app feels like one system.

**Component library baseline**
- Use a headless/unstyled base (e.g., Radix primitives via shadcn/ui) for
  complex interactive components (dropdowns, modals, tabs, toasts) rather
  than hand-building accessibility-sensitive components from scratch.
- Charts: pick one charting library (e.g., Recharts) and theme it once
  (colors, fonts, tooltip style) via a shared config/wrapper component, so no
  individual widget hand-codes its own chart styling.

## Page-Specific Guidance (maps to the Epics)

- **Auth pages (Epic 1):** minimal, centered card layout, no dashboard chrome
  — first impression should feel simple and fast.
- **Data Source upload & status (Epic 3):** drag-and-drop zone with clear
  file-type/size hints; data status view should lead with the overall quality
  score (large, colored by severity), then progressively reveal detail
  (missing values, duplicates, type mismatches) below.
- **Cleansing panel (Epic 4):** side-by-side or toggleable before/after
  preview — never apply a destructive-feeling change without a visible
  preview and explicit confirm.
- **Widget builder (Epic 5):** config panel on one side, live chart preview
  on the other, updating in real time as fields are mapped — never require a
  "Generate" click just to see a rough preview.
- **Dashboards (Epic 7):** drag/resize grid layout; widgets should have a
  consistent card frame regardless of chart type inside them.
- **Sub-user/RBAC screens (Epic 8):** permissions should be shown as a clear
  matrix or checklist (resource × access level), not a wall of raw checkboxes
  with no grouping.
- **Package/billing screens (Epic 2, 9):** feature comparison as a table with
  clear visual distinction for the plan the tenant currently has; limit-reached
  prompts should be a friendly inline banner/modal, not a jarring error.

## Responsive & Accessibility Rules

- Support desktop-first (primary BI use case) but ensure tablet width doesn't
  break the layout; dashboard grid can reflow to single-column below a set
  breakpoint.
- All interactive elements must be keyboard-navigable and have visible focus
  states (don't strip default focus outlines without replacing them).
- Color must never be the only signal (e.g., pair a red "danger" color with
  an icon/label too) — this matters especially for data-quality indicators
  and permission states.
- Maintain WCAG AA contrast minimums for text and status colors.

## Design Review Loop (iterate until polished)

Treat this the same way the testing skill treats failing tests — do not stop
at "it renders."

1. **Build** the screen/component using the design tokens above.
2. **Self-review against this checklist:**
   - [ ] Uses only design-system colors, spacing, and type scale (no one-off values)
   - [ ] Has a defined loading state for any async action
   - [ ] Has a defined empty state with a clear next action
   - [ ] Has a defined error state (not just a console error)
   - [ ] Keyboard-navigable, visible focus states present
   - [ ] Matches the page-specific guidance above for this epic
   - [ ] Chart colors match the fixed chart palette, consistently per category
3. **If any box is unchecked, fix it and re-review** — don't move to the next
   component with known gaps.
4. Only report a screen/component as complete once every box is checked.

## Folder Placement

Follow whichever frontend folder-structure option (`Option A` feature-based or
`Option B` type-based) is already established for this repo, per the
`epic-implement-and-test` skill's Folder Structure Conventions. Shared design
primitives (buttons, cards, chart theme wrapper) always go in the shared
`components/` folder, never duplicated inside a feature/page folder.

## Hard Rules

- **Never ship a raw, unstyled HTML element** (default `<button>`, default
  `<select>`) in a user-facing screen — always route through the shared
  component library.
- **Never introduce a new color, spacing value, or font size** outside the
  defined design tokens without updating the token config first.
- **Never leave an async action without a loading and error state.**
- **Never let two different epics invent two different patterns** for the
  same kind of thing (e.g., two different "empty state" layouts) — check
  existing components first and reuse/extend them.
