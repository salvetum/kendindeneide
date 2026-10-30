import { ICONS, isLibraryKey } from '../app/constants';
import { dom } from '../app/dom';
import { isLang, t } from '../app/i18n';
import { state } from '../app/state';
import { STORAGE_KEYS, setBoolean, setJson, setString } from '../app/storage';
import type { ChoiceSettingKey, Lang, SettingKey } from '../app/types';
import { applyFontSize, applyTabSize, applyWordWrap } from '../core/editorOptions';
import { applyThemeToEditors } from '../core/editors';
import { isFontSize, isTabSize } from '../core/editorPrefs';
import { renderDiagnostics } from '../ui/diagnostics';
import { applyLanguage } from '../ui/language';
import { applyTheme, resolvedTheme } from '../ui/theme';
import { renderSettings } from '../ui/settings';
import { showToast } from '../ui/toast';
import { clearSavedCode } from './revert';
import { runCode } from './run';

export function setLanguage(lang: Lang): void {
  applyLanguage(lang);
  setString(STORAGE_KEYS.language, lang);
  renderSettings({ onToggle: handleToggle, onChoice: handleChoice });
  // Konsol girdileri çalışma zamanında üretildiği için yeniden basılmaları gerekir.
  renderDiagnostics();
}

/** Açılır listeden yeni değer seçildiğinde. */
export function handleChoice(key: ChoiceSettingKey, value: string): void {
  if (key === 'editorFontSize') {
    if (!isFontSize(value)) return;
    state.editorFontSize = value;
    setString(STORAGE_KEYS.editorFontSize, value);
    applyFontSize(value);
    return;
  }

  if (key === 'editorTabSize') {
    if (!isTabSize(value)) return;
    state.editorTabSize = value;
    setString(STORAGE_KEYS.editorTabSize, value);
    applyTabSize(value);
    return;
  }

  if (key === 'theme') {
    if (value !== 'dark' && value !== 'light' && value !== 'system') return;
    state.theme = value;
    setString(STORAGE_KEYS.theme, value);
    applyTheme(resolvedTheme());
    applyThemeToEditors();
    dom.themeBtn.innerHTML =
      value === 'system' ? ICONS.system : value === 'dark' ? ICONS.light : ICONS.dark;
    return;
  }
}

function announceToggle(labelKey: string, active: boolean): void {
  showToast(
    t(state.lang, 'toastSettingToggle', t(state.lang, labelKey), String(active)),
    active ? 'success' : 'info',
  );
}

export function handleToggle(key: SettingKey, active: boolean): void {
  if (isLang(key)) {
    setLanguage(key);
    return;
  }

  if (key === 'saveCodeEnabled') {
    state.saveCodeEnabled = active;
    setBoolean(STORAGE_KEYS.saveCodeEnabled, active);
    announceToggle('saveCode', active);

    if (!active) {
      // Kapatmak bilinçli olarak kaydedilmiş kodu ve kütüphane seçimlerini siler.
      clearSavedCode();
      state.libraries = [];
      renderSettings({ onToggle: handleToggle, onChoice: handleChoice });
    }
    return;
  }

  if (key === 'autoRunEnabled') {
    state.autoRunEnabled = active;
    setBoolean(STORAGE_KEYS.autoRunEnabled, active);
    announceToggle('autoRun', active);
    return;
  }

  if (key === 'editorWordWrap') {
    state.editorWordWrap = active;
    setBoolean(STORAGE_KEYS.editorWordWrap, active);
    applyWordWrap(active);
    announceToggle('wordWrap', active);
    return;
  }

  if (isLibraryKey(key)) {
    const libraries = new Set(state.libraries);
    if (active) libraries.add(key);
    else libraries.delete(key);
    state.libraries = [...libraries];
    setJson(STORAGE_KEYS.selectedLibraries, state.libraries);
    if (state.autoRunEnabled) runCode(true);
  }
}
