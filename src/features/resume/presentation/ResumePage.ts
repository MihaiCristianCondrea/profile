// @ts-nocheck
// Resume builder functionality
const RESUME_STORAGE_KEY = 'resume-builder-state-v1';
const RESUME_LANGUAGE_KEY = 'resume-builder-language-v1';
const DEFAULT_PHOTO_URL = 'images/profile/cv_profile_pic.png';

const RESUME_I18N = {
    en: {
        title: 'Resume Builder',
        personalInfo: 'Personal Info',
        design: 'Design',
        skills: 'Skills',
        workHistory: 'Work History',
        education: 'Education',
        languages: 'Languages',
        interests: 'Interests',
        exportImport: 'Export / Import',
        fullName: 'Full Name',
        jobTitle: 'Job Title',
        profilePhoto: 'Profile Photo',
        removePhoto: 'Remove Photo',
        phone: 'Phone',
        email: 'Email',
        address: 'Address',
        summary: 'Professional Summary',
        accentColor: 'Accent Color',
        secondaryColor: 'Secondary Color',
        leftPanel: 'Left Panel',
        rightPanel: 'Right Panel',
        textColor: 'Text Color',
        mutedText: 'Muted Text',
        addSkill: 'Add Skill',
        addWork: 'Add Work Experience',
        addEducation: 'Add Education',
        addLanguage: 'Add Language',
        addInterest: 'Add Interest',
        exportJson: 'Export Resume JSON',
        importJson: 'Import Resume JSON',
        download: 'Download Resume as PDF',
        exportNote: 'Exports through browser print / Save as PDF to preserve selectable, searchable resume text for ATS and job portals.',
        skillsPreview: 'Skills',
        languagesPreview: 'Languages',
        interestsPreview: 'Interests',
        workHistoryPreview: 'Work history',
        educationPreview: 'Education',
        skillItem: 'Skill',
        languageItem: 'Language',
        interestItem: 'Interest or Project',
        isProject: 'Is Project?',
        workTitle: 'Job Title',
        companyLocation: 'Company & Location',
        startYear: 'Start Year',
        endYear: 'End Year',
        description: 'Description (Markdown supported)',
        degree: 'Degree / Certificate',
        schoolLocation: 'School / University',
        removeItem: 'Remove item',
        removeInterest: 'Remove interest',
        removeEntry: 'Remove entry',
        projectLabel: 'Project:',
        current: 'Current',
        item: 'Item'
    },
    ro: {
        title: 'Constructor CV',
        personalInfo: 'Informații personale',
        design: 'Design',
        skills: 'Competențe',
        workHistory: 'Experiență profesională',
        education: 'Educație',
        languages: 'Limbi',
        interests: 'Interese',
        exportImport: 'Export / Import',
        fullName: 'Nume complet',
        jobTitle: 'Titlu profesional',
        profilePhoto: 'Fotografie de profil',
        removePhoto: 'Elimină fotografia',
        phone: 'Telefon',
        email: 'E-mail',
        address: 'Adresă',
        summary: 'Rezumat profesional',
        accentColor: 'Culoare accent',
        secondaryColor: 'Culoare secundară',
        leftPanel: 'Panou stânga',
        rightPanel: 'Panou dreapta',
        textColor: 'Culoare text',
        mutedText: 'Text estompat',
        addSkill: 'Adaugă competență',
        addWork: 'Adaugă experiență',
        addEducation: 'Adaugă educație',
        addLanguage: 'Adaugă limbă',
        addInterest: 'Adaugă interes',
        exportJson: 'Exportă CV JSON',
        importJson: 'Importă CV JSON',
        download: 'Descarcă CV-ul ca PDF',
        exportNote: 'Exportă prin imprimarea browserului / Salvare ca PDF pentru a păstra textul selectabil și căutabil pentru ATS și portaluri de joburi.',
        skillsPreview: 'Competențe',
        languagesPreview: 'Limbi',
        interestsPreview: 'Interese',
        workHistoryPreview: 'Experiență profesională',
        educationPreview: 'Educație',
        skillItem: 'Competență',
        languageItem: 'Limbă',
        interestItem: 'Interes sau proiect',
        isProject: 'Este proiect?',
        workTitle: 'Titlu job',
        companyLocation: 'Companie & locație',
        startYear: 'An început',
        endYear: 'An sfârșit',
        description: 'Descriere (suport Markdown)',
        degree: 'Diplomă / Certificat',
        schoolLocation: 'Școală / Universitate',
        removeItem: 'Elimină element',
        removeInterest: 'Elimină interes',
        removeEntry: 'Elimină intrare',
        projectLabel: 'Proiect:',
        current: 'Prezent',
        item: 'Element'
    }
};

let resumeEditMode = false;
let resumeAutoSaveEnabled = false;
let resumeSaveTimeout;
let resumeLanguage = 'en';

function getResumeText(key) {
    return RESUME_I18N[resumeLanguage]?.[key] || RESUME_I18N.en[key] || key;
}

function applyResumeLanguage(language) {
    if (!RESUME_I18N[language]) return;
    resumeLanguage = language;
    document.querySelectorAll('[data-resume-i18n]').forEach(element => {
        const key = element.dataset.resumeI18n;
        const value = getResumeText(key);
        if (value) {
            element.textContent = value;
        }
    });
    document.querySelectorAll('[data-resume-i18n-aria]').forEach(element => {
        const key = element.dataset.resumeI18nAria;
        const value = getResumeText(key);
        if (value) {
            element.setAttribute('aria-label', value);
        }
    });
    const preview = document.getElementById('resume-preview');
    if (preview) {
        preview.setAttribute('lang', language);
    }
    document.querySelectorAll('[data-resume-lang]').forEach(button => {
        const isActive = button.dataset.resumeLang === resumeLanguage;
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    updateList('interests');
    updateComplexList('work');
    updateComplexList('education');
    try {
        localStorage.setItem(RESUME_LANGUAGE_KEY, resumeLanguage);
    } catch (error) {
        console.warn('Unable to save resume language preference.', error);
    }
}

function setupResumeLanguage() {
    const buttons = document.querySelectorAll('[data-resume-lang]');
    buttons.forEach(button => {
        if (button.dataset.resumeBound === 'true') return;
        button.addEventListener('click', () => {
            applyResumeLanguage(button.dataset.resumeLang);
        });
        button.dataset.resumeBound = 'true';
    });
    let storedLanguage = 'en';
    try {
        storedLanguage = localStorage.getItem(RESUME_LANGUAGE_KEY) || 'en';
    } catch (error) {
        console.warn('Unable to load resume language preference.', error);
    }
    applyResumeLanguage(storedLanguage);
}

function createInputGroupElement({
    id,
    labelText,
    labelKey,
    value = '',
    control = 'input',
    type = 'text',
    placeholder = ' ',
    wrapperClass = 'input-group',
    inputClasses = [],
    onInput
}) {
    const wrapper = document.createElement('div');
    wrapper.className = wrapperClass;

    const inputElement = control === 'textarea'
        ? document.createElement('textarea')
        : document.createElement('input');

    if (control !== 'textarea') {
        inputElement.type = type;
    }

    inputElement.placeholder = placeholder;
    inputElement.value = value;
    inputElement.id = id;
    inputClasses.forEach(cls => inputElement.classList.add(cls));

    if (typeof onInput === 'function') {
        inputElement.addEventListener('input', onInput);
    }

    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = labelText;
    if (labelKey) {
        label.dataset.resumeI18n = labelKey;
    }

    wrapper.append(inputElement, label);

    return { wrapper, inputElement };
}


function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().replace(/Vaccine Preparation Technicia\b/g, 'Vaccine Preparation Technician');
}

function cleanMarkdownText(value) {
    return String(value || '')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .replace(/Vaccine Preparation Technicia\b/g, 'Vaccine Preparation Technician');
}

function formatDateRange(start, end) {
    const currentLabel = getResumeText('current');
    const normalizedStart = cleanText(start);
    const normalizedEnd = cleanText(end) || currentLabel;
    return [normalizedStart, normalizedEnd].filter(Boolean).join(' - ');
}

function formatDateTimeValue(value) {
    const normalized = cleanText(value);
    return /^\d{4}$/.test(normalized) ? normalized : '';
}

function createDateRangeElement(start, end) {
    const currentLabel = getResumeText('current');
    const normalizedStart = cleanText(start);
    const normalizedEnd = cleanText(end) || currentLabel;
    const wrapper = document.createElement('span');
    wrapper.className = 'date';

    const appendTime = (value) => {
        if (!value) return;
        const time = document.createElement('time');
        const dateTime = formatDateTimeValue(value);
        if (dateTime) {
            time.dateTime = dateTime;
        }
        time.textContent = value;
        wrapper.appendChild(time);
    };

    appendTime(normalizedStart);
    if (normalizedStart && normalizedEnd) {
        wrapper.append(' - ');
    }
    appendTime(normalizedEnd);

    return wrapper;
}

function renderContactLine(targetId, iconName, value) {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.replaceChildren();

    const text = cleanText(value);
    if (!text) return;

    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined resume-pdf-icon resume-print-icon-text';
    icon.setAttribute('data-print-icon', iconName);
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = iconName;

    const label = document.createElement('span');
    label.textContent = text;

    target.append(icon, label);
}

// Real-time updates for form inputs
function setupRealtimeUpdates() {
    const set = (id, cb) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', (event) => {
            cb(event);
            scheduleResumeSave();
        });
    };
    set('name', e => document.getElementById('resume-name').innerText = cleanText(e.target.value));
    set('job-title', e => document.getElementById('resume-job-title').innerText = cleanText(e.target.value));
    set('phone', e => renderContactLine('resume-phone', 'call', e.target.value));
    set('email', e => renderContactLine('resume-email', 'mail', e.target.value));
    set('address', e => renderContactLine('resume-address', 'location_on', e.target.value));
    set('summary', e => {
        const parsed = marked.parse(e.target.value);
        document.getElementById('resume-summary').innerHTML = DOMPurify.sanitize(parsed);
    });
    const photoInput = document.getElementById('photo');
    if (photoInput) {
        photoInput.addEventListener('change', evt => {
            if (evt.target.files && evt.target.files[0]) {
                const reader = new FileReader();
                reader.onload = e => {
                    updatePhotoPreview(e.target.result);
                    scheduleResumeSave();
                };
                reader.readAsDataURL(evt.target.files[0]);
            }
        });
    }

    document.querySelectorAll('[data-resume-color]').forEach(input => {
        input.addEventListener('input', event => {
            const target = event.target;
            applyResumeColor(target.dataset.resumeColor, target.value);
            updateColorValueDisplay(target.id, target.value);
            scheduleResumeSave();
        });
    });
}

function getListItemLabel(sectionId) {
    if (sectionId === 'skills') return getResumeText('skillItem');
    if (sectionId === 'languages') return getResumeText('languageItem');
    return getResumeText('item');
}

function addListItem(sectionId, value = '') {
    const container = document.getElementById(`${sectionId}-form`);
    if (!container) return;
    const itemId = `${sectionId}-${Date.now()}`;
    const listItem = document.createElement('div');
    listItem.className = 'list-item';
    listItem.id = itemId;

    const labelKey = sectionId === 'skills'
        ? 'skillItem'
        : sectionId === 'languages'
            ? 'languageItem'
            : 'item';
    const { wrapper } = createInputGroupElement({
        id: `input-${itemId}`,
        labelText: getListItemLabel(sectionId),
        labelKey,
        value,
        wrapperClass: 'input-group resume-inline-group',
        onInput: () => updateList(sectionId)
    });

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-btn';
    removeButton.setAttribute('aria-label', getResumeText('removeItem'));
    removeButton.dataset.resumeI18nAria = 'removeItem';
    removeButton.textContent = '×';
    removeButton.addEventListener('click', () => removeListItem(itemId, sectionId));

    listItem.append(wrapper, removeButton);
    container.insertBefore(listItem, container.querySelector('.add-btn'));
    updateList(sectionId);
    scheduleResumeSave();
}

function addInterestItem(value = '', isProject = false) {
    const container = document.getElementById('interests-form');
    const itemId = `interests-${Date.now()}`;
    const listItem = document.createElement('div');
    listItem.className = 'list-item';
    listItem.id = itemId;

    const { wrapper } = createInputGroupElement({
        id: `input-${itemId}`,
        labelText: getResumeText('interestItem'),
        labelKey: 'interestItem',
        value,
        wrapperClass: 'input-group resume-inline-group',
        onInput: () => updateList('interests')
    });

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `check-${itemId}`;
    checkbox.className = 'resume-checkbox';
    checkbox.checked = isProject;
    checkbox.addEventListener('change', () => updateList('interests'));

    const checkboxLabel = document.createElement('label');
    checkboxLabel.setAttribute('for', checkbox.id);
    checkboxLabel.className = 'resume-checkbox-label';
    checkboxLabel.textContent = getResumeText('isProject');
    checkboxLabel.dataset.resumeI18n = 'isProject';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-btn';
    removeButton.setAttribute('aria-label', getResumeText('removeInterest'));
    removeButton.dataset.resumeI18nAria = 'removeInterest';
    removeButton.textContent = '×';
    removeButton.addEventListener('click', () => removeListItem(itemId, 'interests'));

    listItem.append(wrapper, checkbox, checkboxLabel, removeButton);
    container.insertBefore(listItem, container.querySelector('.add-btn'));
    updateList('interests');
    scheduleResumeSave();
}

function removeListItem(itemId, sectionId) {
    document.getElementById(itemId).remove();
    updateList(sectionId);
    scheduleResumeSave();
}

function updateList(sectionId) {
    const listElement = document.querySelector(`#resume-${sectionId} ul`);
    listElement.innerHTML = '';
    if (sectionId === 'interests') {
        document.querySelectorAll(`#interests-form .list-item`).forEach(item => {
            const input = item.querySelector('input[type="text"]');
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (input.value.trim()) {
                const li = document.createElement('li');
                const projectLabel = getResumeText('projectLabel');
                li.innerHTML = checkbox.checked ? `<strong>${projectLabel}</strong> ${input.value}` : input.value;
                listElement.appendChild(li);
            }
        });
    } else {
        document.querySelectorAll(`#${sectionId}-form input[type='text']`).forEach(input => {
            if (input.value.trim()) {
                const li = document.createElement('li');
                li.innerText = input.value;
                listElement.appendChild(li);
            }
        });
    }
    scheduleResumeSave();
}

function addComplexItem(sectionId, data = {}) {
    const container = document.getElementById(`${sectionId}-form`);
    const itemId = `${sectionId}-${Date.now()}`;
    const formWrapper = document.createElement('div');
    formWrapper.className = 'complex-item-form';
    formWrapper.id = itemId;

    const innerContainer = document.createElement('div');
    innerContainer.className = 'complex-item-fields';
    formWrapper.appendChild(innerContainer);

    const handleInput = () => updateComplexList(sectionId);

    if (sectionId === 'work') {
        const titleGroup = createInputGroupElement({
            id: `${itemId}-title`,
            labelText: getResumeText('workTitle'),
            labelKey: 'workTitle',
            value: data.title || '',
            inputClasses: ['work-title'],
            onInput: handleInput
        });
        const companyGroup = createInputGroupElement({
            id: `${itemId}-company`,
            labelText: getResumeText('companyLocation'),
            labelKey: 'companyLocation',
            value: data.company || '',
            inputClasses: ['work-company'],
            onInput: handleInput
        });
        const startGroup = createInputGroupElement({
            id: `${itemId}-start`,
            labelText: getResumeText('startYear'),
            labelKey: 'startYear',
            value: data.start || '',
            inputClasses: ['work-start'],
            onInput: handleInput
        });
        const endGroup = createInputGroupElement({
            id: `${itemId}-end`,
            labelText: getResumeText('endYear'),
            labelKey: 'endYear',
            value: data.end || '',
            inputClasses: ['work-end'],
            onInput: handleInput
        });
        const descriptionGroup = createInputGroupElement({
            id: `${itemId}-desc`,
            labelText: getResumeText('description'),
            labelKey: 'description',
            value: data.desc || '',
            control: 'textarea',
            inputClasses: ['work-desc'],
            onInput: handleInput
        });

        innerContainer.append(
            titleGroup.wrapper,
            companyGroup.wrapper,
            startGroup.wrapper,
            endGroup.wrapper,
            descriptionGroup.wrapper
        );
    } else if (sectionId === 'education') {
        const degreeGroup = createInputGroupElement({
            id: `${itemId}-degree`,
            labelText: getResumeText('degree'),
            labelKey: 'degree',
            value: data.degree || '',
            inputClasses: ['edu-degree'],
            onInput: handleInput
        });
        const schoolGroup = createInputGroupElement({
            id: `${itemId}-school`,
            labelText: getResumeText('schoolLocation'),
            labelKey: 'schoolLocation',
            value: data.school || '',
            inputClasses: ['edu-school'],
            onInput: handleInput
        });
        const startGroup = createInputGroupElement({
            id: `${itemId}-start`,
            labelText: getResumeText('startYear'),
            labelKey: 'startYear',
            value: data.start || '',
            inputClasses: ['edu-start'],
            onInput: handleInput
        });
        const endGroup = createInputGroupElement({
            id: `${itemId}-end`,
            labelText: getResumeText('endYear'),
            labelKey: 'endYear',
            value: data.end || '',
            inputClasses: ['edu-end'],
            onInput: handleInput
        });

        innerContainer.append(
            degreeGroup.wrapper,
            schoolGroup.wrapper,
            startGroup.wrapper,
            endGroup.wrapper
        );
    }

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-btn';
    removeButton.setAttribute('aria-label', getResumeText('removeEntry'));
    removeButton.dataset.resumeI18nAria = 'removeEntry';
    removeButton.textContent = '×';
    removeButton.addEventListener('click', () => removeItem(itemId, sectionId));

    innerContainer.appendChild(removeButton);

    container.insertBefore(formWrapper, container.querySelector('.add-btn'));
    updateComplexList(sectionId);
    scheduleResumeSave();
}

const addWorkItem = (t,c,s,e,d) => addComplexItem('work',{title:t,company:c,start:s,end:e,desc:d});
const addEducationItem = (d,s,st,e) => addComplexItem('education',{degree:d,school:s,start:st,end:e});

function removeItem(itemId, sectionId) {
    document.getElementById(itemId).remove();
    updateComplexList(sectionId);
    scheduleResumeSave();
}

function updateComplexList(sectionId) {
    const container = document.getElementById(`resume-${sectionId}`);
    const h2 = container.querySelector('h2');
    container.innerHTML = '';
    container.appendChild(h2);
    document.querySelectorAll(`.complex-item-form[id^="${sectionId}-"]`).forEach(item => {
        const div = document.createElement('div');
        div.className = 'resume-item';
        if (sectionId === 'work') {
            const data = {
                title: item.querySelector('.work-title').value,
                company: item.querySelector('.work-company').value,
                start: item.querySelector('.work-start').value,
                end: item.querySelector('.work-end').value,
                desc: item.querySelector('.work-desc').value.trim()
            };
            if (data.title || data.company) {
                const header = document.createElement('div');
                header.className = 'resume-item-header';
                const title = document.createElement('h3');
                title.textContent = cleanText(data.title);
                header.append(title, createDateRangeElement(data.start, data.end));

                const company = document.createElement('p');
                const companyName = document.createElement('strong');
                companyName.textContent = cleanText(data.company);
                company.appendChild(companyName);

                const description = document.createElement('div');
                description.className = 'description';
                description.innerHTML = DOMPurify.sanitize(marked.parse(data.desc));

                div.append(header, company, description);
                container.appendChild(div);
            }
        } else if (sectionId === 'education') {
            const data = {
                degree: item.querySelector('.edu-degree').value,
                school: item.querySelector('.edu-school').value,
                start: item.querySelector('.edu-start').value,
                end: item.querySelector('.edu-end').value
            };
            if (data.degree || data.school) {
                const header = document.createElement('div');
                header.className = 'resume-item-header';
                const degree = document.createElement('h3');
                degree.textContent = cleanText(data.degree);
                header.append(degree, createDateRangeElement(data.start, data.end));

                const school = document.createElement('p');
                const schoolName = document.createElement('strong');
                schoolName.textContent = cleanText(data.school);
                school.appendChild(schoolName);

                div.append(header, school);
                container.appendChild(div);
            }
        }
    });
    scheduleResumeSave();
}


function initialize() {
    document.getElementById('name').value = 'Mihai-Cristian Condrea';
    document.getElementById('job-title').value = 'Android Developer';
    document.getElementById('phone').value = 'soon';
    document.getElementById('email').value = 'contact.mihaicristiancondrea@gmail.com';
    document.getElementById('address').value = 'Bucharest, Romania';
    document.getElementById('summary').value = `Android Developer specializing in the full app lifecycle, from UI/UX design to Google Play publishing, utilizing Jetpack Compose, Kotlin, and Firebase. As a music producer, I bring a creative and user-centric approach to development.`;
    ['name','job-title','phone','email','address','summary'].forEach(id=>document.getElementById(id).dispatchEvent(new Event('input')));
    addListItem('skills','Languages: Kotlin, Java, HTML, Markdown, JSON');
    addListItem('skills','Android: Jetpack Compose, ViewModels, LiveData, Room, Navigation');
    addListItem('skills','Tools: Android Studio, GitHub, Git, Firebase Console, Play Console');
    addListItem('skills','Design: Material 3, Figma, SVG, Adobe Illustrator, Photoshop');
    addListItem('languages','Romanian (Native)');
    addListItem('languages','English (Advanced)');
    addInterestItem('Technology, AI, UX optimization');
    addInterestItem('Electronic Music Production');
    addInterestItem('Creating educational and promotional digital content');
    addComplexItem('work',{title:'Android Developer',company:'Digi Romania S.A., Bucharest',start:'2024',end:'Current',desc:`- Engineered Android applications for live TV and video streaming platforms.\n- Built bespoke Android applications for promotional campaigns and internal operational use.\n- Orchestrated full lifecycle management of the Google Play Console for Digi Romania, Digi Spain, and Digi Portugal.`});
    addComplexItem('work',{title:'Android Developer',company:'Personal Projects, Bucharest',start:'2020',end:'Current',desc:`- Android Developer specializing in the full app lifecycle, from UI/UX design to Google Play publishing, utilizing Jetpack Compose, Kotlin, and Firebase. As a music producer, I bring a creative and user-centric approach to development.\n- Launched over 10 Android apps, managing everything from UI/UX design to development and publishing.\n- Focused on a Google-centric design, using Material Design principles for intuitive and consistent apps.`});
    addComplexItem('education',{degree:'University',school:'Faculty of Industrial and Robotics Engineering',start:'2020',end:'Current'});
    addComplexItem('education',{degree:'High School',school:'Hristo Botev Bulgarian Theoretical High School',start:'2016',end:'2020'});
    updatePhotoPreview(DEFAULT_PHOTO_URL);
}

function getResumeEditParam() {
    if (typeof window === 'undefined' || !window.location) {
        return null;
    }

    const parseParams = (paramString) => {
        if (typeof paramString !== 'string' || paramString.length === 0) {
            return null;
        }
        const params = new URLSearchParams(paramString);
        return params.has('edit') ? params.get('edit') : null;
    };

    const searchValue = parseParams(window.location.search);
    if (searchValue !== null) {
        return searchValue;
    }

    const hash = window.location.hash;
    if (typeof hash === 'string' && hash.length > 0) {
        const queryStart = hash.search(/[?&]/);
        if (queryStart !== -1) {
            const hashParams = hash.slice(queryStart + 1);
            const hashValue = parseParams(hashParams);
            if (hashValue !== null) {
                return hashValue;
            }
        }
    }

    return null;
}

function setupMode() {
    const editValue = getResumeEditParam();
    const editMode = typeof editValue === 'string' && editValue.toLowerCase() === 'true';
    const form = document.querySelector('#resumePage .form-container');
    if (form) {
        form.style.display = editMode ? '' : 'none';
    }
    resumeEditMode = editMode;
    resumeAutoSaveEnabled = editMode;
    return editMode;
}

function setupResumeControls() {
    document.querySelectorAll('[data-add-list]').forEach(button => {
        if (button.dataset.resumeBound === 'true') return;
        const sectionId = button.dataset.addList;
        if (!sectionId) return;
        button.addEventListener('click', () => addListItem(sectionId));
        button.dataset.resumeBound = 'true';
    });

    document.querySelectorAll('[data-add-complex]').forEach(button => {
        if (button.dataset.resumeBound === 'true') return;
        const sectionId = button.dataset.addComplex;
        if (!sectionId) return;
        button.addEventListener('click', () => addComplexItem(sectionId));
        button.dataset.resumeBound = 'true';
    });

    document.querySelectorAll('[data-add-interest]').forEach(button => {
        if (button.dataset.resumeBound === 'true') return;
        button.addEventListener('click', () => addInterestItem());
        button.dataset.resumeBound = 'true';
    });

    const downloadButton = document.getElementById('downloadResumeButton');
    if (downloadButton && downloadButton.dataset.resumeBound !== 'true') {
        downloadButton.addEventListener('click', prepareAndPrintResume);
        downloadButton.dataset.resumeBound = 'true';
    }

    const removePhotoButton = document.getElementById('removePhotoButton');
    if (removePhotoButton && removePhotoButton.dataset.resumeBound !== 'true') {
        removePhotoButton.addEventListener('click', () => {
            updatePhotoPreview(DEFAULT_PHOTO_URL);
            const photoInput = document.getElementById('photo');
            if (photoInput) {
                photoInput.value = '';
            }
            scheduleResumeSave();
        });
        removePhotoButton.dataset.resumeBound = 'true';
    }

    const exportButton = document.getElementById('exportResumeJson');
    if (exportButton && exportButton.dataset.resumeBound !== 'true') {
        exportButton.addEventListener('click', exportResumeJson);
        exportButton.dataset.resumeBound = 'true';
    }

    const importButton = document.getElementById('importResumeJson');
    if (importButton && importButton.dataset.resumeBound !== 'true') {
        importButton.addEventListener('click', () => {
            const fileInput = document.getElementById('resume-json-file');
            if (fileInput) {
                fileInput.click();
            }
        });
        importButton.dataset.resumeBound = 'true';
    }

    const importFile = document.getElementById('resume-json-file');
    if (importFile && importFile.dataset.resumeBound !== 'true') {
        importFile.addEventListener('change', handleResumeJsonImport);
        importFile.dataset.resumeBound = 'true';
    }
}

async function waitForResumeFonts(timeoutMs = 3000) {
    if (!document.fonts || !document.fonts.ready) return;
    await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, timeoutMs))]);
}

function ensureResumeFontPreconnects() {
    [
        ['https://fonts.googleapis.com'],
        ['https://fonts.gstatic.com', 'anonymous']
    ].forEach(([href, crossOrigin]) => {
        if (document.head.querySelector(`link[rel="preconnect"][href="${href}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = href;
        if (crossOrigin) link.crossOrigin = crossOrigin;
        document.head.appendChild(link);
    });
}

function setResumePrintPageSize() {
    let style = document.getElementById('resume-print-page-size');
    if (!style) {
        style = document.createElement('style');
        style.id = 'resume-print-page-size';
        document.head.appendChild(style);
    }
    style.textContent = '@page { size: A4 portrait; margin: 0; }';
}

function normalizeResumeDataForExport(data) {
    if (!data || typeof data !== 'object') return data;
    const cleanList = (list = []) => list.map(cleanText).filter(Boolean);
    const cleanWork = (item = {}) => ({
        ...item,
        title: cleanText(item.title),
        company: cleanText(item.company),
        start: cleanText(item.start),
        end: cleanText(item.end),
        desc: cleanMarkdownText(item.desc)
    });
    const cleanEdu = (item = {}) => ({
        ...item,
        degree: cleanText(item.degree),
        school: cleanText(item.school),
        start: cleanText(item.start),
        end: cleanText(item.end)
    });

    return {
        ...data,
        personal: {
            ...data.personal,
            name: cleanText(data.personal?.name),
            jobTitle: cleanText(data.personal?.jobTitle),
            phone: cleanText(data.personal?.phone),
            email: cleanText(data.personal?.email),
            address: cleanText(data.personal?.address),
            summary: cleanMarkdownText(data.personal?.summary)
        },
        skills: cleanList(data.skills),
        languages: cleanList(data.languages),
        interests: (data.interests || [])
            .map(item => ({ ...item, text: cleanText(item.text) }))
            .filter(item => item.text),
        work: (data.work || []).map(cleanWork).filter(item => item.title || item.company || item.desc),
        education: (data.education || []).map(cleanEdu).filter(item => item.degree || item.school)
    };
}

async function prepareAndPrintResume() {
    // ATS requirement: keep PDF export on the browser print path so Chromium
    // preserves real selectable/searchable text, links, fonts, and document order.
    // Do not replace this main path with canvas/image rasterization.
    ensureResumeFontPreconnects();
    const preview = document.getElementById('resume-preview');
    if (!preview) {
        window.print();
        return;
    }

    await waitForResumeFonts();

    document.documentElement.classList.add('resume-printing');

    preview.dataset.printSize = 'a4';
    await new Promise(resolve => requestAnimationFrame(resolve));

    setResumePrintPageSize();

    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    window.print();
}

window.addEventListener('afterprint', () => {
    document.documentElement.classList.remove('resume-printing');
});

let markedLoadPromise;

function ensureMarkedLoaded() {
    if (window.marked) return Promise.resolve();
    if (markedLoadPromise) return markedLoadPromise;
    markedLoadPromise = new Promise(resolve => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        script.onload = resolve;
        script.onerror = resolve;
        document.head.appendChild(script);
    });
    return markedLoadPromise;
}

function updatePhotoPreview(value) {
    const preview = document.getElementById('photo-preview');
    if (preview) {
        preview.style.backgroundImage = value ? `url(${value})` : '';
        preview.dataset.photo = value || '';
    }
}

function applyResumeColor(cssVar, value) {
    if (!cssVar) return;
    const preview = document.getElementById('resume-preview');
    if (preview) {
        preview.style.setProperty(cssVar, value);
    }
}

function updateColorValueDisplay(inputId, value) {
    if (!inputId) return;
    const label = document.querySelector(`[data-color-value-for="${inputId}"]`);
    if (label) {
        label.textContent = value;
    }
}

function normalizeHex(value) {
    if (!value) return '';
    const trimmed = value.trim();
    if (trimmed.startsWith('#')) return trimmed;
    return trimmed;
}

function rgbToHex(value) {
    const result = /rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(value);
    if (!result) return '';
    const toHex = (num) => Number(num).toString(16).padStart(2, '0');
    return `#${toHex(result[1])}${toHex(result[2])}${toHex(result[3])}`;
}

function resolveColorValue(value) {
    if (!value) return '';
    if (value.startsWith('#')) return value;
    if (value.startsWith('rgb')) return rgbToHex(value);
    return value;
}

function setColorInputValue(inputId, value) {
    const input = document.getElementById(inputId);
    if (!input || !value) return;
    input.value = normalizeHex(resolveColorValue(value));
    updateColorValueDisplay(inputId, input.value);
}

function collectListValues(sectionId) {
    const values = [];
    document.querySelectorAll(`#${sectionId}-form .list-item input[type='text']`).forEach(input => {
        if (input.value.trim()) {
            values.push(input.value.trim());
        }
    });
    return values;
}

function collectInterestValues() {
    const values = [];
    document.querySelectorAll('#interests-form .list-item').forEach(item => {
        const input = item.querySelector('input[type="text"]');
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (input && input.value.trim()) {
            values.push({ text: input.value.trim(), isProject: checkbox ? checkbox.checked : false });
        }
    });
    return values;
}

function collectComplexValues(sectionId, mapping) {
    const values = [];
    document.querySelectorAll(`.complex-item-form[id^="${sectionId}-"]`).forEach(item => {
        const entry = {};
        Object.entries(mapping).forEach(([key, selector]) => {
            const input = item.querySelector(selector);
            entry[key] = input ? input.value : '';
        });
        values.push(entry);
    });
    return values;
}

function getResumeData() {
    const preview = document.getElementById('resume-preview');
    const previewStyles = preview ? getComputedStyle(preview) : null;
    const photoPreview = document.getElementById('photo-preview');
    return {
        personal: {
            name: document.getElementById('name')?.value || '',
            jobTitle: document.getElementById('job-title')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            email: document.getElementById('email')?.value || '',
            address: document.getElementById('address')?.value || '',
            summary: document.getElementById('summary')?.value || '',
            photo: photoPreview?.dataset.photo || ''
        },
        colors: {
            accent: previewStyles?.getPropertyValue('--resume-accent').trim() || '',
            secondary: previewStyles?.getPropertyValue('--resume-secondary').trim() || '',
            leftBg: previewStyles?.getPropertyValue('--resume-left-bg').trim() || '',
            rightBg: previewStyles?.getPropertyValue('--resume-right-bg').trim() || '',
            text: previewStyles?.getPropertyValue('--resume-text').trim() || '',
            muted: previewStyles?.getPropertyValue('--resume-muted').trim() || ''
        },
        skills: collectListValues('skills'),
        languages: collectListValues('languages'),
        interests: collectInterestValues(),
        work: collectComplexValues('work', {
            title: '.work-title',
            company: '.work-company',
            start: '.work-start',
            end: '.work-end',
            desc: '.work-desc'
        }),
        education: collectComplexValues('education', {
            degree: '.edu-degree',
            school: '.edu-school',
            start: '.edu-start',
            end: '.edu-end'
        })
    };
}

function clearList(sectionId) {
    const container = document.getElementById(`${sectionId}-form`);
    if (!container) return;
    container.querySelectorAll('.list-item').forEach(item => item.remove());
}

function clearComplex(sectionId) {
    const container = document.getElementById(`${sectionId}-form`);
    if (!container) return;
    container.querySelectorAll('.complex-item-form').forEach(item => item.remove());
}

function applyResumeData(data) {
    if (!data || typeof data !== 'object') return;
    const personal = data.personal || {};
    const colors = data.colors || {};

    const setValue = (id, value) => {
        const input = document.getElementById(id);
        if (input) {
            input.value = value || '';
            input.dispatchEvent(new Event('input'));
        }
    };

    setValue('name', personal.name);
    setValue('job-title', personal.jobTitle);
    setValue('phone', personal.phone);
    setValue('email', personal.email);
    setValue('address', personal.address);
    setValue('summary', personal.summary);
    updatePhotoPreview(personal.photo || DEFAULT_PHOTO_URL);

    if (colors.accent) {
        applyResumeColor('--resume-accent', colors.accent);
        setColorInputValue('accent-color', colors.accent);
    }
    if (colors.secondary) {
        applyResumeColor('--resume-secondary', colors.secondary);
        setColorInputValue('secondary-color', colors.secondary);
    }
    if (colors.leftBg) {
        applyResumeColor('--resume-left-bg', colors.leftBg);
        setColorInputValue('left-bg-color', colors.leftBg);
    }
    if (colors.rightBg) {
        applyResumeColor('--resume-right-bg', colors.rightBg);
        setColorInputValue('right-bg-color', colors.rightBg);
    }
    if (colors.text) {
        applyResumeColor('--resume-text', colors.text);
        setColorInputValue('text-color', colors.text);
    }
    if (colors.muted) {
        applyResumeColor('--resume-muted', colors.muted);
        setColorInputValue('muted-color', colors.muted);
    }

    clearList('skills');
    (data.skills || []).forEach(value => addListItem('skills', value));

    clearList('languages');
    (data.languages || []).forEach(value => addListItem('languages', value));

    clearList('interests');
    (data.interests || []).forEach(item => addInterestItem(item.text || '', item.isProject));

    clearComplex('work');
    (data.work || []).forEach(item => addComplexItem('work', item));

    clearComplex('education');
    (data.education || []).forEach(item => addComplexItem('education', item));
}

function scheduleResumeSave() {
    if (!resumeAutoSaveEnabled) return;
    clearTimeout(resumeSaveTimeout);
    resumeSaveTimeout = setTimeout(() => {
        const data = getResumeData();
        try {
            localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.warn('Unable to save resume data.', error);
        }
    }, 300);
}

function loadResumeFromStorage() {
    try {
        const stored = localStorage.getItem(RESUME_STORAGE_KEY);
        if (!stored) return null;
        return JSON.parse(stored);
    } catch (error) {
        console.warn('Unable to load resume data.', error);
        return null;
    }
}

function exportResumeJson() {
    const data = getResumeData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resume.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function handleResumeJsonImport(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            applyResumeData(data);
            scheduleResumeSave();
        } catch (error) {
            console.warn('Unable to parse resume JSON.', error);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function ensureResumeStyles() {
    // Resume and print styles are bundled by Vite from src/core/styles.
}

function initResumePage() {
    ensureResumeStyles();
    setupResumeLanguage();
    ensureMarkedLoaded().then(() => {
        setupResumeControls();
        setupRealtimeUpdates();
        const editMode = setupMode();
        document.fonts.ready.then(() => {
            initialize();
            if (editMode) {
                const saved = loadResumeFromStorage();
                if (saved) {
                    applyResumeData(saved);
                }
            }
            const preview = document.getElementById('resume-preview');
            if (preview) {
                const styles = getComputedStyle(preview);
                setColorInputValue('accent-color', styles.getPropertyValue('--resume-accent'));
                setColorInputValue('secondary-color', styles.getPropertyValue('--resume-secondary'));
                setColorInputValue('left-bg-color', styles.getPropertyValue('--resume-left-bg'));
                setColorInputValue('right-bg-color', styles.getPropertyValue('--resume-right-bg'));
                setColorInputValue('text-color', styles.getPropertyValue('--resume-text'));
                setColorInputValue('muted-color', styles.getPropertyValue('--resume-muted'));
            }
        });
    });
}

if (typeof globalThis !== 'undefined') {
    Object.assign(globalThis, { initResumePage });
}
