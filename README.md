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
npm run dev        # http://localhost:5173
npm run check      # tip kontrolü + lint + test + format kontrolü
npm run build      # dist/
npm run preview    # dist/ önizleme
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

### Yayınlama

`main` dalına push yapıldığında GitHub Actions otomatik olarak derleyip
GitHub Pages'e yayınlar (`.github/workflows/deploy.yml`).
Depo ayarlarında **Pages → Source: GitHub Actions** seçili olmalıdır.

### Teknolojiler

Vite · TypeScript · CodeMirror 5 · Prettier · Vitest · ESLint

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
npm run dev        # http://localhost:5173
npm run check      # typecheck + lint + test + format check
npm run build      # dist/
npm run preview    # preview dist/
```

### Deployment

Pushing to `main` runs GitHub Actions, which builds the app and publishes it to
GitHub Pages (`.github/workflows/deploy.yml`).
Set **Pages → Source: GitHub Actions** in the repository settings.

### Stack

Vite · TypeScript · CodeMirror 5 · Prettier · Vitest · ESLint

---

**Vibecodingle yapilmsitir.（＞人＜；）**
