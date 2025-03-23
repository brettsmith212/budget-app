/**
 * @file Session management utilities for server-side use
 * @description
 * This module configures cookie-based session storage to manage user authentication tokens securely.
 *
 * Key features:
 * - Creates a session storage instance with secure cookie settings
 * - Exports functions to get, commit, and destroy sessions
 *
 * @dependencies
 * - @remix-run/node: Remix utilities for server-side session management
 *
 * @notes
 * - Requires SESSION_SECRET environment variable to be set in .env.local for cookie signing
 * - Cookie is secure (HTTPS-only) in production and uses lax same-site policy for usability
 * - Session data is stored server-side and transmitted via HTTP-only cookies
 */

import { createCookieSessionStorage } from '@remix-run/node';

// Retrieve the session secret from environment variables
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET environment variable must be set');
}

// Configure session storage with secure cookie options
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',           // Cookie name for identification
    httpOnly: true,             // Prevent client-side JavaScript access
    path: '/',                  // Available across the entire site
    sameSite: 'lax',            // Protect against CSRF while allowing navigation
    secrets: [sessionSecret],   // Signing secret for security
    secure: process.env.NODE_ENV === 'production', // HTTPS-only in production
  },
});

// Export session management functions
export const { getSession, commitSession, destroySession } = sessionStorage;