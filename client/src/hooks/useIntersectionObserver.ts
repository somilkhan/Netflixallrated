import { useEffect, useState, type RefObject } from 'react';

export interface UseHasIntersectedOptions extends IntersectionObserverInit {
  /**
   * If true (default), disconnects the observer immediately after the first intersection.
   * If false, does not disconnect and resets the intersection state to false when out of view.
   */
  triggerOnce?: boolean;
}

/**
 * Custom Intersection Observer hook with optimized observation footprint.
 * Default behavior (triggerOnce: true) stops observation immediately upon first intersection,
 * which significantly reduces active DOM listeners and layout overhead for static components.
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
      const isIntersecting = !!entry?.isIntersecting;
      if (isIntersecting) {
        setHasIntersected(true);
        if (triggerOnce) {
          // Optimization: Tear down the observer immediately to save memory and CPU cycles
          observer.disconnect();
        }
      } else {
        if (!triggerOnce) {
          // Reset the state so that scrolling back into view can trigger loading again
          setHasIntersected(false);
        }
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
