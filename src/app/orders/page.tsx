"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Truck, Store, ArrowUpDown } from "lucide-react";
import { supabaseOrders, type Order } from "@/lib/supabase-orders";
import { supabase } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = {
  label: string;
  value: string;
  sortFn: (a: Order, b: Order) => number;
};

const sortOptions: SortOption[] = [
  {
    label: "Date (Newest First)",
    value: "date-desc",
    sortFn: (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  },
  {
    label: "Date (Oldest First)",
    value: "date-asc",
    sortFn: (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  },
  {
    label: "Total (High to Low)",
    value: "total-desc",
    sortFn: (a, b) => b.total_amount - a.total_amount,
  },
  {
    label: "Total (Low to High)",
    value: "total-asc",
    sortFn: (a, b) => a.total_amount - b.total_amount,
  },
  {
    label: "Order Type",
    value: "type",
    sortFn: (a, b) => a.order_type.localeCompare(b.order_type),
  },
  {
    label: "Status",
    value: "status",
    sortFn: (a, b) => a.status.localeCompare(b.status),
  },
];

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [sortedOrders, setSortedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentSort, setCurrentSort] = useState<string>("date-desc");

  useEffect(() => {
    async function fetchUserAndOrders() {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Fetch orders for the user
          const userOrders = await supabaseOrders.getUserOrders(user.id);
          setOrders(userOrders);
          // Apply initial sort
          const sortOption = sortOptions.find(
            (option) => option.value === currentSort
          );
          if (sortOption) {
            setSortedOrders([...userOrders].sort(sortOption.sortFn));
          } else {
            setSortedOrders(userOrders);
          }
        } else {
          // Redirect to login if no user
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserAndOrders();
  }, [router, currentSort]);

  // Handle sort change
  const handleSortChange = (value: string) => {
    setCurrentSort(value);
    const sortOption = sortOptions.find((option) => option.value === value);
    if (sortOption) {
      setSortedOrders([...orders].sort(sortOption.sortFn));
    }
  };

  const getDeliveryIcon = (orderType: string) => {
    switch (orderType) {
      case "delivery":
        return <Truck className="h-6 w-6" />;
      case "shipping":
        return <Package className="h-6 w-6" />;
      case "pickup":
        return <Store className="h-6 w-6" />;
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getOrderStatus = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-sm ${
          statusColors[status as keyof typeof statusColors] ||
          statusColors.pending
        }`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center mb-4">
              Please log in to view your orders.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => router.push("/login")}>Log In</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Order History</h1>
            <p className="text-muted-foreground">View and track your orders</p>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={currentSort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sortedOrders.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center mb-4">
                You haven't placed any orders yet.
              </p>
              <div className="flex justify-center">
                <Button onClick={() => router.push("/")}>Start Shopping</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          sortedOrders.map((order) => (
            <Card
              key={order.order_id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  {getDeliveryIcon(order.order_type)}
                  <div>
                    <CardTitle className="text-lg">
                      Order #{order.order_id}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getOrderStatus(order.status)}
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/order-confirmation?orderId=${order.order_id}`
                      )
                    }
                  >
                    View Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {order.order_type.charAt(0).toUpperCase() +
                          order.order_type.slice(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(order.total_amount)}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.order_type === "delivery" &&
                      order.delivery_address && (
                        <p>
                          Delivering to: {order.delivery_address.street},{" "}
                          {order.delivery_address.borough}
                        </p>
                      )}
                    {order.order_type === "shipping" &&
                      order.shipping_address && (
                        <p>
                          Shipping to: {order.shipping_address.street},{" "}
                          {order.shipping_address.city}
                        </p>
                      )}
                    {order.order_type === "pickup" && (
                      <p>Pickup on: {formatDate(order.pickup_date || "")}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
