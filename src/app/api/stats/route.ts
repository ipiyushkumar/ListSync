import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const total = await prisma.media.count();
    const byCategory = await prisma.media.groupBy({
      by: ['category'],
      _count: true,
    });
    const byStatus = await prisma.media.groupBy({
      by: ['status'],
      _count: true,
    });
    const avgRating = await prisma.media.aggregate({
      _avg: { rating: true },
      where: { rating: { gt: 0 } },
    });

    return NextResponse.json({
      total,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count,
      })),
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      averageRating: avgRating._avg.rating || 0,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 },
    );
  }
}
