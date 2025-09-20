import { getDynamicElement } from '../core/utils.js';

export function initContactPage() {
  const openButton = getDynamicElement('openContactDialog');
  const contactDialog = getDynamicElement('contactDialog');

  if (!openButton || !contactDialog) {
    return false;
  }

  if (openButton.dataset.dialogInit === 'true') {
    return true;
  }

  openButton.addEventListener('click', () => {
    contactDialog.open = true;
  });
  openButton.dataset.dialogInit = 'true';

  return true;
}

export default {
  initContactPage
};
