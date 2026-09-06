import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Parse a CSV line handling quoted fields with commas and escaped quotes */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

/** Parse CSV text into array of objects using header row */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return obj;
  });
}

/** Convert a CSV row object into a media item matching the import schema */
function csvRowToMedia(row: Record<string, string>) {
  return {
    title: row.title || '',
    originalTitle: row.originalTitle || null,
    description: row.description || null,
    category: row.category || 'anime',
    posterUrl: row.posterUrl || null,
    releaseDate: row.releaseDate || null,
    totalEpisodes: row.totalEpisodes ? parseInt(row.totalEpisodes) || null : null,
    currentEp: row.currentEp ? parseInt(row.currentEp) || 0 : 0,
    rating: row.rating ? parseFloat(row.rating) || null : null,
    status: row.status || 'planned',
    genres: row.genres || null,
    platforms: row.platforms || null,
    externalId: row.externalId || null,
    externalSource: row.externalSource || null,
    airStatus: row.airStatus || null,
    notes: row.notes || null,
    favorite: row.favorite === 'true' || row.favorite === '1',
  };
}

async function importMedia(media: Record<string, unknown>[]) {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of media) {
    try {
      if (!item.title || !item.category) {
        skipped++;
        continue;
      }

      if (item.externalId) {
        const existing = await prisma.media.findFirst({
          where: { externalId: item.externalId as string, externalSource: item.externalSource as string },
        });

        if (existing) {
          await prisma.media.update({
            where: { id: existing.id },
            data: {
              title: item.title as string,
              originalTitle: (item.originalTitle as string) || null,
              description: (item.description as string) || null,
              category: item.category as string,
              posterUrl: (item.posterUrl as string) || null,
              releaseDate: (item.releaseDate as string) || null,
              totalEpisodes: (item.totalEpisodes as number) || null,
              currentEp: (item.currentEp as number) ?? 0,
              rating: (item.rating as number) || null,
              status: (item.status as string) || 'planned',
              genres: (item.genres as string) || null,
              platforms: (item.platforms as string) || null,
              airStatus: (item.airStatus as string) || null,
              notes: (item.notes as string) || null,
              favorite: (item.favorite as boolean) ?? false,
            },
          });
          imported++;
        } else {
          await prisma.media.create({
            data: {
              title: item.title as string,
              originalTitle: (item.originalTitle as string) || null,
              description: (item.description as string) || null,
              category: item.category as string,
              posterUrl: (item.posterUrl as string) || null,
              releaseDate: (item.releaseDate as string) || null,
              totalEpisodes: (item.totalEpisodes as number) || null,
              currentEp: (item.currentEp as number) ?? 0,
              rating: (item.rating as number) || null,
              status: (item.status as string) || 'planned',
              genres: (item.genres as string) || null,
              platforms: (item.platforms as string) || null,
              externalId: (item.externalId as string) || null,
              externalSource: (item.externalSource as string) || null,
              airStatus: (item.airStatus as string) || null,
              notes: (item.notes as string) || null,
              favorite: (item.favorite as boolean) ?? false,
            },
          });
          imported++;
        }
      } else {
        await prisma.media.create({
          data: {
            title: item.title as string,
            originalTitle: (item.originalTitle as string) || null,
            description: (item.description as string) || null,
            category: item.category as string,
            posterUrl: (item.posterUrl as string) || null,
            releaseDate: (item.releaseDate as string) || null,
            totalEpisodes: (item.totalEpisodes as number) || null,
            currentEp: (item.currentEp as number) ?? 0,
            rating: (item.rating as number) || null,
            status: (item.status as string) || 'planned',
            genres: (item.genres as string) || null,
            platforms: (item.platforms as string) || null,
            airStatus: (item.airStatus as string) || null,
            notes: (item.notes as string) || null,
            favorite: (item.favorite as boolean) ?? false,
          },
        });
        imported++;
      }
    } catch (err) {
      errors.push(`Failed to import "${item.title}": ${(err as Error).message}`);
      skipped++;
    }
  }

  return { imported, skipped, errors };
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // CSV import via text/csv or when body starts with a header row
    if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
      const text = await req.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        return NextResponse.json({ error: 'No data rows found in CSV' }, { status: 400 });
      }
      const media = rows.map(csvRowToMedia);
      const result = await importMedia(media);
      return NextResponse.json(result);
    }

    // JSON import (default)
    const body = await req.json();
    const { media } = body;

    if (!Array.isArray(media)) {
      return NextResponse.json({ error: 'Invalid import format: expected an array of media items' }, { status: 400 });
    }

    const result = await importMedia(media);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}
