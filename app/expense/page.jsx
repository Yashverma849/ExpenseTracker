"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function ExpensePage() {
  const [amount, setAmount] = useState("");
  const [fromAccount, setFromAccount] = useState("Total Budget");
  const [currency, setCurrency] = useState("USD");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newExpense = {
      from_account: fromAccount,
      amount: parseFloat(amount),
      currency,
      date,
      category,
      note,
    };

    // Insert the new expense into the 'expenses' table
    const { data, error } = await supabase
      .from('expenses')
      .insert([newExpense]);

    if (error) {
      console.error('Error adding new expense:', error.message, error.details, error.hint);
    } else {
      console.log('New expense added:', data);
      // Optionally, you can update the state or perform other actions here
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex justify-center grid grid-cols-1 md:grid-cols-3 gap-4 pl-4">
            <div className="col-span-1 md:col-span-3">
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm">From</label>
                  <select
                    className="w-full border px-3 py-2 rounded"
                    value={fromAccount}
                    onChange={(e) => setFromAccount(e.target.value)}
                  >
                    <option>Total Budget</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Amount"
                    className="w-full border px-3 py-2 rounded"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <select
                    className="border px-3 py-2 rounded"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option>INR</option> {/* Added Indian Rupees (INR) */}
                  </select>
                </div>
                <div>
                  <label className="block text-sm">Category</label>
                  <select
                    className="w-full border px-3 py-2 rounded"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>Food</option>
                    <option>Housing</option>
                    <option>Transportation</option>
                    <option>Entertainment</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm">Date</label>
                  <input
                    type="date"
                    className="w-full border px-3 py-2 rounded"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm">Note</label>
                  <input
                    type="text"
                    placeholder="Add a note"
                    className="w-full border px-3 py-2 rounded"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
                >
                  Add Expense
                </button>
              </form>
            </div>
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}