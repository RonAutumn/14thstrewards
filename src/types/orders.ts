import { ShippingFormData } from "@/features/cart/types";

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  variation?: string;
  recordId: string;
  isRedeemed: boolean;
  originalPrice: number;
  pointsCost: number;
  unitPrice: number;
  weight: number;
  options?: Record<string, any>;
}

// Base interface for common order properties
interface BaseOrder {
  id: string;
  orderId: string;
  customerName: string;
  email: string;
  phone?: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  timestamp: string;
}

// Interface for raw order data from API
export interface RawOrderData {
  id?: string;
  orderId?: string;
  customerName?: string;
  email?: string;
  phone?: string;
  deliveryAddress?: string;
  items?: string;
  status?: OrderStatus;
  total?: number;
  timestamp?: string;
  shipmentId?: string;
  trackingNumber?: string;
  labelUrl?: string;
  method?: string;
  shippingFee?: number;
}

export interface ShippingOrder extends BaseOrder {
  deliveryAddress: string;
  shipmentId?: string;
  trackingNumber?: string;
  labelUrl?: string;
  method: string;
  shippingFee: number;
}

export interface DeliveryOrder {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  deliveryInstructions?: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface PickupOrder extends BaseOrder {
  type: 'pickup';
  pickupDate: string;
  pickupTime: string;
}

// Export type for use in components that handle both types
export type Order = ShippingOrder | DeliveryOrder | PickupOrder;

// Airtable record structure for orders
export interface OrderRecord {
  id: string;
  fields: {
    orderId: string;
    customerName: string;
    email: string;
    phone?: string;
    items: OrderItem[];
    status: OrderStatus;
    total: number;
    timestamp: string;
    deliveryAddress?: string;
    shipmentId?: string;
    trackingNumber?: string;
    labelUrl?: string;
  };
}

export interface PickupFormData {
  orderId: string;
  customerName: string;
  email: string;
  phone?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  type: 'pickup';
  pickupDate: string;
  pickupTime: string;
}

export interface BaseOrderData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: OrderItem[];
  total_amount: number;
  payment_method: "cash" | "card";
}

export interface PickupOrderData extends BaseOrderData {
  order_type: "pickup";
  pickup_date: string;
  pickup_time: string;
  pickup_notes: string;
}

export interface DeliveryOrderData extends BaseOrderData {
  order_type: "delivery";
  delivery_address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
  };
  delivery_instructions: string;
  delivery_date: string;
  delivery_time_slot: string;
}

export interface ShippingOrderData extends BaseOrderData {
  order_type: "shipping";
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  shipping_method: string;
  shipping_cost: number;
}

export type CreateOrderData = PickupOrderData | DeliveryOrderData | ShippingOrderData;
