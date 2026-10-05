import { t } from './i18n';
import { state } from './state';

/**
 * Kaydedilmemiş değişiklik takibi. Başlıkta `●` işareti ve `body.dirty`
 * sınıfı olarak görünür; `beforeunload` uyarısı da buna bakar.
 *
 * Programatik yazmalar (ayır / birleştir / geri al) bu bayrağı değiştirmez,
 * çünkü onlar "kullanıcı bir şeyi değiştirdi" anlamına gelmez.
 */
let dirty = false;

export function isDirty(): boolean {
  return dirty;
}

export function paintTitle(): void {
  document.title = `${dirty ? '● ' : ''}${t(state.lang, 'title')}`;
}

export function markDirty(value: boolean): void {
  dirty = value;
  document.body.classList.toggle('dirty', value);
  paintTitle();
}
