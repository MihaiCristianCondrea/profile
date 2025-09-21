const {
  createInputGroupElement,
  addListItem,
  addInterestItem,
  removeListItem,
  updateList,
  addComplexItem,
  removeItem,
  updateComplexList
} = require('../assets/js/pages/resume.js');

describe('pages/resume helpers', () => {
  beforeEach(() => {
    window.marked = {
      parse: jest.fn((text) => `<p>${text}</p>`)
    };
    window.DOMPurify = {
      sanitize: jest.fn((html) => `sanitized(${html})`)
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete window.marked;
    delete window.DOMPurify;
  });

  test('createInputGroupElement wires input handler and builds label relationship', () => {
    const onInput = jest.fn();
    const { wrapper, inputElement } = createInputGroupElement({
      id: 'test-input',
      labelText: 'Test Label',
      value: 'Initial',
      onInput
    });

    expect(wrapper.classList.contains('input-group')).toBe(true);
    const label = wrapper.querySelector('label');
    expect(label.getAttribute('for')).toBe('test-input');
    expect(label.textContent).toBe('Test Label');
    expect(inputElement.value).toBe('Initial');

    inputElement.dispatchEvent(new Event('input'));
    expect(onInput).toHaveBeenCalledTimes(1);
  });

  test('addListItem inserts a new list entry and updates the resume preview', () => {
    document.body.innerHTML = `
      <div id="skills-form"><button class="add-btn" type="button"></button></div>
      <div id="resume-skills"><h2>Skills</h2><ul></ul></div>
    `;

    addListItem('skills', 'Kotlin');

    const listItem = document.querySelector('#skills-form .list-item');
    expect(listItem).not.toBeNull();
    expect(document.querySelector('#resume-skills li').innerText).toBe('Kotlin');

    const input = listItem.querySelector('input');
    input.value = 'Compose';
    input.dispatchEvent(new Event('input'));
    updateList('skills');

    const previewItems = Array.from(document.querySelectorAll('#resume-skills li')).map(
      (li) => li.innerText
    );
    expect(previewItems).toContain('Compose');
  });

  test('addInterestItem supports project flag and updates preview list', () => {
    document.body.innerHTML = `
      <div id="interests-form"><button class="add-btn" type="button"></button></div>
      <div id="resume-interests"><h2>Interests</h2><ul></ul></div>
    `;

    addInterestItem('Music', true);

    const checkbox = document.querySelector('#interests-form input[type="checkbox"]');
    expect(checkbox).not.toBeNull();
    expect(document.querySelector('#resume-interests li').innerHTML).toContain(
      '<strong>Project:</strong> Music'
    );

    removeListItem(document.querySelector('#interests-form .list-item').id, 'interests');
    expect(document.querySelector('#resume-interests ul').children).toHaveLength(0);
  });

  test('addComplexItem and updateComplexList render work experience markup', () => {
    document.body.innerHTML = `
      <div id="work-form"><button class="add-btn" type="button"></button></div>
      <div id="resume-work"><h2>Work</h2></div>
    `;

    addComplexItem('work', {
      title: 'Engineer',
      company: 'Example Co',
      start: '2022',
      end: '2024',
      desc: 'Built things'
    });

    updateComplexList('work');

    expect(window.marked.parse).toHaveBeenCalledWith('Built things');
    expect(window.DOMPurify.sanitize).toHaveBeenCalled();

    const resumeItem = document.querySelector('#resume-work .resume-item');
    expect(resumeItem.innerHTML).toContain('Engineer');
    expect(resumeItem.innerHTML).toContain('Example Co');
    expect(resumeItem.innerHTML).toContain('2022 - 2024');

    const formItemId = document.querySelector('.complex-item-form').id;
    removeItem(formItemId, 'work');
    expect(document.querySelector('#resume-work .resume-item')).toBeNull();
  });
});
