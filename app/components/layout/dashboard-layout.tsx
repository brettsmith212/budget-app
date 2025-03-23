/**
 * @file Dashboard layout component with tabbed navigation
 * @description
 * This component provides the main layout for the dashboard, including tabbed navigation
 * for different sections (Overview, Transactions, Cash Flow) and an outlet for rendering
 * child route content. It also displays a welcome message and a logout button for authenticated users.
 *
 * Key features:
 * - Tabbed navigation using Remix's NavLink for routing
 * - Dark theme support with Tailwind CSS classes
 * - Responsive design optimized for laptop view
 * - Displays user's name and logout button
 *
 * @dependencies
 * - @remix-run/react: For Outlet, NavLink, and useFetcher
 * - ~/lib/utils: For cn utility function to merge Tailwind classes
 * - @supabase/supabase-js: For User type
 *
 * @notes
 * - The active tab is highlighted based on the current route using NavLink's isActive prop
 * - The layout is extensible; new tabs can be added by updating the tabs array
 * - Mobile view optimization is deferred to later iterations per project requirements
 * - Uses Tailwind’s dark mode classes, assuming dark theme is set in tailwind.css
 */

import { Outlet, NavLink, useFetcher } from '@remix-run/react';
import { cn } from '~/lib/utils';
import type { User } from '@supabase/supabase-js';

interface DashboardLayoutProps {
  user: User;
}

export default function DashboardLayout({ user }: DashboardLayoutProps) {
  const fetcher = useFetcher();
  const handleLogout = () => {
    fetcher.submit(null, { method: 'post', action: '/auth/logout' });
  };

  const tabs = [
    { name: 'Overview', href: '/' },
    { name: 'Transactions', href: '/transactions' },
    { name: 'Cash Flow', href: '/cashflow' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
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
          <div className="flex items-center space-x-4">
            <span className="text-foreground">
              Welcome, {user.user_metadata.name || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}