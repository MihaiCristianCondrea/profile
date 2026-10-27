export function showPageLoadingOverlay(): void {
  document.getElementById('pageLoadingOverlay')?.classList.add('active');
}

export function hidePageLoadingOverlay(): void {
  document.getElementById('pageLoadingOverlay')?.classList.remove('active');
}
