'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  watching: { label: 'Watching', color: 'bg-emerald-500/20 text-emerald-400' },
  reading: { label: 'Reading', color: 'bg-emerald-500/20 text-emerald-400' },
  listening: { label: 'Listening', color: 'bg-emerald-500/20 text-emerald-400' },
  completed: { label: 'Completed', color: 'bg-blue-500/20 text-blue-400' },
  dropped: { label: 'Dropped', color: 'bg-red-500/20 text-red-400' },
  planned: { label: 'Planned', color: 'bg-gray-500/20 text-gray-400' },
  on_hold: { label: 'On hold', color: 'bg-amber-500/20 text-amber-400' },
  'on-hold': { label: 'On hold', color: 'bg-amber-500/20 text-amber-400' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.planned;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}
