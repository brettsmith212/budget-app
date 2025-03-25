/**
 * Transaction form component for manual entry of income/expense transactions
 *
 * This component provides a form for users to manually enter transaction details
 * including date, amount, category, and description. The form handles both income
 * (positive amounts) and expenses (negative amounts).
 */

import { useEffect, useState } from "react";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { CalendarIcon, Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import { Calendar } from "~/components/ui/calendar";
import { format } from "date-fns";
import type { ActionState, TransactionFormData } from "@/types";

// Transaction categories
const categories = [
  { value: "income", label: "Income" },
  { value: "housing", label: "Housing" },
  { value: "transportation", label: "Transportation" },
  { value: "food", label: "Food & Dining" },
  { value: "utilities", label: "Utilities" },
  { value: "healthcare", label: "Healthcare" },
  { value: "entertainment", label: "Entertainment" },
  { value: "education", label: "Education" },
  { value: "shopping", label: "Shopping" },
  { value: "personal", label: "Personal Care" },
  { value: "travel", label: "Travel" },
  { value: "debt", label: "Debt Payments" },
  { value: "savings", label: "Savings & Investments" },
  { value: "gifts", label: "Gifts & Donations" },
  { value: "other", label: "Other" },
];

export default function TransactionForm() {
  const actionData = useActionData<ActionState<TransactionFormData>>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [open, setOpen] = useState(false);
  const [isIncome, setIsIncome] = useState(false);

  // Reset form after successful submission
  useEffect(() => {
    if (actionData?.isSuccess) {
      setDate(new Date());
      setAmount("");
      setCategory("");
      setDescription("");
      setIsIncome(false);
    }
  }, [actionData]);

  // Handle amount sign based on income/expense selection
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Transform the amount based on income/expense
    const formattedAmount = isIncome
      ? Math.abs(parseFloat(amount))
      : -Math.abs(parseFloat(amount));

    // Create a hidden input to submit the signed amount
    const formData = new FormData(e.currentTarget);
    formData.set("amount", formattedAmount.toString());

    // Submit the form with the updated FormData
    const submitEvent = new SubmitEvent("submit", { bubbles: true, cancelable: true });
    Object.defineProperty(e.currentTarget, "formData", {
      value: formData,
      writable: false
    });
    e.currentTarget.dispatchEvent(submitEvent);
  };

  return (
    <div className="bg-background shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6">Add Transaction</h2>

      <Form method="post" className="space-y-6" onSubmit={handleSubmit}>
        <input type="hidden" name="_action" value="createTransaction" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <input
              type="hidden"
              name="date"
              value={date ? format(date, "yyyy-MM-dd") : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>

            <div className="flex space-x-2">
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                required
                className="flex-1"
              />

              <Button
                type="button"
                variant={isIncome ? "default" : "outline"}
                onClick={() => setIsIncome(true)}
                className={`w-24 ${isIncome ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                Income
              </Button>

              <Button
                type="button"
                variant={!isIncome ? "default" : "outline"}
                onClick={() => setIsIncome(false)}
                className={`w-24 ${!isIncome ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                Expense
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {category
                  ? categories.find((c) => c.value === category)?.label
                  : "Select category..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search category..." />
                <CommandEmpty>No category found.</CommandEmpty>

                <CommandGroup>
                  {categories.map((c) => (
                    <CommandItem
                      key={c.value}
                      value={c.value}
                      onSelect={(value: string) => {
                        setCategory(value);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          category === c.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {c.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          <input type="hidden" name="category" value={category} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>

          <Textarea
            id="description"
            name="description"
            placeholder="Enter transaction description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Add Transaction"}
          {!isSubmitting && <Plus className="ml-2 h-4 w-4" />}
        </Button>

        {actionData && (
          <div
            className={`p-4 mt-4 rounded-md ${
              actionData.isSuccess
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {actionData.message}
          </div>
        )}
      </Form>
    </div>
  );
}
