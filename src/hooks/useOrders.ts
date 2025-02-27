import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

interface UseOrdersParams {
  search?: string;
  status?: string;
  dateRange?: string;
}

export function useOrders({ search = "", status = "all", dateRange = "today" }: UseOrdersParams = {}) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["orders", { search, status, dateRange }],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `);

      // Apply status filter
      if (status !== "all") {
        query = query.eq("status", status);
      }

      // Apply date range filter
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateRange) {
        case "today":
          query = query.gte("created_at", startOfDay.toISOString());
          break;
        case "yesterday":
          const yesterday = new Date(startOfDay);
          yesterday.setDate(yesterday.getDate() - 1);
          query = query
            .gte("created_at", yesterday.toISOString())
            .lt("created_at", startOfDay.toISOString());
          break;
        case "last7days":
          const last7Days = new Date(startOfDay);
          last7Days.setDate(last7Days.getDate() - 7);
          query = query.gte("created_at", last7Days.toISOString());
          break;
        case "last30days":
          const last30Days = new Date(startOfDay);
          last30Days.setDate(last30Days.getDate() - 30);
          query = query.gte("created_at", last30Days.toISOString());
          break;
        case "thisMonth":
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          query = query.gte("created_at", startOfMonth.toISOString());
          break;
        case "lastMonth":
          const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          query = query
            .gte("created_at", startOfLastMonth.toISOString())
            .lt("created_at", startOfThisMonth.toISOString());
          break;
      }

      // Apply search filter
      if (search) {
        query = query.or(`id.ilike.%${search}%,profiles.full_name.ilike.%${search}%,profiles.email.ilike.%${search}%`);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data.map((order) => ({
        ...order,
        customer: order.profiles?.full_name || "Unknown",
      }));
    },
  });
} 