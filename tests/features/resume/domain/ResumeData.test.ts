import {
  DEFAULT_COLORS,
  cleanText,
  createDefaultResumeData,
  isResumeLanguage,
  normalizeResumeData,
} from '../../../../src/features/resume/domain/ResumeData';

describe('resume domain data', () => {
  test('createDefaultResumeData returns an isolated copy each time', () => {
    const first = createDefaultResumeData();
    const second = createDefaultResumeData();

    first.skills.push('Mutated');
    first.personal.name = 'Someone else';

    expect(second.skills).not.toContain('Mutated');
    expect(second.personal.name).toBe('Mihai-Cristian Condrea');
  });

  test('normalizeResumeData falls back to defaults for non-object input', () => {
    expect(normalizeResumeData(null).personal.name).toBe('Mihai-Cristian Condrea');
    expect(normalizeResumeData('nope').skills.length).toBeGreaterThan(0);
    expect(normalizeResumeData(42).colors).toEqual({ ...DEFAULT_COLORS });
  });

  test('normalizeResumeData keeps supplied values and repairs the rest', () => {
    const data = normalizeResumeData({
      language: 'ro',
      personal: { name: '  Ada  ' },
      skills: ['  Kotlin  ', 'Compose'],
      work: 'not-an-array',
      colors: { 'accent-color': '#ff0000' },
    });

    expect(data.language).toBe('ro');
    expect(data.personal.name).toBe('  Ada  ');
    expect(data.personal.email).toBe('contact.mihaicristiancondrea@gmail.com');
    expect(data.skills).toEqual(['Kotlin', 'Compose']);
    expect(Array.isArray(data.work)).toBe(true);
    expect(data.work.length).toBeGreaterThan(0);
    expect(data.colors['accent-color']).toBe('#ff0000');
    expect(data.colors['text-color']).toBe(DEFAULT_COLORS['text-color']);
  });

  test('normalizeResumeData rejects an unknown language', () => {
    expect(normalizeResumeData({ language: 'fr' }).language).toBe('en');
  });

  test('isResumeLanguage guards the supported set', () => {
    expect(isResumeLanguage('en')).toBe(true);
    expect(isResumeLanguage('ro')).toBe(true);
    expect(isResumeLanguage('fr')).toBe(false);
    expect(isResumeLanguage(null)).toBe(false);
  });

  test('cleanText collapses whitespace and handles empty input', () => {
    expect(cleanText('  a   b \n c ')).toBe('a b c');
    expect(cleanText(null)).toBe('');
    expect(cleanText(undefined)).toBe('');
  });
});
