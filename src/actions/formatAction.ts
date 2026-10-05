import { t } from '../app/i18n';
import { state } from '../app/state';
import type { PrettierParser } from '../app/types';
import { requireEditor } from '../core/editors';
import { format } from '../core/format';
import { showToast } from '../ui/toast';
import type { EditorSlot } from '../app/state';

/** Bir slotu biçimlendirir; hata olursa o slot için uyarır. */
async function formatSlot(slot: EditorSlot, parser: PrettierParser): Promise<boolean> {
  const editor = requireEditor(slot);
  try {
    editor.setValue(await format(editor.getValue(), parser));
    return true;
  } catch (error) {
    console.error(`${parser} biçimlendirme başarısız:`, error);
    showToast(t(state.lang, 'toastFormatError', parser === 'babel' ? 'js' : parser), 'warning');
    return false;
  }
}

export async function formatEditors(): Promise<void> {
  let ok = true;

  if (state.separated) {
    ok = (await formatSlot('html', 'html')) && ok;
    ok = (await formatSlot('css', 'css')) && ok;
    ok = (await formatSlot('js', 'babel')) && ok;
  } else {
    const editor = requireEditor('code');
    try {
      editor.setValue(await format(editor.getValue(), 'html', { tabWidth: 4, useTabs: false }));
    } catch (error) {
      console.error('html biçimlendirme başarısız:', error);
      showToast(t(state.lang, 'toastFormatError', 'html'), 'warning');
      ok = false;
    }
  }

  if (ok) showToast(t(state.lang, 'toastFormat'), 'success');
}
