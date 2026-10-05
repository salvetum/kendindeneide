import { dom } from '../app/dom';

/**
 * Preview iframe'i bir Blob URL üzerinden yüklenir.
 *
 * Neden `srcdoc` değil: kullanıcının yazdığı JS/CSS kaynak metne
 * `textContent` olarak yerleştirilir, HTML olarak birleştirilmez. Böylece
 * kodun içindeki `</script>` dizisi belgeyi erken kapatmaz ve elle kaçış
 * (`<\/script>`) gerekmez.
 *
 * Blob URL'lerin taban adresi olmadığı için `<base href>` eklenerek srcdoc
 * davranışı korunur: kullanıcının göreli yolları uygulamanın bulunduğu
 * klasörde çözülür.
 */

let activeUrl: string | null = null;
const superseded = new Set<string>();

function releaseSuperseded(): void {
  for (const url of superseded) URL.revokeObjectURL(url);
  superseded.clear();
}

export function initPreview(): void {
  dom.resultFrame.addEventListener('load', releaseSuperseded);
}

export function previewBaseHref(): string {
  return document.baseURI;
}

export function renderDocument(document_: string): void {
  const url = URL.createObjectURL(new Blob([document_], { type: 'text/html;charset=utf-8' }));
  if (activeUrl) superseded.add(activeUrl);
  activeUrl = url;
  dom.resultFrame.src = url;
}

export function clearPreview(): void {
  if (activeUrl) {
    superseded.add(activeUrl);
    activeUrl = null;
  }
  dom.resultFrame.src = 'about:blank';
}
