import { markDirty } from '../app/dirty';
import { state } from '../app/state';
import { STORAGE_KEYS, setString } from '../app/storage';
import { t } from '../app/i18n';
import { showToast } from '../ui/toast';
import { serializeForStorage } from '../core/compose';

/**
 * Otomatik kayıt. "Kodu Sakla" kapalıyken hiçbir şey yazılmaz.
 * Prettier burada bilinçli olarak çalıştırılmaz (bkz. compose.serializeForStorage).
 */
export function persistSource(): boolean {
  if (!state.saveCodeEnabled) return true;
  return setString(STORAGE_KEYS.editorContent, serializeForStorage());
}

/**
 * Kaynağı hemen kalıcı hale getirir. `change` olayı bastırıldığı için
 * programatik yazmalardan (ayır / birleştir / geri al) sonra çağrılmalıdır;
 * aksi hâlde değişiklik yalnızca ekranda görünür, depoya girmez.
 *
 * Kayıt açıksa temizlenmiş (dirty=false) olur; kapalıysa hiçbir şey
 * değişmez ve kullanıcı uyarısız kaybolmaz.
 */
export function persistNow(): void {
  if (!state.saveCodeEnabled) return;
  if (persistSource()) markDirty(false);
  else showToast(t(state.lang, 'toastSaveError'), 'warning');
}
