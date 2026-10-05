import { dom } from '../app/dom';

let onConfirm: (() => void) | null = null;

export function openModal(modal: HTMLElement): void {
  modal.classList.add('show');
  modal.removeAttribute('aria-hidden');
  // Odağı modal içine al ki Escape ve Tab doğru yere gitsin.
  modal.querySelector<HTMLElement>('button, [href], input, select, textarea')?.focus();
}

export function closeModal(modal: HTMLElement): void {
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  if (modal === dom.confirmModal) onConfirm = null;
}

/** Escape ile en üstteki açık modalı kapatır. Kapatılan modal olduysa true. */
export function closeTopModal(): boolean {
  const open = [...dom.modalOverlays].reverse().find((modal) => modal.classList.contains('show'));
  if (!open) return false;
  closeModal(open);
  return true;
}

export function showConfirmation(message: string, confirm: () => void): void {
  onConfirm = confirm;
  dom.modalMessage.textContent = message;
  openModal(dom.confirmModal);
}

export function initModals(): void {
  for (const modal of dom.modalOverlays) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal || (event.target as Element).closest('.modal-close-btn')) {
        closeModal(modal);
      }
    });
  }

  dom.modalConfirmBtn.addEventListener('click', () => {
    const action = onConfirm;
    closeModal(dom.confirmModal);
    action?.();
  });

  dom.modalCancelBtn.addEventListener('click', () => closeModal(dom.confirmModal));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeTopModal();
    }
  });
}
