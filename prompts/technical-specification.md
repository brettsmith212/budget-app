Personal Finance Web App Technical Specification
1. System Overview
Core Purpose and Value Proposition: A secure, personal finance web application designed for a single user to manage Betterment and Chase Credit Card accounts, manually entered Bitcoin savings, and overall cash flow. It provides automatic transaction syncing via Plaid, manual transaction entry, income/spending categorization, cash flow calculation over multiple periods, and real-time Bitcoin price tracking, all with a focus on privacy and personalized financial tracking.
Key Workflows:
User authentication and authorization via Supabase.
Connecting to financial accounts (Betterment, Chase Credit Card) using Plaid.
Automatic daily transaction sync with manual refresh capability.
Manual entry of transactions, including Bitcoin transactions.
Categorizing transactions as income or spending.
Calculating cash flow for monthly, quarterly, and yearly periods.
Fetching real-time Bitcoin prices every 15 minutes.
Exporting transaction data and cash flow summaries to CSV.
System Architecture: Built with Remix for full-stack web development, using Supabase for data storage and authentication, Plaid for financial account integration, and an external API (e.g., CoinGecko) for Bitcoin prices. The frontend leverages Tailwind CSS for styling and Shadcn for UI components, optimized for a minimalistic SaaS dashboard style with a dark theme.
2. Project Structure
Detailed Breakdown of Project Structure & Organization:
```
my-remix-app/
├── app/
│   ├── routes/
│   │   ├── _index.tsx         # Root route (dashboard with tabbed layout)
│   │   ├── auth/              # Authentication routes
│   │   │   ├── login.tsx      # Login page
│   │   │   └── logout.tsx     # Logout action
│   │   ├── accounts/          # Account management routes
│   │   │   └── connect.tsx    # Plaid account connection
│   │   ├── transactions/      # Transaction management routes
│   │   │   ├── index.tsx      # Transaction list and manual entry
│   │   │   └── bitcoin.tsx    # Bitcoin transaction entry and display
│   │   ├── cashflow/          # Cash flow calculation and display
│   │   │   └── index.tsx      # Cash flow table for different periods
│   ├── components/            # Reusable UI components
│   │   ├── layout/            # Layout components
│   │   │   ├── dashboard-layout.tsx  # Tabbed layout for dashboard
│   │   │   └── sidebar.tsx    # Navigation sidebar
│   │   ├── forms/             # Form components
│   │   │   ├── transaction-form.tsx  # Manual transaction entry form
│   │   │   └── bitcoin-form.tsx      # Bitcoin transaction entry form
│   │   ├── tables/            # Table components
│   │   │   └── cashflow-table.tsx    # Cash flow display table
│   │   ├── buttons/           # Button components
│   │   │   └── export-button.tsx     # CSV export button
│   ├── lib/                   # Utility functions and server-side logic
│   │   ├── plaid.server.ts    # Plaid integration logic
│   │   ├── supabase.server.ts # Supabase client and queries
│   │   ├── bitcoin.server.ts  # Bitcoin price fetching logic
│   │   └── csv.server.ts      # CSV generation and export logic
│   ├── root.tsx               # Root layout component with global styles
│   ├── entry.client.tsx       # Client-side entry point
│   └── entry.server.tsx       # Server-side entry point
├── public/                    # Static assets
│   ├── favicon.ico
│   └── logo.png
├── types/                     # Type definitions
│   ├── index.ts               # Export all types
│   ├── transaction-types.ts   # Transaction-related types
│   └── bitcoin-types.ts       # Bitcoin-related types
├── package.json               # Project dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
├── .env.local                 # Environment variables (e.g., Plaid, Supabase keys)
└── .env.example               # Example environment variables
```

3. Feature Specification
3.1 Account Integration
User Story and Requirements: As a user, I want to connect my Betterment and Chase Credit Card accounts via Plaid so that my transactions are automatically synced daily, with a manual refresh option.
Detailed Implementation Steps:
Install and configure the Plaid client library in app/lib/plaid.server.ts.
Create a route app/routes/accounts/connect.tsx with a Plaid Link component for account connection.
Implement a server action to exchange the Plaid public token for an access token and store it in the accounts table in Supabase.
Set up a cron job (e.g., via a serverless function) to call Plaid’s /transactions/sync endpoint daily, saving transactions to the transactions table.
Add a manual refresh button in app/routes/transactions/index.tsx that triggers the sync action.
Error Handling and Edge Cases:
Handle Plaid API errors (e.g., rate limits, authentication failures) with retry logic and user-facing error messages.
Manage revoked accounts by prompting reconnection and removing stale data.
Address sync failures (e.g., network issues) by logging errors and retrying with exponential backoff.
Handle multiple accounts at the same institution by associating each with a unique plaid_account_id.
3.2 Record Bitcoin Transactions
User Story and Requirements: As a user, I want to manually enter Bitcoin transactions and see their real-time value based on current Bitcoin prices, refreshed every 15 minutes.
Detailed Implementation Steps:
Create a form component app/components/forms/bitcoin-form.tsx for entering Bitcoin transactions (amount, date, value).
Implement a server action in app/routes/transactions/bitcoin.tsx to save entries to the bitcoin_transactions table.
Set up a scheduled task in app/lib/bitcoin.server.ts to fetch Bitcoin prices from CoinGecko API every 15 minutes, storing them in the bitcoin_prices table.
Calculate and display real-time valuation in app/routes/transactions/bitcoin.tsx by multiplying transaction amounts by the latest price.
Error Handling and Edge Cases:
Handle API downtime by using the last known price and displaying a warning.
Validate manual entries (e.g., positive amounts) and display errors for invalid input.
Manage rapid price fluctuations by caching prices and updating the UI smoothly.
Address large transaction volumes with pagination or lazy loading.
3.3 Transaction Management
User Story and Requirements: As a user, I want to manually add individual transactions and categorize them as income or spending.
Detailed Implementation Steps:
Create a form component app/components/forms/transaction-form.tsx with fields for date, amount, category (income/spending), and description.
Implement a server action in app/routes/transactions/index.tsx to save transactions to the transactions table with RLS enforcement.
Display transactions in a list with category filters.
Error Handling and Edge Cases:
Validate input (e.g., date format, positive amounts) and show errors for invalid data.
Prevent duplicates by checking existing transactions with the same date, amount, and description.
Handle future-dated transactions by allowing them but flagging them visually.
3.4 Financial Overview
User Story and Requirements: As a user, I want to see my cash flow over monthly, quarterly, and yearly periods, showing total spent, total income, and remainder in a table.
Detailed Implementation Steps:
Fetch transaction data from Supabase in app/routes/cashflow/index.tsx using a loader.
Calculate cash flow (total income, total spending, remainder) for each period in a server function.
Display results in app/components/tables/cashflow-table.tsx with period tabs or a dropdown.
Error Handling and Edge Cases:
Show zero values or a message for periods with no transactions.
Handle large datasets with optimized queries (e.g., indexed date field).
Address mixed income/spending periods by ensuring accurate categorization.
3.5 Data Management
User Story and Requirements: As a user, I want to export my transaction data and cash flow summaries to CSV.
Detailed Implementation Steps:
Create a server function in app/lib/csv.server.ts to fetch transactions and cash flow data.
Generate CSV content using a library (e.g., papaparse) or manual string formatting.
Add an export button in app/components/buttons/export-button.tsx triggering a download response.
Error Handling and Edge Cases:
Disable the export button if no data exists, with a user notification.
Ensure special characters (e.g., commas) are escaped in CSV output.
Handle large exports with streaming or chunking if necessary.
3.6 Data Storage and Security
User Story and Requirements: As a user, I want my data stored securely in Supabase with authentication and RLS to restrict access to my user ID only.
Detailed Implementation Steps:
Initialize Supabase in app/lib/supabase.server.ts with environment variables for URL and key.
Implement authentication in app/routes/auth/* using Supabase Auth.
Configure RLS policies on all tables to enforce auth.uid() = user_id.
Error Handling and Edge Cases:
Redirect unauthenticated users to login and handle session expiration.
Test RLS policies to prevent unauthorized access.
Log and alert on security misconfigurations.
4. Database Schema
4.1 Tables
users

id uuid PRIMARY KEY
email text UNIQUE NOT NULL
created_at timestamp DEFAULT NOW()
accounts

id uuid PRIMARY KEY
user_id uuid REFERENCES users(id) NOT NULL
plaid_account_id text UNIQUE NOT NULL
institution_name text NOT NULL
account_name text NOT NULL
account_type text NOT NULL
created_at timestamp DEFAULT NOW()
transactions

id uuid PRIMARY KEY
user_id uuid REFERENCES users(id) NOT NULL
account_id uuid REFERENCES accounts(id)
date date NOT NULL
amount numeric NOT NULL
category text CHECK (category IN ('income', 'spending')) NOT NULL
description text
created_at timestamp DEFAULT NOW()
bitcoin_transactions

id uuid PRIMARY KEY
user_id uuid REFERENCES users(id) NOT NULL
date date NOT NULL
amount numeric NOT NULL
value numeric NOT NULL
created_at timestamp DEFAULT NOW()
bitcoin_prices

id uuid PRIMARY KEY
price numeric NOT NULL
fetched_at timestamp DEFAULT NOW()
Relationships:
users 1:N accounts
accounts 1:N transactions
users 1:N bitcoin_transactions
Indexes:
users: id, email
accounts: id, user_id, plaid_account_id
transactions: id, user_id, account_id, date
bitcoin_transactions: id, user_id, date
bitcoin_prices: id, fetched_at
RLS Policies (to be set up in Supabase SQL Editor):
```
CREATE POLICY "Users can only access their own data"
ON transactions
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own accounts"
ON accounts
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own bitcoin transactions"
ON bitcoin_transactions
FOR ALL
TO authenticated
USING (auth.uid() = user_id);
```
5. Server Actions
5.1 Database Actions
CRUD Operations:
Create Transaction: Insert into transactions with validated data.
```
async function createTransaction(data: TransactionData, userId: string) {
  const { error } = await supabase.from('transactions').insert({ ...data, user_id: userId });
  if (error) throw new Error(error.message);
}
```
Fetch Cash Flow: Query transactions for a period.
```
async function getCashFlow(userId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, category')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);
  if (error) throw new Error(error.message);
  return data.reduce(
    (acc, t) => ({
      income: t.category === 'income' ? acc.income + t.amount : acc.income,
      spending: t.category === 'spending' ? acc.spending + t.amount : acc.spending,
      remainder: t.category === 'income' ? acc.remainder + t.amount : acc.remainder - t.amount,
    }),
    { income: 0, spending: 0, remainder: 0 }
  );
}
```

5.2 Other Actions
External API Integrations:
Plaid API:
Endpoints: /link/token/create, /transactions/get, /transactions/sync
Authentication: Plaid client ID and secret from .env.local
Data Format: JSON
Bitcoin Price API (CoinGecko):
Endpoint: /simple/price?ids=bitcoin&vs_currencies=usd
Authentication: None (public API)
Data Format: JSON
File Handling:
CSV export in app/lib/csv.server.ts:

```
async function exportToCSV(userId: string) {
  const { data } = await supabase.from('transactions').select('*').eq('user_id', userId);
  const csv = data.map(t => `${t.date},${t.amount},${t.category},${t.description}`).join('\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv' } });
}
```

Data Processing:
Cash flow calculation in getCashFlow function.
Bitcoin valuation: Multiply bitcoin_transactions.amount by latest bitcoin_prices.price.
6. Design System
6.1 Visual Style
Color Palette:
Primary: #1E3A8A (dark blue)
Secondary: #10B981 (green)
Background: #111827 (dark gray)
Text: #F3F4F6 (light gray)
Typography:
Font Family: Inter
Headings: 24px, bold
Body Text: 16px, regular
Component Styling Patterns:
Buttons: Rounded corners, shadow on hover
Forms: Minimalistic with clear labels
Spacing and Layout Principles:
Padding: 16px
Margins: 8px between elements
6.2 Core Components
Layout Structure:
Tabbed layout in app/components/layout/dashboard-layout.tsx:
```
<Tabs defaultValue="overview">
  <TabList>
    <Tab value="overview">Overview</Tab>
    <Tab value="transactions">Transactions</Tab>
    <Tab value="cashflow">Cash Flow</Tab>
  </TabList>
  <TabPanel value="overview">{/* Overview content */}</TabPanel>
  <TabPanel value="transactions">{/* Transactions content */}</TabPanel>
  <TabPanel value="cashflow">{/* Cash Flow content */}</TabPanel>
</Tabs>
```

Navigation Patterns: Sidebar in app/components/layout/sidebar.tsx.
Shared Components:
Button: <Button variant="primary">Submit</Button>
Form: <Form><FormField label="Amount" /></Form>
Interactive States:
Hover: Lighten background
Active: Darken background
Disabled: Grayed out, cursor-not-allowed
7. Component Architecture
7.1 Server Components
Data Fetching Strategy: Use Remix loaders:
```
export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  const transactions = await supabase.from('transactions').select('*').eq('user_id', userId);
  return json({ transactions });
}
```
Suspense Boundaries: Wrap data-fetching components in <Suspense>.
Error Handling: Use <ErrorBoundary> for fallback UI.
Props Interface:
```
interface TransactionListProps {
  transactions: Transaction[];
}
```
7.2 Client Components
State Management Approach: React useState for form inputs.
Event Handlers: Handle form submissions with actions.
UI Interactions: Smooth transitions with Framer Motion.
Props Interface:
```
interface TransactionFormProps {
  onSubmit: (data: TransactionData) => void;
}
```
8. Authentication & Authorization
Supabase Authentication Implementation:
Use Supabase Auth UI in app/routes/auth/login.tsx.
Manage sessions with supabase.auth.getSession().
Protected Routes Configuration:
```
export async function loader({ request }: LoaderArgs) {
  const session = await supabase.auth.getSession();
  if (!session) throw redirect('/auth/login');
  return json({ userId: session.data.session.user.id });
}
```
RLS Policies: Defined in Section 4.1.

9. Data Flow
Server/Client Data Passing Mechanisms: Use useLoaderData:
```
const { transactions } = useLoaderData<typeof loader>();
```
State Management Architecture: React useState for local state, Remix actions for server updates.