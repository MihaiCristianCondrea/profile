// Resume builder functionality
// Real-time updates for form inputs
function setupRealtimeUpdates() {
    const set = (id, cb) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', cb);
    };
    set('name', e => document.getElementById('resume-name').innerText = e.target.value);
    set('job-title', e => document.getElementById('resume-job-title').innerText = e.target.value);
    set('phone', e => document.getElementById('resume-phone').innerHTML = e.target.value ? `<span class="material-symbols-outlined">call</span><span>${e.target.value}</span>` : '');
    set('email', e => document.getElementById('resume-email').innerHTML = e.target.value ? `<span class="material-symbols-outlined">mail</span><span>${e.target.value}</span>` : '');
    set('address', e => document.getElementById('resume-address').innerHTML = e.target.value ? `<span class="material-symbols-outlined">location_on</span><span>${e.target.value}</span>` : '');
    set('summary', e => document.getElementById('resume-summary').innerHTML = marked.parse(e.target.value));
    const photoInput = document.getElementById('photo');
    if (photoInput) {
        photoInput.addEventListener('change', evt => {
            if (evt.target.files && evt.target.files[0]) {
                const reader = new FileReader();
                reader.onload = e => document.getElementById('photo-preview').style.backgroundImage = `url(${e.target.result})`;
                reader.readAsDataURL(evt.target.files[0]);
            }
        });
    }
}

function addListItem(sectionId, value = '') {
    const container = document.getElementById(`${sectionId}-form`);
    if (!container) return;
    const capitalName = sectionId.charAt(0).toUpperCase() + sectionId.slice(1, -1);
    const itemId = `${sectionId}-${Date.now()}`;
    const div = document.createElement('div');
    div.className = 'list-item';
    div.id = itemId;
    div.innerHTML = `<div class="input-group" style="flex-grow:1;margin-bottom:0;"><input type="text" oninput="updateList('${sectionId}')" value="${value}" placeholder=" " id="input-${itemId}"><label for="input-${itemId}">${capitalName}</label></div><button type="button" class="remove-btn" onclick="removeListItem('${itemId}','${sectionId}')">×</button>`;
    container.insertBefore(div, container.querySelector('.add-btn'));
    updateList(sectionId);
}

function addInterestItem(value = '', isProject = false) {
    const container = document.getElementById('interests-form');
    const itemId = `interests-${Date.now()}`;
    const div = document.createElement('div');
    div.className = 'list-item';
    div.id = itemId;
    div.innerHTML = `<div class="input-group" style="flex-grow:1;margin-bottom:0;"><input type="text" oninput="updateList('interests')" value="${value}" placeholder=" " id="input-${itemId}"><label for="input-${itemId}">Interest or Project</label></div><input type="checkbox" id="check-${itemId}" onchange="updateList('interests')" ${isProject ? 'checked' : ''} style="margin-left:8px;"><label for="check-${itemId}" style="position:static;font-size:14px;pointer-events:auto;">Is Project?</label><button type="button" class="remove-btn" onclick="removeListItem('${itemId}','interests')">×</button>`;
    container.insertBefore(div, container.querySelector('.add-btn'));
    updateList('interests');
}

function removeListItem(itemId, sectionId) {
    document.getElementById(itemId).remove();
    updateList(sectionId);
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
                li.innerHTML = checkbox.checked ? `<strong>Project:</strong> ${input.value}` : input.value;
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
}

function addComplexItem(sectionId, data = {}) {
    const container = document.getElementById(`${sectionId}-form`);
    const itemId = `${sectionId}-${Date.now()}`;
    const div = document.createElement('div');
    div.className = 'complex-item-form';
    div.id = itemId;
    if (sectionId === 'work') {
        div.innerHTML = `<div><div class="input-group"><input type="text" class="work-title" oninput="updateComplexList('work')" value="${data.title||''}" placeholder=" "><label>Job Title</label></div><div class="input-group"><input type="text" class="work-company" oninput="updateComplexList('work')" value="${data.company||''}" placeholder=" "><label>Company & Location</label></div><div class="input-group"><input type="text" class="work-start" oninput="updateComplexList('work')" value="${data.start||''}" placeholder=" "><label>Start Year</label></div><div class="input-group"><input type="text" class="work-end" oninput="updateComplexList('work')" value="${data.end||''}" placeholder=" "><label>End Year</label></div><div class="input-group"><textarea class="work-desc" oninput="updateComplexList('work')" placeholder=" ">${data.desc||''}</textarea><label>Description (Markdown supported)</label></div><button type="button" class="remove-btn" onclick="removeItem('${itemId}','work')" style="align-self:flex-end;">×</button></div>`;
    } else if (sectionId === 'education') {
        div.innerHTML = `<div><div class="input-group"><input type="text" class="edu-degree" oninput="updateComplexList('education')" value="${data.degree||''}" placeholder=" "><label>Degree / Certificate</label></div><div class="input-group"><input type="text" class="edu-school" oninput="updateComplexList('education')" value="${data.school||''}" placeholder=" "><label>School / University</label></div><div class="input-group"><input type="text" class="edu-start" oninput="updateComplexList('education')" value="${data.start||''}" placeholder=" "><label>Start Year</label></div><div class="input-group"><input type="text" class="edu-end" oninput="updateComplexList('education')" value="${data.end||''}" placeholder=" "><label>End Year</label></div><button type="button" class="remove-btn" onclick="removeItem('${itemId}','education')" style="align-self:flex-end;">×</button></div>`;
    }
    container.insertBefore(div, container.querySelector('.add-btn'));
    updateComplexList(sectionId);
}

const addWorkItem = (t,c,s,e,d) => addComplexItem('work',{title:t,company:c,start:s,end:e,desc:d});
const addEducationItem = (d,s,st,e) => addComplexItem('education',{degree:d,school:s,start:st,end:e});

function removeItem(itemId, sectionId) {
    document.getElementById(itemId).remove();
    updateComplexList(sectionId);
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
                div.innerHTML = `<div class="resume-item-header"><h3>${data.title}</h3><span class="date">${data.start} - ${data.end || 'Current'}</span></div><p><strong>${data.company}</strong></p><div class="description">${marked.parse(data.desc)}</div>`;
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
                div.innerHTML = `<div class="resume-item-header"><h3>${data.degree}</h3><span class="date">${data.start} - ${data.end || 'Current'}</span></div><p><strong>${data.school}</strong></p>`;
                container.appendChild(div);
            }
        }
    });
}


function initialize() {
    document.getElementById('name').value = 'Mihai-Cristian Condrea';
    document.getElementById('job-title').value = 'Android Developer';
    document.getElementById('phone').value = '+40751029091';
    document.getElementById('email').value = 'condreamihaicristian10@gmail.com';
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
    document.getElementById('photo-preview').style.backgroundImage = "url('assets/images/cv_profile_pic.png')";
}

function setupMode() {
    const params = new URLSearchParams(window.location.search);
    const editMode = params.get('edit') === 'true';
    const form = document.querySelector('#resumePage .form-container');
    if (!editMode && form) form.style.display = 'none';
}

function prepareAndPrintResume() {
    const cvElement = document.getElementById('resume-preview');
    if (!cvElement) {
        window.print();
        return;
    }

    const originalTransform = cvElement.style.transform;
    const originalOrigin = cvElement.style.transformOrigin;

    const contentHeight = cvElement.scrollHeight;
    const targetHeight = 1080; // approximate printable height of an A4 page

    if (contentHeight > targetHeight) {
        const scale = targetHeight / contentHeight;
        cvElement.style.transformOrigin = 'top left';
        cvElement.style.transform = `scale(${scale})`;
    } else {
        cvElement.style.transform = '';
    }

    window.onafterprint = () => {
        cvElement.style.transform = originalTransform;
        cvElement.style.transformOrigin = originalOrigin;
        window.onafterprint = null;
    };

    window.print();
}


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

function ensureResumeStyles() {
    const head = document.head;
    if (!document.querySelector('link[href="assets/css/resume.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'assets/css/resume.css';
        head.appendChild(link);
    }
    if (!document.querySelector('link[href="assets/css/print.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'assets/css/print.css';
        link.media = 'print';
        head.appendChild(link);
    }
}

function initResumePage() {
    ensureResumeStyles();
    ensureMarkedLoaded().then(() => {
        setupRealtimeUpdates();
        setupMode();
        document.fonts.ready.then(initialize);
    });
}
