/**
 * "Paylaş" düğmesi: bağlantıyı üretir, panoya kopyalar ve adres çubuğuna
 * yazar. Kod adrese girdikten sonra da temizlenir ki kullanıcı kendi
 * çalışmasını kazara paylaşmasın.
 */

import { t } from '../app/i18n';
import { state } from '../app/state';
import { buildShareUrl } from '../core/share';
import { serializeForStorage } from '../core/compose';
import { showToast } from '../ui/toast';

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Pano izni yoksa (ya da güvensiz bağlam) adres çubuğu yeterli.
    return false;
  }
}

export async function shareCurrentCode(): Promise<void> {
  try {
    const url = await buildShareUrl(serializeForStorage(), state.libraries);
    const copied = await writeToClipboard(url);
    // Adres çubuğu bağlantıyı gösterir; yenilemede aynı kod açılır.
    window.history.replaceState(null, '', url);
    showToast(t(state.lang, copied ? 'shareCopied' : 'shareFailed'), copied ? 'success' : 'info');
  } catch (error: unknown) {
    console.error('Paylaşım bağlantısı oluşturulamadı:', error);
    showToast(t(state.lang, 'shareFailed'), 'error');
  }
}
