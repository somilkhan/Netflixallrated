import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, ChevronRight, Play } from "lucide-react";

/*
  Categories — Monochrome. Instrument Serif italic for display type.
  Search filters live, "View All" expands into a full grid,
  tapping any tile opens a detail sheet.
*/

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap');
`;

const SECTIONS = [
  {
    id: "browse",
    title: "Browse",
    kind: "topic",
    items: [
      { id: "sports",   name: "Sports",         tag: "42 titles",    tone: "from-zinc-800 to-black" },
      { id: "sparks",   name: "Sparks",          tag: "Short-form",   tone: "from-zinc-900 to-black" },
      { id: "anime",    name: "Anime",           tag: "310 titles",   tone: "from-zinc-800 to-zinc-950" },
      { id: "docs",     name: "Documentaries",   tag: "88 titles",    tone: "from-zinc-900 to-black" },
      { id: "kids",     name: "Kids",            tag: "56 titles",    tone: "from-zinc-800 to-black" },
      { id: "reality",  name: "Reality",         tag: "24 titles",    tone: "from-zinc-900 to-zinc-950" },
    ],
  },
  {
    id: "studios",
    title: "Studios",
    kind: "studio",
    items: [
      { id: "hotstar", name: "Hotstar Specials", tag: "Originals",   tone: "from-zinc-900 to-black" },
      { id: "disney",  name: "Studio Arc",       tag: "Family",      tone: "from-zinc-800 to-black" },
      { id: "a24",     name: "Frame House",      tag: "Indie",       tone: "from-zinc-900 to-zinc-950" },
      { id: "wb",      name: "Northgate",        tag: "Blockbuster", tone: "from-zinc-800 to-black" },
    ],
  },
  {
    id: "languages",
    title: "Popular Languages",
    kind: "language",
    items: [
      { id: "en", name: "English",  tag: "1,204 titles", tone: "from-zinc-800 to-black" },
      { id: "ja", name: "Japanese", tag: "310 titles",   tone: "from-zinc-900 to-black" },
      { id: "ko", name: "Korean",   tag: "266 titles",   tone: "from-zinc-800 to-zinc-950" },
      { id: "hi", name: "Hindi",    tag: "402 titles",   tone: "from-zinc-900 to-black" },
      { id: "zh", name: "Mandarin", tag: "118 titles",   tone: "from-zinc-800 to-black" },
    ],
  },
];

type Item = (typeof SECTIONS)[0]["items"][0];
type Section = (typeof SECTIONS)[0];

function TiltCard({ item, onOpen, size = "md" }: { item: Item; onOpen: (i: Item) => void; size?: "md" | "lg" }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handleMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ x: (py - 0.5) * -8, y: (px - 0.5) * 8 });
  }

  const h = size === "lg" ? "h-40" : "h-32";
  const w = size === "lg" ? "w-64" : "w-44";

  return (
    <button
      ref={ref}
      onClick={() => onOpen(item)}
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 150ms ease-out",
      }}
      className={`group relative shrink-0 ${w} ${h} rounded-2xl overflow-hidden text-left
        bg-gradient-to-br ${item.tone} border border-white/5
        focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.08) 45%, transparent 60%)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/10" />
      <div className="relative h-full flex flex-col justify-end p-4">
        <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
          className="text-white text-2xl leading-none">
          {item.name}
        </span>
        <span className="mt-1 text-[11px] tracking-wide text-zinc-400 uppercase">{item.tag}</span>
      </div>
    </button>
  );
}

function Row({ section, onOpen, onViewAll }: { section: Section; onOpen: (i: Item) => void; onViewAll: (s: Section) => void }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between px-5 mb-3">
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
          className="text-white text-[26px]">
          {section.title}
        </h2>
        <button onClick={() => onViewAll(section)}
          className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors">
          View All <ChevronRight size={15} />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none snap-x snap-mandatory">
        {section.items.map(item => (
          <div key={item.id} className="snap-start">
            <TiltCard item={item} onOpen={onOpen} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpandedGrid({ section, onBack, onOpen }: { section: Section; onBack: () => void; onOpen: (i: Item) => void }) {
  return (
    <div className="px-5">
      <button onClick={onBack}
        className="mb-5 text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
        <ChevronRight size={15} className="rotate-180" /> Back
      </button>
      <h2 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
        className="text-white text-3xl mb-5">
        {section.title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-10">
        {section.items.map(item => (
          <TiltCard key={item.id} item={item} onOpen={onOpen} size="lg" />
        ))}
      </div>
    </div>
  );
}

function DetailSheet({ item, onClose }: { item: Item | null; onClose: () => void }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className={`w-full sm:w-[420px] rounded-t-3xl sm:rounded-3xl bg-gradient-to-b ${item.tone} border border-white/10 p-6 pb-8`}>
        <div className="flex justify-between items-start mb-4">
          <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
            className="text-3xl text-white">
            {item.name}
          </span>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-zinc-400 text-sm mb-6 uppercase tracking-wide">{item.tag}</p>
        <button className="w-full flex items-center justify-center gap-2 bg-white text-black rounded-xl py-3 font-medium hover:bg-zinc-200 transition-colors">
          <Play size={16} fill="black" /> Explore {item.name}
        </button>
      </div>
    </div>
  );
}

export default function Categories() {
  const [query, setQuery]       = useState("");
  const [expanded, setExpanded] = useState<Section | null>(null);
  const [openItem, setOpenItem] = useState<Item | null>(null);
  const [glow, setGlow]         = useState({ x: 20, y: 20 });

  useEffect(() => {
    const id = setInterval(() => {
      setGlow({ x: 10 + Math.random() * 80, y: 5 + Math.random() * 40 });
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const filteredSections = useMemo(() => {
    if (!query.trim()) return SECTIONS;
    const q = query.toLowerCase();
    return SECTIONS
      .map(s => ({ ...s, items: s.items.filter(i => i.name.toLowerCase().includes(q)) }))
      .filter(s => s.items.length > 0);
  }, [query]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <style>{FONT_IMPORT}</style>
      <style>{`.scrollbar-none::-webkit-scrollbar{display:none}.scrollbar-none{-ms-overflow-style:none;scrollbar-width:none}`}</style>

      {/* ambient drifting glow */}
      <div
        className="pointer-events-none absolute w-[500px] h-[500px] rounded-full bg-white/[0.04] blur-[100px] transition-all duration-[6000ms] ease-in-out"
        style={{ left: `${glow.x}%`, top: `${glow.y}%` }}
      />

      <div className="relative z-10 pt-8 pb-28" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="px-5 mb-6">
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
            className="text-white text-[38px] leading-tight">
            Categories
          </h1>
        </div>

        <div className="px-5 mb-8">
          <div className="flex items-center gap-3 bg-zinc-900/70 border border-white/10 rounded-full px-4 py-3">
            <Search size={17} className="text-zinc-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search categories, studios, languages"
              className="bg-transparent outline-none text-white placeholder-zinc-600 text-sm w-full"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-zinc-500 hover:text-white">
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {expanded ? (
          <ExpandedGrid section={expanded} onBack={() => setExpanded(null)} onOpen={setOpenItem} />
        ) : filteredSections.length === 0 ? (
          <p className="px-5 text-zinc-500 text-sm">Nothing matches "{query}" — try a different search.</p>
        ) : (
          filteredSections.map(section => (
            <Row key={section.id} section={section} onOpen={setOpenItem} onViewAll={setExpanded} />
          ))
        )}
      </div>

      <DetailSheet item={openItem} onClose={() => setOpenItem(null)} />
    </div>
  );
}
