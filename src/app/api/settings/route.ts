import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_SETTINGS: Record<string, string> = {
  'apiKeys.tmdb': '',
  'apiKeys.lastfm': '',
  'apiKeys.anilist': '',
  'ai.provider': 'openai',
  'ai.apiKey': '',
  'ai.model': 'gpt-4',
  'autoDetection.socketPort': '3001',
  'autoDetection.socketEnabled': 'false',
  'appearance.theme': 'dark',
  'appearance.accentColor': '#a855f7',
};

function maskKey(key: string): string {
  if (!key || key.length < 8) return key ? '••••••••' : '';
  return key.slice(0, 4) + '••••' + key.slice(-4);
}

async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

function buildResponse(settings: Record<string, string>) {
  return {
    apiKeys: {
      tmdb: maskKey(settings['apiKeys.tmdb']),
      lastfm: maskKey(settings['apiKeys.lastfm']),
      anilist: maskKey(settings['apiKeys.anilist']),
    },
    ai: {
      provider: settings['ai.provider'],
      apiKey: maskKey(settings['ai.apiKey']),
      model: settings['ai.model'],
    },
    autoDetection: {
      socketPort: parseInt(settings['autoDetection.socketPort'] || '3001', 10),
      socketEnabled: settings['autoDetection.socketEnabled'] === 'true',
    },
    appearance: {
      theme: settings['appearance.theme'],
      accentColor: settings['appearance.accentColor'],
    },
  };
}

// GET /api/settings — returns settings with keys masked
export async function GET() {
  const settings = await getAllSettings();
  return NextResponse.json(buildResponse(settings));
}

// POST /api/settings — merges partial update, only overwrites keys if non-empty
export async function POST(request: NextRequest) {
  const body = await request.json();
  const current = await getAllSettings();

  const MASK = '••••••••';

  const updates: Array<{ key: string; value: string }> = [];

  // API keys — only update if non-empty and not masked
  // Detect any masked value: contains bullet chars or is the placeholder mask
  const isMasked = (v: string) => v === MASK || v.includes('•') || v.includes('\u2022');
  const tmdb = body.apiKeys?.tmdb;
  if (tmdb && !isMasked(tmdb)) updates.push({ key: 'apiKeys.tmdb', value: tmdb });

  const lastfm = body.apiKeys?.lastfm;
  if (lastfm && !isMasked(lastfm)) updates.push({ key: 'apiKeys.lastfm', value: lastfm });

  const anilist = body.apiKeys?.anilist;
  if (anilist && !isMasked(anilist)) updates.push({ key: 'apiKeys.anilist', value: anilist });

  // AI settings
  if (body.ai?.provider) updates.push({ key: 'ai.provider', value: body.ai.provider });
  const aiKey = body.ai?.apiKey;
  if (aiKey && !isMasked(aiKey)) updates.push({ key: 'ai.apiKey', value: aiKey });
  if (body.ai?.model) updates.push({ key: 'ai.model', value: body.ai.model });

  // Auto-detection
  if (body.autoDetection?.socketPort != null) {
    updates.push({ key: 'autoDetection.socketPort', value: String(body.autoDetection.socketPort) });
  }
  if (body.autoDetection?.socketEnabled != null) {
    updates.push({ key: 'autoDetection.socketEnabled', value: String(body.autoDetection.socketEnabled) });
  }

  // Appearance
  if (body.appearance?.theme) updates.push({ key: 'appearance.theme', value: body.appearance.theme });
  if (body.appearance?.accentColor) updates.push({ key: 'appearance.accentColor', value: body.appearance.accentColor });

  // Upsert each setting
  for (const u of updates) {
    await prisma.setting.upsert({
      where: { key: u.key },
      update: { value: u.value },
      create: { key: u.key, value: u.value, category: u.key.split('.')[0] },
    });
  }

  return NextResponse.json({ success: true });
}
