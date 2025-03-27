/**
 * Transactions page with manual transaction entry form and transaction list
 *
 * This page allows users to:
 * 1. Enter transactions manually via a form
 * 2. View their transactions in a sortable, filterable list
 * 3. See transaction summary statistics
 */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import type { Transaction, TransactionFormData, ActionState } from "@/types";

import { json, redirect } from "@remix-run/node";
import { useLoaderData, useRevalidator, Form, useFetcher } from "@remix-run/react";
import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { ArrowUpDown, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { requireUser } from "@/lib/supabase.server";
import TransactionForm from "@/components/forms/transaction-form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

    // Redirect back to the page to force a fresh load of data
    return redirect("/transactions");
  }

  // Handle transaction update
  if (_action === "updateTransaction") {
    const transactionId = formData.get("transactionId") as string;
    const date = formData.get("date") as string;
    const amountStr = formData.get("amount") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;

    // Validate required fields
    if (!transactionId || !date || !amountStr || !category) {
      return json<ActionState<TransactionFormData>>({
        isSuccess: false,
        message: "Missing required fields for update.",
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

    // Update transaction in database
    const { error } = await supabase
      .from("transactions")
      .update({
        date,
        amount,
        category,
        description: description || "",
      })
      .eq("id", transactionId)
      .eq("user_id", user.id); // Ensure user can only update their own transactions

    if (error) {
      console.error("Error updating transaction:", error);
      return json<ActionState<TransactionFormData>>({
        isSuccess: false,
        message: "Failed to update transaction. Please try again.",
      });
    }

    // Redirect back to the page to force a fresh load of data
    return redirect("/transactions");
  }

  // Handle transaction deletion
  if (_action === "deleteTransaction") {
    const transactionId = formData.get("transactionId") as string;

    if (!transactionId) {
      return json<ActionState<null>>({
        isSuccess: false,
        message: "Transaction ID is required for deletion.",
      });
    }

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId)
      .eq("user_id", user.id); // Ensure user can only delete their own transactions

    if (error) {
      console.error("Error deleting transaction:", error);
      return json<ActionState<null>>({
        isSuccess: false,
        message: "Failed to delete transaction. Please try again.",
      });
    }

    // Redirect back to the page to force a fresh load of data
    return redirect("/transactions");
  }
}

export default function TransactionsPage() {
  const { transactions, stats, error } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const transactionFetcher = useFetcher();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction;
    direction: "asc" | "desc";
  }>({ key: "date", direction: "desc" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // This effect ensures we revalidate data after fetcher submissions complete
  useEffect(() => {
    if (transactionFetcher.state === "idle" && transactionFetcher.data) {
      console.log("Fetcher completed, revalidating...");
      revalidator.revalidate();
    }
  }, [transactionFetcher.state, transactionFetcher.data, revalidator]);

  // This effect ensures we revalidate data when component mounts or forceUpdate changes
  useEffect(() => {
    console.log("Force update triggered, revalidating...");
    revalidator.revalidate();
  }, [forceUpdate, revalidator]);

  // Filter transactions based on search term and category
  const filteredTransactions = (transactions || []).filter((transaction: Transaction) => {
    const matchesSearch =
      searchTerm === "" ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || transaction.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // Special handling for dates
    if (sortConfig.key === "date") {
      return (new Date(aValue as string).getTime() - new Date(bValue as string).getTime()) *
        (sortConfig.direction === "asc" ? 1 : -1);
    }

    // Special handling for amounts
    if (sortConfig.key === "amount") {
      return ((aValue as number) - (bValue as number)) *
        (sortConfig.direction === "asc" ? 1 : -1);
    }

    // Handle string comparisons (category, description)
    return (String(aValue).localeCompare(String(bValue))) *
      (sortConfig.direction === "asc" ? 1 : -1);
  });

  // Get unique categories for filter dropdown
  const categories = Array.from(
    new Set(transactions?.map(t => t.category) ?? [])
  ).sort();

  // Handle sort click
  const handleSortClick = (key: keyof Transaction) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Format amount with currency symbol
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), "MMM d, yyyy");
  };

  // Handle successful transaction operations
  const handleTransactionSuccess = () => {
    console.log("Transaction success handler called");
    
    // Trigger both a direct revalidation and a component update
    revalidator.revalidate();
    setForceUpdate(prev => prev + 1);
    
    // Wait a short moment and revalidate again to ensure data is fresh
    setTimeout(() => {
      console.log("Delayed revalidation triggered");
      revalidator.revalidate();
    }, 500);
  };

  return (
    <div className="container py-8 space-y-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatAmount(stats.totalIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatAmount(stats.totalExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                stats.balance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatAmount(stats.balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Form */}
      <TransactionForm
        onSuccess={handleTransactionSuccess}
        trigger={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSortClick("date")}
                  className="flex items-center gap-1"
                >
                  Date
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSortClick("amount")}
                  className="flex items-center gap-1"
                >
                  Amount
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSortClick("category")}
                  className="flex items-center gap-1"
                >
                  Category
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.map((transaction: Transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{formatDate(transaction.date)}</TableCell>
                <TableCell
                  className={
                    transaction.amount >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  {formatAmount(transaction.amount)}
                </TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell className="text-right space-x-2">
                  <TransactionForm
                    mode="edit"
                    transaction={transaction}
                    onSuccess={handleTransactionSuccess}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this transaction? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <transactionFetcher.Form method="post">
                          <input type="hidden" name="_action" value="deleteTransaction" />
                          <input type="hidden" name="transactionId" value={transaction.id} />
                          <AlertDialogAction
                            type="submit"
                            onClick={() => {
                              // We'll let the fetcher handle the submission
                              // The useEffect above will trigger revalidation when complete
                              setTimeout(() => {
                                handleTransactionSuccess();
                              }, 200);
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </transactionFetcher.Form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {sortedTransactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTransaction(null)}>
              Cancel
            </AlertDialogCancel>
            <transactionFetcher.Form method="post">
              <input type="hidden" name="_action" value="deleteTransaction" />
              <input
                type="hidden"
                name="transactionId"
                value={selectedTransaction?.id}
              />
              <AlertDialogAction
                type="submit"
                onClick={() => setSelectedTransaction(null)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </transactionFetcher.Form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
