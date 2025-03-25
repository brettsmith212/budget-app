/**
 * @file Index route for the application
 * @description
 * This component renders either the dashboard home for authenticated users
 * or a landing page for non-authenticated users.
 */

import { useLoaderData } from '@remix-run/react';
import { json } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '~/lib/supabase.server';

export const loader: LoaderFunction = async ({ request }) => {
  const { user } = await getSupabase(request);
  return json({ user });
};

export default function Index() {
  const { user } = useLoaderData<{ user: User | null }>();

  if (user) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Welcome to your Budget Dashboard</h2>
          <p className="text-muted-foreground">
            This is where you'll see your financial overview and insights.
          </p>
        </div>
      </div>
    );
  } else {
    return (
      <div className="py-12">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Take Control of Your Finances</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Track your spending, manage your budget, and achieve your financial goals
            with our simple and powerful budgeting tools.
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="/auth/login"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
            >
              Get Started
            </a>
            <a
              href="#features"
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/90"
            >
              Learn More
            </a>
          </div>
        </div>

        <div id="features" className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Track Expenses</h3>
            <p className="text-muted-foreground">
              Easily log and categorize your transactions to understand where your money goes.
            </p>
          </div>
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Budget Planning</h3>
            <p className="text-muted-foreground">
              Create custom budgets and get notified when you're approaching your limits.
            </p>
          </div>
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Financial Insights</h3>
            <p className="text-muted-foreground">
              Get valuable insights and visualizations to help you make better financial decisions.
            </p>
          </div>
        </div>
      </div>
    );
  }
}