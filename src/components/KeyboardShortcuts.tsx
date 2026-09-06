'use client';

import { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['Ctrl', 'K'], description: 'Command palette' },
  { keys: ['Esc'], description: 'Close modal / Clear search' },
  { keys: ['/'], description: 'Focus search bar' },
  { keys: ['Enter'], description: 'Search / Add to library' },
  { keys: ['Arrow Up', 'Arrow Down'], description: 'Navigate search results' },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-gray-800 border border-gray-700 rounded text-[11px] font-mono text-gray-300">
      {children}
    </kbd>
  );
}

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (e.key === '?' && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-medium text-white">Keyboard Shortcuts</h2>
          </div>
          <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {SHORTCUTS.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, j) => (
                  <span key={j} className="flex items-center gap-1">
                    {j > 0 && <span className="text-gray-600 text-xs">+</span>}
                    <Kbd>{key}</Kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-gray-800 text-[11px] text-gray-600">
          Press <Kbd>?</Kbd> anytime to toggle this panel
        </div>
      </div>
    </div>
  );
}
