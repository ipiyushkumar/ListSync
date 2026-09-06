import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-6">
        <span className="text-3xl font-bold text-accent">404</span>
      </div>
      <h1 className="text-lg font-semibold text-white mb-2">Page not found</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          href="/search"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover text-sm font-medium transition-colors"
        >
          <Search className="w-4 h-4" />
          Search
        </Link>
      </div>
    </div>
  );
}
