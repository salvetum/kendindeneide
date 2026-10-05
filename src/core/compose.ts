import { LIBRARIES } from '../app/constants';
import { state } from '../app/state';
import type { LibraryKey, ParsedCode } from '../app/types';
import { requireEditor } from './editors';
import { buildPreviewDocument, parseFullCode } from './document';
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

/** Preview'e gönderilecek ve indirilecek tam doküman. */
export function buildRunnableDocument(options: { includeLibraries?: boolean } = {}): string {
  const { htmlCode, cssCode, jsCode } = readSource();
  const { styleUrls, scriptUrls } =
    options.includeLibraries === false
      ? { styleUrls: [], scriptUrls: [] }
      : libraryUrls(state.libraries);
  return buildPreviewDocument({
    html: htmlCode,
    css: cssCode,
    js: jsCode,
    baseHref: previewBaseHref(),
    styleUrls,
    scriptUrls,
  });
}

/**
 * "Kodu Sakla" için kalıcı metin.
 *
 * Kasıtlı olarak Prettier'dan geçirilmez: kaydetme tuş başına değil, 800 ms
 * debounce sonrasında çalışır ve biçimlendirmek 1 MB'lık Prettier'ı her
 * duraklamada indirmek/yürütmek demektir.
 */
export function serializeForStorage(): string {
  const { htmlCode, cssCode, jsCode } = readSource();
  return buildPreviewDocument({
    html: htmlCode,
    css: cssCode,
    js: jsCode,
    baseHref: previewBaseHref(),
  });
}
