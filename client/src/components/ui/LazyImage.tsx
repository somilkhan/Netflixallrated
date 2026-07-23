import { useRef, useState } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  placeholder?: string;
}

export default function LazyImage({ src, alt, className = '', placeholder = '#171717', ...props }: LazyImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const visible = useIntersectionObserver(ref);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <span ref={ref} className={`relative block overflow-hidden ${className}`} style={{ background: placeholder }}>
      {!loaded && !failed && <span className="absolute inset-0 animate-[shimmer_1.8s_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)]" aria-hidden />}
      {visible && src && !failed && (
        <img
          {...props}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {failed && <span className="absolute inset-0 flex items-center justify-center text-xs text-white/25">Image unavailable</span>}
    </span>
  );
}