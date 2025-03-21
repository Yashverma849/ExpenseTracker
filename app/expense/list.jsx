"use client"; // Indicates that this is a Client Component in Next.js

import { useEffect, useState } from "react"; // React hooks for side effects and state management
import { supabase } from "@/lib/supabaseClient"; // Supabase client for database operations

// List component to display the user's expenses
export default function List({ refresh }) {
  // State to store the list of expenses
  const [expenses, setExpenses] = useState([]);
  // State to manage loading status
  const [loading, setLoading] = useState(true);

  // Function to fetch expenses from Supabase
  const fetchExpenses = async () => {
    setLoading(true); // Set loading to true while fetching data

    // Get the authenticated user from Supabase
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      console.error("User not authenticated", authError?.message);
      setLoading(false); // Stop loading if the user is not authenticated
      return;
    }

    const user = userData.user;
    console.log("Authenticated user:", user); // Debugging log to check the authenticated user

    // Check if the user ID is valid
    if (!user.id) {
      console.error("User ID is null or undefined");
      setLoading(false); // Stop loading if the user ID is invalid
      return;
    }

    // Fetch expenses from the "expenses" table for the authenticated user
    const { data, error } = await supabase
      .from("expenses")
      .select("*") // Select all columns
      .eq("user_id", user.id) // Filter by the user's ID
      .order("date", { ascending: false }); // Sort by date in descending order

    // Handle errors during fetching
    if (error) {
      console.error("Error fetching expenses:", error.message, error.details, error.hint);
    } else {
      console.log("Fetched expenses:", data); // Debugging log to check fetched data
      setExpenses(data || []); // Update the expenses state with fetched data (or an empty array if no data)
    }

    setLoading(false); // Stop loading after fetching is complete
  };

  // useEffect to fetch expenses when the component mounts or when the `refresh` prop changes
  useEffect(() => {
    fetchExpenses();
  }, [refresh]); // Dependency array: triggers fetching when `refresh` changes

  // useEffect to log the updated expenses state for debugging
  useEffect(() => {
    console.log("Expenses state updated:", expenses); // Debugging log to check the updated expenses state
  }, [expenses]);

  return (
    <div className="bg-transparent backdrop-blur-lg shadow-lg rounded-lg p-4 border border-white/20 mt-4">
      {/* Heading for the expense list */}
      <h2 className="text-xl font-bold mb-4 text-center dm-serif-text-regular chart-colors">Expense List</h2>

      {/* Refresh button to manually fetch expenses */}
      <div className="text-center mb-4">
        <button
          onClick={fetchExpenses}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh
        </button>
      </div>

      {/* Conditional rendering based on loading and expenses state */}
      {loading ? (
        // Show loading message while fetching data
        <p className="text-white text-center">Loading...</p>
      ) : expenses.length === 0 ? (
        // Show message if no expenses are recorded
        <p className="text-white text-center">No expenses recorded yet.</p>
      ) : (
        // Render the list of expenses
        <ul className="space-y-2">
          {expenses.map((expense) => (
            // Each expense is displayed as a list item
            <li key={expense.id} className="border-b border-white/20 pb-2 flex justify-between items-center text-white">
              {/* Left side: Category and description */}
              <div>
                <p className="font-semibold">{expense.category}</p>
                <p className="text-sm opacity-75">{expense.description || "No description provided"}</p>
              </div>
              {/* Right side: Amount, currency, and date */}
              <div>
                <p className="font-semibold">{expense.amount} {expense.currency}</p>
                <p className="text-sm opacity-75">{new Date(expense.date).toLocaleDateString()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}