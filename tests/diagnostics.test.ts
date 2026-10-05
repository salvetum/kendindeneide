import { Script } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { buildPreviewDocument } from '../src/core/document';
import {
  DIAGNOSTIC_CHANNEL,
  LINE_OFFSET_TOKEN,
  USER_SCRIPT_MARKER,
  diagnosticsBridgeSource,
  isDiagnosticReport,
} from '../src/core/diagnostics';
import type { DiagnosticReport } from '../src/core/diagnostics';

const BASE = { html: '<!DOCTYPE html><html><body><h1>Merhaba</h1></body></html>', css: '', js: '' };

function report(overrides: Partial<DiagnosticReport> = {}): DiagnosticReport {
  return {
    channel: DIAGNOSTIC_CHANNEL,
    kind: 'runtime',
    level: 'error',
    text: 'boom',
    tag: null,
    line: null,
    column: null,
    ...overrides,
  };
}

function headScripts(html: string): Element[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return [...doc.head.querySelectorAll('script')];
}

describe('diagnosticsBridgeSource', () => {
  const source = diagnosticsBridgeSource();

  it('geçerli JavaScript olarak derlenir', () => {
    expect(() => new Script(source)).not.toThrow();
  });

  it('serileştirmeyi bozacak </script dizisi içermez', () => {
    // Köprü <script> içine yazılıp outerHTML ile serileştiriliyor; ham metin
    // öğelerinde kaçış yapılmadığı için dizi belgeyi erken kapatırdı.
    expect(source.toLowerCase()).not.toContain('</script');
  });

  it('dinamik kod çalıştırmaz', () => {
    expect(source).not.toMatch(/\beval\b|new Function/);
  });

  it('üç kaynağı dinler ve kanaldan postMessage gönderir', () => {
    expect(source).toContain("'error'");
    expect(source).toContain("addEventListener('unhandledrejection'");
    expect(source).toContain('console.error = function');
    expect(source).toContain('console.warn = function');
    expect(source).toContain('parent.postMessage');
    expect(source).toContain(JSON.stringify(DIAGNOSTIC_CHANNEL));
  });

  it('kaynak hatalarını yakalamak için error dinleyicisi capture kullanır', () => {
    // `<img>`/`<link>` hataları BUBBLE ETMEZ; yalnızca capture dinleyicisi görür.
    // Bu olmadan "yüklenemeyen kaynak" uyarısı hiç oluşmaz (ilk koşuda öyle
    // olduğu için üç tarayıcıda da test kırmızıydı).
    expect(source).toMatch(/addEventListener\(\s*'error',[\s\S]*?\},\s*true,/);
  });

  it('geliştirici konsolundaki çıktıyı korur', () => {
    // Sarmalayıcılar özgün metotları da çağırmalı; aksi hâlde hata yalnızca
    // panelde görünür, geliştirici araçlarında kaybolur.
    expect(source).toContain('nativeError.apply(console, arguments)');
    expect(source).toContain('nativeWarn.apply(console, arguments)');
  });
});

describe('isDiagnosticReport', () => {
  it('geçerli raporları kabul eder', () => {
    expect(isDiagnosticReport(report())).toBe(true);
    expect(isDiagnosticReport(report({ kind: 'console', level: 'warn' }))).toBe(true);
    expect(isDiagnosticReport(report({ kind: 'rejection' }))).toBe(true);
    expect(isDiagnosticReport(report({ kind: 'resource', tag: 'script' }))).toBe(true);
  });

  it.each([
    ['null', null],
    ['dize', 'kendindeneide/diagnostics'],
    ['dizi', []],
    ['number', 42],
    ['başka kanal', report({ channel: 'başka' as typeof DIAGNOSTIC_CHANNEL })],
    ['geçersiz kind', report({ kind: 'secilme' as 'runtime' })],
    ['geçersiz level', report({ level: 'info' as 'error' })],
    ['sayısal text', report({ text: 5 as unknown as string })],
  ])('%s değerini reddeder', (_label, value) => {
    expect(isDiagnosticReport(value)).toBe(false);
  });

  it('eksik alanları reddeder', () => {
    const { line: _line, ...missingLine } = report();
    expect(isDiagnosticReport(missingLine)).toBe(true); // line opsiyonel sayılır

    const { tag: _tag, ...missingTag } = report();
    expect(isDiagnosticReport(missingTag)).toBe(true);

    const { text: _text, ...missingText } = report();
    expect(isDiagnosticReport(missingText)).toBe(false);
  });
});

describe('buildPreviewDocument köprüsü', () => {
  const bridge = diagnosticsBridgeSource();

  it('bridge verilmezse belgeye dokunmaz', () => {
    expect(buildPreviewDocument({ ...BASE })).not.toContain(DIAGNOSTIC_CHANNEL);
  });

  it('köprüyü head içine, kullanıcı betiğinden önce koyar', () => {
    const doc = new DOMParser().parseFromString(
      buildPreviewDocument({ ...BASE, js: 'console.log(1)', bridge }),
      'text/html',
    );
    const head = doc.head.querySelectorAll('script');
    const body = doc.body.querySelectorAll('script');

    expect(head).toHaveLength(1);
    expect(head[0]?.textContent).toContain(DIAGNOSTIC_CHANNEL);
    expect(body).toHaveLength(1);
    expect(body[0]?.textContent).toBe('console.log(1)');
  });

  it('köprü dış kütüphanelerden önce çalışır', () => {
    // head betikleri gövde betiklerinden önce çalışır; kütüphane betiklerinin
    // ürettiği hatalar da yakalanmalı.
    const html = buildPreviewDocument({
      ...BASE,
      bridge,
      scriptUrls: ['https://example.test/lib.js'],
    });
    expect(headScripts(html)).toHaveLength(1);
    expect(html).toContain('https://example.test/lib.js');
    expect(html.indexOf(DIAGNOSTIC_CHANNEL)).toBeLessThan(html.indexOf('example.test'));
  });

  it('base href köprüden önce, stil bağlantısından sonra gelir', () => {
    const html = buildPreviewDocument({
      ...BASE,
      bridge,
      baseHref: 'http://127.0.0.1:4173/',
      styleUrls: ['https://example.test/lib.css'],
    });
    expect(html).toContain('<base href="http://127.0.0.1:4173/">');
    expect(html.indexOf('<base')).toBeLessThan(html.indexOf(DIAGNOSTIC_CHANNEL));
    expect(html.indexOf(DIAGNOSTIC_CHANNEL)).toBeLessThan(html.indexOf('example.test/lib.css'));
  });

  it('head içindeki kullanıcı betiğinden bile önce gelir', () => {
    // HTML ayrıştırıcısı gövdesiz bir <script> etiketini <head> içine taşır.
    // Köprü append edilseydi kullanıcının hatası kaçardı.
    const html = buildPreviewDocument({
      ...BASE,
      html: '<script>kullaniciKodu()</script>',
      bridge,
    });
    const scripts = headScripts(html);

    expect(scripts).toHaveLength(2);
    expect(scripts[0]?.textContent).toContain(DIAGNOSTIC_CHANNEL);
    expect(scripts[1]?.textContent).toBe('kullaniciKodu()');
  });

  it('köprü betiğini de kaçışlar', () => {
    const html = buildPreviewDocument({ ...BASE, bridge: 'var s = "</script>";' });
    expect(html).toContain('<\\/script>');
  });

  it('kullanıcı betiğinin satır kaydırmasını köprüye yazar', () => {
    const html = buildPreviewDocument({ ...BASE, js: 'satir1();\nsatir2();', bridge });
    expect(html).not.toContain(LINE_OFFSET_TOKEN);

    const marker = html.indexOf(`<script ${USER_SCRIPT_MARKER}`);
    const expected = html.slice(0, marker).split('\n').length - 1;
    expect(html).toContain(`var LINE_OFFSET = '${expected}';`);
  });

  it('kullanıcı betiğini işaretler', () => {
    const html = buildPreviewDocument({ ...BASE, js: 'x()', bridge });
    expect(html).toContain(`<script ${USER_SCRIPT_MARKER}="">x()</script>`);
  });
});
