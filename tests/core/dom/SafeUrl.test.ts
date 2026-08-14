import { safeHttpUrl, safeHttpUrlOr } from '../../../src/core/dom/SafeUrl';

describe('safeHttpUrl', () => {
  test('accepts absolute http and https URLs', () => {
    expect(safeHttpUrl('https://example.com/a')).toBe('https://example.com/a');
    expect(safeHttpUrl('http://example.com/b')).toBe('http://example.com/b');
  });

  test('resolves relative paths against the document', () => {
    expect(safeHttpUrl('images/placeholder.png'))
      .toBe(new URL('images/placeholder.png', window.location.href).href);
  });

  test('rejects executable and embedded schemes', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('data:text/html;base64,PHNjcmlwdD4=')).toBeNull();
    expect(safeHttpUrl('vbscript:msgbox(1)')).toBeNull();
  });

  test('rejects empty and unparseable values', () => {
    expect(safeHttpUrl('')).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
    expect(safeHttpUrl(undefined)).toBeNull();
    expect(safeHttpUrl('http://[')).toBeNull();
  });

  test('safeHttpUrlOr substitutes the fallback for rejected values', () => {
    expect(safeHttpUrlOr('javascript:alert(1)', '#')).toBe('#');
    expect(safeHttpUrlOr(undefined, 'images/placeholder.png')).toBe('images/placeholder.png');
    expect(safeHttpUrlOr('https://example.com/c', '#')).toBe('https://example.com/c');
  });
});
