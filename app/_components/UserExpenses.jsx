"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

function UserExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching expenses:', error);
        } else {
          setExpenses(data);
        }
      }
      setLoading(false);
    };

    fetchExpenses();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Your Expenses</h2>
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>
            {expense.description}: ${expense.amount}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserExpenses;