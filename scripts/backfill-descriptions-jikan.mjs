import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient({
  datasources: { db: { url: `file:${path.join(__dirname, '..', 'prisma', 'dev.db')}` } }
});

const JIKAN_SEARCH = 'https://api.jikan.moe/v4/anime';

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/\n+/g, ' ').trim();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function searchByTitle(title) {
  // Use the base title (before any colon/season info) for search
  const searchTitle = title.split(':')[0].split('Season')[0].split('4th season').split('3rd season').split('2nd season').split('Season 2').split('Season 3').split('Season 4').trim();

  const url = `${JIKAN_SEARCH}?q=${encodeURIComponent(searchTitle)}&limit=5`;
  const res = await fetch(url);

  if (res.status === 429) {
    // Jikan rate limit: 3 req/sec, wait and retry
    console.log(`    Rate limited on search, waiting 4s...`);
    await sleep(4000);
    return searchByTitle(title); // retry
  }

  if (!res.ok) {
    throw new Error(`Jikan search returned ${res.status}`);
  }

  const json = await res.json();
  return json.data || [];
}

function matchTitle(title, candidates) {
  const norm = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const c of candidates) {
    const cNorm = c.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (norm.includes(cNorm) || cNorm.includes(norm)) {
      return c;
    }
  }
  return null;
}

async function main() {
  const items = await prisma.media.findMany({
    where: { category: 'anime', OR: [{ description: null }, { description: '' }] },
    select: { id: true, title: true, externalId: true }
  });

  console.log(`Found ${items.length} anime without descriptions`);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of items) {
    console.log(`\n[${updated + failed + skipped + 1}/${items.length}] ${item.title}`);

    try {
      const results = await searchByTitle(item.title);
      const match = matchTitle(item.title, results);

      if (match) {
        const desc = stripHtml(match.synopsis);
        if (desc && desc.length > 5) {
          await prisma.media.update({
            where: { id: item.id },
            data: { description: desc }
          });
          console.log(`  OK — ${desc.substring(0, 80)}...`);
          updated++;
        } else {
          console.log(`  EMPTY — matched "${match.title}" but synopsis empty`);
          skipped++;
        }
      } else {
        console.log(`  NO MATCH — search returned ${results.length} results: ${results.map(r => r.title).join(', ')}`);
        failed++;
      }
    } catch (e) {
      console.log(`  ERR — ${e.message}`);
      failed++;
    }

    await sleep(1000); // Jikan allows ~3 req/sec, use 1s for safety
  }

  console.log(`\n=== DONE: ${updated} updated, ${failed} failed, ${skipped} skipped (empty synopsis) ===`);
  await prisma.$disconnect();
}

main();
