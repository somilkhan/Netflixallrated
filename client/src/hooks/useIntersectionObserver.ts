import { useEffect, useState, type RefObject } from 'react';

export interface UseHasIntersectedOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

export function useHasIntersected(
  ref: RefObject<Element>,
  options: UseHasIntersectedOptions = {},
) {
  const { triggerOnce = true, ...initOptions } = options;
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
    }, { rootMargin: '240px', ...initOptions });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, triggerOnce, initOptions.root, initOptions.rootMargin, initOptions.threshold]);

  return hasIntersected;
}
