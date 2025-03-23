Project Setup
[x] Step 1: Initialize project and install dependencies
Task: Set up the Remix project and install required libraries to prepare the development environment.
Files: None (user action)
Step Dependencies: None
User Instructions:
Run npx create-remix@latest to create a new Remix project (if not using the starter template).
Install Tailwind CSS: Follow the official Tailwind CSS installation guide for Remix.
Install Shadcn: Follow the Shadcn installation instructions.
Install Framer Motion: Run npm install framer-motion.
Install Supabase client: Run npm install @supabase/supabase-js.
Install Plaid client: Run npm install @plaid/client.
Set up environment variables in .env.local:
```
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
PLAID_CLIENT_ID=<your-plaid-client-id>
PLAID_SECRET=<your-plaid-secret>
PLAID_ENV=sandbox (or development/production)
BITCOIN_API_URL=https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd
```
Update .env.example with the above variables.
[x] Step 2: Set up Supabase database schema and RLS policies
Task: Create the necessary database tables in Supabase and configure Row-Level Security (RLS) to restrict access to the authenticated user.
Files: None (user action)
Step Dependencies: Step 1
User Instructions:
Log in to your Supabase project.
Run the following SQL scripts in the Supabase SQL editor to create tables and enable RLS:
```sql
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  plaid_account_id text UNIQUE NOT NULL,
  institution_name text NOT NULL,
  account_name text NOT NULL,
  account_type text NOT NULL,
  created_at timestamp DEFAULT NOW()
);

CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  account_id uuid REFERENCES accounts(id),
  date date NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  description text,
  created_at timestamp DEFAULT NOW()
);

CREATE TABLE bitcoin_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  date date NOT NULL,
  value numeric NOT NULL,
  created_at timestamp DEFAULT NOW()
);

CREATE TABLE bitcoin_prices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  price numeric NOT NULL,
  fetched_at timestamp DEFAULT NOW()
);

-- Enable RLS for each table
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bitcoin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bitcoin_prices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to restrict access to the authenticated user
CREATE POLICY "Users can only access their own accounts" ON accounts
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own bitcoin transactions" ON bitcoin_transactions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own bitcoin prices" ON bitcoin_prices
  FOR ALL USING (auth.uid() = user_id);
Authentication
```
[ ] Step 3: Implement Supabase authentication
Task: Set up the Supabase client and implement login/logout functionality to secure the app for exclusive use.
Files:
app/lib/supabase.server.ts: Create Supabase client for server-side use with environment variables.
app/routes/auth/login.tsx: Create a login page with a form to authenticate users via Supabase.
app/routes/auth/logout.tsx: Create a logout action to sign out users.
app/components/auth-provider.tsx: Create an authentication provider component to manage session state.
app/hooks/use-auth.ts: Create a hook to access authentication state in components.
Step Dependencies: Step 2
User Instructions: None
Layout and Navigation
[ ] Step 4: Implement basic layout with sidebar
Task: Create a dashboard layout with a sidebar for navigation, using a dark theme and Tailwind CSS.
Files:
app/components/layout/dashboard-layout.tsx: Create a layout component with a sidebar and main content area.
app/components/layout/sidebar.tsx: Create a sidebar component with navigation links to Overview (/), Transactions (/transactions), and Cash Flow (/cashflow).
app/root.tsx: Update the root component to use the dashboard layout and protect routes with authentication.
Step Dependencies: Step 3
User Instructions: None
Account Integration
[ ] Step 5: Implement Plaid account connection
Task: Set up the Plaid client and create a route to connect Betterment and Chase Credit Card accounts using Plaid Link.
Files:
app/lib/plaid.server.ts: Create a Plaid client with functions to exchange public tokens for access tokens and save to the accounts table.
app/routes/accounts/connect.tsx: Create a route with a Plaid Link component for account connection.
app/components/plaid-link.tsx: Create a reusable Plaid Link component for initiating the connection flow.
Step Dependencies: Step 3, Step 4
User Instructions: None
[ ] Step 6: Implement transaction sync server action
Task: Create a server action to sync transactions from Plaid accounts and save them to the transactions table, with a manual trigger option.
Files:
app/lib/plaid.server.ts: Add a function to sync transactions using Plaid’s /transactions/sync endpoint.
app/routes/api/sync-transactions.ts: Create an API route to trigger the transaction sync action.
Step Dependencies: Step 5
User Instructions: Set up a cron job to call GET /api/sync-transactions daily (e.g., using a service like Vercel Cron Jobs or a server-side scheduler).
Transaction Management
[ ] Step 7: Implement manual transaction entry
Task: Create a form for manually entering transactions (income/spending) and display them in a list with categorization.
Files:
app/components/forms/transaction-form.tsx: Create a form component for entering transaction details (date, amount, category, description).
app/routes/transactions/index.tsx: Implement a server action to save transactions to the transactions table and display them in a list.
Step Dependencies: Step 3, Step 4
User Instructions: None
Bitcoin Transactions
[ ] Step 8: Implement Bitcoin transaction entry
Task: Create a form for manually entering Bitcoin transactions and display them with their recorded values.
Files:
app/components/forms/bitcoin-form.tsx: Create a form component for entering Bitcoin transactions (amount, date, value).
app/routes/transactions/bitcoin.tsx: Implement a server action to save Bitcoin transactions to the bitcoin_transactions table and display them.
Step Dependencies: Step 3, Step 4
User Instructions: None
[ ] Step 9: Implement Bitcoin price fetching server action
Task: Create a server action to fetch real-time Bitcoin prices from an API (e.g., CoinGecko) and store them in the bitcoin_prices table.
Files:
app/lib/bitcoin.server.ts: Create a function to fetch the current Bitcoin price and save it with the authenticated user’s ID.
app/routes/api/fetch-bitcoin-price.ts: Create an API route to trigger the price fetch action.
Step Dependencies: Step 8
User Instructions: Set up a cron job to call GET /api/fetch-bitcoin-price every 15 minutes (e.g., using a service like Vercel Cron Jobs or a server-side scheduler).
Financial Overview
[ ] Step 10: Implement cash flow calculation and display
Task: Calculate cash flow (total income, total spending, remainder) for monthly, quarterly, and yearly periods and display in a table.
Files:
app/lib/cashflow.server.ts: Create server-side functions to calculate cash flow based on transactions and bitcoin_transactions.
app/routes/cashflow/index.tsx: Create a route to display cash flow in a table with period selection (e.g., tabs or dropdown).
Step Dependencies: Step 7, Step 8
User Instructions: None
Data Management
[ ] Step 11: Implement data export to CSV
Task: Add functionality to export transactions and cash flow data to CSV files for download.
Files:
app/lib/csv.server.ts: Create functions to generate CSV data from transactions, bitcoin_transactions, and cash flow calculations.
app/routes/transactions/index.tsx: Add an export button to download transactions as CSV.
app/routes/cashflow/index.tsx: Add an export button to download cash flow summaries as CSV.
Step Dependencies: Step 7, Step 10
User Instructions: None
Error Handling and Edge Cases
[ ] Step 12: Implement error handling and edge cases
Task: Add comprehensive error handling for API calls, input validation for forms, and edge case management (e.g., no data scenarios).
Files:
app/lib/plaid.server.ts: Add error handling for Plaid API calls.
app/lib/bitcoin.server.ts: Add error handling for Bitcoin price API calls.
app/lib/supabase.server.ts: Add error handling for database operations.
app/routes/transactions/index.tsx: Add input validation and no-data messaging.
app/routes/transactions/bitcoin.tsx: Add input validation and no-data messaging.
app/routes/cashflow/index.tsx: Add no-data messaging.
Step Dependencies: All previous steps
User Instructions: None