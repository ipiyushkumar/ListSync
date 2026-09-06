'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type = 'info', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { bg: 'bg-emerald-600', Icon: CheckCircle2 },
    error: { bg: 'bg-red-600', Icon: XCircle },
    info: { bg: 'bg-gray-600', Icon: Info },
  };

  const { bg, Icon } = config[type];

  return (
    <div
      className="fixed bottom-6 right-6 z-50"
      style={{ animation: 'toast-in 0.3s ease-out' }}
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl ${bg} text-white`}>
        <Icon className="w-4 h-4 shrink-0" />
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
