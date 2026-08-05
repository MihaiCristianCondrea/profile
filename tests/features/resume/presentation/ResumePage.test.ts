import * as fs from 'fs';
import * as path from 'path';
import { initResumePage } from '../../../../src/features/resume/presentation/ResumePage';

const resumeMarkup = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../../src/features/resume/presentation/resume.html',
  ),
  'utf8',
);

describe('ResumePage', () => {
  beforeEach(() => {
    document.body.innerHTML = resumeMarkup;
    localStorage.clear();
    window.location.hash = '#resume';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders the public resume while keeping editing controls hidden', () => {
    initResumePage();

    expect((document.querySelector('.form-container') as HTMLElement).hidden).toBe(true);
    expect(document.getElementById('resume-name')?.textContent)
      .toBe('Mihai-Cristian Condrea');
    expect(document.querySelectorAll('#resume-skills li').length).toBeGreaterThan(0);
  });

  test('enables editing through the hash query and renders user text safely', () => {
    jest.useFakeTimers();
    window.location.hash = '#resume?edit=true';
    initResumePage();

    const form = document.querySelector('.form-container') as HTMLElement;
    expect(form.hidden).toBe(false);
    const before = document.querySelectorAll('#skills-form .list-item').length;
    (document.querySelector('[data-add-list="skills"]') as HTMLElement).click();
    const inputs = document.querySelectorAll<HTMLInputElement>(
      '#skills-form .resume-list-value',
    );
    expect(inputs).toHaveLength(before + 1);

    const value = '<img src=x onerror=alert(1)>';
    inputs[inputs.length - 1].value = value;
    inputs[inputs.length - 1].dispatchEvent(new Event('input', { bubbles: true }));

    const previewItems = document.querySelectorAll('#resume-skills li');
    expect(previewItems[previewItems.length - 1].textContent).toBe(value);
    expect(document.querySelector('#resume-skills img')).toBeNull();
    jest.runOnlyPendingTimers();
  });

  test('changes language through the Material icon-button controls', () => {
    window.location.hash = '#resume?edit=true';
    initResumePage();
    const romanianButton = document.querySelector(
      '[data-resume-lang="ro"]',
    ) as HTMLElement;

    romanianButton.click();

    expect(romanianButton.getAttribute('aria-pressed')).toBe('true');
    expect(document.getElementById('resume-preview')?.getAttribute('lang')).toBe('ro');
    expect(localStorage.getItem('resume-builder-language-v1')).toBe('ro');
  });
});
