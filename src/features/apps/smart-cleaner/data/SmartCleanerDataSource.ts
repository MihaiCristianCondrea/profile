export const SMART_CLEANER_METADATA_URL =
  'https://android-apps-metadata-backend.mihaicristiancondrea.workers.dev/admin/api/v1/apps/com.d4rk.cleaner';

/**
 * Reads the live short description for Smart Cleaner.
 *
 * Returns `null` whenever the endpoint is unavailable or the payload does not
 * carry a usable string, so the page can keep the authored copy it shipped
 * with instead of blanking out.
 */
export async function fetchSmartCleanerShortDescription(): Promise<string | null> {
  if (typeof fetch !== 'function') return null;

  try {
    const response = await fetch(SMART_CLEANER_METADATA_URL);
    if (!response.ok) return null;

    const payload = await response.json() as unknown;
    const app = (payload as { data?: { app?: Record<string, unknown> } })?.data?.app;
    const shortDescription = app?.short_description;
    return typeof shortDescription === 'string' && shortDescription.trim()
      ? shortDescription.trim()
      : null;
  } catch {
    return null;
  }
}
