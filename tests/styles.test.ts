import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/styles/main.css'), 'utf8');

function rules(src: string): Array<{ selectors: string[]; body: string }> {
  const clean = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@(?:import|charset)[^;]*;/g, '')
    .replace(/\s+/g, ' ');
  return Array.from(clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)).map((m) => ({
    selectors: (m[1] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    body: m[2] ?? '',
  }));
}

const allRules = rules(css);

function declarationsFor(selector: string): string | undefined {
  for (const rule of allRules) {
    if (rule.selectors.includes(selector)) return rule.body;
  }
  return undefined;
}

describe('form kontrolleri font devralmali', () => {
  // Tarayicilar <button>/<input> icin font-family MIRSALMAZ:
  // Chrome UA default'u "Arial", Firefox UA default'u "MS Shell Dlg \32"
  // (Windows 3.1 bitmap fontu). Butonlar bu yuzden govde fontuyla
  // cizilmiyor ve Firefox'ta bozuk gorunuyor.
  const controls = ['button', 'input', 'select', 'textarea'];

  it.each(controls)('%s font-family: inherit aliyor', (control) => {
    const body = declarationsFor(control);
    expect(body, `"${control}" icin kural bulunamadi`).toBeDefined();
    expect(body).toMatch(/font-family:\s*inherit/);
  });

  it('kural govde fontunu devraliyor (font: inherit degil)', () => {
    const body = declarationsFor('button') ?? '';
    expect(body).not.toMatch(/(?:^|[;{\s])font:\s*inherit/);
  });

  it('font degerleri tanimli', () => {
    expect(css).toMatch(/--font-mono:[^;]*JetBrains Mono/);
    expect(css).toMatch(/--font-main:[^;]*Segoe UI/);
  });

  it('editor ve govde fontu CSS degiskenlerinden besleniyor', () => {
    expect(declarationsFor('body')).toMatch(/font-family:\s*var\(--font-main\)/);
    expect(declarationsFor('.CodeMirror')).toMatch(/font-family:\s*var\(--font-mono\)/);
  });
});
