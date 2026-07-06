import { Search, Home, Tv, Sword, BookMarked, User, Play, Info, ChevronRight, Star, Zap } from "lucide-react";

const MOVIES = [
  { id: 1, title: "Dune: Part Two", year: 2024, genre: "Sci-Fi", rating: "PERFECTION", img: "https://image.tmdb.org/t/p/w342/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg" },
  { id: 2, title: "Oppenheimer", year: 2023, genre: "Drama", rating: "PERFECTION", img: "https://image.tmdb.org/t/p/w342/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" },
  { id: 3, title: "Poor Things", year: 2023, genre: "Fantasy", rating: "GO FOR IT", img: "https://image.tmdb.org/t/p/w342/kCGlIMHnOm8JPXNbpXeksaOior9.jpg" },
  { id: 4, title: "Past Lives", year: 2023, genre: "Romance", rating: "PERFECTION", img: "https://image.tmdb.org/t/p/w342/k3waqVXkSHlvnKMnFAEFcpRiCWd.jpg" },
  { id: 5, title: "Saltburn", year: 2023, genre: "Thriller", rating: "GO FOR IT", img: "https://image.tmdb.org/t/p/w342/qDkvLOjHGPgBOFGfCMzSftMiMhs.jpg" },
  { id: 6, title: "The Zone of Interest", year: 2023, genre: "Drama", rating: "PERFECTION", img: "https://image.tmdb.org/t/p/w342/hUu9zyZmKuTLe5RFEeLEbHRkx0l.jpg" },
  { id: 7, title: "Killers of the Flower Moon", year: 2023, genre: "Crime", rating: "GO FOR IT", img: "https://image.tmdb.org/t/p/w342/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg" },
];

const TRENDING = [
  { id: 8, title: "Shogun", year: 2024, genre: "Drama", type: "SERIES", img: "https://image.tmdb.org/t/p/w342/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg" },
  { id: 9, title: "3 Body Problem", year: 2024, genre: "Sci-Fi", type: "SERIES", img: "https://image.tmdb.org/t/p/w342/oV1lLUMzxIg9oVTBMVBhHdPCCB5.jpg" },
  { id: 10, title: "Ripley", year: 2024, genre: "Crime", type: "SERIES", img: "https://image.tmdb.org/t/p/w342/lnJgPCHU7UiUFCiNHBTjBHdMHBh.jpg" },
  { id: 11, title: "Baby Reindeer", year: 2024, genre: "Drama", type: "SERIES", img: "https://image.tmdb.org/t/p/w342/ihdRm7zqPjFOkOdaEXouOcHBbDD.jpg" },
  { id: 12, title: "Fallout", year: 2024, genre: "Sci-Fi", type: "SERIES", img: "https://image.tmdb.org/t/p/w342/XwRH4yKrKAJK7RuFoZ8B3HbKKC.jpg" },
  { id: 13, title: "The Bear", year: 2024, genre: "Drama", type: "SERIES", img: "https://image.tmdb.org/t/p/w342/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg" },
];

const TIER_COLOR: Record<string, string> = {
  PERFECTION: "#00D4FF",
  "GO FOR IT": "#00E5A0",
  TIMEPASS: "#6A9AB8",
  SKIP: "#2C4D67",
};

function TierDots({ tier }: { tier: string }) {
  const tiers = ["SKIP", "TIMEPASS", "GO FOR IT", "PERFECTION"];
  const idx = tiers.indexOf(tier);
  return (
    <div className="flex gap-[3px]">
      {tiers.map((t, i) => (
        <div
          key={t}
          className="w-[18px] h-[3px] rounded-full"
          style={{ background: i <= idx ? TIER_COLOR[tier] : "#152840" }}
        />
      ))}
    </div>
  );
}

function MovieCard({ title, year, genre, rating, img, rank }: { title: string; year: number; genre: string; rating: string; img: string; rank?: number }) {
  return (
    <div className="shrink-0 w-[140px] cursor-pointer group">
      <div
        className="relative w-full rounded-lg overflow-hidden border transition-all duration-200 group-hover:-translate-y-1"
        style={{
          aspectRatio: "2/3",
          borderColor: "rgba(21,40,64,1)",
          boxShadow: "none",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "#00D4FF";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 1px #00D4FF, 0 0 20px rgba(0,212,255,0.15)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(21,40,64,1)";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}
      >
        <img src={img} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(4,8,15,0.85) 100%)" }} />
        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(0,212,255,1) 0px, transparent 1px, transparent 3px)",
          backgroundSize: "100% 4px",
        }} />
        {rank && (
          <span className="absolute top-2 left-2 font-mono font-bold text-[28px] leading-none" style={{ WebkitTextStroke: "1px rgba(0,212,255,0.35)", color: "transparent" }}>
            {String(rank).padStart(2, "0")}
          </span>
        )}
        <div className="absolute bottom-2 left-2 right-2">
          <span className="font-mono text-[8px] px-1.5 py-0.5 rounded-sm uppercase tracking-widest" style={{ background: "rgba(4,8,15,0.7)", border: "1px solid rgba(0,212,255,0.2)", color: "rgba(0,212,255,0.75)" }}>
            FILM
          </span>
        </div>
      </div>
      <div className="mt-2 text-[12.5px] font-semibold truncate" style={{ color: "#E4F1FF", fontFamily: "'Space Grotesk', sans-serif" }}>{title}</div>
      <div className="font-mono text-[10px] flex items-center gap-1 mt-0.5" style={{ color: "#2C4D67" }}>
        <span>{year}</span><span>·</span><span className="truncate">{genre}</span>
      </div>
    </div>
  );
}

function SeriesCard({ title, year, genre, type, img }: { title: string; year: number; genre: string; type: string; img: string }) {
  return (
    <div className="shrink-0 w-[140px] cursor-pointer group">
      <div
        className="relative w-full rounded-lg overflow-hidden border transition-all duration-200 group-hover:-translate-y-1"
        style={{ aspectRatio: "2/3", borderColor: "rgba(21,40,64,1)" }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "#00E5A0";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 1px #00E5A0, 0 0 16px rgba(0,229,160,0.12)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(21,40,64,1)";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}
      >
        <img src={img} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(4,8,15,0.85) 100%)" }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(0,212,255,1) 0px, transparent 1px, transparent 3px)",
          backgroundSize: "100% 4px",
        }} />
        <div className="absolute bottom-2 left-2 right-2">
          <span className="font-mono text-[8px] px-1.5 py-0.5 rounded-sm uppercase tracking-widest" style={{ background: "rgba(4,8,15,0.7)", border: "1px solid rgba(0,229,160,0.2)", color: "rgba(0,229,160,0.75)" }}>
            {type}
          </span>
        </div>
      </div>
      <div className="mt-2 text-[12.5px] font-semibold truncate" style={{ color: "#E4F1FF", fontFamily: "'Space Grotesk', sans-serif" }}>{title}</div>
      <div className="font-mono text-[10px] flex items-center gap-1 mt-0.5" style={{ color: "#2C4D67" }}>
        <span>{year}</span><span>·</span><span className="truncate">{genre}</span>
      </div>
    </div>
  );
}

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="px-5 pt-8 pb-1">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-[3px] h-5 rounded-full shrink-0" style={{ background: accent }} />
        <span className="text-[14px] font-semibold tracking-tight" style={{ color: "#E4F1FF", fontFamily: "'Space Grotesk', sans-serif" }}>{title}</span>
        <div className="flex-1 h-px" style={{ background: "#152840" }} />
        <button className="font-mono text-[10px] tracking-widest hover:opacity-80 transition-opacity" style={{ color: accent }}>VIEW ALL →</button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {children}
      </div>
    </div>
  );
}

export default function AllratedHome() {
  const hero = MOVIES[0];

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", background: "#04080F", color: "#E4F1FF", minHeight: "100vh" }}>
      <link rel="stylesheet" media="print" onLoad={(e) => { (e.target as HTMLLinkElement).media = "all"; }} href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />

      {/* Ticker */}
      <div className="overflow-hidden whitespace-nowrap py-1.5 border-b" style={{ background: "#0A1423", borderColor: "#152840" }}>
        <div className="inline-flex gap-8 font-mono text-[10px] tracking-wide animate-marquee" style={{ color: "#2C4D67" }}>
          {["Dune: Part Two", "Oppenheimer", "Shogun", "Baby Reindeer", "Past Lives", "3 Body Problem", "Poor Things", "Ripley", "Fallout"].map((t, i) => (
            <span key={i} className="flex items-center gap-4">
              <span style={{ color: "#6A9AB8" }}>{t}</span>
              <b style={{ color: "#00D4FF", letterSpacing: "0.15em" }}>PERFECTION</b>
            </span>
          ))}
        </div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center gap-4 px-5 py-3 border-b" style={{ background: "rgba(4,8,15,0.95)", borderColor: "#152840", backdropFilter: "blur(12px)" }}>
        <div className="w-8 h-8 rounded-md flex items-center justify-center font-mono font-bold text-[13px] border" style={{ background: "#0A1423", borderColor: "#1E3D5C", color: "#00D4FF", boxShadow: "0 0 8px rgba(0,212,255,0.2)" }}>
          AR
        </div>
        <div className="flex-1 max-w-xs flex items-center gap-2 rounded-md px-3 py-2 border" style={{ background: "#0A1423", borderColor: "#152840" }}>
          <Search size={12} style={{ color: "#2C4D67" }} />
          <span className="font-mono text-[12px]" style={{ color: "#2C4D67" }}>Search movies, series, anime…</span>
          <span className="ml-auto font-mono text-[9px] px-1.5 py-0.5 rounded border" style={{ color: "#2C4D67", borderColor: "#152840" }}>⌘K</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button className="font-mono text-[10px] px-3 py-1.5 rounded-md border tracking-widest transition-all" style={{ borderColor: "#152840", color: "#6A9AB8" }}>SIGN IN</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b" style={{ height: "60vh", minHeight: 420, borderColor: "#152840" }}>
        {/* BG image */}
        <div className="absolute inset-0">
          <img src="https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg" alt="" className="w-full h-full object-cover" style={{ opacity: 0.35 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(4,8,15,0.95) 40%, rgba(4,8,15,0.5) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(4,8,15,1) 0%, transparent 60%)" }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
        </div>

        <div className="relative z-10 flex items-end h-full px-5 pb-10 max-w-2xl">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em]" style={{ color: "#00D4FF" }}>
              <span className="w-4 h-px inline-block" style={{ background: "#00D4FF", boxShadow: "0 0 6px rgba(0,212,255,0.8)" }} />
              FEATURED TODAY
            </div>
            <h1 className="font-bold leading-none tracking-tight" style={{ fontSize: "clamp(36px,6vw,60px)", color: "#E4F1FF" }}>
              Dune: Part Two
            </h1>
            <p className="text-sm leading-relaxed max-w-md font-light" style={{ color: "#6A9AB8" }}>
              Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.
            </p>
            <div className="flex items-center gap-3 font-mono text-[11px]" style={{ color: "#6A9AB8" }}>
              <span>2024</span><span style={{ color: "#152840" }}>·</span>
              <span>2H 46M</span><span style={{ color: "#152840" }}>·</span>
              <span className="uppercase" style={{ color: "rgba(0,212,255,0.7)" }}>FILM</span>
              <span style={{ color: "#152840" }}>·</span>
              <span className="px-1.5 py-0.5 rounded-sm text-[9px] border tracking-widest" style={{ borderColor: "rgba(0,212,255,0.25)", color: "#00D4FF", background: "rgba(0,212,255,0.05)" }}>SCI-FI</span>
              <span className="px-1.5 py-0.5 rounded-sm text-[9px] border tracking-widest" style={{ borderColor: "rgba(0,212,255,0.25)", color: "#00D4FF", background: "rgba(0,212,255,0.05)" }}>ADVENTURE</span>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button className="flex items-center gap-2 font-bold text-[12px] px-5 py-2.5 rounded-md tracking-wide" style={{ background: "#00D4FF", color: "#04080F", boxShadow: "0 0 20px rgba(0,212,255,0.25)" }}>
                <Play size={12} fill="currentColor" /> PLAY NOW
              </button>
              <button className="flex items-center gap-2 font-semibold text-[12px] px-5 py-2.5 rounded-md border transition-all" style={{ borderColor: "#1E3D5C", color: "#E4F1FF", background: "rgba(10,20,35,0.8)" }}>
                <Info size={13} /> More info
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-2 pt-1">
              {MOVIES.slice(0, 5).map((_, i) => (
                <div key={i} className="rounded-full h-[2px] transition-all" style={{ width: i === 0 ? 28 : 10, background: i === 0 ? "#00D4FF" : "#152840", boxShadow: i === 0 ? "0 0 6px rgba(0,212,255,0.7)" : "none" }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex px-5 pt-4 border-b relative" style={{ borderColor: "#152840" }}>
        {["ALL", "MOVIES", "SERIES", "ANIME"].map((t, i) => (
          <button key={t} className="font-mono text-[11px] pb-3 mr-6 tracking-widest transition-colors" style={{ color: i === 0 ? "#E4F1FF" : "#2C4D67" }}>{t}</button>
        ))}
        <div className="absolute bottom-[-1px] left-5 h-[2px] w-7 rounded-full" style={{ background: "#00D4FF", boxShadow: "0 0 8px rgba(0,212,255,0.6)" }} />
      </div>

      {/* Top 10 */}
      <Section title="Top 10 Today" accent="#00D4FF">
        {MOVIES.map((m, i) => (
          <MovieCard key={m.id} {...m} rank={i + 1} />
        ))}
      </Section>

      {/* Trending */}
      <Section title="Trending Now" accent="#00E5A0">
        {TRENDING.map((s) => (
          <SeriesCard key={s.id} {...s} />
        ))}
      </Section>

      {/* Featured rating showcase */}
      <div className="mx-5 mt-8 rounded-xl border p-5" style={{ background: "#0A1423", borderColor: "#152840" }}>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={14} style={{ color: "#00D4FF" }} />
          <span className="font-mono text-[10px] tracking-widest" style={{ color: "#00D4FF" }}>COMMUNITY VERDICT</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {MOVIES.slice(0, 4).map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: "#152840", background: "rgba(4,8,15,0.4)" }}>
              <img src={m.img} alt={m.title} className="w-10 h-14 rounded object-cover shrink-0 border" style={{ borderColor: "#152840" }} />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold truncate" style={{ color: "#E4F1FF" }}>{m.title}</div>
                <div className="font-mono text-[10px] mt-0.5 mb-2" style={{ color: "#2C4D67" }}>{m.year}</div>
                <TierDots tier={m.rating} />
                <div className="font-mono text-[9px] mt-1 tracking-wide" style={{ color: TIER_COLOR[m.rating] }}>{m.rating}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom padding */}
      <div className="h-24" />

      {/* Bottom Nav */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-1 items-center rounded-full p-1.5 z-50 border" style={{ background: "rgba(10,20,35,0.95)", backdropFilter: "blur(16px)", borderColor: "#152840", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
        {[
          { icon: Home, active: true },
          { icon: Tv, active: false },
          { icon: Sword, active: false },
          { icon: BookMarked, active: false },
          { icon: User, active: false },
        ].map(({ icon: Icon, active }, i) => (
          <button key={i} className="w-10 h-10 rounded-full flex items-center justify-center transition-all" style={{
            background: active ? "#00D4FF" : "transparent",
            color: active ? "#04080F" : "#2C4D67",
            boxShadow: active ? "0 0 12px rgba(0,212,255,0.4)" : "none",
          }}>
            <Icon size={17} />
          </button>
        ))}
      </div>

      <style>{`
        @keyframes marquee { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
        .animate-marquee { animation: marquee 40s linear infinite; }
      `}</style>
    </div>
  );
}
