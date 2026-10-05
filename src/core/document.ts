import type { ParsedCode } from '../app/types';
import { LINE_OFFSET_TOKEN, USER_SCRIPT_MARKER } from './diagnostics';

/**
 * Birleşik (htmlmixed) koddan HTML / CSS / JS parçalarını ayırır ve
 * kütüphane enjeksiyonlarını temizler.
 */
export function parseFullCode(fullCode: string): ParsedCode {
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullCode, 'text/html');

  const cssCode = [...doc.head.querySelectorAll('style')]
    .map((node) => node.textContent ?? '')
    .join('\n');
  const jsCode = [...doc.body.querySelectorAll('script:not([src])')]
    .map((node) => node.textContent ?? '')
    .join('\n');

  doc.head.querySelectorAll('style').forEach((node) => node.remove());
  doc.body.querySelectorAll('script:not([src])').forEach((node) => node.remove());
  doc.head.querySelectorAll('link[rel="stylesheet"]').forEach((node) => node.remove());
  doc.body.querySelectorAll('script[src]').forEach((node) => node.remove());
  // Preview için eklenen <base> kullanıcının koduna ait değil; eski kayıtlardan
  // temizlenir ki ortam adresi kalıcı metne sızmasın.
  doc.head.querySelectorAll('base').forEach((node) => node.remove());

  return {
    htmlCode: `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`,
    cssCode,
    jsCode,
  };
}

/**
 * `</script` dizisi HTML ayrıştırıcısında script bloğunu erken kapatır ve
 * `outerHTML` serileştirmesi ham metni olduğu gibi yazar (script bir "raw text"
 * öğesidir, içeriği kaçışlanmaz).
 *
 * JS string literal içinde `<\/script` yazımı `</script` ile aynı değeri
 * üretir, bu yüzden güvenli tek yol budur. (Tersi durum: `x </script/.test(s)`
 * gibi bir regex içinde geçen dizi geçersizleşebilir — pratikte çok nadirdir.)
 */
export function escapeScriptText(source: string): string {
  return source.replace(/<\/(script)/giu, '<\\/$1');
}

export interface BuildPreviewOptions {
  readonly html: string;
  readonly css: string;
  readonly js: string;
  /** Kullanıcının kodunun göreli yolları çözebilmesi için taban adres. */
  readonly baseHref?: string | undefined;
  readonly styleUrls?: readonly string[];
  readonly scriptUrls?: readonly string[];
  /**
   * Preview'in içine enjekte edilecek köprü betiği (bkz. `core/diagnostics`).
   * `head` başına konur; head betikleri gövde betiklerinden önce çalıştığı
   * için kullanıcının kodundan gelen hataları da yakalar.
   */
  readonly bridge?: string | undefined;
}

/**
 * Preview için çalıştırılabilir tek bir HTML dokümanı üretir.
 *
 * Kullanıcının JS/CSS içeriği string birleştirme ile değil, DOM API üzerinden
 * `textContent` olarak yerleştirilir; böylece `&`, `<` gibi karakterler özel
 * bir kaçış katmanına ihtiyaç duymadan taşınır. Script içeriği ayrıca
 * `escapeScriptText` ile `</script` dizisinden arındırılır.
 *
 * `bridge` verilirse `head` başına bir hata yakalama betiği eklenir. Bu betik
 * yalnızca çalıştırılan önizlemede bulunmalıdır; kaydedilen ve indirilen metin
 * `bridge`'siz üretilir.
 */
export function buildPreviewDocument(options: BuildPreviewOptions): string {
  const { html, css, js, baseHref, styleUrls = [], scriptUrls = [], bridge } = options;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const head = doc.head ?? doc.documentElement.appendChild(doc.createElement('head'));
  const body = doc.body ?? doc.documentElement.appendChild(doc.createElement('body'));

  // Köprü, kullanıcının <head> içindeki betiklerinden bile önce çalışmalı:
  // kullanıcının kodu `<script>` ile başlıyorsa HTML ayrıştırıcısı onu
  // <head>'e taşır ve append ile eklenen köprüden sonra gelirdi.
  // `prepend` kullanıldığı için köprü her zaman head'in ilk çocuğudur.
  if (bridge) {
    const bridgeScript = doc.createElement('script');
    bridgeScript.textContent = escapeScriptText(bridge);
    head.prepend(bridgeScript);
  }

  // base, köprüden sonra prepend edilir: head sırası [base, bridge, kullanıcı…]
  // olur. Köprü hiçbir URL kullanmadığı için bu sıralama güvenlidir.
  if (baseHref) {
    const base = doc.createElement('base');
    base.setAttribute('href', baseHref);
    head.prepend(base);
  }

  for (const href of styleUrls) {
    const link = doc.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', href);
    head.appendChild(link);
  }

  const style = doc.createElement('style');
  style.textContent = css;
  head.appendChild(style);

  for (const src of scriptUrls) {
    const script = doc.createElement('script');
    script.setAttribute('src', src);
    body.appendChild(script);
  }

  const inlineScript = doc.createElement('script');
  inlineScript.setAttribute(USER_SCRIPT_MARKER, '');
  inlineScript.textContent = escapeScriptText(js);
  body.appendChild(inlineScript);

  const serialized = `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
  return bridge ? applyLineOffset(serialized) : serialized;
}

function countLines(text: string): number {
  return text.split('\n').length - 1;
}

/**
 * Üretilen belgede kullanıcının `<script>`i belirli bir satırdan başlar; tarayıcı
 * bu satırı bildirir, kullanıcı ise kendi kodundaki satırı görmek ister.
 * Köprü betiğindeki jetonu, kullanıcı betiğinden önce kalan satır sayısıyla
 * değiştiririz.
 *
 * Jeton `var LINE_OFFSET = '...';` gibi tek satırlık bir ifadede bulunduğu için
 * değiştirme satır sayısını kaydırmaz; hesap doğru kalır.
 */
function applyLineOffset(html: string): string {
  const marker = html.indexOf(`<script ${USER_SCRIPT_MARKER}`);
  if (marker < 0) return html.replace(LINE_OFFSET_TOKEN, '0');
  return html.replace(LINE_OFFSET_TOKEN, String(countLines(html.slice(0, marker))));
}
