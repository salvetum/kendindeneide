import { isLibraryKey } from '../app/constants';
import { isLang, t } from '../app/i18n';
import { state } from '../app/state';
import { STORAGE_KEYS, setBoolean, setJson, setString } from '../app/storage';
import type { Lang, SettingKey } from '../app/types';
import { renderDiagnostics } from '../ui/diagnostics';
import { applyLanguage } from '../ui/language';
import { renderSettings } from '../ui/settings';
import { showToast } from '../ui/toast';
import { clearSavedCode } from './revert';
import { runCode } from './run';

export function setLanguage(lang: Lang): void {
  applyLanguage(lang);
  setString(STORAGE_KEYS.language, lang);
  renderSettings({ onToggle: handleToggle });
  // Konsol girdileri çalışma zamanında üretildiği için yeniden basılmaları gerekir.
  renderDiagnostics();
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
      renderSettings({ onToggle: handleToggle });
    }
    return;
  }

  if (key === 'autoRunEnabled') {
    state.autoRunEnabled = active;
    setBoolean(STORAGE_KEYS.autoRunEnabled, active);
    announceToggle('autoRun', active);
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
