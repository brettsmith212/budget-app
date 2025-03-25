/**
 * Transactions page with manual transaction entry form and transaction list
 *
 * This page allows users to:
 * 1. Enter transactions manually via a form
 * 2. View their transactions in a sortable, filterable list
 * 3. See transaction summary statistics
 */

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { requireUser } from "~/lib/supabase.server";
import TransactionForm from "~/components/forms/transaction-form";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ArrowUpDown, Search } from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import type { Transaction, TransactionFormData, ActionState } from "@/types";

export const meta: MetaFunction = () => {
  return [
    { title: "Transactions - Budget App" },
    { name: "description", content: "Manage your financial transactions" },
  ];
};

/**
 * Loader function to fetch transactions for the authenticated user
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, user } = await requireUser(request);

  try {
    // Fetch transactions from the database
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate summary statistics
    const totalIncome = transactions
      ?.filter((t: Transaction) => t.amount > 0)
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0) || 0;

    const totalExpenses = transactions
      ?.filter((t: Transaction) => t.amount < 0)
      .reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0) || 0;

    const balance = totalIncome - totalExpenses;

    return json({
      transactions: transactions || [],
      stats: {
        totalIncome,
        totalExpenses,
        balance
      },
      error: null
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return json({
      transactions: [], 
      stats: {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0
      },
      error: "Failed to load transactions. Please try again later."
    });
  }
}

/**
 * Action function to handle transaction form submissions
 */
export async function action({ request }: ActionFunctionArgs) {
  const { supabase, user } = await requireUser(request);
  const formData = await request.formData();
  const _action = formData.get("_action");

  // Handle transaction creation
  if (_action === "createTransaction") {
    // Parse and validate form data
    const date = formData.get("date") as string;
    const amountStr = formData.get("amount") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;

    // Validate required fields
    if (!date || !amountStr || !category) {
      return json<ActionState<TransactionFormData>>({
        isSuccess: false,
        message: "Date, amount, and category are required.",
      });
    }

    // Validate and parse amount
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      return json<ActionState<TransactionFormData>>({
        isSuccess: false,
        message: "Amount must be a valid number.",
      });
    }

    // Create transaction object
    const transaction: Omit<Transaction, "id" | "created_at"> = {
      user_id: user.id,
      date,
      amount,
      category,
      description: description || "",
    };

    // Insert transaction into database
    const { data, error } = await supabase
      .from("transactions")
      .insert(transaction)
      .select()
      .single();

    if (error) {
      console.error("Error inserting transaction:", error);
      return json<ActionState<TransactionFormData>>({
        isSuccess: false,
        message: "Failed to save transaction. Please try again.",
      });
    }

    // Return success response with form data
    return json<ActionState<TransactionFormData>>({
      isSuccess: true,
      message: "Transaction added successfully!",
      data: {
        date,
        amount: amountStr,
        category,
        description,
      },
    });
  }

  return null;
}

export default function TransactionsPage() {
  const { transactions, stats, error } = useLoaderData<typeof loader>();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof Transaction>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Handle sorting
  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Apply filters and sorting to transactions
  const filteredAndSortedTransactions = transactions
    .filter((transaction: Transaction) => {
      // Apply category filter
      if (categoryFilter !== "all" && transaction.category !== categoryFilter) {
        return false;
      }

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          transaction.description?.toLowerCase().includes(searchLower) ||
          transaction.category.toLowerCase().includes(searchLower) ||
          transaction.amount.toString().includes(searchLower)
        );
      }

      return true;
    })
    .sort((a: Transaction, b: Transaction) => {
      // Apply sorting
      if (sortField === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }

      if (sortField === "amount") {
        return sortDirection === "asc"
          ? a.amount - b.amount
          : b.amount - a.amount;
      }

      // Sort by string fields
      const valueA = String(a[sortField]).toLowerCase();
      const valueB = String(b[sortField]).toLowerCase();

      return sortDirection === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Transactions</h1>

      {/* Transaction Form */}
      <TransactionForm />

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="bg-green-50 dark:bg-green-900/20">
            <CardTitle>Income</CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${stats.totalIncome.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <CardTitle>Expenses</CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${stats.totalExpenses.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
            <CardTitle>Balance</CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <p className={`text-2xl font-bold ${
              stats.balance >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-red-600 dark:text-red-400"
            }`}>
              ${stats.balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-8">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder="Search transactions..."
            className="pl-9"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select
          value={categoryFilter}
          onValueChange={setCategoryFilter}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="housing">Housing</SelectItem>
            <SelectItem value="transportation">Transportation</SelectItem>
            <SelectItem value="food">Food & Dining</SelectItem>
            <SelectItem value="utilities">Utilities</SelectItem>
            <SelectItem value="healthcare">Healthcare</SelectItem>
            <SelectItem value="entertainment">Entertainment</SelectItem>
            <SelectItem value="education">Education</SelectItem>
            <SelectItem value="shopping">Shopping</SelectItem>
            <SelectItem value="personal">Personal Care</SelectItem>
            <SelectItem value="travel">Travel</SelectItem>
            <SelectItem value="debt">Debt Payments</SelectItem>
            <SelectItem value="savings">Savings & Investments</SelectItem>
            <SelectItem value="gifts">Gifts & Donations</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("date")} className="cursor-pointer">
                Date
                {sortField === "date" && (
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                )}
              </TableHead>

              <TableHead
                onClick={() => handleSort("description")}
                className="cursor-pointer"
              >
                Description
                {sortField === "description" && (
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                )}
              </TableHead>

              <TableHead
                onClick={() => handleSort("category")}
                className="cursor-pointer"
              >
                Category
                {sortField === "category" && (
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                )}
              </TableHead>

              <TableHead
                onClick={() => handleSort("amount")}
                className="cursor-pointer text-right"
              >
                Amount
                {sortField === "amount" && (
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                )}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredAndSortedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  {searchTerm || categoryFilter !== "all"
                    ? "No matching transactions found."
                    : "No transactions yet. Add one using the form above."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedTransactions.map((transaction: Transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(parseISO(transaction.date), "MMM dd, yyyy")}
                  </TableCell>

                  <TableCell>{transaction.description}</TableCell>

                  <TableCell>
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {transaction.category}
                    </span>
                  </TableCell>

                  <TableCell className={`text-right font-medium ${
                    transaction.amount >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                    {transaction.amount >= 0 ? "+" : ""}
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
