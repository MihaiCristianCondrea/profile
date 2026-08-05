export function getDynamicElement(id: string): HTMLElement | null {
  return document.getElementById(id);
}

export function setCopyrightYear(): void {
  const copyrightElement = document.getElementById('copyright-message');
  if (!copyrightElement) return;

  const firstYear = 2025;
  const currentYear = new Date().getFullYear();
  const yearText = currentYear <= firstYear ? String(firstYear) : `${firstYear}–${currentYear}`;
  copyrightElement.textContent = `Copyright © ${yearText}, Mihai-Cristian Condrea`;
}

export function showPageLoadingOverlay(): void {
  document.getElementById('pageLoadingOverlay')?.classList.add('active');
}

export function hidePageLoadingOverlay(): void {
  document.getElementById('pageLoadingOverlay')?.classList.remove('active');
}
