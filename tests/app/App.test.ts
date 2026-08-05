import { buildRouterOptions } from '../../src/app/App';
import * as BlogPosts from '../../src/features/blog/presentation/BlogPosts';
import * as FaqPage from '../../src/features/faq/presentation/FaqPage';
import * as Committers from '../../src/features/resume/presentation/CommittersRanking';
import * as Songs from '../../src/features/songs/presentation/SongsPage';
import * as Resume from '../../src/features/resume/presentation/ResumePage';
import * as Contact from '../../src/features/profile/presentation/ContactPage';
import * as SmartCleaner from '../../src/features/apps/smart-cleaner/presentation/SmartCleanerPage';

describe('application router options', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  test('loads only the home features whose presentation targets are present', () => {
    document.body.innerHTML = `
      <div id="newsGrid"></div>
      <div id="committers-rank"></div>
      <div id="homeFaqList"></div>
    `;
    const blogSpy = jest.spyOn(BlogPosts, 'fetchBlogPosts').mockResolvedValue(undefined);
    const committersSpy = jest
      .spyOn(Committers, 'fetchCommittersRanking')
      .mockResolvedValue(undefined);
    const faqSpy = jest
      .spyOn(FaqPage, 'renderHomeFaqSection')
      .mockResolvedValue(undefined);

    buildRouterOptions().onHomeLoad?.();

    expect(blogSpy).toHaveBeenCalledTimes(1);
    expect(committersSpy).toHaveBeenCalledTimes(1);
    expect(faqSpy).toHaveBeenCalledTimes(1);
  });

  test('provides explicit handlers for every interactive feature route', () => {
    const songsSpy = jest.spyOn(Songs, 'loadSongs').mockResolvedValue(undefined);
    const options = buildRouterOptions();

    options.pageHandlers?.songs();

    expect(songsSpy).toHaveBeenCalledTimes(1);
    expect(options.pageHandlers?.resume).toBe(Resume.initResumePage);
    expect(options.pageHandlers?.contact).toBe(Contact.initContactPage);
    expect(options.pageHandlers?.['smart-cleaner-for-android'])
      .toBe(SmartCleaner.initSmartCleanerPage);
  });
});
