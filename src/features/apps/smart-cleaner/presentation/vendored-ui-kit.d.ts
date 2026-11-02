/**
 * Types for the vendored Smart Cleaner marketing UI kit (vendor/smart-cleaner-ui).
 * The kit is plain JavaScript owned by the app repository; these declarations
 * cover only what this feature imports. Vite resolves `@smart-cleaner-ui`.
 */
declare module '@smart-cleaner-ui/screens/index.js' {
  import type { MarketingScreen } from 'material-next-web-components/marketing.js';

  export const SCREENS: MarketingScreen[];
}

declare module '@smart-cleaner-ui/kit/assets.js' {
  export function setAssetBase(base: string): void;
}

declare module '@smart-cleaner-ui/theme/index.js' {
  export function loadFonts(): Promise<void>;
}

declare module '@smart-cleaner-ui/motion/logo.js' {
  import type { SVGTemplateResult } from 'lit';

  interface PartTransform {
    s?: number;
    r?: number;
    x?: number;
    y?: number;
    o?: number;
  }

  export function logo(
    size?: number,
    parts?: Record<string, PartTransform>,
    options?: { broom?: PartTransform },
  ): SVGTemplateResult;
}

declare module '@smart-cleaner-ui/embed.js' {
  import type { HTMLTemplateResult, SVGTemplateResult, TemplateResult } from 'lit';

  type Template = HTMLTemplateResult | SVGTemplateResult | TemplateResult;

  /** Single pieces of real screens, built by the same code the screens use. */
  export const PARTS: {
    quickScanCard(options: Record<string, unknown>): Template;
    quickCleanRow(key: string, options?: Record<string, unknown>): Template;
    swipeCard(seed: number, options?: Record<string, unknown>): Template;
    duplicateRow(id: number, options?: Record<string, unknown>): Template;
    largeFileRow(id: number, options?: Record<string, unknown>): Template;
    metadataDetail(field: string, options?: Record<string, unknown>): Template;
    statusChip(sanitized?: boolean): Template;
    categoryTile(id: string, options?: { u?: number }): Template;
    storageRing(options: { size?: number; stroke?: number; progress?: number; peeled?: string[]; number?: number }): Template;
    groupedList(rows: Template[], options?: Record<string, unknown>): Template;
  };
}
