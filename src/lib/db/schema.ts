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
      points_multipliers: {
        Row: {
          id: string
          multiplier: number
          start_date: string
          end_date: string
          description: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          multiplier: number
          start_date: string
          end_date: string
          description: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          multiplier?: number
          start_date?: string
          end_date?: string
          description?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      points_multiplier_rules: {
        Row: {
          id: string
          multiplier: number
          rule_name: string
          product_category: string[]
          minimum_purchase: number
          is_active: boolean
          start_date: string
          end_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          multiplier: number
          rule_name: string
          product_category: string[]
          minimum_purchase: number
          is_active?: boolean
          start_date: string
          end_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          multiplier?: number
          rule_name?: string
          product_category?: string[]
          minimum_purchase?: number
          is_active?: boolean
          start_date?: string
          end_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      tiers: {
        Row: {
          id: string
          tier_id: string
          name: string
          level: number
          points_threshold: number
          benefits: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tier_id: string
          name: string
          level: number
          points_threshold: number
          benefits?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tier_id?: string
          name?: string
          level?: number
          points_threshold?: number
          benefits?: Json
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          current_tier_id: string
          points: number
          created_at: string
          updated_at: string
        }
      }
      points_history: {
        Row: {
          id: string
          user_id: string
          points_earned: number
          created_at: string
        }
      }
      orders: {
        Row: {
          id: string
          profile_id: string
          total: number
          points_earned: number
          points_redeemed: number
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          total: number
          points_earned?: number
          points_redeemed?: number
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          total?: number
          points_earned?: number
          points_redeemed?: number
          created_at?: string
        }
      }
      rewards: {
        Row: {
          id: string
          name: string
          description: string
          points_cost: number
          available_for_tiers: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          description: string
          points_cost: number
          available_for_tiers: string[]
          is_active: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          points_cost?: number
          available_for_tiers?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tier_history: {
        Row: {
          id: string
          profile_id: string
          from_tier: string
          to_tier: string
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          from_tier: string
          to_tier: string
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          from_tier?: string
          to_tier?: string
          reason?: string
          created_at?: string
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

export type PointsMultiplier = Database['public']['Tables']['points_multipliers']['Row']
export type PointsMultiplierRule = Database['public']['Tables']['points_multiplier_rules']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type PointsHistory = Database['public']['Tables']['points_history']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type Reward = Database['public']['Tables']['rewards']['Row']
export type Tier = Database['public']['Tables']['tiers']['Row']
export type TierHistory = Database['public']['Tables']['tier_history']['Row']
