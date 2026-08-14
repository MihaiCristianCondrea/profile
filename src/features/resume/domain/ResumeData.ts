export type ResumeLanguage = 'en' | 'ro';

export interface WorkEntry {
  title: string;
  company: string;
  start: string;
  end: string;
  desc: string;
}

export interface EducationEntry {
  degree: string;
  school: string;
  start: string;
  end: string;
}

export interface InterestEntry {
  text: string;
  isProject: boolean;
}

export interface ResumePersonalDetails {
  name: string;
  jobTitle: string;
  photo: string;
  phone: string;
  email: string;
  address: string;
  summary: string;
}

export interface ResumeData {
  language: ResumeLanguage;
  personal: ResumePersonalDetails;
  colors: Record<string, string>;
  skills: string[];
  languages: string[];
  interests: InterestEntry[];
  work: WorkEntry[];
  education: EducationEntry[];
}

export const DEFAULT_PHOTO_URL = 'images/profile/cv_profile_pic.png';

/** Colour input id to the CSS custom property it drives in the preview. */
export const COLOR_FIELDS: Readonly<Record<string, string>> = {
  'accent-color': '--resume-accent',
  'secondary-color': '--resume-secondary',
  'left-bg-color': '--resume-left-bg',
  'right-bg-color': '--resume-right-bg',
  'text-color': '--resume-text',
  'muted-color': '--resume-muted',
};

// The accent matches the Google blue brand seed documented in docs/material-web.md.
export const DEFAULT_COLORS: Readonly<Record<string, string>> = {
  'accent-color': '#4285f4',
  'secondary-color': '#565e71',
  'left-bg-color': '#e9e7ec',
  'right-bg-color': '#faf8ff',
  'text-color': '#111111',
  'muted-color': '#333333',
};

export const DEFAULT_RESUME_DATA: ResumeData = {
  language: 'en',
  personal: {
    name: 'Mihai-Cristian Condrea',
    jobTitle: 'Android Developer',
    photo: DEFAULT_PHOTO_URL,
    phone: 'soon',
    email: 'contact.mihaicristiancondrea@gmail.com',
    address: 'Bucharest, Romania',
    summary: 'Android Developer specializing in the full app lifecycle, from UI/UX design to Google Play publishing, utilizing Jetpack Compose, Kotlin, and Firebase. As a music producer, I bring a creative and user-centric approach to development.',
  },
  colors: { ...DEFAULT_COLORS },
  skills: [
    'Languages: Kotlin, Java, HTML, Markdown, JSON',
    'Android: Jetpack Compose, ViewModels, LiveData, Room, Navigation',
    'Tools: Android Studio, GitHub, Git, Firebase Console, Play Console',
    'Design: Material 3, Figma, SVG, Adobe Illustrator, Photoshop',
  ],
  languages: ['Romanian (Native)', 'English (Advanced)'],
  interests: [
    { text: 'Technology, AI, UX optimization', isProject: false },
    { text: 'Electronic Music Production', isProject: false },
    { text: 'Creating educational and promotional digital content', isProject: false },
  ],
  work: [
    {
      title: 'Android Developer',
      company: 'Digi Romania S.A., Bucharest',
      start: '2024',
      end: 'Current',
      desc: 'Engineered Android applications for live TV and video streaming platforms.\nBuilt bespoke Android applications for promotional campaigns and internal operational use.\nManaged Google Play Console releases for Digi Romania, Digi Spain, and Digi Portugal.',
    },
    {
      title: 'Android Developer',
      company: 'Personal Projects, Bucharest',
      start: '2020',
      end: 'Current',
      desc: 'Built and published more than ten Android apps across the full product lifecycle.\nApplied Material Design principles to create clear, consistent experiences.',
    },
  ],
  education: [
    { degree: 'University', school: 'Faculty of Industrial and Robotics Engineering', start: '2020', end: 'Current' },
    { degree: 'High School', school: 'Hristo Botev Bulgarian Theoretical High School', start: '2016', end: '2020' },
  ],
};

/** Collapses whitespace so preview text never inherits stray formatting. */
export function cleanText(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function createDefaultResumeData(): ResumeData {
  return structuredClone(DEFAULT_RESUME_DATA);
}

export function isResumeLanguage(value: unknown): value is ResumeLanguage {
  return value === 'en' || value === 'ro';
}

/**
 * Builds usable resume data from an untrusted source: imported JSON files and
 * previously stored state both arrive here before reaching the form.
 */
export function normalizeResumeData(raw: unknown): ResumeData {
  const defaults = createDefaultResumeData();
  if (!raw || typeof raw !== 'object') return defaults;

  const source = raw as Partial<ResumeData>;
  return {
    ...defaults,
    ...source,
    language: isResumeLanguage(source.language) ? source.language : 'en',
    personal: { ...defaults.personal, ...(source.personal ?? {}) },
    colors: { ...DEFAULT_COLORS, ...(source.colors ?? {}) },
    skills: Array.isArray(source.skills) ? source.skills.map(cleanText) : defaults.skills,
    languages: Array.isArray(source.languages) ? source.languages.map(cleanText) : defaults.languages,
    interests: Array.isArray(source.interests) ? source.interests : defaults.interests,
    work: Array.isArray(source.work) ? source.work : defaults.work,
    education: Array.isArray(source.education) ? source.education : defaults.education,
  };
}
