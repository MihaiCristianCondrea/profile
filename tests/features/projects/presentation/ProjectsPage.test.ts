import {initProjectsPage} from '../../../../src/features/projects/presentation/ProjectsPage';

describe('Material Next project composition', () => {
  afterEach(() => {document.body.innerHTML = '';});
  test('filters the web project and shared app showcase with the expressive tabs', async () => {
    document.body.innerHTML = '<div id="projectsPageContainer"><mnw-expressive-tab-bar id="projectsFilterTabs"></mnw-expressive-tab-bar><div data-category="web"></div><mnw-app-showcase data-category="android"></mnw-app-showcase></div>';
    const tabs = document.getElementById('projectsFilterTabs') as HTMLElement & {activeIndex: number; tabs: Array<{label: string}>};
    tabs.activeIndex = 0;
    await initProjectsPage();
    expect(tabs.tabs.map(tab => tab.label)).toEqual(['All', 'Web', 'Android']);
    tabs.activeIndex = 2;
    tabs.dispatchEvent(new Event('change'));
    expect(document.querySelector<HTMLElement>('[data-category="web"]')?.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('mnw-app-showcase')?.hidden).toBe(false);
    const navigate = new Event('navigate', {cancelable: true});
    tabs.dispatchEvent(navigate);
    expect(navigate.defaultPrevented).toBe(true);
    tabs.activeIndex = 0; tabs.dispatchEvent(new Event('change'));
    expect(document.querySelector<HTMLElement>('[data-category="web"]')?.hidden).toBe(false);
  });
});
