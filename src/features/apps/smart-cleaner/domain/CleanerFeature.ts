export type CleanerFeatureKey = 'memory' | 'duplicates' | 'apps' | 'wear';

export interface CleanerFeatureBullet {
  icon: string;
  label: string;
}

export interface CleanerFeature {
  title: string;
  description: string;
  image: string;
  alt: string;
  badge: string;
  isWear: boolean;
  bullets: readonly CleanerFeatureBullet[];
}

export const CLEANER_FEATURES: Readonly<Record<CleanerFeatureKey, CleanerFeature>> = {
  memory: {
    title: 'Clean what matters.',
    description: 'See what is taking space in seconds, then clear the files that actually move the needle.',
    image: 'https://play-lh.googleusercontent.com/s15b2PJk5VSkOykE_c-yOs3VqlA1db9XuV_BnQSubPSjp73EO5c262WP11p1fUAdjKyz=w2560-h1440-rw',
    alt: 'Cleaner memory manager screen',
    badge: 'Memory & Storage',
    isWear: false,
    bullets: [
      { icon: 'photo_size_select_large', label: 'Spot oversized files quickly.' },
      { icon: 'visibility', label: 'Preview before every action.' },
      { icon: 'verified_user', label: 'Keep cleanup deliberate and understandable.' },
    ],
  },
  duplicates: {
    title: 'Find duplicates instantly.',
    description: 'Repeated photos and files stop hiding. Keep the copy you want and remove the rest in one clear flow.',
    image: 'https://play-lh.googleusercontent.com/22xJupF9f3rszxorCDFYSDMFxPse31hA-wnfMWV-0iWuZqw9WIM8yJLd3bYZg2trqag=w2560-h1440-rw',
    alt: 'Cleaner duplicate files detection screen',
    badge: 'Duplicates',
    isWear: false,
    bullets: [
      { icon: 'content_copy', label: 'Group repeated files before cleanup.' },
      { icon: 'lightbulb', label: 'Keep recommendations visible and understandable.' },
      { icon: 'touch_app', label: 'Remove only what you choose.' },
    ],
  },
  apps: {
    title: 'App manager under control.',
    description: 'Inspect unused apps and residue directly instead of hunting through system settings.',
    image: 'https://play-lh.googleusercontent.com/RFPtMvrFEzPOSVxiCKosDVSqnqKdz_kbfkcJgw2Rf6IDcr9IfOfbqGmPE3ihVO3o98k0=w2560-h1440-rw',
    alt: 'Cleaner app manager screen',
    badge: 'App Manager',
    isWear: false,
    bullets: [
      { icon: 'apps', label: 'Sort apps by storage footprint.' },
      { icon: 'folder_open', label: 'Inspect cached components cleanly.' },
      { icon: 'tune', label: 'Keep user authority over uninstalls.' },
    ],
  },
  wear: {
    title: 'Wear OS on your wrist.',
    description: 'Trigger memory optimization and monitor storage metrics directly from your smartwatch tile.',
    image: 'https://play-lh.googleusercontent.com/Pbr3Un1Y7v-VIUR72Z4r4paIhrL9hjaCGqx1EUqoYRZQTh6jUaF6zaIFpgLXW3ODZLQo-3qjPaiAxaMLwDP2=w2560-h1440-rw',
    alt: 'Cleaner Wear OS tile',
    badge: 'Wear OS Tile',
    isWear: true,
    bullets: [
      { icon: 'watch', label: 'One-tap wrist cleanup triggers.' },
      { icon: 'sync', label: 'Useful phone metrics on your wrist.' },
      { icon: 'bolt', label: 'A lightweight companion experience.' },
    ],
  },
};

export function isCleanerFeatureKey(value: string | undefined): value is CleanerFeatureKey {
  return value !== undefined && value in CLEANER_FEATURES;
}
