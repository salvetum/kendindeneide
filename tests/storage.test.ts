import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  STORAGE_KEYS,
  getBoolean,
  getJson,
  getString,
  isStringArray,
  remove,
  setBoolean,
  setJson,
  setString,
} from '../src/app/storage';

describe('storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('string değerleri yazıp okur', () => {
    expect(setString(STORAGE_KEYS.language, 'en')).toBe(true);
    expect(getString(STORAGE_KEYS.language)).toBe('en');
  });

  it('olmayan string için null döner', () => {
    expect(getString(STORAGE_KEYS.language)).toBeNull();
  });

  it('boolean değerleri yazıp okur', () => {
    setBoolean(STORAGE_KEYS.saveCodeEnabled, true);
    expect(getBoolean(STORAGE_KEYS.saveCodeEnabled)).toBe(true);

    setBoolean(STORAGE_KEYS.saveCodeEnabled, false);
    expect(getBoolean(STORAGE_KEYS.saveCodeEnabled)).toBe(false);
  });

  it('boolean için varsayılan değeri döner', () => {
    expect(getBoolean(STORAGE_KEYS.autoRunEnabled)).toBe(false);
    expect(getBoolean(STORAGE_KEYS.autoRunEnabled, true)).toBe(true);
  });

  it('boolean olmayan değerleri false sayar', () => {
    window.localStorage.setItem(STORAGE_KEYS.saveCodeEnabled, 'evet');
    expect(getBoolean(STORAGE_KEYS.saveCodeEnabled)).toBe(false);
  });

  it('JSON dizisi yazıp okur', () => {
    setJson(STORAGE_KEYS.selectedLibraries, ['jQuery', 'vue']);
    expect(getJson(STORAGE_KEYS.selectedLibraries, [], isStringArray)).toEqual(['jQuery', 'vue']);
  });

  it('bozuk JSON için varsayılan değeri döner', () => {
    window.localStorage.setItem(STORAGE_KEYS.selectedLibraries, '{bozuk');
    expect(getJson(STORAGE_KEYS.selectedLibraries, [], isStringArray)).toEqual([]);
  });

  it('beklenmeyen tipte JSON için varsayılan değeri döner', () => {
    setJson(STORAGE_KEYS.selectedLibraries, { jQuery: true });
    expect(getJson(STORAGE_KEYS.selectedLibraries, [], isStringArray)).toEqual([]);
  });

  it('remove anahtarı siler', () => {
    setString(STORAGE_KEYS.language, 'en');
    remove(STORAGE_KEYS.language);
    expect(getString(STORAGE_KEYS.language)).toBeNull();
  });

  it('localStorage erişilemezken çökmez', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(getString(STORAGE_KEYS.language)).toBeNull();
    expect(getBoolean(STORAGE_KEYS.saveCodeEnabled, true)).toBe(true);
    expect(setString(STORAGE_KEYS.language, 'en')).toBe(false);
    expect(setJson(STORAGE_KEYS.selectedLibraries, [])).toBe(false);
    expect(spy).toHaveBeenCalled();
  });
});

describe('isStringArray', () => {
  it('yalnızca tamamen string dizilerini kabul eder', () => {
    expect(isStringArray([])).toBe(true);
    expect(isStringArray(['a', 'b'])).toBe(true);
    expect(isStringArray(['a', 1])).toBe(false);
    expect(isStringArray('a')).toBe(false);
    expect(isStringArray(null)).toBe(false);
  });
});
