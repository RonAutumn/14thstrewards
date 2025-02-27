"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface DeliveryMetricsProps {
  data?: {
    onTimeDeliveries: number;
    totalDeliveries: number;
    deliveryPerformance: number;
    statusBreakdown: Record<string, number>;
  };
  isLoading?: boolean;
}

const COLORS = ["#10B981", "#F59E0B", "#EF4444"];

export function DeliveryMetrics({ data, isLoading }: DeliveryMetricsProps) {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return null;
  }

  const chartData = Object.entries(data.statusBreakdown).map(([status, count]) => ({
    name: status.replace("_", " ").toUpperCase(),
    value: count,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">
            {data.deliveryPerformance.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">
            On-time Delivery Rate
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {data.onTimeDeliveries}/{data.totalDeliveries}
          </div>
          <div className="text-sm text-muted-foreground">
            On-time/Total Deliveries
          </div>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 