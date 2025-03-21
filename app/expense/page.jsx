"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import List from "@/app/expense/list";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
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
  // State to trigger a refresh of the expenses list
  const [refreshExpenses, setRefreshExpenses] = useState(false);
  
  // State to manage form data for adding a new expense
  const [formData, setFormData] = useState({
    amount: "",
    currency: "INR",
    date: new Date().toISOString().split("T")[0], // Default to today's date
    category: "Food",
    description: "",
    payment_method: "Cash",
  });
  
  // State to control the visibility of the success alert
  const [showAlert, setShowAlert] = useState(false);

  // Handler for form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { amount } = formData;
    // Validate the amount input
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      console.error("Invalid amount");
      return;
    }

    // Fetch the authenticated user
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      console.error("User not authenticated", authError?.message);
      return;
    }

    // Prepare the new expense object
    const newExpense = {
      user_id: userData.user.id,
      ...formData,
      amount: parseFloat(amount),
    };

    // Insert the new expense into the database
    const { error } = await supabase.from("expenses").insert([newExpense]);

    if (error) {
      console.error("Error adding new expense:", error.message);
    } else {
      // Show success alert, refresh the expenses list, and reset the form
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      setRefreshExpenses((prev) => !prev);
      setFormData({ amount: "", currency: "INR", date: new Date().toISOString().split("T")[0], category: "Food", description: "", payment_method: "Cash" });
    }
  };

  return (
    <SidebarProvider>
      {/* Sidebar component with styling */}
      <AppSidebar className="bg-transparent backdrop-blur-lg border-r border-white/20" />
      <SidebarInset>
        {/* Background image and main content container */}
        <div className="relative flex justify-center w-full pb-16">
          <Image 
            src="/pexels-adrien-olichon-1257089-2387793.jpg" 
            alt="logo" 
            layout="fill" 
            objectFit="cover" 
            className="absolute inset-0 z-0" 
          />
          {/* Main content with z-index to appear above the background image */}
          <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center">
            {/* Header section with breadcrumb and sidebar trigger */}
            <header className="flex h-16 items-center gap-2 m-4 bg-transparent backdrop-blur-lg shadow-lg rounded-lg p-4 border border-white/20 text-white">
              <SidebarTrigger className="-ml-1 text-white hover:bg-white/10 p-2 rounded-lg transition-colors" />
              <Separator orientation="vertical" className="mr-2 h-4 bg-white/30" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#" className="text-white text-sm font-medium">Building Your Application</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block text-white" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-white text-sm font-semibold">Data Fetching</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>

            {/* Main content area with form and expenses list */}
            <div className="p-4 w-full max-w-4xl">
              {/* Success alert displayed when an expense is added */}
              {showAlert && (
                <Alert className="mb-4">
                  <Terminal className="h-4 w-4 text-black" />
                  <AlertTitle className="text-black">Success!</AlertTitle>
                  <AlertDescription className="text-black">
                    Expense added successfully!
                  </AlertDescription>
                </Alert>
              )}

              {/* Form for adding a new expense */}
              <div className="bg-transparent backdrop-blur-lg shadow-lg rounded-lg p-4 border border-white/20">
                <h2 className="text-xl font-bold mb-4 text-center text-white">Add New Expense</h2>
                <form onSubmit={handleSubmit} className="space-y-2">
                  {/* Amount and currency input fields */}
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      name="amount"
                      placeholder="Amount"
                      className="w-full border px-2 py-1 rounded mt-1 bg-transparent text-white"
                      value={formData.amount}
                      onChange={handleChange}
                    />
                    <select
                      name="currency"
                      className="border px-2 py-1 rounded mt-1 bg-transparent text-white"
                      value={formData.currency}
                      onChange={handleChange}
                    >
                      <option className="text-black">INR</option>
                    </select>
                  </div>

                  {/* Category selection */}
                  <label className="block text-sm font-medium text-white">Category</label>
                  <select
                    name="category"
                    className="w-full border px-2 py-1 rounded mt-1 bg-transparent text-white"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option className="text-black">Food</option>
                    <option className="text-black">Housing</option>
                    <option className="text-black">Transportation</option>
                    <option className="text-black">Entertainment</option>
                    <option className="text-black">Other</option>
                  </select>

                  {/* Date input */}
                  <label className="block text-sm font-medium text-white">Date</label>
                  <input
                    type="date"
                    name="date"
                    className="w-full border px-2 py-1 rounded mt-1 bg-transparent text-white"
                    value={formData.date}
                    onChange={handleChange}
                  />

                  {/* Payment method selection */}
                  <label className="block text-sm font-medium text-white">Payment Method</label>
                  <select
                    name="payment_method"
                    className="w-full border px-2 py-1 rounded mt-1 bg-transparent text-white"
                    value={formData.payment_method}
                    onChange={handleChange}
                  >
                    <option className="text-black">Cash</option>
                    <option className="text-black">Bank</option>
                    <option className="text-black">Credit Card</option>
                    <option className="text-black">Other</option>
                  </select>

                  {/* Description input */}
                  <label className="block text-sm font-medium text-white">Description</label>
                  <input
                    type="text"
                    name="description"
                    placeholder="Add a description"
                    className="w-full border px-2 py-1 rounded mt-1 bg-transparent text-white"
                    value={formData.description}
                    onChange={handleChange}
                  />

                  {/* Submit button */}
                  <Button type="submit" className="w-full text-white py-1 rounded hover:bg-blue-600">
                    Add Expense
                  </Button>
                </form>
              </div>

              {/* Expenses list component */}
              <div className="w-full mt-6">
                <List refresh={refreshExpenses} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      
    </SidebarProvider>
  );
}