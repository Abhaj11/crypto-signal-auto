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
import { useAuth } from "@/hooks/use-auth";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  value: {
    label: "Value (USD)",
  },
  BTC: {
    label: "Bitcoin",
    color: "hsl(var(--chart-1))",
  },
  ETH: {
    label: "Ethereum",
    color: "hsl(var(--chart-2))",
  },
  SOL: {
    label: "Solana",
    color: "hsl(var(--chart-3))",
  },
  ADA: {
    label: "Cardano",
    color: "hsl(var(--chart-4))",
  },
  DOT: {
    label: "Polkadot",
    color: "hsl(var(--chart-5))",
  },
  Other: {
    label: "Other",
    color: "hsl(var(--muted))",
  },
};

export function PortfolioOverview() {
  const { userProfile } = useAuth();

  const chartData = useMemo(() => {
    if (!userProfile || !userProfile.portfolio) {
      return [];
    }
    return userProfile.portfolio.map((item) => ({
      ...item,
      fill: `var(--color-${item.asset})`,
    }));
  }, [userProfile]);

  const totalValue = useMemo(() => {
    if (!userProfile || !userProfile.portfolio) {
      return 0;
    }
    return userProfile.portfolio.reduce((acc, item) => acc + item.value, 0);
  }, [userProfile]);


  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Portfolio Overview</CardTitle>
        <CardDescription>
          A summary of your current asset allocation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">24h Change</p>
            <p className="text-2xl font-bold text-green-500">+2.5%</p>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="mt-4 h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="asset"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <YAxis hide={true} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="value" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
