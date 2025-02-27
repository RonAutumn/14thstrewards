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
      rewards: {
        Row: {
          id: string
          reward_id: string
          name: string
          description: string | null
          points_cost: number
          price: number | null
          is_active: boolean
          quantity: number | null
          redemption_limit: Json | null
          available_for_tiers: string[]
          expires_at: string | null
          created_at: string
          updated_at: string | null
          has_reward_codes: boolean
        }
        Insert: {
          id?: string
          reward_id: string
          name: string
          description?: string | null
          points_cost: number
          price?: number | null
          is_active?: boolean
          quantity?: number | null
          redemption_limit?: Json | null
          available_for_tiers: string[]
          expires_at?: string | null
          created_at?: string
          updated_at?: string | null
          has_reward_codes?: boolean
        }
        Update: {
          id?: string
          reward_id?: string
          name?: string
          description?: string | null
          points_cost?: number
          price?: number | null
          is_active?: boolean
          quantity?: number | null
          redemption_limit?: Json | null
          available_for_tiers?: string[]
          expires_at?: string | null
          created_at?: string
          updated_at?: string | null
          has_reward_codes?: boolean
        }
      }
      reward_codes: {
        Row: {
          id: string
          code: string
          reward_id: string | null
          is_redeemed: boolean
          redeemed_by: string | null
          redeemed_at: string | null
          expires_at: string | null
          created_at: string
          is_unlimited_use: boolean
          user_redemptions: string[] | null
          points_value: number | null
          item_details: Json | null
        }
        Insert: {
          id?: string
          code: string
          reward_id?: string | null
          is_redeemed?: boolean
          redeemed_by?: string | null
          redeemed_at?: string | null
          expires_at?: string | null
          created_at?: string
          is_unlimited_use?: boolean
          user_redemptions?: string[] | null
          points_value?: number | null
          item_details?: Json | null
        }
        Update: {
          id?: string
          code?: string
          reward_id?: string | null
          is_redeemed?: boolean
          redeemed_by?: string | null
          redeemed_at?: string | null
          expires_at?: string | null
          created_at?: string
          is_unlimited_use?: boolean
          user_redemptions?: string[] | null
          points_value?: number | null
          item_details?: Json | null
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          description: string | null
          points: number
          type: 'EARN' | 'REDEEM'
          created_at: string
          reward_code: string | null
          reward_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          description?: string | null
          points: number
          type: 'EARN' | 'REDEEM'
          created_at?: string
          reward_code?: string | null
          reward_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          description?: string | null
          points?: number
          type?: 'EARN' | 'REDEEM'
          created_at?: string
          reward_code?: string | null
          reward_id?: string | null
        }
      }
      points_multipliers: {
        Row: {
          id: string
          multiplier: number
          start_date: string
          end_date: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          multiplier: number
          start_date: string
          end_date: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          multiplier?: number
          start_date?: string
          end_date?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      // Add reference to existing profiles table if you have one
      profiles: {
        Row: {
          id: string
          points: number
          membership_level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
          updated_at: string | null
        }
        Insert: {
          id: string
          points?: number
          membership_level?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
          updated_at?: string | null
        }
        Update: {
          id?: string
          points?: number
          membership_level?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 