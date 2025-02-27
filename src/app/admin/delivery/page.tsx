"use client";

import { DeliveryOrders } from "@/components/admin/delivery-orders";

export default function DeliveryManagementPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Delivery Management</h2>
      </div>
      <DeliveryOrders />
    </div>
  );
} 