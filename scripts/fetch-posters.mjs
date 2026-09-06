import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function searchAniList(title) {
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
        title { romaji english }
        coverImage { large }
        averageScore
        episodes
        format
        status
      }
    }
  `;

  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { search: title } }),
  });

  const data = await res.json();
  return data?.data?.Media || null;
}

async function main() {
  const media = await prisma.media.findMany({
    where: { category: 'anime' },
    select: { id: true, title: true },
  });

  console.log(`Found ${media.length} anime titles to fetch posters for`);

  let updated = 0;
  for (const item of media) {
    try {
      const result = await searchAniList(item.title);
      if (result?.coverImage?.large) {
        await prisma.media.update({
          where: { id: item.id },
          data: {
            posterUrl: result.coverImage.large,
            rating: result.averageScore ? result.averageScore / 10 : 0,
            totalEpisodes: result.episodes || 0,
          },
        });
        console.log(`✓ ${item.title} → ${result.coverImage.large.substring(0, 60)}...`);
        updated++;
      } else {
        console.log(`✗ ${item.title} → No image found`);
      }
      // Rate limit: 3 req/s
      await new Promise(r => setTimeout(r, 350));
    } catch (err) {
      console.error(`Error fetching ${item.title}:`, err.message);
    }
  }

  console.log(`\nDone! Updated ${updated}/${media.length} titles`);
  await prisma.$disconnect();
}

main();
