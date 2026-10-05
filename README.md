# KendinDeneIDE

**Dene ve Öğren!** — tarayıcıda çalışan HTML/CSS/JavaScript kod editörü.

---

## 🇹🇷 Türkçe

Tek dosyalık, sunucusuz bir kod editörü. Yazdığın HTML/CSS/JS'i aynı anda çalıştır,
Prettier ile biçimlendir, JSHint/CSSLint/HTMLHint ile denetle.

### Özellikler

- Birleşik (`htmlmixed`) ve ayrık (HTML / CSS / JS sekmeli) düzen
- Prettier ile biçimlendirme, JSHint + CSSLint + HTMLHint ile denetim
- Koyu (Dracula) / açık (Eclipse) tema, Türkçe / İngilizce arayüz
- İçe aktarılabilir kütüphaneler: jQuery, Bootstrap 5, React 18, Vue 3
- `localStorage` otomatik kayıt, `index.html` olarak indirme
- Kısayollar: `Ctrl+R` çalıştır · `Ctrl+Shift+F` biçimlendir · `Ctrl+Alt+R` sıfırla · `Ctrl+S` indir

### Geliştirme

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # tip kontrolü + lint + test + format kontrolü
npm run build        # dist/
npm run preview      # dist/ önizleme

npx playwright install chromium firefox webkit   # ilk seferde
npm run test:e2e     # Chromium + Firefox + WebKit uçtan uca
npm run test:e2e:ui  # aynı testler arayüzle
```

Kaynak kod `src/` altındadır:

| Yol            | İçerik                                                           |
| -------------- | ---------------------------------------------------------------- |
| `index.html`   | Uygulama iskeleti ve i18n işaretleri                             |
| `src/app/`     | Durum, depolama, çeviriler, DOM referansları                     |
| `src/core/`    | Belge oluşturma, önizleme, editör, biçimlendirme, denetleyiciler |
| `src/ui/`      | Toast, modal, tema, dil, ayarlar, ayırıcı                        |
| `src/actions/` | Çalıştır, kaydet, biçimlendir, geri al, indir                    |
| `tests/`       | Vitest + jsdom birim testleri                                    |
| `e2e/`         | Playwright uçtan uca testleri (üç tarayıcı)                      |

### Yayınlama

`main` dalına push yapıldığında GitHub Actions otomatik olarak derleyip
GitHub Pages'e yayınlar (`.github/workflows/deploy.yml`).
Depo ayarlarında **Pages → Source: GitHub Actions** seçili olmalıdır.

### Sürekli entegrasyon

`.github/workflows/ci.yml` iki job çalıştırır: tip kontrolü / lint / format /
birim testleri / derleme, ve üç tarayıcıda uçtan uca testler. Başarısız bir uçtan
uca koşuda `playwright-report` artifact olarak yüklenir.

### Teknolojiler

Vite · TypeScript · CodeMirror 5 · Prettier · Vitest · ESLint · Playwright

---

## 🇬🇧 English

A serverless web editor that runs in the browser. Write HTML/CSS/JS, run it instantly,
format it with Prettier, and lint it with JSHint, CSSLint, and HTMLHint.

### Features

- Combined (`htmlmixed`) and split (HTML / CSS / JS tabs) layouts
- Prettier formatting, JSHint + CSSLint + HTMLHint linting
- Dark (Dracula) / light (Eclipse) themes, Turkish / English interface
- Injectable libraries: jQuery, Bootstrap 5, React 18, Vue 3
- Auto-save to `localStorage`, download as `index.html`
- Shortcuts: `Ctrl+R` run · `Ctrl+Shift+F` format · `Ctrl+Alt+R` reset · `Ctrl+S` download

### Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # typecheck + lint + test + format check
npm run build        # dist/
npm run preview      # preview dist/

npx playwright install chromium firefox webkit   # first run
npm run test:e2e     # end-to-end on Chromium + Firefox + WebKit
npm run test:e2e:ui  # same tests with the UI runner
```

### Deployment

Pushing to `main` runs GitHub Actions, which builds the app and publishes it to
GitHub Pages (`.github/workflows/deploy.yml`).
Set **Pages → Source: GitHub Actions** in the repository settings.

### Continuous integration

`.github/workflows/ci.yml` runs two jobs: typecheck / lint / format / unit tests
/ build, and the end-to-end suite on all three browsers. A failing end-to-end run
uploads the `playwright-report` artifact.

### Stack

Vite · TypeScript · CodeMirror 5 · Prettier · Vitest · ESLint · Playwright

---

**Vibecodingle yapilmsitir.（＞人＜；）**
