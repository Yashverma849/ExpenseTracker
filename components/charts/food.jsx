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

export function FoodChartComponent({ refresh }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Get the current user session
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();

      if (sessionError || !user?.id) {
        console.error("User not authenticated", sessionError?.message);
        setLoading(false);
        return;
      }

      const userId = user.id;

      const { data, error } = await supabase
        .from("expenses")
        .select("amount")
        .eq("category", "Food")
        .eq("user_id", userId);

      if (error) {
        console.log("Error fetching data:", error);
      } else {
        const totalExpense = data.reduce((acc, expense) => acc + expense.amount, 0);
        setChartData([{ name: "Food", budget: totalExpense }]);
      }

      setLoading(false);
    };

    fetchData();

    // Realtime Listener for Updates
    const subscription = supabase
      .channel("food-expenses")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        (payload) => {
          console.log("Change received!", payload);
          fetchData(); // Refresh data on DB changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription); // Cleanup on unmount
    };
  }, [refresh]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <Card className="flex flex-col bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg shadow-lg rounded-lg p-6 border border-white/20">
      <CardHeader className="items-center pb-0">
        <CardTitle className="dm-serif-text-regular attractive-font-color">FOOD EXPENSE</CardTitle>
        <CardDescription className="text-xs dm-serif-text-regular-italic attractive-font-color">Total Food Expense</CardDescription>
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
            className="fill-current chart-colors"
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none" // Make the grid transparent
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
                          {chartData && chartData[0] ? chartData[0].budget : 0}
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
          Refresh the Food expense
        </strong>
        <div className="flex justify-center mt-4">
          <Button
            onClick={handleRefresh}
            className="hover:bg-blue-600 text-white dm-serif-text-regular"
          >
            REFRESH
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}