import { ICONS } from '../app/constants';
import { dom } from '../app/dom';
import { state } from '../app/state';
import { STORAGE_KEYS, getString, setString } from '../app/storage';
import type { Theme } from '../app/types';

const CODE_MIRROR_THEME: Readonly<Record<Theme, string>> = {
  dark: 'dracula',
  light: 'eclipse',
};

export function currentCodeMirrorTheme(): string {
  return CODE_MIRROR_THEME[state.theme];
}

function apply(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  dom.themeBtn.innerHTML = theme === 'dark' ? ICONS.light : ICONS.dark;
}

export function initTheme(): void {
  const saved = getString(STORAGE_KEYS.theme);
  const theme: Theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
  state.theme = theme;
  apply(theme);
}

export function toggleTheme(): void {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  setString(STORAGE_KEYS.theme, state.theme);
  apply(state.theme);
}
