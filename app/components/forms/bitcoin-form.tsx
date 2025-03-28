import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { BitcoinTransactionFormData } from "@/types";
import { toast } from "@/components/ui/use-toast";

export function BitcoinForm() {
  const fetcher = useFetcher();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState<string>("");
  const [value, setValue] = useState<string>("");

  const isSubmitting = fetcher.state === "submitting";

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!date || !amount || !value) {
      toast({ title: "Missing Fields", description: "Please fill out all fields.", variant: "destructive" });
      return;
    }

    const formData: BitcoinTransactionFormData = {
      amount: parseFloat(amount),
      date: format(date, "yyyy-MM-dd"),
      value: parseFloat(value),
    };

    fetcher.submit(formData as any, { method: "post", action: "/bitcoin" });

    // Reset form optimistically, handle potential errors later if needed
    setDate(new Date());
    setAmount("");
    setValue("");
    toast({ title: "Success", description: "Bitcoin transaction added." });
  };

  return (
    <fetcher.Form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md">
      <div className="font-semibold text-lg mb-4">Add Bitcoin Transaction</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="amount">Amount (BTC)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="any"
            placeholder="e.g., 0.5"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Input type="hidden" name="date" value={date ? format(date, "yyyy-MM-dd") : ""} />
        </div>

        <div>
          <Label htmlFor="value">Value at Purchase (USD)</Label>
          <Input
            id="value"
            name="value"
            type="number"
            step="any"
            placeholder="e.g., 50000"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add Transaction"}
      </Button>
    </fetcher.Form>
  );
}
