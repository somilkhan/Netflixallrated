import { useEffect, useState, type RefObject } from 'react';

export function useHasIntersected(
  ref: RefObject<Element>,
  options: IntersectionObserverInit & { triggerOnce?: boolean } = {},
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
      const isIntersecting = !!entry?.isIntersecting;
      if (isIntersecting) {
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
