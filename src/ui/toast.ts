import { TOAST_ICON_BY_KIND } from '../app/constants';
import { dom } from '../app/dom';
import type { ToastKind } from '../app/types';

const VISIBLE_MS = 3000;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Aynı anda tek toast gösterilir. Yeni bir toast geldiğinde görünen mesaj
 * atlanmaz, kuyruğa alınır.
 */
export function showToast(message: string, kind: ToastKind = 'info'): void {
  if (dom.toast.classList.contains('show')) {
    if (hideTimer !== undefined) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => render(message, kind), VISIBLE_MS);
    return;
  }
  render(message, kind);
}

function render(message: string, kind: ToastKind): void {
  dom.toastMessage.textContent = message;
  dom.toastIcon.innerHTML = TOAST_ICON_BY_KIND[kind];
  dom.toast.classList.add('show');
  dom.toast.setAttribute('role', 'status');
  dom.toast.setAttribute('aria-live', 'polite');
  hideTimer = setTimeout(() => dom.toast.classList.remove('show'), VISIBLE_MS);
}
