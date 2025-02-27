import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { startOfDay, endOfDay, format } from "date-fns";

interface UseAnalyticsParams {
  startDate: Date;
  endDate: Date;
}

export function useAnalytics({ startDate, endDate }: UseAnalyticsParams) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["analytics", { startDate, endDate }],
    queryFn: async () => {
      const start = startOfDay(startDate).toISOString();
      const end = endOfDay(endDate).toISOString();

      // Fetch order statistics
      const { data: orderStats, error: orderError } = await supabase
        .from("orders")
        .select("id, total, status, created_at, points_redeemed")
        .gte("created_at", start)
        .lte("created_at", end);

      if (orderError) throw orderError;

      // Fetch delivery metrics
      const { data: deliveryData, error: deliveryError } = await supabase
        .from("orders")
        .select("status, delivery_status, created_at")
        .in("status", ["completed", "processing"])
        .gte("created_at", start)
        .lte("created_at", end);

      if (deliveryError) throw deliveryError;

      // Fetch user engagement data
      const { data: userEngagement, error: userError } = await supabase
        .from("profiles")
        .select("id, created_at, last_login")
        .gte("created_at", start)
        .lte("created_at", end);

      if (userError) throw userError;

      // Fetch rewards usage
      const { data: rewardsData, error: rewardsError } = await supabase
        .from("points_history")
        .select("points, type, created_at")
        .gte("created_at", start)
        .lte("created_at", end);

      if (rewardsError) throw rewardsError;

      // Process order statistics
      const totalRevenue = orderStats.reduce((sum, order) => sum + (order.total || 0), 0);
      const totalOrders = orderStats.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const totalPointsRedeemed = orderStats.reduce((sum, order) => sum + (order.points_redeemed || 0), 0);

      // Process delivery metrics
      const onTimeDeliveries = deliveryData.filter(order => order.delivery_status === "on_time").length;
      const totalDeliveries = deliveryData.length;
      const deliveryPerformance = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;

      // Process user engagement
      const dailyEngagement = userEngagement.reduce((acc, user) => {
        const date = format(new Date(user.created_at), "yyyy-MM-dd");
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Process rewards usage
      const pointsEarned = rewardsData
        .filter(record => record.type === "earned")
        .reduce((sum, record) => sum + record.points, 0);
      const pointsRedeemed = rewardsData
        .filter(record => record.type === "redeemed")
        .reduce((sum, record) => sum + record.points, 0);

      return {
        orderStats: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          totalPointsRedeemed,
          dailyOrders: orderStats.reduce((acc, order) => {
            const date = format(new Date(order.created_at), "yyyy-MM-dd");
            acc[date] = (acc[date] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
        deliveryMetrics: {
          onTimeDeliveries,
          totalDeliveries,
          deliveryPerformance,
          statusBreakdown: deliveryData.reduce((acc, order) => {
            acc[order.delivery_status] = (acc[order.delivery_status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
        userEngagement: {
          dailyEngagement,
          totalUsers: userEngagement.length,
        },
        rewardsUsage: {
          pointsEarned,
          pointsRedeemed,
          history: rewardsData.map(record => ({
            date: record.created_at,
            points: record.points,
            type: record.type,
          })),
        },
      };
    },
  });
} 