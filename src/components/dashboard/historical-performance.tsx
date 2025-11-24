"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";

const chartData = [
  { date: "2017-12-01", "GiantOracle Index": 85, "Bitcoin Price": 19783 },
  { date: "2018-02-01", "GiantOracle Index": 25, "Bitcoin Price": 6955 },
  { date: "2021-04-01", "GiantOracle Index": 92, "Bitcoin Price": 63575 },
  { date: "2021-06-01", "GiantOracle Index": 40, "Bitcoin Price": 31676 },
  { date: "2022-11-01", "GiantOracle Index": 15, "Bitcoin Price": 15760 },
  { date: "2023-10-01", "GiantOracle Index": 50, "Bitcoin Price": 26971 },
  { date: "2024-03-01", "GiantOracle Index": 88, "Bitcoin Price": 73750 },
];

const chartConfig = {
  "GiantOracle Index": {
    label: "GiantOracle Index",
    color: "hsl(var(--accent))",
  },
  "Bitcoin Price": {
    label: "Bitcoin Price ($)",
    color: "hsl(var(--primary))",
  },
};

export function HistoricalPerformance() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historical Performance Analysis</CardTitle>
        <CardDescription>
          An illustration of how our index might have performed against historical Bitcoin price events.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: -10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" stroke="hsl(var(--primary))" tickFormatter={(value) => `$${(value / 1000)}k`} />
            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" tickFormatter={(value) => `${value}%`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="Bitcoin Price" stroke="var(--color-Bitcoin Price)" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="GiantOracle Index" stroke="var(--color-GiantOracle Index)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
