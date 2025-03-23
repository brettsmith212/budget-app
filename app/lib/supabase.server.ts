/**
 * @file Supabase client and authentication utilities for server-side use
 * @description
 * This module initializes the Supabase client with environment variables and provides utilities
 * to manage authentication in server-side Remix routes and actions.
 *
 * Key features:
 * - Initializes a Supabase client with URL and anon key from environment variables
 * - Provides `getSupabase` to retrieve the client and user based on session token
 * - Provides `requireUser` to enforce authentication and redirect unauthenticated users
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase client library for database and auth operations
 * - @remix-run/node: Remix utilities for server-side routing and responses
 * - ./session.server: Session management utilities for cookie handling
 *
 * @notes
 * - Environment variables SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env.local
 * - The client uses the access token from the session cookie for authenticated requests
 * - RLS policies in Supabase ensure data access is restricted to the authenticated user
 * - If the token is invalid or missing, `getSupabase` returns null values, and `requireUser` redirects
 */

import { createClient } from '@supabase/supabase-js';
import { redirect } from '@remix-run/node';
import { getSession } from './session.server';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY must be set');
}

// Create the default Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get a Supabase client instance authenticated with the user's session token
 * @param request - The incoming HTTP request containing the session cookie
 * @returns An object with the authenticated Supabase client and user, or nulls if unauthenticated
 */
export async function getSupabase(request: Request) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('access_token');

  // If no token is present, return null to indicate unauthenticated state
  if (!token) {
    return { supabase: null, user: null };
  }

  // Create a new client instance with the user's access token
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // Verify the token by fetching the user; if invalid, return null
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) {
    return { supabase: null, user: null };
  }

  return { supabase: supabaseClient, user };
}

/**
 * Require an authenticated user for a route, redirecting to login if not authenticated
 * @param request - The incoming HTTP request containing the session cookie
 * @returns An object with the authenticated Supabase client and user
 * @throws Redirect to /auth/login if the user is not authenticated
 */
export async function requireUser(request: Request) {
  const { supabase, user } = await getSupabase(request);
  if (!supabase || !user) {
    throw redirect('/auth/login');
  }
  return { supabase, user };
}