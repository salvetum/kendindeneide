import { t } from '../app/i18n';
import { state } from '../app/state';
import { buildRunnableDocument } from '../core/compose';
import { format } from '../core/format';
import { showToast } from '../ui/toast';

export const DOWNLOAD_FILENAME = 'index.html';

/**
 * Kaydetme (indirme). Kullanıcının seçtiği kütüphaneler dahil edilir ve
 * çıktı Prettier'dan geçirilir; biçimlendirme başarısız olursa ham çıktı
 * indirilir.
 */
export async function saveFile(): Promise<void> {
  const source = buildRunnableDocument();
  let output = source;
  try {
    output = await format(source, 'html');
  } catch (error) {
    console.error('İndirilecek kod biçimlendirilemedi:', error);
  }

  const blob = new Blob([output], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = DOWNLOAD_FILENAME;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  showToast(t(state.lang, 'toastSave'), 'success');
}
