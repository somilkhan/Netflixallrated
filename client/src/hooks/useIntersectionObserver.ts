import { useEffect, useState, type RefObject } from 'react';

export interface UseHasIntersectedOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

export function useHasIntersected(
  ref: RefObject<Element>,
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
          observer.disconnect();
        }
      } else {
        if (!triggerOnce) {
          setHasIntersected(false);
        }
      }
    }, { root, rootMargin, threshold });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, triggerOnce, root, rootMargin, threshold]);

  return hasIntersected;
}
