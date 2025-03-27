/**
 * @file Route for connecting financial accounts via Plaid
 * @description
 * This route handles the Plaid account connection flow. It generates a link token in the loader,
 * renders the Plaid Link component, and processes the public token in the action to save account
 * details to Supabase. It supports connecting Betterment and Chase Credit Card accounts.
 *
 * Key features:
 * - Loader generates a Plaid link token for the authenticated user
 * - Renders the Plaid Link component to initiate the connection flow
 * - Action exchanges the public token for an access token and saves account details
 * - Uses useFetcher for programmatic form submission without navigation
 * - Displays connection status and errors to the user
 *
 * @dependencies
 * - @remix-run/node: For LoaderFunction, ActionFunction, json, and redirect
 * - @remix-run/react: For useLoaderData and useFetcher hooks
 * - @/lib/supabase.server: For requireUser utility to enforce authentication
 * - @/lib/plaid.server: For createLinkToken and exchangePublicToken functions
 * - @/components/plaid-link: For PlaidLinkComponent
 *
 * @notes
 * - Requires authentication; redirects to /auth/login if user is not authenticated
 * - Assumes the accounts table has an access_token column
 * - Redirects to the dashboard (/) on successful connection
 * - Uses Tailwind CSS classes for dark theme consistency
 * - Renamed to accounts.connect.tsx to follow Remix dot notation for route hierarchy
 */

import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { requireUser } from '@/lib/supabase.server';
import { createLinkToken, exchangePublicToken } from '@/lib/plaid.server';
import PlaidLinkComponent from '@/components/plaid-link';

// Define loader return type
interface LoaderData {
  linkToken: string;
}

// Define action return type
interface ActionData {
  error?: string;
  success?: boolean;
}

/**
 * Loader to generate a Plaid link token for the authenticated user
 * @param request - The incoming HTTP request
 * @returns JSON with the link token
 * @throws Redirect to /auth/login if user is not authenticated
 */
export const loader: LoaderFunction = async ({ request }) => {
  const { user } = await requireUser(request); // Enforces authentication
  const linkToken = await createLinkToken(user.id); // Generate token for Plaid Link
  return json<LoaderData>({ linkToken });
};

/**
 * Action to handle the Plaid public token exchange and account saving
 * @param request - The incoming HTTP request with form data
 * @returns Redirect to / on success, JSON with error on failure
 * @throws Redirect to /auth/login if user is not authenticated
 */
export const action: ActionFunction = async ({ request }) => {
  const { user, supabase } = await requireUser(request); // Get authenticated user and client
  if (!supabase) {
    throw new Error('Supabase client not initialized for authenticated user');
  }

  try {
    const formData = await request.formData();
    const publicToken = formData.get('publicToken') as string;
    const institutionName = formData.get('institutionName') as string;

    if (!publicToken || !institutionName) {
      return json<ActionData>({ error: 'Missing required fields' });
    }

    // Exchange public token and save account info
    await exchangePublicToken(publicToken, institutionName, user.id, supabase);
    return json<ActionData>({ success: true });
  } catch (error) {
    console.error('Error connecting account:', error);
    return json<ActionData>({ error: 'Failed to connect account' });
  }
};

/**
 * Connect route component
 * @returns JSX element with Plaid Link button and status messages
 */
export default function Connect() {
  const { linkToken } = useLoaderData<LoaderData>(); // Get link token from loader
  const fetcher = useFetcher<ActionData>(); // For programmatic form submission

  // Handle successful Plaid Link connection
  const handleOnSuccess = (publicToken: string, metadata: any) => {
    const institutionName = metadata.institution.name;
    fetcher.submit(
      { publicToken, institutionName },
      { method: 'post' } // Submit to this route's action
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 text-foreground">Connect Account</h1>
      <PlaidLinkComponent linkToken={linkToken} onSuccess={handleOnSuccess} />

      {/* Display connection status */}
      {fetcher.state === 'submitting' && (
        <p className="mt-4 text-muted-foreground">Connecting...</p>
      )}
      {fetcher.data?.error && (
        <p className="mt-4 text-destructive">{fetcher.data.error}</p>
      )}
    </div>
  );
}