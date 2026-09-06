import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient({
  datasources: { db: { url: `file:${path.join(__dirname, '..', 'prisma', 'dev.db')}` } }
});

const ANILIST_URL = 'https://graphql.anilist.co';
const QUERY = `query ($id: Int) { Media(id: $id, type: ANIME) { description } }`;

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/\n+/g, ' ').trim();
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const items = await prisma.media.findMany({
    where: { category: 'anime', OR: [{ description: null }, { description: '' }] },
    select: { id: true, title: true, externalId: true }
  });

  console.log(`Found ${items.length} anime without descriptions`);

  let updated = 0;
  let failed = 0;

  for (const item of items) {
    if (!item.externalId) {
      console.log(`  SKIP ${item.title} — no externalId`);
      failed++;
      continue;
    }

    try {
      const res = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: QUERY, variables: { id: parseInt(item.externalId) } })
      });

      if (res.status === 429) {
        console.log(`  Rate limited, waiting 5s...`);
        await sleep(5000);
        continue;
      }

      const { data } = await res.json();
      const desc = stripHtml(data?.Media?.description);

      if (desc) {
        await prisma.media.update({ where: { id: item.id }, data: { description: desc } });
        console.log(`  OK ${item.title} — ${desc.substring(0, 60)}...`);
        updated++;
      } else {
        console.log(`  EMPTY ${item.title}`);
      }
    } catch (e) {
      console.log(`  ERR ${item.title} — ${e.message}`);
      failed++;
    }

    await sleep(400);
  }

  console.log(`\nDone: ${updated} updated, ${failed} failed/skipped`);
  await prisma.$disconnect();
}

main();
