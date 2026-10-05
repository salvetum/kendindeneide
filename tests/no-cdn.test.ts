// Uygulama kabuğu (index.html + src/) icindeki dis CDN bagimliliklarini
// yakalar. Kullanici tarafindan secilen jQuery/Bootstrap/React/Vue gibi
// kutuphaneler src/app/constants.ts icinde ve kasitlidir; burada kontrol
// edilmez.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const mainCss = readFileSync(resolve(process.cwd(), 'src/styles/main.css'), 'utf8');

const SHELL_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'unpkg.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'use.fontawesome.com',
];

describe('uygulama kabugu dis CDN kullanmamali', () => {
  it.each(SHELL_HOSTS)('index.html icinde %s adresi yok', (host) => {
    expect(indexHtml).not.toContain(host);
  });

  it('index.html hicbir http(s) kaynak yuklemiyor', () => {
    const external = indexHtml.match(/(?:src|href)\s*=\s*"https?:\/\/[^"]+"/gi) ?? [];
    expect(external).toEqual([]);
  });

  it('kaynaklarimiz disaridan degil yerelden geliyor', () => {
    // Mutlak /fonts/... gibi yollar base './' olan GitHub Pages altinda 404 verir.
    expect(mainCss).not.toMatch(/url\(['"]?\/(?!\/)/);
  });
});

describe('JetBrains Mono self-hosted', () => {
  it('latin ve latin-ext alt kumesi icin @font-face tanimli', () => {
    expect(mainCss).toMatch(/src:\s*url\('[^']*jetbrains-mono-latin\.woff2'\)/);
    expect(mainCss).toMatch(/src:\s*url\('[^']*jetbrains-mono-latin-ext\.woff2'\)/);
  });

  // woff2 dosyalari degisken font (fvar tablosu var), bu yuzden agirlik
  // degeri degil araligi ilan edilir. Tek deger ilan edilirse kalin metin
  // ince cizilir.
  it.each([
    ['latin', /jetbrains-mono-latin\.woff2/],
    ['latin-ext', /jetbrains-mono-latin-ext\.woff2/],
  ])('%s alt kumesi tum agirligi kapsiyor', (_name, pattern) => {
    const block = mainCss.slice(mainCss.indexOf('src:') - 400, mainCss.indexOf(String(pattern)));
    expect(block).toMatch(/font-weight:\s*400 700/);
    expect(block).toMatch(/font-display:\s*swap/);
  });

  // Latin alt kumesinde U+0131 (noktasiz i) var ama g, s ve I Turkish
  // karakterleri latin-EXT alt kumesinde yer alir; latin-ext olmazsa kod
  // editoru Turkce metni baska bir fonta dusurur.
  it('latin-ext alt kumesi Turkce karakterleri kapsiyor', () => {
    const ext = mainCss.slice(mainCss.indexOf('jetbrains-mono-latin-ext.woff2') - 700);
    expect(ext).toMatch(/U\+0100-02BA/);
  });

  it('latin alt kumesi ASCII kapsiyor', () => {
    const latin = mainCss.slice(mainCss.indexOf('jetbrains-mono-latin.woff2') - 700);
    expect(latin).toMatch(/U\+0000-00FF/);
  });
});

describe('sekme ikonlari inline SVG', () => {
  it('boxicons CDN adresi yok', () => {
    expect(indexHtml).not.toMatch(/boxicons/i);
  });

  it('uc sekmede de inline SVG ikon var', () => {
    for (const editor of ['html', 'css', 'js']) {
      const button = new RegExp(`data-editor="${editor}"[\\s\\S]*?</button>`).exec(indexHtml);
      expect(button, `${editor} sekmesi bulunamadi`).not.toBeNull();
      expect(button?.[0], `${editor} sekmesinde <svg> yok`).toMatch(/<svg[\s\S]*?class="tab-icon"/);
    }
  });

  it('ikonlar yardimci teknolojiden gizli', () => {
    const icons = indexHtml.match(/<svg[\s\S]*?class="tab-icon"[\s\S]*?>/g) ?? [];
    expect(icons).toHaveLength(3);
    for (const icon of icons) {
      expect(icon).toMatch(/aria-hidden="true"/);
      expect(icon).toMatch(/focusable="false"/);
    }
  });

  it('eski <i> etiketi kalmadi', () => {
    expect(indexHtml).not.toMatch(/<i\s+class="bx/);
  });
});
