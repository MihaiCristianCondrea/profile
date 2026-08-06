type ResumeLanguage = 'en' | 'ro';
type ResumeSection = 'skills' | 'languages';
type ComplexSection = 'work' | 'education';

interface WorkEntry { title: string; company: string; start: string; end: string; desc: string; }
interface EducationEntry { degree: string; school: string; start: string; end: string; }
interface InterestEntry { text: string; isProject: boolean; }
interface ValueControl extends HTMLElement { value: string; }
interface CheckedControl extends HTMLElement { checked: boolean; }
interface ResumeData {
  language: ResumeLanguage;
  personal: { name: string; jobTitle: string; photo: string; phone: string; email: string; address: string; summary: string };
  colors: Record<string, string>;
  skills: string[];
  languages: string[];
  interests: InterestEntry[];
  work: WorkEntry[];
  education: EducationEntry[];
}

const STORAGE_KEY = 'resume-builder-state-v1';
const LANGUAGE_KEY = 'resume-builder-language-v1';
const DEFAULT_PHOTO_URL = 'images/profile/cv_profile_pic.png';
const COLOR_FIELDS: Record<string, string> = {
  'accent-color': '--resume-accent',
  'secondary-color': '--resume-secondary',
  'left-bg-color': '--resume-left-bg',
  'right-bg-color': '--resume-right-bg',
  'text-color': '--resume-text',
  'muted-color': '--resume-muted',
};
const DEFAULT_COLORS: Record<string, string> = {
  'accent-color': '#4285f4',
  'secondary-color': '#565e71',
  'left-bg-color': '#e9e7ec',
  'right-bg-color': '#faf8ff',
  'text-color': '#111111',
  'muted-color': '#333333',
};

const COPY: Record<ResumeLanguage, Record<string, string>> = {
  en: {
    title: 'Resume Builder', personalInfo: 'Personal Info', design: 'Design', skills: 'Skills',
    workHistory: 'Work History', education: 'Education', languages: 'Languages', interests: 'Interests',
    exportImport: 'Export / Import', fullName: 'Full Name', jobTitle: 'Job Title', profilePhoto: 'Profile Photo',
    removePhoto: 'Remove Photo', phone: 'Phone', email: 'Email', address: 'Address', summary: 'Professional Summary',
    accentColor: 'Accent Color', secondaryColor: 'Secondary Color', leftPanel: 'Left Panel', rightPanel: 'Right Panel',
    textColor: 'Text Color', mutedText: 'Muted Text', addSkill: 'Add Skill', addWork: 'Add Work Experience',
    addEducation: 'Add Education', addLanguage: 'Add Language', addInterest: 'Add Interest',
    exportJson: 'Export Resume JSON', importJson: 'Import Resume JSON', download: 'Download Resume as PDF',
    exportNote: 'Exports through browser print / Save as PDF to preserve selectable, searchable resume text for ATS and job portals.',
    skillsPreview: 'Skills', languagesPreview: 'Languages', interestsPreview: 'Interests',
    workHistoryPreview: 'Work history', educationPreview: 'Education', skillItem: 'Skill', languageItem: 'Language',
    interestItem: 'Interest or project', isProject: 'Is project?', workTitle: 'Job title',
    companyLocation: 'Company & location', startYear: 'Start year', endYear: 'End year', description: 'Description',
    degree: 'Degree / certificate', schoolLocation: 'School / university', removeItem: 'Remove item',
    removeInterest: 'Remove interest', removeEntry: 'Remove entry', projectLabel: 'Project:', current: 'Current',
  },
  ro: {
    title: 'Constructor CV', personalInfo: 'Informații personale', design: 'Design', skills: 'Competențe',
    workHistory: 'Experiență profesională', education: 'Educație', languages: 'Limbi', interests: 'Interese',
    exportImport: 'Export / Import', fullName: 'Nume complet', jobTitle: 'Titlu profesional', profilePhoto: 'Fotografie de profil',
    removePhoto: 'Elimină fotografia', phone: 'Telefon', email: 'E-mail', address: 'Adresă', summary: 'Rezumat profesional',
    accentColor: 'Culoare accent', secondaryColor: 'Culoare secundară', leftPanel: 'Panou stânga', rightPanel: 'Panou dreapta',
    textColor: 'Culoare text', mutedText: 'Text estompat', addSkill: 'Adaugă competență', addWork: 'Adaugă experiență',
    addEducation: 'Adaugă educație', addLanguage: 'Adaugă limbă', addInterest: 'Adaugă interes',
    exportJson: 'Exportă CV JSON', importJson: 'Importă CV JSON', download: 'Descarcă CV-ul ca PDF',
    exportNote: 'Exportă prin imprimarea browserului / Salvare ca PDF pentru a păstra textul selectabil și căutabil pentru ATS și portaluri de joburi.',
    skillsPreview: 'Competențe', languagesPreview: 'Limbi', interestsPreview: 'Interese',
    workHistoryPreview: 'Experiență profesională', educationPreview: 'Educație', skillItem: 'Competență', languageItem: 'Limbă',
    interestItem: 'Interes sau proiect', isProject: 'Este proiect?', workTitle: 'Titlu job',
    companyLocation: 'Companie și locație', startYear: 'An început', endYear: 'An sfârșit', description: 'Descriere',
    degree: 'Diplomă / certificat', schoolLocation: 'Școală / universitate', removeItem: 'Elimină elementul',
    removeInterest: 'Elimină interesul', removeEntry: 'Elimină intrarea', projectLabel: 'Proiect:', current: 'Prezent',
  },
};

const DEFAULT_DATA: ResumeData = {
  language: 'en',
  personal: {
    name: 'Mihai-Cristian Condrea', jobTitle: 'Android Developer', photo: DEFAULT_PHOTO_URL, phone: 'soon',
    email: 'contact.mihaicristiancondrea@gmail.com', address: 'Bucharest, Romania',
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
    { title: 'Android Developer', company: 'Digi Romania S.A., Bucharest', start: '2024', end: 'Current', desc: 'Engineered Android applications for live TV and video streaming platforms.\nBuilt bespoke Android applications for promotional campaigns and internal operational use.\nManaged Google Play Console releases for Digi Romania, Digi Spain, and Digi Portugal.' },
    { title: 'Android Developer', company: 'Personal Projects, Bucharest', start: '2020', end: 'Current', desc: 'Built and published more than ten Android apps across the full product lifecycle.\nApplied Material Design principles to create clear, consistent experiences.' },
  ],
  education: [
    { degree: 'University', school: 'Faculty of Industrial and Robotics Engineering', start: '2020', end: 'Current' },
    { degree: 'High School', school: 'Hristo Botev Bulgarian Theoretical High School', start: '2016', end: '2020' },
  ],
};

let language: ResumeLanguage = 'en';
let photoValue = DEFAULT_PHOTO_URL;
let autosaveEnabled = false;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let itemCounter = 0;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function text(key: string): string { return COPY[language][key] ?? COPY.en[key] ?? key; }
function clean(value: unknown): string { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function inputValue(id: string): string { return byId<ValueControl>(id)?.value ?? ''; }

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
  try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* optional preference */ }
  updatePreview();
}

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
): { wrapper: HTMLElement; control: ValueControl } {
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
  return { wrapper, control };
}

function addSimpleItem(section: ResumeSection, value = ''): void {
  const container = byId(`${section}-form`);
  if (!container) return;
  const item = document.createElement('div');
  item.className = 'list-item';
  const field = createField(section === 'skills' ? 'skillItem' : 'languageItem', 'resume-list-value', value);
  field.wrapper.classList.add('resume-inline-group');
  const remove = createRemoveButton('removeItem', () => { item.remove(); updateAndSave(); });
  item.append(field.wrapper, remove);
  container.insertBefore(item, container.querySelector('[data-add-list]'));
}

function addInterestItem(entry: Partial<InterestEntry> = {}): void {
  const container = byId('interests-form');
  if (!container) return;
  const item = document.createElement('div');
  item.className = 'list-item';
  const field = createField('interestItem', 'resume-interest-value', entry.text ?? '');
  field.wrapper.classList.add('resume-inline-group');
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
  item.append(field.wrapper, checkbox, checkboxLabel, createRemoveButton('removeInterest', () => {
    item.remove(); updateAndSave();
  }));
  container.insertBefore(item, container.querySelector('[data-add-interest]'));
}

function addComplexItem(section: ComplexSection, entry: Partial<WorkEntry & EducationEntry> = {}): void {
  const container = byId(`${section}-form`);
  if (!container) return;
  const item = document.createElement('div');
  item.className = 'complex-item-form';
  const fields = document.createElement('md-filled-card');
  fields.className = 'complex-item-fields';
  if (section === 'work') {
    fields.append(
      createField('workTitle', 'work-title', entry.title).wrapper,
      createField('companyLocation', 'work-company', entry.company).wrapper,
      createField('startYear', 'work-start', entry.start).wrapper,
      createField('endYear', 'work-end', entry.end).wrapper,
      createField('description', 'work-desc', entry.desc, true).wrapper,
    );
  } else {
    fields.append(
      createField('degree', 'edu-degree', entry.degree).wrapper,
      createField('schoolLocation', 'edu-school', entry.school).wrapper,
      createField('startYear', 'edu-start', entry.start).wrapper,
      createField('endYear', 'edu-end', entry.end).wrapper,
    );
  }
  fields.append(createRemoveButton('removeEntry', () => { item.remove(); updateAndSave(); }));
  item.append(fields);
  container.insertBefore(item, container.querySelector('[data-add-complex]'));
}

function renderContact(targetId: string, iconName: string, value: string): void {
  const target = byId(targetId);
  if (!target) return;
  target.replaceChildren();
  if (!clean(value)) return;
  const icon = document.createElement('span');
  icon.className = 'material-symbols-outlined resume-pdf-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = iconName;
  const label = document.createElement('span');
  label.textContent = clean(value);
  target.append(icon, label);
}

function renderList(section: ResumeSection): void {
  const list = document.querySelector<HTMLUListElement>(`#resume-${section} ul`);
  if (!list) return;
  const values = Array.from(document.querySelectorAll<ValueControl>(`#${section}-form .resume-list-value`));
  list.replaceChildren(...values.map((input) => clean(input.value)).filter(Boolean).map((value) => {
    const item = document.createElement('li'); item.textContent = value; return item;
  }));
}

function renderInterests(): void {
  const list = document.querySelector<HTMLUListElement>('#resume-interests ul');
  if (!list) return;
  const entries = Array.from(document.querySelectorAll<HTMLElement>('#interests-form .list-item'));
  list.replaceChildren(...entries.map((entry) => {
    const value = clean(entry.querySelector<ValueControl>('.resume-interest-value')?.value);
    if (!value) return null;
    const item = document.createElement('li');
    if (entry.querySelector<CheckedControl>('.resume-interest-project')?.checked) {
      const label = document.createElement('strong'); label.textContent = `${text('projectLabel')} `; item.append(label);
    }
    item.append(value); return item;
  }).filter((item): item is HTMLLIElement => item !== null));
}

function dateRange(start: string, end: string): HTMLElement {
  const element = document.createElement('span');
  element.className = 'date';
  element.textContent = [clean(start), clean(end) || text('current')].filter(Boolean).join(' – ');
  return element;
}

function renderComplex(section: ComplexSection): void {
  const preview = byId(`resume-${section}`);
  const heading = preview?.querySelector('h2');
  if (!preview || !heading) return;
  preview.replaceChildren(heading);
  document.querySelectorAll<HTMLElement>(`#${section}-form .complex-item-form`).forEach((form) => {
    const controlValue = (selector: string): string => (
      form.querySelector<ValueControl>(selector)?.value ?? ''
    );
    const value = (selector: string): string => clean(controlValue(selector));
    const item = document.createElement('div'); item.className = 'resume-item';
    const header = document.createElement('div'); header.className = 'resume-item-header';
    const title = document.createElement('h3');
    const organization = document.createElement('p');
    if (section === 'work') {
      title.textContent = value('.work-title');
      organization.textContent = value('.work-company');
      header.append(title, dateRange(value('.work-start'), value('.work-end')));
      if (!title.textContent && !organization.textContent) return;
      item.append(header, organization);
      const description = document.createElement('p');
      description.className = 'description';
      description.textContent = controlValue('.work-desc').replace(/\r\n?/g, '\n').trim();
      if (description.textContent) item.append(description);
    } else {
      title.textContent = value('.edu-degree');
      organization.textContent = value('.edu-school');
      header.append(title, dateRange(value('.edu-start'), value('.edu-end')));
      if (!title.textContent && !organization.textContent) return;
      item.append(header, organization);
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
  const setText = (id: string, value: string): void => { const element = byId(id); if (element) element.textContent = clean(value); };
  setText('resume-name', inputValue('name'));
  setText('resume-job-title', inputValue('job-title'));
  setText('resume-summary', inputValue('summary'));
  renderContact('resume-phone', 'call', inputValue('phone'));
  renderContact('resume-email', 'mail', inputValue('email'));
  renderContact('resume-address', 'location_on', inputValue('address'));
  renderList('skills'); renderList('languages'); renderInterests(); renderComplex('work'); renderComplex('education');
}

function scheduleSave(): void {
  if (!autosaveEnabled) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(getResumeData())); }
    catch (error) { console.warn('Resume: Unable to save changes.', error); }
  }, 250);
}

function updateAndSave(): void { updatePreview(); scheduleSave(); }

function collectComplex(section: ComplexSection): Array<WorkEntry | EducationEntry> {
  return Array.from(document.querySelectorAll<HTMLElement>(`#${section}-form .complex-item-form`)).map((form) => {
    const value = (selector: string): string => form.querySelector<ValueControl>(selector)?.value ?? '';
    return section === 'work'
      ? { title: value('.work-title'), company: value('.work-company'), start: value('.work-start'), end: value('.work-end'), desc: value('.work-desc') }
      : { degree: value('.edu-degree'), school: value('.edu-school'), start: value('.edu-start'), end: value('.edu-end') };
  });
}

function getResumeData(): ResumeData {
  const simple = (section: ResumeSection): string[] => Array.from(
    document.querySelectorAll<ValueControl>(`#${section}-form .resume-list-value`),
  ).map((input) => input.value).filter((value) => clean(value));
  const interests = Array.from(document.querySelectorAll<HTMLElement>('#interests-form .list-item')).map((item) => ({
    text: item.querySelector<ValueControl>('.resume-interest-value')?.value ?? '',
    isProject: item.querySelector<CheckedControl>('.resume-interest-project')?.checked ?? false,
  })).filter((entry) => clean(entry.text));
  const colors = Object.fromEntries(Object.keys(COLOR_FIELDS).map((id) => [id, inputValue(id)]));
  return {
    language,
    personal: { name: inputValue('name'), jobTitle: inputValue('job-title'), photo: photoValue, phone: inputValue('phone'), email: inputValue('email'), address: inputValue('address'), summary: inputValue('summary') },
    colors, skills: simple('skills'), languages: simple('languages'), interests,
    work: collectComplex('work') as WorkEntry[], education: collectComplex('education') as EducationEntry[],
  };
}

function normalizeData(raw: unknown): ResumeData {
  if (!raw || typeof raw !== 'object') return structuredClone(DEFAULT_DATA);
  const source = raw as Partial<ResumeData>;
  return {
    ...structuredClone(DEFAULT_DATA), ...source,
    language: source.language === 'ro' ? 'ro' : 'en',
    personal: { ...DEFAULT_DATA.personal, ...(source.personal ?? {}) },
    colors: { ...DEFAULT_COLORS, ...(source.colors ?? {}) },
    skills: Array.isArray(source.skills) ? source.skills.map(clean) : DEFAULT_DATA.skills,
    languages: Array.isArray(source.languages) ? source.languages.map(clean) : DEFAULT_DATA.languages,
    interests: Array.isArray(source.interests) ? source.interests : DEFAULT_DATA.interests,
    work: Array.isArray(source.work) ? source.work : DEFAULT_DATA.work,
    education: Array.isArray(source.education) ? source.education : DEFAULT_DATA.education,
  };
}

function clearDynamicForms(): void {
  document.querySelectorAll('#skills-form .list-item, #languages-form .list-item, #interests-form .list-item, #work-form .complex-item-form, #education-form .complex-item-form').forEach((item) => item.remove());
}
function applyData(data: ResumeData): void {
  autosaveEnabled = false;
  const values: Record<string, string> = {
    name: data.personal.name, 'job-title': data.personal.jobTitle, phone: data.personal.phone,
    email: data.personal.email, address: data.personal.address, summary: data.personal.summary,
  };
  Object.entries(values).forEach(([id, value]) => { const input = byId<ValueControl>(id); if (input) input.value = value; });
  clearDynamicForms();
  data.skills.forEach((value) => addSimpleItem('skills', value));
  data.languages.forEach((value) => addSimpleItem('languages', value));
  data.interests.forEach(addInterestItem);
  data.work.forEach((entry) => addComplexItem('work', entry));
  data.education.forEach((entry) => addComplexItem('education', entry));
  Object.entries(data.colors).forEach(([id, value]) => {
    const input = byId<HTMLInputElement>(id); if (input) input.value = value;
    const cssVariable = COLOR_FIELDS[id]; if (cssVariable) byId('resume-preview')?.style.setProperty(cssVariable, value);
    const output = document.querySelector<HTMLElement>(`[data-color-value-for="${id}"]`); if (output) output.textContent = value;
  });
  updatePhotoPreview(data.personal.photo);
  applyLanguage(data.language);
  updatePreview();
}

function loadStoredData(): ResumeData | null {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? normalizeData(JSON.parse(raw)) : null; }
  catch (error) { console.warn('Resume: Unable to load saved data.', error); return null; }
}

function exportJson(): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(getResumeData(), null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'resume.json'; link.click(); URL.revokeObjectURL(url);
}

function importJson(event: Event): void {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try { applyData(normalizeData(JSON.parse(String(reader.result)))); autosaveEnabled = true; scheduleSave(); }
    catch (error) { console.warn('Resume: Invalid JSON file.', error); }
  });
  reader.readAsText(file); input.value = '';
}

function isEditMode(): boolean {
  const hashQuery = window.location.hash.split('?')[1] ?? '';
  const value = new URLSearchParams(window.location.search).get('edit') ?? new URLSearchParams(hashQuery).get('edit');
  return value?.toLowerCase() === 'true';
}

function bindControls(): void {
  document.querySelectorAll<HTMLElement>('[data-add-list]').forEach((button) => button.addEventListener('click', () => {
    const section = button.dataset.addList as ResumeSection | undefined; if (section) { addSimpleItem(section); updateAndSave(); }
  }));
  document.querySelectorAll<HTMLElement>('[data-add-complex]').forEach((button) => button.addEventListener('click', () => {
    const section = button.dataset.addComplex as ComplexSection | undefined; if (section) { addComplexItem(section); updateAndSave(); }
  }));
  document.querySelector<HTMLElement>('[data-add-interest]')?.addEventListener('click', () => { addInterestItem(); updateAndSave(); });
  ['name', 'job-title', 'phone', 'email', 'address', 'summary'].forEach((id) => byId<ValueControl>(id)?.addEventListener('input', updateAndSave));
  document.querySelectorAll<HTMLInputElement>('[data-resume-color]').forEach((input) => input.addEventListener('input', () => {
    const variable = input.dataset.resumeColor; if (variable) byId('resume-preview')?.style.setProperty(variable, input.value);
    const output = document.querySelector<HTMLElement>(`[data-color-value-for="${input.id}"]`); if (output) output.textContent = input.value;
    updateAndSave();
  }));
  byId<HTMLInputElement>('photo')?.addEventListener('change', (event) => {
    const file = (event.currentTarget as HTMLInputElement).files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.addEventListener('load', () => { updatePhotoPreview(String(reader.result)); scheduleSave(); }); reader.readAsDataURL(file);
  });
  byId('removePhotoButton')?.addEventListener('click', () => { updatePhotoPreview(DEFAULT_PHOTO_URL); const input = byId<HTMLInputElement>('photo'); if (input) input.value = ''; scheduleSave(); });
  byId('exportResumeJson')?.addEventListener('click', exportJson);
  byId('importResumeJson')?.addEventListener('click', () => byId<HTMLInputElement>('resume-json-file')?.click());
  byId<HTMLInputElement>('resume-json-file')?.addEventListener('change', importJson);
  byId('downloadResumeButton')?.addEventListener('click', async () => { await document.fonts?.ready; window.print(); });
  document.querySelectorAll<HTMLElement>('[data-resume-lang]').forEach((button) => button.addEventListener('click', () => applyLanguage(button.dataset.resumeLang === 'ro' ? 'ro' : 'en')));
}

export function initResumePage(): void {
  const page = byId('resumePage');
  if (!page || page.dataset.initialized === 'true') return;
  page.dataset.initialized = 'true';
  bindControls();
  const editMode = isEditMode();
  const form = page.querySelector<HTMLElement>('.form-container');
  if (form) form.hidden = !editMode;
  let preferredLanguage: ResumeLanguage = 'en';
  try { preferredLanguage = localStorage.getItem(LANGUAGE_KEY) === 'ro' ? 'ro' : 'en'; } catch { /* optional preference */ }
  const data = editMode ? loadStoredData() ?? structuredClone(DEFAULT_DATA) : structuredClone(DEFAULT_DATA);
  data.language = preferredLanguage;
  applyData(data);
  autosaveEnabled = editMode;
}