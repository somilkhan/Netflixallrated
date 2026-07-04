import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Movie } from "../types";
import PosterCard from "./PosterCard";
import TopTenCard from "./TopTenCard";

interface ContentRowProps {
  title: string;
  fetchUrl?: string;
  initialMovies?: Movie[];
  onOpenAuth: () => void;
  isTop10?: boolean;
  onViewAll?: () => void;
}

export default function ContentRow({ title, fetchUrl, initialMovies, onOpenAuth, isTop10, onViewAll }: ContentRowProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies || []);
  const [loading, setLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const rowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for lazy loading
  useEffect(() => {
    if (!fetchUrl) {
      setLoading(false);
      return;
    }

    let observer: IntersectionObserver | null = null;
    const currentContainer = containerRef.current;

    if (currentContainer) {
      observer = new IntersectionObserver(
        async (entries) => {
          if (entries[0].isIntersecting) {
            if (observer && currentContainer) {
              observer.unobserve(currentContainer);
            }

            try {
              setLoading(true);
              const res = await fetch(fetchUrl);
              const data = await res.json();
              if (Array.isArray(data)) {
                setMovies(data);
              }
            } catch (err) {
              console.error(`Error loading content row: ${title}`, err);
            } finally {
              setLoading(false);
            }
          }
        },
        { rootMargin: "200px 0px" }
      );

      observer.observe(currentContainer);
    }

    return () => {
      if (observer && currentContainer) {
        observer.unobserve(currentContainer);
      }
    };
  }, [fetchUrl, title]);

  const handleScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const rowEl = rowRef.current;
    if (rowEl) {
      rowEl.addEventListener("scroll", handleScroll);
      // Trigger initial arrow check
      setTimeout(handleScroll, 300);
    }
    return () => {
      if (rowEl) {
        rowEl.removeEventListener("scroll", handleScroll);
      }
    };
  }, [movies]);

  const scroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { clientWidth, scrollLeft } = rowRef.current;
      const scrollAmount = direction === "left" 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      
      rowRef.current.scrollTo({
        left: scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col gap-3 py-6 group/row select-none overflow-hidden"
    >
      {/* Row Header */}
      <div className="flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          {/* Accent red vertical bar */}
          <div className="w-1 h-6 bg-brand-red rounded-full shadow-lg shadow-brand-red/50"></div>
          <h3 className="font-display font-bold text-lg md:text-xl text-white tracking-tight group-hover/row:text-brand-red transition-colors duration-300">
            {title}
          </h3>
          {movies.length > 0 && title.includes("For You") && (
            <span className="flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase bg-brand-crimson/20 border border-brand-crimson/50 text-brand-red px-2 py-0.5 rounded shadow-sm shadow-brand-red/10">
              <Sparkles size={10} /> AI CURATED
            </span>
          )}
        </div>
        
        {/* View All link */}
        {onViewAll && (
          <button 
            onClick={onViewAll} 
            className="text-xs text-gray-400 hover:text-brand-red font-semibold font-display tracking-wider uppercase transition-colors cursor-pointer"
          >
            View All
          </button>
        )}
      </div>

      {/* Row Track Container */}
      <div className="relative w-full">
        {/* Left Scroll Button */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 inset-y-0 z-30 w-12 md:w-16 flex items-center justify-center bg-gradient-to-r from-black via-black/85 to-transparent text-white opacity-0 group-hover/row:opacity-100 transition-all duration-300 cursor-pointer"
            title="Scroll Left"
          >
            <div className="w-10 h-10 rounded-full bg-[#12090B]/90 border border-white/10 flex items-center justify-center hover:scale-110 hover:bg-[#E50914] transition-all shadow-lg">
              <ChevronLeft size={24} />
            </div>
          </button>
        )}

        {/* Right Scroll Button */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 inset-y-0 z-30 w-12 md:w-16 flex items-center justify-center bg-gradient-to-l from-black via-black/85 to-transparent text-white opacity-0 group-hover/row:opacity-100 transition-all duration-300 cursor-pointer"
            title="Scroll Right"
          >
            <div className="w-10 h-10 rounded-full bg-[#12090B]/90 border border-white/10 flex items-center justify-center hover:scale-110 hover:bg-[#E50914] transition-all shadow-lg">
              <ChevronRight size={24} />
            </div>
          </button>
        )}

        {/* Scrollable track */}
        <div
          ref={rowRef}
          className="flex gap-4 md:gap-5 overflow-x-auto no-scrollbar py-2 px-6 md:px-12 scroll-smooth touch-pan-x"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {loading ? (
            // Animated Skeletons
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-36 sm:w-44 md:w-48 aspect-[2/3] rounded-xl bg-gradient-to-r from-[#12090B]/10 via-[#12090B]/50 to-[#12090B]/10 animate-pulse border border-[#12090B]"
              />
            ))
          ) : movies.length > 0 ? (
            movies.map((movie, index) => (
              <div
                key={movie.id}
                style={{ scrollSnapAlign: "start" }}
              >
                {isTop10 ? (
                  <TopTenCard
                    movie={movie}
                    index={index}
                    onOpenAuth={onOpenAuth}
                  />
                ) : (
                  <PosterCard
                    movie={movie}
                    onOpenAuth={onOpenAuth}
                  />
                )}
              </div>
            ))
          ) : (
            // Empty Row Placeholder
            <div className="w-full flex items-center justify-center py-10 bg-[#12090B]/20 border border-[#12090B] rounded-2xl mx-6 md:mx-12 backdrop-blur-md">
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                No titles available in this row yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
