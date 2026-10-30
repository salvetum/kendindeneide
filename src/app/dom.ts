function must<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`DOM bulunamadı: ${selector}`);
  return element;
}

function mustAll<T extends Element>(selector: string): T[] {
  return [...document.querySelectorAll<T>(selector)];
}

const $ = {
  header: must<HTMLElement>('.header'),
  editorContainer: must<HTMLElement>('#editor-container'),
  resultContainer: must<HTMLElement>('#result-container'),
  resizer: must<HTMLElement>('#resizer'),
  resultFrame: must<HTMLIFrameElement>('#result-frame'),
  previewDevice: must<HTMLElement>('#preview-device'),
  previewDesktopBtn: must<HTMLButtonElement>('#preview-desktop'),
  previewTabletBtn: must<HTMLButtonElement>('#preview-tablet'),
  previewMobileBtn: must<HTMLButtonElement>('#preview-mobile'),
  combinedView: must<HTMLElement>('#combined-view'),
  separatedView: must<HTMLElement>('#separated-view'),
  separateBtnText: must<HTMLElement>('#separate-btn-text'),
  editorTabs: must<HTMLElement>('.editor-tabs'),
  findbar: must<HTMLElement>('#findbar'),
  shareBtn: must<HTMLButtonElement>('#share-btn'),
  emmetBtn: must<HTMLButtonElement>('#emmet-btn'),
  findInput: must<HTMLInputElement>('#find-input'),
  findCount: must<HTMLElement>('#find-count'),
  findPrev: must<HTMLButtonElement>('#find-prev'),
  findNext: must<HTMLButtonElement>('#find-next'),
  findClose: must<HTMLButtonElement>('#find-close'),
  replaceInput: must<HTMLInputElement>('#replace-input'),
  replaceOne: must<HTMLButtonElement>('#replace-one'),
  replaceAll: must<HTMLButtonElement>('#replace-all'),
  confirmModal: must<HTMLElement>('#confirm-modal'),
  settingsModal: must<HTMLElement>('#settings-modal'),
  infoModal: must<HTMLElement>('#info-modal'),
  shortcutModal: must<HTMLElement>('#shortcut-modal'),
  settingsGrid: must<HTMLElement>('#settings-grid'),
  errorOverlay: must<HTMLElement>('#error-overlay'),
  errorRefreshBtn: must<HTMLButtonElement>('#error-refresh-btn'),
  diagnostics: must<HTMLElement>('#diagnostics'),
  diagnosticsToggle: must<HTMLButtonElement>('#diagnostics-toggle'),
  diagnosticsSummary: must<HTMLElement>('#diagnostics-summary'),
  diagnosticsClear: must<HTMLButtonElement>('#diagnostics-clear'),
  diagnosticsList: must<HTMLOListElement>('#diagnostics-list'),
  toast: must<HTMLElement>('#toast'),
  toastIcon: must<HTMLElement>('#toast-icon'),
  toastMessage: must<HTMLElement>('#toast-message'),
  themeBtn: must<HTMLButtonElement>('#theme-btn'),
  statusBar: must<HTMLElement>('#status-bar'),
  statusLinesValue: must<HTMLElement>('#status-lines-value'),
  statusCharsValue: must<HTMLElement>('#status-chars-value'),
  statusSizeValue: must<HTMLElement>('#status-size-value'),
  statusDeviceValue: must<HTMLElement>('#status-device-value'),
  statusLangValue: must<HTMLElement>('#status-lang-value'),
  modalMessage: must<HTMLElement>('#modal-message'),
  modalConfirmBtn: must<HTMLButtonElement>('#modal-confirm-btn'),
  modalCancelBtn: must<HTMLButtonElement>('#modal-cancel-btn'),
  modalOverlays: mustAll<HTMLElement>('.modal-overlay'),
  textareas: {
    code: must<HTMLTextAreaElement>('#code-editor'),
    html: must<HTMLTextAreaElement>('#html-editor'),
    css: must<HTMLTextAreaElement>('#css-editor'),
    js: must<HTMLTextAreaElement>('#js-editor'),
  },
} as const;

export const dom = $;
