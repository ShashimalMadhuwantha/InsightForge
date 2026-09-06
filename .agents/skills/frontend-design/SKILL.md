---
name: frontend-design
description: >
  Guidelines, design tokens, and UI/UX conventions for the InsightForge Multi-Tenant BI SaaS platform.
  Use this skill whenever creating, updating, or styling frontend components, pages, charts, widgets,
  and layouts to ensure a consistent, world-class aesthetic with full Dark Mode and Light Mode support.
---

# Skill: Frontend Design & Theming System

## Purpose

Define the visual language, design system tokens, and UX guidelines for the **InsightForge BI SaaS platform**. Every user interface element must feel modern, premium, responsive, and seamlessly support both **Dark Mode (Midnight Slate)** and **Light Mode (Clean Porcelain)**.

---

## 🎨 Color Palette & CSS Variables

All components, layouts, charts, and widgets **must use CSS variables** (`var(--token)`) rather than hardcoded hex codes, ensuring instant theme switching.

### Design Tokens (`frontend/src/index.css`)

```css
/* ==========================================================================
   THEME DESIGN TOKENS: LIGHT & DARK MODES
   ========================================================================== */

:root,
[data-theme="dark"] {
  /* Surface & Backgrounds */
  --bg-primary: #090d16;
  --bg-secondary: #0f172a;
  --bg-tertiary: #1e293b;
  --bg-card: rgba(15, 23, 42, 0.75);
  --bg-card-hover: rgba(30, 41, 59, 0.85);
  --bg-glass: rgba(15, 23, 42, 0.65);

  /* Borders & Dividers */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-medium: rgba(255, 255, 255, 0.16);
  --border-focus: #6366f1;

  /* Typography */
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  /* Brand Accents */
  --accent-primary: #6366f1;
  --accent-primary-hover: #4f46e5;
  --accent-secondary: #06b6d4;
  --accent-gradient: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
  --accent-glow: 0 0 25px rgba(99, 102, 241, 0.35);

  /* Status Colors */
  --success: #10b981;
  --success-bg: rgba(16, 185, 129, 0.14);
  --warning: #f59e0b;
  --warning-bg: rgba(245, 158, 11, 0.14);
  --error: #f43f5e;
  --error-bg: rgba(244, 63, 94, 0.14);
  --info: #38bdf8;
  --info-bg: rgba(56, 189, 248, 0.14);

  /* Chart / BI Visualization Palette */
  --chart-1: #6366f1; /* Indigo */
  --chart-2: #06b6d4; /* Cyan */
  --chart-3: #10b981; /* Emerald */
  --chart-4: #f59e0b; /* Amber */
  --chart-5: #a855f7; /* Purple */
  --chart-6: #f43f5e; /* Rose */
  --chart-grid: rgba(255, 255, 255, 0.06);

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 14px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 14px 36px -4px rgba(0, 0, 0, 0.65), 0 4px 16px -2px rgba(0, 0, 0, 0.4);
}

[data-theme="light"] {
  /* Surface & Backgrounds */
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f5f9;
  --bg-card: rgba(255, 255, 255, 0.9);
  --bg-card-hover: #ffffff;
  --bg-glass: rgba(255, 255, 255, 0.8);

  /* Borders & Dividers */
  --border-subtle: rgba(15, 23, 42, 0.08);
  --border-medium: rgba(15, 23, 42, 0.15);
  --border-focus: #4f46e5;

  /* Typography */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;

  /* Brand Accents */
  --accent-primary: #4f46e5;
  --accent-primary-hover: #4338ca;
  --accent-secondary: #0891b2;
  --accent-gradient: linear-gradient(135deg, #4f46e5 0%, #0891b2 100%);
  --accent-glow: 0 0 25px rgba(79, 70, 229, 0.2);

  /* Status Colors */
  --success: #059669;
  --success-bg: rgba(5, 150, 105, 0.1);
  --warning: #d97706;
  --warning-bg: rgba(217, 119, 6, 0.1);
  --error: #e11d48;
  --error-bg: rgba(225, 29, 72, 0.1);
  --info: #0284c7;
  --info-bg: rgba(2, 132, 199, 0.1);

  /* Chart / BI Visualization Palette */
  --chart-1: #4f46e5;
  --chart-2: #0891b2;
  --chart-3: #059669;
  --chart-4: #d97706;
  --chart-5: #9333ea;
  --chart-6: #e11d48;
  --chart-grid: rgba(15, 23, 42, 0.06);

  /* Shadows */
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 16px 36px -4px rgba(15, 23, 42, 0.12), 0 4px 16px -2px rgba(15, 23, 42, 0.06);
}
```

---

## 🌗 Theme Switcher Pattern (`useTheme`)

Use a shared theme hook in `frontend/src/hooks/useTheme.js`:

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

## 📊 Chart & BI Visualization Guidelines

When integrating charts (e.g., Chart.js, Recharts, or custom SVG widgets):
1. **Never use static hex codes** for axes, grid lines, or tooltips.
2. Grid lines must use `var(--chart-grid)`.
3. Tooltip containers must use `.glass-panel` background with `var(--text-primary)` font.
4. Categorical data series must cycle through `--chart-1` to `--chart-6`.
5. KPI change indicators: use `--success` with up-arrow for positive gains, `--error` with down-arrow for declines.

---

## 🧱 Key Component Specifications

1. **Cards & Panels (`.glass-panel`):**
   * Dark Mode: Subtle blur over deep midnight navy with semi-transparent border (`rgba(255,255,255,0.08)`).
   * Light Mode: Crisp white with subtle shadow and border (`rgba(15,23,42,0.08)`).
2. **Buttons (`.btn-primary`, `.btn-outline`):**
   * Primary: Gradient fill with subtle accent glow and slight hover translateY(-1px).
   * Outline: Bordered with `--border-medium`, background becomes `--bg-tertiary` on hover.
3. **Data Tables:**
   * Alternating subtle row backgrounds.
   * Sticky headers with `var(--bg-secondary)` backdrop filter.
4. **Form Inputs:**
   * Background: `var(--bg-secondary)` with `var(--border-subtle)`.
   * Focus ring: 2px solid `var(--border-focus)` with subtle outer glow.

---

## ⚡ Hard Rules for UI Implementation

- **No Pure Black (#000000) or Pure White (#ffffff) text on stark backgrounds**: Use tailored slate tones (`#f8fafc` / `#0f172a`).
- **All Interactive Elements Must Have Hover & Active Micro-Animations**: Smooth transitions (`0.2s cubic-bezier(0.4, 0, 0.2, 1)`).
- **Responsive by Default**: All grids must use CSS grid with `minmax()` or flexbox with wrap.
- **Always Test in Both Modes**: Toggle theme back and forth during development to verify readability.
