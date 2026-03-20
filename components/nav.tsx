'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, GraduationCap, LayoutDashboard, BookOpen } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Student Chat', icon: BookOpen },
  { href: '/dashboard', label: 'Teacher Dashboard', icon: LayoutDashboard },
];

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #F5C4B3' }}>
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" style={{ color: '#D85A30' }} />
            <span className="text-lg font-semibold tracking-tight" style={{ color: '#712B13' }}>
              Scholara
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={
                    active
                      ? { backgroundColor: '#FAECE7', color: '#D85A30' }
                      : { color: '#993C1D' }
                  }
                  onMouseOver={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#FAECE7';
                      (e.currentTarget as HTMLAnchorElement).style.color = '#712B13';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
                      (e.currentTarget as HTMLAnchorElement).style.color = '#993C1D';
                    }
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-md transition-colors"
            style={{ color: '#993C1D' }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#712B13')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#993C1D')}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden" style={{ borderTop: '1px solid #F5C4B3', backgroundColor: '#FFFFFF' }}>
          <div className="px-4 py-2 space-y-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors"
                  style={
                    active
                      ? { backgroundColor: '#FAECE7', color: '#D85A30' }
                      : { color: '#993C1D' }
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
