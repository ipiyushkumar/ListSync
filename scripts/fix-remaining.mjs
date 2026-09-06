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
    episodes averageScore coverImage { large }
  }
}`;

async function search(title) {
  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { search: title } })
  });
  const data = await res.json();
  return data.data?.Media || null;
}

async function fix() {
  const fixes = {
    'Comartie high school': ['Komi Can\'t Communicate', 'Komi'],
    'The boring hero reincarnated with dragon using a katana': ['By the Grace of the Gods', 'Grace of the Gods'],
    'The trash world with gloves': ['Handyman Saitou'],
    'Devil may cry by Netflix Season 2': ['Devil May Cry', 'Devil May Cry 2025'],
    'Ragna crimson Season 1': ['Ragna Crimson'],
    'The kingdom of ruin': ['Ruin of the Kingdom', 'Kingdom of Ruin'],
    'The eminence in the shadow Season 1': ['The Eminence in Shadow', 'Eminence in Shadow'],
    'I am quitting heroing': ['I\'m Quitting Heroing', 'Quitting Heroing'],
    'Parallel world pharmacy Season 1': ['Parallel World Pharmacy', 'Isekai Yakkyoku'],
    'How a realist hero built the kingdom': ['How a Realist Hero Rebuilt the Kingdom', 'Realist Hero'],
    'Uncle from Another World (Isekai Ojisan)': ['Isekai Ojisan', 'Uncle from Another World'],
  };

  for (const [dbTitle, searchTerms] of Object.entries(fixes)) {
    console.log(`\n"${dbTitle}":`);
    let found = null;
    
    for (const term of searchTerms) {
      console.log(`  Trying: "${term}"`);
      found = await search(term);
      if (found) {
        console.log(`  Found: ${found.title.english || found.title.romaji}`);
        break;
      }
      await new Promise(r => setTimeout(r, 800));
    }

    if (!found) {
      console.log(`  Not found with any term`);
      continue;
    }

    const media = await prisma.media.findFirst({ where: { title: dbTitle } });
    if (!media) {
      console.log(`  DB record not found`);
      continue;
    }

    const updates = {};
    if (!media.posterUrl && found.coverImage?.large) updates.posterUrl = found.coverImage.large;
    if ((media.totalEpisodes === 0) && found.episodes) updates.totalEpisodes = found.episodes;
    if ((media.rating === 0) && found.averageScore) updates.rating = found.averageScore / 10;

    if (Object.keys(updates).length > 0) {
      await prisma.media.update({ where: { id: media.id }, data: updates });
      console.log(`  Updated: ${Object.keys(updates).join(', ')}`);
    } else {
      console.log(`  Already has data`);
    }
    await new Promise(r => setTimeout(r, 800));
  }

  // Show final count
  const remaining = await prisma.media.findMany({
    where: { category: 'anime', OR: [{ posterUrl: '' }, { posterUrl: null }, { totalEpisodes: 0 }] }
  });
  console.log(`\n--- Remaining incomplete: ${remaining.length} ---`);
  for (const r of remaining) {
    console.log(`  ${r.title} (ep: ${r.totalEpisodes}, poster: ${r.posterUrl ? 'yes' : 'no'}, rating: ${r.rating})`);
  }
}

fix().catch(console.error).finally(() => prisma.$disconnect());
