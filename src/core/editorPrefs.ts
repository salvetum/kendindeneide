/**
 * Editör görünüm tercihleri — SAF KATMAN.
 *
 * Burada DOM'a, CodeMirror'a veya uygulama durumuna dokunulmaz; yalnızca
 * tercih değerlerinin ne anlama geldiği tanımlanır. Uygulama
 * (`src/core/editorOptions.ts`) bunları editörlere yazar.
 *
 * Yazı tipi boyutu bir CSS değişkeniyle uygulanır (`--editor-font-size`)
 * çünkü CodeMirror 5'te yazı tipi boyutu seçeneği yoktur ve tüm editör
 * (kodece, satır numaraları, vurgular) birlikte ölçeklenmelidir.
 */

import type { EditorFontSize, EditorTabSize } from '../app/types';

export const FONT_SIZES: Readonly<Record<EditorFontSize, string>> = {
  small: '12px',
  medium: '13.5px',
  large: '16px',
};

export const TAB_SIZES: readonly EditorTabSize[] = ['2', '4'];

export function isFontSize(value: unknown): value is EditorFontSize {
  return typeof value === 'string' && Object.hasOwn(FONT_SIZES, value);
}

export function isTabSize(value: unknown): value is EditorTabSize {
  return value === '2' || value === '4';
}

/** Yeni oluşturulacak editörlerin de tercihleri okuması için başlangıç
 *  seçenekleri. `createEditor` bunları kullanır. */
export function editorPrefs(options: {
  readonly tabSize: EditorTabSize;
  readonly wordWrap: boolean;
}): {
  tabSize: number;
  indentUnit: number;
  lineWrapping: boolean;
} {
  const width = Number(options.tabSize);
  return { tabSize: width, indentUnit: width, lineWrapping: options.wordWrap };
}
