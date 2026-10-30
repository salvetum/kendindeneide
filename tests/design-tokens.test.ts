import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/styles/main.css'), 'utf8');

/** Mini CSS parser: yorumları siler, kural bloklarını çıkarır. */
function rules(): Map<string, string> {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const withoutAtRules = withoutComments.replace(/@[\s\S]*?\{[^{}]*\}/g, '');
  const found = new Map<string, string>();
  for (const match of withoutAtRules.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = (match[1] ?? '').trim();
    if (selector) found.set(selector, match[2] ?? '');
  }
  return found;
}

const allRules = rules();
const root = allRules.get(':root') ?? '';
const light = allRules.get("[data-theme='light']") ?? '';

/** Bir değişkenin tanımını döndürür (bulunamazsa undefined). */
function token(blocks: string[], name: string): string | undefined {
  for (const block of blocks) {
    const match = block.match(new RegExp(`(?:^|;)\\s*${name}:\\s*([^;]+);`, 'u'));
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

/** `var(--x)` zincirini çözer. Koyu tema temel alınır, çünkü her jeton
 *  orada tanımlıdır. */
function resolveToken(blocks: string[], name: string): string | undefined {
  let value = token(blocks, name);
  for (let i = 0; i < 5 && value; i += 1) {
    const match = value.match(/^var\((--[\w-]+)\)$/u);
    if (!match) break;
    value = token(blocks, match[1] ?? '');
  }
  return value;
}

const TOKENS = [
  '--surface-0',
  '--surface-1',
  '--surface-2',
  '--surface-3',
  '--surface-4',
  '--elev-1',
  '--elev-2',
  '--elev-3',
  '--glass-blur',
  '--glass-tint',
  '--glass-border',
];

/** Token tabanı görünmez olmalı: roller hâlâ eski renkleri vermeli.
 *  Bu, taban katmanının "görünmemesi" şartının doğrudan sınaması. */
const ORIJINAL = {
  dark: {
    '--bg-color': 'oklch(17% 0.008 250)',
    '--editor-bg': 'oklch(17% 0.008 250)',
    '--result-bg': 'oklch(17% 0.008 250)',
    '--header-bg': 'oklch(21% 0.01 250)',
    '--button-bg': 'oklch(25% 0.012 250)',
    '--button-hover-bg': 'oklch(30% 0.014 250)',
    '--border-color': 'oklch(30% 0.014 250)',
  },
  light: {
    '--bg-color': 'oklch(97% 0.005 250)',
    '--editor-bg': 'oklch(100% 0 0)',
    '--result-bg': 'oklch(100% 0 0)',
    '--header-bg': 'oklch(100% 0 0)',
    '--button-bg': 'oklch(93% 0.008 250)',
    '--button-hover-bg': 'oklch(88% 0.01 250)',
    '--border-color': 'oklch(88% 0.01 250)',
  },
} as const;

const ORIGINAL_ENTRIES: Record<'dark' | 'light', Record<string, string>> = {
  dark: ORIJINAL.dark,
  light: ORIJINAL.light,
};

describe('tasarım jetonları', () => {
  it('yüzey, yükseltme ve cam jetonları iki temada da tanımlı', () => {
    for (const name of TOKENS) {
      expect(token([root], name), `${name} :root içinde olmalı`).toBeDefined();
      expect(token([light], name), `${name} light temasında da olmalı`).toBeDefined();
    }
  });

  it('roller, token tabanı eklenmeden önceki renkleri veriyor', () => {
    for (const theme of ['dark', 'light'] as const) {
      const blocks = theme === 'dark' ? [root] : [light];
      for (const [role, expected] of Object.entries(ORIGINAL_ENTRIES[theme])) {
        expect(resolveToken(blocks, role), `${role} (${theme})`).toBe(expected);
      }
    }
  });

  it('gölge jetonu yeni değeri veriyor', () => {
    expect(resolveToken([root], '--shadow')).toBe('0 6px 20px oklch(15% 0.03 250 / 0.35)');
    expect(resolveToken([light], '--shadow')).toBe('0 6px 20px oklch(50% 0.02 250 / 0.08)');
  });

  it('yüzey ölçeği yalnızca ham renkten oluşuyor, zincirleme değil', () => {
    // Zincirleme tanım (--surface-3: var(--surface-2)) jetonu yanlış
    // temada sıfırlamaya yol açar; ölçek doğrudan renk olmalı.
    for (const name of TOKENS.slice(0, 8)) {
      for (const block of [root, light]) {
        expect(token([block], name), `${name} var() içermemeli`).not.toMatch(/var\(/u);
      }
    }
  });

  it('cam jetonları şimdilik etkisiz', () => {
    // Taban "görünmez" olmalı: cam değerleri nötr.
    expect(token([root], '--glass-blur')).not.toBe('0px');
    expect(token([root], '--glass-tint')).not.toBe('transparent');
    expect(token([root], '--glass-border')).not.toBe('transparent');
    expect(token([light], '--glass-blur')).not.toBe('0px');
    expect(token([light], '--glass-tint')).not.toBe('transparent');
    expect(token([light], '--glass-border')).not.toBe('transparent');
  });
});
