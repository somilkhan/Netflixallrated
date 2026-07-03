import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Movie } from "../types";
import MovieCard from "./MovieCard";

interface MovieRowProps {
  key?: React.Key;
  title: string;
  fetchUrl?: string; // Optional if movies list is passed directly
  initialMovies?: Movie[]; // Fallback list
  onOpenAuth: () => void;
}

export default function MovieRow({ title, fetchUrl, initialMovies, onOpenAuth }: MovieRowProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies || []);
  const [loading, setLoading] = useState(true);
  const [anyCardHovered, setAnyCardHovered] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  const rowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy loading row contents via IntersectionObserver
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
            // Unobserve immediately so we only load once
            if (observer && currentContainer) {
              observer.unobserve(currentContainer);
            }
            
            // Fetch data
            try {
              setLoading(true);
              const res = await fetch(fetchUrl);
              const data = await res.json();
              if (Array.isArray(data)) {
                setMovies(data);
              }
            } catch (err) {
              console.error(`Error loading row: ${title}`, err);
            } finally {
              setLoading(false);
            }
          }
        },
        { rootMargin: "200px 0px" } // Pre-fetch 200px before scrolling into view
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
      // Trigger initial arrow calculation
      setTimeout(handleScroll, 200);
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
      className="relative flex flex-col gap-3 py-4 md:py-6 group/row select-none"
    >
      {/* Row Title */}
      <div className="flex items-center gap-2 px-6 md:px-12">
        <h3 className="font-display font-bold text-base md:text-xl text-white tracking-tight group-hover/row:text-brand-red transition-colors duration-300">
          {title}
        </h3>
        {movies.length > 0 && title.includes("For You") && (
          <span className="flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase bg-brand-crimson/20 border border-brand-crimson/50 text-brand-red px-2 py-0.5 rounded">
            <Sparkles size={10} /> AI CURATED
          </span>
        )}
      </div>

      {/* Row Container */}
      <div className="relative w-full">
        {/* Left Scroll Arrow */}
        {showLeftArrow && !anyCardHovered && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 inset-y-0 z-30 w-10 md:w-12 flex items-center justify-center bg-gradient-to-r from-[#12090B] via-[#12090B]/85 to-transparent text-white opacity-0 group-hover/row:opacity-100 transition-all duration-300 cursor-pointer"
            title="Scroll Left"
          >
            <div className="w-8 h-8 rounded-full bg-[#12090B]/80 border border-white/5 flex items-center justify-center hover:scale-110 hover:bg-[#E50914] transition-all">
              <ChevronLeft size={20} />
            </div>
          </button>
        )}

        {/* Right Scroll Arrow */}
        {showRightArrow && !anyCardHovered && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 inset-y-0 z-30 w-10 md:w-12 flex items-center justify-center bg-gradient-to-l from-[#12090B] via-[#12090B]/85 to-transparent text-white opacity-0 group-hover/row:opacity-100 transition-all duration-300 cursor-pointer"
            title="Scroll Right"
          >
            <div className="w-8 h-8 rounded-full bg-[#12090B]/80 border border-white/5 flex items-center justify-center hover:scale-110 hover:bg-[#E50914] transition-all">
              <ChevronRight size={20} />
            </div>
          </button>
        )}

        {/* Scrollable track */}
        <div
          ref={rowRef}
          className="flex gap-4 md:gap-5 overflow-x-auto no-scrollbar py-4 px-6 md:px-12 scroll-smooth"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {loading ? (
            // Animated Skeletons
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-36 sm:w-48 md:w-56 aspect-[16/9] rounded-xl bg-gradient-to-r from-brand-maroon/20 via-[#1e1014] to-brand-maroon/20 animate-pulse border border-white/5"
              />
            ))
          ) : movies.length > 0 ? (
            movies.map((movie) => (
              <div key={movie.id} style={{ scrollSnapAlign: "start" }}>
                <MovieCard
                  movie={movie}
                  onOpenAuth={onOpenAuth}
                  anyCardHovered={anyCardHovered}
                  setAnyCardHovered={setAnyCardHovered}
                />
              </div>
            ))
          ) : (
            // Empty row placeholder
            <div className="w-full flex items-center justify-center py-8 glass-panel border border-white/5 rounded-2xl mx-6 md:mx-12">
              <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                No titles available in this row yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
