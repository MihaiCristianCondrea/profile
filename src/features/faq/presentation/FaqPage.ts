import { loadFaqData, type FaqItem } from '../data/FaqDataSource.ts';

type FaqContext = 'home' | 'page';
type SearchField = HTMLElement & { value: string };
type FaqGroupPosition = 'single' | 'first' | 'middle' | 'last';

export interface RenderedFaqItem {
  data: FaqItem;
  element: HTMLElement;
}

function buildSearchText(item: FaqItem): string {
  const parser = document.createElement('div');
  parser.innerHTML = item.answerHtml;
  return `${item.question} ${parser.textContent ?? ''}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

function groupedPosition(index: number, size: number): FaqGroupPosition {
  if (size === 1) return 'single';
  if (index === 0) return 'first';
  if (index === size - 1) return 'last';
  return 'middle';
}

export function applyGroupedFaqPositions(renderedItems: RenderedFaqItem[]): void {
  const visibleItems = renderedItems.filter(({ element }) => !element.hidden);

  renderedItems.forEach(({ element }) => {
    delete element.dataset.groupPosition;
  });

  visibleItems.forEach(({ element }, index) => {
    element.dataset.groupPosition = groupedPosition(index, visibleItems.length);
  });
}

export function createFaqItem(item: FaqItem, context: FaqContext): HTMLElement {
  const container = document.createElement('md-filled-card');
  container.className = 'faq-item';
  container.dataset.faqId = item.id;
  container.dataset.searchText = buildSearchText(item);
  container.setAttribute('role', 'listitem');
  container.id = context === 'page' ? item.id : `${item.id}-home`;

  const summary = document.createElement('button');
  summary.className = 'faq-summary';
  summary.type = 'button';
  summary.id = `${container.id}-summary`;

  const icon = document.createElement('md-icon');
  icon.className = 'faq-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = item.iconSymbol;

  const question = document.createElement('span');
  question.className = 'faq-question';
  question.textContent = item.question;

  const expandIcon = document.createElement('md-icon');
  expandIcon.className = 'expand-icon';
  expandIcon.setAttribute('aria-hidden', 'true');
  expandIcon.textContent = 'expand_more';
  summary.append(icon, question, expandIcon);

  const answer = document.createElement('div');
  answer.className = 'faq-answer';
  answer.id = `${container.id}-answer`;
  answer.setAttribute('role', 'region');
  answer.setAttribute('aria-labelledby', summary.id);
  answer.hidden = true;

  const answerContent = document.createElement('div');
  answerContent.className = 'faq-answer-content';
  answerContent.innerHTML = context === 'home' && item.homeAnswerHtml
    ? item.homeAnswerHtml
    : item.answerHtml;
  answer.append(answerContent);

  summary.setAttribute('aria-controls', answer.id);
  summary.setAttribute('aria-expanded', 'false');
  summary.addEventListener('click', () => {
    const expanded = summary.getAttribute('aria-expanded') !== 'true';
    summary.setAttribute('aria-expanded', String(expanded));
    container.classList.toggle('is-open', expanded);
    answer.hidden = !expanded;
  });

  container.addEventListener('faq:close', () => {
    summary.setAttribute('aria-expanded', 'false');
    container.classList.remove('is-open');
    answer.hidden = true;
  });

  container.append(summary, answer);
  return container;
}

export function renderFaqList(
  container: HTMLElement,
  items: FaqItem[],
  context: FaqContext,
): RenderedFaqItem[] {
  const rendered = items.map((data) => ({ data, element: createFaqItem(data, context) }));
  container.replaceChildren(...rendered.map(({ element }) => element));
  applyGroupedFaqPositions(rendered);
  return rendered;
}

export async function renderHomeFaqSection(): Promise<void> {
  const container = document.getElementById('homeFaqList');
  if (!container) return;

  try {
    const items = (await loadFaqData()).filter((item) => item.featured);
    renderFaqList(container, items, 'home');
  } catch (error) {
    container.replaceChildren();
    console.error('FAQ: Failed to render home entries.', error);
  }
}

export async function initFaqPage(): Promise<void> {
  const container = document.getElementById('faqPageList');
  if (!container) return;

  try {
    const renderedItems = renderFaqList(container, await loadFaqData(), 'page');
    const emptyMessage = document.getElementById('faqEmptyMessage');
    const searchField = document.getElementById('faqSearchField') as SearchField | null;

    const updateVisibility = (): void => {
      const term = searchField?.value.trim().toLowerCase() ?? '';
      let visibleCount = 0;
      renderedItems.forEach(({ element }) => {
        const matches = !term || element.dataset.searchText?.includes(term) === true;
        element.hidden = !matches;
        if (matches) visibleCount += 1;
        else element.dispatchEvent(new Event('faq:close'));
      });
      applyGroupedFaqPositions(renderedItems);
      if (emptyMessage) emptyMessage.hidden = visibleCount > 0;
    };

    searchField?.addEventListener('input', updateVisibility);
    updateVisibility();
  } catch (error) {
    container.replaceChildren();
    console.error('FAQ: Failed to initialize the page.', error);
  }
}
