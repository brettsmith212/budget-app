import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { requireUser } from "@/lib/supabase.server";
import { BitcoinForm } from "@/components/forms/bitcoin-form";
import { BitcoinTransaction, BitcoinTransactionFormData } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { getCurrentBitcoinPrice } from "@/lib/bitcoin.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, user } = await requireUser(request);

  const [transactions, currentPrice] = await Promise.all([
    supabase
      .from("bitcoin_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false }),
    getCurrentBitcoinPrice()
  ]);

  if (transactions.error) {
    console.error("Error fetching bitcoin transactions:", transactions.error);
    throw new Response("Error fetching transactions", { status: 500 });
  }

  return json({ 
    transactions: transactions.data || [], 
    currentPrice 
  }, { headers: {} });
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
  const { transactions, currentPrice } = useLoaderData<typeof loader>();

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

  // Calculate total BTC and current value
  const totalBTC = transactions.reduce((sum: number, tx: BitcoinTransaction) => sum + Number(tx.amount), 0);
  const currentTotalValue = currentPrice ? totalBTC * currentPrice : null;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Current Bitcoin Price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(currentPrice)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Bitcoin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBTC(totalBTC)} BTC</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(currentTotalValue)}</p>
          </CardContent>
        </Card>
      </div>

      <h1 className="text-2xl font-bold">Bitcoin Transactions</h1>

      <BitcoinForm />

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount (BTC)</TableHead>
              <TableHead>Value at Purchase (USD)</TableHead>
              <TableHead>Current Value (USD)</TableHead>
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
                  <TableCell>{formatCurrency(currentPrice ? tx.amount * currentPrice : null)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
