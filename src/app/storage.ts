/**
 * localStorage'a erişim tek noktadan geçsin. Depolama dolu/engelli (private mode)
 * olduğunda uygulama çökmesin, sadece ayar kaydedilmesin.
 */

export const STORAGE_KEYS = {
  theme: 'theme',
  language: 'language',
  saveCodeEnabled: 'saveCodeEnabled',
  autoRunEnabled: 'autoRunEnabled',
  selectedLibraries: 'selectedLibraries',
  editorContent: 'liveCodeEditorContent',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

function safeGet(key: StorageKey): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: StorageKey, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('localStorage yazılamadı:', error);
    return false;
  }
}

export function remove(key: StorageKey): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* yok sayılır */
  }
}

export function getBoolean(key: StorageKey, fallback = false): boolean {
  const raw = safeGet(key);
  if (raw === null) return fallback;
  return raw === 'true';
}

export function setBoolean(key: StorageKey, value: boolean): boolean {
  return safeSet(key, String(value));
}

export function getString(key: StorageKey): string | null {
  return safeGet(key);
}

export function setString(key: StorageKey, value: string): boolean {
  return safeSet(key, value);
}

/** JSON okurken bozuk veri veya beklenmeyen tipte sonuç üretmemeli. */
export function getJson<T>(
  key: StorageKey,
  fallback: T,
  validate: (value: unknown) => value is T,
): T {
  const raw = safeGet(key);
  if (raw === null) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function setJson(key: StorageKey, value: unknown): boolean {
  return safeSet(key, JSON.stringify(value));
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
