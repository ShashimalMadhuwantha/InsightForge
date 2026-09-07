---
name: frontend-design
description: >
  Comprehensive UI/UX design system, tokens, spatial hierarchy, typography, and component conventions
  for InsightForge Multi-Tenant BI SaaS platform (Linear, Vercel Geist, and Shadcn UI grade).
  Use this skill whenever creating, updating, or styling frontend components, pages, charts, widgets,
  layouts, modals, and data tables to ensure a world-class, tier-1 SaaS aesthetic with seamless Dark & Light mode.
---

# Skill: Frontend Design & Theming System (Linear / Vercel / Shadcn Grade)

## 🎯 Purpose & Visual DNA

Define the exact visual language, design system tokens, typography rules, layout hierarchy, and micro-interaction guidelines for **InsightForge BI SaaS platform**.

InsightForge must look and feel like a **tier-1 modern enterprise SaaS** (inspired by Linear, Stripe, Vercel Geist, and Tremor) — clean, intentional, highly readable, with razor-sharp typography and zero generic AI bloat.

---

## 💎 Core Design Principles (Anti-Generic AI Design)

1. **Spatial Depth & Elevation (Layering over Flatness):**
   - Use 4 distinct elevation tiers:
     - **Canvas Base (`--bg-primary`)**: Deep cosmic slate (Dark: `#080c14`, Light: `#f8fafc`) with subtle ambient radial glow mesh.
     - **Structural Panels (`--bg-secondary`)**: Sidebar and Topbar with crisp 1px borders and backdrop blur.
     - **Interactive Cards (`--bg-card`)**: Glassmorphic panels with dual-layer border (subtle top highlight `1px solid var(--border-card-highlight)`, crisp side/bottom boundary) and hover lift.
     - **Elevated Overlays (`--bg-elevated`)**: Dropdowns and Modals with deep shadows (`--shadow-xl`) and backdrop-filter blur (16px).

2. **Typography & Data Density Hierarchy (Linear Standard):**
   - **Primary Sans**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`, `Roboto`, sans-serif.
   - **Monospace & Code**: `'JetBrains Mono'`, `'Geist Mono'`, monospace.
   - **Headings**: Tight tracking (`letter-spacing: -0.025em; font-weight: 750`).
   - **Tabular Data & Numbers**: **Must** use `font-variant-numeric: tabular-nums` to prevent number jitter in tables and KPI meters.
   - **Micro Badges & Section Tags**: `letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.70rem; font-weight: 700;`.

3. **High-Contrast, Harmonious Color Palettes:**
   - Avoid muddy grays. Use curated obsidian night tones for Dark Mode and crystal porcelain tones for Light Mode.
   - Every status (Active, Suspended, Warning, Processing) must have a paired **surface tint** (10-15% opacity) and **crisp solid foreground** with an optional live pulse indicator (`.live-dot.pulse`).

4. **Delightful Micro-Interactions & Spring Physics:**
   - Easing: **Always** use Apple/Linear style spring easing: `cubic-bezier(0.16, 1, 0.3, 1)` with 200ms - 300ms durations.
   - Buttons: Push micro-compression on click (`:active { transform: scale(0.97); }`).
   - Cards: Subtle lift on hover (`transform: translateY(-2px); box-shadow: var(--shadow-card-hover);`).
   - Badges & Status: Live pulse dot animations on real-time metrics.

---

## 🎨 Design Tokens Matrix (`frontend/src/index.css`)

All colors and surfaces **must** reference these CSS variables via `var(--token-name)`:

```css
:root,
[data-theme="dark"] {
  /* Canvas & Surfaces (Obsidian Slate) */
  --bg-primary: #080c14;
  --bg-secondary: #0e1526;
  --bg-tertiary: #162038;
  --bg-card: rgba(14, 21, 38, 0.75);
  --bg-card-hover: rgba(22, 32, 56, 0.90);
  --bg-glass: rgba(14, 21, 38, 0.65);
  --bg-elevated: #1a2540;
  --bg-input: rgba(10, 16, 30, 0.85);

  /* Borders & Dividers */
  --border-subtle: rgba(255, 255, 255, 0.07);
  --border-medium: rgba(255, 255, 255, 0.14);
  --border-strong: rgba(255, 255, 255, 0.24);
  --border-focus: #6366f1;
  --border-card-highlight: rgba(255, 255, 255, 0.12);

  /* Typography */
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-inverse: #0f172a;

  /* Brand Accents */
  --accent-primary: #6366f1;
  --accent-primary-hover: #4f46e5;
  --accent-secondary: #06b6d4;
  --accent-gradient: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
  --accent-gradient-text: linear-gradient(135deg, #a5b4fc 0%, #38bdf8 100%);
  --accent-glow: 0 0 24px rgba(99, 102, 241, 0.35);
  --accent-glow-subtle: 0 0 12px rgba(99, 102, 241, 0.18);

  /* Semantic Status Colors (Solid + Alpha Tints) */
  --success: #10b981;
  --success-bg: rgba(16, 185, 129, 0.12);
  --success-border: rgba(16, 185, 129, 0.25);
  --warning: #f59e0b;
  --warning-bg: rgba(245, 158, 11, 0.12);
  --warning-border: rgba(245, 158, 11, 0.25);
  --error: #f43f5e;
  --error-bg: rgba(244, 63, 94, 0.12);
  --error-border: rgba(244, 63, 94, 0.25);
  --info: #38bdf8;
  --info-bg: rgba(56, 189, 248, 0.12);
  --info-border: rgba(56, 189, 248, 0.25);

  /* Chart / BI Visualization Palette */
  --chart-1: #6366f1;
  --chart-2: #06b6d4;
  --chart-3: #10b981;
  --chart-4: #f59e0b;
  --chart-5: #a855f7;
  --chart-6: #f43f5e;
  --chart-grid: rgba(255, 255, 255, 0.05);

  /* Layered Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 16px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 14px 36px -4px rgba(0, 0, 0, 0.65), 0 4px 16px -2px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 24px 60px -8px rgba(0, 0, 0, 0.85);
  --shadow-card-hover: 0 12px 30px -4px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.15);
}

[data-theme="light"] {
  /* Canvas & Surfaces (Crystal Porcelain) */
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f5f9;
  --bg-card: rgba(255, 255, 255, 0.85);
  --bg-card-hover: #ffffff;
  --bg-glass: rgba(255, 255, 255, 0.75);
  --bg-elevated: #ffffff;
  --bg-input: #f8fafc;

  /* Borders & Dividers */
  --border-subtle: rgba(15, 23, 42, 0.07);
  --border-medium: rgba(15, 23, 42, 0.14);
  --border-strong: rgba(15, 23, 42, 0.22);
  --border-focus: #4f46e5;
  --border-card-highlight: rgba(255, 255, 255, 0.9);

  /* Typography */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --text-inverse: #ffffff;

  /* Brand Accents */
  --accent-primary: #4f46e5;
  --accent-primary-hover: #4338ca;
  --accent-secondary: #0891b2;
  --accent-gradient: linear-gradient(135deg, #4f46e5 0%, #0891b2 100%);
  --accent-gradient-text: linear-gradient(135deg, #4338ca 0%, #0284c7 100%);
  --accent-glow: 0 0 24px rgba(79, 70, 229, 0.20);
  --accent-glow-subtle: 0 0 12px rgba(79, 70, 229, 0.10);

  /* Semantic Status Colors */
  --success: #059669;
  --success-bg: rgba(5, 150, 105, 0.08);
  --success-border: rgba(5, 150, 105, 0.20);
  --warning: #d97706;
  --warning-bg: rgba(217, 119, 6, 0.08);
  --warning-border: rgba(217, 119, 6, 0.20);
  --error: #e11d48;
  --error-bg: rgba(225, 29, 72, 0.08);
  --error-border: rgba(225, 29, 72, 0.20);
  --info: #0284c7;
  --info-bg: rgba(2, 132, 199, 0.08);
  --info-border: rgba(2, 132, 199, 0.20);

  /* Chart / BI Visualization Palette */
  --chart-1: #4f46e5;
  --chart-2: #0891b2;
  --chart-3: #059669;
  --chart-4: #d97706;
  --chart-5: #9333ea;
  --chart-6: #e11d48;
  --chart-grid: rgba(15, 23, 42, 0.06);

  /* Layered Shadows */
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  --shadow-md: 0 4px 16px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03);
  --shadow-lg: 0 16px 36px -4px rgba(15, 23, 42, 0.10), 0 4px 16px -2px rgba(15, 23, 42, 0.05);
  --shadow-xl: 0 24px 60px -8px rgba(15, 23, 42, 0.15);
  --shadow-card-hover: 0 12px 30px -4px rgba(15, 23, 42, 0.12), 0 0 20px rgba(79, 70, 229, 0.08);
}
```

---

## 🌗 3. Theme Switcher Pattern (`useTheme`)

Use a shared theme hook in `frontend/src/hooks/useTheme.js` or `ThemeContext.jsx`:

```javascript
import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('insightforge_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('insightforge_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
```

---

## 📊 4. Chart & BI Visualization Guidelines

When integrating charts (e.g., Chart.js, Recharts, or custom SVG widgets):
1. **Never use static hex codes** for axes, grid lines, or tooltips.
2. Grid lines must use `var(--chart-grid)`.
3. Tooltip containers must use `.glass-panel` background with `var(--text-primary)` font.
4. Categorical data series must cycle through `--chart-1` to `--chart-6`.
5. KPI change indicators: use `--success` with up-arrow for positive gains, `--error` with down-arrow for declines.

---

## 🧱 5. Component Styling Specifications

### 1. Analytics & KPI Cards (`.stat-card` - Tremor Style)
- Clean card with top border highlight (`1px solid var(--border-card-highlight)`).
- Uppercase section tag (`.section-tag`) paired with a tinted icon wrapper.
- Bold tabular value (`font-weight: 800; font-variant-numeric: tabular-nums; font-size: 1.85rem`).
- Trend delta badge with icon (`+14.2%`) and subtitle.

### 2. High-Density Data Tables (`.modern-table` - Linear Style)
- Sticky headers with `var(--bg-secondary)` and subtle bottom border.
- Generous row padding (`14px 18px`).
- Subtle row hover state (`var(--bg-card-hover)`).
- Action buttons in ghost icon format (`.btn-icon`).
- Numerical columns right-aligned with `tabular-nums`.

### 3. Glassmorphic Modals & Dialogs (`.modal-backdrop`, `.modal-box`)
- Frosted glass backdrop blur (`12px`).
- Spring physics entry animation (`animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards`).
- Clear header icon badge + title + description + close button.
- Footer: Ghost/Cancel on left, solid Gradient Primary on right.

### 4. Form Inputs & Interactive Controls (`.form-group`, `.form-label`)
- Background: `var(--bg-input)`.
- Border: `1px solid var(--border-subtle)`.
- Focus State: `border-color: var(--border-focus); box-shadow: var(--accent-glow-subtle); outline: none;`.
- Transitions: `transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1)`.

### 5. Navigation & Layouts (`.app-navbar`, `.admin-sidebar`)
- Sidebar: Dark Mode deep `#080c14` with 1px right border.
- Top Navbar: Glassmorphic fixed bar with `backdrop-filter: blur(16px)`.
- Theme Switcher: Smooth icon rotation transition with Sun/Moon icons.

---

## ⚡ 6. Non-Negotiable Hard Rules

1. **Zero Hardcoded Colors**: Never use `#ffffff`, `#000000`, `#1a202c`, `rgb(...)` in component inline styles or CSS rules without using `var(--token)`.
2. **Tabular Numbers for Metrics**: All counts, percentages, rows, sizes, and timestamps must include `font-variant-numeric: tabular-nums` or `font-mono`.
3. **Smooth Interactive Transitions**: Every button, link, tab, modal, and input must use `transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1)`.
4. **Theme Resilience**: Check both Light and Dark modes. Contrast must pass WCAG AA (4.5:1 ratio) on every text element.
5. **No Clunky Raw HTML Alerts**: Use styled status banners or toast cards with icons and theme-aware borders.
