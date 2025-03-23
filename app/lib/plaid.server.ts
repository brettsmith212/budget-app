/**
 * @file Plaid client and utility functions for server-side use
 * @description
 * This module initializes the Plaid client with environment variables and provides functions
 * to create link tokens and exchange public tokens for access tokens, saving account details
 * to Supabase. It supports connecting financial accounts like Betterment and Chase Credit Card.
 *
 * Key features:
 * - Initializes Plaid client with client ID, secret, and environment
 * - Creates link tokens for Plaid Link initialization
 * - Exchanges public tokens for access tokens and saves account details to Supabase
 *
 * @dependencies
 * - plaid: Plaid API client library for interacting with Plaid services
 * - ~/lib/supabase.server: Supabase client for database operations
 *
 * @notes
 * - Requires PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV environment variables in .env.local
 * - Assumes the accounts table has an access_token column (to be added by the user if missing)
 * - Handles errors by throwing exceptions to be caught by calling functions
 * - Uses server-side only logic to protect sensitive operations
 */

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { supabase } from './supabase.server';

// Initialize Plaid client with environment variables
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID as string,
      'PLAID-SECRET': process.env.PLAID_SECRET as string,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

/**
 * Create a link token for Plaid Link initialization
 * @param userId - The unique identifier of the user from Supabase
 * @returns A promise resolving to the link token string
 * @throws Error if the link token creation fails due to API errors or misconfiguration
 */
export async function createLinkToken(userId: string): Promise<string> {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId, // Unique per user for Plaid Link consistency
      },
      client_name: 'Personal Finance App', // Displayed in Plaid Link UI
      products: ['transactions'], // Required for transaction syncing
      country_codes: ['US'], // Limited to US accounts per project scope
      language: 'en', // English UI for simplicity
    });
    return response.data.link_token;
  } catch (error) {
    // Handle network errors, API rate limits, or invalid credentials
    throw new Error('Failed to create link token: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Exchange a public token for an access token and save account details to Supabase
 * @param publicToken - The public token received from Plaid Link on successful connection
 * @param institutionName - The name of the financial institution from Plaid metadata
 * @param userId - The unique identifier of the user from Supabase
 * @returns A promise that resolves when the operation is complete
 * @throws Error if token exchange, account retrieval, or database insertion fails
 */
export async function exchangePublicToken(
  publicToken: string,
  institutionName: string,
  userId: string
): Promise<void> {
  try {
    // Exchange public token for access token
    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    const accessToken = tokenResponse.data.access_token;

    // Get account details using the access token
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    const accounts = accountsResponse.data.accounts;

    // Save each account to Supabase
    for (const account of accounts) {
      const { error } = await supabase.from('accounts').insert({
        user_id: userId,
        access_token: accessToken, // Stored for future transaction syncs
        plaid_account_id: account.account_id, // Unique identifier from Plaid
        institution_name: institutionName, // From Plaid Link metadata
        account_name: account.name, // Human-readable account name
        account_type: account.type, // e.g., 'investment' or 'credit'
      });

      if (error) {
        throw new Error(`Failed to save account ${account.account_id}: ${error.message}`);
      }
    }
  } catch (error) {
    // Handle Plaid API errors (e.g., invalid token, rate limits) or Supabase errors (e.g., unique constraint violation)
    throw new Error('Failed to exchange public token: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}