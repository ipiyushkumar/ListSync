'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  watching: { label: 'Watching', color: 'bg-blue-600 text-blue-100' },
  completed: { label: 'Completed', color: 'bg-green-600 text-green-100' },
  dropped: { label: 'Dropped', color: 'bg-red-600 text-red-100' },
  planned: { label: 'Planned', color: 'bg-gray-600 text-gray-100' },
  on_hold: { label: 'On Hold', color: 'bg-yellow-600 text-yellow-100' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.planned;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}
