// CV builder functionality
// Real-time updates for form inputs
function setupRealtimeUpdates() {
    const set = (id, cb) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', cb);
    };
    set('name', e => document.getElementById('cv-name').innerText = e.target.value);
    set('job-title', e => document.getElementById('cv-job-title').innerText = e.target.value);
    set('phone', e => document.getElementById('cv-phone').innerHTML = e.target.value ? `<span class="material-symbols-outlined">call</span><span>${e.target.value}</span>` : '');
    set('email', e => document.getElementById('cv-email').innerHTML = e.target.value ? `<span class="material-symbols-outlined">mail</span><span>${e.target.value}</span>` : '');
    set('address', e => document.getElementById('cv-address').innerHTML = e.target.value ? `<span class="material-symbols-outlined">location_on</span><span>${e.target.value}</span>` : '');
    set('summary', e => document.getElementById('cv-summary').innerHTML = marked.parse(e.target.value));
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
    const listElement = document.querySelector(`#cv-${sectionId} ul`);
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
    const container = document.getElementById(`cv-${sectionId}`);
    const h2 = container.querySelector('h2');
    container.innerHTML = '';
    container.appendChild(h2);
    document.querySelectorAll(`.complex-item-form[id^="${sectionId}-"]`).forEach(item => {
        const div = document.createElement('div');
        div.className = 'cv-item';
        if (sectionId === 'work') {
            const data = {
                title: item.querySelector('.work-title').value,
                company: item.querySelector('.work-company').value,
                start: item.querySelector('.work-start').value,
                end: item.querySelector('.work-end').value,
                desc: item.querySelector('.work-desc').value.trim()
            };
            if (data.title || data.company) {
                div.innerHTML = `<div class="cv-item-header"><h3>${data.title}</h3><span class="date">${data.start} - ${data.end || 'Current'}</span></div><p><strong>${data.company}</strong></p><div class="description">${marked.parse(data.desc)}</div>`;
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
                div.innerHTML = `<div class="cv-item-header"><h3>${data.degree}</h3><span class="date">${data.start} - ${data.end || 'Current'}</span></div><p><strong>${data.school}</strong></p>`;
                container.appendChild(div);
            }
        }
    });
}

function initPdfDownload() {
    const btn = document.getElementById('download-cv');
    if (btn) {
        btn.addEventListener('click', () => {
            const cvElement = document.getElementById('cv-preview');
            const opt = { margin:0, filename:'Mihai-Condrea-CV.pdf', image:{type:'jpeg',quality:1.0}, html2canvas:{scale:4,useCORS:true,dpi:300,letterRendering:true}, jsPDF:{unit:'px',format:'a4',orientation:'portrait'} };
            html2pdf().from(cvElement).set(opt).save();
        });
    }
}

function initialize() {
    document.getElementById('name').value = 'Mihai-Cristian Condrea';
    document.getElementById('job-title').value = 'Android Developer';
    document.getElementById('phone').value = '+40751029091';
    document.getElementById('email').value = 'condreamihaicristian10@gmail.com';
    document.getElementById('address').value = 'Bucharest, Romania';
    document.getElementById('summary').value = `Passionate and Android Developer with extensive experience in the entire app lifecycle, from ideation and UI/UX design to publishing on Google Play. I use modern technologies like Jetpack Compose, Kotlin, and Firebase. I am also an independent music producer, a background that fuels a creative approach to problem-solving and a keen eye for user experience.`;
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
    addComplexItem('work',{title:'Android Developer',company:'Digi Romania | R.C.S. & R.D.S, Bucharest',start:'2024',end:'Current',desc:`- Engineered Android applications for live TV and video streaming platforms.\n- Built bespoke Android applications for promotional campaigns and internal operational use.\n- Orchestrated full lifecycle management of the Google Play Console for Digi Romania, Digi Spain, and Digi Portugal.`});
    addComplexItem('work',{title:'Android Developer',company:'Personal Projects, Bucharest',start:'2020',end:'Current',desc:`- Successfully launched over 10 Android applications, overseeing the entire product lifecycle from UI/UX design and development to publishing.\n- Championed a Google-centric design philosophy, meticulously applying Material Design principles to deliver intuitive and visually consistent applications.`});
    addComplexItem('education',{degree:'Industrial Engineering & Robotics',school:'Polytechnic University of Bucharest',start:'2020',end:'Current'});
    addComplexItem('education',{degree:'High School Diploma, Mathematics-Informatics',school:'"Hristo Botev" Theoretical High School, Bucharest',start:'2016',end:'2020'});
    document.getElementById('photo-preview').style.backgroundImage = "url('../../assets/images/cv_profile_pic.png')";
}

function setupMode() {
    const params = new URLSearchParams(window.location.search);
    const editMode = params.get('edit') === 'true';
    const form = document.querySelector('#cvPage .form-container');
    if (!editMode && form) form.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    setupRealtimeUpdates();
    initPdfDownload();
    setupMode();
    initTheme();
    initNavigationDrawer();
    setCopyrightYear();
    document.fonts.ready.then(initialize);
});