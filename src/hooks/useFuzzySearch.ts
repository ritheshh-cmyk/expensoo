import Fuse from 'fuse.js';
import { useMemo } from 'react';

/**
 * useFuzzySearch
 * A reusable hook that wraps Fuse.js for typo-tolerant, client-side fuzzy search.
 *
 * @param list       - The full array of items to search through
 * @param keys       - Object key paths to search within each item
 * @param query      - The current search query string
 * @param threshold  - Fuse.js threshold: 0 = exact, 1 = match anything (default 0.35)
 * @returns          - Filtered array of items matching the query
 */
export function useFuzzySearch<T>(
  list: T[],
  keys: (keyof T | string)[],
  query: string,
  threshold = 0.35
): T[] {
  const fuse = useMemo(
    () =>
      new Fuse(list, {
        keys: keys as string[],
        threshold,
        ignoreLocation: true,
        minMatchCharLength: 2,
        shouldSort: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list, threshold]
  );

  return useMemo(() => {
    const trimmed = query?.trim() ?? '';
    if (trimmed.length < 2) return list;
    return fuse.search(trimmed).map((r) => r.item);
  }, [fuse, list, query]);
}
