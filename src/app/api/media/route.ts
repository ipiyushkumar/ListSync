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
