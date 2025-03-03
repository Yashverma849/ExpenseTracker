"use client";

import * as React from "react";
import { Label, Pie, PieChart, Cell } from "recharts";
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
  ChartConfig,
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
  budget: {
    label: "Budget",
  },
  housing: {
    label: "Housing",
    color: "hsl(var(--chart-1))",
  },
  food: {
    label: "Food",
    color: "hsl(var(--chart-2))",
  },
  transportation: {
    label: "Transportation",
    color: "hsl(var(--chart-3))",
  },
  entertainment: {
    label: "Entertainment",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
};

export function Piechartcomponent() {
  const [chartData, setChartData] = React.useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*");
      console.log("1 : ",data);
        if (error) {
        console.error("Error fetching data:", error);
      } else {
        setChartData(data);
      }
    };

    fetchData();
  }, []);

  const handleBudgetChange = async (index, newBudget) => {
    const updatedChartData = [...chartData];
    updatedChartData[index].budget = parseInt(newBudget, 10);
    setChartData(updatedChartData);

    const { error } = await supabase
      .from("budgets")
      .update({ budget: parseInt(newBudget, 10) })
      .eq("id", updatedChartData[index].id);

    if (error) {
      console.error("Error updating data:", error);
    }
  };

  const totalBudget = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.budget, 0);
  }, [chartData]);

  return (
    <Card className="flex flex-col max-w-xl">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-sm">Budget Allocation</CardTitle>
        <CardDescription className="text-xs">Budget Categories</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart width={300} height={300}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
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
                          className="fill-foreground text-xl font-bold"
                        >
                          {totalBudget.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 16}
                          className="fill-muted-foreground text-xs"
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
      <CardFooter className="flex-col gap-1 text-xs">
        {chartData.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <label className="flex-1">{item.category}</label>
            <input
              type="number"
              value={item.budget}
              onChange={(e) => handleBudgetChange(index, e.target.value)}
              className="w-20 p-1 border rounded"
            />
          </div>
        ))}
      </CardFooter>
    </Card>
  );
}