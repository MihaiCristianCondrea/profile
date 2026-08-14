export interface OpenGraphMetadata {
  title: string;
  description: string;
  type: string;
  image: string;
  imageAlt: string;
  siteName: string;
}

export interface TwitterMetadata {
  card: string;
  title: string;
  description: string;
  image: string;
  site: string;
  creator: string;
}

export interface RouteMetadata {
  description: string;
  keywords: string[];
  canonicalSlug: string;
  openGraph: OpenGraphMetadata;
  twitter: TwitterMetadata;
}

export interface RouteConfig {
  id: string;
  title: string;
  path: string | null;
  /** Route renders edge-to-edge instead of inside the shell content column. */
  fullBleed: boolean;
  metadata: RouteMetadata;
}

export interface RouteLoadContext {
  pageId: string;
  pageTitle: string;
  loadStatus: RouteLoadStatus;
}

export type RouteLoadStatus = 'success' | 'error' | 'not-found';

export interface PageMarkupResult {
  status: RouteLoadStatus;
  title: string;
  html: string;
  sourceTitle?: string;
  error?: unknown;
}

export interface SanitizedMetadata {
  canonicalUrl: string;
  description: string;
  keywords: string;
  ogTitle: string;
  twitterTitle: string;
}

export type PageLoadCallback = () => void;

export interface RouterOptions {
  showOverlay?: () => void;
  hideOverlay?: () => void;
  closeDrawer?: () => void;
  onHomeLoad?: PageLoadCallback;
  pageHandlers?: Record<string, PageLoadCallback>;
}
