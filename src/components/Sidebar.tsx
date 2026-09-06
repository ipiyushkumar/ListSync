'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Search, Film, BookOpen, Clapperboard, Tv, Music, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const navItems: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Anime', href: '/anime', icon: Film },
  { label: 'Manhwa', href: '/manhwa', icon: BookOpen },
  { label: 'Movies', href: '/movies', icon: Clapperboard },
  { label: 'TV Shows', href: '/tv', icon: Tv },
  { label: 'Music', href: '/music', icon: Music },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          ListSync
        </h1>
        <p className="text-xs text-gray-500 mt-1">Media Tracker</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === item.href
                  ? 'bg-purple-500/10 text-purple-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-600">v1.0.0</div>
      </div>
    </aside>
  );
}
