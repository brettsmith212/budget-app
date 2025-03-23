/**
 * @file Transactions page for the dashboard
 * @description
 * This component renders the content for the Transactions tab in the dashboard.
 * It currently displays a placeholder title, to be replaced with transaction
 * management functionality in a future step.
 *
 * Key features:
 * - Sets meta tags for SEO and page identification
 * - Displays a placeholder title in a consistent style
 *
 * @dependencies
 * - @remix-run/node: For MetaFunction type to define page metadata
 *
 * @notes
 * - This is a temporary placeholder; full transaction functionality will be added in Step 7
 * - Inherits the authenticated layout and navigation from _layout.tsx
 * - Uses Tailwind classes for dark theme consistency with dashboard-layout.tsx
 */

import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: 'Transactions - Personal Finance Dashboard' },
    { name: 'description', content: 'View and manage your financial transactions' },
  ];
};

export default function Transactions() {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-4">Transactions</h1>
    </div>
  );
}