'use client';

import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number | null;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  if (!total || total === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="font-medium">EP {current}</span>
        <span className="text-gray-500">/?</span>
      </div>
    );
  }

  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-300">
          EP {current}/{total}
        </span>
        <span className="text-gray-500">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
