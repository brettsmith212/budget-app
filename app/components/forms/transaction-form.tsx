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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "~/components/ui/dialog";
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

interface TransactionFormProps {
  onSuccess?: () => void;
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const actionData = useActionData<ActionState<TransactionFormData>>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [open, setOpen] = useState(false);
  const [isIncome, setIsIncome] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Format number with commas and decimals
  const formatAmount = (value: string) => {
    const number = parseFloat(value);
    if (isNaN(number)) return "";
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  };

  // Handle amount change and blur
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
    setDisplayAmount(value);
  };

  const handleAmountBlur = () => {
    if (amount) {
      setDisplayAmount(formatAmount(amount));
    }
  };

  const handleAmountFocus = () => {
    setDisplayAmount(amount);
  };

  // Reset form after successful submission
  useEffect(() => {
    if (actionData?.isSuccess) {
      setDate(new Date());
      setAmount("");
      setDisplayAmount("");
      setCategory("");
      setDescription("");
      setIsIncome(false);
      setIsModalOpen(false);
      onSuccess?.();
    }
  }, [actionData, onSuccess]);

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button className="mb-6">
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Enter the details of your transaction below.
          </DialogDescription>
        </DialogHeader>

        <Form method="post" className="space-y-6">
          <input type="hidden" name="_action" value="createTransaction" />

          <div className="space-y-4">
            {/* Amount Section */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="space-y-2">
                <Input
                  id="amount-display"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  onBlur={handleAmountBlur}
                  onFocus={handleAmountFocus}
                  required
                  className="text-base text-center"
                />
                <input
                  type="hidden"
                  name="amount"
                  value={isIncome ? Math.abs(parseFloat(amount || "0")) : -Math.abs(parseFloat(amount || "0"))}
                />
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={isIncome ? "default" : "outline"}
                    onClick={() => setIsIncome(true)}
                    className={`flex-1 ${isIncome ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  >
                    Income
                  </Button>
                  <Button
                    type="button"
                    variant={!isIncome ? "default" : "outline"}
                    onClick={() => setIsIncome(false)}
                    className={`flex-1 ${!isIncome ? 'bg-red-600 hover:bg-red-700' : ''}`}
                  >
                    Expense
                  </Button>
                </div>
              </div>
            </div>

            {/* Date and Category Section */}
            <div className="grid grid-cols-2 gap-4">
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

                  <PopoverContent className="w-full p-0" align="start" side="bottom" sideOffset={4}>
                    <Command>
                      <CommandInput placeholder="Search category..." />
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                          {categories.map((c) => (
                            <CommandItem
                              key={c.value}
                              value={c.value}
                              onSelect={(value) => {
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
            </div>

            {/* Description Section */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Add a note about this transaction..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Transaction"}
            </Button>

            {actionData && (
              <p
                className={cn(
                  "text-sm mt-2 text-center",
                  actionData.isSuccess ? "text-green-600" : "text-red-600"
                )}
              >
                {actionData.message}
              </p>
            )}
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
