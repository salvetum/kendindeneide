import type { ParsedCode } from '../app/types';

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
}

/**
 * Preview için çalıştırılabilir tek bir HTML dokümanı üretir.
 *
 * Kullanıcının JS/CSS içeriği string birleştirme ile değil, DOM API üzerinden
 * `textContent` olarak yerleştirilir; böylece `&`, `<` gibi karakterler özel
 * bir kaçış katmanına ihtiyaç duymadan taşınır. Script içeriği ayrıca
 * `escapeScriptText` ile `</script` dizisinden arındırılır.
 */
export function buildPreviewDocument(options: BuildPreviewOptions): string {
  const { html, css, js, baseHref, styleUrls = [], scriptUrls = [] } = options;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const head = doc.head ?? doc.documentElement.appendChild(doc.createElement('head'));
  const body = doc.body ?? doc.documentElement.appendChild(doc.createElement('body'));

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
  inlineScript.textContent = escapeScriptText(js);
  body.appendChild(inlineScript);

  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}
