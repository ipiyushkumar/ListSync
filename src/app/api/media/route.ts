import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/media
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const limit = searchParams.get('limit');

  const where: Record<string, string> = {};
  if (category) where.category = category;
  if (status) where.status = status;

  const media = await prisma.media.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    ...(limit ? { take: parseInt(limit) } : {}),
  });

  return NextResponse.json(media);
}

// POST /api/media
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Check for existing entry by externalId (if provided) or by title+category
  let existing = null;
  if (body.externalId && body.externalSource) {
    existing = await prisma.media.findFirst({
      where: { externalId: body.externalId, externalSource: body.externalSource },
    });
  }
  if (!existing && body.title && body.category) {
    existing = await prisma.media.findFirst({
      where: {
        title: { contains: body.title },
        category: body.category,
      },
    });
  }

  if (existing) {
    // Update existing entry with new data (merge, don't overwrite user progress)
    const updateData: Record<string, unknown> = {};
    if (body.description) updateData.description = body.description;
    if (body.posterUrl || body.coverImage) updateData.posterUrl = body.posterUrl || body.coverImage;
    if (body.totalEpisodes) updateData.totalEpisodes = body.totalEpisodes;
    if (body.rating) updateData.rating = body.rating;
    if (body.releaseDate) updateData.releaseDate = body.releaseDate;
    if (body.genres) updateData.genres = JSON.stringify(body.genres);
    if (body.platforms) updateData.platforms = JSON.stringify(body.platforms);
    // Backfill externalId/externalSource if missing on existing entry
    if (body.externalId && !existing.externalId) updateData.externalId = body.externalId;
    if (body.externalSource && !existing.externalSource) updateData.externalSource = body.externalSource;
    // Don't overwrite status or currentEp — user's progress takes priority

    const media = await prisma.media.update({
      where: { id: existing.id },
      data: updateData,
    });
    return NextResponse.json(media);
  }

  const media = await prisma.media.create({
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      status: body.status || 'planned',
      rating: body.rating,
      posterUrl: body.posterUrl || body.coverImage,
      totalEpisodes: body.totalEpisodes,
      currentEp: body.currentEp || 0,
      externalId: body.externalId,
      externalSource: body.externalSource,
      genres: body.genres ? JSON.stringify(body.genres) : null,
      releaseDate: body.releaseDate,
      platforms: body.platforms ? JSON.stringify(body.platforms) : null,
    },
  });

  return NextResponse.json(media, { status: 201 });
}
