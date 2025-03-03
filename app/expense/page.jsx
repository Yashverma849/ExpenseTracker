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
import { Terminal } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function ExpensePage() {
  const [amount, setAmount] = useState("");
  const [fromAccount, setFromAccount] = useState("Total Budget");
  const [currency, setCurrency] = useState("INR");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [showAlert, setShowAlert] = useState(false);

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

    const { data, error } = await supabase.from("expenses").insert([newExpense]);

    if (error) {
      console.error("Error adding new expense:", error.message, error.details, error.hint);
    } else {
      console.log("New expense added:", data);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000); // Hide alert after 3 seconds
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div
          className="min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-center"
          style={{ backgroundImage: "url('/pc.jpeg')" }}
        >
          <div className="w-full max-w-md">
            {showAlert && (
              <Alert className="mb-4">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  Expense added successfully!
                </AlertDescription>
              </Alert>
            )}
            <div
              className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg shadow-lg rounded-lg p-6 border border-white/20"
            >
              <div className="bg-white bg-opacity-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Add New Expense</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white">From</label>
                    <select
                      className="w-full border px-3 py-2 rounded mt-1 bg-transparent text-white"
                      value={fromAccount}
                      onChange={(e) => setFromAccount(e.target.value)}
                    >
                      <option className="text-black">Total Budget</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Amount"
                      className="w-full border px-3 py-2 rounded mt-1 bg-transparent text-white"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <select
                      className="border px-3 py-2 rounded mt-1 bg-transparent text-white"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option className="text-black">INR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white">Category</label>
                    <select
                      className="w-full border px-3 py-2 rounded mt-1 bg-transparent text-white"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option className="text-black">Food</option>
                      <option className="text-black">Housing</option>
                      <option className="text-black">Transportation</option>
                      <option className="text-black">Entertainment</option>
                      <option className="text-black">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white">Date</label>
                    <input
                      type="date"
                      className="w-full border px-3 py-2 rounded mt-1 bg-transparent text-white"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white">Note</label>
                    <input
                      type="text"
                      placeholder="Add a note"
                      className="w-full border px-3 py-2 rounded mt-1 bg-transparent text-white"
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
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}