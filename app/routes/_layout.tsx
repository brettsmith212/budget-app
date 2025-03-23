/**
 * @file Layout route for dashboard routes
 * @description
 * This route serves as the layout for dashboard routes. It checks for authentication
 * and renders either the DashboardLayout for authenticated users or a splash page
 * for unauthenticated users.
 *
 * Key features:
 * - Checks authentication status using getSupabase
 * - Renders DashboardLayout with navigation and outlet for authenticated users
 * - Renders a splash page with login link for unauthenticated users
 *
 * @dependencies
 * - @remix-run/node: For LoaderFunction and json
 * - @remix-run/react: For useLoaderData and Link
 * - ~/lib/supabase.server: For getSupabase utility to retrieve user
 * - ~/components/layout/dashboard-layout: For DashboardLayout component
 *
 * @notes
 * - Child routes (e.g., _layout._index, _layout.transactions) are rendered within this layout
 * - For protected child routes, their loaders enforce authentication using requireUser
 */

import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import DashboardLayout from '~/components/layout/dashboard-layout';
import { getSupabase } from '~/lib/supabase.server';
import type { User } from '@supabase/supabase-js';

export const loader: LoaderFunction = async ({ request }) => {
  const { user } = await getSupabase(request);
  return json({ user });
};

export default function LayoutRoute() {
  const { user } = useLoaderData<{ user: User | null }>();
  if (user) {
    return <DashboardLayout user={user} />;
  } else {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Budget App</h1>
          <Link to="/auth/login" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
            Login
          </Link>
        </div>
      </div>
    );
  }
}