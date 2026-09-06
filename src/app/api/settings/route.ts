import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json');

const DEFAULT_SETTINGS = {
  apiKeys: { tmdb: '', lastfm: '', anilist: '' },
  ai: { provider: 'openai', apiKey: '', model: 'gpt-4' },
  autoDetection: { socketPort: 3001, socketEnabled: false },
  appearance: { theme: 'dark', accentColor: '#a855f7' },
};

async function ensureDir() {
  const dir = path.dirname(SETTINGS_PATH);
  await mkdir(dir, { recursive: true });
}

async function readSettings() {
  try {
    const raw = await readFile(SETTINGS_PATH, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function maskKey(key: string): string {
  if (!key || key.length < 8) return key ? '••••••••' : '';
  return key.slice(0, 4) + '••••' + key.slice(-4);
}

// GET /api/settings — returns settings with keys masked
export async function GET() {
  const settings = await readSettings();
  const safe = {
    ...settings,
    apiKeys: {
      tmdb: maskKey(settings.apiKeys.tmdb),
      lastfm: maskKey(settings.apiKeys.lastfm),
      anilist: maskKey(settings.apiKeys.anilist),
    },
    ai: {
      ...settings.ai,
      apiKey: maskKey(settings.ai.apiKey),
    },
  };
  return NextResponse.json(safe);
}

// POST /api/settings — merges partial update, only overwrites keys if non-empty
export async function POST(request: NextRequest) {
  const body = await request.json();
  const current = await readSettings();

  const updated = {
    apiKeys: {
      tmdb: body.apiKeys?.tmdb && body.apiKeys.tmdb !== '••••••••' ? body.apiKeys.tmdb : current.apiKeys.tmdb,
      lastfm: body.apiKeys?.lastfm && body.apiKeys.lastfm !== '••••••••' ? body.apiKeys.lastfm : current.apiKeys.lastfm,
      anilist: body.apiKeys?.anilist && body.apiKeys.anilist !== '••••••••' ? body.apiKeys.anilist : current.apiKeys.anilist,
    },
    ai: {
      provider: body.ai?.provider || current.ai.provider,
      apiKey: body.ai?.apiKey && body.ai.apiKey !== '••••••••' ? body.ai.apiKey : current.ai.apiKey,
      model: body.ai?.model || current.ai.model,
    },
    autoDetection: {
      socketPort: body.autoDetection?.socketPort ?? current.autoDetection.socketPort,
      socketEnabled: body.autoDetection?.socketEnabled ?? current.autoDetection.socketEnabled,
    },
    appearance: {
      theme: body.appearance?.theme || current.appearance.theme,
      accentColor: body.appearance?.accentColor || current.appearance.accentColor,
    },
  };

  await ensureDir();
  await writeFile(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf-8');

  return NextResponse.json({ success: true });
}
