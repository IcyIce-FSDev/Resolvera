'use client';

import Link from 'next/link';

interface NavigationProps {
  currentPage: 'dashboard' | 'zones' | 'watcher' | 'settings' | 'admin';
  isAdmin: boolean;
}

interface NavLink {
  href: string;
  label: string;
  id: string;
  adminOnly?: boolean;
}

const navLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', id: 'dashboard' },
  { href: '/zones', label: 'Zones', id: 'zones' },
  { href: '/watcher', label: 'Watcher', id: 'watcher' },
  { href: '/settings', label: 'Settings', id: 'settings' },
  { href: '/admin', label: 'Admin', id: 'admin', adminOnly: true },
];

export default function Navigation({ currentPage, isAdmin }: NavigationProps) {
  const filteredLinks = navLinks.filter(link => !link.adminOnly || isAdmin);

  return (
    <nav className="border-t border-gray-200 dark:border-gray-700">
      <div className="flex gap-8 -mb-px">
        {filteredLinks.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            className={`border-b-2 py-4 text-sm font-medium transition-colors ${
              currentPage === link.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
