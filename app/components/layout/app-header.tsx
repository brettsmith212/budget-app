/**
 * @file App header component
 * @description
 * This component provides the main header for the app, supporting both
 * authenticated and non-authenticated states. It displays navigation tabs
 * for authenticated users and a simple header with login button for
 * non-authenticated users.
 */

import { NavLink, Link } from '@remix-run/react';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';

interface AppHeaderProps {
  user: User | null;
  onLogout?: () => void;
}

export default function AppHeader({ user, onLogout }: AppHeaderProps) {
  const tabs = [
    { name: 'Overview', href: '/' },
    { name: 'Transactions', href: '/transactions' },
    { name: 'Cash Flow', href: '/cashflow' },
  ];

  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold mr-8">Budget App</Link>

          {user && (
            <nav>
              <ul className="flex space-x-4">
                {tabs.map((tab) => (
                  <li key={tab.href}>
                    <NavLink
                      to={tab.href}
                      className={({ isActive }) =>
                        cn(
                          'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-secondary'
                        )
                      }
                    >
                      {tab.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-foreground">
                Welcome, {user.user_metadata.name || user.email}
              </span>
              <button
                onClick={onLogout}
                className="px-3 py-1 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/auth/login"
              className="px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
