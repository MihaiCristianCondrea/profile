import {
  applyGroupedFaqPositions,
  renderFaqList,
} from '../../../../src/features/faq/presentation/FaqPage';
import type { FaqItem } from '../../../../src/features/faq/data/FaqDataSource';

function faq(id: string): FaqItem {
  return {
    id,
    question: `Question ${id}`,
    iconSymbol: 'help',
    featured: true,
    answerHtml: `<p>Answer ${id}</p>`,
    homeAnswerHtml: '',
  };
}

describe('grouped FAQ positions', () => {
  test('assigns first, middle, and last positions', () => {
    const container = document.createElement('div');
    const rendered = renderFaqList(
      container,
      [faq('one'), faq('two'), faq('three'), faq('four')],
      'page',
    );

    expect(rendered.map(({ element }) => element.dataset.groupPosition)).toEqual([
      'first',
      'middle',
      'middle',
      'last',
    ]);
  });

  test('recomputes outer corners from the visible filtered items', () => {
    const container = document.createElement('div');
    const rendered = renderFaqList(
      container,
      [faq('one'), faq('two'), faq('three'), faq('four')],
      'page',
    );

    rendered[0].element.hidden = true;
    rendered[3].element.hidden = true;
    applyGroupedFaqPositions(rendered);

    expect(rendered[0].element.dataset.groupPosition).toBeUndefined();
    expect(rendered[1].element.dataset.groupPosition).toBe('first');
    expect(rendered[2].element.dataset.groupPosition).toBe('last');
    expect(rendered[3].element.dataset.groupPosition).toBeUndefined();
  });

  test('uses the fully rounded position for one visible FAQ', () => {
    const container = document.createElement('div');
    const rendered = renderFaqList(
      container,
      [faq('one'), faq('two')],
      'home',
    );

    rendered[1].element.hidden = true;
    applyGroupedFaqPositions(rendered);

    expect(rendered[0].element.dataset.groupPosition).toBe('single');
  });
});

describe('FAQ answer animation', () => {
  let animationFrames: FrameRequestCallback[];

  beforeEach(() => {
    animationFrames = [];
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function renderAnimatedFaq(context: 'home' | 'page' = 'home') {
    const host = document.createElement('div');
    const [{ element }] = renderFaqList(host, [faq('animated')], context);
    const summary = element.querySelector<HTMLButtonElement>('.faq-summary')!;
    const answer = element.querySelector<HTMLElement>('.faq-answer')!;
    Object.defineProperty(answer, 'scrollHeight', { configurable: true, value: 96 });
    return { element, summary, answer };
  }

  function runNextFrame(): void {
    animationFrames.shift()?.(0);
  }

  function finishHeightTransition(answer: HTMLElement): void {
    const event = new Event('transitionend', { bubbles: true }) as TransitionEvent;
    Object.defineProperty(event, 'propertyName', { value: 'height' });
    answer.dispatchEvent(event);
  }

  test.each(['home', 'page'] as const)('animates opening and closing in the %s context', (context) => {
    const { element, summary, answer } = renderAnimatedFaq(context);

    summary.click();
    expect(summary.getAttribute('aria-expanded')).toBe('true');
    expect(element.classList.contains('is-open')).toBe(true);
    expect(answer.hidden).toBe(false);
    runNextFrame();
    expect(answer.style.height).toBe('96px');
    finishHeightTransition(answer);
    expect(answer.style.height).toBe('auto');

    summary.click();
    expect(summary.getAttribute('aria-expanded')).toBe('false');
    expect(element.classList.contains('is-open')).toBe(false);
    expect(answer.hidden).toBe(false);
    runNextFrame();
    expect(answer.style.height).toBe('0px');
    finishHeightTransition(answer);
    expect(answer.hidden).toBe(true);
  });

  test('the close event collapses an expanded answer', () => {
    const { element, summary, answer } = renderAnimatedFaq();
    summary.click();
    runNextFrame();
    finishHeightTransition(answer);

    element.dispatchEvent(new Event('faq:close'));
    runNextFrame();
    finishHeightTransition(answer);

    expect(summary.getAttribute('aria-expanded')).toBe('false');
    expect(element.classList.contains('is-open')).toBe(false);
    expect(answer.hidden).toBe(true);
  });

  test('the close event leaves an already collapsed answer hidden', () => {
    const { element, answer } = renderAnimatedFaq();

    element.dispatchEvent(new Event('faq:close'));

    expect(answer.hidden).toBe(true);
    expect(animationFrames).toHaveLength(0);
  });

  test('a rapid second toggle supersedes the pending opening frame', () => {
    const { summary, answer } = renderAnimatedFaq();
    summary.click();
    summary.click();

    runNextFrame();
    runNextFrame();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
    expect(answer.style.height).toBe('0px');
    finishHeightTransition(answer);
    expect(answer.hidden).toBe(true);
  });
});
