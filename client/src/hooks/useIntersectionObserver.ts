import { useEffect, useState, type RefObject } from 'react';

export interface UseHasIntersectedOptions extends IntersectionObserverInit {
  /**
   * If true, stops observing the element immediately upon first intersection.
   * This is ideal for static assets (like LazyImage and Home Rows) as it reduces DOM observation overhead.
   * If false, resets the state to false when out of view (essential for infinite scroll sentinels to avoid continuous eager loading).
   * @default true
   */
  triggerOnce?: boolean;
}

/**
 * useHasIntersected — A performance-optimized hook for element visibility tracking.
 *
 * Performance Features:
 * 1. Supports `triggerOnce?: boolean` option to disconnect immediately on first intersection,
 *    reducing overall DOM observation overhead (crucial for long feeds with many lazy images).
 * 2. Properly tracks out-of-view states when `triggerOnce` is false, resetting `hasIntersected` to false,
 *    which prevents infinite scroll sentinels from causing infinite / continuous eager loading loops.
 */
export function useHasIntersected(
  ref: RefObject<Element | null>,
  options: UseHasIntersectedOptions = {},
) {
  const [hasIntersected, setHasIntersected] = useState(false);
  const { triggerOnce = true, root, rootMargin = '240px', threshold } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setHasIntersected(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setHasIntersected(true);
        if (triggerOnce) {
          // Immediately unobserve on first intersection to free up main thread layout/scroll costs.
          observer.unobserve(element);
        }
      } else {
        if (!triggerOnce) {
          // Reset to false when out of view, ensuring proper state cycle for infinite scrolls.
          setHasIntersected(false);
        }
      }
    }, { root, rootMargin, threshold });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, triggerOnce, root, rootMargin, threshold]);

  return hasIntersected;
}
