import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

function ThemeTestComponent() {
  const { theme, toggleTheme, isDark } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="is-dark">{isDark ? 'true' : 'false'}</span>
      <button onClick={toggleTheme} data-testid="toggle-theme-btn">
        Toggle
      </button>
    </div>
  );
}

describe('ThemeProvider and useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('provides default theme and updates documentElement data-theme attribute', () => {
    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    const themeEl = screen.getByTestId('current-theme');
    expect(['light', 'dark']).toContain(themeEl.textContent);
    expect(document.documentElement.getAttribute('data-theme')).toBe(themeEl.textContent);
  });

  it('toggles theme between dark and light on click and updates localStorage and documentElement', () => {
    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    const initialTheme = screen.getByTestId('current-theme').textContent;
    const nextExpectedTheme = initialTheme === 'dark' ? 'light' : 'dark';

    const toggleBtn = screen.getByTestId('toggle-theme-btn');
    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(screen.getByTestId('current-theme').textContent).toBe(nextExpectedTheme);
    expect(document.documentElement.getAttribute('data-theme')).toBe(nextExpectedTheme);
    expect(localStorage.getItem('insightforge_theme')).toBe(nextExpectedTheme);
  });
});
