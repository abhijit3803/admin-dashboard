'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Link from 'next/link';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/ingredients': 'Ingredients',
  '/recipes': 'Recipes',
};

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const crumbs: { label: string; href: string }[] = [];
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return crumbs;

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, href: currentPath });
  }

  return crumbs;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="header-mobile-toggle"
          onClick={onMobileMenuToggle}
          aria-label="Toggle navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <nav className="breadcrumb hide-mobile">
          <Link href="/dashboard" className="breadcrumb-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              <span className="breadcrumb-separator">/</span>
              {index === breadcrumbs.length - 1 ? (
                <span className="breadcrumb-item active">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="breadcrumb-item">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="header-right">
        <ThemeToggle />
        <div className="avatar" title="Admin User">
          A
        </div>
      </div>
    </header>
  );
}
