# Project Name
Personal Finance Web App

## Project Description
A secure, personal finance web application built with Remix to manage my Betterment and Chase Credit Card accounts, manually entered Bitcoin savings, and overall cash flow. The app will connect to financial institutions via Plaid with automatic daily syncs and manual refresh options, allow manual transaction entry, categorize income and spending, calculate cash flow over multiple periods, and fetch real-time Bitcoin prices every 15 minutes. Data will be stored in Supabase with authentication and Row-Level Security (RLS) to ensure privacy. The app will feature an extensible dashboard with Overview, Transactions, and Cash Flow tabs, and will be hosted publicly but designed for my exclusive use.

## Target Audience
Myself as the sole user, with a focus on privacy and personalized financial tracking.

## Desired Features
### Account Integration
- [ ] Connect to financial accounts via Plaid
    - [ ] Support Betterment and Chase Credit Card accounts
    - [ ] Automatic daily sync
    - [ ] Manual refresh option
- [ ] Record Bitcoin transactions
    - [ ] Manual entry (amount, date, value)
    - [ ] Fetch current Bitcoin price via API for real-time valuation
        - [ ] Refresh every 15 minutes

### Transaction Management
- [ ] Add individual transactions manually
    - [ ] Support both income and spending
- [ ] Categorize transactions
    - [ ] Apply categories to both credit (spending) and debit (income)

### Financial Overview
- [ ] Calculate cash flow
    - [ ] Show total spent, total income, and remainder
    - [ ] Display in a professional table format
    - [ ] Calculate for monthly, quarterly, and yearly periods

### Data Management
- [ ] Export data to CSV
    - [ ] Include all transactions and cash flow summaries

### Data Storage and Security
- [ ] Store data in Supabase tables
- [ ] Use Supabase for authentication
    - [ ] Restrict access to my user ID only
    - [ ] Implement Row-Level Security (RLS) policies

## Design Requests
- [ ] Minimalistic SaaS dashboard style
    - [ ] Dark color theme
    - [ ] Optimized for laptop view (mobile view deferred to later iteration)
    - [ ] Extensible tabbed layout
        - [ ] Overview tab
        - [ ] Transactions tab
        - [ ] Cash Flow tab

## Other Notes
- App will be hosted publicly, so security is a priority
- Built with Remix for web deployment
- I will handle Plaid account setup and provide documentation for endpoint development
- Bitcoin tracking starts with manual entry; API integration is for price fetching only
- Future features like Trends and Budgets are deferred to later iterations