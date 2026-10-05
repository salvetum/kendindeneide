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
  combinedView: must<HTMLElement>('#combined-view'),
  separatedView: must<HTMLElement>('#separated-view'),
  separateBtnText: must<HTMLElement>('#separate-btn-text'),
  editorTabs: must<HTMLElement>('.editor-tabs'),
  confirmModal: must<HTMLElement>('#confirm-modal'),
  settingsModal: must<HTMLElement>('#settings-modal'),
  infoModal: must<HTMLElement>('#info-modal'),
  settingsGrid: must<HTMLElement>('#settings-grid'),
  errorOverlay: must<HTMLElement>('#error-overlay'),
  errorRefreshBtn: must<HTMLButtonElement>('#error-refresh-btn'),
  toast: must<HTMLElement>('#toast'),
  toastIcon: must<HTMLElement>('#toast-icon'),
  toastMessage: must<HTMLElement>('#toast-message'),
  themeBtn: must<HTMLButtonElement>('#theme-btn'),
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
