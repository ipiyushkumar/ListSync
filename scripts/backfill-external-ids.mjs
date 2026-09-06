#!/usr/bin/env node
/**
 * Backfill externalId and externalSource for anime entries missing them.
 * Uses AniList GraphQL API (no auth needed).
 * Rate limited to 3 req/s.
 */

import { execSync } from 'child_process';

function getAnime() {
  const raw = execSync(
    `sqlite3 prisma/dev.db "SELECT id, title FROM Media WHERE category='anime' AND (externalId IS NULL OR externalId = '') LIMIT 100;"`,
    { encoding: 'utf-8' }
  );
  return raw.trim().split('\n').filter(Boolean).map(line => {
    const [id, ...titleParts] = line.split('|');
    return { id, title: titleParts.join('|') };
  });
}

function setExternalId(dbId, anilistId, title) {
  // Escape single quotes in title for SQL
  const safeTitle = title.replace(/'/g, "''");
  try {
    execSync(
      `sqlite3 prisma/dev.db "UPDATE Media SET externalId='${anilistId}', externalSource='anilist' WHERE id='${dbId}';"`,
      { encoding: 'utf-8' }
    );
    console.log(`  ✓ [${dbId}] ${safeTitle} → anilist:${anilistId}`);
  } catch (e) {
    console.error(`  ✗ [${dbId}] ${safeTitle} — DB update failed: ${e.message}`);
  }
}

async function searchAniList(title) {
  const queries = [title];
  
  // Extract main title before colon
  const colonIdx = title.indexOf(':');
  if (colonIdx > 0) queries.push(title.slice(0, colonIdx).trim());
  
  // Remove season suffixes: "Season 2", "4th season", "Season 1", "Cour 2", "Part 1"
  const seasonMatch = title.match(/\s*(?:Season|Cour|Part)\s+\d/i) || title.match(/\s+\d+(?:st|nd|rd|th)\s+season/i);
  if (seasonMatch) {
    const base = title.slice(0, seasonMatch.index).trim();
    if (base && !queries.includes(base)) queries.push(base);
  }
  
  // Handle "X title of Y" patterns like "Mob Psycho 100" -> try "Mob Psycho"
  // Handle parenthetical: "Uncle from Another World (Isekai Ojisan)" -> try "Isekai Ojisan"
  const parenMatch = title.match(/\(([^)]+)\)/);
  if (parenMatch && !queries.includes(parenMatch[1])) {
    queries.push(parenMatch[1]);
  }
  
  // Remove common suffixes like "by Netflix Season 2"
  const byNetflix = title.match(/\s+by\s+Netflix/i);
  if (byNetflix) queries.push(title.slice(0, byNetflix.index).trim());
  
  // Remove trailing "Season N" patterns more aggressively
  const cleaned = title.replace(/\s*(?:by Netflix)?\s*Season\s*\d+$/i, '').trim();
  if (cleaned && !queries.includes(cleaned)) queries.push(cleaned);
  
  // Try roman numeral to number: "IV" -> "4th season"
  const romanMap = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };
  const romanMatch = title.match(/\s+(I{1,3}|IV|V|VI|VII)$/);
  if (romanMatch && romanMap[romanMatch[1]]) {
    const base = title.slice(0, romanMatch.index).trim();
    queries.push(`${base} ${romanMap[romanMatch[1]]}th season`);
    queries.push(base); // Also try without season
  }
  
  // Deduplicate
  const unique = [...new Set(queries)].filter(q => q.length > 1);
  
  for (const q of unique) {
    const query = `query($search:String){Media(search:$search,type:ANIME){id title{romaji english}}}`;
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { search: q } }),
      });
      const data = await res.json();
      if (data?.data?.Media?.id) {
        return data.data.Media;
      }
    } catch (e) {
      console.error(`    AniList fetch failed for "${q}": ${e.message}`);
    }
    // Rate limit: 3 req/s → ~350ms between requests
    await new Promise(r => setTimeout(r, 350));
  }
  return null;
}

async function main() {
  const anime = getAnime();
  console.log(`Found ${anime.length} anime entries without externalId\n`);

  let matched = 0;
  let failed = 0;

  for (const item of anime) {
    console.log(`Searching: "${item.title}"`);
    const result = await searchAniList(item.title);
    
    if (result) {
      console.log(`  Found: ${result.title.romaji} (ID: ${result.id})`);
      setExternalId(item.id, result.id, item.title);
      matched++;
    } else {
      console.log(`  ✗ No match found`);
      failed++;
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 350));
  }

  console.log(`\nDone: ${matched} matched, ${failed} failed out of ${anime.length}`);
}

main().catch(console.error);
