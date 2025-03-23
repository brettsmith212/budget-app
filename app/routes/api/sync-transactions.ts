/**
 * @file API route to sync transactions from Plaid
 * @description
 * This route handles the transaction sync action. It can be triggered manually by authenticated users
 * via a POST request or automatically via a cron job with a GET request and a secret key.
 *
 * Key features:
 * - Requires authentication for manual sync using Supabase session
 * - Allows cron job sync with a secret key and hardcoded user ID
 * - Calls the syncTransactions function to perform the sync
 *
 * @dependencies
 * - @remix-run/node: For ActionFunction and json utilities
 * - ~/lib/supabase.server: For requireUser utility and Supabase client creation
 * - ~/lib/plaid.server: For syncTransactions function
 * - @supabase/supabase-js: For createClient function
 *
 * @notes
 * - For cron job sync, uses the service role client to bypass RLS, assuming SINGLE_USER_ID is set
 * - Requires SYNC_KEY and SINGLE_USER_ID environment variables in .env.local
 * - Errors are returned as JSON for manual sync; cron job errors are thrown to be logged
 */
import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireUser } from '~/lib/supabase.server';
import { syncTransactions } from '~/lib/plaid.server';
import { createClient } from '@supabase/supabase-js';

/**
 * Action to handle transaction sync requests
 * @param request - The incoming HTTP request
 * @returns JSON response with success status or error
 * @throws Redirect to /auth/login if unauthenticated and no valid key
 */
export const action: ActionFunction = async ({ request }) => {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (key === process.env.SYNC_KEY) {
    // Cron job sync with secret key
    const userId = process.env.SINGLE_USER_ID;
    if (!userId) {
      throw new Error('SINGLE_USER_ID environment variable not set');
    }
    const supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await syncTransactions(userId, supabaseClient);
    return json({ success: true });
  } else {
    // Manual sync requiring authentication
    const { user, supabase } = await requireUser(request);
    await syncTransactions(user.id, supabase);
    return json({ success: true });
  }
};