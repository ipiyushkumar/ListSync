'use client';

export default function StatCard({
  label,
  value,
  icon,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`text-left p-3 rounded-xl border transition-all ${
        accent
          ? 'bg-purple-500/10 border-purple-500/20'
          : active
          ? 'bg-gray-800 border-gray-700 ring-1 ring-purple-500/30'
          : 'bg-gray-900 border-gray-800 hover:border-gray-700'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={accent ? 'text-purple-400' : 'text-gray-500'}>{icon}</span>
        <span className="text-xs text-gray-500 uppercase tracking-wider" style={{ fontSize: '10px' }}>{label}</span>
      </div>
      <span className="text-xl font-bold text-white tabular-nums">{value}</span>
    </button>
  );
}
