/**
 * PremiumCategories — bingr.one layout, pixel-matched.
 * 5 rows, colored tint per card, Inter labels, maroon accents.
 *
 * Bingr card anatomy:
 *  1. Image (brightness ~0.82, saturate ~0.9)
 *  2. Colored tint overlay (the signature bingr look) rgba @ 30-38%
 *  3. Bottom-to-transparent dark gradient for label readability
 *  4. Bold white label bottom-left, smaller sub-label below
 *
 * Card size: 165 × 115px  |  radius 13px  |  gap 10px  |  leftPad 14px
 * Two full cards + ~37px peek of 3rd (identical to bingr's 2-up peek rhythm)
 */
import { ChevronRight } from "lucide-react";

/* ─── Tokens ─────────────────────────────────────────────── */
const B = {
  bg:      "#09040A",
  cardBg:  "#141014",
  maroon:  "#C2434F",
  dimRed:  "#8B1A24",
  white:   "#EDE6E8",
  dim:     "#6E6070",
  faint:   "#211820",
  border:  "rgba(255,255,255,0.045)",
};

/* ─── Image helpers ──────────────────────────────────────── */
const T = "https://image.tmdb.org/t/p/w780";
const L = import.meta.env.BASE_URL.replace(/\/$/, "");

/* ─── Data ───────────────────────────────────────────────── */
interface ImgItem { label: string; sub?: string; img: string; tint: string }
interface LogoItem { label: string; logo: string; color: string }
interface GradItem { label: string; sub?: string; grad: string }

/* Row 1 — Browse by Type */
const TYPES: ImgItem[] = [
  { label:"Movies",   sub:"12,345 titles", img:`${T}/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg`, tint:"rgba(100,70,200,0.32)" },
  { label:"TV Shows", sub:"34 titles",     img:`${T}/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg`, tint:"rgba(40,140,100,0.30)" },
  { label:"Anime",    sub:"20 titles",     img:`${T}/suopoADq0k8YZr4dQXcU6pToj6s.jpg`, tint:"rgba(190,50,60,0.30)"  },
];

/* Row 2 — Browse by Genre */
const GENRES: ImgItem[] = [
  { label:"Action",    img:`${T}/or06FN3Dka5tukK1e9sl16pB3iy.jpg`, tint:"rgba(200,50,40,0.34)"  },
  { label:"Drama",     img:`${T}/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg`, tint:"rgba(180,110,30,0.32)" },
  { label:"Horror",    img:`${L}/images/genre-horror_2.jpg`,         tint:"rgba(80,10,10,0.42)"   },
  { label:"Sci-Fi",    img:`${T}/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg`, tint:"rgba(30,80,200,0.34)"  },
  { label:"Romance",   img:`${L}/images/genre-romance_2.jpg`,        tint:"rgba(190,80,80,0.32)"  },
  { label:"Thriller",  img:`${L}/images/genre-thriller_2.jpg`,       tint:"rgba(20,80,50,0.34)"   },
  { label:"Comedy",    img:`${L}/images/genre-comedy_2.jpg`,         tint:"rgba(180,150,0,0.30)"  },
  { label:"Animation", img:`${T}/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg`, tint:"rgba(110,40,200,0.34)" },
];

/* Row 3 — Browse by Platform  (logo cards, no image) */
const PLATFORMS: LogoItem[] = [
  { label:"Netflix",     logo:"NETFLIX",     color:"#E50914" },
  { label:"Prime Video", logo:"prime video", color:"#00A8E1" },
  { label:"Hotstar",     logo:"hotstar",     color:"#1A6CF2" },
  { label:"Crunchyroll", logo:"crunchyroll", color:"#F47521" },
  { label:"Apple TV+",   logo:"Apple TV+",   color:"#F0F0F2" },
  { label:"MUBI",        logo:"MUBI",        color:"#D4A84B" },
];

/* Row 4 — Browse by Era  (image cards with era tint) */
const ERAS: ImgItem[] = [
  { label:"Classics",  sub:"Pre-2000",  img:`${T}/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg`, tint:"rgba(120,80,20,0.45)"  },
  { label:"2000s",     sub:"2000–2009", img:`${T}/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg`, tint:"rgba(40,100,160,0.40)" },
  { label:"2010s",     sub:"2010–2019", img:`${T}/or06FN3Dka5tukK1e9sl16pB3iy.jpg`, tint:"rgba(30,120,80,0.38)"  },
  { label:"2020s",     sub:"2020–Now",  img:`${T}/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg`, tint:"rgba(70,40,180,0.40)"  },
  { label:"90s",       sub:"1990–1999", img:`${L}/images/era-90s.jpg`,               tint:"rgba(160,90,20,0.38)"  },
];

/* Row 5 — Browse by Mood  (pure gradient cards — editorial, like bingr's "Sparks") */
const MOODS: GradItem[] = [
  { label:"Dark & Gritty",   grad:"linear-gradient(135deg,#1a0a0a 0%,#3a1010 50%,#200808 100%)"                    },
  { label:"Feel-Good",       grad:"linear-gradient(135deg,#0d2010 0%,#1a4a20 50%,#0a2510 100%)"                    },
  { label:"Mind-Bending",    grad:"linear-gradient(135deg,#0d0a20 0%,#2a1060 50%,#150830 100%)"                    },
  { label:"Heartwarming",    grad:"linear-gradient(135deg,#200a0a 0%,#4a1520 50%,#280a10 100%)"                    },
  { label:"Adrenaline",      grad:"linear-gradient(135deg,#1a0a00 0%,#3a1a00 50%,#200800 100%)"                    },
];

/* ─── Card dimensions ───────────────────────────────────── */
const W = 165;   // card width
const H = 115;   // card height  (≈ 3:2 — matches bingr)
const R = 13;    // border-radius

/* ─── Sub-components ─────────────────────────────────────── */

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display:"flex", overflowX:"auto", gap:10,
      paddingLeft:14, paddingRight:14,
      scrollbarWidth:"none",
      WebkitOverflowScrolling:"touch",
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      display:"flex", alignItems:"center",
      justifyContent:"space-between",
      padding:"0 14px", marginBottom:11,
    }}>
      <span style={{
        fontFamily:"'Inter',sans-serif",
        fontWeight:700, fontSize:19,
        color:B.white, letterSpacing:"-0.01em",
      }}>{title}</span>
      <button style={{
        display:"flex", alignItems:"center", gap:2,
        fontFamily:"'Inter',sans-serif",
        fontWeight:500, fontSize:13,
        color:B.maroon,
        background:"none", border:"none", cursor:"pointer", padding:0,
      }}>
        View All <ChevronRight size={13} strokeWidth={2.5}/>
      </button>
    </div>
  );
}

/** Image card with bingr-style colored tint */
function ImgCard({ label, sub, img, tint }: ImgItem) {
  return (
    <div style={{
      flexShrink:0, position:"relative",
      width:W, height:H, borderRadius:R,
      overflow:"hidden", cursor:"pointer",
      backgroundColor:B.cardBg,
    }}>
      {/* Image — slightly dimmed before any overlay */}
      <img src={img} alt={label} style={{
        position:"absolute", inset:0,
        width:"100%", height:"100%",
        objectFit:"cover", objectPosition:"center",
        filter:"brightness(0.82) saturate(0.88)",
      }}/>

      {/* ① Bingr signature: colored tint that defines each card */}
      <div style={{ position:"absolute", inset:0, background:tint }}/>

      {/* ② Bottom gradient — text readability only, stops at ~60% */}
      <div style={{
        position:"absolute", inset:0,
        background:
          "linear-gradient(to top,rgba(9,4,10,0.92) 0%,rgba(9,4,10,0.45) 42%,transparent 66%)",
      }}/>

      {/* Label */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"0 10px 9px" }}>
        <p style={{
          fontFamily:"'Inter',sans-serif",
          fontWeight:700, fontSize:15,
          color:B.white, margin:0, lineHeight:1.2,
          textShadow:"0 1px 4px rgba(0,0,0,0.6)",
        }}>{label}</p>
        {sub && (
          <p style={{
            fontFamily:"'Inter',sans-serif",
            fontWeight:400, fontSize:10,
            color:"rgba(255,255,255,0.55)",
            margin:"1px 0 0", letterSpacing:"0.01em",
          }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

/** Platform logo card — dark bg, centred logo */
function LogoCard({ logo, color }: LogoItem) {
  const isNetflix = logo==="NETFLIX", isMubi=logo==="MUBI",
        isPrime   = logo==="prime video", isApple=logo==="Apple TV+";
  return (
    <div style={{
      flexShrink:0, position:"relative",
      width:W, height:H, borderRadius:R,
      overflow:"hidden", cursor:"pointer",
      background:B.cardBg,
      border:`1px solid ${B.border}`,
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <div style={{
        position:"absolute", inset:0,
        background:`radial-gradient(ellipse at center,${color}16 0%,transparent 70%)`,
      }}/>
      <span style={{
        position:"relative",
        fontFamily: isNetflix||isMubi
          ? "'Montserrat',sans-serif"
          : isApple
          ? "-apple-system,'SF Pro Display',sans-serif"
          : "'Plus Jakarta Sans',sans-serif",
        fontWeight: isPrime ? 400 : 700,
        fontStyle:  isPrime ? "italic" : "normal",
        fontSize:   isNetflix ? 18 : isMubi ? 22 : isPrime ? 13 : isApple ? 14 : 16,
        letterSpacing: isNetflix ? "0.15em" : isMubi ? "0.22em" : "0.02em",
        textTransform: isNetflix||isMubi ? "uppercase" : "none",
        color,
        textShadow:`0 0 28px ${color}55`,
      }}>{logo}</span>
    </div>
  );
}

/** Mood card — pure editorial gradient, no image */
function MoodCard({ label, grad }: GradItem) {
  return (
    <div style={{
      flexShrink:0, position:"relative",
      width:W, height:H, borderRadius:R,
      overflow:"hidden", cursor:"pointer",
      background:grad,
      border:`1px solid ${B.border}`,
    }}>
      {/* subtle noise grain — matches bingr's dark category cards */}
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")",
        mixBlendMode:"overlay" as const,
      }}/>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"0 10px 9px" }}>
        <p style={{
          fontFamily:"'Inter',sans-serif",
          fontWeight:700, fontSize:15,
          color:B.white, margin:0, lineHeight:1.2,
          textShadow:"0 1px 5px rgba(0,0,0,0.8)",
        }}>{label}</p>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export function PremiumCategories() {
  return (
    <div style={{
      width:390, minHeight:"100vh",
      background:B.bg,
      fontFamily:"'Inter',sans-serif",
      overflowX:"hidden",
      paddingBottom:120,
    }}>

      {/* ── Page header ── */}
      <div style={{ padding:"30px 14px 26px" }}>
        <p style={{
          fontFamily:"'Inter',sans-serif",
          fontWeight:500, fontSize:10,
          letterSpacing:"0.12em", textTransform:"uppercase",
          color:B.maroon, margin:"0 0 5px",
        }}>The Catalog</p>
        <h1 style={{
          fontFamily:"'Cormorant Garamond',Georgia,serif",
          fontWeight:600, fontSize:29,
          color:B.white, margin:0,
          lineHeight:1, letterSpacing:"-0.01em",
        }}>Browse Everything</h1>
      </div>

      {/* ─── Row 1: Browse by Type ─── */}
      <div style={{ marginBottom:30 }}>
        <SectionHeader title="Browse by Type"/>
        <Row>{TYPES.map(t=><ImgCard key={t.label} {...t}/>)}</Row>
      </div>

      {/* ─── Row 2: Browse by Genre ─── */}
      <div style={{ marginBottom:30 }}>
        <SectionHeader title="Browse by Genre"/>
        <Row>{GENRES.map(g=><ImgCard key={g.label} {...g}/>)}</Row>
      </div>

      {/* ─── Row 3: Browse by Platform ─── */}
      <div style={{ marginBottom:30 }}>
        <SectionHeader title="Browse by Platform"/>
        <Row>{PLATFORMS.map(p=><LogoCard key={p.label} {...p}/>)}</Row>
      </div>

      {/* ─── Row 4: Browse by Era ─── */}
      <div style={{ marginBottom:30 }}>
        <SectionHeader title="Browse by Era"/>
        <Row>{ERAS.map(e=><ImgCard key={e.label} {...e}/>)}</Row>
      </div>

      {/* ─── Row 5: Browse by Mood ─── */}
      <div style={{ marginBottom:30 }}>
        <SectionHeader title="Browse by Mood"/>
        <Row>{MOODS.map(m=><MoodCard key={m.label} {...m}/>)}</Row>
      </div>

      {/* ── Maroon rule ── */}
      <div style={{
        margin:"0 14px 26px", height:1,
        background:`linear-gradient(to right,${B.maroon}55,transparent)`,
      }}/>

      {/* ── Where to Watch ── */}
      <div style={{ padding:"0 14px" }}>
        <div style={{
          display:"flex", alignItems:"center",
          justifyContent:"space-between",
          borderRadius:14,
          border:`1px solid ${B.border}`,
          background:B.cardBg,
          padding:"15px 16px",
        }}>
          <div>
            <p style={{
              fontFamily:"'Inter',sans-serif",
              fontWeight:600, fontSize:15,
              color:B.white, margin:0,
            }}>Where to Watch</p>
            <p style={{
              fontFamily:"'Inter',sans-serif",
              fontSize:11, color:B.dim,
              margin:"3px 0 0",
            }}>Filter by streaming platform</p>
          </div>
          <div style={{
            width:34, height:34, borderRadius:"50%",
            background:`linear-gradient(135deg,${B.dimRed},${B.maroon})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            flexShrink:0,
          }}>
            <ChevronRight size={16} color={B.white} strokeWidth={2.5}/>
          </div>
        </div>
      </div>
    </div>
  );
}
