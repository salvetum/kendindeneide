import { LIBRARIES, LIBRARY_KEYS } from '../app/constants';
import { dom } from '../app/dom';
import { SUPPORTED_LANGS, t } from '../app/i18n';
import { state } from '../app/state';
import { TAB_SIZES } from '../core/editorPrefs';
import type { ChoiceSettingKey, SettingKey } from '../app/types';

export interface SettingsOptions {
  /** Ayar düğmesine tıklandığında çağrılır. */
  readonly onToggle: (key: SettingKey, active: boolean) => void;
  /** Açılır listede yeni değer seçildiğinde çağrılır. */
  readonly onChoice: (key: ChoiceSettingKey, value: string) => void;
}

const noop: SettingsOptions = {
  onToggle: () => undefined,
  onChoice: () => undefined,
};

let current: SettingsOptions = noop;

function section(title: string): HTMLHeadingElement {
  const heading = document.createElement('h4');
  heading.className = 'settings-subtitle';
  heading.textContent = title;
  return heading;
}

function divider(): HTMLHRElement {
  const rule = document.createElement('hr');
  rule.className = 'settings-divider';
  return rule;
}

function chip(label: string, key: SettingKey, active: boolean, type: string): HTMLButtonElement {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = `setting-item${active ? ' active' : ''}`;
  item.dataset.key = key;
  item.dataset.type = type;
  item.textContent = label;
  item.setAttribute('aria-pressed', String(active));
  return item;
}

function row(...children: HTMLElement[]): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'settings-row';
  container.append(...children);
  return container;
}

function selectField(
  labelText: string,
  key: ChoiceSettingKey,
  value: string,
  options: readonly (readonly [string, string])[],
): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'settings-field';

  const caption = document.createElement('span');
  caption.className = 'settings-field-label';
  caption.textContent = labelText;

  const picker = document.createElement('select');
  picker.className = 'settings-select';
  picker.dataset.setting = key;
  for (const [optionValue, optionLabel] of options) {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionLabel;
    option.selected = optionValue === value;
    picker.append(option);
  }

  label.append(caption, picker);
  return label;
}

/** Ayar panelini mevcut duruma göre yeniden basar (dil değişiminde de çağrılır). */
export function renderSettings(options: SettingsOptions): void {
  current = options;
  const grid = dom.settingsGrid;
  const lang = state.lang;
  grid.replaceChildren();

  grid.appendChild(section(t(lang, 'language')));
  grid.appendChild(
    row(
      ...SUPPORTED_LANGS.map((code) =>
        chip(code.toUpperCase(), code, state.lang === code, 'language'),
      ),
    ),
  );
  grid.appendChild(divider());

  grid.appendChild(section(t(lang, 'themeMode')));
  grid.appendChild(
    selectField(t(lang, 'themeMode'), 'theme', state.theme, [
      ['dark', t(lang, 'themeDark')],
      ['light', t(lang, 'themeLight')],
      ['system', t(lang, 'themeSystem')],
    ]),
  );
  grid.appendChild(divider());

  grid.appendChild(section(t(lang, 'appSettings')));
  grid.appendChild(chip(t(lang, 'saveCode'), 'saveCodeEnabled', state.saveCodeEnabled, 'app'));
  grid.appendChild(chip(t(lang, 'autoRun'), 'autoRunEnabled', state.autoRunEnabled, 'app'));
  grid.appendChild(divider());

  grid.appendChild(section(t(lang, 'editorPrefs')));
  grid.appendChild(
    selectField(t(lang, 'fontSize'), 'editorFontSize', state.editorFontSize, [
      ['small', t(lang, 'fontSizeSmall')],
      ['medium', t(lang, 'fontSizeMedium')],
      ['large', t(lang, 'fontSizeLarge')],
    ]),
  );
  grid.appendChild(
    selectField(
      t(lang, 'tabSize'),
      'editorTabSize',
      state.editorTabSize,
      TAB_SIZES.map((size) => [size, size] as const),
    ),
  );
  grid.appendChild(chip(t(lang, 'wordWrap'), 'editorWordWrap', state.editorWordWrap, 'app'));
  grid.appendChild(divider());

  grid.appendChild(section(t(lang, 'libraries')));
  grid.appendChild(
    row(
      ...LIBRARY_KEYS.map((key) =>
        chip(LIBRARIES[key].name, key, state.libraries.includes(key), 'library'),
      ),
    ),
  );
}

export function initSettingsClicks(): void {
  dom.settingsGrid.addEventListener('click', (event) => {
    const item = (event.target as Element).closest<HTMLElement>('.setting-item');
    if (!item) return;

    const { key, type } = item.dataset;
    if (!key || !type) return;

    if (type === 'language') {
      current.onToggle(key as SettingKey, true);
      return;
    }

    const active = !item.classList.contains('active');
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
    current.onToggle(key as SettingKey, active);
  });

  dom.settingsGrid.addEventListener('change', (event) => {
    const picker = (event.target as Element).closest<HTMLSelectElement>('.settings-select');
    if (!picker?.dataset.setting) return;
    current.onChoice(picker.dataset.setting as ChoiceSettingKey, picker.value);
  });
}
