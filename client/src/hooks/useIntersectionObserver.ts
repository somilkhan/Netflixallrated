import { useEffect, useState, type RefObject } from 'react';

export function useHasIntersected(
  ref: RefObject<Element>,
  options: IntersectionObserverInit & { triggerOnce?: boolean } = {},
) {
  const [hasIntersected, setHasIntersected] = useState(false);
  const { triggerOnce = true, ...observerOptions } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setHasIntersected(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setHasIntersected(true);
        // Performance optimization: disconnect immediately on first intersection if triggerOnce is true
        if (triggerOnce) {
          observer.disconnect();
        }
      } else if (!triggerOnce) {
        // Reset state to false when element goes out of view (crucial for infinite scroll sentinels)
        setHasIntersected(false);
      }
    }, { rootMargin: '240px', ...observerOptions });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, triggerOnce, observerOptions.root, observerOptions.rootMargin, observerOptions.threshold]);

  return hasIntersected;
}