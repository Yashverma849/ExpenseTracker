"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";

const chartConfig = {
  safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))",
  },
};

export function TransportationChartComponent({ refresh }) {
  const [chartData, setChartData] = useState([{ name: "Transportation", budget: 0 }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("Initializing...");
  const [allExpenses, setAllExpenses] = useState([]);
  const [categories, setCategories] = useState([]);

  // Function to fetch ALL expenses first to see what categories exist
  const fetchAllExpenses = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo("Fetching all expenses to check categories...");
    
    try {
      // Get current user session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.user?.id) {
        setDebugInfo("No user session found");
        setError("Please log in to view expenses");
        setLoading(false);
        return;
      }
      
      const userId = sessionData.session.user.id;
      setDebugInfo(`User authenticated. ID: ${userId}`);
      
      // First, fetch ALL expenses to check what's in the database
      const { data: allExpensesData, error: allExpensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", userId);
      
      if (allExpensesError) {
        console.error("Error fetching all expenses:", allExpensesError);
        setDebugInfo(`Database error: ${allExpensesError.message}`);
        setError(`Failed to fetch expenses: ${allExpensesError.message}`);
        setLoading(false);
        return;
      }
      
      // Log and store all expenses
      console.log("All expenses:", allExpensesData);
      setAllExpenses(allExpensesData || []);
      
      // Extract unique categories to see what's available (but don't display them)
      const uniqueCategories = [...new Set(allExpensesData.map(exp => exp.category))];
      setCategories(uniqueCategories);
      
      // Now, specifically look for Transportation expenses with different case sensitivity
      const transportationExpenses = allExpensesData.filter(exp => 
        exp.category === 'Transportation' || 
        exp.category === 'transportation' || 
        exp.category?.toLowerCase() === 'transportation'
      );
      
      console.log("Transportation expenses (case insensitive):", transportationExpenses);
      
      if (transportationExpenses.length === 0) {
        setDebugInfo(`No transportation expenses found. Add some expenses with category "Transportation" first.`);
        setChartData([{ name: "Transportation", budget: 0 }]);
      } else {
        // Calculate the total
        const total = transportationExpenses.reduce((sum, exp) => {
          const amount = typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount || '0');
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        
        console.log("Total transportation expense:", total);
        setDebugInfo(`Found ${transportationExpenses.length} transportation expenses. Total: ${total.toFixed(2)}`);
        setChartData([{ name: "Transportation", budget: total }]);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setDebugInfo(`Error: ${error.message}`);
      setError(`Something went wrong: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch on component mount
  useEffect(() => {
    fetchAllExpenses();
  }, [refresh]);

  return (
    <Card className="flex flex-col bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg shadow-lg rounded-lg p-6 border border-white/20">
      <CardHeader className="items-center pb-0">
        <CardTitle className="dm-serif-text-regular attractive-font-color">TRANSPORTATION EXPENSE</CardTitle>
        <CardDescription className="text-xs dm-serif-text-regular-italic attractive-font-color">
          Total Transportation Expense
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {error ? (
          <div className="text-red-500 text-center my-8">{error}</div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <RadialBarChart
              data={chartData}
              endAngle={100}
              innerRadius={80}
              outerRadius={140}
              className="fill-current chart-colors"
            >
              <PolarGrid
                gridType="circle"
                radialLines={false}
                stroke="none"
                className="first:fill-muted last:fill-background"
                polarRadius={[86, 74]}
              />
              <RadialBar dataKey="budget" background />
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-4xl font-bold attractive-font-color dm-serif-text-regular-italic"
                          >
                            {loading ? "..." : chartData[0]?.budget.toFixed(2)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground attractive-font-color dm-serif-text-regular-italic"
                          >
                            Expense
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </PolarRadiusAxis>
            </RadialBarChart>
          </ChartContainer>
        )}
        
        {/* Debug info */}
        <div className="text-center text-xs mt-2 text-blue-300">
          {debugInfo}
        </div>
        
        {/* Show expense count */}
        <div className="text-center text-xs mt-1 text-green-300">
          {allExpenses.length > 0 
            ? `Total Expenses: ${allExpenses.length}` 
            : "No expenses found in database"}
        </div>
        
        <div className="flex justify-center mt-4">
          <Button
            onClick={fetchAllExpenses}
            className="hover:bg-blue-600 text-white dm-serif-text-regular"
            disabled={loading}
          >
            {loading ? "LOADING..." : "REFRESH"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 