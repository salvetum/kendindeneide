import { getDefaultCode } from '../app/defaultCode';
import { t } from '../app/i18n';
import { state } from '../app/state';
import { STORAGE_KEYS, remove, setJson } from '../app/storage';
import type { EditorSlot } from '../app/state';
import type { PrettierParser } from '../app/types';
import { invalidateSourceCache, parseCombined } from '../core/compose';
import { parseFullCode } from '../core/document';
import { createEditor, requireEditor, setActiveSlot } from '../core/editors';
import { format } from '../core/format';
import { persistNow } from './persist';
import { runCode } from './run';
import { showConfirmation } from '../ui/modal';
import { showToast } from '../ui/toast';

const SLOTS = ['html', 'css', 'js'] as const satisfies readonly EditorSlot[];

/** Editör değerini biçimlendirerek yazar; biçimlendirme başarısızsa ham değeri yazar. */
async function setFormatted(
  slot: EditorSlot,
  value: string,
  parser: PrettierParser,
): Promise<void> {
  try {
    requireEditor(slot).setValue(await format(value, parser));
  } catch {
    requireEditor(slot).setValue(value);
  }
}

function ensureSlot(slot: EditorSlot): void {
  createEditor(slot);
}

/* ------------------------------------------------------------------ */
/* Birleşik <-> ayrık görünüm                                          */
/* ------------------------------------------------------------------ */

export async function separateView(): Promise<void> {
  const parsed = parseCombined(requireEditor('code').getValue());

  for (const slot of SLOTS) ensureSlot(slot);
  state.suppressEffects = true;
  try {
    await setFormatted('html', parsed.htmlCode, 'html');
    await setFormatted('css', parsed.cssCode, 'css');
    await setFormatted('js', parsed.jsCode, 'babel');
  } finally {
    state.suppressEffects = false;
  }
  setActiveSlot('html');
}

export async function combineView(buildCombined: () => string): Promise<void> {
  state.suppressEffects = true;
  try {
    await setFormatted('code', buildCombined(), 'html');
  } finally {
    state.suppressEffects = false;
  }
}

/* ------------------------------------------------------------------ */
/* Geri al                                                             */
/* ------------------------------------------------------------------ */

export async function applyRevert(): Promise<void> {
  state.libraries = [];
  setJson(STORAGE_KEYS.selectedLibraries, []);

  invalidateSourceCache();
  const code = getDefaultCode(state.lang);

  if (state.separated) {
    const parsed = parseFullCode(code);
    for (const slot of SLOTS) ensureSlot(slot);
    state.suppressEffects = true;
    try {
      await setFormatted('html', parsed.htmlCode, 'html');
      await setFormatted('css', parsed.cssCode, 'css');
      await setFormatted('js', parsed.jsCode, 'babel');
    } finally {
      state.suppressEffects = false;
    }
  } else {
    state.suppressEffects = true;
    try {
      await setFormatted('code', code, 'html');
    } finally {
      state.suppressEffects = false;
    }
  }

  runCode(true);
  // Yazma sırasında change olayları bastırıldığı için kalıcı kopya elle
  // tazelenir; aksi hâlde geri alma yalnızca ekranda görünür, sayfa
  // yenilendiğinde eski kod geri gelir.
  persistNow();
  showToast(t(state.lang, 'toastRevert'), 'info');
}

export function requestRevert(): void {
  showConfirmation(t(state.lang, 'revertConfirm'), () => {
    void applyRevert();
  });
}

/** "Kodu Sakla" kapatılırken kalıcı verileri temizle. */
export function clearSavedCode(): void {
  remove(STORAGE_KEYS.editorContent);
  remove(STORAGE_KEYS.selectedLibraries);
}
