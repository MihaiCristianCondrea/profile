interface DialogElement extends HTMLElement {
  open: boolean;
}

export function initContactPage(): boolean {
  const openButton = document.getElementById('openContactDialog');
  const contactDialog = document.getElementById('contactDialog') as DialogElement | null;
  if (!openButton || !contactDialog) return false;
  if (openButton.dataset.dialogInitialized === 'true') return true;

  openButton.addEventListener('click', () => {
    contactDialog.open = true;
  });
  openButton.dataset.dialogInitialized = 'true';
  return true;
}
