import type { AndroidApp } from '../domain/AndroidApp.ts';

export const ANDROID_APPS_ENDPOINT =
  'https://mihaicristiancondrea.github.io/com.d4rk.apis/api/app_toolkit/v2/release/en/home/api_android_apps.json';

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeApp(value: unknown): AndroidApp | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const categorySource = source.category;
  const categoryLabel = typeof categorySource === 'string'
    ? readString(categorySource)
    : categorySource && typeof categorySource === 'object'
      ? readString((categorySource as Record<string, unknown>).label)
        ?? readString((categorySource as Record<string, unknown>).category_id)
      : undefined;
  const screenshots = Array.isArray(source.screenshots)
    ? source.screenshots.flatMap((screenshot): string[] => {
      if (typeof screenshot === 'string') return [screenshot];
      if (!screenshot || typeof screenshot !== 'object') return [];
      const url = readString((screenshot as Record<string, unknown>).url);
      return url ? [url] : [];
    })
    : [];

  return {
    name: readString(source.name),
    iconLogo: readString(source.iconLogo),
    packageName: readString(source.packageName),
    description: readString(source.description),
    categoryLabel: categoryLabel ?? readString(source.categoryLabel),
    screenshots,
  };
}

export async function fetchAndroidApps(): Promise<AndroidApp[]> {
  const response = await fetch(ANDROID_APPS_ENDPOINT);
  if (!response.ok) {
    throw new Error(`Android apps request failed with status ${response.status}.`);
  }

  const payload = await response.json() as unknown;
  if (!payload || typeof payload !== 'object') return [];
  const data = (payload as Record<string, unknown>).data;
  if (!data || typeof data !== 'object') return [];
  const apps = (data as Record<string, unknown>).apps;
  if (!Array.isArray(apps)) return [];

  return apps
    .map(normalizeApp)
    .filter((app): app is AndroidApp => app !== null);
}
