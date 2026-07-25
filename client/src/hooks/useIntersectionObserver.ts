import { useEffect, useState, type RefObject } from 'react';

export function useIntersectionObserver(
  ref: RefObject<Element>,
  options: IntersectionObserverInit = {},
) {
  return useHasIntersected(ref, options);
}

export function useHasIntersected(
  ref: RefObject<Element>,
  options: IntersectionObserverInit = {},
) {
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setHasIntersected(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setHasIntersected(true);
    }, { rootMargin: '240px', ...options });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options.root, options.rootMargin, options.threshold]);

  return hasIntersected;
}