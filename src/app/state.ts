import type { EditorMode, Lang, LibraryKey, Theme } from './types';

export type EditorSlot = 'code' | 'html' | 'css' | 'js';

export const EDITOR_MODES: Readonly<Record<EditorSlot, EditorMode>> = {
  code: 'htmlmixed',
  html: 'text/html',
  css: 'css',
  js: 'javascript',
};

/**
 * Uygulama durumu. Modüller arasında paylaşılır; tek yazma kaynağı burasıdır.
 * Kalıcı değerler localStorage'da tutulur (bkz. app/storage.ts).
 */
export const state = {
  lang: 'tr' as Lang,
  theme: 'dark' as Theme,
  /** Ayırılmış (HTML/CSS/JS sekmeli) görünüm açık mı? */
  separated: false,
  /** Aktif sekme (ayrık görünümde). */
  activeSlot: 'html' as EditorSlot,
  saveCodeEnabled: false,
  autoRunEnabled: false,
  libraries: [] as LibraryKey[],
  /** Programatik setValue sırasında change kaynaklı yan etkileri bastır. */
  suppressEffects: false,
};
