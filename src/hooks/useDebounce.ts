import { useState, useEffect } from 'react'

/**
 * Debounces a value by the given delay (default 300 ms).
 * Returns the debounced value — only updates after the caller stops
 * changing `value` for `delay` milliseconds.
 *
 * @example
 * const debouncedQuery = useDebounce(searchQuery, 400)
 * useEffect(() => { fetchResults(debouncedQuery) }, [debouncedQuery])
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
