/**
 * @file Dashboard layout component with tabbed navigation
 * @description
 * This component provides the main layout for the dashboard, including tabbed navigation
 * for different sections (Overview, Transactions, Cash Flow) and an outlet for rendering
 * child route content.
 *
 * Key features:
 * - Tabbed navigation using Remix's NavLink for routing
 * - Dark theme support with Tailwind CSS classes
 * - Responsive design optimized for laptop view
 *
 * @dependencies
 * - @remix-run/react: For Outlet and NavLink components
 * - ~/lib/utils: For cn utility function to merge Tailwind classes
 *
 * @notes
 * - The active tab is highlighted based on the current route using NavLink's isActive prop
 * - The layout is extensible; new tabs can be added by updating the tabs array
 * - Mobile view optimization is deferred to later iterations per project requirements
 * - Uses Tailwind’s dark mode classes, assuming dark theme is set in tailwind.css
 */

import { Outlet, NavLink } from '@remix-run/react';
import { cn } from '~/lib/utils';

export default function DashboardLayout() {
  // Define navigation tabs with names and routes
  const tabs = [
    { name: 'Overview', href: '/' },
    { name: 'Transactions', href: '/transactions' },
    { name: 'Cash Flow', href: '/cashflow' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with tabbed navigation */}
      <header className="border-b border-border">
        <nav className="container mx-auto px-4 py-4">
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
      </header>

      {/* Main content area for child routes */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}