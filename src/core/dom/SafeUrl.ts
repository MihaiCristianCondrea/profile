/**
 * Resolves a value against the current document and keeps it only when it is
 * an `http:` or `https:` URL. Anything else — including `javascript:` and
 * `data:` — is rejected, so remote feed content can never supply a link or
 * image source that executes.
 */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/** `safeHttpUrl` with a caller-supplied replacement for rejected values. */
export function safeHttpUrlOr(value: string | null | undefined, fallback: string): string {
  return safeHttpUrl(value) ?? fallback;
}
