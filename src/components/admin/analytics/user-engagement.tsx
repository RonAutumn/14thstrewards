"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

interface UserEngagementProps {
  data?: {
    dailyEngagement: Record<string, number>;
    totalUsers: number;
  };
  isLoading?: boolean;
  type?: "engagement" | "activity";
}

export function UserEngagement({ data, isLoading, type = "engagement" }: UserEngagementProps) {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return null;
  }

  const chartData = Object.entries(data.dailyEngagement)
    .map(([date, count]) => ({
      date,
      count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{data.totalUsers}</div>
          <div className="text-sm text-muted-foreground">
            {type === "engagement" ? "New Users" : "Active Users"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {(chartData.reduce((sum, item) => sum + item.count, 0) / chartData.length).toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">
            Daily Average
          </div>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => format(parseISO(value), "MMM d")}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => format(parseISO(value as string), "MMM d, yyyy")}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#2563EB"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 