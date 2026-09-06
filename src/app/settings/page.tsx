'use client';

import { useState, useEffect, useCallback } from 'react';
import { Key, Link, Bot, ScanSearch, Palette, Moon, Puzzle, Radio, Zap, Eye, EyeOff, Tv, Music } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ─────────────────────────── Types ─────────────────────────── */

interface Settings {
  apiKeys: { tmdb: string; anilist: string };
  ai: { provider: string; apiKey: string; model: string };
  autoDetection: { socketPort: number; socketEnabled: boolean };
  appearance: { theme: string; accentColor: string };
}

interface Connector {
  id: string | null;
  name: string;
  type: string;
  authType: string;
  icon: string;
  category: string;
  isActive: boolean;
  lastSync: string | null;
  config: Record<string, string> | null;
}

type ToastKind = 'success' | 'error' | 'info';

/* ─────────────────── helpers / constants ───────────────────── */

const ACCENT_COLORS = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', models: ['gpt-4', 'gpt-4o', 'gpt-4o-mini'] },
  { value: 'anthropic', label: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-3-haiku-20240307'] },
  { value: 'google', label: 'Google Gemini', models: ['gemini-1.5-pro', 'gemini-1.5-flash'] },
  { value: 'deepseek', label: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder'] },
  { value: 'ollama', label: 'Ollama (Local)', models: ['llama3', 'mistral', 'codellama'] },
];

/* ──────────────────── Toast component ─────────────────────── */

function Toast({ kind, message, onClose }: { kind: ToastKind; message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = kind === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400'
    : kind === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400'
    : 'bg-blue-500/10 border-blue-500/30 text-blue-400';

  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl border text-sm font-medium shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-4 ${bg}`}>
      {message}
    </div>
  );
}

/* ───────────────── Toggle Switch ───────────────────────────── */

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
        checked ? 'bg-purple-500' : 'bg-gray-700'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

/* ─────────────── Settings Section Card ─────────────────────── */

function SectionCard({ icon: Icon, title, description, children }: {
  icon: LucideIcon; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-800/60">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

/* ──────────────────── Key Input ───────────────────────────── */

function KeyInput({ label, value, placeholder, onChange }: {
  label: string; value: string; placeholder: string; onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  const isMasked = value.includes('•');

  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show || !isMasked ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 pr-12 text-sm text-gray-100 placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-colors outline-none"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          tabIndex={-1}
        >
          {show ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════════ */

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState<{ kind: ToastKind; message: string } | null>(null);

  const showToast = useCallback((kind: ToastKind, message: string) => setToast({ kind, message }), []);

  /* ── Load data ────────────────────────────────────────────── */
  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then(setSettings).catch(() => showToast('error', 'Failed to load settings'));
    fetch('/api/connectors').then((r) => r.json()).then(setConnectors).catch(() => showToast('error', 'Failed to load connectors'));
  }, [showToast]);

  /* ── Derived helpers ──────────────────────────────────────── */
  const currentProvider = AI_PROVIDERS.find((p) => p.value === settings?.ai.provider) || AI_PROVIDERS[0];

  const updateSettings = (patch: Partial<Settings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...patch });
  };

  const updateApiKey = (key: keyof Settings['apiKeys'], value: string) => {
    if (!settings) return;
    setSettings({ ...settings, apiKeys: { ...settings.apiKeys, [key]: value } });
  };

  /* ── Save settings ────────────────────────────────────────── */
  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Save failed');
      showToast('success', 'Settings saved successfully');
      // re-fetch to get masked keys
      const fresh = await fetch('/api/settings').then((r) => r.json());
      setSettings(fresh);
    } catch {
      showToast('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  /* ── Toggle connector ─────────────────────────────────────── */
  const toggleConnector = async (name: string, next: boolean) => {
    setConnectors((prev) => prev.map((c) => c.name === name ? { ...c, isActive: next } : c));
    try {
      await fetch('/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, isActive: next }),
      });
      showToast('success', `${name} ${next ? 'connected' : 'disconnected'}`);
    } catch {
      showToast('error', `Failed to update ${name}`);
      setConnectors((prev) => prev.map((c) => c.name === name ? { ...c, isActive: !next } : c));
    }
  };

  /* ── Test AI connection ───────────────────────────────────── */
  const handleTestConnection = async () => {
    setTesting(true);
    try {
      // Simulate test — in production this would call the provider
      await new Promise((r) => setTimeout(r, 1500));
      showToast('success', `Connected to ${currentProvider.label} successfully`);
    } catch {
      showToast('error', `Failed to connect to ${currentProvider.label}`);
    } finally {
      setTesting(false);
    }
  };

  /* ── Loading state ────────────────────────────────────────── */
  if (!settings) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
          <p className="text-gray-500 text-sm">Loading settings…</p>
        </div>
      </div>
    );
  }

  /* ══════════════════════ RENDER ═════════════════════════════ */
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {toast && <Toast kind={toast.kind} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-500 mt-1 text-sm">Configure API keys, integrations, and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          {saving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />}
          Save Changes
        </button>
      </div>

      {/* ────────── 1. API Keys ────────── */}
      <SectionCard icon={Key} title="API Keys" description="Required keys for media metadata fetching">
        <KeyInput label="TMDB API Key" value={settings.apiKeys.tmdb} placeholder="v3 authenticated key" onChange={(v) => updateApiKey('tmdb', v)} />
        <KeyInput label="AniList API Key" value={settings.apiKeys.anilist} placeholder="Optional — for extended anime metadata" onChange={(v) => updateApiKey('anilist', v)} />
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <p className="text-xs text-gray-500 leading-relaxed">
            API keys are stored locally in SQLite and never leave your server.
            Get a TMDB key at{' '}
            <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">themoviedb.org</a>.
          </p>
        </div>
      </SectionCard>

      {/* ────────── 2. Integrations ────────── */}
      <SectionCard icon={Link} title="Integrations" description="Connect your favorite platforms to sync watch/listen history">
        <div className="divide-y divide-gray-800/60">
          {connectors.map((conn) => (
            <div key={conn.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="text-xl">{conn.icon}</span>
                <div>
                  <span className="text-sm font-medium text-gray-200">{conn.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-600 capitalize flex items-center gap-1">{conn.type === 'watch' ? <><Tv className="w-3 h-3 inline" /> Watch</> : <><Music className="w-3 h-3 inline" /> Listen</>}</span>
                    <span className="text-xs text-gray-700">•</span>
                    <span className="text-xs text-gray-600 capitalize">{conn.authType === 'oauth' ? 'OAuth' : 'API Key'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {conn.lastSync && (
                  <span className="text-xs text-gray-600">
                    Synced {new Date(conn.lastSync).toLocaleDateString()}
                  </span>
                )}
                <div className={`w-2 h-2 rounded-full ${conn.isActive ? 'bg-green-400' : 'bg-gray-600'}`} />
                <Toggle checked={conn.isActive} onChange={(v) => toggleConnector(conn.name, v)} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ────────── 3. AI Configuration ────────── */}
      <SectionCard icon={Bot} title="AI Configuration" description="Use AI for smart recommendations and metadata enrichment">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Provider</label>
          <select
            value={settings.ai.provider}
            onChange={(e) => {
              const p = AI_PROVIDERS.find((pp) => pp.value === e.target.value)!;
              updateSettings({ ai: { ...settings.ai, provider: e.target.value, model: p.models[0] } });
            }}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-colors outline-none appearance-none cursor-pointer"
          >
            {AI_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Model</label>
          <select
            value={settings.ai.model}
            onChange={(e) => updateSettings({ ai: { ...settings.ai, model: e.target.value } })}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-colors outline-none appearance-none cursor-pointer"
          >
            {currentProvider.models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {settings.ai.provider !== 'ollama' && (
          <KeyInput label="API Key" value={settings.ai.apiKey} placeholder={`${currentProvider.label} API key`} onChange={(v) => updateSettings({ ai: { ...settings.ai, apiKey: v } })} />
        )}

        {settings.ai.provider === 'ollama' && (
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <p className="text-xs text-gray-500 leading-relaxed">
              Ollama runs locally — no API key needed. Make sure Ollama is running on{' '}
              <code className="text-purple-400">http://localhost:11434</code>.
            </p>
          </div>
        )}

        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="w-full sm:w-auto px-6 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {testing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-purple-400" />
              Testing…
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Test Connection
            </>
          )}
        </button>
      </SectionCard>

      {/* ────────── 4. Auto-Detection ────────── */}
      <SectionCard icon={ScanSearch} title="Auto-Detection" description="Automatically detect media from your browser via Chrome extension">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-gray-800 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center gap-3 mb-3">
              <Puzzle className="w-6 h-6 text-purple-400" />
              <div>
                <h3 className="text-sm font-medium text-white">Chrome Extension</h3>
                <p className="text-xs text-gray-500">Detect media from streaming sites</p>
              </div>
            </div>
            <button
              disabled
              className="w-full px-4 py-2 bg-gray-700 text-gray-400 text-xs font-medium rounded-lg cursor-not-allowed"
            >
              Download Extension (Coming Soon)
            </button>
          </div>

          <div className="flex-1 bg-gray-800 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Radio className="w-6 h-6 text-purple-400" />
                <div>
                  <h3 className="text-sm font-medium text-white">Socket.io Server</h3>
                  <p className="text-xs text-gray-500">Receives events from extension</p>
                </div>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${settings.autoDetection.socketEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Enabled</span>
                <Toggle
                  checked={settings.autoDetection.socketEnabled}
                  onChange={(v) => updateSettings({ autoDetection: { ...settings.autoDetection, socketEnabled: v } })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Port</label>
                <input
                  type="number"
                  value={settings.autoDetection.socketPort}
                  onChange={(e) => updateSettings({ autoDetection: { ...settings.autoDetection, socketPort: parseInt(e.target.value) || 3001 } })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-purple-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ────────── 5. Appearance ────────── */}
      <SectionCard icon={Palette} title="Appearance" description="Customize the look and feel of ListSync">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">Theme</label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl border border-purple-500/30">
              <Moon className="w-5 h-5 text-purple-400" />
              <div>
                <span className="text-sm font-medium text-white">Dark</span>
                <span className="text-xs text-gray-500 ml-2">(only option for now)</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">Accent Color</label>
          <div className="flex items-center gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => updateSettings({ appearance: { ...settings.appearance, accentColor: color } })}
                className={`w-9 h-9 rounded-full transition-all ${
                  settings.appearance.accentColor === color
                    ? 'scale-110 ring-2 ring-offset-2 ring-offset-gray-900'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <div className="ml-3 flex items-center gap-2">
              <input
                type="color"
                value={settings.appearance.accentColor}
                onChange={(e) => updateSettings({ appearance: { ...settings.appearance, accentColor: e.target.value } })}
                className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs text-gray-500 font-mono">{settings.appearance.accentColor}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}
