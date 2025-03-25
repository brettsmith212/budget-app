/**
 * @file Landing layout component
 * @description
 * This component provides the layout for non-authenticated users,
 * including the header with login button.
 */

import { Outlet } from '@remix-run/react';
import AppHeader from './app-header';

export default function LandingLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader user={null} />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
