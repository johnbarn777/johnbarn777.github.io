import { STORAGE_KEY, themes, type Theme } from '../theme';

/**
 * Apply the theme to the document and persist it.
 * @param theme - theme name from `themes`
 */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore write errors (e.g., private mode)
  }
}

/**
 * Determine the initial theme based on stored preference or OS setting.
 * @returns {Theme} active theme
 */
export function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && (themes as readonly string[]).includes(stored)) {
      return stored;
    }
  } catch {
    // ignore read errors
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Initialize a button to toggle between available themes.
 * @param button - target button element
 */
export function initThemeSwitch(button: HTMLButtonElement): void {
  let theme = getInitialTheme();
  applyTheme(theme);
  button.textContent = theme;
  button.setAttribute('aria-pressed', String(theme === 'dark'));

  button.addEventListener('click', () => {
    const index = themes.indexOf(theme);
    theme = themes[(index + 1) % themes.length];
    applyTheme(theme);
    button.textContent = theme;
    button.setAttribute('aria-pressed', String(theme === 'dark'));
  });
}
