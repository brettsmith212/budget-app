/**
 * @file Plaid client and utility functions for server-side use
 * @description
 * This module initializes the Plaid client with environment variables and provides functions
 * to create link tokens, exchange public tokens for access tokens, and sync transactions.
 * It supports connecting financial accounts and syncing transactions for those accounts.
 *
 * Key features:
 * - Initializes Plaid client with client ID, secret, and environment
 * - Creates link tokens for Plaid Link initialization
 * - Exchanges public tokens for access tokens and saves account details to Supabase
 * - Syncs transactions from Plaid for all accounts of the user
 *
 * @dependencies
 * - plaid: Plaid API client library for interacting with Plaid services
 * - @supabase/supabase-js: Supabase client type for authenticated operations
 *
 * @notes
 * - Requires PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV environment variables in .env.local
 * - Assumes the accounts table has an access_token column
 * - Handles errors by throwing exceptions to be caught by calling functions
 * - Uses server-side only logic to protect sensitive operations
 * - Sync function assumes sync_cursors and transactions tables are updated per user instructions
 */

import { Configuration, PlaidApi, PlaidEnvironments, Transaction, RemovedTransaction } from 'plaid';
import type { SupabaseClient } from '@supabase/supabase-js';

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
 * @param supabaseClient - Authenticated Supabase client to respect RLS policies
 * @returns A promise that resolves when the operation is complete
 * @throws Error if token exchange, account retrieval, or database insertion fails
 */
export async function exchangePublicToken(
  publicToken: string,
  institutionName: string,
  userId: string,
  supabaseClient: SupabaseClient
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

    // Save each account to Supabase using the authenticated client
    for (const account of accounts) {
      const { error } = await supabaseClient.from('accounts').insert({
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
    // Handle Plaid API errors (e.g., invalid token, rate limits) or Supabase errors (e.g., RLS violation)
    throw new Error('Failed to exchange public token: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Determine the category ('income', 'spending', 'transfer') based on Plaid transaction and account type
 * @param transaction - The Plaid transaction object
 * @param accountType - The type of the account ('depository', 'credit', etc.)
 * @returns The category string
 */
function determineCategory(transaction: Transaction, accountType: string): 'income' | 'spending' | 'transfer' {
  if (transaction.category && transaction.category.includes('Transfer')) {
    return 'transfer';
  }
  if (accountType === 'depository' || accountType === 'investment') {
    return transaction.amount > 0 ? 'income' : 'spending';
  }
  if (accountType === 'credit') {
    return transaction.amount > 0 ? 'spending' : 'income';
  }
  return 'spending';
}

/**
 * Sync transactions from Plaid for all accounts of the user
 * @param userId - The user's ID
 * @param supabaseClient - Authenticated Supabase client
 * @returns Promise that resolves when sync is complete
 * @throws Error if database queries or Plaid API calls fail
 */
export async function syncTransactions(userId: string, supabaseClient: SupabaseClient) {
  // Get all accounts for the user
  const { data: accounts, error: accountsError } = await supabaseClient
    .from('accounts')
    .select('id, access_token, plaid_account_id, account_type')
    .eq('user_id', userId);

  if (accountsError) throw new Error(`Failed to fetch accounts: ${accountsError.message}`);

  const accessTokens = [...new Set(accounts.map(a => a.access_token))]; // Deduplicate access tokens

  for (const accessToken of accessTokens) {
    // Get current cursor for this access token
    const { data: cursorData } = await supabaseClient
      .from('sync_cursors')
      .select('cursor')
      .eq('user_id', userId)
      .eq('access_token', accessToken)
      .single();

    let cursor = cursorData ? cursorData.cursor : null;
    let hasMore = true;

    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor,
      });

      const { added, modified, removed, next_cursor } = response.data;

      // Process added transactions
      for (const tx of added) {
        const account = accounts.find(a => a.plaid_account_id === tx.account_id);
        if (!account) continue; // Skip if account not found
        const category = determineCategory(tx, account.account_type);
        const { error } = await supabaseClient.from('transactions').insert({
          user_id: userId,
          account_id: account.id,
          plaid_transaction_id: tx.transaction_id,
          date: tx.date,
          amount: tx.amount,
          category,
          description: tx.name,
        });
        if (error) throw new Error(`Failed to insert transaction ${tx.transaction_id}: ${error.message}`);
      }

      // Process modified transactions
      for (const tx of modified) {
        const account = accounts.find(a => a.plaid_account_id === tx.account_id);
        if (!account) continue;
        const category = determineCategory(tx, account.account_type);
        const { error } = await supabaseClient.from('transactions').update({
          date: tx.date,
          amount: tx.amount,
          category,
          description: tx.name,
        }).eq('plaid_transaction_id', tx.transaction_id).eq('account_id', account.id);
        if (error) throw new Error(`Failed to update transaction ${tx.transaction_id}: ${error.message}`);
      }

      // Process removed transactions
      const accountIds = accounts.filter(a => a.access_token === accessToken).map(a => a.id);
      for (const removedTx of removed) {
        const { error } = await supabaseClient.from('transactions')
          .delete()
          .eq('plaid_transaction_id', removedTx.transaction_id)
          .in('account_id', accountIds);
        if (error) throw new Error(`Failed to delete transaction ${removedTx.transaction_id}: ${error.message}`);
      }

      // Update cursor for next iteration or completion
      cursor = next_cursor;
      hasMore = response.data.has_more;
    }

    // Save the final cursor
    const { error: cursorError } = await supabaseClient.from('sync_cursors').upsert({
      user_id: userId,
      access_token: accessToken,
      cursor,
    }, { onConflict: 'user_id,access_token' });
    if (cursorError) throw new Error(`Failed to update sync cursor: ${cursorError.message}`);
  }
}