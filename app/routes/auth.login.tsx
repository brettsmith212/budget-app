import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { json, redirect } from '@remix-run/node';
import { commitSession, getSession } from '~/lib/session.server';
import { supabase } from '~/lib/supabase.server';
import { getSupabase } from '~/lib/supabase.server';

/**
 * Loader to check if the user is already authenticated
 * @param request - The incoming HTTP request
 * @returns Null if unauthenticated, redirects to '/' if authenticated
 */
export const loader: LoaderFunction = async ({ request }) => {
  const { user } = await getSupabase(request);
  if (user) {
    return redirect('/');
  }
  return json({});
};

/**
 * Action to handle login form submission
 * @param request - The incoming HTTP request with form data
 * @returns JSON with error on failure, or redirect to '/' with session cookie on success
 */
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');

  // Validate form inputs
  if (typeof email !== 'string' || typeof password !== 'string') {
    return json({ error: 'Invalid form data' }, { status: 400 });
  }

  // Attempt to sign in with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return json({ error: error.message }, { status: 401 });
  }

  // Store the access token in the session
  const session = await getSession(request.headers.get('Cookie'));
  session.set('access_token', data.session.access_token);

  // Redirect to dashboard with the session cookie
  return redirect('/', {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  });
};

/**
 * Login component rendering the authentication form
 * @returns JSX element with login form and error display
 */
export default function Login() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 rounded-lg border border-border">
        <h1 className="text-2xl font-bold text-foreground mb-6">Login</h1>

        {actionData?.error && (
          <p className="text-destructive mb-4">{actionData.error}</p>
        )}

        <Form method="post" className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full p-2 rounded-md border border-input bg-background text-foreground"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-foreground mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full p-2 rounded-md border border-input bg-background text-foreground"
            />
          </div>

          <button
            type="submit"
            className="w-full p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Login
          </button>
        </Form>
      </div>
    </div>
  );
}