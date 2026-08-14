import {
  isResumeLanguage,
  normalizeResumeData,
  type ResumeData,
  type ResumeLanguage,
} from '../domain/ResumeData.ts';

const STORAGE_KEY = 'resume-builder-state-v1';
const LANGUAGE_KEY = 'resume-builder-language-v1';

// Local storage is a stored preference, not a requirement. Private browsing and
// blocked storage must leave the builder fully usable, so every access below
// degrades to the in-memory default instead of surfacing an error.

export function loadStoredResume(): ResumeData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeResumeData(JSON.parse(raw)) : null;
  } catch (error) {
    console.warn('Resume: Unable to load saved data.', error);
    return null;
  }
}

export function saveResume(data: ResumeData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Resume: Unable to save changes.', error);
  }
}

export function loadStoredLanguage(): ResumeLanguage {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return isResumeLanguage(stored) ? stored : 'en';
  } catch {
    return 'en';
  }
}

export function saveLanguage(language: ResumeLanguage): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // The chosen language still applies for the rest of the session.
  }
}
