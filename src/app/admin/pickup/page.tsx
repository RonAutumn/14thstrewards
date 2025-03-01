"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Search } from "lucide-react";
import type { PickupOrder } from "@/types/orders";

export default function PickupManagementPage() {
  const [orders, setOrders] = useState<PickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/pickup-orders");
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pickup orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/pickup-orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update order status");

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });

      await fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.orderId.toLowerCase().includes(searchLower) ||
      order.customerName.toLowerCase().includes(searchLower) ||
      order.pickupTime.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Pickup Orders</h1>

      <div className="flex justify-between items-center mb-4">
        <div className="relative w-[300px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No pickup orders found</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pickup Date</TableHead>
                <TableHead>Pickup Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.orderId}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.customerPhone}</TableCell>
                  <TableCell>{order.items.length} items</TableCell>
                  <TableCell>${order.total.toFixed(2)}</TableCell>
                  <TableCell>{order.pickupDate}</TableCell>
                  <TableCell>{order.pickupTime}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === "completed"
                          ? "success"
                          : order.status === "cancelled"
                          ? "destructive"
                          : "default"
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, "completed")}
                        disabled={order.status === "completed"}
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateOrderStatus(order.id, "cancelled")}
                        disabled={order.status === "cancelled"}
                      >
                        Cancel
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
