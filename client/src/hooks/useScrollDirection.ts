import { useState, useEffect } from 'react';

type ScrollDirection = 'up' | 'down' | 'none';

interface UseScrollDirectionOptions {
  threshold?: number;
}

export function useScrollDirection({ threshold = 10 }: UseScrollDirectionOptions = {}): {
  direction: ScrollDirection;
  scrollY: number;
  isAtTop: boolean;
} {
  const [scrollY, setScrollY] = useState(0);
  const [direction, setDirection] = useState<ScrollDirection>('none');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrollY(currentScrollY);

          if (Math.abs(currentScrollY - lastScrollY) >= threshold) {
            setDirection(currentScrollY > lastScrollY ? 'down' : 'up');
            setLastScrollY(currentScrollY);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, threshold]);

  return {
    direction,
    scrollY,
    isAtTop: scrollY <= 0,
  };
}
