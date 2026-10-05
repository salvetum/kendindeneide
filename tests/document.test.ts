import { describe, expect, it } from 'vitest';

import { buildPreviewDocument, escapeScriptText, parseFullCode } from '../src/core/document';

const FULL_CODE = `<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <title>Test</title>
    <link rel="stylesheet" href="https://cdn.example.com/bootstrap.css" />
    <style>
      body { color: red; }
    </style>
  </head>
  <body>
    <h1>Merhaba</h1>
    <script src="https://cdn.example.com/jquery.js"></script>
    <script>
      console.log('selam');
    </script>
  </body>
</html>`;

describe('parseFullCode', () => {
  it('style ve script içeriklerini ayırır', () => {
    const { cssCode, jsCode } = parseFullCode(FULL_CODE);

    expect(cssCode).toContain('color: red');
    expect(jsCode).toContain("console.log('selam')");
  });

  it('kütüphane enjeksiyonlarını HTML parçasından temizler', () => {
    const { htmlCode } = parseFullCode(FULL_CODE);

    expect(htmlCode).toContain('<h1>Merhaba</h1>');
    expect(htmlCode).toContain('<title>Test</title>');
    expect(htmlCode).not.toContain('color: red');
    expect(htmlCode).not.toContain("console.log('selam')");
    expect(htmlCode).not.toContain('bootstrap.css');
    expect(htmlCode).not.toContain('jquery.js');
  });

  it('doctype daima küçük harfli html olarak normalize edilir', () => {
    expect(parseFullCode('<p>merhaba</p>').htmlCode).toMatch(/^<!DOCTYPE html>/u);
    expect(parseFullCode(FULL_CODE).htmlCode).toMatch(/^<!DOCTYPE html>/u);
  });

  it('doctype ve html iskeletini korur', () => {
    const { htmlCode } = parseFullCode(FULL_CODE);

    expect(htmlCode).toContain('<html lang="tr"');
    expect(htmlCode).toContain('</html>');
  });

  it('kullanıcı kodundaki </script> dizisini bozmadan döner', () => {
    const js = 'const html = "</scr" + "ipt><b>merhaba</b>";';
    const { jsCode, htmlCode } = parseFullCode(`<body><script>${js}</script></body>`);

    expect(jsCode).toContain('</scr');
    // Ayrıştırılan HTML'de script bloğu kalmamalı; enjekte edilen içerik çıkarıldı.
    expect(htmlCode).not.toContain('<b>merhaba</b>');
  });
});

describe('buildPreviewDocument', () => {
  it('kullanıcı JS içindeki </script dizisini güvenle gömer', () => {
    const js = 'document.body.innerHTML = "<script>alert(1)</script>";';
    const doc = buildPreviewDocument({ html: '<body><p>x</p></body>', css: '', js });

    // Ham string birleştirme yapılsaydı burada erken kapanış olurdu.
    expect(doc).toContain('<\\/script>');
    expect(doc).toContain('alert(1)');

    // Ayrıştırıldığında script bloğu kesilmemeli, içerik tam kalmalı.
    const reparsed = parseFullCode(doc);
    expect(reparsed.jsCode).toContain('alert(1)');
    expect(reparsed.jsCode.replaceAll('<\\/', '</')).toBe(js);
  });

  it('css ve js içeriklerini ayrı bloklara yerleştirir', () => {
    const doc = buildPreviewDocument({
      html: '<body><h1>Başlık</h1></body>',
      css: 'h1 { color: blue; }',
      js: 'console.log(42);',
    });

    expect(doc).toContain('<h1>Başlık</h1>');
    expect(doc).toMatch(/<style>h1 \{ color: blue; \}<\/style>/u);
    expect(doc).toMatch(/<script>console\.log\(42\);<\/script>/u);
    expect(doc).toMatch(/^<!DOCTYPE html>/u);
  });

  it('base etiketini head başına ekler', () => {
    const doc = buildPreviewDocument({
      html: '<head><title>t</title></head><body></body>',
      css: '',
      js: '',
      baseHref: 'https://ornek.example/',
    });

    expect(doc.indexOf('<base href="https://ornek.example/">')).toBeLessThan(
      doc.indexOf('<title>'),
    );
  });

  it('stil bağlantılarını satır içi style bloğundan önce koyar', () => {
    const doc = buildPreviewDocument({
      html: '<head></head><body></body>',
      css: 'a{}',
      js: '',
      styleUrls: ['https://cdn.example.com/a.css'],
    });

    expect(doc.indexOf('a.css')).toBeLessThan(doc.indexOf('<style>'));
  });

  it('dış betikleri satır içi script bloğundan önce koyar', () => {
    const doc = buildPreviewDocument({
      html: '<head></head><body></body>',
      css: '',
      js: 'calistir();',
      scriptUrls: ['https://cdn.example.com/lib.js'],
    });

    expect(doc.indexOf('lib.js')).toBeLessThan(doc.indexOf('calistir();'));
  });

  it('head veya body eksik belgeyi onarır', () => {
    const doc = buildPreviewDocument({ html: '<p>paragraf</p>', css: '', js: '' });

    expect(doc).toContain('<head>');
    expect(doc).toContain('<body>');
    expect(doc).toContain('<p>paragraf</p>');
  });
});

describe('escapeScriptText', () => {
  it('yalnızca </script dizisini kaçışlar', () => {
    expect(escapeScriptText('a </script> b')).toBe('a <\\/script> b');
    expect(escapeScriptText('a </SCRIPT > b')).toBe('a <\\/SCRIPT > b');
    expect(escapeScriptText('a </scriptx> b')).toBe('a <\\/scriptx> b');
    expect(escapeScriptText('a <script> b')).toBe('a <script> b');
    expect(escapeScriptText('1 < 2 && 3 > 2')).toBe('1 < 2 && 3 > 2');
  });

  it('kaçışlanmış kodu yeniden ayrıştırınca JS motoru için aynı kaynak elde edilir', () => {
    const js = 'const t = "</script>"; if (a < b) {}';
    const reparsed = parseFullCode(
      buildPreviewDocument({ html: '<body></body>', css: '', js }),
    ).jsCode;

    // Ham metinde `\/` kaçışı kalır ama JS motoru bunu `/` olarak okur.
    expect(reparsed).not.toBe(js);
    expect(reparsed.replaceAll('<\\/', '</')).toBe(js);
  });
});
