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
