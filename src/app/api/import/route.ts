import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { media } = body;

    if (!Array.isArray(media)) {
      return NextResponse.json({ error: 'Invalid import format: expected an array of media items' }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of media) {
      try {
        if (!item.title || !item.category) {
          skipped++;
          continue;
        }

        // Upsert by externalId if available, otherwise create new
        if (item.externalId) {
          const existing = await prisma.media.findFirst({
            where: { externalId: item.externalId, externalSource: item.externalSource },
          });

          if (existing) {
            // Update existing
            await prisma.media.update({
              where: { id: existing.id },
              data: {
                title: item.title,
                originalTitle: item.originalTitle || null,
                description: item.description || null,
                category: item.category,
                posterUrl: item.posterUrl || null,
                releaseDate: item.releaseDate || null,
                totalEpisodes: item.totalEpisodes || null,
                currentEp: item.currentEp ?? 0,
                rating: item.rating || null,
                status: item.status || 'planned',
                genres: item.genres || null,
                platforms: item.platforms || null,
                airStatus: item.airStatus || null,
                notes: item.notes || null,
                favorite: item.favorite ?? false,
              },
            });
            imported++;
          } else {
            // Create new
            await prisma.media.create({
              data: {
                title: item.title,
                originalTitle: item.originalTitle || null,
                description: item.description || null,
                category: item.category,
                posterUrl: item.posterUrl || null,
                releaseDate: item.releaseDate || null,
                totalEpisodes: item.totalEpisodes || null,
                currentEp: item.currentEp ?? 0,
                rating: item.rating || null,
                status: item.status || 'planned',
                genres: item.genres || null,
                platforms: item.platforms || null,
                externalId: item.externalId || null,
                externalSource: item.externalSource || null,
                airStatus: item.airStatus || null,
                notes: item.notes || null,
                favorite: item.favorite ?? false,
              },
            });
            imported++;
          }
        } else {
          // No external ID, create new
          await prisma.media.create({
            data: {
              title: item.title,
              originalTitle: item.originalTitle || null,
              description: item.description || null,
              category: item.category,
              posterUrl: item.posterUrl || null,
              releaseDate: item.releaseDate || null,
              totalEpisodes: item.totalEpisodes || null,
              currentEp: item.currentEp ?? 0,
              rating: item.rating || null,
              status: item.status || 'planned',
              genres: item.genres || null,
              platforms: item.platforms || null,
              airStatus: item.airStatus || null,
              notes: item.notes || null,
              favorite: item.favorite ?? false,
            },
          });
          imported++;
        }
      } catch (err) {
        errors.push(`Failed to import "${item.title}": ${(err as Error).message}`);
        skipped++;
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}
