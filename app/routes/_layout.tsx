/**
 * @file Layout route for dashboard routes
 * @description
 * This route serves as the layout for dashboard routes. It checks for authentication
 * and renders either the DashboardLayout for authenticated users or LandingLayout
 * for unauthenticated users.
 *
 * Key features:
 * - Checks authentication status using getSupabase
 * - Renders DashboardLayout with navigation and outlet for authenticated users
 * - Renders LandingLayout for unauthenticated users
 *
 * @dependencies
 * - @remix-run/node: For LoaderFunction and json
 * - @remix-run/react: For useLoaderData
 * - @/lib/supabase.server: For getSupabase utility to retrieve user
 * - @/components/layout/dashboard-layout: For DashboardLayout component
 * - @/components/layout/landing-layout: For LandingLayout component
 *
 * @notes
 * - Child routes (e.g., _layout._index, _layout.transactions) are rendered within this layout
 * - For protected child routes, their loaders enforce authentication using requireUser
 */

import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import LandingLayout from '@/components/layout/landing-layout';
import { getSupabase } from '@/lib/supabase.server';
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
    return <LandingLayout />;
  }
}