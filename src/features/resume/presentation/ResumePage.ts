import {
  loadStoredLanguage,
  loadStoredResume,
  saveLanguage,
  saveResume,
} from '../data/ResumeStorage.ts';
import {
  COLOR_FIELDS,
  DEFAULT_PHOTO_URL,
  cleanText,
  createDefaultResumeData,
  normalizeResumeData,
  type EducationEntry,
  type InterestEntry,
  type ResumeData,
  type ResumeLanguage,
  type WorkEntry,
} from '../domain/ResumeData.ts';
import { resumeText } from './ResumeCopy.ts';

type ListSection = 'skills' | 'languages';
type EntrySection = 'work' | 'education';
interface ValueControl extends HTMLElement { value: string }
interface CheckedControl extends HTMLElement { checked: boolean }

const AUTOSAVE_DELAY_MS = 250;

let language: ResumeLanguage = 'en';
let photoValue = DEFAULT_PHOTO_URL;
let autosaveEnabled = false;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let itemCounter = 0;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function text(key: string): string {
  return resumeText(language, key);
}

function inputValue(id: string): string {
  return byId<ValueControl>(id)?.value ?? '';
}

function controlValue(scope: ParentNode, selector: string): string {
  return scope.querySelector<ValueControl>(selector)?.value ?? '';
}

// --- Form building -------------------------------------------------------

function createRemoveButton(labelKey: string, onClick: () => void): HTMLElement {
  const button = document.createElement('md-icon-button');
  button.className = 'resume-remove-button';
  button.setAttribute('type', 'button');
  button.setAttribute('aria-label', text(labelKey));
  button.dataset.resumeI18nAria = labelKey;
  const icon = document.createElement('md-icon');
  icon.textContent = 'close';
  button.append(icon);
  button.addEventListener('click', onClick);
  return button;
}

function createField(
  labelKey: string,
  className: string,
  value = '',
  textarea = false,
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'input-group';
  const control = document.createElement('md-outlined-text-field') as ValueControl;
  control.className = className;
  control.value = value;
  control.id = `resume-field-${++itemCounter}`;
  control.setAttribute('type', textarea ? 'textarea' : 'text');
  control.setAttribute('label', text(labelKey));
  control.dataset.resumeI18nLabel = labelKey;
  if (textarea) control.setAttribute('rows', '4');
  control.addEventListener('input', updateAndSave);
  wrapper.append(control);
  return wrapper;
}

function addListItem(section: ListSection, value = ''): void {
  const container = byId(`${section}-form`);
  if (!container) return;

  const item = document.createElement('div');
  item.className = 'list-item';
  const field = createField(
    section === 'skills' ? 'skillItem' : 'languageItem',
    'resume-list-value',
    value,
  );
  field.classList.add('resume-inline-group');
  item.append(field, createRemoveButton('removeItem', () => {
    item.remove();
    updateAndSave();
  }));
  container.insertBefore(item, container.querySelector('[data-add-list]'));
}

function addInterestItem(entry: Partial<InterestEntry> = {}): void {
  const container = byId('interests-form');
  if (!container) return;

  const item = document.createElement('div');
  item.className = 'list-item';
  const field = createField('interestItem', 'resume-interest-value', entry.text ?? '');
  field.classList.add('resume-inline-group');

  const checkbox = document.createElement('md-checkbox') as CheckedControl;
  checkbox.className = 'resume-interest-project';
  checkbox.checked = Boolean(entry.isProject);
  checkbox.id = `resume-project-${++itemCounter}`;
  checkbox.addEventListener('change', updateAndSave);

  const checkboxLabel = document.createElement('label');
  checkboxLabel.htmlFor = checkbox.id;
  checkboxLabel.className = 'resume-checkbox-label';
  checkboxLabel.dataset.resumeI18n = 'isProject';
  checkboxLabel.textContent = text('isProject');

  item.append(field, checkbox, checkboxLabel, createRemoveButton('removeInterest', () => {
    item.remove();
    updateAndSave();
  }));
  container.insertBefore(item, container.querySelector('[data-add-interest]'));
}

function addEntryItem(
  section: EntrySection,
  entry: Partial<WorkEntry & EducationEntry> = {},
): void {
  const container = byId(`${section}-form`);
  if (!container) return;

  const item = document.createElement('div');
  item.className = 'complex-item-form';
  const fields = document.createElement('md-filled-card');
  fields.className = 'complex-item-fields';

  if (section === 'work') {
    fields.append(
      createField('workTitle', 'work-title', entry.title),
      createField('companyLocation', 'work-company', entry.company),
      createField('startYear', 'work-start', entry.start),
      createField('endYear', 'work-end', entry.end),
      createField('description', 'work-desc', entry.desc, true),
    );
  } else {
    fields.append(
      createField('degree', 'edu-degree', entry.degree),
      createField('schoolLocation', 'edu-school', entry.school),
      createField('startYear', 'edu-start', entry.start),
      createField('endYear', 'edu-end', entry.end),
    );
  }

  fields.append(createRemoveButton('removeEntry', () => {
    item.remove();
    updateAndSave();
  }));
  item.append(fields);
  container.insertBefore(item, container.querySelector('[data-add-complex]'));
}

// --- Preview rendering ---------------------------------------------------

function renderContact(targetId: string, iconName: string, value: string): void {
  const target = byId(targetId);
  if (!target) return;

  target.replaceChildren();
  const label = cleanText(value);
  if (!label) return;

  const icon = document.createElement('span');
  icon.className = 'material-symbols-outlined resume-pdf-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = iconName;
  const value_ = document.createElement('span');
  value_.textContent = label;
  target.append(icon, value_);
}

function renderList(section: ListSection): void {
  const list = document.querySelector<HTMLUListElement>(`#resume-${section} ul`);
  if (!list) return;

  const values = Array.from(document.querySelectorAll<ValueControl>(`#${section}-form .resume-list-value`))
    .map((input) => cleanText(input.value))
    .filter(Boolean);
  list.replaceChildren(...values.map((value) => {
    const item = document.createElement('li');
    item.textContent = value;
    return item;
  }));
}

function renderInterests(): void {
  const list = document.querySelector<HTMLUListElement>('#resume-interests ul');
  if (!list) return;

  const items = Array.from(document.querySelectorAll<HTMLElement>('#interests-form .list-item'))
    .map((entry) => {
      const value = cleanText(controlValue(entry, '.resume-interest-value'));
      if (!value) return null;

      const item = document.createElement('li');
      if (entry.querySelector<CheckedControl>('.resume-interest-project')?.checked) {
        const label = document.createElement('strong');
        label.textContent = `${text('projectLabel')} `;
        item.append(label);
      }
      item.append(value);
      return item;
    })
    .filter((item): item is HTMLLIElement => item !== null);
  list.replaceChildren(...items);
}

function dateRange(start: string, end: string): HTMLElement {
  const element = document.createElement('span');
  element.className = 'date';
  element.textContent = [cleanText(start), cleanText(end) || text('current')].filter(Boolean).join(' – ');
  return element;
}

function renderEntries(section: EntrySection): void {
  const preview = byId(`resume-${section}`);
  const heading = preview?.querySelector('h2');
  if (!preview || !heading) return;

  preview.replaceChildren(heading);
  const prefix = section === 'work' ? 'work' : 'edu';
  const titleSelector = section === 'work' ? '.work-title' : '.edu-degree';
  const organizationSelector = section === 'work' ? '.work-company' : '.edu-school';

  document.querySelectorAll<HTMLElement>(`#${section}-form .complex-item-form`).forEach((form) => {
    const titleText = cleanText(controlValue(form, titleSelector));
    const organizationText = cleanText(controlValue(form, organizationSelector));
    if (!titleText && !organizationText) return;

    const title = document.createElement('h3');
    title.textContent = titleText;
    const organization = document.createElement('p');
    organization.textContent = organizationText;

    const header = document.createElement('div');
    header.className = 'resume-item-header';
    header.append(title, dateRange(
      controlValue(form, `.${prefix}-start`),
      controlValue(form, `.${prefix}-end`),
    ));

    const item = document.createElement('div');
    item.className = 'resume-item';
    item.append(header, organization);

    if (section === 'work') {
      const description = document.createElement('p');
      description.className = 'description';
      description.textContent = controlValue(form, '.work-desc').replace(/\r\n?/g, '\n').trim();
      if (description.textContent) item.append(description);
    }

    preview.append(item);
  });
}

function updatePhotoPreview(source: string): void {
  photoValue = source || DEFAULT_PHOTO_URL;
  const preview = byId('photo-preview');
  if (!preview) return;

  const image = document.createElement('img');
  image.src = photoValue;
  image.alt = 'Profile portrait';
  preview.replaceChildren(image);
}

function updatePreview(): void {
  const setText = (id: string, value: string): void => {
    const element = byId(id);
    if (element) element.textContent = cleanText(value);
  };

  setText('resume-name', inputValue('name'));
  setText('resume-job-title', inputValue('job-title'));
  setText('resume-summary', inputValue('summary'));
  renderContact('resume-phone', 'call', inputValue('phone'));
  renderContact('resume-email', 'mail', inputValue('email'));
  renderContact('resume-address', 'location_on', inputValue('address'));
  renderList('skills');
  renderList('languages');
  renderInterests();
  renderEntries('work');
  renderEntries('education');
}

// --- State ---------------------------------------------------------------

function scheduleSave(): void {
  if (!autosaveEnabled) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveResume(collectResumeData()), AUTOSAVE_DELAY_MS);
}

function updateAndSave(): void {
  updatePreview();
  scheduleSave();
}

function collectEntries(section: EntrySection): Array<WorkEntry | EducationEntry> {
  return Array.from(document.querySelectorAll<HTMLElement>(`#${section}-form .complex-item-form`))
    .map((form) => (section === 'work'
      ? {
        title: controlValue(form, '.work-title'),
        company: controlValue(form, '.work-company'),
        start: controlValue(form, '.work-start'),
        end: controlValue(form, '.work-end'),
        desc: controlValue(form, '.work-desc'),
      }
      : {
        degree: controlValue(form, '.edu-degree'),
        school: controlValue(form, '.edu-school'),
        start: controlValue(form, '.edu-start'),
        end: controlValue(form, '.edu-end'),
      }));
}

function collectResumeData(): ResumeData {
  const listValues = (section: ListSection): string[] => Array
    .from(document.querySelectorAll<ValueControl>(`#${section}-form .resume-list-value`))
    .map((input) => input.value)
    .filter((value) => cleanText(value));

  const interests = Array.from(document.querySelectorAll<HTMLElement>('#interests-form .list-item'))
    .map((item) => ({
      text: controlValue(item, '.resume-interest-value'),
      isProject: item.querySelector<CheckedControl>('.resume-interest-project')?.checked ?? false,
    }))
    .filter((entry) => cleanText(entry.text));

  return {
    language,
    personal: {
      name: inputValue('name'),
      jobTitle: inputValue('job-title'),
      photo: photoValue,
      phone: inputValue('phone'),
      email: inputValue('email'),
      address: inputValue('address'),
      summary: inputValue('summary'),
    },
    colors: Object.fromEntries(Object.keys(COLOR_FIELDS).map((id) => [id, inputValue(id)])),
    skills: listValues('skills'),
    languages: listValues('languages'),
    interests,
    work: collectEntries('work') as WorkEntry[],
    education: collectEntries('education') as EducationEntry[],
  };
}

function applyLanguage(nextLanguage: ResumeLanguage): void {
  language = nextLanguage;

  document.querySelectorAll<HTMLElement>('[data-resume-i18n]').forEach((element) => {
    const key = element.dataset.resumeI18n;
    if (key) element.textContent = text(key);
  });
  document.querySelectorAll<HTMLElement>('[data-resume-i18n-label]').forEach((element) => {
    const key = element.dataset.resumeI18nLabel;
    if (key) element.setAttribute('label', text(key));
  });
  document.querySelectorAll<HTMLElement>('[data-resume-i18n-aria]').forEach((element) => {
    const key = element.dataset.resumeI18nAria;
    if (key) element.setAttribute('aria-label', text(key));
  });
  document.querySelectorAll<HTMLElement>('[data-resume-lang]').forEach((button) => {
    const selected = button.dataset.resumeLang === language;
    button.setAttribute('aria-pressed', String(selected));
    button.toggleAttribute('data-active', selected);
  });

  byId('resume-preview')?.setAttribute('lang', language);
  saveLanguage(language);
  updatePreview();
}

function applyColor(id: string, value: string): void {
  const cssVariable = COLOR_FIELDS[id];
  if (cssVariable) byId('resume-preview')?.style.setProperty(cssVariable, value);
  const output = document.querySelector<HTMLElement>(`[data-color-value-for="${id}"]`);
  if (output) output.textContent = value;
}

function clearDynamicForms(): void {
  document.querySelectorAll([
    '#skills-form .list-item',
    '#languages-form .list-item',
    '#interests-form .list-item',
    '#work-form .complex-item-form',
    '#education-form .complex-item-form',
  ].join(', ')).forEach((item) => item.remove());
}

function applyData(data: ResumeData): void {
  autosaveEnabled = false;

  const personalFields: Record<string, string> = {
    name: data.personal.name,
    'job-title': data.personal.jobTitle,
    phone: data.personal.phone,
    email: data.personal.email,
    address: data.personal.address,
    summary: data.personal.summary,
  };
  Object.entries(personalFields).forEach(([id, value]) => {
    const input = byId<ValueControl>(id);
    if (input) input.value = value;
  });

  clearDynamicForms();
  data.skills.forEach((value) => addListItem('skills', value));
  data.languages.forEach((value) => addListItem('languages', value));
  data.interests.forEach((entry) => addInterestItem(entry));
  data.work.forEach((entry) => addEntryItem('work', entry));
  data.education.forEach((entry) => addEntryItem('education', entry));

  Object.entries(data.colors).forEach(([id, value]) => {
    const input = byId<HTMLInputElement>(id);
    if (input) input.value = value;
    applyColor(id, value);
  });

  updatePhotoPreview(data.personal.photo);
  applyLanguage(data.language);
  updatePreview();
}

// --- Import and export ---------------------------------------------------

function exportJson(): void {
  const blob = new Blob([JSON.stringify(collectResumeData(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'resume.json';
  link.click();
  URL.revokeObjectURL(url);
}

function importJson(event: Event): void {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      applyData(normalizeResumeData(JSON.parse(String(reader.result))));
      autosaveEnabled = true;
      scheduleSave();
    } catch (error) {
      console.warn('Resume: Invalid JSON file.', error);
    }
  });
  reader.readAsText(file);
  input.value = '';
}

/** Editing is opt-in through `#resume?edit=true` or a `?edit=true` query. */
function isEditMode(): boolean {
  const hashQuery = window.location.hash.split('?')[1] ?? '';
  const value = new URLSearchParams(window.location.search).get('edit')
    ?? new URLSearchParams(hashQuery).get('edit');
  return value?.toLowerCase() === 'true';
}

function bindControls(): void {
  document.querySelectorAll<HTMLElement>('[data-add-list]').forEach((button) => {
    button.addEventListener('click', () => {
      const section = button.dataset.addList as ListSection | undefined;
      if (!section) return;
      addListItem(section);
      updateAndSave();
    });
  });

  document.querySelectorAll<HTMLElement>('[data-add-complex]').forEach((button) => {
    button.addEventListener('click', () => {
      const section = button.dataset.addComplex as EntrySection | undefined;
      if (!section) return;
      addEntryItem(section);
      updateAndSave();
    });
  });

  document.querySelector<HTMLElement>('[data-add-interest]')?.addEventListener('click', () => {
    addInterestItem();
    updateAndSave();
  });

  ['name', 'job-title', 'phone', 'email', 'address', 'summary'].forEach((id) => {
    byId<ValueControl>(id)?.addEventListener('input', updateAndSave);
  });

  document.querySelectorAll<HTMLInputElement>('[data-resume-color]').forEach((input) => {
    input.addEventListener('input', () => {
      applyColor(input.id, input.value);
      updateAndSave();
    });
  });

  byId<HTMLInputElement>('photo')?.addEventListener('change', (event) => {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      updatePhotoPreview(String(reader.result));
      scheduleSave();
    });
    reader.readAsDataURL(file);
  });

  byId('removePhotoButton')?.addEventListener('click', () => {
    updatePhotoPreview(DEFAULT_PHOTO_URL);
    const input = byId<HTMLInputElement>('photo');
    if (input) input.value = '';
    scheduleSave();
  });

  byId('exportResumeJson')?.addEventListener('click', exportJson);
  byId('importResumeJson')?.addEventListener('click', () => byId<HTMLInputElement>('resume-json-file')?.click());
  byId<HTMLInputElement>('resume-json-file')?.addEventListener('change', importJson);
  byId('downloadResumeButton')?.addEventListener('click', async () => {
    await document.fonts?.ready;
    window.print();
  });

  document.querySelectorAll<HTMLElement>('[data-resume-lang]').forEach((button) => {
    button.addEventListener('click', () => {
      applyLanguage(button.dataset.resumeLang === 'ro' ? 'ro' : 'en');
    });
  });
}

export function initResumePage(): void {
  const page = byId('resumePage');
  if (!page || page.dataset.initialized === 'true') return;
  page.dataset.initialized = 'true';

  bindControls();
  const editMode = isEditMode();
  const form = page.querySelector<HTMLElement>('.form-container');
  if (form) form.hidden = !editMode;

  const data = editMode ? loadStoredResume() ?? createDefaultResumeData() : createDefaultResumeData();
  data.language = loadStoredLanguage();
  applyData(data);
  autosaveEnabled = editMode;
}
