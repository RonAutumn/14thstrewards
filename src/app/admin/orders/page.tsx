"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/header";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/useOrders";
import { columns } from "./columns";
import { BulkActions } from "@/components/admin/orders/bulk-actions";
import { DownloadIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const { data: orders, isLoading } = useOrders({
    search,
    status,
    dateRange,
  });

  const handleExport = async () => {
    const supabase = createClient();
    try {
      let query = supabase.from("orders").select(`
          *,
          profiles (
            full_name,
            email
          )
        `);

      if (selectedRows.length > 0) {
        query = query.in("id", selectedRows);
      }

      const { data, error } = await query;

      if (error) throw error;

      const csvData = data.map((order) => ({
        id: order.id,
        customer: order.profiles?.full_name || "Unknown",
        email: order.profiles?.email,
        status: order.status,
        total: order.total,
        created_at: order.created_at,
      }));

      const csv = [
        Object.keys(csvData[0]).join(","),
        ...csvData.map((row) => Object.values(row).join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Orders exported successfully");
    } catch (error) {
      console.error("Error exporting orders:", error);
      toast.error("Failed to export orders");
    }
  };

  return (
    <RequireAuth adminOnly>
      <div className="space-y-6">
        <AdminHeader title="Orders Management" />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Orders</CardTitle>
              <div className="flex gap-4">
                <BulkActions
                  selectedOrders={selectedRows}
                  onComplete={() => setSelectedRows([])}
                />
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={isLoading}
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DataTable
              columns={columns}
              data={orders || []}
              isLoading={isLoading}
              onRowSelectionChange={(rows) => {
                setSelectedRows(Object.keys(rows).filter((key) => rows[key]));
              }}
            />
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}
