import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dns from "dns";

// For potential DNS issues in sandboxes
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize environment variables
import dotenv from "dotenv";
dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

// Simple In-Memory Cache with TTL
interface CacheEntry {
  data: any;
  expiry: number;
}
const apiCache = new Map<string, CacheEntry>();
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

function getCached(key: string): any | null {
  const entry = apiCache.get(key);
  if (entry && entry.expiry > Date.now()) {
    return entry.data;
  }
  return null;
}

function setCached(key: string, data: any) {
  apiCache.set(key, {
    data,
    expiry: Date.now() + CACHE_TTL,
  });
}

// Rich Fallback/Mock Dataset to guarantee 100% functionality out-of-the-box
const fallbackMovies = [
  {
    id: "f-1",
    type: "movie",
    title: "Dune: Part Two",
    backdrop_path: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600",
    poster_path: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600",
    overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.",
    release_date: "2024-03-01",
    vote_average: 8.5,
    vote_count: 4200,
    runtime: 166,
    genres: ["Sci-Fi", "Adventure", "Action"],
    youtube_id: "Way9Dexny3w",
    age_rating: "PG-13",
    match_percentage: 98,
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Austin Butler", "Florence Pugh"]
  },
  {
    id: "f-2",
    type: "movie",
    title: "Oppenheimer",
    backdrop_path: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600",
    poster_path: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=600",
    overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, tracing his journey from scientific triumph to political tragedy.",
    release_date: "2023-07-21",
    vote_average: 8.9,
    vote_count: 7800,
    runtime: 180,
    genres: ["Drama", "History", "Biography"],
    youtube_id: "uYPbbksJxIg",
    age_rating: "R",
    match_percentage: 96,
    cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr.", "Florence Pugh"]
  },
  {
    id: "f-3",
    type: "movie",
    title: "Spider-Man: Across the Spider-Verse",
    backdrop_path: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=1600",
    poster_path: "https://images.unsplash.com/photo-1608889174637-3c44f6326f2a?q=80&w=600",
    overview: "After reuniting with Gwen Stacy, Brooklyn's full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
    release_date: "2023-06-02",
    vote_average: 8.7,
    vote_count: 5100,
    runtime: 140,
    genres: ["Animation", "Sci-Fi", "Action"],
    youtube_id: "shW9i6k8cB0",
    age_rating: "PG",
    match_percentage: 95,
    cast: ["Shameik Moore", "Hailee Steinfeld", "Oscar Isaac", "Jake Johnson", "Jason Schwartzman"]
  },
  {
    id: "f-4",
    type: "movie",
    title: "Interstellar",
    backdrop_path: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1600",
    poster_path: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600",
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    release_date: "2014-11-07",
    vote_average: 8.6,
    vote_count: 19500,
    runtime: 169,
    genres: ["Sci-Fi", "Drama", "Adventure"],
    youtube_id: "zSWdZAIBXBY",
    age_rating: "PG-13",
    match_percentage: 94,
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine", "Matt Damon"]
  },
  {
    id: "f-5",
    type: "tv",
    title: "Succession",
    backdrop_path: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600",
    poster_path: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600",
    overview: "The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their father steps down.",
    first_air_date: "2018-06-03",
    vote_average: 8.3,
    vote_count: 3200,
    number_of_seasons: 4,
    genres: ["Drama", "Comedy"],
    youtube_id: "OzYxJV_JH3M",
    age_rating: "TV-MA",
    match_percentage: 97,
    cast: ["Brian Cox", "Jeremy Strong", "Sarah Snook", "Kieran Culkin", "Matthew Macfadyen"]
  },
  {
    id: "f-6",
    type: "tv",
    title: "Severance",
    backdrop_path: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600",
    poster_path: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=600",
    overview: "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their jobs.",
    first_air_date: "2022-02-18",
    vote_average: 8.4,
    vote_count: 1400,
    number_of_seasons: 2,
    genres: ["Sci-Fi", "Thriller", "Mystery"],
    youtube_id: "xKTg6_7VfT4",
    age_rating: "TV-MA",
    match_percentage: 92,
    cast: ["Adam Scott", "Patricia Arquette", "John Turturro", "Britt Lower", "Christopher Walken"]
  },
  {
    id: "f-7",
    type: "movie",
    title: "The Dark Knight",
    backdrop_path: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1600",
    poster_path: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600",
    overview: "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.",
    release_date: "2008-07-18",
    vote_average: 8.8,
    vote_count: 31000,
    runtime: 152,
    genres: ["Action", "Crime", "Thriller"],
    youtube_id: "LDG9bisJEaI",
    age_rating: "PG-13",
    match_percentage: 99,
    cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Maggie Gyllenhaal", "Gary Oldman"]
  },
  {
    id: "f-8",
    type: "movie",
    title: "Everything Everywhere All at Once",
    backdrop_path: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600",
    poster_path: "https://images.unsplash.com/photo-1569074187119-c87815b476da?q=80&w=600",
    overview: "An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes connecting with the lives she could have led.",
    release_date: "2022-03-24",
    vote_average: 8.1,
    vote_count: 5500,
    runtime: 139,
    genres: ["Sci-Fi", "Action", "Comedy", "Adventure"],
    youtube_id: "wxN1T1uxQ2g",
    age_rating: "R",
    match_percentage: 90,
    cast: ["Michelle Yeoh", "Ke Huy Quan", "Stephanie Hsu", "Jamie Lee Curtis", "James Hong"]
  },
  {
    id: "f-9",
    type: "tv",
    title: "Stranger Things",
    backdrop_path: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600",
    poster_path: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600",
    overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
    first_air_date: "2016-07-15",
    vote_average: 8.6,
    vote_count: 16000,
    number_of_seasons: 4,
    genres: ["Sci-Fi", "Drama", "Mystery"],
    youtube_id: "b9EkMc79ZSU",
    age_rating: "TV-14",
    match_percentage: 95,
    cast: ["Winona Ryder", "David Harbour", "Millie Bobby Brown", "Finn Wolfhard", "Gaten Matarazzo"]
  },
  {
    id: "f-10",
    type: "tv",
    title: "The Last of Us",
    backdrop_path: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600",
    poster_path: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
    overview: "Twenty years after modern civilization has been destroyed, Joel, a hardened survivor, is hired to smuggle Ellie, a 14-year-old girl, out of an oppressive quarantine zone.",
    first_air_date: "2023-01-15",
    vote_average: 8.6,
    vote_count: 4500,
    number_of_seasons: 1,
    genres: ["Action", "Adventure", "Drama"],
    youtube_id: "gGoO9_Wv3uM",
    age_rating: "TV-MA",
    match_percentage: 94,
    cast: ["Pedro Pascal", "Bella Ramsey", "Gabriel Luna", "Anna Torv", "Merle Dandridge"]
  },
  {
    id: "f-11",
    type: "movie",
    title: "Blade Runner 2049",
    backdrop_path: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1600",
    poster_path: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600",
    overview: "A new blade runner, Los Angeles Police Department Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos.",
    release_date: "2017-10-06",
    vote_average: 8.5,
    vote_count: 12000,
    runtime: 164,
    genres: ["Sci-Fi", "Action", "Thriller"],
    youtube_id: "gCcx85zlyz4",
    age_rating: "R",
    match_percentage: 91,
    cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas", "Sylvia Hoeks", "Robin Wright"]
  },
  {
    id: "f-12",
    type: "tv",
    title: "Breaking Bad",
    backdrop_path: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=1600",
    poster_path: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
    overview: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family's future.",
    first_air_date: "2008-01-20",
    vote_average: 9.5,
    vote_count: 13000,
    number_of_seasons: 5,
    genres: ["Drama", "Crime"],
    youtube_id: "HhesaQXLuRY",
    age_rating: "TV-MA",
    match_percentage: 99,
    cast: ["Bryan Cranston", "Aaron Paul", "Anna Gunn", "Bob Odenkirk", "Dean Norris"]
  },
  {
    id: "f-13",
    type: "movie",
    title: "Inception",
    backdrop_path: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1600",
    poster_path: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600",
    overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    release_date: "2010-07-16",
    vote_average: 8.3,
    vote_count: 35000,
    runtime: 148,
    genres: ["Action", "Sci-Fi", "Adventure"],
    youtube_id: "YoHD9XEInc0",
    age_rating: "PG-13",
    match_percentage: 97,
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy", "Ken Watanabe"]
  },
  {
    id: "f-14",
    type: "movie",
    title: "Mad Max: Fury Road",
    backdrop_path: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600",
    poster_path: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600",
    overview: "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners, a psychotic worshiper, and a drifter named Max.",
    release_date: "2015-05-15",
    vote_average: 7.6,
    vote_count: 21000,
    runtime: 120,
    genres: ["Action", "Adventure", "Sci-Fi"],
    youtube_id: "hEJnMQG96JI",
    age_rating: "R",
    match_percentage: 93,
    cast: ["Tom Hardy", "Charlize Theron", "Nicholas Hoult", "Hugh Keays-Byrne", "Rosie Huntington-Whiteley"]
  }
];

// Helper to fetch TMDB endpoint or fallback
async function fetchTMDB(endpoint: string, params: string = "") {
  if (!TMDB_API_KEY) {
    return null;
  }
  const url = `https://api.themoviedb.org/3${endpoint}?api_key=${TMDB_API_KEY}&language=en-US${params}`;
  
  const cacheKey = `tmdb_${endpoint}_${params}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`TMDB API returned non-200 status: ${res.status}`);
      return null;
    }
    const data = await res.json();
    setCached(cacheKey, data);
    return data;
  } catch (err) {
    console.error(`TMDB fetch error at ${endpoint}:`, err);
    return null;
  }
}

// Convert TMDB movie to standard format
function normalizeTMDBMovie(item: any, type: "movie" | "tv"): any {
  const genresMap: Record<number, string> = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
    99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
    27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
    10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
    10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality",
    10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics"
  };

  const itemGenres = (item.genre_ids || [])
    .map((id: number) => genresMap[id])
    .filter(Boolean);

  const voteAverage = item.vote_average || 7.0;
  const matchPercentage = Math.min(100, Math.max(50, Math.round(voteAverage * 10 + (item.id % 10))));

  return {
    id: String(item.id),
    type: type,
    title: item.title || item.name || "",
    backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600",
    poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600",
    overview: item.overview || "",
    release_date: item.release_date || "",
    first_air_date: item.first_air_date || "",
    vote_average: voteAverage,
    vote_count: item.vote_count || 0,
    genres: itemGenres.length ? itemGenres : ["Entertainment"],
    age_rating: type === "movie" ? "PG-13" : "TV-14",
    match_percentage: matchPercentage,
    youtube_id: "" // To be fetched dynamically via /api/movies/videos/:type/:id
  };
}

// API CONFIG ENDPOINT
app.get("/api/config", (req, res) => {
  res.json({
    supabaseActive: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
    tmdbActive: !!TMDB_API_KEY,
    appName: "Allrated"
  });
});

// TRENDING
app.get("/api/movies/trending", async (req, res) => {
  const tmdbData = await fetchTMDB("/trending/all/week");
  if (tmdbData && tmdbData.results) {
    const normalized = tmdbData.results.map((item: any) => 
      normalizeTMDBMovie(item, item.media_type === "tv" ? "tv" : "movie")
    );
    return res.json(normalized);
  }
  return res.json(fallbackMovies.slice(0, 8));
});

// TOP RATED
app.get("/api/movies/top-rated", async (req, res) => {
  const tmdbData = await fetchTMDB("/movie/top_rated");
  if (tmdbData && tmdbData.results) {
    const normalized = tmdbData.results.map((item: any) => 
      normalizeTMDBMovie(item, "movie")
    );
    return res.json(normalized);
  }
  return res.json(fallbackMovies.filter(m => m.vote_average >= 8.4));
});

// NEW RELEASES
app.get("/api/movies/new-releases", async (req, res) => {
  const tmdbData = await fetchTMDB("/movie/upcoming");
  if (tmdbData && tmdbData.results) {
    const normalized = tmdbData.results.map((item: any) => 
      normalizeTMDBMovie(item, "movie")
    );
    return res.json(normalized);
  }
  return res.json(fallbackMovies.slice().reverse());
});

// BY GENRE
app.get("/api/movies/genre/:genreName", async (req, res) => {
  const genreName = req.params.genreName;
  
  // Standard TMDB IDs for some genres
  const genreIds: Record<string, number> = {
    "Action": 28,
    "Sci-Fi": 878,
    "Drama": 18,
    "Thriller": 53,
    "Comedy": 35
  };

  const gId = genreIds[genreName];
  if (gId) {
    const tmdbData = await fetchTMDB("/discover/movie", `&with_genres=${gId}`);
    if (tmdbData && tmdbData.results) {
      const normalized = tmdbData.results.map((item: any) => 
        normalizeTMDBMovie(item, "movie")
      );
      return res.json(normalized);
    }
  }

  // Fallback
  const filtered = fallbackMovies.filter(m => m.genres.includes(genreName));
  return res.json(filtered.length ? filtered : fallbackMovies.slice(0, 6));
});

// RECOMMENDATIONS
app.get("/api/movies/recommendations/:type/:id", async (req, res) => {
  const { type, id } = req.params;
  
  if (id.startsWith("f-")) {
    // Return a random set of fallback movies excluding the current one
    const recommendations = fallbackMovies
      .filter(m => m.id !== id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 6);
    return res.json(recommendations);
  }

  const tmdbData = await fetchTMDB(`/${type}/${id}/recommendations`);
  if (tmdbData && tmdbData.results) {
    const normalized = tmdbData.results.slice(0, 6).map((item: any) => 
      normalizeTMDBMovie(item, type as "movie" | "tv")
    );
    return res.json(normalized);
  }

  // Similar fallback
  const tmdbSimilar = await fetchTMDB(`/${type}/${id}/similar`);
  if (tmdbSimilar && tmdbSimilar.results) {
    const normalized = tmdbSimilar.results.slice(0, 6).map((item: any) => 
      normalizeTMDBMovie(item, type as "movie" | "tv")
    );
    return res.json(normalized);
  }

  return res.json(fallbackMovies.slice(0, 6));
});

// VIDEOS (TRAILERS)
app.get("/api/movies/videos/:type/:id", async (req, res) => {
  const { type, id } = req.params;

  if (id.startsWith("f-")) {
    const movie = fallbackMovies.find(m => m.id === id);
    return res.json({ youtube_id: movie?.youtube_id || "Way9Dexny3w" });
  }

  const tmdbData = await fetchTMDB(`/${type}/${id}/videos`);
  if (tmdbData && tmdbData.results) {
    const videos = tmdbData.results;
    // Look for YouTube trailers
    const trailer = videos.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
    const teaser = videos.find((v: any) => v.site === "YouTube" && (v.type === "Teaser" || v.type === "Clip"));
    const anyVideo = videos.find((v: any) => v.site === "YouTube");

    const key = trailer?.key || teaser?.key || anyVideo?.key || "";
    return res.json({ youtube_id: key });
  }

  return res.json({ youtube_id: "" });
});

// SEARCH
app.get("/api/movies/search", async (req, res) => {
  const query = req.query.q as string || "";
  if (!query) return res.json([]);

  const tmdbData = await fetchTMDB("/search/multi", `&query=${encodeURIComponent(query)}`);
  if (tmdbData && tmdbData.results) {
    const normalized = tmdbData.results
      .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
      .map((item: any) => normalizeTMDBMovie(item, item.media_type as "movie" | "tv"));
    return res.json(normalized);
  }

  // Search in fallback
  const filtered = fallbackMovies.filter(m => 
    m.title.toLowerCase().includes(query.toLowerCase()) || 
    m.overview.toLowerCase().includes(query.toLowerCase()) ||
    m.genres.some(g => g.toLowerCase().includes(query.toLowerCase()))
  );
  return res.json(filtered);
});

// PROXY EXTERNAL PROVIDERS CONFIG
app.get("/api/streaming/providers", async (req, res) => {
  try {
    const response = await fetch("https://raw.githubusercontent.com/Anshu78780/json/main/providers.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch providers: ${response.statusText}`);
    }
    const data = await response.json();
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error("Error fetching dynamic providers:", err);
    return res.json({
      success: false,
      error: err.message,
      fallback: {
        "4kHDHub": { "name": "4kHDHub", "url": "https://4khdhub.one/" },
        "nfMirror": { "name": "nfMirror", "url": "https://net22.cc/" },
        "rive": { "name": "rive", "url": "https://watch.rivestream.app/" },
        "kissKh": { "name": "kissKh", "url": "https://kisskh.ws/" },
        "Vega": { "name": "vegamovies", "url": "https://vegamovies.navy/" }
      }
    });
  }
});

// PROXY EXTERNAL SERVERS CONFIG
app.get("/api/streaming/servers", async (req, res) => {
  try {
    const response = await fetch("https://raw.githubusercontent.com/Anshu78780/json/main/servers.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch servers: ${response.statusText}`);
    }
    const data = await response.json();
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error("Error fetching dynamic servers:", err);
    return res.json({
      success: false,
      error: err.message,
      fallback: [
        {
          "name": "Scape",
          "label": "Scape",
          "flag": "🇮🇳 🇺🇸",
          "isEmbed": true,
          "embedUrl": "https://nxsha.screenscape.me/embed"
        }
      ]
    });
  }
});

// PROXY NETMIRROR HOME
app.get("/api/netmirror", async (req, res) => {
  const apiKey = process.env.NETMIRROR_API_KEY || req.headers["x-api-key"] as string || "sk_tLF8DC2Fcjp0mW1KlwPgpdZeVIrjocyH";
  
  let baseUrl = process.env.NETMIRROR_API_URL;
  if (!baseUrl) {
    if (apiKey && apiKey.startsWith("sk_")) {
      baseUrl = "https://screenscapeapi.dev";
    } else {
      baseUrl = "https://netmirror.one";
    }
  }

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: "NetMirror API Key is missing. Please configure NETMIRROR_API_KEY in the environment secrets."
    });
  }

  try {
    const targetUrl = `${baseUrl}/api/netmirror`;
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `NetMirror API responded with status ${response.status}: ${errorText}`
      });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err: any) {
    console.error("Error fetching NetMirror Home:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PROXY NETMIRROR STREAM
app.get("/api/netmirror/stream", async (req, res) => {
  const { id } = req.query;
  const apiKey = process.env.NETMIRROR_API_KEY || req.headers["x-api-key"] as string || "sk_tLF8DC2Fcjp0mW1KlwPgpdZeVIrjocyH";

  if (!id) {
    return res.status(400).json({ success: false, error: "Missing required query parameter: id" });
  }

  let baseUrl = process.env.NETMIRROR_API_URL;
  if (!baseUrl) {
    if (apiKey && apiKey.startsWith("sk_")) {
      baseUrl = "https://screenscapeapi.dev";
    } else {
      baseUrl = "https://netmirror.one";
    }
  }

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: "NetMirror API Key is missing. Please configure NETMIRROR_API_KEY in the environment secrets."
    });
  }

  try {
    const targetUrl = `${baseUrl}/api/netmirror/stream?id=${encodeURIComponent(id as string)}`;
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `NetMirror Stream API responded with status ${response.status}: ${errorText}`
      });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err: any) {
    console.error("Error fetching NetMirror Stream:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PROXY SHOWBOX / FEBBOX STREAM LINK
app.get("/api/showbox/link", async (req, res) => {
  const { id, type, season, episode, language } = req.query;
  const apiUrl = process.env.SHOWBOX_FEB_BOX_API_URL;
  const token = process.env.FEB_BOX_TOKEN;

  if (!apiUrl) {
    return res.status(400).json({
      success: false,
      error: "SHOWBOX_FEB_BOX_API_URL is not configured. Please configure it in your environment variables via the Settings tab in AI Studio."
    });
  }

  if (!token) {
    return res.status(400).json({
      success: false,
      error: "FEB_BOX_TOKEN is missing. Please retrieve your Febbox UI token/cookie from Febbox.com (Application -> Cookies -> ui) and configure FEB_BOX_TOKEN in your environment variables via the Settings tab in AI Studio."
    });
  }

  if (!id) {
    return res.status(400).json({ success: false, error: "Missing required parameter: id" });
  }

  // Helper to extract clean 'ui' cookie value in case the user pasted the entire raw header
  function extractUiCookie(cookieStr: string): string {
    if (!cookieStr) return "";
    const match = cookieStr.match(/(?:^|;\s*)ui=([^;]+)/);
    if (match) return match[1];
    return cookieStr.trim();
  }

  const cleanToken = extractUiCookie(token);

  try {
    let title = "";
    
    // Resolve the title using TMDB or fallback
    if (typeof id === "string" && id.startsWith("f-")) {
      const movie = fallbackMovies.find(m => m.id === id);
      title = movie?.title || "";
    } else {
      const tmdbDetails = await fetchTMDB(`/${type}/${id}`);
      if (tmdbDetails) {
        title = tmdbDetails.title || tmdbDetails.name || "";
      }
    }

    if (!title) {
      throw new Error(`Could not resolve title for media ID: ${id}`);
    }

    console.log(`[Showbox Proxy] Resolved title: "${title}" for TMDB ID: ${id}`);

    // Step 1: Search on Showbox API
    const searchUrl = `${apiUrl.replace(/\/$/, "")}/api/search?title=${encodeURIComponent(title)}&type=${type === "tv" ? "tv" : "movie"}`;
    console.log(`[Showbox Proxy] Searching Showbox: ${searchUrl}`);
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      throw new Error(`Showbox search failed with status ${searchRes.status}`);
    }
    const searchData = await searchRes.json();
    if (!Array.isArray(searchData) || searchData.length === 0) {
      throw new Error(`No Showbox matches found for title: "${title}"`);
    }

    // Select the best match (the first is usually the most accurate)
    const bestMatch = searchData[0];
    const showboxId = bestMatch.id;
    console.log(`[Showbox Proxy] Best match: "${bestMatch.title}" (Showbox ID: ${showboxId})`);

    // Step 2: Get Febbox Share Key (febBoxId)
    const boxType = type === "tv" ? "2" : "1";
    const idUrl = `${apiUrl.replace(/\/$/, "")}/api/febbox/id?id=${showboxId}&type=${boxType}`;
    console.log(`[Showbox Proxy] Fetching Febbox share key: ${idUrl}`);
    const idRes = await fetch(idUrl);
    if (!idRes.ok) {
      throw new Error(`Failed to fetch Febbox share key with status ${idRes.status}`);
    }
    const idData = await idRes.json();
    const shareKey = idData.febBoxId;
    if (!shareKey) {
      throw new Error(`Febbox share key is empty for Showbox ID: ${showboxId}`);
    }
    console.log(`[Showbox Proxy] Retrieved share key: "${shareKey}"`);

    // Step 3: Get files list
    const filesUrl = `${apiUrl.replace(/\/$/, "")}/api/febbox/files?shareKey=${shareKey}`;
    console.log(`[Showbox Proxy] Fetching folder file list: ${filesUrl}`);
    const filesRes = await fetch(filesUrl, {
      headers: {
        "x-auth-cookie": cleanToken,
        "Accept": "application/json"
      }
    });
    if (!filesRes.ok) {
      throw new Error(`Failed to fetch files list with status ${filesRes.status}`);
    }
    const filesData = await filesRes.json();
    if (!Array.isArray(filesData) || filesData.length === 0) {
      throw new Error(`No files found in Febbox share folder "${shareKey}"`);
    }

    let targetFile: any = null;

    if (type === "tv") {
      const seasonNum = parseInt(season as string || "1");
      console.log(`[Showbox Proxy] TV Series Mode: Searching Season ${seasonNum}`);
      
      let seasonFolder = filesData.find((f: any) => {
        if (f.is_dir !== 1) return false;
        const name = f.file_name.toLowerCase();
        const m = name.match(/season\s*0*(\d+)/i) || name.match(/\bs\s*0*(\d+)\b/i) || name.match(/s(\d+)/i);
        return m && parseInt(m[1]) === seasonNum;
      });

      if (!seasonFolder) {
        // Fallback checks for season folder
        seasonFolder = filesData.find((f: any) => {
          const name = f.file_name.toLowerCase();
          return f.is_dir === 1 && (name.includes(`season ${seasonNum}`) || name.includes(`s${seasonNum}`) || name.includes(String(seasonNum)));
        });
      }

      if (!seasonFolder) {
        // Broadest fallback: pick first available folder
        seasonFolder = filesData.find((f: any) => f.is_dir === 1);
      }

      if (!seasonFolder) {
        throw new Error(`Could not find folder for Season ${seasonNum} in files list`);
      }

      console.log(`[Showbox Proxy] Found Season folder: "${seasonFolder.file_name}" (FID: ${seasonFolder.fid})`);

      // Fetch episodes within the season folder
      const epFilesUrl = `${apiUrl.replace(/\/$/, "")}/api/febbox/files?shareKey=${shareKey}&parent_id=${seasonFolder.fid}`;
      console.log(`[Showbox Proxy] Fetching episode list: ${epFilesUrl}`);
      const epFilesRes = await fetch(epFilesUrl, {
        headers: {
          "x-auth-cookie": cleanToken,
          "Accept": "application/json"
        }
      });
      if (!epFilesRes.ok) {
        throw new Error(`Failed to fetch episode list with status ${epFilesRes.status}`);
      }
      const epFilesData = await epFilesRes.json();
      if (!Array.isArray(epFilesData) || epFilesData.length === 0) {
        throw new Error(`No files found inside Season folder "${seasonFolder.file_name}"`);
      }

      const epNum = parseInt(episode as string || "1");
      console.log(`[Showbox Proxy] Searching Episode ${epNum}`);

      // Filter files that are videos (is_dir === 0) and match the episode number
      let matchingEpisodes = epFilesData.filter((f: any) => {
        if (f.is_dir !== 0) return false;
        const name = f.file_name.toLowerCase();
        const m = name.match(/e0*(\d+)\b/i) || name.match(/ep0*(\d+)\b/i) || name.match(/episode\s*0*(\d+)\b/i);
        return m && parseInt(m[1]) === epNum;
      });

      if (matchingEpisodes.length === 0) {
        // Fallback matches
        matchingEpisodes = epFilesData.filter((f: any) => {
          const name = f.file_name.toLowerCase();
          return f.is_dir === 0 && (name.includes(`e${epNum}`) || name.includes(`ep${epNum}`) || name.includes(`episode ${epNum}`));
        });
      }

      if (matchingEpisodes.length === 0) {
        matchingEpisodes = epFilesData.filter((f: any) => f.is_dir === 0 && f.file_name.includes(String(epNum)));
      }

      if (matchingEpisodes.length === 0) {
        // Broadest fallback: all files
        matchingEpisodes = epFilesData.filter((f: any) => f.is_dir === 0);
      }

      const reqLang = (language as string || "").toLowerCase();
      console.log(`[Showbox Proxy] Episode files found: ${matchingEpisodes.length}. Filtering for language: "${reqLang}"`);

      if (matchingEpisodes.length > 0) {
        if (reqLang === "hindi") {
          targetFile = matchingEpisodes.find((f: any) => {
            const name = f.file_name.toLowerCase();
            return name.includes("hindi") || name.includes("hin") || name.includes("dub") || name.includes("dual");
          });
        } else if (reqLang === "tamil" || reqLang === "tam") {
          targetFile = matchingEpisodes.find((f: any) => {
            const name = f.file_name.toLowerCase();
            return name.includes("tamil") || name.includes("tam") || name.includes("dub") || name.includes("dual");
          });
        } else if (reqLang === "telugu" || reqLang === "tel") {
          targetFile = matchingEpisodes.find((f: any) => {
            const name = f.file_name.toLowerCase();
            return name.includes("telugu") || name.includes("tel") || name.includes("dub") || name.includes("dual");
          });
        } else if (reqLang === "eng" || reqLang === "english") {
          targetFile = matchingEpisodes.find((f: any) => {
            const name = f.file_name.toLowerCase();
            return name.includes("english") || name.includes("eng");
          });
          if (!targetFile) {
            // Find file that doesn't contain indian languages
            targetFile = matchingEpisodes.find((f: any) => {
              const name = f.file_name.toLowerCase();
              return !name.includes("hindi") && !name.includes("hin") && !name.includes("tamil") && !name.includes("tam") && !name.includes("telugu") && !name.includes("tel");
            });
          }
        }

        // Default fallback if language specific match not found
        if (!targetFile) {
          targetFile = matchingEpisodes[0];
        }
      }

      if (!targetFile) {
        throw new Error(`Could not resolve episode file for Episode ${epNum}`);
      }
    } else {
      // Movie Mode: select best file in the root shared folder
      console.log(`[Showbox Proxy] Movie Mode: Searching for video files`);
      const videoFiles = filesData.filter((f: any) => {
        const name = f.file_name.toLowerCase();
        return f.is_dir === 0 && (name.endsWith(".mkv") || name.endsWith(".mp4") || name.endsWith(".avi"));
      });

      const reqLang = (language as string || "").toLowerCase();
      console.log(`[Showbox Proxy] Movie files found: ${videoFiles.length}. Filtering for language: "${reqLang}"`);

      if (videoFiles.length > 0) {
        if (reqLang === "hindi") {
          targetFile = videoFiles.find((f: any) => {
            const name = f.file_name.toLowerCase();
            return name.includes("hindi") || name.includes("hin") || name.includes("dub") || name.includes("dual");
          });
        } else if (reqLang === "tamil" || reqLang === "tam") {
          targetFile = videoFiles.find((f: any) => {
            const name = f.file_name.toLowerCase();
            return name.includes("tamil") || name.includes("tam") || name.includes("dub") || name.includes("dual");
          });
        } else if (reqLang === "telugu" || reqLang === "tel") {
          targetFile = videoFiles.find((f: any) => {
            const name = f.file_name.toLowerCase();
            return name.includes("telugu") || name.includes("tel") || name.includes("dub") || name.includes("dual");
          });
        } else if (reqLang === "eng" || reqLang === "english") {
          targetFile = videoFiles.find((f: any) => {
            const name = f.file_name.toLowerCase();
            return name.includes("english") || name.includes("eng");
          });
          if (!targetFile) {
            targetFile = videoFiles.find((f: any) => {
              const name = f.file_name.toLowerCase();
              return !name.includes("hindi") && !name.includes("hin") && !name.includes("tamil") && !name.includes("tam") && !name.includes("telugu") && !name.includes("tel");
            });
          }
        }

        // Fallback: if language filter failed, pick first video file
        if (!targetFile) {
          targetFile = videoFiles[0];
        }
      }

      if (!targetFile) {
        targetFile = filesData.find((f: any) => f.is_dir === 0);
      }

      if (!targetFile) {
        throw new Error(`Could not locate any video file in Febbox share folder`);
      }
    }

    console.log(`[Showbox Proxy] Resolved target video file: "${targetFile.file_name}" (FID: ${targetFile.fid})`);

    // Step 4: Get direct streaming links
    const linksUrl = `${apiUrl.replace(/\/$/, "")}/api/febbox/links?shareKey=${shareKey}&fid=${targetFile.fid}`;
    console.log(`[Showbox Proxy] Fetching links: ${linksUrl}`);
    const linksRes = await fetch(linksUrl, {
      headers: {
        "x-auth-cookie": cleanToken,
        "Accept": "application/json"
      }
    });
    if (!linksRes.ok) {
      throw new Error(`Failed to retrieve streaming links with status ${linksRes.status}`);
    }
    const linksData = await linksRes.json();

    if (linksData && linksData.error) {
      throw new Error(linksData.error);
    }

    console.log(`[Showbox Proxy] Successfully retrieved ${Array.isArray(linksData) ? linksData.length : 1} links`);
    return res.json(linksData);

  } catch (err: any) {
    console.error(`[Showbox Proxy Error]`, err);
    return res.status(500).json({
      success: false,
      error: `Failed to fetch download links from Showbox/Febbox. Error: ${err.message}`
    });
  }
});

// CREDITS / CAST
app.get("/api/movies/credits/:type/:id", async (req, res) => {
  const { type, id } = req.params;

  if (id.startsWith("f-")) {
    const movie = fallbackMovies.find(m => m.id === id);
    return res.json({ cast: movie?.cast || [] });
  }

  const tmdbData = await fetchTMDB(`/${type}/${id}/credits`);
  if (tmdbData && tmdbData.cast) {
    const castNames = tmdbData.cast.slice(0, 5).map((member: any) => member.name);
    return res.json({ cast: castNames });
  }

  return res.json({ cast: [] });
});

// ===== Auto-Fix Agent: error reporting endpoints =====
import fs from "fs";
const QUEUE_FILE = path.join(process.cwd(), "queue.json");

function loadErrorQueue(): any[] {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveErrorQueue(queue: any[]) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

// Website se error reports yahan aate hain (src/lib/errorReporter.ts se)
app.post("/api/report-error", (req, res) => {
  const queue = loadErrorQueue();

  const isDuplicate = queue.some(
    (item) =>
      item.status === "pending" &&
      item.message === req.body.message &&
      item.componentName === req.body.componentName
  );

  if (!isDuplicate) {
    queue.push({
      id: Date.now().toString(),
      ...req.body,
      status: "pending", // pending -> fixing -> fixed / needs-review
    });
    saveErrorQueue(queue);
    console.log("🐛 New error reported:", req.body.message);
  }

  res.json({ received: true });
});

// Dashboard / agent ke liye queue dekhne ka endpoint
app.get("/api/queue", (_req, res) => {
  res.json(loadErrorQueue());
});

// Vite server setup for full-stack integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
