"use client"; // This directive ensures the component runs on the client side in Next.js.

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // Import the configured Supabase client instance

export default function List({ refresh }) {
  // State to store the list of expenses
  const [expenses, setExpenses] = useState([]);

  // State to manage loading state while fetching data
  const [loading, setLoading] = useState(true);

  /**
   * Fetches the user's expenses from the Supabase database.
   */
  const fetchExpenses = async () => {
    setLoading(true); // Set loading state to true while fetching

    // Get the currently authenticated user
    const { data: userData, error: authError } = await supabase.auth.getUser();
    
    // If there's an authentication error or no user is found, log the error and stop execution
    if (authError || !userData?.user) {
      console.error("User not authenticated", authError?.message);
      setLoading(false);
      return;
    }

    const user = userData.user; // Extract user object
    console.log("Authenticated user:", user); // Debugging log

    // If the user ID is not available, log an error and stop execution
    if (!user.id) {
      console.error("User ID is null or undefined");
      setLoading(false);
      return;
    }

    // Query the "expenses" table to fetch all expenses belonging to the authenticated user,
    // ordering them by date in descending order (most recent first)
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id) // Filter by user ID
      .order("date", { ascending: false }); // Order by date in descending order

    // Handle any errors from the query
    if (error) {
      console.error("Error fetching expenses:", error.message, error.details, error.hint);
    } else {
      console.log("Fetched expenses:", data); // Debugging log
      setExpenses(data || []); // Update state with fetched data or an empty array if null
    }

    setLoading(false); // Set loading state to false after fetching
  };

  // Fetch expenses when the component mounts and whenever `refresh` changes
  useEffect(() => {
    fetchExpenses();
  }, [refresh]);

  // Log the updated state whenever expenses change
  useEffect(() => {
    console.log("Expenses state updated:", expenses); // Debugging log
  }, [expenses]);

  return (
    <div className="bg-transparent backdrop-blur-lg shadow-lg rounded-lg p-4 border border-white/20 mt-4">
      {/* Title */}
      <h2 className="text-xl font-bold mb-4 text-center dm-serif-text-regular chart-colors">
        Expense List
      </h2>

      {/* Refresh Button */}
      <div className="text-center mb-4">
        <button
          onClick={fetchExpenses} // Manually trigger fetching expenses
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh
        </button>
      </div>

      {/* Conditional rendering based on loading and expense data */}
      {loading ? (
        <p className="text-white text-center">Loading...</p> // Show loading text while fetching
      ) : expenses.length === 0 ? (
        <p className="text-white text-center">No expenses recorded yet.</p> // Show message if no expenses found
      ) : (
        // Display the list of expenses
        <ul className="space-y-2">
          {expenses.map((expense) => (
            <li
              key={expense.id} // Unique key for each expense item
              className="border-b border-white/20 pb-2 flex justify-between items-center text-white"
            >
              {/* Left section: Expense category and description */}
              <div>
                <p className="font-semibold">{expense.category}</p>
                <p className="text-sm opacity-75">
                  {expense.description || "No description provided"}
                </p>
              </div>

              {/* Right section: Expense amount, currency, and date */}
              <div>
                <p className="font-semibold">
                  {expense.amount} {expense.currency}
                </p>
                <p className="text-sm opacity-75">
                  {new Date(expense.date).toLocaleDateString()} {/* Format date to readable format */}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
