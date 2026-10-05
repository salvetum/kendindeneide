import './styles/main.css';

import { debounce, onIdle } from './app/debounce';
import { dom } from './app/dom';
import { markDirty, isDirty, paintTitle } from './app/dirty';
import { getDefaultCode } from './app/defaultCode';
import { isLang, t } from './app/i18n';
import { state } from './app/state';
import { STORAGE_KEYS, getBoolean, getJson, getString, isStringArray } from './app/storage';
import { isLibraryKey } from './app/constants';
import type { EditorSlot } from './app/state';
import type { LibraryKey } from './app/types';
import { formatEditors } from './actions/formatAction';
import { persistNow } from './actions/persist';
import { combineView, requestRevert, separateView } from './actions/revert';
import { resetPreview, runCode } from './actions/run';
import { saveFile } from './actions/saveFile';
import { handleToggle } from './actions/settingsAction';
import { buildRunnableDocument } from './core/compose';
import {
  applyLintToAll,
  applyThemeToEditors,
  createEditor,
  getEditor,
  requireEditor,
  setActiveSlot,
  setChangeHandler,
} from './core/editors';
import { ensureLinters } from './core/linters';
import { initPreview } from './core/preview';
import { applyLanguage } from './ui/language';
import { initModals, openModal } from './ui/modal';
import { initResizer } from './ui/resizer';
import { initSettingsClicks, renderSettings } from './ui/settings';
import { initTheme, toggleTheme } from './ui/theme';

/* ------------------------------------------------------------------ */
/* Kaydedilmemiş değişiklik takibi                                      */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Debounce'lu yan etkiler                                             */
/* ------------------------------------------------------------------ */

const AUTO_RUN_DELAY = 500;
const PERSIST_DELAY = 800;
const LINT_DELAY = 300;

let autoRunTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleAutoRun(): void {
  if (autoRunTimer !== undefined) clearTimeout(autoRunTimer);
  autoRunTimer = setTimeout(() => runCode(true), AUTO_RUN_DELAY);
}

const persistDebounced = debounce(persistNow, PERSIST_DELAY);

const lintDebounced = debounce((slot: EditorSlot) => {
  getEditor(slot)?.performLint();
}, LINT_DELAY);

function onEditorChange(slot: EditorSlot): void {
  if (state.suppressEffects) return;

  markDirty(true);
  if (state.saveCodeEnabled) persistDebounced();
  if (state.autoRunEnabled) scheduleAutoRun();
  lintDebounced(slot);
}

/* ------------------------------------------------------------------ */
/* Olay bağlama                                                        */
/* ------------------------------------------------------------------ */

function bindHeaderActions(): void {
  dom.header.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!button) return;

    switch (button.id) {
      case 'run-btn':
        runCode();
        break;
      case 'format-btn':
        void formatEditors();
        break;
      case 'separate-btn':
        void toggleSeparate();
        break;
      case 'save-btn':
        void saveFile();
        break;
      case 'revert-btn':
        requestRevert();
        break;
      case 'clear-btn':
        resetPreview();
        break;
      case 'settings-btn':
        openModal(dom.settingsModal);
        break;
      case 'info-btn':
        openModal(dom.infoModal);
        break;
      case 'theme-btn':
        toggleTheme();
        applyThemeToEditors();
        break;
      default:
        break;
    }
  });

  dom.errorRefreshBtn.addEventListener('click', () => location.reload());

  dom.editorTabs.addEventListener('click', (event) => {
    const tab = (event.target as Element).closest<HTMLElement>('[data-editor]');
    const slot = tab?.dataset.editor as EditorSlot | undefined;
    if (slot) setActiveSlot(slot);
  });
}

function bindShortcuts(): void {
  document.addEventListener('keydown', (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    const key = event.key.toLowerCase();

    if (key === 's' && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      void saveFile();
    } else if (key === 'r' && event.altKey) {
      event.preventDefault();
      requestRevert();
    } else if (key === 'r') {
      event.preventDefault();
      runCode();
    } else if (key === 'f' && event.shiftKey) {
      event.preventDefault();
      void formatEditors();
    }
  });

  window.addEventListener('beforeunload', (event) => {
    // Kayıt açıkken her şey zaten kaydediliyor; uyarı yalnızca kayıt kapalıyken anlamlı.
    if (!isDirty() || state.saveCodeEnabled) return;
    event.preventDefault();
    event.returnValue = '';
  });
}

async function toggleSeparate(): Promise<void> {
  if (state.separated) {
    // Kaynak, bayrak çevrilmeden önce ayrık editörlerden okunmalı; aksi hâlde
    // readSource() bayrağa bakıp bayat birleşik içeriği döndürür ve yapılan
    // tüm düzenlemeler kaybolur.
    const combined = buildRunnableDocument({ includeLibraries: false, includeBaseHref: false });
    state.separated = false;
    await combineView(() => combined);
    dom.separatedView.style.display = 'none';
    dom.combinedView.style.display = 'flex';
    requireEditor('code').refresh();
    persistNow();
  } else {
    state.separated = true;
    await separateView();
    dom.combinedView.style.display = 'none';
    dom.separatedView.style.display = 'flex';
  }

  dom.separateBtnText.textContent = t(state.lang, state.separated ? 'combine' : 'separate');
}

/* ------------------------------------------------------------------ */
/* Başlatma                                                            */
/* ------------------------------------------------------------------ */

function restoreState(): void {
  const savedLang = getString(STORAGE_KEYS.language);
  state.lang = savedLang !== null && isLang(savedLang) ? savedLang : 'tr';

  state.saveCodeEnabled = getBoolean(STORAGE_KEYS.saveCodeEnabled);
  state.autoRunEnabled = getBoolean(STORAGE_KEYS.autoRunEnabled);

  state.libraries = getJson(STORAGE_KEYS.selectedLibraries, [], isStringArray).filter(
    (key): key is LibraryKey => isLibraryKey(key),
  );
}

function initCombinedEditor(): void {
  setChangeHandler((slot) => onEditorChange(slot));

  const combined = createEditor('code');
  const saved = getString(STORAGE_KEYS.editorContent);
  combined.setValue(state.saveCodeEnabled && saved ? saved : getDefaultCode(state.lang));
  markDirty(false);
}

function showFatalError(): void {
  const overlay = document.getElementById('error-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function boot(): void {
  restoreState();

  initTheme();
  applyLanguage(state.lang);
  paintTitle();

  renderSettings({ onToggle: handleToggle });
  initSettingsClicks();
  initModals();
  initPreview();
  initResizer();
  initCombinedEditor();

  bindHeaderActions();
  bindShortcuts();

  runCode(true);

  // Linterlar (JSHint/CSSLint/HTMLHint ~670 KB) ilk boyamadan sonra, boşta
  // zamanda yüklenir; editörler hazır olduğunda lint açılır.
  onIdle(() => {
    void ensureLinters()
      .then(applyLintToAll)
      .catch((error: unknown) => console.error('Linter yüklenemedi:', error));
  });
}

try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
} catch (error) {
  console.error(error);
  showFatalError();
}
