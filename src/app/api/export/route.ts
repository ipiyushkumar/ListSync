import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function escapeCsv(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(media: Record<string, unknown>[]): string {
  if (media.length === 0) return '';
  const headers = Object.keys(media[0]);
  const rows = media.map((item) => headers.map((h) => escapeCsv(item[h])).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const media = await prisma.media.findMany({
      orderBy: { createdAt: 'asc' },
    });

    if (format === 'csv') {
      const csv = toCsv(media);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="listsync-export-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json(media, {
      headers: {
        'Content-Disposition': `attachment; filename="listsync-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
