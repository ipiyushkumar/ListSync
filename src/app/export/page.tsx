'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Upload, FileJson, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface MediaItem {
  id: string;
  title: string;
  originalTitle?: string | null;
  description?: string | null;
  category: string;
  posterUrl?: string | null;
  releaseDate?: string | null;
  totalEpisodes?: number | null;
  currentEp?: number | null;
  rating?: number | null;
  status: string;
  genres?: string | null;
  platforms?: string | null;
  externalId?: string | null;
  externalSource?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  anime: 'Anime',
  manhwa: 'Manhwa',
  movie: 'Movie',
  tv: 'TV',
  music: 'Music',
};

const STATUS_LABELS: Record<string, string> = {
  watching: 'Watching',
  completed: 'Completed',
  dropped: 'Dropped',
  planned: 'Planned',
  on_hold: 'On Hold',
  reading: 'Reading',
  listening: 'Listening',
};

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border backdrop-blur-sm ${colors[type]}`}>
      {type === 'success' && <CheckCircle2 size={16} />}
      {type === 'error' && <AlertTriangle size={16} />}
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

export default function ExportPage() {
  const [mediaCount, setMediaCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Import state
  const [previewItems, setPreviewItems] = useState<MediaItem[]>([]);
  const [importFileName, setImportFileName] = useState<string>('');
  const [rawJson, setRawJson] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMediaCount(data.total ?? 0);
    } catch {
      setMediaCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  const handleExportJson = () => {
    window.open('/api/export?format=json', '_blank');
  };

  const handleExportCsv = () => {
    window.open('/api/export?format=csv', '_blank');
  };

  const parseFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setToast({ message: 'Please select a JSON file', type: 'error' });
      return;
    }

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        setRawJson(text);
        const parsed = JSON.parse(text);
        const items: MediaItem[] = Array.isArray(parsed) ? parsed : parsed.items || [];
        setPreviewItems(items.slice(0, 10));
        setImportResult(null);
        if (items.length === 0) {
          setToast({ message: 'No items found in file', type: 'info' });
        }
      } catch {
        setToast({ message: 'Invalid JSON file', type: 'error' });
        setPreviewItems([]);
        setRawJson('');
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleImport = async () => {
    if (!rawJson) return;

    setImporting(true);
    try {
      const parsed = JSON.parse(rawJson);
      const items = Array.isArray(parsed) ? parsed : parsed.items || [];

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Import failed');
      }

      const result: ImportResult = await res.json();
      setImportResult(result);
      fetchCount(); // Refresh count

      if (result.failed > 0) {
        setToast({
          message: `Imported ${result.imported}, skipped ${result.skipped}, failed ${result.failed}`,
          type: 'error',
        });
      } else if (result.skipped > 0) {
        setToast({
          message: `Imported ${result.imported} items (${result.skipped} duplicates skipped)`,
          type: 'info',
        });
      } else {
        setToast({
          message: `Successfully imported ${result.imported} items`,
          type: 'success',
        });
      }
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Import failed',
        type: 'error',
      });
    } finally {
      setImporting(false);
    }
  };

  const clearImport = () => {
    setPreviewItems([]);
    setRawJson('');
    setImportFileName('');
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-white">Export / Import</h1>
          <p className="mt-1 text-sm text-gray-400">Back up your library or restore from a previous export.</p>
        </div>

        {/* Export Section */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <Download size={20} className="text-purple-400" />
            Export Library
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Download your entire media library as a file.
          </p>

          <div className="mt-4 flex items-center gap-4">
            <div className="text-sm text-gray-500">
              {loading ? (
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  Loading count...
                </span>
              ) : mediaCount === 0 ? (
                <span className="text-gray-500">No items to export</span>
              ) : (
                <span>{mediaCount} item{mediaCount !== 1 ? 's' : ''} in library</span>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleExportJson}
              disabled={loading || mediaCount === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FileJson size={16} />
              Download JSON
            </button>
            <button
              onClick={handleExportCsv}
              disabled={loading || mediaCount === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FileText size={16} />
              Download CSV
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <Upload size={20} className="text-purple-400" />
            Import Library
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Import a previously exported JSON file. Duplicates will be skipped.
          </p>

          {/* Drop Zone */}
          <div
            ref={dragRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-4 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-purple-500 bg-purple-500/5'
                : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/30'
            }`}
          >
            <Upload size={32} className="mx-auto text-gray-500 mb-3" />
            {importFileName ? (
              <div>
                <p className="text-sm text-white font-medium">{importFileName}</p>
                <p className="text-xs text-gray-500 mt-1">{previewItems.length > 0 ? `Previewing first ${Math.min(previewItems.length, 10)} of ${(() => { try { const p = JSON.parse(rawJson); return (Array.isArray(p) ? p : p.items)?.length ?? previewItems.length; } catch { return previewItems.length; } })()} items` : 'Parsing...'}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-400">Drop a JSON file here or click to browse</p>
                <p className="text-xs text-gray-600 mt-1">Accepts .json files exported from ListSync</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Preview Table */}
          {previewItems.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-300">Preview</h3>
                <button
                  onClick={clearImport}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="overflow-x-auto border border-gray-800/50 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800/50">
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/30">
                    {previewItems.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-800/20">
                        <td className="px-3 py-2 text-white">{item.title}</td>
                        <td className="px-3 py-2 text-gray-400">{CATEGORY_LABELS[item.category] || item.category}</td>
                        <td className="px-3 py-2 text-gray-400">{STATUS_LABELS[item.status] || item.status}</td>
                        <td className="px-3 py-2 text-gray-500">
                          {item.currentEp != null && item.totalEpisodes != null
                            ? `${item.currentEp}/${item.totalEpisodes}`
                            : item.currentEp != null
                            ? `${item.currentEp}`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Button */}
          {rawJson && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                {importing ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Import
                  </>
                )}
              </button>
              <button
                onClick={clearImport}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="mt-4 p-4 rounded-lg border border-gray-800/50 bg-gray-800/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-sm font-medium text-white">Import Complete</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-emerald-400 text-lg font-semibold">{importResult.imported}</p>
                  <p className="text-gray-500">Imported</p>
                </div>
                <div>
                  <p className="text-amber-400 text-lg font-semibold">{importResult.skipped}</p>
                  <p className="text-gray-500">Skipped (duplicates)</p>
                </div>
                <div>
                  <p className="text-red-400 text-lg font-semibold">{importResult.failed}</p>
                  <p className="text-gray-500">Failed</p>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-800/50">
                  <p className="text-xs text-gray-500 mb-1">Errors:</p>
                  <ul className="text-xs text-red-400/80 space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
