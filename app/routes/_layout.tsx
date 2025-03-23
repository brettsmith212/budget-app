/**
 * @file Layout route for protected dashboard routes
 * @description
 * This route serves as the layout for all protected dashboard routes. It enforces
 * authentication and renders the DashboardLayout component, which includes the
 * tabbed navigation and outlet for child routes.
 *
 * Key features:
 * - Enforces authentication using requireUser from supabase.server
 * - Renders the DashboardLayout component for consistent UI across protected routes
 *
 * @dependencies
 * - @remix-run/node: For LoaderFunction type
 * - ~/lib/supabase.server: For requireUser utility to check authentication
 * - ~/components/layout/dashboard-layout: For DashboardLayout component
 *
 * @notes
 * - Child routes (e.g., _layout._index, _layout.transactions) are rendered within this layout
 * - Unauthenticated users are redirected to /auth/login by requireUser
 * - No data is returned from the loader since this is a layout route
 */

import type { LoaderFunction } from '@remix-run/node';
import { requireUser } from '~/lib/supabase.server';
import DashboardLayout from '~/components/layout/dashboard-layout';

export const loader: LoaderFunction = async ({ request }) => {
  // Enforce authentication; redirects to /auth/login if not authenticated
  await requireUser(request);
  return null;
};

export default function LayoutRoute() {
  return <DashboardLayout />;
}