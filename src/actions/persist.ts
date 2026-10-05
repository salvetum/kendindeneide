import { state } from '../app/state';
import { STORAGE_KEYS, setString } from '../app/storage';
import { serializeForStorage } from '../core/compose';

/**
 * Otomatik kayıt. "Kodu Sakla" kapalıyken hiçbir şey yazılmaz.
 * Prettier burada bilinçli olarak çalıştırılmaz (bkz. compose.serializeForStorage).
 */
export function persistSource(): boolean {
  if (!state.saveCodeEnabled) return true;
  return setString(STORAGE_KEYS.editorContent, serializeForStorage());
}
