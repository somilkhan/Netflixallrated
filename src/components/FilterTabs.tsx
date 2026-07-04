import React from "react";
import { ChevronDown, Globe, Film, Layers, Sparkles, SlidersHorizontal } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "@/components/ui/dropdown-menu";
import { motion } from "motion/react";

interface FilterTabsProps {
  activeSection: "all" | "movie" | "tv" | "anime";
  setActiveSection: (section: "all" | "movie" | "tv" | "anime") => void;
  selectedGenre: string;
  setSelectedGenre: (genre: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  onClearFilters: () => void;
}

export default function FilterTabs({
  activeSection,
  setActiveSection,
  selectedGenre,
  setSelectedGenre,
  selectedYear,
  setSelectedYear,
  onClearFilters
}: FilterTabsProps) {

  const sections: { id: "all" | "movie" | "tv" | "anime"; label: string }[] = [
    { id: "all", label: "All Content" },
    { id: "movie", label: "Movies" },
    { id: "tv", label: "Series" },
    { id: "anime", label: "Anime" }
  ];

  const genres = [
    "Action", "Adventure", "Sci-Fi", "Drama", "Comedy", "Thriller", "Horror", "Mystery", "Animation"
  ];

  const years = [
    { id: "2026", label: "2026 Releases" },
    { id: "2025", label: "2025 Releases" },
    { id: "2024", label: "2024 Releases" },
    { id: "2023", label: "2023 Releases" },
    { id: "2020s", label: "2020s Era" },
    { id: "2010s", label: "2010s Era" },
    { id: "Older", label: "Classic Era" }
  ];

  const hasActiveFilters = selectedGenre || selectedYear || activeSection !== "all";

  return (
    <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 md:px-12 py-4 border-b border-white/5 bg-[#000000]/60 backdrop-blur-md sticky top-20 z-30">
      {/* Tab-based Filters (Movies / Series / Anime) styled as pill tabs with red active-state background */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
        {sections.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className="relative px-5 py-2 text-xs font-display font-bold tracking-wider uppercase rounded-full transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Background active pill */}
              {isActive && (
                <motion.span
                  layoutId="activeFilterTab"
                  className="absolute inset-0 bg-brand-red rounded-full shadow-lg shadow-brand-red/40"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className={`relative z-10 transition-colors duration-300 ${isActive ? "text-white" : "text-gray-400 hover:text-white"}`}>
                {sec.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Dropdown Filters & Controls */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {/* Genre Dropdown with Glassmorphic styling */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 bg-[#12090B]/60 border border-white/10 hover:border-brand-red/50 px-4 h-10 rounded-full text-white cursor-pointer transition-all backdrop-blur-md shadow-md outline-none">
            <Film size={14} className="text-brand-red" />
            <span>{selectedGenre || "All Genres"}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#12090B] border border-white/10 text-white rounded-xl shadow-2xl p-1 min-w-44 z-50">
            <DropdownMenuItem 
              onClick={() => setSelectedGenre("")}
              className="px-3 py-2 text-xs hover:bg-brand-red hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              All Genres
            </DropdownMenuItem>
            {genres.map((g) => (
              <DropdownMenuItem 
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${selectedGenre === g ? "bg-brand-red/20 text-brand-red" : "hover:bg-brand-red hover:text-white"}`}
              >
                {g}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Era/Year Dropdown with Glassmorphic styling */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 bg-[#12090B]/60 border border-white/10 hover:border-brand-red/50 px-4 h-10 rounded-full text-white cursor-pointer transition-all backdrop-blur-md shadow-md outline-none">
            <Layers size={14} className="text-brand-red" />
            <span>{years.find(y => y.id === selectedYear)?.label || "All Eras"}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#12090B] border border-white/10 text-white rounded-xl shadow-2xl p-1 min-w-44 z-50">
            <DropdownMenuItem 
              onClick={() => setSelectedYear("")}
              className="px-3 py-2 text-xs hover:bg-brand-red hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              All Eras
            </DropdownMenuItem>
            {years.map((y) => (
              <DropdownMenuItem 
                key={y.id}
                onClick={() => setSelectedYear(y.id)}
                className={`px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${selectedYear === y.id ? "bg-brand-red/20 text-brand-red" : "hover:bg-brand-red hover:text-white"}`}
              >
                {y.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filter Button */}
        {hasActiveFilters && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={onClearFilters}
            className="flex items-center gap-1 px-4 h-10 bg-brand-crimson/20 hover:bg-brand-red border border-brand-red/30 text-white text-[10px] font-bold uppercase rounded-full transition-all duration-300 shadow-md cursor-pointer"
          >
            <SlidersHorizontal size={12} />
            <span>Clear Filters</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
