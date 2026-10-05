# Changelog

Bu projedeki tüm önemli değişiklikler bu dosyada belgelenir.
Format [Keep a Changelog](https://keepachangelog.com/tr-TR/1.1.0/) esinlenerek hazırlanmıştır.

## [3.0.2] — Firefox Font Düzeltmesi

Firefox 157 ile uçtan uca doğrulama yapıldı ve butonların yanlış fontla
çizildiği görüldü.

### Düzeltildi

- **Butonlar Firefox'ta yanlış fontla çiziliyordu:** tarayıcılar form
  kontrollerine `font-family` **miras almaz**. Chrome'un kullanıcı tarayıcı
  stil sayfası varsayılanı `Arial` (Segoe UI'ye yakın olduğu için fark
  edilmiyor), Firefox'unki ise `MS Shell Dlg \32 ` — Windows 3.1'in bayt
  yazı tipiyle gelen MS Sans Serif. Uygulamadaki bütün butonlar, sekme
  etiketleri ve ayar paneli anahtarları bu yüzden gövde fontunu kullanamıyordu.
  Artık `button, input, select, textarea` `font-family: inherit` alıyor
- **Google Fonts'a var olmayan aile isteniyordu:** `Segoe UI` Microsoft'un
  sistem fontudur, Google Fonts'ta yok; istek sessizce yoksayılıyordu.
  Adres satırından çıkarıldı

### Eklendi

- `tests/styles.test.ts` — form kontrolleri ve font değişkenleri için
  regresyon testleri (jsdom tarayıcı varsayılan fontunu yansıtmadığı için
  bu hata yalnızca gerçek tarayıcıda görülebiliyordu)

## [3.0.1] — Tarayıcıda Doğrulanan Düzeltmeler

Bu tur, uygulama gerçek bir tarayıcıda (Chrome, otomatik uçtan uca senaryolar)
çalıştırılarak yeniden gözden geçirildi ve bulunan hatalar giderildi.

### Düzeltildi

- **"Birleştir" tüm düzenlemeleri siliyordu:** görünüm bayrağı `readSource()`
  okunmadan önce çevrildiği için kaynak bayat birleşik içerikten geliyordu;
  ayrık görünümde yapılan her değişiklik geri alınıyordu
- **`<base href>` kalıcı metne sızıyordu:** preview için eklenen taban adresi
  hem "Kodu Sakla" deposuna hem de indirilen `index.html` dosyasına yazılıyor,
  her kayıtta biriktiriyordu. Artık yalnızca preview dokümanına ekleniyor ve
  ayrıştırma sırasında temizleniyor
- **HTMLHint hiç çalışmıyordu:** UMD paketi globali `{ HTMLHint: <örnek> }`
  biçiminde dışa aktarıyor, `verify` doğrudan globalin üzerinde değil
- **CSSLint uyarı üretmiyordu:** `verify()` bir dizi değil
  `{ messages, ... }` rapor nesnesi döndürüyor
- **Lint yalnızca açılışta etkinleşiyordu:** ayrık görünüme geçince oluşturulan
  HTML/CSS/JS editörleri hiç lint almıyordu; artık her editör oluşturulurken
  bağlanıyor
- **Bir linter çöktüğünde tüm lint duruyordu:** hata artık editör bazında
  yutuluyor
- **"Geri Al" kalıcı değildi:** programatik yazmalarda `change` olayları
  bastırıldığı için geri alma yalnızca ekranda görünüyordu; sayfa yenilenince
  eski kod geri geliyordu
- JSHint sütun konumları bir karakter kaydıydı

### Eklendi

- Linter eşleyicileri (JSHint / CSSLint / HTMLHint) için birim testleri
- `<base>` sızıntısına karşı ayrıştırma regresyon testleri
- Uçtan uca tarayıcı senaryoları: preview render, `</script>` kaçışı,
  ayır/birleştir kalıcılığı, lint işaretleri, otomatik kayıt + yenileme,
  indirilen dosya, tema, modal, geri alma, kütüphane yükleme

## [3.0.0] — Vite + TypeScript Altyapısı

### Eklendi

- Vite, TypeScript, ESLint, Prettier ve Vitest altyapısı
- `src/` altında modüler TypeScript kaynakları (app / core / ui / actions)
- Saf mantık için birim testleri: belge oluşturma, ayrıştırma, depolama, i18n, varsayılan kod
- Gerçek `index.html` ile açılış (boot) duman testi
- GitHub Actions: tip kontrolü + lint + format + test + derleme
- GitHub Actions: `dist/` çıktısını GitHub Pages'e otomatik yayınlama
- Favicon `public/` altına taşındı

### Düzeltildi

- Kullanıcı JS'i içinde `</script>` geçtiğinde preview'in kırılması
- Kodu sakla işlemi artık her tuş vuruşunda Prettier çalıştırmıyor (yalın metin kaydedilir)
- Preview her çalıştırmada yeniden ayrıştırılmıyor (önbellek)
- Lint eklentisi hiç yüklenmediği için tuş vuruşunda oluşan `performLint` hatası
- Modal'lar Escape tuşu ile kapatılamıyordu
- Panel ayırıcısı dokunmatik ve klavyeyle kullanılamıyordu
- Koyu temada her çalıştırmada beyaz flaş
- Ayar kapatıldığında kayıtlı kod ve kütüphaneler temizlenmiyordu

### Değiştirildi

- Preview, string birleştirme yerine Blob URL + `iframe.src` ile besleniyor
- Prettier ve linter kütüphaneleri ilk yüklemeden çıkarılıp tembel yükleniyor (~2 MB → ~250 kB)
- Kaynak kod `lib/CUSTOM.js` tek dosyasından modüllere bölündü; `lib/` klasörü kaldırıldı
- Çeviriler `textContent` ile basılıyor, HTML gerektiren anahtarlar ayrıldı
- İkon düğmelerine `aria-label`, sekmelere ve modallara ARIA rolleri eklendi
- Kaydedilmemiş değişiklik varken `beforeunload` uyarısı gösteriliyor
- Ctrl+S kısayolu bağlandı

## [Planlanan]

Geliştirme fikirleri ve bilinen hatalar için bkz. `NOTLAR.md` (repoya dahil değildir).
Öne çıkanlar: CodeMirror 5 → 6 geçişi, konsol paneli ve REPL, proje sistemi,
URL ile paylaşım, PWA/çevrimdışı çalışma.

## [2026-06-08] — Dokümantasyon

### Değiştirildi

- README içeriği ve biçimlendirmesi gözden geçirildi

## [2026-06-02] — Dokümantasyon

### Eklendi

- README'ye İngilizce çeviri, emoji'li yapı ve gelecek geliştirme planları bölümü

### Değiştirildi

- README proje açıklaması yeniden yazıldı

## [2025-07-16] — Çok Dilli Destek

### Eklendi

- İngilizce dil desteği (TR/EN geçişi)
- Bilgi (Hakkında) modalı

### Değiştirildi

- Varsayılan dil İngilizce olarak ayarlandı, ardından arayüz dili tekrar TR yapıldı
- README güncellendi

## [2025-07-03] — Bakım

### Eklendi

- Kod içine açıklayıcı yorum satırı

## [2025-06-17] — v2 İyileştirmeleri

### Eklendi

- Favicon

### Değiştirildi

- Kod düzenlemesi ve optimizasyonu
- Hata düzeltmeleri ve birkaç yeni özellik

## [2025-06-16] — v2

### Değiştirildi

- Proje v2 olarak yeniden yayınlandı

## [2025-06-05] — İlk Sürüm

### Eklendi

- İlk dosya yüklemeleri (index.html, lib/, README)
- Header rengi değişikliği ve hafif kod temizliği
- MIT LICENSE
