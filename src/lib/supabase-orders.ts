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
  order_id: string;
  order_type: OrderType;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  items: OrderItem[];
  total_amount: number;
  payment_method?: string;
  payment_intent_id?: string;
  payment_receipt_url?: string;
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
    borough: string;
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
  };
  shipping_cost?: number;
  shipping_carrier?: string;
  shipping_method?: string;
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
  console.log('[Supabase Orders] Validating order data:', {
    type: data.order_type,
    hasCustomerName: Boolean(data.customer_name),
    hasCustomerEmail: Boolean(data.customer_email),
    itemCount: data.items?.length,
    hasTotal: Boolean(data.total_amount)
  });

  if (!data.customer_name || !data.customer_email || !data.items.length || !data.total_amount) {
    console.error('[Supabase Orders] Validation failed: Missing required fields');
    throw new Error('Missing required fields');
  }

  switch (data.order_type) {
    case 'pickup':
      console.log('[Supabase Orders] Validating pickup order:', {
        hasPickupDate: Boolean(data.pickup_date),
        hasPickupTime: Boolean(data.pickup_time)
      });
      if (!data.pickup_date || !data.pickup_time) {
        console.error('[Supabase Orders] Validation failed: Missing pickup fields');
        throw new Error('Pickup orders require pickup date and time');
      }
      break;
    case 'delivery':
      console.log('[Supabase Orders] Validating delivery order:', {
        hasAddress: Boolean(data.delivery_address),
        hasDate: Boolean(data.delivery_date),
        hasTimeSlot: Boolean(data.delivery_time_slot)
      });
      if (!data.delivery_address || !data.delivery_date || !data.delivery_time_slot) {
        console.error('[Supabase Orders] Validation failed: Missing delivery fields');
        throw new Error('Delivery orders require address, date, and time slot');
      }
      break;
    case 'shipping':
      console.log('[Supabase Orders] Validating shipping order:', {
        hasAddress: Boolean(data.shipping_address)
      });
      if (!data.shipping_address) {
        console.error('[Supabase Orders] Validation failed: Missing shipping address');
        throw new Error('Shipping orders require complete shipping address');
      }
      break;
  }
}

export const supabaseOrders = {
  async createOrder(orderData: CreateOrderData) {
    console.log('[Supabase Orders] Creating order:', {
      type: orderData.order_type,
      customerEmail: orderData.customer_email,
      itemCount: orderData.items.length,
      total: orderData.total_amount
    });

    try {
      // Validate order data first
      validateOrderData(orderData);

      // Ensure required fields have correct types
      const formattedOrderData = {
        ...orderData,
        status: orderData.status || 'pending',
        payment_status: orderData.payment_status || 'pending',
        items: Array.isArray(orderData.items) ? orderData.items : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Ensure addresses are stored as JSONB
        ...(orderData.order_type === 'delivery' && {
          delivery_address: orderData.delivery_address ? JSON.stringify(orderData.delivery_address) : null
        }),
        ...(orderData.order_type === 'shipping' && {
          shipping_address: orderData.shipping_address ? JSON.stringify(orderData.shipping_address) : null,
          shipping_rates: orderData.shipping_rates ? JSON.stringify(orderData.shipping_rates) : null
        })
      };

      console.log('[Supabase Orders] Order data formatted, inserting into database');

      const { data, error } = await supabaseClient
        .from('orders')
        .insert([formattedOrderData])
        .select()
        .single();

      if (error) {
        console.error('[Supabase Orders] Error creating order:', {
          error: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('[Supabase Orders] Order created successfully:', {
        orderId: data.order_id,
        status: data.status,
        paymentStatus: data.payment_status
      });

      return data;
    } catch (error) {
      console.error('[Supabase Orders] Error in createOrder:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
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