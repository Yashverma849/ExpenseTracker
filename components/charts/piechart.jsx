"use client";

import * as React from "react";
import { Label, Pie, PieChart, Cell, Tooltip, Legend } from "recharts";
import { supabase } from "@/lib/supabaseClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const colors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
];

const chartConfig = {
  budget: { label: "Budget" },
  housing: { label: "Housing", color: "hsl(var(--chart-1))" },
  food: { label: "Food", color: "hsl(var(--chart-2))" },
  transportation: { label: "Transportation", color: "hsl(var(--chart-3))" },
  entertainment: { label: "Entertainment", color: "hsl(var(--chart-4))" },
  other: { label: "Other", color: "hsl(var(--chart-5))" },
};

export function Piechartcomponent() {
  const [chartData, setChartData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from("budgets").select("*");

        console.log("Fetched Data:", data); // Debugging log
        if (error) throw error;

        if (!data || data.length === 0) {
          console.warn("No budget data found. Using sample data...");
          setChartData([
            { id: 1, category: "Food", budget: 500 },
            { id: 2, category: "Transport", budget: 300 },
            { id: 3, category: "Entertainment", budget: 200 },
            { id: 4, category: "Rent", budget: 1000 },
          ]);
        } else {
          setChartData(data);
        }
      } catch (error) {
        setError("Error fetching data");
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBudgetChange = async (index, newBudget) => {
    const updatedChartData = [...chartData];
    updatedChartData[index].budget = parseInt(newBudget, 10);
    setChartData(updatedChartData);

    try {
      const { error } = await supabase
        .from("budgets")
        .update({ budget: parseInt(newBudget, 10) })
        .eq("id", updatedChartData[index].id);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating data:", error);
    }
  };

  const totalBudget = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.budget, 0);
  }, [chartData]);

  if (loading) return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Pie Chart Section */}
      <Card className="flex flex-col bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg shadow-lg rounded-lg p-6 border border-white/20 flex-1">
        <CardHeader className="items-center pb-0">
          <CardTitle className="dm-serif-text-regular attractive-font-color">
            Budget Allocation
          </CardTitle>
          <CardDescription className="text-xs dm-serif-text-regular-italic attractive-font-color">
            Budget Categories
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-0">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px] w-full aspect-ratio-1">
            <PieChart width={300} height={300}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="budget"
                nameKey="category"
                innerRadius={80}
                outerRadius={120}
                strokeWidth={3}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
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
                            className="text-xl font-bold dm-serif-text-regular"
                            style={{ fill: "#00d4ff" }}
                          >
                            {totalBudget.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 16}
                            className="flex justify-center text-xs dm-serif-text-regular-italic"
                            style={{ fill: "#00d4ff" }}
                          >
                            Total Budget
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Budget Categories Section */}
      <Card className="flex flex-col bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg shadow-lg rounded-lg p-6 border border-white/20 flex-1">
        <CardHeader className="items-center pb-0">
          <CardTitle className="flex justify-center dm-serif-text-regular attractive-font-color">
            Budget Categories
          </CardTitle>
          <CardDescription className="flex justify-center text-xs dm-serif-text-regular-italic attractive-font-color">
            Adjust your budget
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-0 flex-1">
          <CardFooter className="grid grid-cols-1 gap-2 text-xs text-black">
            {chartData.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2 col-span-1">
                <label className="flex-1 text-white">{item.category}</label>
                <input
                  type="number"
                  value={item.budget}
                  onChange={(e) => handleBudgetChange(index, e.target.value)}
                  className="w-20 p-1 border rounded text-black custom-input"
                />
              </div>
            ))}
          </CardFooter>
        </CardContent>
      </Card>
    </div>
  );
}