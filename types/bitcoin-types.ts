export interface BitcoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  date: string; // Use string for date to align with form/DB potentially
  value: number; // Value of Bitcoin at the time of transaction in USD
  created_at: string;
}

export interface BitcoinTransactionFormData {
  amount: number;
  date: string;
  value: number;
}
