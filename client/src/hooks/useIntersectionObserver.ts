import { useEffect, useState, type RefObject } from 'react';

export function useIntersectionObserver(
  ref: RefObject<Element>,
  options: IntersectionObserverInit = {},
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setIsIntersecting(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setIsIntersecting(true);
    }, { rootMargin: '240px', ...options });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options.root, options.rootMargin, options.threshold]);

  return isIntersecting;
}