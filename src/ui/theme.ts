import { ICONS } from '../app/constants';
import { dom } from '../app/dom';
import { state } from '../app/state';
import { STORAGE_KEYS, getString, setString } from '../app/storage';
import type { Theme } from '../app/types';

const CODE_MIRROR_THEME: Readonly<Record<'dark' | 'light', string>> = {
  dark: 'dracula',
  light: 'eclipse',
};

/** Sistem temasını algılar. */
function systemTheme(): 'dark' | 'light' {
  if (typeof window.matchMedia !== 'function') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/** Tema durumunu çözümler (system → dark/light). */
export function resolvedTheme(): 'dark' | 'light' {
  return state.theme === 'system' ? systemTheme() : state.theme;
}

export function currentCodeMirrorTheme(): string {
  return CODE_MIRROR_THEME[resolvedTheme()];
}

function apply(theme: 'dark' | 'light'): void {
  document.documentElement.setAttribute('data-theme', theme);
  // Tema düğmesi: mevcut temanın tersini göster (bir sonrakine geçiş ipucu).
  if (state.theme === 'system') {
    dom.themeBtn.innerHTML = ICONS.system;
  } else if (state.theme === 'dark') {
    dom.themeBtn.innerHTML = ICONS.light;
  } else {
    dom.themeBtn.innerHTML = ICONS.dark;
  }
}

export function initTheme(): void {
  const saved = getString(STORAGE_KEYS.theme);
  const theme: Theme = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'dark';
  state.theme = theme;
  apply(resolvedTheme());

  // Sistem tema değişikliğini dinle (test ortamında matchMedia olmayabilir).
  if (typeof window.matchMedia === 'function') {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (state.theme === 'system') apply(resolvedTheme());
    });
  }
}

export function toggleTheme(): void {
  const order: Theme[] = ['dark', 'light', 'system'];
  const idx = order.indexOf(state.theme);
  state.theme = order[(idx + 1) % order.length] ?? 'dark';
  setString(STORAGE_KEYS.theme, state.theme);
  apply(resolvedTheme());
}
