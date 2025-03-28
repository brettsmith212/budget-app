import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { requireUser } from "@/lib/supabase.server";
import { BitcoinForm } from "@/components/forms/bitcoin-form";
import { BitcoinTransaction, BitcoinTransactionFormData } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, user } = await requireUser(request);

  const { data: transactions, error } = await supabase
    .from("bitcoin_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching bitcoin transactions:", error);
    throw new Response("Error fetching transactions", { status: 500 });
  }

  return json({ transactions: transactions || [] }, { headers: {} });
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, user } = await requireUser(request);

  const formData = await request.formData();
  const data = Object.fromEntries(formData) as unknown as BitcoinTransactionFormData;

  if (!data.amount || !data.date || !data.value) {
    return json({ success: false, message: "Missing required fields" }, { status: 400, headers: {} });
  }

  const { error } = await supabase
    .from("bitcoin_transactions")
    .insert({
      user_id: user.id,
      amount: data.amount,
      date: data.date,
      value: data.value,
    });

  if (error) {
    console.error("Error inserting bitcoin transaction:", error);
    return json({ success: false, message: "Failed to add transaction" }, { status: 500, headers: {} });
  }

  return json({ success: true }, { headers: {} });
}

export default function BitcoinPage() {
  const { transactions } = useLoaderData<typeof loader>();

  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  const formatBTC = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 8 });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Bitcoin Transactions</h1>

      <BitcoinForm />

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount (BTC)</TableHead>
              <TableHead>Value at Purchase (USD)</TableHead>
              <TableHead>Total Value (USD)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No Bitcoin transactions found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx: BitcoinTransaction) => (
                <TableRow key={tx.id}>
                  <TableCell>{format(new Date(tx.date + 'T00:00:00'), "PPP")}</TableCell> 
                  <TableCell>{formatBTC(tx.amount)}</TableCell>
                  <TableCell>{formatCurrency(tx.value)}</TableCell>
                  <TableCell>{formatCurrency(tx.amount * tx.value)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
