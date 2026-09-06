import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/activity?limit=20
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const category = searchParams.get('category');
    const mediaId = searchParams.get('mediaId');

    const where: Record<string, unknown> = {};
    if (category) {
      where.media = { category };
    }
    if (mediaId) {
      where.mediaId = mediaId;
    }

    const activities = await prisma.activity.findMany({
      where,
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        media: {
          select: {
            id: true,
            title: true,
            category: true,
            posterUrl: true,
          },
        },
      },
    });

    return NextResponse.json(activities);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

// POST /api/activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mediaId, action, episode, source, metadata } = body;

    if (!mediaId || !action) {
      return NextResponse.json(
        { error: 'mediaId and action are required' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['started', 'paused', 'completed', 'episode_watched', 'watched', 'read', 'listened'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate source
    const validSources = ['manual', 'auto', 'extension'];
    if (source && !validSources.includes(source)) {
      return NextResponse.json(
        { error: `source must be one of: ${validSources.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify media exists
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        mediaId,
        action,
        episode: episode ?? null,
        source: source || 'manual',
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
      include: {
        media: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}
