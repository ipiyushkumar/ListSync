import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
  id: string | number;
  title: string;
  description: string;
  category: string;
  coverImage?: string;
  rating?: number;
  totalEpisodes?: number;
  genres?: string[];
  releaseDate?: string;
  source: string;
}

// AniList Anime - GraphQL, no key needed
async function searchAniListAnime(query: string): Promise<SearchResult[]> {
  try {
    const gql = `query($search:String){Page(perPage:5){media(search:$search,type:ANIME){id title{romaji english}description episodes status startDate{year month day}coverImage{large}averageScore genres}}}`;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: gql, variables: { search: query } }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.data?.Page?.media || [];
    return items.map((m: Record<string, unknown>) => ({
      id: m.id,
      title: (m.title as { romaji: string })?.romaji || '',
      description: (m.description as string) || '',
      category: 'anime',
      coverImage: (m.coverImage as { large: string })?.large,
      rating: m.averageScore as number,
      totalEpisodes: m.episodes as number,
      genres: (m.genres as string[]) || [],
      releaseDate: m.startDate ? `${(m.startDate as { year: number }).year}-${(m.startDate as { month: number }).month}` : undefined,
      source: 'anilist',
    }));
  } catch (e) { console.error('AniList anime search error:', e); return []; }
}

// Jikan (Anime fallback) - no key needed
async function searchJikan(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((a: Record<string, unknown>) => ({
      id: a.mal_id,
      title: (a.title as string) || '',
      description: (a.synopsis as string) || '',
      category: 'anime',
      coverImage: (a.images as Record<string, Record<string, string>>)?.jpg?.large_image_url,
      rating: a.score as number,
      totalEpisodes: a.episodes as number,
      genres: ((a.genres as { name: string }[]) || []).map((g) => g.name),
      releaseDate: (a.aired as Record<string, string>)?.from,
      source: 'jikan',
    }));
  } catch { return []; }
}

// AniList (Manhwa/Manga) - GraphQL
async function searchAniList(query: string): Promise<SearchResult[]> {
  try {
    const gql = `query($search:String){Page(perPage:5){media(search:$search,type:MANGA,formatIn:[MANHWA,MANGA,MANHUA]){id title{romaji english}description chapters status startDate{year month day}coverImage{large}averageScore genres{format}}}}`;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: gql, variables: { search: query } }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.data?.Page?.media || [];
    return items.map((m: Record<string, unknown>) => ({
      id: m.id,
      title: (m.title as { romaji: string })?.romaji || '',
      description: (m.description as string) || '',
      category: 'manhwa',
      coverImage: (m.coverImage as { large: string })?.large,
      rating: m.averageScore as number,
      totalEpisodes: m.chapters as number,
      genres: ((m.genres as { format: string }[]) || []).map((g) => g.format),
      releaseDate: m.startDate ? `${(m.startDate as { year: number }).year}-${(m.startDate as { month: number }).month}` : undefined,
      source: 'anilist',
    }));
  } catch { return []; }
}

// TMDB (Movies + TV/Web Series) - needs key
async function searchTMDB(query: string): Promise<SearchResult[]> {
  const key = process.env.TMDB_API_KEY;
  if (!key) return [];
  const results: SearchResult[] = [];
  try {
    const [movieRes, tvRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&api_key=${key}`),
      fetch(`https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&api_key=${key}`),
    ]);
    if (movieRes.ok) {
      const md = await movieRes.json();
      results.push(...(md.results || []).slice(0, 3).map((m: Record<string, unknown>) => ({
        id: m.id,
        title: (m.title as string) || '',
        description: (m.overview as string) || '',
        category: 'movie',
        coverImage: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : undefined,
        rating: m.vote_average as number,
        releaseDate: m.release_date as string,
        source: 'tmdb',
      })));
    }
    if (tvRes.ok) {
      const td = await tvRes.json();
      results.push(...(td.results || []).slice(0, 3).map((t: Record<string, unknown>) => ({
        id: t.id,
        title: (t.name as string) || '',
        description: (t.overview as string) || '',
        category: 'tv',
        coverImage: t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : undefined,
        rating: t.vote_average as number,
        totalEpisodes: t.number_of_episodes as number,
        releaseDate: t.first_air_date as string,
        source: 'tmdb',
      })));
    }
  } catch { /* ignore */ }
  return results;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const category = searchParams.get('category');

  if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

  const searches: Promise<SearchResult[]>[] = [];
  if (!category || category === 'anime') {
    // AniList primary (reliable), Jikan fallback (MAL often down)
    searches.push(searchAniListAnime(query));
  }
  if (!category || category === 'manhwa') searches.push(searchAniList(query));
  if (!category || category === 'movie' || category === 'tv') searches.push(searchTMDB(query));

  const allResults = await Promise.allSettled(searches);
  const results = allResults
    .filter((r): r is PromiseFulfilledResult<SearchResult[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  return NextResponse.json(results);
}
