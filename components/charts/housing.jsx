"use client";

import * as React from "react";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { supabase } from "@/lib/supabaseClient";

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
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("expenses")
        .select("amount")
        .eq("category", "Housing")
        .eq("user_id", user.id);

      if (error) {
        console.log("Error fetching data:", error);
      } else {
        const totalExpense = data.reduce((acc, expense) => acc + expense.amount, 0);
        setChartData([{ name: "Housing", budget: totalExpense }]);
      }
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleClear = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("category", "Housing")
        .eq("user_id", user.id);

      if (error) {
        console.log("Error clearing data:", error);
      } else {
        setChartData([{ name: "Housing", budget: 0 }]);
      }
    }
  };

  return (
    <Card className="flex flex-col bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg shadow-lg rounded-lg p-6 border border-white/20">
      <CardHeader className="items-center pb-0">
        <CardTitle className="dm-serif-text-regular attractive-font-color">HOUSING EXPENSE</CardTitle>
        <CardDescription className="text-xs dm-serif-text-regular-italic attractive-font-color">Total Housing Expense</CardDescription>
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
                          className="fill-foreground text-4xl font-bold attractive-font-color dm-serif-text-regular-italic"
                        >
                          {chartData && chartData[0] ? chartData[0].budget.toLocaleString() : 0}
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
        <strong className="flex justify-center text-center text-black text-sm mt-2 attractive-font-color dm-serif-text-regular-italic">
          Reset the Housing expense
        </strong>
        <div className="flex justify-center mt-4">
          <Button
            onClick={handleClear}
            className=" hover:bg-red-600 text-white dm-serif-text-regular"
          >
            RESET
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}