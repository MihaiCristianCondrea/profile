import type {
    OpenGraphMetadata,
    RouteConfig,
    RouteMetadata,
    TwitterMetadata,
} from '../../core/types/index.ts';

    const DEFAULT_ROUTE_TITLE = "Mihai's Profile";
    const DEFAULT_METADATA_DESCRIPTION = 'Explore Mihai-Cristian Condrea\'s Android developer portfolio featuring Jetpack Compose apps, Material Design systems, and open-source tools.';
    const DEFAULT_METADATA_KEYWORDS = [
        'Mihai Cristian Condrea',
        'Android developer portfolio',
        'Jetpack Compose',
        'Kotlin apps',
        'Material Design UI'
    ];
    const DEFAULT_SOCIAL_IMAGE = 'https://mihaicristiancondrea.github.io/profile/images/profile/cv_profile_pic.png';
    const DEFAULT_SOCIAL_IMAGE_ALT = 'Portrait of Android developer Mihai-Cristian Condrea';
    const DEFAULT_OPEN_GRAPH_TYPE = 'website';
    const DEFAULT_TWITTER_CARD = 'summary_large_image';
    const DEFAULT_TWITTER_HANDLE = '@MihaiCrstian';
    export const PAGE_ROUTES: Record<string, RouteConfig> = Object.create(null);

    export function normalizeRouteId(routeId: string): string {
        if (typeof routeId !== 'string') {
            return '';
        }
        const trimmed = routeId.trim();
        if (!trimmed) {
            return '';
        }
        return trimmed.startsWith('#') ? trimmed.substring(1) : trimmed;
    }

    function asRecord(value: unknown): Record<string, unknown> {
        return value && typeof value === 'object'
            ? value as Record<string, unknown>
            : {};
    }

    function readString(value: unknown, fallback: string): string {
        return typeof value === 'string' && value.trim() ? value.trim() : fallback;
    }

    function sanitizeKeywords(value: unknown): string[] {
        if (Array.isArray(value)) {
            return value
                .map((keyword) => (typeof keyword === 'string' ? keyword.trim() : ''))
                .filter((keyword): keyword is string => Boolean(keyword));
        }

        if (typeof value === 'string') {
            return value
                .split(',')
                .map((keyword) => keyword.trim())
                .filter(Boolean);
        }

        return [];
    }

    function sanitizeCanonicalSlug(value: unknown, routeId: string): string {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed || trimmed === '/' || trimmed === '#') {
                return routeId === 'home' ? '' : routeId;
            }

            if (/^https?:\/\//i.test(trimmed)) {
                return trimmed;
            }

            const normalized = trimmed.replace(/^[/#]+/, '').replace(/[/#]+$/, '');
            return normalized || (routeId === 'home' ? '' : routeId);
        }

        return routeId === 'home' ? '' : routeId;
    }

    function sanitizeOpenGraph(
        openGraphConfig: unknown,
        route: Pick<RouteConfig, 'id' | 'title'>,
        description: string,
    ): OpenGraphMetadata {
        const config = asRecord(openGraphConfig);

        const title = readString(config.title, route.title || DEFAULT_ROUTE_TITLE);
        const ogDescription = readString(config.description, description);
        const type = readString(config.type, DEFAULT_OPEN_GRAPH_TYPE);
        const image = readString(config.image, DEFAULT_SOCIAL_IMAGE);
        const imageAlt = readString(config.imageAlt, DEFAULT_SOCIAL_IMAGE_ALT);
        const siteName = readString(config.siteName, DEFAULT_ROUTE_TITLE);

        return {
            title,
            description: ogDescription,
            type,
            image,
            imageAlt,
            siteName
        };
    }

    function sanitizeTwitter(
        twitterConfig: unknown,
        openGraph: OpenGraphMetadata,
        description: string,
    ): TwitterMetadata {
        const config = asRecord(twitterConfig);

        const card = readString(config.card, DEFAULT_TWITTER_CARD);
        const title = readString(config.title, openGraph.title);
        const twitterDescription = readString(config.description, description);
        const image = readString(config.image, openGraph.image);
        const site = readString(config.site, DEFAULT_TWITTER_HANDLE);
        const creator = readString(config.creator, DEFAULT_TWITTER_HANDLE);

        return {
            card,
            title,
            description: twitterDescription,
            image,
            site,
            creator
        };
    }

    function sanitizeMetadata(
        metadataConfig: unknown,
        route: Pick<RouteConfig, 'id' | 'title'>,
    ): RouteMetadata {
        const config = asRecord(metadataConfig);

        const description = readString(config.description, DEFAULT_METADATA_DESCRIPTION);

        const keywords = sanitizeKeywords(config.keywords);
        const canonicalSlug = sanitizeCanonicalSlug(config.canonicalSlug, route.id);
        const openGraph = sanitizeOpenGraph(config.openGraph, route, description);
        const twitter = sanitizeTwitter(config.twitter, openGraph, description);

        return {
            description,
            keywords: keywords.length ? keywords : [...DEFAULT_METADATA_KEYWORDS],
            canonicalSlug,
            openGraph,
            twitter
        };
    }

    function cloneMetadata(metadata: RouteMetadata): RouteMetadata {
        return {
            description: metadata.description,
            keywords: [...metadata.keywords],
            canonicalSlug: metadata.canonicalSlug,
            openGraph: { ...metadata.openGraph },
            twitter: { ...metadata.twitter },
        };
    }

    function cloneRoute(route: RouteConfig): RouteConfig {
        return {
            ...route,
            metadata: cloneMetadata(route.metadata)
        };
    }

    function sanitizeRouteConfig(config: unknown): RouteConfig {
        if (!config || typeof config !== 'object') {
            throw new TypeError('RouterRoutes: Route configuration must be an object.');
        }

        const source = config as Record<string, unknown>;
        const normalizedId = normalizeRouteId(typeof source.id === 'string' ? source.id : '');
        if (!normalizedId) {
            throw new Error('RouterRoutes: Route configuration requires a non-empty "id".');
        }

        const routeIdentity = {
            id: normalizedId,
            title: typeof source.title === 'string' && source.title.trim()
                ? source.title.trim()
                : DEFAULT_ROUTE_TITLE,
        };

        const route: RouteConfig = {
            ...routeIdentity,
            path: typeof source.path === 'string' && source.path.trim() ? source.path.trim() : null,
            onLoad: typeof source.onLoad === 'function' ? source.onLoad as () => void : null,
            metadata: sanitizeMetadata(source.metadata, routeIdentity),
        };
        return route;
    }

    export function registerRoute(config: unknown): RouteConfig {
        const sanitized = sanitizeRouteConfig(config);
        const isUpdate = Object.prototype.hasOwnProperty.call(PAGE_ROUTES, sanitized.id);
        PAGE_ROUTES[sanitized.id] = sanitized;
        if (isUpdate) {
            console.warn(`RouterRoutes: Route "${sanitized.id}" was overwritten.`);
        }
        return cloneRoute(sanitized);
    }

    export function getRoute(routeId: string): RouteConfig | null {
        const normalizedId = normalizeRouteId(routeId);
        if (!normalizedId) {
            return null;
        }
        const storedRoute = PAGE_ROUTES[normalizedId];
        if (!storedRoute) {
            return null;
        }
        return cloneRoute(storedRoute);
    }

    export function hasRoute(routeId: string): boolean {
        return !!getRoute(routeId);
    }

    export function getRoutes(): RouteConfig[] {
        return Object.values(PAGE_ROUTES).map((route) => cloneRoute(route));
    }

    const defaultRoutes = [
        {
            id: 'home',
            title: DEFAULT_ROUTE_TITLE,
            metadata: {
                description: 'Explore Mihai-Cristian Condrea\'s Android developer portfolio featuring Jetpack Compose apps, Material Design systems, and open-source tools.',
                keywords: [
                    'Mihai Cristian Condrea',
                    'Android developer portfolio',
                    'Jetpack Compose apps',
                    'Kotlin UI design',
                    'Material You projects'
                ],
                canonicalSlug: '/',
                openGraph: {
                    title: 'Mihai-Cristian Condrea | Android Developer Portfolio',
                    description: 'Explore Mihai-Cristian Condrea\'s Android developer portfolio featuring Jetpack Compose apps, Material Design systems, and open-source tools.',
                    type: 'website'
                },
                twitter: {
                    title: 'Mihai-Cristian Condrea | Android Developer Portfolio',
                    description: 'Explore Mihai-Cristian Condrea\'s Android developer portfolio featuring Jetpack Compose apps, Material Design systems, and open-source tools.'
                }
            }
        },
        {
            id: 'privacy-policy',
            path: 'content/features/legal/presentation/privacy-policy.html',
            title: 'Privacy Policy',
            metadata: {
                description: 'Review the website privacy policy for Mihai-Cristian Condrea\'s personal site covering analytics, local storage preferences, and data protection practices.',
                keywords: [
                    'Mihai Cristian Condrea privacy policy',
                    'website data protection',
                    'analytics disclosure',
                    'local storage preferences'
                ],
                canonicalSlug: 'privacy-policy',
                openGraph: {
                    title: 'Website Privacy Policy | Mihai-Cristian Condrea',
                    description: 'Review the website privacy policy for Mihai-Cristian Condrea\'s personal site covering analytics, local storage preferences, and data protection practices.',
                    type: 'article'
                },
                twitter: {
                    title: 'Website Privacy Policy | Mihai-Cristian Condrea',
                    description: 'Review the website privacy policy for Mihai-Cristian Condrea\'s personal site covering analytics, local storage preferences, and data protection practices.'
                }
            }
        },
        {
            id: 'songs',
            path: 'content/features/songs/presentation/songs.html',
            title: 'My Music',
            metadata: {
                description: 'Listen to Mihai-Cristian Condrea\'s original tracks and playlists, including ambient production, electronic experiments, and featured collaborations.',
                keywords: [
                    'Mihai Cristian Condrea music',
                    'D4rK Rekords tracks',
                    'ambient electronic producer',
                    'indie Android developer musician'
                ],
                canonicalSlug: 'songs',
                openGraph: {
                    title: 'My Music | Mihai-Cristian Condrea',
                    description: 'Listen to Mihai-Cristian Condrea\'s original tracks and playlists, including ambient production, electronic experiments, and featured collaborations.',
                    type: 'music.playlist'
                },
                twitter: {
                    title: 'My Music | Mihai-Cristian Condrea',
                    description: 'Listen to Mihai-Cristian Condrea\'s original tracks and playlists, including ambient production, electronic experiments, and featured collaborations.'
                }
            }
        },
        {
            id: 'projects',
            path: 'content/features/projects/presentation/projects.html',
            title: 'Projects',
            metadata: {
                description: 'Discover Mihai-Cristian Condrea\'s Android and web projects featuring Jetpack Compose demos, Material You UI patterns, and open-source utilities.',
                keywords: [
                    'Jetpack Compose portfolio',
                    'Android app showcase',
                    'Material You case studies',
                    'Mihai Cristian Condrea projects'
                ],
                canonicalSlug: 'projects',
                openGraph: {
                    title: 'Projects | Mihai-Cristian Condrea',
                    description: 'Discover Mihai-Cristian Condrea\'s Android and web projects featuring Jetpack Compose demos, Material You UI patterns, and open-source utilities.',
                    type: 'website'
                },
                twitter: {
                    title: 'Projects | Mihai-Cristian Condrea',
                    description: 'Discover Mihai-Cristian Condrea\'s Android and web projects featuring Jetpack Compose demos, Material You UI patterns, and open-source utilities.'
                }
            }
        },
        {
            id: 'contact',
            path: 'content/features/profile/presentation/contact.html',
            title: 'Contact',
            metadata: {
                description: 'Contact Mihai-Cristian Condrea to discuss Android development collaborations, UI design engagements, or support for open-source apps.',
                keywords: [
                    'contact Mihai Cristian Condrea',
                    'hire Android developer Romania',
                    'Jetpack Compose collaboration',
                    'open source app support'
                ],
                canonicalSlug: 'contact',
                openGraph: {
                    title: 'Contact Mihai | Android Developer',
                    description: 'Contact Mihai-Cristian Condrea to discuss Android development collaborations, UI design engagements, or support for open-source apps.',
                    type: 'website'
                },
                twitter: {
                    title: 'Contact Mihai | Android Developer',
                    description: 'Contact Mihai-Cristian Condrea to discuss Android development collaborations, UI design engagements, or support for open-source apps.'
                }
            }
        },
        {
            id: 'about-me',
            path: 'content/features/profile/presentation/about-me.html',
            title: 'About Me',
            metadata: {
                description: 'Learn about Mihai-Cristian Condrea, a Bucharest-based Android developer crafting Jetpack Compose apps, Material Design systems, and community tutorials.',
                keywords: [
                    'Mihai Cristian Condrea biography',
                    'Bucharest Android developer',
                    'Jetpack Compose expert',
                    'Material Design UI engineer'
                ],
                canonicalSlug: 'about-me',
                openGraph: {
                    title: 'About Mihai-Cristian Condrea',
                    description: 'Learn about Mihai-Cristian Condrea, a Bucharest-based Android developer crafting Jetpack Compose apps, Material Design systems, and community tutorials.',
                    type: 'profile'
                },
                twitter: {
                    title: 'About Mihai-Cristian Condrea',
                    description: 'Learn about Mihai-Cristian Condrea, a Bucharest-based Android developer crafting Jetpack Compose apps, Material Design systems, and community tutorials.'
                }
            }
        },
        {
            id: 'faqs',
            path: 'content/features/faq/presentation/faqs.html',
            title: 'FAQ & Support',
            metadata: {
                description: 'Find answers to frequently asked questions about Mihai-Cristian Condrea\'s Android apps, including Google Play Services requirements, analytics usage, privacy, and official download sources.',
                keywords: [
                    'Mihai Cristian Condrea FAQ',
                    'Android app support questions',
                    'Google Play Services requirement',
                    'AdMob and Firebase analytics info'
                ],
                canonicalSlug: 'faqs',
                openGraph: {
                    title: 'FAQ & Support | Mihai-Cristian Condrea',
                    description: 'Find answers to frequently asked questions about Mihai-Cristian Condrea\'s Android apps, including Google Play Services requirements, analytics usage, privacy, and official download sources.',
                    type: 'article'
                },
                twitter: {
                    title: 'FAQ & Support | Mihai-Cristian Condrea',
                    description: 'Find answers to frequently asked questions about Mihai-Cristian Condrea\'s Android apps, including Google Play Services requirements, analytics usage, privacy, and official download sources.'
                }
            }
        },
        {
            id: 'smart-cleaner-for-android',
            path: 'content/features/apps/smart-cleaner/presentation/smart-cleaner-for-android.html',
            title: 'Smart Cleaner for Android',
            metadata: {
                description: 'Discover Smart Cleaner for Android, an open-source one-tap cleaner that helps remove junk files, optimize storage, and keep your phone responsive.',
                keywords: [
                    'Smart Cleaner for Android',
                    'Android junk cleaner app',
                    'open source storage cleaner',
                    'Google Play phone cleaner'
                ],
                canonicalSlug: 'smart-cleaner-for-android',
                openGraph: {
                    title: 'Smart Cleaner for Android | App Presentation',
                    description: 'Discover Smart Cleaner for Android, an open-source one-tap cleaner that helps remove junk files, optimize storage, and keep your phone responsive.',
                    type: 'website',
                    image: 'https://raw.githubusercontent.com/MihaiCristianCondrea/Smart-Cleaner-for-Android/refs/heads/master/.idea/icon.svg',
                    imageAlt: 'Smart Cleaner for Android app icon'
                },
                twitter: {
                    title: 'Smart Cleaner for Android | App Presentation',
                    description: 'Discover Smart Cleaner for Android, an open-source one-tap cleaner that helps remove junk files, optimize storage, and keep your phone responsive.',
                    image: 'https://raw.githubusercontent.com/MihaiCristianCondrea/Smart-Cleaner-for-Android/refs/heads/master/.idea/icon.svg'
                }
            }
        },
        {
            id: 'ads-help-center',
            path: 'content/features/apps/legal/presentation/ads-help-center.html',
            title: 'Ads Help Center',
            metadata: {
                description: 'Understand how Mihai-Cristian Condrea integrates advertising across Android apps, including consent flows, personalization controls, and GDPR compliance.',
                keywords: [
                    'Mihai Cristian Condrea ads help',
                    'Android app advertising transparency',
                    'Consent mode v2 guidance',
                    'GDPR compliant mobile ads'
                ],
                canonicalSlug: 'ads-help-center',
                openGraph: {
                    title: 'Advertising Transparency | Mihai-Cristian Condrea',
                    description: 'Understand how Mihai-Cristian Condrea integrates advertising across Android apps, including consent flows, personalization controls, and GDPR compliance.',
                    type: 'article'
                },
                twitter: {
                    title: 'Advertising Transparency | Mihai-Cristian Condrea',
                    description: 'Understand how Mihai-Cristian Condrea integrates advertising across Android apps, including consent flows, personalization controls, and GDPR compliance.'
                }
            }
        },
        {
            id: 'legal-notices',
            path: 'content/features/apps/legal/presentation/legal-notices.html',
            title: 'Legal Notices',
            metadata: {
                description: 'Review software licenses and third-party acknowledgments for Mihai-Cristian Condrea\'s Android and web applications.',
                keywords: [
                    'Mihai Cristian Condrea legal notices',
                    'third party licenses Android apps',
                    'open source acknowledgments',
                    'software attribution list'
                ],
                canonicalSlug: 'legal-notices',
                openGraph: {
                    title: 'Legal Notices | Mihai-Cristian Condrea',
                    description: 'Review software licenses and third-party acknowledgments for Mihai-Cristian Condrea\'s Android and web applications.',
                    type: 'article'
                },
                twitter: {
                    title: 'Legal Notices | Mihai-Cristian Condrea',
                    description: 'Review software licenses and third-party acknowledgments for Mihai-Cristian Condrea\'s Android and web applications.'
                }
            }
        },
        {
            id: 'code-of-conduct',
            path: 'content/features/legal/presentation/code-of-conduct.html',
            title: 'Code of Conduct',
            metadata: {
                description: 'Read the community code of conduct guiding respectful collaboration across Mihai-Cristian Condrea\'s projects and communication channels.',
                keywords: [
                    'Mihai Cristian Condrea code of conduct',
                    'open source community guidelines',
                    'inclusive collaboration standards',
                    'developer communication policy'
                ],
                canonicalSlug: 'code-of-conduct',
                openGraph: {
                    title: 'Code of Conduct | Mihai-Cristian Condrea',
                    description: 'Read the community code of conduct guiding respectful collaboration across Mihai-Cristian Condrea\'s projects and communication channels.',
                    type: 'article'
                },
                twitter: {
                    title: 'Code of Conduct | Mihai-Cristian Condrea',
                    description: 'Read the community code of conduct guiding respectful collaboration across Mihai-Cristian Condrea\'s projects and communication channels.'
                }
            }
        },
        {
            id: 'privacy-policy-end-user-software',
            path: 'content/features/apps/legal/presentation/privacy-policy-apps.html',
            title: 'Privacy Policy – End-User Software',
            metadata: {
                description: 'Review the privacy policy for Mihai-Cristian Condrea\'s Android applications covering analytics, consent mode, advertising IDs, and crash reporting.',
                keywords: [
                    'Android app privacy policy',
                    'Mihai Cristian Condrea software privacy',
                    'Firebase analytics consent',
                    'AdMob data usage disclosure'
                ],
                canonicalSlug: 'privacy-policy-end-user-software',
                openGraph: {
                    title: 'Android App Privacy Policy | Mihai-Cristian Condrea',
                    description: 'Review the privacy policy for Mihai-Cristian Condrea\'s Android applications covering analytics, consent mode, advertising IDs, and crash reporting.',
                    type: 'article'
                },
                twitter: {
                    title: 'Android App Privacy Policy | Mihai-Cristian Condrea',
                    description: 'Review the privacy policy for Mihai-Cristian Condrea\'s Android applications covering analytics, consent mode, advertising IDs, and crash reporting.'
                }
            }
        },
        {
            id: 'terms-of-service-end-user-software',
            path: 'content/features/apps/legal/presentation/terms-of-service-apps.html',
            title: 'Terms of Service – End-User Software',
            metadata: {
                description: 'Understand the terms of service governing Mihai-Cristian Condrea\'s Android apps, including licensing, in-app purchases, and user responsibilities.',
                keywords: [
                    'Android app terms of service',
                    'Mihai Cristian Condrea app license',
                    'in-app purchase policy',
                    'user responsibilities mobile apps'
                ],
                canonicalSlug: 'terms-of-service-end-user-software',
                openGraph: {
                    title: 'Android App Terms of Service | Mihai-Cristian Condrea',
                    description: 'Understand the terms of service governing Mihai-Cristian Condrea\'s Android apps, including licensing, in-app purchases, and user responsibilities.',
                    type: 'article'
                },
                twitter: {
                    title: 'Android App Terms of Service | Mihai-Cristian Condrea',
                    description: 'Understand the terms of service governing Mihai-Cristian Condrea\'s Android apps, including licensing, in-app purchases, and user responsibilities.'
                }
            }
        },
        {
            id: 'resume',
            path: 'content/features/resume/presentation/resume.html',
            title: "Mihai's Resume",
            metadata: {
                description: 'Use Mihai-Cristian Condrea\'s interactive resume builder to assemble, preview, and download a polished CV template for Android developers.',
                keywords: [
                    'Android developer resume builder',
                    'Mihai Cristian Condrea CV template',
                    'Jetpack Compose resume generator',
                    'download professional resume PDF'
                ],
                canonicalSlug: 'resume',
                openGraph: {
                    title: 'Resume Builder | Mihai-Cristian Condrea',
                    description: 'Use Mihai-Cristian Condrea\'s interactive resume builder to assemble, preview, and download a polished CV template for Android developers.',
                    type: 'website'
                },
                twitter: {
                    title: 'Resume Builder | Mihai-Cristian Condrea',
                    description: 'Use Mihai-Cristian Condrea\'s interactive resume builder to assemble, preview, and download a polished CV template for Android developers.'
                }
            }
        }
    ];

    defaultRoutes.forEach(registerRoute);

    export const RouterRoutes = {
        registerRoute,
        getRoute,
        hasRoute,
        getRoutes,
        normalizeRouteId,
        PAGE_ROUTES
    };
