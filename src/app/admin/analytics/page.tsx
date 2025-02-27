"use client";

import { AdminHeader } from "@/components/admin/header";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/useAnalytics";
import { OrderStats } from "@/components/admin/analytics/order-stats";
import { DeliveryMetrics } from "@/components/admin/analytics/delivery-metrics";
import { UserEngagement } from "@/components/admin/analytics/user-engagement";
import { RewardsUsage } from "@/components/admin/analytics/rewards-usage";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useState } from "react";
import { addDays } from "date-fns";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const { data, isLoading } = useAnalytics({
    startDate: dateRange.from,
    endDate: dateRange.to,
  });

  return (
    <RequireAuth adminOnly>
      <div className="space-y-6">
        <AdminHeader title="Analytics Dashboard">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </AdminHeader>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStats
                data={data?.orderStats}
                isLoading={isLoading}
                type="revenue"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStats
                data={data?.orderStats}
                isLoading={isLoading}
                type="orders"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Order Value</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStats
                data={data?.orderStats}
                isLoading={isLoading}
                type="average"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Points Redeemed</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStats
                data={data?.orderStats}
                isLoading={isLoading}
                type="points"
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Order Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <UserEngagement
                data={data?.userEngagement}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <DeliveryMetrics
                data={data?.deliveryMetrics}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Points & Rewards Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <RewardsUsage data={data?.rewardsUsage} isLoading={isLoading} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <UserEngagement
                data={data?.userActivity}
                isLoading={isLoading}
                type="activity"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireAuth>
  );
}
