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
      profiles: {
        Row: {
          id: string
          email: string
          points: number
          membership_level: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          points?: number
          membership_level?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          points?: number
          membership_level?: string
          created_at?: string
          updated_at?: string
        }
      }
      points_history: {
        Row: {
          id: string
          profile_id: string
          points: number
          type: 'earned' | 'redeemed'
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          points: number
          type: 'earned' | 'redeemed'
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          points?: number
          type?: 'earned' | 'redeemed'
          description?: string
          created_at?: string
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
      tiers: {
        Row: {
          id: string
          name: string
          level: number
          points_threshold: number
          benefits: {
            point_multiplier: number
            discount_percentage: number
            free_shipping: boolean
            priority_support: boolean
            early_access: boolean
            exclusive_events: boolean
            birthday_bonus: number
            referral_bonus: number
            custom_benefits: string[]
          }
          progression_requirements: {
            min_purchase_count: number
            min_total_spent: number
            min_days_active: number
            additional_requirements: string[]
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          level: number
          points_threshold: number
          benefits: {
            point_multiplier: number
            discount_percentage: number
            free_shipping: boolean
            priority_support: boolean
            early_access: boolean
            exclusive_events: boolean
            birthday_bonus: number
            referral_bonus: number
            custom_benefits: string[]
          }
          progression_requirements: {
            min_purchase_count: number
            min_total_spent: number
            min_days_active: number
            additional_requirements: string[]
          }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          level?: number
          points_threshold?: number
          benefits?: {
            point_multiplier?: number
            discount_percentage?: number
            free_shipping?: boolean
            priority_support?: boolean
            early_access?: boolean
            exclusive_events?: boolean
            birthday_bonus?: number
            referral_bonus?: number
            custom_benefits?: string[]
          }
          progression_requirements?: {
            min_purchase_count?: number
            min_total_spent?: number
            min_days_active?: number
            additional_requirements?: string[]
          }
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

export type Profile = Database['public']['Tables']['profiles']['Row']
export type PointsHistory = Database['public']['Tables']['points_history']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type Reward = Database['public']['Tables']['rewards']['Row']
export type Tier = Database['public']['Tables']['tiers']['Row']
export type TierHistory = Database['public']['Tables']['tier_history']['Row']
