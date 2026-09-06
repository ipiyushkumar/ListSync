import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient({
  datasources: { db: { url: `file:${path.join(__dirname, '..', 'prisma', 'dev.db')}` } }
});

const ANILIST_URL = 'https://graphql.anilist.co';

const QUERY = `query($search: String) {
  Media(search: $search, type: ANIME) {
    title { romaji english }
    episodes
    averageScore
    coverImage { large }
    status
    startDate { year month day }
    genres
  }
}`;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function searchAniList(title) {
  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { search: title } })
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.Media || null;
}

async function enrichAnime() {
  const incomplete = await prisma.media.findMany({
    where: {
      category: 'anime',
      OR: [
        { posterUrl: '' },
        { posterUrl: null },
        { totalEpisodes: 0 },
      ]
    }
  });

  console.log(`Found ${incomplete.length} anime needing enrichment`);

  let enriched = 0;
  let failed = 0;

  for (const anime of incomplete) {
    console.log(`\nSearching: "${anime.title}"...`);
    
    try {
      const result = await searchAniList(anime.title);
      
      if (!result) {
        console.log(`  No results found`);
        failed++;
        await sleep(800);
        continue;
      }

      const updates = {};
      
      if (!anime.posterUrl && result.coverImage?.large) {
        updates.posterUrl = result.coverImage.large;
      }
      
      if ((anime.totalEpisodes === 0 || anime.totalEpisodes === null) && result.episodes) {
        updates.totalEpisodes = result.episodes;
      }
      
      if ((anime.rating === 0 || anime.rating === null) && result.averageScore) {
        updates.rating = result.averageScore / 10; // AniList scores out of 100
      }

      if (Object.keys(updates).length === 0) {
        console.log(`  No new data to update`);
        failed++;
        await sleep(800);
        continue;
      }

      await prisma.media.update({
        where: { id: anime.id },
        data: updates
      });

      console.log(`  Updated: ${Object.keys(updates).join(', ')}`);
      if (updates.posterUrl) console.log(`    Poster: ${updates.posterUrl.substring(0, 60)}...`);
      if (updates.totalEpisodes) console.log(`    Episodes: ${updates.totalEpisodes}`);
      if (updates.rating) console.log(`    Rating: ${updates.rating}`);
      
      enriched++;
    } catch (err) {
      console.log(`  Error: ${err.message}`);
      failed++;
    }

    // AniList rate limit is generous but be nice
    await sleep(800);
  }

  console.log(`\n--- Enrichment complete ---`);
  console.log(`Enriched: ${enriched}, Failed: ${failed}, Total: ${incomplete.length}`);
}

enrichAnime()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
