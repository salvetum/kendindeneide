import type { LibraryDefinition, LibraryKey } from './types';

/**
 * Ayarlarda sunulabilen kütüphaneler. Sürümler CDN URL'lerinde sabittir ki
 * kullanıcının kodu farklı bir sürümle sessizce çalışmasın.
 */
export const LIBRARIES: Readonly<Record<LibraryKey, LibraryDefinition>> = {
  jQuery: {
    name: 'jQuery',
    scripts: ['https://code.jquery.com/jquery-3.7.1.min.js'],
  },
  bootstrap: {
    name: 'Bootstrap 5',
    styles: ['https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css'],
    scripts: ['https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'],
  },
  react: {
    name: 'React',
    scripts: [
      'https://unpkg.com/react@18.3.1/umd/react.development.js',
      'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js',
    ],
  },
  vue: {
    name: 'Vue.js',
    scripts: ['https://unpkg.com/vue@3.5.13/dist/vue.global.js'],
  },
};

export const LIBRARY_KEYS = Object.keys(LIBRARIES) as LibraryKey[];

export function isLibraryKey(value: string): value is LibraryKey {
  return Object.hasOwn(LIBRARIES, value);
}

export const ICONS = {
  light: `<svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
  dark: `<svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
  success: `<svg class="toast-icon" style="color: var(--green);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  info: `<svg class="toast-icon" style="color: var(--blue);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  warning: `<svg class="toast-icon" style="color: var(--orange);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  error: `<svg class="toast-icon" style="color: var(--red);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
} as const;

/** Toast ikonlarının CSS değişkeni karşılığı. */
export const TOAST_ICON_BY_KIND = {
  success: ICONS.success,
  info: ICONS.info,
  warning: ICONS.warning,
  error: ICONS.error,
} as const;
