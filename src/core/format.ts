import type { Options } from 'prettier';
import type * as prettierStandalone from 'prettier/standalone';
import type { PrettierParser } from '../app/types';

type FormatFn = typeof prettierStandalone.format;

interface PrettierBundle {
  readonly format: FormatFn;
  readonly baseOptions: Pick<Options, 'printWidth' | 'embeddedLanguageFormatting'>;
  readonly plugins: NonNullable<Options['plugins']>;
}

export const PRINT_WIDTH = 100;

let loading: Promise<PrettierBundle> | null = null;

/**
 * Prettier + 4 eklentisi ~1 MB. Yalnızca "Biçimlendir" ilk kez basıldığında
 * yüklenir, ilk boyama ~250 KB'a düşer.
 */
export function ensurePrettier(): Promise<PrettierBundle> {
  loading ??= (async (): Promise<PrettierBundle> => {
    const [standalone, html, postcss, babel, estree] = await Promise.all([
      import('prettier/standalone'),
      import('prettier/plugins/html'),
      import('prettier/plugins/postcss'),
      import('prettier/plugins/babel'),
      import('prettier/plugins/estree'),
    ]);
    return {
      format: standalone.format,
      baseOptions: { printWidth: PRINT_WIDTH, embeddedLanguageFormatting: 'auto' },
      plugins: [html, postcss, babel, estree],
    };
  })().catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}

/** Biçimlendirme hatasında Promise reddedilir; çağıran taraf toast gösterir. */
export async function format(
  source: string,
  parser: PrettierParser,
  overrides: Partial<Options> = {},
): Promise<string> {
  const { format: run, baseOptions, plugins } = await ensurePrettier();
  const formatted = await run(source, { ...baseOptions, ...overrides, parser, plugins });
  // Prettier, birleşik belgede <head> ile <style> arasına boş satır ekliyor.
  return parser === 'html' ? formatted.replaceAll(/(\n\s*\n)(\s*<style)/g, '\n$2') : formatted;
}
