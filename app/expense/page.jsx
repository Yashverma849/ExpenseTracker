"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import List from "@/app/expense/list";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"; // Ensure correct import
import { AppSidebar } from "@/components/app-sidebar";
import Image from "next/image";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Terminal } from "react-feather";

export default function ExpensePage() {
  const [refreshExpenses, setRefreshExpenses] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [fromAccount, setFromAccount] = useState("Cash");
  const [showAlert, setShowAlert] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate amount
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      console.error("Invalid amount");
      return;
    }

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      console.error("User not authenticated", authError?.message);
      return;
    }

    const newExpense = {
      user_id: userData.user.id,
      amount: parseFloat(amount),
      currency,
      date,
      category,
      note,
      from_account: fromAccount,
    };

    const { data, error } = await supabase.from("expenses").insert([newExpense]);

    if (error) {
      console.error("Error adding new expense:", error.message, error.details, error.hint);
    } else {
      console.log("New expense added:", data);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000); // Hide alert after 3 seconds
      setRefreshExpenses((prev) => !prev); // Trigger re-fetch of expenses
      // Reset form fields
      setAmount("");
      setCurrency("INR");
      setDate(new Date().toISOString().split("T")[0]);
      setCategory("Food");
      setNote("");
      setFromAccount("Cash");
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar className="bg-transparent backdrop-blur-lg border-r border-white/20" />
      <SidebarInset>
        <div className="relative flex justify-center w-full pb-16">
          <Image 
            src="/pexels-adrien-olichon-1257089-2387793.jpg" 
            alt="logo" 
            layout="fill" 
            objectFit="cover" 
            className="absolute inset-0 z-0" 
          />
          <div className="relative z-10 w-full">
            <div className="min-h-screen flex flex-col items-center justify-center">
              <header className="flex h-16 items-center gap-2 m-4 bg-transparent backdrop-blur-lg shadow-lg rounded-lg p-4 border border-white/20 text-white">
                <div className="flex items-center gap-2 px-4 text-white">
                  <SidebarTrigger className="-ml-1 text-white hover:bg-white/10 p-2 rounded-lg transition-colors" />
                  <Separator orientation="vertical" className="mr-2 h-4 bg-white/30" />
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem className=" md:block">
                        <BreadcrumbLink 
                          href="#" 
                          className="text-white transition-colors text-sm font-medium"
                        >
                          Building Your Application
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block text-white" />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="text-white text-sm font-semibold">
                          Data Fetching
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              </header>
              <div className="p-4 w-full max-w-4xl">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full">
                    {showAlert && (
                      <Alert className="mb-4">
                        <Terminal className="h-4 w-4 text-black" />
                        <AlertTitle className="text-black">Success!</AlertTitle>
                        <AlertDescription className="text-black">
                          Expense added successfully!
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="bg-transparent backdrop-blur-lg shadow-lg rounded-lg p-4 border border-white/20">
                      <div className="bg-transparent p-4 rounded-lg">
                        <h2 className="text-xl font-bold mb-4 text-center dm-serif-text-regular chart-colors">Add New Expense</h2>
                        <form onSubmit={handleSubmit} className="space-y-2">
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              placeholder="Amount"
                              className="w-full border px-2 py-1 rounded mt-1 bg-transparent text-white"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                            />
                            <select
                              className="border px-2 py-1 rounded mt-1 bg-transparent text-white"
                              value={currency}
                              onChange={(e) => setCurrency(e.target.value)}
                            >
                              <option className="text-black">INR</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white">Category</label>
                            <select
                              className="w-full border px-2 py-1 rounded mt-1 bg-transparent text-white"
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
                              className="w-full border px-2 py-1 rounded mt-1 bg-transparent text-white"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white">From Account</label>
                            <select
                              className="w-full border px-2 py-1 rounded mt-1 bg-transparent text-white"
                              value={fromAccount}
                              onChange={(e) => setFromAccount(e.target.value)}
                            >
                              <option className="text-black">Cash</option>
                              <option className="text-black">Bank</option>
                              <option className="text-black">Credit Card</option>
                              <option className="text-black">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white">Note</label>
                            <input
                              type="text"
                              placeholder="Add a note"
                              className="w-full border px-2 py-1 rounded mt-1 bg-transparent text-white"
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                            />
                          </div>
                          <Button type="submit" className="w-full dm-serif-text-regular-italic text-white py-1 rounded hover:bg-blue-600">
                            Add Expense
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                  <div className="w-full">
                    <List refresh={refreshExpenses} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}