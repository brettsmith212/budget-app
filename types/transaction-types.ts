export interface Transaction {
  id?: string;
  user_id?: string;
  account_id?: string;
  date: string;
  amount: number;
  category: string;
  description?: string;
  created_at?: string;
}

export interface TransactionFormData {
  date: string;
  amount: string;
  category: string;
  description: string;
}
