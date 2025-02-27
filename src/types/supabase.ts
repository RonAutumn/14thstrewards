export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          order_id: string
          order_type: 'delivery' | 'pickup' | 'shipping'
          customer_name: string
          customer_email: string
          customer_phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          borough: string | null
          pickup_date: string | null
          pickup_time: string | null
          shipment_id: string | null
          tracking_number: string | null
          label_url: string | null
          shipping_method: string | null
          shipping_fee: number | null
          shipping_rate: Json | null
          items: Json
          subtotal: number
          total: number
          delivery_fee: number | null
          status: 'pending' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled'
          payment_method: 'cash' | 'card' | 'other'
          instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          order_type: 'delivery' | 'pickup' | 'shipping'
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          borough?: string | null
          pickup_date?: string | null
          pickup_time?: string | null
          shipment_id?: string | null
          tracking_number?: string | null
          label_url?: string | null
          shipping_method?: string | null
          shipping_fee?: number | null
          shipping_rate?: Json | null
          items: Json
          subtotal: number
          total: number
          delivery_fee?: number | null
          status?: 'pending' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled'
          payment_method?: 'cash' | 'card' | 'other'
          instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          order_type?: 'delivery' | 'pickup' | 'shipping'
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          borough?: string | null
          pickup_date?: string | null
          pickup_time?: string | null
          shipment_id?: string | null
          tracking_number?: string | null
          label_url?: string | null
          shipping_method?: string | null
          shipping_fee?: number | null
          shipping_rate?: Json | null
          items?: Json
          subtotal?: number
          total?: number
          delivery_fee?: number | null
          status?: 'pending' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled'
          payment_method?: 'cash' | 'card' | 'other'
          instructions?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_type: 'delivery' | 'pickup' | 'shipping'
      order_status: 'pending' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled'
      payment_method: 'cash' | 'card' | 'other'
    }
  }
} 