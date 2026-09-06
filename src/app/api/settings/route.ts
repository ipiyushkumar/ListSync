import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_SETTINGS: Record<string, string> = {
  'apiKeys.tmdb': '',
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
  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const MASK = '••••••••';
  const isMasked = (v: string) => v === MASK || v.includes('•') || v.includes('\u2022');

  const updates: Array<{ key: string; value: string }> = [];

  // Type-safe extraction from nested body
  const apiKeys = (raw.apiKeys || {}) as Record<string, unknown>;
  const ai = (raw.ai || {}) as Record<string, unknown>;
  const autoDetection = (raw.autoDetection || {}) as Record<string, unknown>;
  const appearance = (raw.appearance || {}) as Record<string, unknown>;

  // API keys — only update if non-empty and not masked
  if (typeof apiKeys.tmdb === 'string' && apiKeys.tmdb && !isMasked(apiKeys.tmdb)) {
    updates.push({ key: 'apiKeys.tmdb', value: apiKeys.tmdb });
  }

  // AI settings
  if (typeof ai.provider === 'string' && ai.provider) updates.push({ key: 'ai.provider', value: ai.provider });
  if (typeof ai.apiKey === 'string' && ai.apiKey && !isMasked(ai.apiKey)) updates.push({ key: 'ai.apiKey', value: ai.apiKey });
  if (typeof ai.model === 'string' && ai.model) updates.push({ key: 'ai.model', value: ai.model });

  // Auto-detection
  if (autoDetection.socketPort != null) {
    updates.push({ key: 'autoDetection.socketPort', value: String(autoDetection.socketPort) });
  }
  if (autoDetection.socketEnabled != null) {
    updates.push({ key: 'autoDetection.socketEnabled', value: String(autoDetection.socketEnabled) });
  }

  // Appearance
  if (typeof appearance.theme === 'string' && appearance.theme) updates.push({ key: 'appearance.theme', value: appearance.theme });
  if (typeof appearance.accentColor === 'string' && appearance.accentColor) updates.push({ key: 'appearance.accentColor', value: appearance.accentColor });

  // Upsert each setting
  try {
    for (const u of updates) {
      await prisma.setting.upsert({
        where: { key: u.key },
        update: { value: u.value },
        create: { key: u.key, value: u.value, category: u.key.split('.')[0] },
      });
    }
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
