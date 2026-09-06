import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient({
  datasources: { db: { url: `file:${path.join(__dirname, '..', 'prisma', 'dev.db')}` } }
});

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/\n+/g, ' ').trim();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function extractDescription(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for the description to load
  await page.waitForTimeout(2000);

  // Extract description text from the page
  const description = await page.evaluate(() => {
    // Look for the description text in the page
    // AniList puts descriptions in a specific section
    const allText = document.body.innerText;

    // The description appears after the title and before "Overview"
    // Let's try to find it more precisely
    const descElement = document.querySelector('.description');
    if (descElement) {
      return descElement.innerText;
    }

    // Fallback: try to find text between title and "Overview"
    const titleMatch = allText.match(/Add to List\n(.+?)\n/);
    if (titleMatch) {
      const afterTitle = allText.substring(allText.indexOf(titleMatch[0]) + titleMatch[0].length);
      const overviewIndex = afterTitle.indexOf('Overview');
      if (overviewIndex > 0) {
        return afterTitle.substring(0, overviewIndex).trim();
      }
    }

    return null;
  });

  return description;
}

async function main() {
  const items = await prisma.media.findMany({
    where: {
      category: 'anime',
      OR: [{ description: null }, { description: '' }],
      externalId: { not: null }
    },
    select: { id: true, title: true, externalId: true }
  });

  console.log(`Found ${items.length} anime with externalId needing descriptions`);

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/home/piyush-kumar/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  let updated = 0;
  let failed = 0;
  let empty = 0;

  for (const item of items) {
    const url = `https://anilist.co/anime/${item.externalId}`;
    console.log(`\n[${updated + failed + empty + 1}/${items.length}] ${item.title} (${url})`);

    try {
      const desc = await extractDescription(page, url);

      if (desc && desc.length > 10) {
        // Clean up the description - remove source attribution
        let cleanDesc = desc.replace(/\(Source:.*?\)/gi, '').trim();
        cleanDesc = cleanDesc.replace(/\n+/g, ' ').trim();

        await prisma.media.update({
          where: { id: item.id },
          data: { description: cleanDesc }
        });
        console.log(`  OK — ${cleanDesc.substring(0, 80)}...`);
        updated++;
      } else {
        console.log(`  EMPTY — no description found on page`);
        empty++;
      }
    } catch (e) {
      console.log(`  ERR — ${e.message}`);
      failed++;
    }

    // Rate limit: 1 second between requests
    await sleep(1000);
  }

  await browser.close();

  console.log(`\n=== DONE: ${updated} updated, ${empty} empty, ${failed} failed ===`);
  await prisma.$disconnect();
}

main();
