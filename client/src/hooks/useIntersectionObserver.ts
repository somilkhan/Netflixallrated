import { useEffect, useState, type RefObject } from 'react';

export interface UseHasIntersectedOptions extends IntersectionObserverInit {
  /**
   * If true, disconnects the observer immediately once the element intersects.
   * This reduces DOM observation overhead for static assets (like LazyImage and ContentRow).
   * @default true
   */
  triggerOnce?: boolean;
}

/**
 * Custom hook to detect if an element has intersected the viewport.
 * Performance-optimized: Defaults to triggerOnce: true to disconnect
 * the IntersectionObserver immediately on first intersection, freeing up CPU/GPU.
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
  }, [
    ref,
    triggerOnce,
    observerOptions.root,
    observerOptions.rootMargin,
    observerOptions.threshold,
  ]);

  return hasIntersected;
}
