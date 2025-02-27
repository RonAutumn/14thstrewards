"use client";

import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface OrderStatsProps {
  data?: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalPointsRedeemed: number;
  };
  isLoading?: boolean;
  type: "revenue" | "orders" | "average" | "points";
}

export function OrderStats({ data, isLoading, type }: OrderStatsProps) {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return null;
  }

  const getValue = () => {
    switch (type) {
      case "revenue":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(data.totalRevenue);
      case "orders":
        return data.totalOrders.toLocaleString();
      case "average":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(data.averageOrderValue);
      case "points":
        return data.totalPointsRedeemed.toLocaleString();
      default:
        return "0";
    }
  };

  // Placeholder percentage change - in a real app, this would compare with previous period
  const percentageChange = Math.random() * 20 - 10;
  const isPositive = percentageChange > 0;

  return (
    <div className="space-y-2">
      <div className="text-2xl font-bold">{getValue()}</div>
      <div
        className={`text-sm flex items-center ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPositive ? (
          <ArrowUpIcon className="w-4 h-4 mr-1" />
        ) : (
          <ArrowDownIcon className="w-4 h-4 mr-1" />
        )}
        <span>{Math.abs(percentageChange).toFixed(1)}% from last period</span>
      </div>
    </div>
  );
}
