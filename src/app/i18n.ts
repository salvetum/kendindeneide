import type { Lang } from './types';

type Template = (...args: string[]) => string;
type TranslationValue = string | Template;
type Dictionary = Readonly<Record<string, TranslationValue>>;

/**
 * Çeviriler düz metin olarak yazılır; `<strong>` gibi işaretleme içeren
 * anahtarlar HTML_KEYS'te listelenir ve innerHTML ile basılır.
 */
const STRINGS: Readonly<Record<Lang, Dictionary>> = {
  tr: {
    title: 'Dene ve Öğren!',
    logoText: 'Dene ve Öğren!',
    run: 'Çalıştır',
    format: 'Biçimlendir',
    separate: 'Dilleri Ayır',
    combine: 'Birleştir',
    save: 'Kaydet',
    revert: 'Geri Al',
    clear: 'Temizle',
    runTooltip: 'Kodu Çalıştır (Ctrl+R)',
    formatTooltip: 'Kodu Biçimlendir (Ctrl+Shift+F)',
    separateTooltip: 'Kodları Birleştir',
    saveTooltip: 'Dosyayı Kaydet (Ctrl+S)',
    revertTooltip: 'Değişiklikleri Geri Al (Ctrl+Alt+R)',
    clearTooltip: 'Sonucu Temizle',
    infoTooltip: 'Bilgi',
    settingsTooltip: 'Ayarlar',
    themeTooltip: 'Temayı Değiştir',
    resizeTooltip: 'Panel genişliğini ayır',
    editor: 'Editör',
    result: 'Sonuç',
    settings: 'Ayarlar',
    appSettings: 'Uygulama Ayarları',
    saveCode: 'Kodu Sakla',
    autoRun: 'Oto-Çalıştır',
    libraries: 'Kütüphaneler',
    language: 'Dil',
    close: 'Kapat',
    confirmAction: 'Eylemi Onayla',
    confirm: 'Onayla',
    cancel: 'İptal',
    revertConfirm:
      'Tüm değişiklikleri ve kütüphane seçimlerini geri almak istediğinizden emin misiniz?',
    toastRun: 'Kod çalıştırıldı',
    toastFormat: 'Kod biçimlendirildi',
    toastClear: 'Sonuç temizlendi',
    toastRevert: 'Değişiklikler ve kütıphaneler sıfırlandı',
    toastSave: 'Dosya başarıyla indirildi',
    toastSaveError: 'Kod kaydedilemedi, depolama dolu olabilir.',
    toastFormatError: (parser) => `${parser.toUpperCase()} biçimlendirilemedi.`,
    toastSettingToggle: (label, state) => `${label} ${state === 'true' ? 'açıldı' : 'kapatıldı'}.`,
    toastPreviewBlocked: (name) =>
      `"${name}" sandbox içinde çalışmadı; bu bir tarayıcı güvenlik kısıtlamasıdır.`,
    loadErrorTitle: 'Yükleme Hatası',
    loadErrorMsg:
      'Uygulama başlatılamadı.<br>Tüm dosyalar bu sayfayla birlikte gelir; internet bağlantısı veya reklam engelleyici bu hataya yol açmaz.<br>Lütfen tarayıcı önbelleğini temizleyip sayfayı yenileyin.',
    refreshPage: 'Sayfayı Yenile',
    infoModalTitle: 'Bilgi',
    infoModalP1:
      'Bu web sitesi, HTML, CSS ve JavaScript kodlarını gerçek zamanlı olarak yazmanıza, test etmenize ve sonucunu anında görmenize olanak tanıyan bir online kod editörüdür.',
    infoModalP2:
      '<strong>Özellikler:</strong> Kod renklendirme, kod biçimlendirme, popüler kütüphaneleri (jQuery, Bootstrap vb.) ekleyebilme ve projeyi kaydetme.',
    infoModalP3:
      "<strong>Gizlilik:</strong> Kodlarınız tamamen sizin kontrolünüzdedir. Yazdığınız hiçbir kod veya kişisel veri sunucularımızda saklanmaz. 'Kodu Sakla' özelliğini kullandığınızda, kodunuz yalnızca sizin tarayıcınızın yerel depolama alanına kaydedilir.",
  },
  en: {
    title: 'Try and Learn!',
    logoText: 'Try and Learn!',
    run: 'Run',
    format: 'Format',
    separate: 'Separate',
    combine: 'Combine',
    save: 'Save',
    revert: 'Revert',
    clear: 'Clear',
    runTooltip: 'Run Code (Ctrl+R)',
    formatTooltip: 'Format Code (Ctrl+Shift+F)',
    separateTooltip: 'Combine Languages',
    saveTooltip: 'Save File (Ctrl+S)',
    revertTooltip: 'Revert Changes (Ctrl+Alt+R)',
    clearTooltip: 'Clear Result',
    infoTooltip: 'Info',
    settingsTooltip: 'Settings',
    themeTooltip: 'Toggle Theme',
    resizeTooltip: 'Resize panels',
    editor: 'Editor',
    result: 'Result',
    settings: 'Settings',
    appSettings: 'Application Settings',
    saveCode: 'Save Code',
    autoRun: 'Auto-Run',
    libraries: 'Libraries',
    language: 'Language',
    close: 'Close',
    confirmAction: 'Confirm Action',
    confirm: 'Confirm',
    cancel: 'Cancel',
    revertConfirm: 'Are you sure you want to revert all changes and library selections?',
    toastRun: 'Code executed',
    toastFormat: 'Code formatted',
    toastClear: 'Result cleared',
    toastRevert: 'Changes and libraries have been reset',
    toastSave: 'File downloaded successfully',
    toastSaveError: 'Could not save code, storage may be full.',
    toastFormatError: (parser) => `Could not format ${parser.toUpperCase()}.`,
    toastSettingToggle: (label, state) =>
      `${label} has been ${state === 'true' ? 'enabled' : 'disabled'}.`,
    toastPreviewBlocked: (name) =>
      `"${name}" did not run inside the sandbox due to a browser security restriction.`,
    loadErrorTitle: 'Loading Error',
    loadErrorMsg:
      'The application could not start.<br>Every file ships with this page; an internet connection or an ad-blocker cannot cause this error.<br>Please clear your browser cache and reload.',
    refreshPage: 'Refresh Page',
    infoModalTitle: 'About',
    infoModalP1:
      'This website is an online code editor that allows you to write, test, and see the results of HTML, CSS, and JavaScript code in real-time.',
    infoModalP2:
      '<strong>Features:</strong> Syntax highlighting, code formatting, ability to add popular libraries (jQuery, Bootstrap, etc.), and project saving.',
    infoModalP3:
      "<strong>Privacy:</strong> Your code is entirely under your control. None of the code you write or any personal data is stored on our servers. When you use the 'Save Code' feature, your code is saved only to your browser's local storage.",
  },
};

/** İçerik olarak HTML'e ihtiyaç duyan çeviri anahtarları. */
const HTML_KEYS: ReadonlySet<string> = new Set(['loadErrorMsg', 'infoModalP2', 'infoModalP3']);

export function isHtmlKey(key: string): boolean {
  return HTML_KEYS.has(key);
}

export function hasKey(lang: Lang, key: string): boolean {
  return Object.hasOwn(STRINGS[lang], key);
}

export function t(lang: Lang, key: string, ...args: string[]): string {
  const value = STRINGS[lang][key];
  if (value === undefined) {
    console.warn(`Eksik çeviri: ${lang}.${key}`);
    return key;
  }
  return typeof value === 'function' ? value(...args) : value;
}

export const SUPPORTED_LANGS: readonly Lang[] = ['tr', 'en'];

export function isLang(value: string): value is Lang {
  return (SUPPORTED_LANGS as readonly string[]).includes(value);
}

/** Tüm çeviri anahtarları — test, TR/EN eşitliği kontrolü için kullanılır. */
export function keysOf(lang: Lang): string[] {
  return Object.keys(STRINGS[lang]);
}
