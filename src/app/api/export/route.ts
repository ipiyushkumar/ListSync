import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const media = await prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      const headers = [
        'title', 'originalTitle', 'description', 'category', 'posterUrl',
        'releaseDate', 'totalEpisodes', 'currentEp', 'rating', 'status',
        'genres', 'platforms', 'externalId', 'externalSource',
      ];

      const rows = media.map((item) => {
        return headers.map((h) => {
          const val = item[h as keyof typeof item];
          if (val === null || val === undefined) return '';
          return escapeCsvField(String(val));
        }).join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="listsync-export.csv"',
        },
      });
    }

    // JSON format (default)
    return NextResponse.json(media, {
      headers: {
        'Content-Disposition': 'attachment; filename="listsync-export.json"',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to export media' },
      { status: 500 }
    );
  }
}
