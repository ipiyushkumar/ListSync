import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/media/[id]
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(media);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

// PUT /api/media/[id] — partial update (only provided fields)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  try {

    const allowedFields = [
      'title', 'originalTitle', 'description', 'category',
      'posterUrl', 'releaseDate', 'totalEpisodes', 'currentEp',
      'rating', 'status', 'genres', 'platforms',
      'externalId', 'externalSource', 'airStatus',
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        data[field] = body[field];
      }
    }
    // Normalize status to DB canonical form
    if (typeof data.status === 'string') {
      data.status = data.status === 'on-hold' ? 'on_hold' : data.status;
    }

    const media = await prisma.media.update({ where: { id }, data });
    return NextResponse.json(media);
  } catch {
    return NextResponse.json({ error: 'Failed to update media' }, { status: 500 });
  }
}

// DELETE /api/media/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.media.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
