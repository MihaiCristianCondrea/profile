const globalScope = typeof window !== 'undefined' ? window : globalThis;
const ModuleRegistry =
  typeof module === 'object' && typeof module.exports === 'object'
    ? require('../modules/moduleRegistry.js')
    : globalScope.ModuleRegistry;

if (!ModuleRegistry || typeof ModuleRegistry.register !== 'function') {
  throw new Error('Contact page module requires ModuleRegistry.');
}

function initContactPage() {
  const doc = globalScope.document;
  if (!doc) {
    return false;
  }

  const openButton = doc.getElementById('openContactDialog');
  const contactDialog = doc.getElementById('contactDialog');

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

const ContactPageModule = { initContactPage };

ModuleRegistry.register('page.contact', ContactPageModule, { alias: 'ContactPage' });

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = ContactPageModule;
}

if (typeof window !== 'undefined') {
  window.initContactPage = ContactPageModule.initContactPage;
}
