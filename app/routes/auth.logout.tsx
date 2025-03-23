/**
 * @file Logout action to sign out the user
 * @description
 * This action destroys the user's session cookie and redirects to the root path ('/'),
 * effectively logging out the user from the application.
 *
 * Key features:
 * - Destroys the session cookie containing the access token
 * - Redirects to the root path ('/')
 *
 * @dependencies
 * - @remix-run/node: Remix server utilities for actions and redirects
 * - ~/lib/session.server: Session management utilities
 *
 * @notes
 * - This is an action-only route, typically triggered by a POST request from a form
 * - No component is rendered as it’s a redirect action
 */

import type { ActionFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { destroySession, getSession } from '~/lib/session.server';

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  return redirect('/', {
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  });
};