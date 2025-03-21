"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function List({ refresh }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    setLoading(true);

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      console.error("User not authenticated", authError?.message);
      setLoading(false);
      return;
    }

    const user = userData.user;
    console.log("Authenticated user:", user); // Debugging log

    if (!user.id) {
      console.error("User ID is null or undefined");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error.message, error.details, error.hint);
    } else {
      console.log("Fetched expenses:", data); // Debugging log
      setExpenses(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, [refresh]); // Trigger fetching when `refresh` changes

  useEffect(() => {
    console.log("Expenses state updated:", expenses); // Debugging log
  }, [expenses]);

  return (
    <div className="bg-transparent backdrop-blur-lg shadow-lg rounded-lg p-4 border border-white/20 mt-4">
      <h2 className="text-xl font-bold mb-4 text-center dm-serif-text-regular chart-colors">Expense List</h2>

      <div className="text-center mb-4">
        <button
          onClick={fetchExpenses}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-white text-center">Loading...</p>
      ) : expenses.length === 0 ? (
        <p className="text-white text-center">No expenses recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {expenses.map((expense) => (
            <li key={expense.id} className="border-b border-white/20 pb-2 flex justify-between items-center text-white">
              <div>
                <p className="font-semibold">{expense.category}</p>
                <p className="text-sm opacity-75">{expense.description || "No description provided"}</p>
              </div>
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