═══════════════════════════════════════════════════════════════════
MANDATORY REDESIGN & STABILIZATION — STREAMING PLATFORM
═══════════════════════════════════════════════════════════════════

ROLE: Senior Frontend Engineer + UI/UX Designer. You must COMPLETELY
REBUILD this streaming website from scratch. Not tweak. Not patch.
REBUILD. Every page, every component, every interaction.

❌ NOT ACCEPTABLE:
   - Changing colors and calling it done
   - Tweaking existing components
   - Using emojis (❌) instead of proper icon components
   - Half-finished features
   - Broken mobile layout

✅ MUST DELIVER:
   - Every page rebuilt with NEW layout, NEW components, NEW structure
   - Professional icon library (Lucide React or Phosphor Icons)
   - Cinematic hero, beautiful cards, glassmorphism nav
   - Bug-free, ghost-touch-free, dead-code-free codebase
   - Flawless mobile browser experience
   - Polished desktop experience
   - Zero lag, zero jank, zero bloat

═══════════════════════════════════════════════════════════════════
PHASE 0: FULL AUDIT — DO THIS FIRST
═══════════════════════════════════════════════════════════════════

□ STEP 0.1 — FILE INVENTORY
  List EVERY file. Categorize: Active / Dead / Unknown / Duplicate.
  Flag files with zero imports anywhere.

□ STEP 0.2 — DEPENDENCY AUDIT
  Check package.json. List unused packages. Run npm audit.
  Flag security vulnerabilities.

□ STEP 0.3 — ROUTE & API AUDIT
  Map every frontend route → does it render? Does it have purpose?
  Map every backend endpoint → is it called? Does it work?
  DELETE unused routes and endpoints.

□ STEP 0.4 — CONSOLE & NETWORK AUDIT
  Open browser DevTools. Document EVERY error, warning, 404, failed fetch.
  Document layout shifts, FOUC, jank.

□ STEP 0.5 — PERFORMANCE AUDIT
  Run Lighthouse. Target: 90+ all categories.
  Check Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1.

□ STEP 0.6 — MOBILE AUDIT
  Chrome DevTools → Device Mode → iPhone 14 Pro & Pixel 7.
  Document every overflow, broken layout, tiny touch target, missing hover alt.

□ STEP 0.7 — REPORT
  Write full audit report. Do NOT proceed until complete.

═══════════════════════════════════════════════════════════════════
PHASE 1: PURGE — DELETE ALL DEAD WEIGHT
═══════════════════════════════════════════════════════════════════

□ STEP 1.1 — DELETE DEAD CODE
  Remove commented-out blocks, unused imports, variables, console.logs,
  debugger statements, temp test code, components with zero references.

□ STEP 1.2 — DELETE DEAD BACKEND
  Remove unused API endpoints, middleware, models, schemas, utility files.
  Clean environment variables.

□ STEP 1.3 — DELETE DEAD ASSETS
  Remove unreferenced images, fonts, videos. Remove duplicates.
  Remove placeholder/test assets.

□ STEP 1.4 — DELETE DEAD DEPENDENCIES
  Uninstall unused packages. Replace bloated libraries:
  - moment.js → date-fns or native Intl
  - lodash full → specific lodash imports
  - Heavy animation libs → CSS transitions or Framer Motion

□ STEP 1.5 — DELETE DEAD STYLES
  Remove unused CSS classes, keyframes, variables.
  Remove CSS for deleted components. Consolidate duplicates.

═══════════════════════════════════════════════════════════════════
PHASE 2: BUG FIX — ELIMINATE ALL GLITCHES
═══════════════════════════════════════════════════════════════════

□ STEP 2.1 — FIX ALL CONSOLE ERRORS
  React key warnings, prop-types/TS errors, null/undefined access,
  memory leaks (unsubscribed listeners, uncleared intervals).

□ STEP 2.2 — FIX NETWORK FAILURES
  404 API calls, CORS issues, auth/token expiration, error boundaries,
  fallback UI for failed requests.

□ STEP 2.3 — FIX RENDERING BUGS
  FOUC, layout shifts, z-index wars, mobile overflow, sticky overlap.

□ STEP 2.4 — FIX INTERACTION BUGS
  - Buttons with no click feedback
  - Broken form validation
  - Modals without focus trap or Escape close
  - Hover states on touch devices
  - GHOST TOUCH: check event bubbling, z-index, pointer-events,
    invisible overlays, touch-action: manipulation

□ STEP 2.5 — FIX MEDIA PLAYER BUGS
  Unresponsive controls, autoplay policies, buffering states,
  fullscreen toggle, subtitle sync, quality selector, PiP.

□ STEP 2.6 — FIX AUTHENTICATION
  Login/register validation, token refresh, protected routes,
  remember me, password reset end-to-end.

═══════════════════════════════════════════════════════════════════
PHASE 3: COMPLETE FRONTEND REDESIGN — NEW EVERYTHING
═══════════════════════════════════════════════════════════════════

⚠️ CRITICAL: You are REBUILDING, not tweaking.
Every component must be NEW — different layout, structure, styling.

═══════════════════════════════════════════════════════════════════
ICON LIBRARY — USE PROFESSIONAL ICONS, NEVER EMOJIS
═══════════════════════════════════════════════════════════════════

INSTALL ONE OF THESE (pick based on your stack):
  npm install lucide-react        ← RECOMMENDED (clean, modern)
  OR
  npm install @phosphor-icons/react  ← (more weight options)

NEVER USE EMOJIS FOR UI ELEMENTS. EVER.

ICON MAPPING (use these exact icons):
  Play:          <Play /> from lucide-react
  Pause:         <Pause />
  SkipBack:      <SkipBack />
  SkipForward:   <SkipForward />
  Volume2:       <Volume2 />
  VolumeX:       <VolumeX />
  Maximize:      <Maximize />
  Minimize:      <Minimize />
  Settings:      <Settings />
  Search:        <Search />
  Bell:          <Bell />
  User:          <User />
  Plus:          <Plus />
  Check:         <Check />
  X:             <X />
  ChevronLeft:   <ChevronLeft />
  ChevronRight:  <ChevronRight />
  ChevronDown:   <ChevronDown />
  Home:          <Home />
  Film:          <Film />
  Tv:            <Tv />
  Heart:         <Heart />
  ThumbsUp:      <ThumbsUp />
  ThumbsDown:    <ThumbsDown />
  Info:          <Info />
  List:          <List />
  Clock:         <Clock />
  Star:          <Star />
  MoreHorizontal:<MoreHorizontal />
  Cast:          <Cast />
  Subtitles:     <Subtitles />

═══════════════════════════════════════════════════════════════════
DESIGN SYSTEM — ZERO DEVIATION
═══════════════════════════════════════════════════════════════════

  PRIMARY PALETTE:
  ─────────────────
  Background Primary:   #0A0A0A
  Background Secondary: #141414
  Background Tertiary:  #1A1A1A
  Surface Glass:        rgba(255, 255, 255, 0.03)
  
  TEXT:
  ─────────────────
  Text Primary:         #FFFFFF
  Text Secondary:       #A3A3A3
  Text Tertiary:        #737373
  Text Disabled:        #525252
  
  ACCENTS:
  ─────────────────
  Accent:               #FFFFFF
  Accent Hover:         rgba(255, 255, 255, 0.1)
  Border Subtle:        rgba(255, 255, 255, 0.08)
  Border Hover:         rgba(255, 255, 255, 0.15)
  
  GLASSMORPHISM:
  ─────────────────
  backdrop-filter: blur(12px) to blur(24px)
  background: rgba(255, 255, 255, 0.03) to rgba(255, 255, 255, 0.08)
  border: 1px solid rgba(255, 255, 255, 0.08)
  
  SHADOWS:
  ─────────────────
  Soft diffuse only: 0 8px 32px rgba(0, 0, 0, 0.4)

  TYPOGRAPHY:
  ─────────────────
  Font: 'Inter', system-ui, -apple-system, sans-serif
  Hero:     48px, 700, -0.02em tracking
  H1:       32px, 700
  H2:       24px, 600
  Body:     16px, 400, 1.6 line-height
  Caption:  14px, 400
  Small:    12px, 400

  SPACING (8px base):
  ─────────────────
  xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | 2xl: 48px | 3xl: 64px

  BORDER RADIUS:
  ─────────────────
  sm: 4px | md: 8px | lg: 12px | xl: 16px | full: 9999px

  ANIMATIONS:
  ─────────────────
  Duration: 200ms-300ms max
  Easing: cubic-bezier(0.4, 0, 0.2, 1)
  Respect prefers-reduced-motion

═══════════════════════════════════════════════════════════════════
NEW COMPONENT ARCHITECTURE — BUILD ALL OF THESE
═══════════════════════════════════════════════════════════════════

/src
  /components
    /layout
      TopNav.jsx          ← Glassmorphism, minimal, 64px height
      Sidebar.jsx         ← Collapsible, icon-only default, mobile drawer
      BottomPlayer.jsx    ← Persistent mini player, 80px height
    /sections
      HeroSection.jsx     ← Full viewport, cinematic, gradient overlay
      ContentRow.jsx      ← Horizontal scroll with navigation arrows
      CategoryGrid.jsx    ← Grid layout for browse
      TopTenRow.jsx       ← Large numbers behind posters
    /ui
      ContentCard.jsx     ← NEW design: poster + hover info overlay
      PlayButton.jsx      ← Circular, minimal, 48px
      GlassCard.jsx       ← Reusable glassmorphism wrapper
      SearchBar.jsx       ← Expandable, clean, mobile-optimized
      Avatar.jsx          ← User profile, dropdown menu
      SkeletonCard.jsx    ← Loading placeholder matching card shape
      FilterPill.jsx      ← Glassmorphism filter buttons
      ProgressBar.jsx     ← Thin, elegant, clickable
      IconButton.jsx      ← Reusable icon button with hover states
    /player
      VideoPlayer.jsx     ← Custom controls overlay (NOT browser default)
      PlayerControls.jsx  ← Play/pause/seek/volume/fullscreen/quality
      PlayerProgress.jsx  ← Thin bar, buffered indicator, hover expand
      QualityMenu.jsx     ← Glass dropdown
      VolumeControl.jsx   ← Slider, mute toggle
  /hooks
    useScrollDirection.js  ← For nav hide/show on scroll
    useMediaQuery.js       ← Responsive breakpoints
    useClickOutside.js     ← For dropdowns/modals
  /styles
    design-tokens.css      ← All tokens in one place
    animations.css         ← Shared transitions
  /pages
    Home.jsx               ← NEW layout
    Browse.jsx             ← NEW layout
    Watch.jsx              ← NEW layout
    Profile.jsx            ← NEW layout

═══════════════════════════════════════════════════════════════════
NEW PAGE DESIGNS — REBUILD EACH FROM SCRATCH
═══════════════════════════════════════════════════════════════════

□ HOME PAGE — NEW LAYOUT
  ┌─────────────────────────────────────────┐
  │  [LOGO]  [Search→]        [Bell] [👤]   │  ← TopNav, glass on scroll
  ├─────────────────────────────────────────┤
  │                                         │
  │         HERO SECTION (100vh)            │
  │    ┌─────────────────────────────┐      │
  │    │  Background: Featured Image   │      │
  │    │  Title (48px, bold, white)  │      │
  │    │  Description (16px, grey)   │      │
  │    │  [▶ Play] [ℹ More Info]     │      │
  │    │  Gradient fade to black     │      │
  │    └─────────────────────────────┘      │
  │                                         │
  ├─────────────────────────────────────────┤
  │  Trending Now →                         │
  │  [Poster][Poster][Poster][Poster]...   │
  ├─────────────────────────────────────────┤
  │  Continue Watching →                    │
  │  [Poster w/ progress][Poster]...       │
  ├─────────────────────────────────────────┤
  │  Top 10 Today →                         │
  │  [1][2][3][4][5]... (large numbers)    │
  ├─────────────────────────────────────────┤
  │  Categories →                           │
  │  [Action] [Drama] [Comedy] [Sci-Fi]     │
  ├─────────────────────────────────────────┤
  │  New Releases →                         │
  │  [Poster w/ NEW badge]...               │
  ├─────────────────────────────────────────┤
  │  [▶] Title ─────●─── [⛶] [⚙] [🔊]     │  ← BottomPlayer always visible
  └─────────────────────────────────────────┘

  NOTE: [▶] [⛶] [⚙] [🔊] are PLACEHOLDERS for actual Lucide icons:
  <Play />, <Maximize />, <Settings />, <Volume2 />

  MOBILE HOME:
  - TopNav: Logo + Search icon + Profile (hamburger if needed)
  - Hero: 70vh, larger tap targets for buttons
  - Rows: Horizontal scroll with snap, 2 cards visible
  - Categories: 2-column grid
  - BottomPlayer: 64px, minimal controls

□ BROWSE PAGE — NEW LAYOUT
  ┌─────────────────────────────────────────┐
  │  [LOGO]  [Search]        [Profile]      │
  ├─────────────────────────────────────────┤
  │  [All ▼] [Genre ▼] [Year ▼] [Sort ▼]  │  ← Filter bar, glass pills
  ├─────────────────────────────────────────┤
  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
  │  │    │ │    │ │    │ │    │          │  ← 4-col desktop, 3 tablet, 2 mobile
  │  └────┘ └────┘ └────┘ └────┘          │
  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
  │  │    │ │    │ │    │ │    │          │
  │  └────┘ └────┘ └────┘ └────┘          │
  │         [1] [2] [3] ... [Next]         │  ← Pagination, clean
  └─────────────────────────────────────────┘

  MOBILE BROWSE:
  - Filters: Horizontal scroll, pill buttons
  - Grid: 2 columns, 16px gap
  - Infinite scroll OR load more button

□ WATCH PAGE — NEW LAYOUT
  ┌─────────────────────────────────────────┐
  │                                         │
  │         VIDEO PLAYER (100% width)       │
  │    Custom controls overlay (NOT default)  │
  │    [▶] [───●────] [⛶] [⚙] [🔊]       │
  │                                         │
  ├─────────────────────────────────────────┤
  │  Title (32px, bold)                     │
  │  2024 • ★ 8.5 • 2h 15m • Action, Drama  │
  │  Description (expandable, 3 lines)      │
  │                                         │
  │  [▶ Play] [+ My List] [👍] [👎]        │
  │                                         │
  │  More Like This →                       │
  │  [Poster][Poster][Poster]               │
  └─────────────────────────────────────────┘

  NOTE: [▶] [+] [👍] [👎] are PLACEHOLDERS for:
  <Play />, <Plus />, <ThumbsUp />, <ThumbsDown />

  PLAYER CONTROLS (CUSTOM — NOT BROWSER DEFAULT):
  - Bottom bar: play/pause | prev/next | progress | time | volume | settings | fullscreen
  - Progress bar: 4px default, 8px on hover, white fill, grey track
  - Big play button center, fades on play
  - Settings: quality, speed, subtitles (glass dropdown)
  - Hide after 3s inactivity, show on mouse move or tap
  - Mobile: Larger controls (44px min), swipe gestures for seek/volume

□ PROFILE PAGE — NEW LAYOUT
  ┌─────────────────────────────────────────┐
  │  [Large Avatar]                         │
  │  Username                               │
  │  email@example.com                      │
  │  [Edit Profile] [Settings]              │
  ├─────────────────────────────────────────┤
  │  ─── Watch History ───                  │
  │  [Horizontal scroll of thumbnails]      │
  ├─────────────────────────────────────────┤
  │  ─── My List ───                        │
  │  [Grid or horizontal scroll]            │
  ├─────────────────────────────────────────┤
  │  ─── Account ───                        │
  │  [Change Password] [Delete Account]     │
  └─────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
COMPONENT SPECS — BUILD EXACTLY LIKE THIS
═══════════════════════════════════════════════════════════════════

□ ContentCard
  Default:
  ┌────────────────────────┐
  │ ┌────────────────────┐ │
  │ │   Poster Image     │ │  ← aspect-ratio 2:3 or 16:9, object-fit cover
  │ │                    │ │
  │ │                    │ │
  │ └────────────────────┘ │
  │ Title Name             │  ← 14px, white, truncate
  │ 2024 • ★ 8.5           │  ← 12px, #737373
  └────────────────────────┘

  Hover (Desktop):
  ┌────────────────────────┐
  │ ┌────────────────────┐ │
  │ │   <Play /> (center)│ │  ← 48px play icon, white, opacity 0.9
  │ │                    │ │
  │ │  Title Name        │ │  ← Slides up from bottom
  │ │  <Plus />  <Info />│ │  ← Quick actions with Lucide icons
  │ └────────────────────┘ │
  └────────────────────────┘
  - Scale: 1.05, transition 300ms
  - Shadow: 0 12px 40px rgba(0,0,0,0.5)

  Mobile (NO HOVER — TAP INSTEAD):
  - Tap card → shows info overlay or navigates to watch page
  - Long press → add to list option
  - Touch target: minimum 44px for any interactive element

□ TopNav
  - 64px height
  - Default: transparent
  - Scrolled (>50px): glassmorphism (blur 12px, bg rgba(10,10,10,0.8))
  - Left: Logo (white, 24px bold)
  - Center: Search icon (expands to input on click/tap)
  - Right: <Bell /> notification, Profile avatar (32px circle, dropdown)
  - Links: Home, Browse, My List (14px, #A3A3A3, white on active)

  Mobile:
  - Logo + Search icon + Hamburger menu
  - Hamburger opens full-screen menu (glassmorphism)
  - Menu items: large tap targets (56px min height)

□ BottomPlayer
  - 80px desktop, 64px mobile
  - Background: #0A0A0A, border-top rgba(255,255,255,0.05)
  - Left: Thumbnail 48px, Title 14px white, Creator 12px grey
  - Center: <SkipBack />, <Play />, <SkipForward /> (40px circle, white bg, black icon)
  - Right: Progress bar, Time, <Volume2 />, <List />, <Maximize />
  - Progress: clickable, draggable, buffered indicator

  Mobile:
  - Collapse to mini: Thumbnail + Title + Play button
  - Expand on tap to full controls
  - Swipe up to expand, swipe down to minimize

□ HeroSection
  - 100vh desktop, 70vh mobile
  - Background: featured content image/video (muted, dark overlay)
  - Overlay: linear-gradient(to top, #0A0A0A, transparent 50%, rgba(0,0,0,0.3))
  - Content: bottom-left, padding 48px desktop, 24px mobile
  - Title: 48px desktop, 32px mobile, bold, white, max-width 600px
  - Description: 16px, #A3A3A3, max-width 500px, 3 lines
  - Buttons: 
    Play: white bg, black text, <Play /> icon left of text
    More Info: transparent, white border, <Info /> icon left of text
  - Mobile: Stack buttons vertically, full-width

□ GlassCard (Reusable)
  - bg: rgba(255,255,255,0.03)
  - backdrop-filter: blur(16px)
  - border: 1px solid rgba(255,255,255,0.08)
  - border-radius: 12px
  - padding: 24px
  - hover: bg rgba(255,255,255,0.06), border rgba(255,255,255,0.12)

□ IconButton (Reusable)
  - Size: 40px x 40px (44px on mobile)
  - Border-radius: full (circle) or md (rounded)
  - Default: transparent bg, white icon at 70% opacity
  - Hover: bg rgba(255,255,255,0.1), icon at 100% opacity
  - Active: scale(0.95)
  - Focus: ring-2 ring-white/20
  - Use for: player controls, nav actions, card actions

═══════════════════════════════════════════════════════════════════
RESPONSIVE BREAKPOINTS — MOBILE FIRST
═══════════════════════════════════════════════════════════════════

  Base:     0px+    (Mobile)
  sm:       640px+  (Large phones)
  md:       768px+  (Tablets)
  lg:       1024px+ (Small laptops)
  xl:       1280px+ (Desktops)

  RULES:
  - Touch targets: minimum 44x44px everywhere
  - Horizontal scroll rows: snap to start, scroll-snap-type: x mandatory
  - No horizontal page overflow ever
  - Font sizes scale down 10-20% on mobile
  - Padding reduces by ~50% on mobile
  - Bottom player collapses on mobile
  - Navigation becomes hamburger on mobile
  - Grid columns: 2 mobile, 3 tablet, 4 desktop

═══════════════════════════════════════════════════════════════════
PHASE 4: PERFORMANCE OPTIMIZATION
═══════════════════════════════════════════════════════════════════

□ CODE SPLITTING
  - Lazy load all routes (React.lazy / dynamic imports)
  - Lazy load player component
  - Preload critical resources

□ ASSET OPTIMIZATION
  - Images: WebP/AVIF with fallbacks, srcset for responsive
  - Lazy load below-fold images
  - Videos: adaptive bitrate (HLS/DASH) or optimized MP4

□ RENDER OPTIMIZATION
  - React.memo on expensive components
  - useMemo / useCallback where needed
  - Virtualize long lists (react-window)
  - Debounce search (300ms)
  - Throttle scroll events

□ BACKEND OPTIMIZATION
  - Query caching (Redis or in-memory)
  - Fix N+1 queries
  - Pagination on all list endpoints
  - Compress responses (gzip/brotli)
  - Rate limiting

□ CACHING
  - Service Worker for static assets
  - API response caching with TTL
  - Stale-while-revalidate for content lists

═══════════════════════════════════════════════════════════════════
PHASE 5: TESTING & VALIDATION — ZERO TOLERANCE
═══════════════════════════════════════════════════════════════════

□ VISUAL QA (Check EVERY page, EVERY breakpoint)
  [ ] No layout breaks at any size
  [ ] No text overflow or bad truncation
  [ ] All images load, correct aspect ratios
  [ ] No random whitespace or misalignment
  [ ] Consistent spacing (use ruler if needed)
  [ ] All interactive elemen
