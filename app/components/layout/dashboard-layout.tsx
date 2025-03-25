/**
 * @file Dashboard layout component with tabbed navigation
 * @description
 * This component provides the main layout for the dashboard and uses the AppHeader
 * component for navigation.
 */

import { Outlet, useFetcher } from '@remix-run/react';
import AppHeader from './app-header';
import type { User } from '@supabase/supabase-js';

interface DashboardLayoutProps {
  user: User;
}

export default function DashboardLayout({ user }: DashboardLayoutProps) {
  const fetcher = useFetcher();
  const handleLogout = () => {
    fetcher.submit(null, { method: 'post', action: '/auth/logout' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader user={user} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}