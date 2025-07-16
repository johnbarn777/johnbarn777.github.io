import { beforeEach, describe, expect, it } from 'vitest';
import { initThemeSwitch } from './ThemeSwitch';
import { STORAGE_KEY } from '../theme';

declare global {
  interface Window { matchMedia: (query: string) => { matches: boolean }; }
}

beforeEach(() => {
  document.documentElement.dataset.theme = '';
  localStorage.clear();
  window.matchMedia = () => ({ matches: false });
});

describe('ThemeSwitch', () => {
  it('loads theme from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    const btn = document.createElement('button');
    initThemeSwitch(btn);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('toggles theme and persists choice', () => {
    const btn = document.createElement('button');
    initThemeSwitch(btn);
    btn.click();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });
});

