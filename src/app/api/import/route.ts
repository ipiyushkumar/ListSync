import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID_CATEGORIES = ['anime', 'manhwa', 'movie', 'tv', 'music'];
const VALID_STATUSES = ['watching', 'completed', 'dropped', 'planned', 'on_hold', 'reading', 'listening'];

interface ImportItem {
  title?: string;
  originalTitle?: string;
  description?: string;
  category?: string;
  posterUrl?: string;
  releaseDate?: string;
  totalEpisodes?: number;
  currentEp?: number;
  rating?: number;
  status?: string;
  genres?: string;
  platforms?: string;
  externalId?: string;
  externalSource?: string;
}

function normalizeStatus(status: string): string {
  return status === 'on-hold' ? 'on_hold' : status;
}

function validateItem(item: ImportItem): { valid: boolean; error?: string } {
  if (!item.title || typeof item.title !== 'string' || !item.title.trim()) {
    return { valid: false, error: 'Title is required' };
  }
  if (!item.category || !VALID_CATEGORIES.includes(item.category)) {
    return { valid: false, error: `Invalid category: ${item.category}` };
  }
  if (item.status) {
    const normalized = normalizeStatus(item.status);
    if (!VALID_STATUSES.includes(normalized)) {
      return { valid: false, error: `Invalid status: ${item.status}` };
    }
  }
  return { valid: true };
}

function sanitizeItem(item: ImportItem) {
  const status = item.status ? normalizeStatus(item.status) : 'planned';
  const genres = typeof item.genres === 'string' ? item.genres : item.genres ? JSON.stringify(item.genres) : '[]';
  const platforms = typeof item.platforms === 'string' ? item.platforms : item.platforms ? JSON.stringify(item.platforms) : '[]';

  return {
    title: item.title!.trim(),
    originalTitle: item.originalTitle || null,
    description: item.description || null,
    category: item.category!,
    posterUrl: item.posterUrl || null,
    releaseDate: item.releaseDate || null,
    totalEpisodes: typeof item.totalEpisodes === 'number' ? item.totalEpisodes : null,
    currentEp: typeof item.currentEp === 'number' ? item.currentEp : 0,
    rating: typeof item.rating === 'number' ? item.rating : null,
    status,
    genres,
    platforms,
    externalId: item.externalId || null,
    externalSource: item.externalSource || null,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items: ImportItem[] = Array.isArray(body) ? body : body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided for import' },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    // Fetch existing items for duplicate detection
    const existingMedia = await prisma.media.findMany({
      select: { title: true, category: true, externalId: true, externalSource: true },
    });

    const existingSet = new Set(
      existingMedia.map((m) => `${m.title.toLowerCase()}|${m.category}`)
    );
    const externalSet = new Set(
      existingMedia
        .filter((m) => m.externalId && m.externalSource)
        .map((m) => `${m.externalId}|${m.externalSource}`)
    );

    for (const item of items) {
      const validation = validateItem(item);
      if (!validation.valid) {
        failed++;
        errors.push(`${item.title || 'Unknown'}: ${validation.error}`);
        continue;
      }

      const sanitized = sanitizeItem(item);

      // Check for duplicates
      const titleKey = `${sanitized.title.toLowerCase()}|${sanitized.category}`;
      if (item.externalId && item.externalSource) {
        const extKey = `${item.externalId}|${item.externalSource}`;
        if (externalSet.has(extKey)) {
          skipped++;
          continue;
        }
      } else if (existingSet.has(titleKey)) {
        skipped++;
        continue;
      }

      try {
        // Upsert by externalId+externalSource if available, or create new
        if (sanitized.externalId && sanitized.externalSource) {
          await prisma.media.upsert({
            where: {
              // SQLite doesn't support compound unique by default, so we use findFirst + create/update
              id: (
                await prisma.media.findFirst({
                  where: {
                    externalId: sanitized.externalId,
                    externalSource: sanitized.externalSource,
                  },
                  select: { id: true },
                })
              )?.id ?? 'never-match',
            },
            create: sanitized,
            update: sanitized,
          });
        } else {
          await prisma.media.create({ data: sanitized });
        }
        imported++;
        existingSet.add(titleKey);
      } catch (err) {
        failed++;
        errors.push(`${sanitized.title}: Import failed`);
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      failed,
      errors: errors.slice(0, 20), // Cap error list
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to import media' },
      { status: 500 }
    );
  }
}
