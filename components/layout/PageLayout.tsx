'use client';

import { ReactNode } from 'react';
import Header from './Header';
import Navigation from './Navigation';

interface PageLayoutProps {
  children: ReactNode;
  currentPage: 'dashboard' | 'zones' | 'watcher' | 'settings' | 'admin';
  session: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

export default function PageLayout({
  children,
  currentPage,
  session,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
}: PageLayoutProps) {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Header
            session={session}
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
            onLogout={onLogout}
          />
          <Navigation currentPage={currentPage} isAdmin={session?.role === 'admin'} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
