import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import type { OrderItem } from '@/types/orders';
import { createClient } from './supabase/client';

// Initialize the Supabase client
const supabaseClient = createClient();

// Types for our orders
export type OrderType = 'pickup' | 'delivery' | 'shipping';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'paid';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'other';

// Base order data interface
interface BaseOrderData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  items: OrderItem[];
  total_amount: number;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  status?: OrderStatus;
}

// Pickup specific fields
interface PickupOrderData extends BaseOrderData {
  order_type: 'pickup';
  pickup_date: string;
  pickup_time: string;
  pickup_notes?: string;
}

// Delivery specific fields
interface DeliveryOrderData extends BaseOrderData {
  order_type: 'delivery';
  delivery_address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
  };
  delivery_instructions?: string;
  delivery_date: string;
  delivery_time_slot: string;
}

// Shipping specific fields
interface ShippingOrderData extends BaseOrderData {
  order_type: 'shipping';
  shipping_address: {
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
  shipping_label_url?: string;
}

// Union type for all order types
export type CreateOrderData = PickupOrderData | DeliveryOrderData | ShippingOrderData;

export interface ShippingRateInfo {
  carrier: string;
  service: string;
  cost: number;
  estimatedDays: number;
}

// Helper function to validate order data based on type
function validateOrderData(data: CreateOrderData): void {
  if (!data.customer_name || !data.customer_email || !data.items.length || !data.total_amount) {
    throw new Error('Missing required fields');
  }

  switch (data.order_type) {
    case 'pickup':
      if (!data.pickup_date || !data.pickup_time) {
        throw new Error('Pickup orders require pickup date and time');
      }
      break;
    case 'delivery':
      if (!data.delivery_address || !data.delivery_date || !data.delivery_time_slot) {
        throw new Error('Delivery orders require address, date, and time slot');
      }
      break;
    case 'shipping':
      if (!data.shipping_address) {
        throw new Error('Shipping orders require complete shipping address');
      }
      break;
  }
}

export const supabaseOrders = {
  async createOrder(orderData: CreateOrderData) {
    const { data, error } = await supabaseClient
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get order by ID
  async getOrder(orderId: string) {
    try {
      const { data: order, error } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error) throw error;
      return order;
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: OrderStatus) {
    try {
      const { data: order, error } = await supabaseClient
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('order_id', orderId)
        .select()
        .single();

      if (error) throw error;
      return order;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Update payment status
  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus) {
    try {
      const { data: order, error } = await supabaseClient
        .from('orders')
        .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
        .eq('order_id', orderId)
        .select()
        .single();

      if (error) throw error;
      return order;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  // Get orders by customer email
  async getCustomerOrders(email: string) {
    try {
      const { data: orders, error } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return orders;
    } catch (error) {
      console.error('Error getting customer orders:', error);
      throw error;
    }
  },

  // Get orders for a specific user
  async getUserOrders(userId: string) {
    try {
      const { data: orders, error } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return orders.map(order => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
      }));
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  },

  // Get orders by type and status
  async getOrdersByTypeAndStatus(type: OrderType, status: OrderStatus) {
    try {
      const { data: orders, error } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('order_type', type)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return orders;
    } catch (error) {
      console.error('Error getting orders by type and status:', error);
      throw error;
    }
  },

  // Update shipping information
  async updateShippingInfo(
    orderId: string,
    shippingInfo: {
      tracking_number?: string;
      shipping_carrier?: string;
      shipping_method?: string;
      shipping_label_url?: string;
      shipping_cost?: number;
    }
  ) {
    try {
      const { data: order, error } = await supabaseClient
        .from('orders')
        .update({
          ...shippingInfo,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)
        .eq('order_type', 'shipping')
        .select()
        .single();

      if (error) throw error;
      return order;
    } catch (error) {
      console.error('Error updating shipping info:', error);
      throw error;
    }
  }
}; 