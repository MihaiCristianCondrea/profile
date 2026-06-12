export interface RouteConfig { title: string; path?: string; pageTitle?: string; metadata?: Record<string, unknown>; }
export interface SanitizedMetadata { title: string; description?: string; canonicalUrl?: string; image?: string; type?: string; }
export type HomeLoadCallback = () => void;
export type PageLoadCallback = () => void;
export interface RouterOptions { showOverlay?: () => void; hideOverlay?: () => void; closeDrawer?: () => void; onHomeLoad?: HomeLoadCallback; pageHandlers?: Record<string, PageLoadCallback>; }
export interface SongTrack { title: string; artists: string; image: string | null; link: string; }
export interface SongsApiResponse { songs?: unknown[]; tracks?: unknown[]; }
export interface BloggerPost { title?: string; content?: string; url?: string; images?: Array<{url?: string}>; }
export interface BloggerPostsResponse { items?: BloggerPost[]; }
export interface CommittersResponse { user?: string[]; data_asof?: string; }
