import { useEffect, useState, type RefObject } from 'react';

export interface UseHasIntersectedOptions extends IntersectionObserverInit {
  /**
   * If true, disconnects the IntersectionObserver immediately after the first intersection.
   * Useful for static lazy loads (e.g., content rows or images) to completely eliminate DOM observation overhead.
   * Defaults to true to maintain backward compatibility and preserve "has intersected" semantics.
   * If false, resets state to false when the element goes out of view, preventing infinite scroll eager load loops.
   */
  triggerOnce?: boolean;
}

export function useHasIntersected(
  ref: RefObject<Element>,
  options: UseHasIntersectedOptions = {},
) {
  const [hasIntersected, setHasIntersected] = useState(false);

  // Destructure options to prevent recreating the observer on every render (due to object reference changes).
  // triggerOnce defaults to true for backward compatibility and performance.
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
          observer.disconnect(); // Save CPU cycles by disconnecting immediately when the asset is visible
        }
      } else if (!triggerOnce) {
        // Essential for infinite scroll sentinels so they can re-trigger on subsequent scrolls
        setHasIntersected(false);
      }
    }, { root, rootMargin, threshold });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, root, rootMargin, threshold, triggerOnce]);

  return hasIntersected;
}
