/**
 * @file Overview page for the dashboard
 * @description
 * This component renders the content for the Overview tab in the dashboard.
 * It currently displays a placeholder message, to be replaced with actual
 * financial overview data (e.g., account summaries) in future steps.
 *
 * Key features:
 * - Sets meta tags for SEO and page identification
 * - Displays a welcome message as a placeholder
 *
 * @dependencies
 * - @remix-run/node: For MetaFunction type to define page metadata
 *
 * @notes
 * - This is a temporary placeholder; actual content will be added in later steps
 * - Navigation is handled by the parent DashboardLayout component
 * - Optimized for dark theme with Tailwind classes from tailwind.css
 */

import type { MetaFunction, LoaderFunction } from '@remix-run/node';
import { requireUser } from '~/lib/supabase.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Personal Finance Dashboard' },
    { name: 'description', content: 'Overview of your personal finances' },
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
  await requireUser(request);
  return null;
};

export default function Overview() {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome to Your Finance Dashboard</h1>
      <p className="text-lg text-muted-foreground">
        Select a tab to view your transactions or cash flow.
      </p>
    </div>
  );
}