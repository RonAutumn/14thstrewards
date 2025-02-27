"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO, startOfDay } from "date-fns";

interface RewardsUsageProps {
  data?: {
    pointsEarned: number;
    pointsRedeemed: number;
    history: Array<{
      date: string;
      points: number;
      type: string;
    }>;
  };
  isLoading?: boolean;
}

export function RewardsUsage({ data, isLoading }: RewardsUsageProps) {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return null;
  }

  // Process data for the chart
  const chartData = data.history
    .reduce((acc, record) => {
      const date = format(startOfDay(parseISO(record.date)), "yyyy-MM-dd");
      const existing = acc.find((item) => item.date === date);

      if (existing) {
        if (record.type === "earned") {
          existing.earned = (existing.earned || 0) + record.points;
        } else {
          existing.redeemed = (existing.redeemed || 0) + record.points;
        }
      } else {
        acc.push({
          date,
          earned: record.type === "earned" ? record.points : 0,
          redeemed: record.type === "redeemed" ? record.points : 0,
        });
      }

      return acc;
    }, [] as Array<{ date: string; earned: number; redeemed: number }>)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">
            {data.pointsEarned.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Points Earned</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {data.pointsRedeemed.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Points Redeemed</div>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => format(parseISO(value), "MMM d")}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) =>
                format(parseISO(value as string), "MMM d, yyyy")
              }
            />
            <Legend />
            <Bar dataKey="earned" name="Points Earned" fill="#10B981" />
            <Bar dataKey="redeemed" name="Points Redeemed" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-sm text-muted-foreground text-center">
        Points Balance:{" "}
        {(data.pointsEarned - data.pointsRedeemed).toLocaleString()}
      </div>
    </div>
  );
}
