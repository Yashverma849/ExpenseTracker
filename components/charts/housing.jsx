"use client";

import * as React from "react";
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
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@headlessui/react";

const chartConfig = {
  housing: {
    label: "Housing",
    color: "hsl(var(--chart-1))",
  },
  safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))",
  },
};

export function HousingChartComponent() {
  const [chartData, setChartData] = React.useState([]);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("amount")
      .eq("category", "Housing");
    if (error) {
      console.log("Error fetching data:", error);
    } else {
      const totalExpense = data.reduce((acc, expense) => acc + expense.amount, 0);
      setChartData([{ name: "Housing", budget: totalExpense }]);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleClear = async () => {
    const { error } = await supabase
      .from("expenses")
      .update({ amount: 0 })
      .eq("category", "Housing");

    if (error) {
      console.log("Error clearing data:", error);
    } else {
      setChartData([{ name: "Housing", budget: 0 }]);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Housing Expense</CardTitle>
        <CardDescription>Total Housing Expense</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={100}
            innerRadius={80}
            outerRadius={140}
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
                          className="fill-foreground text-4xl font-bold"
                        >
                          {chartData && chartData[0] ? chartData[0].budget.toLocaleString() : 0}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
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
        <strong className="flex justify-center text-center text-black text-sm mt-2">
          Reset the Housing expense </strong>
        <div className="flex justify-center mt-4">
          <button
            onClick={handleClear}
            className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear
          </button>
        </div>
      </CardContent>
    </Card>
  );
}