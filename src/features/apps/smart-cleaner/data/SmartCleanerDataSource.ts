import { safeHttpUrl } from '../../../../core/dom/SafeUrl.ts';
import type { SmartCleanerAppMetadata } from '../domain/SmartCleanerAppMetadata.ts';

export const SMART_CLEANER_METADATA_URL =
  'https://android-apps-metadata-backend.mihaicristiancondrea.workers.dev/admin/api/v1/apps/com.d4rk.cleaner';

// The app metadata service has been served with both camelCase and snake_case
// icon keys. Read the documented order used by the shared app-showcase mapper
// and accept either casing rather than depending on one spelling.
const ICON_KEYS = [
  'iconUrl',
  'icon_url',
  'iconLogo',
  'icon_logo',
  'icon',
  'image',
  'imageUrl',
  'image_url',
] as const;

function readString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readIconUrl(app: Record<string, unknown>): string | null {
  for (const key of ICON_KEYS) {
    const candidate = safeHttpUrl(readString(app, key));
    if (candidate) return candidate;
  }
  return null;
}

/**
 * Reads live metadata for Smart Cleaner.
 *
 * Every field is optional: the endpoint being unavailable, or a payload without
 * a usable value, leaves the authored copy and icon in place rather than
 * blanking the page out.
 */
export async function fetchSmartCleanerMetadata(): Promise<SmartCleanerAppMetadata> {
  const empty: SmartCleanerAppMetadata = { shortDescription: null, iconUrl: null };
  if (typeof fetch !== 'function') return empty;

  try {
    const response = await fetch(SMART_CLEANER_METADATA_URL);
    if (!response.ok) return empty;

    const payload = await response.json() as unknown;
    const app = (payload as { data?: { app?: unknown } })?.data?.app;
    if (!app || typeof app !== 'object') return empty;

    const source = app as Record<string, unknown>;
    return {
      shortDescription: readString(source, 'short_description')
        ?? readString(source, 'shortDescription')
        ?? null,
      iconUrl: readIconUrl(source),
    };
  } catch {
    return empty;
  }
}
