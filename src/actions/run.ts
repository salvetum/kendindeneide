import { t } from '../app/i18n';
import { state } from '../app/state';
import { buildRunnableDocument } from '../core/compose';
import { clearPreview, renderDocument } from '../core/preview';
import { clearDiagnostics } from '../ui/diagnostics';
import { showToast } from '../ui/toast';

/** Kodu preview'e gönderir. */
export function runCode(silent = false): void {
  clearDiagnostics();
  renderDocument(buildRunnableDocument({ includeDiagnostics: true }));
  if (!silent) showToast(t(state.lang, 'toastRun'), 'success');
}

export function resetPreview(): void {
  clearPreview();
  clearDiagnostics();
  showToast(t(state.lang, 'toastClear'), 'info');
}
