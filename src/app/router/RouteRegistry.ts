import type { RouteConfig, RouteMetadata } from '../../core/types/index.ts';
import {
  DEFAULT_OPEN_GRAPH_TYPE,
  DEFAULT_TWITTER_CARD,
  SITE_DESCRIPTION,
  SITE_IMAGE,
  SITE_IMAGE_ALT,
  SITE_TITLE,
  SITE_TWITTER_HANDLE,
} from '../../core/metadata/SiteMetadata.ts';

/**
 * Authoring shape for a route.
 *
 * Open Graph and Twitter blocks are expanded from these fields by
 * `buildMetadata`, so a route's description and share title are each written
 * once instead of being repeated across three social blocks.
 */
interface RouteDefinition {
  id: string;
  title: string;
  /** Fragment to fetch. Omit for routes rendered from the existing shell. */
  path?: string;
  description: string;
  keywords: readonly string[];
  /** Share title for Open Graph and Twitter. Defaults to the route title. */
  socialTitle?: string;
  /** Open Graph object type. Defaults to `website`. */
  ogType?: string;
  /** Share image. Defaults to the site portrait. */
  image?: string;
  imageAlt?: string;
  /** Canonical slug. Defaults to the route id, and to `''` for home. */
  canonicalSlug?: string;
  /**
   * Opts the route out of the shell's centered content column so it can own
   * its full horizontal width. See `.content-wrapper.is-full-bleed`.
   */
  fullBleed?: boolean;
}

const ROUTE_DEFINITIONS: readonly RouteDefinition[] = [
  {
    id: 'home',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    keywords: [
      'Mihai Cristian Condrea',
      'Android developer portfolio',
      'Jetpack Compose apps',
      'Kotlin Android architecture',
      'Material Design projects',
      'Android developer tools',
    ],
    socialTitle: 'Mihai-Cristian Condrea | Android Developer Portfolio',
    canonicalSlug: '',
  },
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    path: 'content/features/legal/presentation/privacy-policy.html',
    description: 'Review the website privacy policy for Mihai-Cristian Condrea\'s personal site covering analytics, local storage preferences, and data protection practices.',
    keywords: [
      'Mihai Cristian Condrea privacy policy',
      'website data protection',
      'analytics disclosure',
      'local storage preferences',
    ],
    socialTitle: 'Website Privacy Policy | Mihai-Cristian Condrea',
    ogType: 'article',
  },
  {
    id: 'songs',
    title: 'My Music',
    path: 'content/features/songs/presentation/songs.html',
    description: 'Listen to Mihai-Cristian Condrea\'s original tracks and playlists, including ambient production, electronic experiments, and featured collaborations.',
    keywords: [
      'Mihai Cristian Condrea music',
      'D4rK Rekords tracks',
      'ambient electronic producer',
      'indie Android developer musician',
    ],
    socialTitle: 'My Music | Mihai-Cristian Condrea',
    ogType: 'music.playlist',
  },
  {
    id: 'projects',
    title: 'Projects',
    path: 'content/features/projects/presentation/projects.html',
    description: 'Discover Mihai-Cristian Condrea\'s Android, web, tooling, and experimental projects spanning Jetpack Compose, Material Design, reusable libraries, and selected open-source work.',
    keywords: [
      'Jetpack Compose portfolio',
      'Android app showcase',
      'Material Design projects',
      'Android developer tools',
      'Mihai Cristian Condrea projects',
    ],
    socialTitle: 'Projects | Mihai-Cristian Condrea',
  },
  {
    id: 'contact',
    title: 'Contact',
    path: 'content/features/profile/presentation/contact.html',
    description: 'Contact Mihai-Cristian Condrea to discuss Android development, Jetpack Compose, architecture, design systems, developer tooling, or collaboration opportunities.',
    keywords: [
      'contact Mihai Cristian Condrea',
      'Android developer Romania',
      'Jetpack Compose collaboration',
      'Android architecture collaboration',
      'developer tooling',
    ],
    socialTitle: 'Contact Mihai | Android Developer',
  },
  {
    id: 'about-me',
    title: 'About Me',
    path: 'content/features/profile/presentation/about-me.html',
    description: 'Learn about Mihai-Cristian Condrea, a Bucharest-based Android developer working with Kotlin, Jetpack Compose, modern Android architecture, Material Design, reusable libraries, and developer tooling.',
    keywords: [
      'Mihai Cristian Condrea biography',
      'Bucharest Android developer',
      'Jetpack Compose developer',
      'Android architecture',
      'Material Design UI engineer',
    ],
    socialTitle: 'About Mihai-Cristian Condrea',
    ogType: 'profile',
  },
  {
    id: 'faqs',
    title: 'FAQ & Support',
    path: 'content/features/faq/presentation/faqs.html',
    description: 'Find answers to frequently asked questions about Mihai-Cristian Condrea\'s Android apps, including Google Play Services requirements, analytics usage, privacy, and official download sources.',
    keywords: [
      'Mihai Cristian Condrea FAQ',
      'Android app support questions',
      'Google Play Services requirement',
      'AdMob and Firebase analytics info',
    ],
    socialTitle: 'FAQ & Support | Mihai-Cristian Condrea',
    ogType: 'article',
  },
  {
    id: 'smart-cleaner-for-android',
    title: 'Smart Cleaner for Android',
    path: 'content/features/apps/smart-cleaner/presentation/smart-cleaner-for-android.html',
    description: 'Discover Smart Cleaner for Android, a storage-management utility with cleanup, analysis, privacy, automation, widgets, and Wear OS features.',
    keywords: [
      'Smart Cleaner for Android',
      'Android junk cleaner app',
      'Android storage cleaner',
      'Google Play phone cleaner',
    ],
    socialTitle: 'Smart Cleaner for Android | App Presentation',
    image: 'https://raw.githubusercontent.com/MihaiCristianCondrea/Smart-Cleaner-for-Android/refs/heads/master/.idea/icon.svg',
    imageAlt: 'Smart Cleaner for Android app icon',
    fullBleed: true,
  },
  {
    id: 'ads-help-center',
    title: 'Ads Help Center',
    path: 'content/features/apps/legal/presentation/ads-help-center.html',
    description: 'Understand how Mihai-Cristian Condrea integrates advertising across Android apps, including consent flows, personalization controls, and GDPR compliance.',
    keywords: [
      'Mihai Cristian Condrea ads help',
      'Android app advertising transparency',
      'Consent mode v2 guidance',
      'GDPR compliant mobile ads',
    ],
    socialTitle: 'Advertising Transparency | Mihai-Cristian Condrea',
    ogType: 'article',
  },
  {
    id: 'legal-notices',
    title: 'Legal Notices',
    path: 'content/features/apps/legal/presentation/legal-notices.html',
    description: 'Review software licenses and third-party acknowledgments for Mihai-Cristian Condrea\'s Android and web applications.',
    keywords: [
      'Mihai Cristian Condrea legal notices',
      'third party licenses Android apps',
      'open source acknowledgments',
      'software attribution list',
    ],
    socialTitle: 'Legal Notices | Mihai-Cristian Condrea',
    ogType: 'article',
  },
  {
    id: 'code-of-conduct',
    title: 'Code of Conduct',
    path: 'content/features/legal/presentation/code-of-conduct.html',
    description: 'Read the community code of conduct guiding respectful collaboration across Mihai-Cristian Condrea\'s projects and communication channels.',
    keywords: [
      'Mihai Cristian Condrea code of conduct',
      'open source community guidelines',
      'inclusive collaboration standards',
      'developer communication policy',
    ],
    socialTitle: 'Code of Conduct | Mihai-Cristian Condrea',
    ogType: 'article',
  },
  {
    id: 'privacy-policy-end-user-software',
    title: 'Privacy Policy – End-User Software',
    path: 'content/features/apps/legal/presentation/privacy-policy-apps.html',
    description: 'Review the privacy policy for Mihai-Cristian Condrea\'s Android applications covering analytics, consent mode, advertising IDs, and crash reporting.',
    keywords: [
      'Android app privacy policy',
      'Mihai Cristian Condrea software privacy',
      'Firebase analytics consent',
      'AdMob data usage disclosure',
    ],
    socialTitle: 'Android App Privacy Policy | Mihai-Cristian Condrea',
    ogType: 'article',
  },
  {
    id: 'terms-of-service-end-user-software',
    title: 'Terms of Service – End-User Software',
    path: 'content/features/apps/legal/presentation/terms-of-service-apps.html',
    description: 'Understand the terms of service governing Mihai-Cristian Condrea\'s Android apps, including licensing, in-app purchases, and user responsibilities.',
    keywords: [
      'Android app terms of service',
      'Mihai Cristian Condrea app license',
      'in-app purchase policy',
      'user responsibilities mobile apps',
    ],
    socialTitle: 'Android App Terms of Service | Mihai-Cristian Condrea',
    ogType: 'article',
  },
  {
    id: 'resume',
    title: "Mihai's Resume",
    path: 'content/features/resume/presentation/resume.html',
    description: 'Use Mihai-Cristian Condrea\'s interactive resume builder to assemble, preview, and download a polished CV template for Android developers.',
    keywords: [
      'Android developer resume builder',
      'Mihai Cristian Condrea CV template',
      'Jetpack Compose resume generator',
      'download professional resume PDF',
    ],
    socialTitle: 'Resume Builder | Mihai-Cristian Condrea',
  },
];

function buildMetadata(definition: RouteDefinition): RouteMetadata {
  const socialTitle = definition.socialTitle ?? definition.title;
  const image = definition.image ?? SITE_IMAGE;

  return {
    description: definition.description,
    keywords: [...definition.keywords],
    canonicalSlug: definition.canonicalSlug ?? definition.id,
    openGraph: {
      title: socialTitle,
      description: definition.description,
      type: definition.ogType ?? DEFAULT_OPEN_GRAPH_TYPE,
      image,
      imageAlt: definition.imageAlt ?? SITE_IMAGE_ALT,
      siteName: SITE_TITLE,
    },
    twitter: {
      card: DEFAULT_TWITTER_CARD,
      title: socialTitle,
      description: definition.description,
      image,
      site: SITE_TWITTER_HANDLE,
      creator: SITE_TWITTER_HANDLE,
    },
  };
}

const PAGE_ROUTES: ReadonlyMap<string, RouteConfig> = new Map(
  ROUTE_DEFINITIONS.map((definition) => [definition.id, {
    id: definition.id,
    title: definition.title,
    path: definition.path ?? null,
    fullBleed: definition.fullBleed ?? false,
    metadata: buildMetadata(definition),
  }]),
);

/**
 * Reduces any link target or hash to a route id. `''` and `index.html` both
 * resolve to `home`, and a trailing query string (such as `#resume?edit=true`)
 * is dropped.
 */
export function normalizeRouteId(routeId: string): string {
  const normalized = routeId.trim().replace(/^#/, '').split('?')[0];
  return !normalized || normalized === 'index.html' ? 'home' : normalized;
}

export function getRoute(routeId: string): RouteConfig | null {
  return PAGE_ROUTES.get(normalizeRouteId(routeId)) ?? null;
}

export function hasRoute(routeId: string): boolean {
  return PAGE_ROUTES.has(normalizeRouteId(routeId));
}

export function getRoutes(): RouteConfig[] {
  return [...PAGE_ROUTES.values()];
}
