import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const AVAILABLE_CONNECTORS = [
  { name: 'MyAnimeList', type: 'watch', authType: 'oauth', icon: '🔴', category: 'anime' },
  { name: 'AniList', type: 'watch', authType: 'oauth', icon: '🟣', category: 'anime' },
  { name: 'Crunchyroll', type: 'watch', authType: 'oauth', icon: '🟠', category: 'anime' },
  { name: 'Trakt', type: 'watch', authType: 'oauth', icon: '🔴', category: 'tv' },
  { name: 'Letterboxd', type: 'watch', authType: 'api_key', icon: '🟢', category: 'movie' },
  { name: 'Spotify', type: 'listen', authType: 'oauth', icon: '🟢', category: 'music' },
  { name: 'Last.fm', type: 'listen', authType: 'api_key', icon: '🔴', category: 'music' },
];

// GET /api/connectors — list all available connectors with DB state
export async function GET() {
  const dbConnectors = await prisma.connector.findMany();
  const dbMap = new Map(dbConnectors.map((c) => [c.name, c]));

  const connectors = AVAILABLE_CONNECTORS.map((avail) => {
    const db = dbMap.get(avail.name);
    return {
      id: db?.id || null,
      name: avail.name,
      type: avail.type,
      authType: avail.authType,
      icon: avail.icon,
      category: avail.category,
      isActive: db?.isActive ?? false,
      lastSync: db?.lastSync?.toISOString() || null,
      config: db?.config ? JSON.parse(db.config) : null,
    };
  });

  return NextResponse.json(connectors);
}

// POST /api/connectors — toggle a connector on/off
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, isActive, config } = body;

  if (!name) {
    return NextResponse.json({ error: 'Connector name required' }, { status: 400 });
  }

  const existing = await prisma.connector.findFirst({ where: { name } });

  let connector;
  if (existing) {
    connector = await prisma.connector.update({
      where: { id: existing.id },
      data: {
        isActive,
        config: config ? JSON.stringify(config) : existing.config,
      },
    });
  } else {
    const avail = AVAILABLE_CONNECTORS.find((c) => c.name === name);
    connector = await prisma.connector.create({
      data: {
        name,
        type: avail?.type || 'watch',
        authType: avail?.authType || 'oauth',
        isActive,
        config: config ? JSON.stringify(config) : null,
      },
    });
  }

  return NextResponse.json({ success: true, connector });
}
