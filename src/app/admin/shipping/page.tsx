"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminHeader } from "@/components/admin/header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { ShippingOrder } from "@/types/orders";

interface OrderDetailsProps {
  order: ShippingOrder;
  onClose: () => void;
}

function OrderDetails({ order, onClose }: OrderDetailsProps) {
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const { toast } = useToast();

  const handleCreateLabel = async () => {
    try {
      setIsCreatingLabel(true);
      const response = await fetch(`/api/shipping-orders/${order.id}/label`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to create shipping label");

      const data = await response.json();

      toast({
        title: "Success",
        description: "Shipping label created successfully",
      });

      onClose();
    } catch (error) {
      console.error("Error creating label:", error);
      toast({
        title: "Error",
        description: "Failed to create shipping label",
        variant: "destructive",
      });
    } finally {
      setIsCreatingLabel(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order #{order.orderId}
        </DialogTitle>
      </DialogHeader>
      <ScrollArea className="max-h-[80vh]">
        <div className="grid gap-4 py-4">
          {/* Customer Information */}
          <div>
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p>{order.customerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p>{order.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p>{order.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Order Date</p>
                <p>{format(new Date(order.timestamp), "PPP")}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Shipping Information */}
          <div>
            <h3 className="font-semibold mb-2">Shipping Information</h3>
            <div className="grid gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Delivery Address</p>
                <p>{order.deliveryAddress}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge
                  variant={
                    order.status === "delivered"
                      ? "default"
                      : order.status === "processing"
                      ? "secondary"
                      : order.status === "shipped"
                      ? "success"
                      : "outline"
                  }
                  className="capitalize mt-1"
                >
                  {order.status}
                </Badge>
              </div>
              {order.trackingNumber && (
                <div>
                  <p className="text-muted-foreground">Tracking Number</p>
                  <p>{order.trackingNumber}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Shipping Method</p>
                <p>{order.method || "Not selected"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Shipping Fee</p>
                <p>${order.shippingFee.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-2">Order Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      ${item.price.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2} className="text-right font-medium">
                    Subtotal
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${order.total.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2} className="text-right font-medium">
                    Shipping
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${order.shippingFee.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2} className="text-right font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${(order.total + order.shippingFee).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Shipping Actions */}
          <Separator />
          <div>
            {!order.labelUrl ? (
              <div className="flex justify-end">
                <Button
                  variant="default"
                  onClick={handleCreateLabel}
                  disabled={isCreatingLabel}
                >
                  {isCreatingLabel
                    ? "Creating Label..."
                    : "Create Shipping Label"}
                </Button>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(order.labelUrl, "_blank")}
                >
                  View Label
                </Button>
                {order.trackingNumber && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `/api/shipping-orders/${order.id}/tracking`,
                        "_blank"
                      )
                    }
                  >
                    Track Package
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  );
}

export default function ShippingManagementPage() {
  const [orders, setOrders] = useState<ShippingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ShippingOrder | null>(
    null
  );
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/shipping-orders");
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch shipping orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <AdminHeader
        heading="Shipping Management"
        text="Manage and track shipping orders"
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Shipping Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : orders.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No shipping orders found.</AlertDescription>
            </Alert>
          ) : (
            <div className="relative">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.orderId}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>
                        {format(new Date(order.timestamp), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "default"
                              : order.status === "processing"
                              ? "secondary"
                              : order.status === "shipped"
                              ? "success"
                              : "outline"
                          }
                          className="capitalize"
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        ${(order.total + order.shippingFee).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          {selectedOrder && (
                            <OrderDetails
                              order={selectedOrder}
                              onClose={() => {
                                setSelectedOrder(null);
                                fetchOrders(); // Refresh orders after closing
                              }}
                            />
                          )}
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
