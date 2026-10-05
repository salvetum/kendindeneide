import { LIBRARIES } from '../app/constants';
import { state } from '../app/state';
import type { LibraryKey, ParsedCode } from '../app/types';
import { requireEditor } from './editors';
import { buildPreviewDocument, parseFullCode } from './document';
import { diagnosticsBridgeSource } from './diagnostics';
import { previewBaseHref } from './preview';

/** Editörlerden okunan kaynak (birleşik veya ayrık görünümden bağımsız). */
export function readSource(): ParsedCode {
  if (state.separated) {
    return {
      htmlCode: requireEditor('html').getValue(),
      cssCode: requireEditor('css').getValue(),
      jsCode: requireEditor('js').getValue(),
    };
  }
  return parseCombined(requireEditor('code').getValue());
}

/**
 * Birleşik kodun ayrıştırılması DOMParser'a gidiyor; aynı metin üst üste
 * çağrıldığında (ör. çalıştır + kaydet) sonucu yeniden kullan.
 */
let parseMemo: { input: string; output: ParsedCode } | null = null;

export function parseCombined(fullCode: string): ParsedCode {
  if (parseMemo?.input === fullCode) return parseMemo.output;
  const output = parseFullCode(fullCode);
  parseMemo = { input: fullCode, output };
  return output;
}

export function invalidateSourceCache(): void {
  parseMemo = null;
}

function libraryUrls(keys: readonly LibraryKey[]): {
  styleUrls: string[];
  scriptUrls: string[];
} {
  const styleUrls: string[] = [];
  const scriptUrls: string[] = [];
  for (const key of keys) {
    const definition = LIBRARIES[key];
    if (!definition) continue;
    styleUrls.push(...(definition.styles ?? []));
    scriptUrls.push(...(definition.scripts ?? []));
  }
  return { styleUrls, scriptUrls };
}

export interface RunnableOptions {
  /** Seçili kütüphaneleri (link/script) belgeye ekle. */
  readonly includeLibraries?: boolean;
  /**
   * Blob URL'de göreli yolların çözülebilmesi için `<base href>` ekle.
   * Yalnızca preview için gerekir; kaydedilen/indirilen metne konmamalıdır.
   */
  readonly includeBaseHref?: boolean;
  /**
   * Preview'e hata köprüsünü enjekte et. Yalnızca çalıştırılan önizlemede
   * gerekir; `serializeForStorage` bunu bilerek kapalı tutar.
   */
  readonly includeDiagnostics?: boolean;
}

/** Preview'e gönderilecek tam doküman. */
export function buildRunnableDocument({
  includeLibraries = true,
  includeBaseHref = true,
  includeDiagnostics = false,
}: RunnableOptions = {}): string {
  const { htmlCode, cssCode, jsCode } = readSource();
  const { styleUrls, scriptUrls } = includeLibraries
    ? libraryUrls(state.libraries)
    : { styleUrls: [], scriptUrls: [] };
  return buildPreviewDocument({
    html: htmlCode,
    css: cssCode,
    js: jsCode,
    baseHref: includeBaseHref ? previewBaseHref() : undefined,
    styleUrls,
    scriptUrls,
    bridge: includeDiagnostics ? diagnosticsBridgeSource() : undefined,
  });
}

/**
 * "Kodu Sakla" için kalıcı metin.
 *
 * Kütüphane, `<base>` ve hata köprüsü eklenmez: bunlar ortam bilgisi taşır veya
 * yalnızca çalıştırılan önizlemeye aittir; indirilen dosya kendi başına
 * çalışmalıdır.
 *
 * Kasıtlı olarak Prettier'dan geçirilmez: kaydetme tuş başına değil, 800 ms
 * debounce sonrasında çalışır ve biçimlendirmek 1 MB'lık Prettier'ı her
 * duraklamada indirmek/yürütmek demek.
 */
export function serializeForStorage(): string {
  return buildRunnableDocument({ includeLibraries: false, includeBaseHref: false });
}
