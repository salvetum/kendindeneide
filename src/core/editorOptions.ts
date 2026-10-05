/**
 * Editör tercihlerinin UYGULANMASI. Saf mantık `editorPrefs.ts` içinde.
 */

import type { EditorFontSize, EditorTabSize } from '../app/types';
import { allEditors } from './editors';
import { FONT_SIZES } from './editorPrefs';

/** Yazı tipi boyutunu CSS değişkenine yazar (tüm editörler ölçeklenir). */
export function applyFontSize(size: EditorFontSize): void {
  document.documentElement.style.setProperty('--editor-font-size', FONT_SIZES[size]);
}

/** Sekme genişliğini ve girinti birimini tüm editörlere uygular. */
export function applyTabSize(size: EditorTabSize): void {
  const width = Number(size);
  for (const editor of allEditors()) {
    editor.setOption('tabSize', width);
    editor.setOption('indentUnit', width);
  }
}

/** Satır kaydırmayı tüm editörlere uygular. */
export function applyWordWrap(enabled: boolean): void {
  for (const editor of allEditors()) editor.setOption('lineWrapping', enabled);
}
