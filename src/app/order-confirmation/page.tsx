"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Truck, Store } from "lucide-react";
import { supabaseOrders } from "@/lib/supabase-orders";
import type { OrderType } from "@/lib/supabase-orders";
import { rewardsService } from "@/features/rewards/rewards.service";
import { userService } from "@/features/user/user.service";

// Add window type declaration
declare const window: Window & typeof globalThis;

interface OrderData {
  id: string;
  order_id: string;
  user_id: string | null;
  order_type: OrderType;
  status: string;
  total_amount: string | number;
  items: {
    id: string;
    name: string;
    price: number;
    total: number;
    quantity: number;
    recordId: string;
    variation: string;
    isRedeemed: boolean;
    pointsCost: number;
    originalPrice: number;
  }[];
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  pickup_date: string | null;
  pickup_time: string | null;
  pickup_notes: string | null;
  delivery_address: {
    street: string;
    borough: string;
    zip_code: string;
  } | string | null;
  delivery_instructions: string | null;
  delivery_date: string | null;
  delivery_time_slot: string | null;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
  } | string | null;
  tracking_number: string | null;
  shipping_carrier: string | null;
  shipping_method: string | null;
  shipping_label_url: string | null;
  shipping_cost: number | null;
  payment_status: string;
  payment_method: string | null;
  payment_intent_id: string | null;
  payment_receipt_url: string | null;
  created_at: string;
  updated_at: string;
  shipping_rates: any | null;
  label_id: string | null;
  updated_by: string | null;
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const orderId = searchParams.get("orderId");
  const orderDataStr = searchParams.get("orderData");
  const [userData, setUserData] = useState<any | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        // First try to parse the orderData from URL if available
        if (orderDataStr) {
          try {
            const parsedData = JSON.parse(decodeURIComponent(orderDataStr));
            if (parsedData) {
              try {
                // Update the order status using the server API
                console.log('Updating order status for:', orderId);
                const response = await fetch('/api/orders/update-status', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    orderId,
                    status: 'completed',
                    paymentStatus: 'paid'
                  }),
                });

                if (!response.ok) {
                  throw new Error('Failed to update order status');
                }

                const result = await response.json();
                console.log('Status update result:', result);

                // Verify the updates by fetching the latest order
                const updatedOrder = await supabaseOrders.getOrder(orderId);
                console.log('Updated order:', updatedOrder);

                // Preserve the original order data while updating status
                const processedData = {
                  ...updatedOrder, // Base data from database
                  ...parsedData,   // Override with URL data
                  order_type: parsedData.order_type || updatedOrder?.order_type,
                  items: Array.isArray(parsedData.items) ? parsedData.items : 
                         typeof parsedData.items === "string" ? JSON.parse(parsedData.items) : 
                         Array.isArray(updatedOrder?.items) ? updatedOrder.items : [],
                  status: "completed",
                  payment_status: "paid",
                  total_amount: parsedData.total || updatedOrder?.total_amount,
                  delivery_address: parsedData.delivery_address || updatedOrder?.delivery_address,
                  delivery_date: parsedData.delivery_date || updatedOrder?.delivery_date,
                  delivery_time_slot: parsedData.delivery_time_slot || updatedOrder?.delivery_time_slot
                };

                setOrderData(processedData as OrderData);
                setLoading(false);
                return;
              } catch (updateError) {
                console.error('Error updating order status:', updateError);
                // Even if status update fails, still show the order
                setOrderData({
                  ...parsedData,
                  status: "completed",
                  payment_status: "paid"
                } as OrderData);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.error("Error parsing order data from URL:", e);
          }
        }

        // If no orderData in URL or parsing failed, fetch from Supabase
        const order = await supabaseOrders.getOrder(orderId);
        console.log('Raw order from Supabase:', order);
        
        if (order) {
          setOrderData(order);
          
          try {
            // Then update the status
            const response = await fetch('/api/orders/update-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId,
                status: 'completed',
                paymentStatus: 'paid'
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to update order status');
            }

            const result = await response.json();
            console.log('Status update result:', result);

            // Update the order data with the new status
            setOrderData(prevData => ({
              ...prevData!,
              status: 'completed',
              payment_status: 'paid'
            }));
          } catch (updateError) {
            console.error('Error updating order status:', updateError);
          }
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, orderDataStr]);

  useEffect(() => {
    async function fetchUserData() {
      if (orderData?.user_id) {
        const user = await userService.getUser(orderData.user_id);
        setUserData(user);
      }
    }

    fetchUserData();
  }, [orderData?.user_id]);

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
    // Convert 24-hour time (HH:mm) to 12-hour format with AM/PM
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return '$0.00';
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return '$0.00';
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numericAmount);
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      ) : !orderId || !orderData ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Order information not found.</p>
            <Button onClick={() => router.push("/")}>Return to Home</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <CardTitle>Order Confirmed!</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Order #{orderData.order_id}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    Type: {orderData.order_type}
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
                  <strong>Status:</strong>{" "}
                  <span className="capitalize">{orderData.status}</span>
                </p>
                <p>
                  <strong>Payment Status:</strong>{" "}
                  <span className="capitalize">{orderData.payment_status}</span>
                </p>
                {orderData.user_id && (
                  <p>
                    <strong>Points Earned:</strong>{" "}
                    <span className="text-green-600">
                      +{rewardsService.calculateEstimatedPoints(
                        orderData.items.reduce((sum, item) => sum + (item.total || 0), 0),
                        userData?.profile?.membership_level || 'BRONZE' // Use actual tier from profile
                      ).toLocaleString()} points
                    </span>
                  </p>
                )}
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
              {/* Debug log */}
              <div style={{ display: 'none' }}>
                {orderData.order_type /* Log via React DevTools */}
              </div>
              
              {orderData.order_type === "delivery" ? (
                  <>
                    <p>
                      <strong>Delivery Address:</strong>
                    </p>
                    {(() => {
                      let address = orderData.delivery_address;
                      if (typeof address === 'string') {
                        try {
                          address = JSON.parse(address);
                        } catch (e) {
                          console.error('Failed to parse delivery address:', e);
                        }
                      }
                      
                      if (address && typeof address === 'object') {
                        return (
                          <div className="ml-4 space-y-1">
                            <p>{address.street}</p>
                            <p>{address.borough} NY {address.zip_code}</p>
                          </div>
                        );
                      }
                      
                      return <p className="ml-4">{typeof address === 'string' ? address : 'Address not specified'}</p>;
                    })()}
                    {orderData.delivery_instructions && (
                      <p>
                        <strong>Instructions:</strong>{" "}
                        {orderData.delivery_instructions}
                      </p>
                    )}
                    <p>
                      <strong>Delivery Date:</strong>{" "}
                      {orderData.delivery_date ? formatDate(orderData.delivery_date) : "Not specified"}
                    </p>
                    <p>
                      <strong>Delivery Time:</strong>{" "}
                      {orderData.delivery_time_slot ? formatTime(orderData.delivery_time_slot.split('-')[0]) + ' - ' + formatTime(orderData.delivery_time_slot.split('-')[1]) : "Not specified"}
                    </p>
                  </>
                ) : orderData.order_type === "shipping" ? (
                  <>
                    <p>
                      <strong>Shipping Address:</strong>
                    </p>
                    {(() => {
                      let address = orderData.shipping_address;
                      if (typeof address === 'string') {
                        try {
                          const parsed = JSON.parse(address);
                          address = parsed as typeof orderData.shipping_address;
                        } catch (e) {
                          console.error('Failed to parse shipping address:', e);
                        }
                      }
                      
                      if (address && typeof address === 'object' && 'street' in address) {
                        return (
                          <div className="ml-4 space-y-1">
                            <p>{address.street}</p>
                            <p>{address.city} {address.state} {address.zip_code}</p>
                          </div>
                        );
                      }
                      
                      return <p className="ml-4">{typeof address === 'string' ? address : 'Address not specified'}</p>;
                    })()}
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
                ) : (
                  <>
                    <p>
                      <strong>Pickup Date:</strong>{" "}
                      {orderData.pickup_date ? formatDate(orderData.pickup_date) : "Not specified"}
                    </p>
                    <p>
                      <strong>Pickup Time:</strong>{" "}
                      {orderData.pickup_time ? formatTime(orderData.pickup_time) : "Not specified"}
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
                {!orderData?.items?.length ? (
                  <div>No order items found.</div>
                ) : (
                  <>
                    {orderData.items.map((item, index) => (
                      <div key={item.id || index} className="flex justify-between py-2 border-b last:border-b-0">
                        <div className="space-y-1">
                          <span className="font-medium">
                            {item.name} x {item.quantity}
                          </span>
                          {item.variation && item.variation !== item.name && (
                            <p className="text-sm text-muted-foreground">
                              Variation: {item.variation}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-medium">
                            {formatCurrency(item.total)}
                          </span>
                          {item.originalPrice > item.price && item.originalPrice > 0 && (
                            <p className="text-sm text-muted-foreground line-through">
                              {formatCurrency(item.originalPrice * item.quantity)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(orderData.items.reduce((acc, item) => acc + (typeof item.total === 'string' ? parseFloat(item.total) : item.total || 0), 0))}</span>
                      </div>
                      {orderData.shipping_cost && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>{formatCurrency(orderData.shipping_cost)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>{formatCurrency(
                          (typeof orderData.total_amount === 'string' 
                            ? parseFloat(orderData.total_amount) 
                            : orderData.total_amount || 0) + 
                          (orderData.shipping_cost || 0)
                        )}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4">
            <Button onClick={() => router.push("/")}>Return to Home</Button>
            <Button variant="outline" onClick={() => window.print()}>
              Print Receipt
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
