import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { mediaId } = body;

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId is required' }, { status: 400 });
    }

    const existing = await prisma.collectionItem.findUnique({
      where: { collectionId_mediaId: { collectionId: id, mediaId } },
    });

    if (existing) {
      return NextResponse.json({ message: 'Already in collection' }, { status: 200 });
    }

    const item = await prisma.collectionItem.create({
      data: { collectionId: id, mediaId },
      include: { media: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Failed to add item to collection:', error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId is required' }, { status: 400 });
    }

    await prisma.collectionItem.delete({
      where: { collectionId_mediaId: { collectionId: id, mediaId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove item from collection:', error);
    return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 });
  }
}
