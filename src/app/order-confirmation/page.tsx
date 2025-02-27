"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Truck, Store } from "lucide-react";
import { supabaseOrders } from "@/lib/supabase-orders";
import type { OrderType } from "@/lib/supabase-orders";

// Add window type declaration
declare const window: Window & typeof globalThis;

interface OrderData {
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  order_type: OrderType;
  status: string;
  payment_status: string;
  total_amount: number;
  items: any[];

  // Pickup fields
  pickup_date?: string;
  pickup_time?: string;
  pickup_notes?: string;

  // Delivery fields
  delivery_address?: {
    street: string;
    borough: string;
    zip_code: string;
  };
  delivery_instructions?: string;
  delivery_date?: string;
  delivery_time_slot?: string;

  // Shipping fields
  shipping_address?: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country?: string;
  };
  shipping_carrier?: string;
  shipping_method?: string;
  shipping_cost?: number;
  tracking_number?: string;
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      try {
        const order = await supabaseOrders.getOrder(orderId);
        if (order) {
          setOrderData({
            ...order,
            items:
              typeof order.items === "string"
                ? JSON.parse(order.items)
                : order.items,
          });
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-8">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orderId || !orderData) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Order information not found.</p>
            <Button onClick={() => router.push("/")}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getDeliveryIcon = () => {
    switch (orderData.order_type) {
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

  const formatDate = (date?: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return "";
    return time;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <CardTitle>Order Confirmed!</CardTitle>
              <p className="text-sm text-muted-foreground">
                Order #{orderData.order_id}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Thank you for your order. You will receive a confirmation email
            shortly.
          </p>
          <div className="mt-2">
            <p>
              <strong>Status:</strong> {orderData.status}
            </p>
            <p>
              <strong>Payment Status:</strong> {orderData.payment_status}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {getDeliveryIcon()}
            <CardTitle>
              {orderData.order_type === "delivery"
                ? "Delivery"
                : orderData.order_type === "shipping"
                ? "Shipping"
                : "Pickup"}{" "}
              Details
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {orderData.order_type === "delivery" &&
            orderData.delivery_address && (
              <>
                <p>
                  <strong>Delivery Address:</strong>
                </p>
                <p className="ml-4">{orderData.delivery_address.street}</p>
                <p className="ml-4">
                  {orderData.delivery_address.borough}, NY{" "}
                  {orderData.delivery_address.zip_code}
                </p>
                {orderData.delivery_instructions && (
                  <p>
                    <strong>Instructions:</strong>{" "}
                    {orderData.delivery_instructions}
                  </p>
                )}
                <p>
                  <strong>Delivery Date:</strong>{" "}
                  {formatDate(orderData.delivery_date)}
                </p>
                <p>
                  <strong>Delivery Time:</strong>{" "}
                  {formatTime(orderData.delivery_time_slot)}
                </p>
              </>
            )}
          {orderData.order_type === "shipping" &&
            orderData.shipping_address && (
              <>
                <p>
                  <strong>Shipping Address:</strong>
                </p>
                <p className="ml-4">{orderData.shipping_address.street}</p>
                <p className="ml-4">
                  {[
                    orderData.shipping_address.city,
                    orderData.shipping_address.state,
                    orderData.shipping_address.zip_code,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {orderData.shipping_method && (
                  <>
                    <p className="mt-2">
                      <strong>Shipping Method:</strong>{" "}
                      {orderData.shipping_method}
                    </p>
                    {orderData.shipping_cost && (
                      <p className="ml-4">
                        Cost: {formatCurrency(orderData.shipping_cost)}
                      </p>
                    )}
                  </>
                )}
                {orderData.tracking_number && (
                  <p>
                    <strong>Tracking Number:</strong>{" "}
                    {orderData.tracking_number}
                  </p>
                )}
              </>
            )}
          {orderData.order_type === "pickup" && (
            <>
              <p>
                <strong>Pickup Date:</strong>{" "}
                {formatDate(orderData.pickup_date)}
              </p>
              <p>
                <strong>Pickup Time:</strong>{" "}
                {formatTime(orderData.pickup_time)}
              </p>
              {orderData.pickup_notes && (
                <p>
                  <strong>Notes:</strong> {orderData.pickup_notes}
                </p>
              )}
              <p>
                <strong>Pickup Location:</strong> Check Email
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {orderData.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-4">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(orderData.total_amount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button onClick={() => router.push("/")}>Return to Home</Button>
        <Button variant="outline" onClick={() => window.print()}>
          Print Receipt
        </Button>
      </div>
    </div>
  );
}
