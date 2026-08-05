export const FAQ_DATA_URL = 'data/faqs.json';

export interface FaqItem {
  id: string;
  question: string;
  iconSymbol: string;
  featured: boolean;
  answerHtml: string;
  homeAnswerHtml: string;
}

let faqItemsCache: FaqItem[] | null = null;
let faqDataPromise: Promise<FaqItem[]> | null = null;

export function normalizeFaqItem(item: unknown, index: number): FaqItem | null {
  if (!item || typeof item !== 'object') return null;
  const source = item as Record<string, unknown>;
  const question = typeof source.question === 'string' ? source.question.trim() : '';
  const answerHtml = typeof source.answerHtml === 'string' ? source.answerHtml.trim() : '';
  if (!question || !answerHtml) return null;

  const providedId = typeof source.id === 'string' ? source.id.trim() : '';
  const generatedId = question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return {
    id: providedId || (generatedId ? `faq-${generatedId}` : `faq-item-${index}`),
    question,
    iconSymbol: typeof source.iconSymbol === 'string' && source.iconSymbol.trim()
      ? source.iconSymbol.trim()
      : 'help',
    featured: Boolean(source.featured),
    answerHtml,
    homeAnswerHtml: typeof source.homeAnswerHtml === 'string'
      ? source.homeAnswerHtml.trim()
      : '',
  };
}

export function loadFaqData(): Promise<FaqItem[]> {
  if (faqItemsCache) return Promise.resolve(faqItemsCache);
  if (faqDataPromise) return faqDataPromise;

  faqDataPromise = fetch(FAQ_DATA_URL)
    .then(async (response) => {
      if (!response.ok) throw new Error(`FAQ request failed with status ${response.status}.`);
      const data = await response.json() as unknown;
      if (!Array.isArray(data)) throw new Error('FAQ data must be an array.');

      const items = data
        .map(normalizeFaqItem)
        .filter((item): item is FaqItem => item !== null);
      if (!items.length) throw new Error('FAQ data does not contain valid entries.');
      faqItemsCache = items;
      return items;
    })
    .catch((error: unknown) => {
      faqDataPromise = null;
      throw error;
    });

  return faqDataPromise;
}
