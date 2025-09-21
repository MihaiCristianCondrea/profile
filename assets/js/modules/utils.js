const globalScope = typeof window !== 'undefined' ? window : globalThis;
const ModuleRegistry =
  typeof module === 'object' && typeof module.exports === 'object'
    ? require('./moduleRegistry.js')
    : globalScope.ModuleRegistry;

if (!ModuleRegistry || typeof ModuleRegistry.register !== 'function') {
  throw new Error('Site utilities require ModuleRegistry to be available.');
}

function getNestedValue(obj, path, defaultValue = undefined) {
  if (!obj || typeof path !== 'string') {
    return defaultValue;
  }

  const segments = path
    .replace(/\[(\w+)\]/g, '.$1')
    .replace(/\s+/g, '')
    .split('.')
    .filter(Boolean);

  let current = obj;
  for (const segment of segments) {
    if (current && Object.prototype.hasOwnProperty.call(current, segment)) {
      current = current[segment];
    } else {
      return defaultValue;
    }
  }
  return current === undefined ? defaultValue : current;
}

function extractFirstImageFromHtml(htmlContent) {
  if (typeof htmlContent !== 'string' || !htmlContent.trim()) {
    return null;
  }

  const firstImgMatch = htmlContent.match(/<img[^>]+src="([^"]+)"/i);
  if (firstImgMatch && firstImgMatch[1] && !firstImgMatch[1].startsWith('data:image')) {
    return firstImgMatch[1];
  }

  const googleImageMatch = htmlContent.match(/(https?:\/\/[^"]+\.googleusercontent\.com\/[^"]+)/i);
  if (googleImageMatch && googleImageMatch[1]) {
    return googleImageMatch[1];
  }

  return null;
}

function getDynamicElement(id) {
  if (!id) {
    return null;
  }
  const doc = globalScope.document;
  return doc && typeof doc.getElementById === 'function' ? doc.getElementById(id) : null;
}

function setCopyrightYear() {
  const doc = globalScope.document;
  if (!doc) {
    return;
  }

  const copyrightElement = doc.getElementById('copyright-message');
  if (!copyrightElement) {
    return;
  }

  const currentYear = new Date().getFullYear();
  const yearText = currentYear === 2025 ? '2025' : `2025-${currentYear}`;
  copyrightElement.textContent = `Copyright © ${yearText}, Mihai-Cristian Condrea`;
}

function showPageLoadingOverlay() {
  const doc = globalScope.document;
  if (!doc) {
    return;
  }
  const overlay = doc.getElementById('pageLoadingOverlay');
  if (overlay) {
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-busy', 'true');
  }
}

function hidePageLoadingOverlay() {
  const doc = globalScope.document;
  if (!doc) {
    return;
  }
  const overlay = doc.getElementById('pageLoadingOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-busy', 'false');
  }
}

const SiteUtils = {
  getNestedValue,
  extractFirstImageFromHtml,
  getDynamicElement,
  setCopyrightYear,
  showPageLoadingOverlay,
  hidePageLoadingOverlay
};

ModuleRegistry.register('utils', SiteUtils, { alias: 'SiteUtils' });

if (globalScope && typeof globalScope === 'object') {
  globalScope.getNestedValue = SiteUtils.getNestedValue;
  globalScope.extractFirstImageFromHtml = SiteUtils.extractFirstImageFromHtml;
  globalScope.getDynamicElement = SiteUtils.getDynamicElement;
  globalScope.showPageLoadingOverlay = SiteUtils.showPageLoadingOverlay;
  globalScope.hidePageLoadingOverlay = SiteUtils.hidePageLoadingOverlay;
  globalScope.setCopyrightYear = SiteUtils.setCopyrightYear;
}

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = SiteUtils;
}
