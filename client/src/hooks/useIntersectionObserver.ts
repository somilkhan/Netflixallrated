import { useEffect, useState, type RefObject } from 'react';

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

export function useIntersectionObserver(
  ref: RefObject<Element>,
  options: UseIntersectionObserverOptions = {},
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const { triggerOnce = false, root, rootMargin, threshold } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setIsIntersecting(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      const intersecting = entry?.isIntersecting ?? false;
      if (intersecting) {
        setIsIntersecting(true);
        if (triggerOnce) {
          observer.disconnect();
        }
      } else {
        if (!triggerOnce) {
          setIsIntersecting(false);
        }
      }
    }, {
      root,
      rootMargin: rootMargin ?? '240px',
      threshold,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, triggerOnce, root, rootMargin, threshold]);

  return isIntersecting;
}
