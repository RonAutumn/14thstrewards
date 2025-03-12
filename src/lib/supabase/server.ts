import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type Database } from '@/types/supabase'
import { env } from '@/env.mjs'
import type { Product as AppProduct } from '@/types/product'
import { type CookieStore } from 'next/dist/compiled/@edge-runtime/cookies'

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase environment variables')
}

export async function createServerSupabaseClient() {
  const cookieStore = cookies()

  // Use service role key for server operations if available
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie errors
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options })
          } catch (error) {
            // Handle cookie errors
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
}

// Create a Supabase admin client with the service role key
export function createAdminClient() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY
  
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    cookies: {
      get(name: string) {
        return undefined // No cookies for admin client
      },
      set(name: string, value: string, options: any) {
        // No-op for admin client
      },
      remove(name: string, options: any) {
        // No-op for admin client
      },
    },
  })
}

// This interface represents how the data is stored in Supabase
export interface SupabaseProduct {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category: string[]
  category_names: string[]
  image_url: string
  weight_size: string | number
  is_active: boolean
  status: string
  variations?: Array<{
    name: string
    price: number
    stock: number
    isActive: boolean
  }>
  created_at?: string
  updated_at?: string
}

// This interface represents how categories are stored in Supabase
export interface SupabaseCategory {
  id: string
  name: string
  description: string
  display_order: number
  is_active: boolean
  products: string[]
  created_at?: string
  updated_at?: string
}

export async function getProducts(): Promise<AppProduct[]> {
  try {
    // Create a client for this request
    const cookieStore = cookies()
    const supabase = await createServerSupabaseClient()
    
    // Fetch products and their variations
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        variations:product_variations(*)
      `)
      .eq('is_active', true)
      .order('name')

    if (productsError) {
      console.error('Error fetching products:', productsError)
      throw productsError
    }

    if (!products) {
      return []
    }

    // Transform Supabase products to match the application's Product interface
    return products.map((product: SupabaseProduct & { variations: any[] }): AppProduct => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price || 0,
      stock: product.stock || 0,
      category: product.category || [],
      categoryNames: product.category_names || [],
      imageUrl: product.image_url || '/images/placeholder.jpg',
      weightSize: product.weight_size || '',
      isActive: product.is_active,
      status: product.status || 'inactive',
      variations: product.variations.map(v => ({
        name: v.name,
        price: v.price || 0,
        stock: v.stock || 0,
        isActive: v.is_active
      }))
    }))
  } catch (error) {
    console.error('Error in getProducts:', error)
    throw error
  }
}

export async function getCategories() {
  try {
    // Create a client for this request
    const cookieStore = cookies()
    const supabase = await createServerSupabaseClient()
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      throw error
    }

    if (!categories) {
      return []
    }

    // Transform Supabase categories to match the application's Category interface
    return categories.map((category: SupabaseCategory) => ({
      id: category.id,
      name: category.name,
      description: category.description || '',
      displayOrder: category.display_order || 0,
      isActive: category.is_active,
      products: category.products || [],
      slug: category.name.toLowerCase().replace(/\s+/g, '-')
    }))
  } catch (error) {
    console.error('Error in getCategories:', error)
    throw error
  }
} 