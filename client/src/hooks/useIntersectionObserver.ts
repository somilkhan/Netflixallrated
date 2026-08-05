import { useEffect, useState, type RefObject } from 'react';

export interface UseHasIntersectedOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

/**
 * Custom hook to detect when an element intersects the viewport.
 * Supports `triggerOnce` (default: true) to immediately disconnect the observer
 * upon the first intersection, avoiding continuous observation/layout recalculation.
 * Setting `triggerOnce` to false will reset the state when the element leaves the view,
 * which is essential for infinite scroll sentinels.
 */
export function useHasIntersected(
  ref: RefObject<Element>,
  options: UseHasIntersectedOptions = {},
) {
  const { triggerOnce = true, ...observerOptions } = options;
  const [hasIntersected, setHasIntersected] = useState(false);

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
          observer.disconnect();
        }
      } else if (!triggerOnce) {
        setHasIntersected(false);
      }
    }, { rootMargin: '240px', ...observerOptions });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, triggerOnce, observerOptions.root, observerOptions.rootMargin, observerOptions.threshold]);

  return hasIntersected;
}