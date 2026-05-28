declare const SiteAnimations: {
  init?: () => void;
  animateSongCards?: (nodes: NodeListOf<Element>) => void;
  animateNewsCards?: (nodes: NodeListOf<Element>) => void;
} | undefined;

declare const SiteMetadata: {
  updateForRoute?: (routeConfig: unknown, context: unknown) => void;
} | undefined;

declare const RouterRoutes: any;
declare const RouterAnimation: any;
declare const RouterContentLoader: any;
declare const RouterHistory: any;
declare const initSmartCleanerPage: (() => void) | undefined;

declare global {
  interface Window { marked?: { parse: (markdown: string) => string }; }
}
export {};
