/**
 * Transaction form component for manual entry and editing of income/expense transactions
 *
 * This component provides a form for users to manually enter or edit transaction details
 * including date, amount, category, and description. The form handles both income
 * (positive amounts) and expenses (negative amounts).
 */

import { useState, useEffect } from "react";
import { Form, useActionData, useNavigation, useFetcher } from "@remix-run/react";
import { CalendarIcon, Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import type { ActionState, Transaction, TransactionFormData } from "@/types";

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

// Format number with commas and decimals
const formatAmount = (value: string) => {
  const number = parseFloat(value);
  if (isNaN(number)) return "";
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number);
};

interface TransactionFormProps {
  onSuccess?: () => void;
  transaction?: Transaction;
  mode?: "create" | "edit";
  trigger?: React.ReactNode;
  dialogTitle?: string;
  dialogDescription?: string;
}

export default function TransactionForm({
  onSuccess,
  transaction,
  mode = "create",
  trigger,
  dialogTitle = mode === "create" ? "Add Transaction" : "Edit Transaction",
  dialogDescription = mode === "create"
    ? "Enter the details of your transaction below."
    : "Update the details of your transaction below."
}: TransactionFormProps) {
  const actionData = useActionData<ActionState<TransactionFormData>>();
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const isSubmitting = navigation.state === "submitting" || fetcher.state === "submitting";
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [date, setDate] = useState<Date | undefined>(
    transaction?.date ? parseISO(transaction.date) : new Date()
  );
  const [amount, setAmount] = useState(transaction?.amount?.toString() || "");
  const [displayAmount, setDisplayAmount] = useState(
    transaction ? formatAmount(Math.abs(transaction.amount).toString()) : ""
  );
  const [category, setCategory] = useState(transaction?.category || "");
  const [description, setDescription] = useState(transaction?.description || "");
  const [isIncome, setIsIncome] = useState(transaction ? transaction.amount > 0 : false);

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

  // Reset form and close dialog on successful submission
  useEffect(() => {
    // Check for success from either the fetcher or actionData
    const isSuccess = (fetcher.data as ActionState<TransactionFormData>)?.isSuccess || actionData?.isSuccess;
    
    if (isSuccess) {
      // Call onSuccess callback after a short timeout to ensure dialog is closed first
      if (onSuccess) {
        // Use a slight delay to ensure the dialog closes first and state updates
        setTimeout(() => {
          onSuccess();
        }, 100);
      }
    }
  }, [fetcher.data, actionData?.isSuccess, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <fetcher.Form 
          method="post" 
          className="space-y-6"
          onSubmit={() => {
            // Close the dialog as soon as form is submitted
            // Since we're using redirect in the action, we need to close the modal right away
            setOpen(false);
            
            // Reset form fields for create mode to ensure fresh form on next open
            if (mode === "create") {
              setDate(new Date());
              setAmount("");
              setDisplayAmount("");
              setCategory("");
              setDescription("");
              setIsIncome(false);
            }
          }}
        >
          <input type="hidden" name="_action" value={mode === "create" ? "createTransaction" : "updateTransaction"} />
          {transaction?.id && <input type="hidden" name="transactionId" value={transaction.id} />}

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
                <input type="hidden" name="date" value={date ? format(date, "yyyy-MM-dd") : ""} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={categoryOpen}
                      className="w-full justify-between"
                    >
                      {category
                        ? categories.find((cat) => cat.value === category)?.label
                        : "Select category..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search category..." />
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        {categories.map((cat) => (
                          <CommandItem
                            key={cat.value}
                            onSelect={() => {
                              setCategory(cat.value);
                              setCategoryOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                category === cat.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {cat.label}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                onClick={() => {
                  // Close the modal when clicking submit
                  // This handles the case where form validation might fail
                  if (!isSubmitting) {
                    setOpen(false);
                  }
                }}
              >
                {isSubmitting ? "Saving..." : mode === "create" ? "Add Transaction" : "Save Changes"}
              </Button>
            </div>
          </div>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}
