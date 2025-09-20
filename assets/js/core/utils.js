/**
 * Safely retrieves a nested value from an object using a path string.
 * @param {object} obj - The object to traverse.
 * @param {string} path - The path string (e.g., 'a.b.c' or 'a[0].b').
 * @param {*} [defaultValue] - The value to return if the path is not found.
 * @returns {*} The value at the path or the default value.
 */
export function getNestedValue(obj, path, defaultValue = undefined) {
  const segments = String(path)
    .split(/[,[\]]+?/) // split on array notation first
    .filter(Boolean);
  const result = segments.reduce(
    (value, key) => (value !== null && value !== undefined ? value[key] : value),
    obj
  );
  if (result === undefined || result === obj) {
    const dotNotationSegments = String(path)
      .split(/[,[\].]+?/) // fallback for dot notation
      .filter(Boolean);
    const dotResult = dotNotationSegments.reduce(
      (value, key) => (value !== null && value !== undefined ? value[key] : value),
      obj
    );
    return dotResult === undefined || dotResult === obj ? defaultValue : dotResult;
  }
  return result;
}

/**
 * Extracts the first image URL from HTML content.
 * Prioritizes non-data URI src attributes, then Google User Content URLs.
 * @param {string} htmlContent - The HTML content to parse.
 * @returns {string|null} The image URL or null if not found.
 */
export function extractFirstImageFromHtml(htmlContent) {
  if (!htmlContent) {
    return null;
  }
  const inlineImageMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/);
  if (inlineImageMatch && inlineImageMatch[1] && !inlineImageMatch[1].startsWith('data:image')) {
    return inlineImageMatch[1];
  }
  const bloggerImageMatch = htmlContent.match(/(https?:\/\/[\w.-]+\.googleusercontent\.com\/[^"]+)/);
  if (bloggerImageMatch && bloggerImageMatch[1]) {
    return bloggerImageMatch[1];
  }
  return null;
}

/**
 * Helper to safely get an element by ID, especially for dynamically loaded content.
 * @param {string} id - The ID of the element.
 * @returns {HTMLElement|null} The element or null if not found.
 */
export function getDynamicElement(id) {
  return document.getElementById(id);
}

/**
 * Sets the copyright year in the footer.
 */
export function setCopyrightYear() {
  const copyrightElement = document.getElementById('copyright-message');
  if (copyrightElement) {
    const currentYear = new Date().getFullYear();
    const yearText = currentYear === 2025 ? '2025' : `2025-${currentYear}`;
    copyrightElement.textContent = `Copyright © ${yearText}, Mihai-Cristian Condrea`;
  }
}

/**
 * Show page loading overlay.
 */
export function showPageLoadingOverlay() {
  const overlay = document.getElementById('pageLoadingOverlay');
  if (overlay) {
    overlay.classList.add('active');
  }
}

/**
 * Hide page loading overlay.
 */
export function hidePageLoadingOverlay() {
  const overlay = document.getElementById('pageLoadingOverlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

export default {
  getNestedValue,
  extractFirstImageFromHtml,
  getDynamicElement,
  setCopyrightYear,
  showPageLoadingOverlay,
  hidePageLoadingOverlay
};
