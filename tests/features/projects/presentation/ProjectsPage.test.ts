import { initProjectsPage } from '../../../../src/features/projects/presentation/ProjectsPage';

describe('ProjectsPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: { apps: [] } }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('filters cards and changes carousel slides without custom animation', async () => {
    document.body.innerHTML = `
      <div id="projectsPageContainer">
        <div id="projectsFilterTabs">
          <md-primary-tab data-category="all" active>All</md-primary-tab>
          <md-primary-tab data-category="web">Web</md-primary-tab>
          <md-primary-tab data-category="android">Android</md-primary-tab>
        </div>
        <div class="project-entry" id="web-project" data-category="web">
          <div class="carousel">
            <div class="carousel-slide active" id="slide-one"></div>
            <div class="carousel-slide" id="slide-two"></div>
            <button class="prev">Previous</button>
            <button class="next">Next</button>
          </div>
        </div>
        <div class="project-entry" id="android-project" data-category="android"></div>
        <div id="androidProjectsContainer"></div>
      </div>
    `;

    await initProjectsPage();

    const dots = document.querySelectorAll('.carousel-dot');
    expect(dots).toHaveLength(2);
    (document.querySelector('.carousel .next') as HTMLElement).click();
    expect(document.getElementById('slide-one')?.classList.contains('active')).toBe(false);
    expect(document.getElementById('slide-two')?.classList.contains('active')).toBe(true);

    const tabs = document.getElementById('projectsFilterTabs') as HTMLElement;
    document.querySelectorAll('#projectsFilterTabs md-primary-tab').forEach((tab) => {
      tab.toggleAttribute(
        'active',
        (tab as HTMLElement).dataset.category === 'web',
      );
    });
    tabs.dispatchEvent(new Event('change'));
    expect((document.getElementById('web-project') as HTMLElement).hidden).toBe(false);
    expect((document.getElementById('android-project') as HTMLElement).hidden).toBe(true);
    expect(document.querySelector('[data-category="web"]')?.hasAttribute('active')).toBe(true);
  });

  test('renders remote Android apps with safe URLs and direct Material links', async () => {
    document.body.innerHTML = `
      <div id="projectsPageContainer">
        <div id="projectsFilterTabs">
          <md-primary-tab data-category="all" active>All</md-primary-tab>
        </div>
        <div id="androidProjectsContainer"></div>
      </div>
    `;
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: {
          apps: [{
            name: 'Cleaner',
            iconLogo: 'javascript:alert(1)',
            packageName: 'com.example.cleaner',
            description: 'Storage utility',
            screenshots: [
              'javascript:alert(2)',
              'https://example.com/screenshot.png',
            ],
          }],
        },
      }),
    });

    await initProjectsPage();

    const container = document.getElementById('androidProjectsContainer') as HTMLElement;
    expect(container.querySelectorAll('.project-entry')).toHaveLength(1);
    expect(container.querySelector('.project-app-icon')).toBeNull();
    expect(container.querySelectorAll('.carousel-slide')).toHaveLength(1);
    const installButton = container.querySelector('md-outlined-button');
    expect(installButton?.getAttribute('href')).toBe(
      'https://play.google.com/store/apps/details?id=com.example.cleaner',
    );
    expect(installButton?.closest('a')).toBeNull();
  });
});
